import { describe, expect, it } from 'vitest';
import { isSupportedImageFile } from '../exerciseImageUpload.ts';

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
});
