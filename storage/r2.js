import { PutObjectCommand, GetObjectCommand  } from '@aws-sdk/client-s3';
import { s3Client } from '../config/r2.js';

export async function saveFile(buffer, filename, mimetype) {
  await s3Client.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: filename,
    Body: buffer,
    ContentType: mimetype,
  }));
}

export async function getFile(filename) {
  const response = await s3Client.send(new GetObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: filename,
  }));

  const chunks = [];
  for await (const chunk of response.Body) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

export function getUrl(filename) {
  return `${process.env.R2_PUBLIC_URL}/${filename}`;
}