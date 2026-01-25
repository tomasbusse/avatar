/**
 * Cloudflare R2 Utility Module
 * S3-compatible client for storing video recordings and processed outputs
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// R2 Configuration from environment variables
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "beethoven-recordings";
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL; // Optional: for public access

// Create S3 client configured for R2
function getR2Client(): S3Client {
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    throw new Error(
      "R2 configuration missing. Please set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY environment variables."
    );
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });
}

export interface UploadOptions {
  contentType?: string;
  metadata?: Record<string, string>;
  cacheControl?: string;
}

export interface UploadResult {
  key: string;
  url: string;
  publicUrl?: string;
  size: number;
}

/**
 * Upload a file to R2
 * @param key - The object key (path in the bucket)
 * @param body - File content (Buffer, ReadableStream, or string)
 * @param options - Upload options (content type, metadata, etc.)
 */
export async function uploadFile(
  key: string,
  body: Buffer | ReadableStream | string,
  options: UploadOptions = {}
): Promise<UploadResult> {
  const client = getR2Client();

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    Body: body,
    ContentType: options.contentType || "application/octet-stream",
    Metadata: options.metadata,
    CacheControl: options.cacheControl,
  });

  await client.send(command);

  // Calculate size
  let size = 0;
  if (Buffer.isBuffer(body)) {
    size = body.length;
  } else if (typeof body === "string") {
    size = Buffer.byteLength(body);
  }

  // Generate URLs
  const signedUrl = await getSignedDownloadUrl(key, 3600); // 1 hour expiry
  const publicUrl = R2_PUBLIC_URL ? `${R2_PUBLIC_URL}/${key}` : undefined;

  return {
    key,
    url: signedUrl,
    publicUrl,
    size,
  };
}

/**
 * Upload a file from a URL (fetch and store in R2)
 * @param key - The object key
 * @param sourceUrl - URL to fetch the file from
 * @param options - Upload options
 */
export async function uploadFromUrl(
  key: string,
  sourceUrl: string,
  options: UploadOptions = {}
): Promise<UploadResult> {
  const response = await fetch(sourceUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch from URL: ${response.status} ${response.statusText}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const contentType = options.contentType || response.headers.get("content-type") || "application/octet-stream";

  return uploadFile(key, buffer, { ...options, contentType });
}

/**
 * Get a signed URL for downloading a file
 * @param key - The object key
 * @param expiresIn - URL expiration time in seconds (default: 3600 = 1 hour)
 */
export async function getSignedDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
  const client = getR2Client();

  const command = new GetObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  });

  return getSignedUrl(client, command, { expiresIn });
}

/**
 * Get a signed URL for uploading a file
 * @param key - The object key
 * @param contentType - Content type of the file to upload
 * @param expiresIn - URL expiration time in seconds (default: 3600 = 1 hour)
 */
export async function getSignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 3600
): Promise<string> {
  const client = getR2Client();

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(client, command, { expiresIn });
}

/**
 * Delete a file from R2
 * @param key - The object key to delete
 */
export async function deleteFile(key: string): Promise<void> {
  const client = getR2Client();

  const command = new DeleteObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  });

  await client.send(command);
}

/**
 * Check if a file exists in R2
 * @param key - The object key to check
 */
export async function fileExists(key: string): Promise<boolean> {
  const client = getR2Client();

  try {
    const command = new HeadObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    });
    await client.send(command);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get file metadata (size, content type, etc.)
 * @param key - The object key
 */
export async function getFileMetadata(key: string): Promise<{
  size: number;
  contentType: string;
  lastModified: Date;
  metadata: Record<string, string>;
} | null> {
  const client = getR2Client();

  try {
    const command = new HeadObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    });
    const response = await client.send(command);

    return {
      size: response.ContentLength || 0,
      contentType: response.ContentType || "application/octet-stream",
      lastModified: response.LastModified || new Date(),
      metadata: response.Metadata || {},
    };
  } catch {
    return null;
  }
}

/**
 * List files in R2 with optional prefix
 * @param prefix - Optional prefix to filter files
 * @param maxKeys - Maximum number of keys to return (default: 1000)
 */
export async function listFiles(
  prefix?: string,
  maxKeys = 1000
): Promise<Array<{
  key: string;
  size: number;
  lastModified: Date;
}>> {
  const client = getR2Client();

  const command = new ListObjectsV2Command({
    Bucket: R2_BUCKET_NAME,
    Prefix: prefix,
    MaxKeys: maxKeys,
  });

  const response = await client.send(command);

  return (response.Contents || []).map((item) => ({
    key: item.Key || "",
    size: item.Size || 0,
    lastModified: item.LastModified || new Date(),
  }));
}

/**
 * Generate a unique key for video recordings
 * @param videoCreationId - The video creation record ID
 * @param type - Type of recording (raw or final)
 * @param extension - File extension (default: mp4)
 */
export function generateVideoKey(
  videoCreationId: string,
  type: "raw" | "final" | "thumbnail",
  extension = "mp4"
): string {
  const timestamp = Date.now();
  const folder = type === "raw" ? "recordings" : type === "final" ? "processed" : "thumbnails";
  return `videos/${folder}/${videoCreationId}/${timestamp}.${extension}`;
}

/**
 * Get public URL for a file (if R2_PUBLIC_URL is configured)
 * @param key - The object key
 */
export function getPublicUrl(key: string): string | null {
  return R2_PUBLIC_URL ? `${R2_PUBLIC_URL}/${key}` : null;
}
