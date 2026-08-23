#!/usr/bin/env python3
"""
Rebuild apps/desktop/build/icon.ico from the icon-N.png sources.

ICO BMP entries store pixel rows BOTTOM-UP (first stored row = image bottom,
BITMAPINFOHEADER.biHeight = 2x real height). Getting this wrong renders the
icon upside down in Explorer/taskbar — which bit us once. This script writes
the rows correctly AND self-verifies every entry by decoding it back and
byte-comparing against the source PNG before writing anything.

Usage:  python scripts/build-icon-ico.py
"""
import struct
import sys
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BUILD = ROOT / "apps" / "desktop" / "build"
SIZES = [256, 128, 64, 48, 32, 16]  # every size must have icon-N.png


def decode_png_rgba(path: Path) -> list[bytes]:
    """Decode an 8-bit RGBA (or RGB/LA/L/grayscale) PNG to per-row RGBA bytes."""
    data = path.read_bytes()
    pos, idat, w, h, ct = 8, b"", None, None, None
    while pos < len(data):
        ln = struct.unpack_from(">I", data, pos)[0]
        typ = data[pos + 4 : pos + 8]
        if typ == b"IHDR":
            w, h, bd, ct = struct.unpack_from(">IIBB", data, pos + 8)
            if bd != 8:
                raise ValueError(f"{path.name}: expected 8-bit depth, got {bd}")
        elif typ == b"IDAT":
            idat += data[pos + 8 : pos + 8 + ln]
        pos += 12 + ln
    channels = {0: 1, 2: 3, 4: 2, 6: 4}[ct]
    stride = w * channels
    raw = zlib.decompress(idat)

    def paeth(a, b, c):
        p = a + b - c
        pa, pb, pc = abs(p - a), abs(p - b), abs(p - c)
        return a if (pa <= pb and pa <= pc) else (b if pb <= pc else c)

    rows: list[list[int]] = []
    prev = bytearray(stride)
    for y in range(h):
        f0 = raw[y * (stride + 1)]
        line = bytearray(raw[y * (stride + 1) + 1 : (y + 1) * (stride + 1)])
        if f0 == 1:
            for x in range(channels, stride):
                line[x] = (line[x] + line[x - channels]) & 255
        elif f0 == 2:
            for x in range(stride):
                line[x] = (line[x] + prev[x]) & 255
        elif f0 == 3:
            for x in range(stride):
                a = line[x - channels] if x >= channels else 0
                line[x] = (line[x] + ((a + prev[x]) >> 1)) & 255
        elif f0 == 4:
            for x in range(stride):
                a = line[x - channels] if x >= channels else 0
                line[x] = (line[x] + paeth(a, prev[x], prev[x - channels] if x >= channels else 0)) & 255
        rows.append(list(line))
        prev = line

    out: list[bytes] = []
    for row in rows:
        rgba = bytearray(w * 4)
        for x in range(w):
            px = row[x * channels : (x + 1) * channels]
            r, g, b, a = (
                [px[0], px[0], px[0], 255] if ct == 0
                else [px[0], px[1], px[2], 255] if ct == 2
                else [px[0], px[0], px[0], px[1]] if ct == 4
                else px  # ct == 6: already RGBA
            )
            rgba[x * 4 : x * 4 + 4] = bytes((r, g, b, a))
        out.append(bytes(rgba))
    return out


def encode_entry(rows_top_down: list[bytes]) -> bytes:
    """Encode RGBA rows into a bottom-up DIB (BITMAPINFOHEADER + pixels + empty AND mask)."""
    h = len(rows_top_down)
    w = len(rows_top_down[0]) // 4
    header = struct.pack(
        "<IiiHHIIiiII",
        40,          # biSize
        w,           # biWidth
        h * 2,       # biHeight (XOR + AND masks — the classic gotcha)
        1,           # biPlanes
        32,          # biBitCount
        0,           # biCompression (BI_RGB)
        0,           # biSizeImage
        0, 0,        # biXPelsPerMeter, biYPelsPerMeter
        0, 0,        # biClrUsed, biClrImportant
    )
    # Bottom-up: first stored row is the image's BOTTOM row. BGRA byte order.
    pixels = bytearray()
    for row in reversed(rows_top_down):
        bgra = bytearray(len(row))
        for x in range(w):
            r, g, b, a = row[x * 4 : x * 4 + 4]
            bgra[x * 4 : x * 4 + 4] = bytes((b, g, r, a))
        pixels += bgra
    and_mask = b"\x00" * (((w + 31) // 32) * 4 * h)  # alpha channel does the masking
    return header + bytes(pixels) + and_mask


def verify(entry: bytes, source_rows: list[bytes]) -> None:
    """Decode the entry back using the standard bottom-up rule and byte-compare."""
    h = len(source_rows)
    w = len(source_rows[0]) // 4
    pixels = entry[40 : 40 + w * 4 * h]
    decoded = []
    for y in range(h):  # image row y lives at stored row (h-1-y)
        off = (h - 1 - y) * w * 4
        row = bytearray(source_rows[y])
        for x in range(w):
            b_, g_, r_, a_ = pixels[off + x * 4 : off + x * 4 + 4]
            row[x * 4 : x * 4 + 4] = bytes((r_, g_, b_, a_))
        decoded.append(bytes(row))
    for y in range(h):
        if decoded[y] != source_rows[y]:
            raise AssertionError(f"{w}x{h}: row {y} mismatches after round-trip — aborting")


def main() -> int:
    entries: list[tuple[int, int, int, list[bytes]]] = []  # (w, h, offset placeholder, encoded)
    for size in SIZES:
        src = BUILD / f"icon-{size}.png"
        if not src.exists():
            print(f"warning: {src.name} missing, skipping {size}px entry")
            continue
        rows = decode_png_rgba(src)
        if len(rows) != size or len(rows[0]) != size * 4:
            raise ValueError(f"{src.name} is not {size}x{size}")
        encoded = encode_entry(rows)
        verify(encoded, rows)  # raises if orientation would be wrong
        entries.append((size, size, 0, encoded))
        print(f"  {size}x{size}: OK ({len(encoded)} bytes, verified)")

    header_size = 6 + 16 * len(entries)
    blob = bytearray()
    blob += struct.pack("<HHH", 0, 1, len(entries))
    offset = header_size
    for w, h, _, payload in entries:
        blob += struct.pack("<BBBBHHII", w % 256, h % 256, 0, 0, 1, 32, len(payload), offset)
        offset += len(payload)
    for _, _, _, payload in entries:
        blob += payload

    out = BUILD / "icon.ico"
    out.write_bytes(blob)
    print(f"wrote {out} ({len(blob)} bytes, {len(entries)} entries, all verified)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
