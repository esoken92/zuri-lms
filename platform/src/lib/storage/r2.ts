import "server-only";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * Cloudflare R2 client (S3-compatible). All binary uploads (POD photos,
 * signatures, inspection images) live here - zero egress fees.
 * Objects are keyed by org for per-tenant storage metering:
 *   {orgId}/{module}/{uuid}-{filename}
 */
function r2(): S3Client {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error("Missing R2 credentials (R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY)");
  }
  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

const BUCKET = () => process.env.R2_BUCKET || "zuri-uploads";

export function buildObjectKey(orgId: string, module: string, filename: string): string {
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${orgId}/${module}/${crypto.randomUUID()}-${safe}`;
}

/** Presigned PUT URL the browser uploads to directly. */
export async function getUploadUrl(key: string, contentType: string, expiresIn = 600) {
  const cmd = new PutObjectCommand({ Bucket: BUCKET(), Key: key, ContentType: contentType });
  return getSignedUrl(r2(), cmd, { expiresIn });
}

/** Public CDN URL for serving the object. */
export function getPublicUrl(key: string): string {
  const base = process.env.R2_PUBLIC_BASE_URL;
  if (!base) throw new Error("Missing R2_PUBLIC_BASE_URL");
  return `${base.replace(/\/$/, "")}/${key}`;
}

export async function deleteObject(key: string) {
  await r2().send(new DeleteObjectCommand({ Bucket: BUCKET(), Key: key }));
}
