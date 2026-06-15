import { PutObjectCommand } from '@aws-sdk/client-s3';
import { s3Client } from '../config/r2.js';

export async function saveFile(buffer, filename, mimetype) {
  await s3Client.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: filename,
    Body: buffer,
    ContentType: mimetype,
  }));
}

export function getUrl(filename) {
  return `${process.env.R2_PUBLIC_URL}/${filename}`;
}