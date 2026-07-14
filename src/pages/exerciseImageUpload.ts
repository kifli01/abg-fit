export const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

export interface UploadedExerciseImageAssets {
  originalUrl: string;
  originalPath: string;
  thumbnailUrl: string;
  thumbnailPath: string;
}

export interface PersistedExerciseImageData {
  url: string | null;
  path: string | null;
  updatedAt: string | null;
  thumbUrl: string | null;
  thumbPath: string | null;
}

export function isSupportedImageFile(file: Pick<File, 'name' | 'type'>): boolean {
  if (!file || typeof file.type !== 'string') {
    return false;
  }

  return SUPPORTED_IMAGE_TYPES.includes(file.type as (typeof SUPPORTED_IMAGE_TYPES)[number]);
}

function createImageBitmapFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to decode image.'));
    };

    image.src = url;
  });
}

export async function processExerciseImage(file: File): Promise<{
  original: File;
  thumbnail: Blob;
}> {
  if (!isSupportedImageFile(file)) {
    throw new Error('Unsupported image type. Please choose a JPG, PNG, or WebP file.');
  }

  const image = await createImageBitmapFromFile(file);
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Unable to process image in this browser.');
  }

  const size = 128;
  const sourceWidth = image.naturalWidth;
  const sourceHeight = image.naturalHeight;
  const sourceRatio = sourceWidth / sourceHeight;

  let drawWidth = size;
  let drawHeight = size;
  let offsetX = 0;
  let offsetY = 0;

  if (sourceRatio > 1) {
    drawHeight = Math.round(size / sourceRatio);
    offsetY = Math.round((size - drawHeight) / 2);
  } else if (sourceRatio < 1) {
    drawWidth = Math.round(size * sourceRatio);
    offsetX = Math.round((size - drawWidth) / 2);
  }

  canvas.width = size;
  canvas.height = size;
  context.clearRect(0, 0, size, size);
  context.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);

  const thumbnailBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Failed to create thumbnail.'));
      }
    }, 'image/webp');
  });

  return {
    original: file,
    thumbnail: thumbnailBlob,
  };
}

export async function uploadExerciseImageAssets(
  original: File,
  thumbnail: Blob
): Promise<UploadedExerciseImageAssets> {
  const originalName = original.name || 'exercise-original';
  const thumbnailName = `${originalName.replace(/\.[^.]+$/, '')}-thumb.webp`;

  const uploadOriginal = fetch('/api/upload', {
    method: 'POST',
    headers: { 'Content-Type': original.type || 'application/octet-stream' },
    body: original,
  });

  const uploadThumbnail = fetch('/api/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'image/webp' },
    body: thumbnail,
  });

  const [originalResponse, thumbnailResponse] = await Promise.all([uploadOriginal, uploadThumbnail]);

  if (!originalResponse.ok || !thumbnailResponse.ok) {
    throw new Error('Failed to upload image assets.');
  }

  const originalResult = await originalResponse.json();
  const thumbnailResult = await thumbnailResponse.json();

  return {
    originalUrl: originalResult.url ?? originalResult.href ?? '',
    originalPath: originalResult.pathname ?? originalName,
    thumbnailUrl: thumbnailResult.url ?? thumbnailResult.href ?? '',
    thumbnailPath: thumbnailResult.pathname ?? thumbnailName,
  };
}

export function buildExerciseImageMetadata(
  uploaded: UploadedExerciseImageAssets
): PersistedExerciseImageData {
  return {
    url: uploaded.originalUrl || null,
    path: uploaded.originalPath || null,
    updatedAt: new Date().toISOString(),
    thumbUrl: uploaded.thumbnailUrl || null,
    thumbPath: uploaded.thumbnailPath || null,
  };
}
