import { API_BASE_URL } from '../../src/config/api';

// Mock SecureStore
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

import * as SecureStore from 'expo-secure-store';
import { login, saveToken, getToken, removeToken, logout } from '../../src/services/authService';

// Mock fetch
global.fetch = jest.fn();

describe('authService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('saveToken', () => {
    it('should store token in SecureStore', async () => {
      await saveToken('test-token');
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('jwt_token', 'test-token');
    });
  });

  describe('getToken', () => {
    it('should retrieve token from SecureStore', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('stored-token');
      const token = await getToken();
      expect(token).toBe('stored-token');
    });

    it('should return null if no token stored', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
      const token = await getToken();
      expect(token).toBeNull();
    });
  });

  describe('removeToken', () => {
    it('should delete token from SecureStore', async () => {
      await removeToken();
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('jwt_token');
    });
  });

  describe('logout', () => {
    it('should remove the token', async () => {
      await logout();
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('jwt_token');
    });
  });

  describe('login', () => {
    it('should call API and store token on success', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ token: 'jwt-abc123' }),
      });

      const token = await login({ email: 'test@test.fr', password: 'password' });

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/api/login`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ email: 'test@test.fr', password: 'password' }),
        })
      );
      expect(token).toBe('jwt-abc123');
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('jwt_token', 'jwt-abc123');
    });

    it('should throw error on invalid credentials', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({ message: 'Invalid credentials' }),
      });

      await expect(login({ email: 'bad@test.fr', password: 'wrong' }))
        .rejects.toThrow('Invalid credentials');
    });
  });
});
