import fs from "node:fs/promises";
import path from "node:path";

/** Download and cache remote assets locally. */
export class AssetDownloader {
  private cacheDir: string;

  constructor(cacheDir: string) {
    this.cacheDir = cacheDir;
  }

  /** Download a URL to a local file path, skipping if already cached. */
  async download(url: string, localPath: string): Promise<Buffer> {
    const fullPath = path.join(this.cacheDir, localPath);

    // Check cache
    try {
      const existing = await fs.readFile(fullPath);
      return existing;
    } catch {
      // Not cached, download
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Download failed: ${response.status} ${response.statusText}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    // Ensure directory exists
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, buffer);

    return buffer;
  }

  /** Check if an asset is already cached. */
  async isCached(localPath: string): Promise<boolean> {
    try {
      await fs.access(path.join(this.cacheDir, localPath));
      return true;
    } catch {
      return false;
    }
  }

  /** Get total cache size in bytes. */
  async getCacheSize(): Promise<number> {
    let total = 0;
    try {
      const files = await this.walkDir(this.cacheDir);
      for (const file of files) {
        const stat = await fs.stat(file);
        total += stat.size;
      }
    } catch {
      // Cache dir doesn't exist
    }
    return total;
  }

  /** Clear the entire cache. */
  async clearCache(): Promise<void> {
    await fs.rm(this.cacheDir, { recursive: true, force: true });
  }

  private async walkDir(dir: string): Promise<string[]> {
    const results: string[] = [];
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          results.push(...(await this.walkDir(fullPath)));
        } else {
          results.push(fullPath);
        }
      }
    } catch {
      // Ignore
    }
    return results;
  }
}
