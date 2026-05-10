import { API_BASE_URL, MEDIA_BASE_URL } from '../../src/config/api';

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn().mockResolvedValue(null),
  deleteItemAsync: jest.fn(),
}));

import { getResources, getCategories, getMediaUrl } from '../../src/services/resourceService';

global.fetch = jest.fn();

describe('resourceService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getResources', () => {
    it('should fetch public resources', async () => {
      const mockResources = [
        { id: 1, description: 'Test', type: 'photo', category: 'Photo' },
        { id: 2, description: 'Video', type: 'video', category: 'Video' },
      ];

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResources,
      });

      const result = await getResources({});

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/public/resources'),
        expect.any(Object)
      );
      expect(result).toEqual(mockResources);
    });

    it('should pass search filters as query params', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => [],
      });

      await getResources({ search: 'nature', category: 2, sort: 'views' });

      const calledUrl = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(calledUrl).toContain('search=nature');
      expect(calledUrl).toContain('category=2');
      expect(calledUrl).toContain('sort=views');
    });

    it('should throw on network error', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
      });

      await expect(getResources({})).rejects.toThrow();
    });
  });

  describe('getCategories', () => {
    it('should parse hydra:member format', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          'hydra:member': [
            { id: 1, name: 'Video' },
            { id: 2, name: 'Photo' },
          ],
        }),
      });

      const result = await getCategories();
      expect(result).toEqual([
        { id: 1, name: 'Video' },
        { id: 2, name: 'Photo' },
      ]);
    });

    it('should parse member format (JSON-LD)', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          member: [
            { id: 1, name: 'Video', '@id': '/api/categories/1' },
            { id: 2, name: 'Photo', '@id': '/api/categories/2' },
          ],
        }),
      });

      const result = await getCategories();
      expect(result).toEqual([
        { id: 1, name: 'Video' },
        { id: 2, name: 'Photo' },
      ]);
    });

    it('should return empty array on error', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      const result = await getCategories();
      expect(result).toEqual([]);
    });
  });

  describe('getMediaUrl', () => {
    it('should return correct URL for photos', () => {
      const url = getMediaUrl('media_123.jpg', 'photo');
      expect(url).toBe(`${MEDIA_BASE_URL}/images/media_123.jpg`);
    });

    it('should return correct URL for videos', () => {
      const url = getMediaUrl('media_456.mp4', 'video');
      expect(url).toBe(`${MEDIA_BASE_URL}/videos/media_456.mp4`);
    });
  });
});
