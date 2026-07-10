/**
 * Vercel Serverless Function: POST /api/upload-exercise-image
 *
 * Accepts a multipart/form-data request with:
 *   - file: the image file
 *   - exerciseId: the target exercise document ID
 *
 * Workflow:
 *   1. Validate file type (jpeg, png, webp only)
 *   2. Upload the original file to Vercel Blob
 *   3. Generate a 128x128 center-cropped JPEG thumbnail using Canvas API
 *   4. Upload the thumbnail to Vercel Blob
 *   5. Return both URLs and paths
 *
 * The client is responsible for persisting image metadata to Firestore.
 *
 * Blob store: abg-fit-blob (connected via BLOB_READ_WRITE_TOKEN env var,
 * which Vercel injects automatically when the store is linked to the project).
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { put } from '@vercel/blob';
import { IncomingForm, type File as FormidableFile } from 'formidable';
import fs from 'fs';
import path from 'path';
import { createCanvas, loadImage } from 'canvas';

export const config = { api: { bodyParser: false } };

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const THUMB_SIZE = 128;

function parseForm(
  req: VercelRequest
): Promise<{ fields: Record<string, string>; file: FormidableFile }> {
  return new Promise((resolve, reject) => {
    const form = new IncomingForm({ keepExtensions: true, maxFileSize: 10 * 1024 * 1024 });
    form.parse(req as never, (err, fields, files) => {
      if (err) return reject(err);
      const raw = files.file;
      const file = Array.isArray(raw) ? raw[0] : raw;
      if (!file) return reject(new Error('No file uploaded'));
      const flatFields: Record<string, string> = {};
      for (const [k, v] of Object.entries(fields)) {
        flatFields[k] = Array.isArray(v) ? v[0] : (v ?? '');
      }
      resolve({ fields: flatFields, file });
    });
  });
}

async function generateThumbnail(filePath: string, mimeType: string): Promise<Buffer> {
  const img = await loadImage(filePath);
  const { width, height } = img;

  // Center-crop to square, then scale to THUMB_SIZE.
  const side = Math.min(width, height);
  const sx = (width - side) / 2;
  const sy = (height - side) / 2;

  // Do not upscale: if the source is smaller than THUMB_SIZE, use source size.
  const outSize = Math.min(side, THUMB_SIZE);

  const canvas = createCanvas(outSize, outSize);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, sx, sy, side, side, 0, 0, outSize, outSize);

  const format = mimeType === 'image/png' ? 'png' : 'jpeg';
  return format === 'png'
    ? canvas.toBuffer('image/png')
    : canvas.toBuffer('image/jpeg', { quality: 0.88 });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let file: FormidableFile | undefined;
  try {
    const parsed = await parseForm(req);
    file = parsed.file;
    const { exerciseId } = parsed.fields;

    if (!exerciseId) {
      return res.status(400).json({ error: 'exerciseId is required' });
    }

    const mimeType = file.mimetype ?? '';
    if (!ALLOWED_TYPES.includes(mimeType)) {
      return res.status(400).json({ error: 'Only jpeg, png, and webp images are allowed' });
    }

    const ext = path.extname(file.originalFilename ?? file.newFilename ?? '.jpg');
    const timestamp = Date.now();
    const originalBlobPath = `exercises/${exerciseId}/original-${timestamp}${ext}`;
    const thumbExt = mimeType === 'image/png' ? '.png' : '.jpg';
    const thumbBlobPath = `exercises/${exerciseId}/thumb-${timestamp}${thumbExt}`;

    // Upload original file.
    const originalBuffer = fs.readFileSync(file.filepath);
    const originalBlob = await put(originalBlobPath, originalBuffer, {
      access: 'public',
      contentType: mimeType,
    });

    // Generate and upload thumbnail.
    const thumbBuffer = await generateThumbnail(file.filepath, mimeType);
    const thumbMime = mimeType === 'image/png' ? 'image/png' : 'image/jpeg';
    const thumbBlob = await put(thumbBlobPath, thumbBuffer, {
      access: 'public',
      contentType: thumbMime,
    });

    return res.status(200).json({
      imageUrl: originalBlob.url,
      imagePath: originalBlobPath,
      imageThumbUrl: thumbBlob.url,
      imageThumbPath: thumbBlobPath,
      imageUpdatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('upload-exercise-image error:', err);
    return res.status(500).json({ error: 'Upload failed. Please try again.' });
  } finally {
    // Clean up temp file.
    if (file?.filepath) {
      fs.unlink(file.filepath, () => undefined);
    }
  }
}
