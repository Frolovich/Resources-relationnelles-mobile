import { API_BASE_URL } from '../../src/config/api';

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn().mockResolvedValue('fake-token'),
  deleteItemAsync: jest.fn(),
}));

import { getFavorites, addFavorite, removeFavorite } from '../../src/services/favoriteService';

global.fetch = jest.fn();

describe('favoriteService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getFavorites', () => {
    it('should fetch user favorites with auth header', async () => {
      const mockFavorites = [
        { id: 1, resourceId: 10, title: 'Test', type: 'photo', status: 'approved', createdAt: '2026-01-01' },
      ];

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockFavorites,
      });

      const result = await getFavorites();

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/api/favorites`,
        expect.objectContaining({
          headers: { Authorization: 'Bearer fake-token' },
        })
      );
      expect(result).toEqual(mockFavorites);
    });
  });

  describe('addFavorite', () => {
    it('should POST to favorites endpoint', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

      await addFavorite(5);

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/api/favorites/5`,
        expect.objectContaining({
          method: 'POST',
          headers: { Authorization: 'Bearer fake-token' },
        })
      );
    });

    it('should throw on error', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Already in favorites.' }),
      });

      await expect(addFavorite(5)).rejects.toThrow('Already in favorites.');
    });
  });

  describe('removeFavorite', () => {
    it('should DELETE from favorites endpoint', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

      await removeFavorite(5);

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/api/favorites/5`,
        expect.objectContaining({
          method: 'DELETE',
          headers: { Authorization: 'Bearer fake-token' },
        })
      );
    });
  });
});
