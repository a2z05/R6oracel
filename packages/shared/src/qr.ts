/**
 * QR code generation utility for mobile PWA connection.
 * Detects local network IPs and generates scannable QR codes.
 */

import QRCode from "qrcode";
import os from "node:os";

interface NetworkAddress {
  address: string;
  family: "IPv4" | "IPv6";
  internal: boolean;
}

export function getLocalIpAddresses(): NetworkAddress[] {
  const interfaces = os.networkInterfaces();
  const addresses: NetworkAddress[] = [];
  for (const name of Object.keys(interfaces)) {
    const nets = interfaces[name];
    if (!nets) continue;
    for (const net of nets) {
      if (net.family === "IPv4" && !net.internal) {
        addresses.push({ address: net.address, family: net.family, internal: net.internal });
      }
    }
  }
  return addresses;
}

export function getBestLocalIp(): string | null {
  const addresses = getLocalIpAddresses();
  if (addresses.length === 0) return null;
  const lan = addresses.find((a) => a.address.startsWith("192.168."));
  if (lan) return lan.address;
  const privateA = addresses.find((a) => a.address.startsWith("10."));
  if (privateA) return privateA.address;
  const privateB = addresses.find((a) => {
    const second = parseInt(a.address.split(".")[1] ?? "0", 10);
    return a.address.startsWith("172.") && second >= 16 && second <= 31;
  });
  if (privateB) return privateB.address;
  return addresses[0]?.address ?? null;
}

export function buildConnectionUrl(ip: string, port: number): string {
  return `http://${ip}:${port}`;
}

export async function generateQrDataUrl(data: string): Promise<string> {
  return QRCode.toDataURL(data, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 256,
    color: { dark: "#f0b132", light: "#0a0a0a" },
  });
}

export async function generateQrSvg(data: string): Promise<string> {
  return QRCode.toString(data, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 2,
    width: 256,
    color: { dark: "#f0b132", light: "#0a0a0a" },
  });
}
