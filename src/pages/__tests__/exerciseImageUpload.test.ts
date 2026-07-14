import { describe, expect, it } from 'vitest';
import { buildThumbnailFileName, buildUploadRequestHeaders, isSupportedImageFile } from '../exerciseImageUpload.ts';

describe('exerciseImageUpload helpers', () => {
  it('accepts common supported image file types', () => {
    expect(isSupportedImageFile({ name: 'photo.jpg', type: 'image/jpeg' })).toBe(true);
    expect(isSupportedImageFile({ name: 'photo.png', type: 'image/png' })).toBe(true);
    expect(isSupportedImageFile({ name: 'photo.webp', type: 'image/webp' })).toBe(true);
  });

  it('rejects unsupported file types', () => {
    expect(isSupportedImageFile({ name: 'photo.gif', type: 'image/gif' })).toBe(false);
    expect(isSupportedImageFile({ name: 'notes.txt', type: 'text/plain' })).toBe(false);
  });

  it('builds upload headers with the original filename', () => {
    expect(buildUploadRequestHeaders('my-photo.jpg', 'image/jpeg')).toEqual({
      'Content-Type': 'image/jpeg',
      'x-file-name': 'my-photo.jpg',
    });
  });

  it('builds a PNG thumbnail filename from the original image name', () => {
    expect(buildThumbnailFileName('my-photo.png')).toBe('my-photo-thumb.png');
  });
});
