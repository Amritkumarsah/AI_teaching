import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { ENV } from '../../config/env';

export interface StorageResult {
  storagePath: string;
  size: number;
}

export interface IStorageProvider {
  saveFile(buffer: Buffer, originalFilename: string, mimeType: string): Promise<StorageResult>;
  getFileBuffer(storagePath: string): Promise<Buffer>;
  deleteFile(storagePath: string): Promise<void>;
  exists(storagePath: string): Promise<boolean>;
}

/**
 * Local Storage Provider:
 * Stores files securely on the local filesystem with collision-free UUID prefixes.
 * Protects against directory traversal attacks.
 */
export class LocalStorageProvider implements IStorageProvider {
  private baseDir: string;

  constructor(customDir?: string) {
    this.baseDir = customDir || path.resolve(ENV.UPLOAD_DIR, 'documents');
    this.ensureDirectoryExists(this.baseDir);
  }

  private ensureDirectoryExists(dir: string): void {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  private sanitizeFilename(filename: string): string {
    // Strip path traversal characters, slashes, null bytes, and non-printable control codes
    return filename
      .replace(/[\/\?<>\\:\*\|":]/g, '')
      .replace(/\.\./g, '')
      .replace(/[\x00-\x1f\x80-\x9f]/g, '')
      .trim();
  }

  async saveFile(buffer: Buffer, originalFilename: string, _mimeType: string): Promise<StorageResult> {
    const safeName = this.sanitizeFilename(originalFilename) || 'document.bin';
    const uniquePrefix = `${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
    const storageFilename = `${uniquePrefix}_${safeName}`;
    const fullPath = path.join(this.baseDir, storageFilename);

    // Prevent path traversal
    if (!fullPath.startsWith(this.baseDir)) {
      throw new Error('Path traversal attempt detected');
    }

    await fs.promises.writeFile(fullPath, buffer);
    return {
      storagePath: storageFilename, // relative key
      size: buffer.length,
    };
  }

  async getFileBuffer(storagePath: string): Promise<Buffer> {
    const fullPath = path.join(this.baseDir, path.basename(storagePath));
    if (!fs.existsSync(fullPath)) {
      throw new Error(`File not found at storage path: ${storagePath}`);
    }
    return fs.promises.readFile(fullPath);
  }

  async deleteFile(storagePath: string): Promise<void> {
    const fullPath = path.join(this.baseDir, path.basename(storagePath));
    if (fs.existsSync(fullPath)) {
      await fs.promises.unlink(fullPath);
    }
  }

  async exists(storagePath: string): Promise<boolean> {
    const fullPath = path.join(this.baseDir, path.basename(storagePath));
    return fs.existsSync(fullPath);
  }
}

// Singleton storage provider instance
let storageProviderInstance: IStorageProvider | null = null;

export function getStorageProvider(): IStorageProvider {
  if (!storageProviderInstance) {
    storageProviderInstance = new LocalStorageProvider();
  }
  return storageProviderInstance;
}
