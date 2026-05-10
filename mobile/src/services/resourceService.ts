import { API_BASE_URL, MEDIA_BASE_URL } from '../config/api';
import { getToken } from './authService';

export interface Resource {
  id: number;
  description: string;
  content: string;
  type: 'video' | 'photo';
  category: string;
  categoryId: number;
  restreint: boolean;
  favori: number;
  popular: number;
  datePublication: string | null;
  author: string;
  views: number;
}

export interface ResourceDetail extends Resource {
  status: string;
  dateCreation: string;
  authorId: string;
  comments: CommentData[];
}

export interface CommentData {
  id: number;
  content: string;
  author: string;
  date: string;
}

export interface Category {
  id: number;
  name: string;
}

export interface ResourceFilters {
  search?: string;
  category?: number;
  type?: string;
  sort?: 'newest' | 'views';
}

// Get public resources list
export async function getResources(filters: ResourceFilters = {}): Promise<Resource[]> {
  const params = new URLSearchParams();
  if (filters.search) params.append('search', filters.search);
  if (filters.category) params.append('category', String(filters.category));
  if (filters.type) params.append('type', filters.type);
  if (filters.sort) params.append('sort', filters.sort);

  const token = await getToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${API_BASE_URL}/api/public/resources?${params}`, { headers });

  if (!response.ok) throw new Error('Erreur lors du chargement des ressources');
  return response.json();
}

// Get resource detail
export async function getResourceDetail(id: number): Promise<ResourceDetail> {
  const token = await getToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${API_BASE_URL}/api/public/resources/${id}`, { headers });

  if (!response.ok) {
    if (response.status === 401) throw new Error('Authentification requise');
    throw new Error('Ressource introuvable');
  }
  return response.json();
}

// Get categories
export async function getCategories(): Promise<Category[]> {
  const response = await fetch(`${API_BASE_URL}/api/categories`);
  if (!response.ok) throw new Error('Erreur lors du chargement des catégories');

  const data = await response.json();
  // API Platform returns JSON-LD format with "member" or "hydra:member"
  const members = data['hydra:member'] || data['member'] || data;
  if (Array.isArray(members)) {
    return members.map((item: any) => ({ id: item.id, name: item.name }));
  }
  return [];
}

// Upload resource
export async function uploadResource(
  file: { uri: string; name: string; type: string },
  description: string,
  categoryId: number,
  restreint: boolean = false
): Promise<any> {
  const token = await getToken();
  if (!token) throw new Error('Non authentifié');

  const formData = new FormData();
  formData.append('file', {
    uri: file.uri,
    name: file.name,
    type: file.type,
  } as any);
  formData.append('description', description);
  formData.append('category_id', String(categoryId));
  formData.append('restreint', String(restreint));

  const response = await fetch(`${API_BASE_URL}/api/resources/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      // Don't set Content-Type — let fetch set it with boundary
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || "Erreur lors de l'upload");
  }
  return response.json();
}

// Create comment
export async function createComment(resourceId: number, content: string): Promise<void> {
  const token = await getToken();
  if (!token) throw new Error('Non authentifié');

  const response = await fetch(`${API_BASE_URL}/api/comment/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ resourceId, content }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Erreur lors de la création du commentaire');
  }
}

// Get media URL
export function getMediaUrl(filename: string, type: 'photo' | 'video'): string {
  const folder = type === 'photo' ? 'images' : 'videos';
  return `${MEDIA_BASE_URL}/${folder}/${filename}`;
}
