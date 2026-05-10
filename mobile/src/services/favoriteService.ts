import { API_BASE_URL } from '../config/api';
import { getToken } from './authService';

export interface FavoriteItem {
  id: number;
  resourceId: number;
  title: string;
  type: string;
  status: string;
  createdAt: string;
}

// Get user's favorites
export async function getFavorites(): Promise<FavoriteItem[]> {
  const token = await getToken();
  if (!token) throw new Error('Non authentifié');

  const response = await fetch(`${API_BASE_URL}/api/favorites`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) throw new Error('Erreur lors du chargement des favoris');
  return response.json();
}

// Add to favorites
export async function addFavorite(resourceId: number): Promise<void> {
  const token = await getToken();
  if (!token) throw new Error('Non authentifié');

  const response = await fetch(`${API_BASE_URL}/api/favorites/${resourceId}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Erreur');
  }
}

// Remove from favorites
export async function removeFavorite(resourceId: number): Promise<void> {
  const token = await getToken();
  if (!token) throw new Error('Non authentifié');

  const response = await fetch(`${API_BASE_URL}/api/favorites/${resourceId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Erreur');
  }
}
