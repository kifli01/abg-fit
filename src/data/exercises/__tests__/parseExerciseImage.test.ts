import { describe, expect, it } from 'vitest';
import { parseExerciseImage } from '../firestore';

describe('parseExerciseImage', () => {
  describe('new nested format', () => {
    it('maps a fully-populated nested image object', () => {
      const doc = {
        image: {
          url: 'https://cdn.example.com/img.jpg',
          path: 'exercises/img.jpg',
          updatedAt: '2024-01-01T00:00:00.000Z',
          thumbUrl: 'https://cdn.example.com/img_thumb.jpg',
          thumbPath: 'exercises/img_thumb.jpg',
        },
      };
      expect(parseExerciseImage(doc)).toEqual({
        url: 'https://cdn.example.com/img.jpg',
        path: 'exercises/img.jpg',
        updatedAt: '2024-01-01T00:00:00.000Z',
        thumbUrl: 'https://cdn.example.com/img_thumb.jpg',
        thumbPath: 'exercises/img_thumb.jpg',
      });
    });

    it('returns null fields for missing nested sub-fields', () => {
      const doc = { image: { url: 'https://cdn.example.com/img.jpg' } };
      expect(parseExerciseImage(doc)).toEqual({
        url: 'https://cdn.example.com/img.jpg',
        path: null,
        updatedAt: null,
        thumbUrl: null,
        thumbPath: null,
      });
    });
  });

  describe('legacy flat format', () => {
    it('maps flat top-level image fields into the nested shape', () => {
      const doc = {
        imageUrl: 'https://cdn.example.com/img.jpg',
        imagePath: 'exercises/img.jpg',
        imageUpdatedAt: '2024-01-01T00:00:00.000Z',
        imageThumbUrl: 'https://cdn.example.com/img_thumb.jpg',
        imageThumbPath: 'exercises/img_thumb.jpg',
      };
      expect(parseExerciseImage(doc)).toEqual({
        url: 'https://cdn.example.com/img.jpg',
        path: 'exercises/img.jpg',
        updatedAt: '2024-01-01T00:00:00.000Z',
        thumbUrl: 'https://cdn.example.com/img_thumb.jpg',
        thumbPath: 'exercises/img_thumb.jpg',
      });
    });

    it('handles partial flat fields with null for the rest', () => {
      const doc = { imageUrl: 'https://cdn.example.com/img.jpg' };
      expect(parseExerciseImage(doc)).toEqual({
        url: 'https://cdn.example.com/img.jpg',
        path: null,
        updatedAt: null,
        thumbUrl: null,
        thumbPath: null,
      });
    });
  });

  describe('no image', () => {
    it('returns null when no image fields are present', () => {
      expect(parseExerciseImage({ name: 'Push Up' })).toBeNull();
    });

    it('returns null for an empty document', () => {
      expect(parseExerciseImage({})).toBeNull();
    });

    it('returns null when image field is explicitly null', () => {
      expect(parseExerciseImage({ image: null })).toBeNull();
    });
  });
});
