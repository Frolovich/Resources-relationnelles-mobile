import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../config/api';

const TOKEN_KEY = 'jwt_token';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  surname: string;
  birthdate: string;
  nickname?: string;
  city?: string;
  termsAccepted: boolean;
  privacyPolicyAccepted: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  surname: string;
  nickname: string | null;
  city: string | null;
  roles: string[];
  registeredAt: string;
  birthdate: string | null;
  pendingComments: number;
  pendingResources: number;
  pendingModComments: number;
}

// Store JWT token securely
export async function saveToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

// Retrieve JWT token
export async function getToken(): Promise<string | null> {
  return await SecureStore.getItemAsync(TOKEN_KEY);
}

// Remove JWT token
export async function removeToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

// Login
export async function login(credentials: LoginCredentials): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Identifiants incorrects');
  }

  const data = await response.json();
  const token = data.token;
  await saveToken(token);
  return token;
}

// Register
export async function register(data: RegisterData): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || "Erreur lors de l'inscription");
  }
}

// Get current user profile
export async function getMe(): Promise<UserProfile> {
  const token = await getToken();
  if (!token) throw new Error('Non authentifié');

  const response = await fetch(`${API_BASE_URL}/api/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    if (response.status === 401) {
      await removeToken();
      throw new Error('Session expirée');
    }
    throw new Error('Erreur serveur');
  }

  return response.json();
}

// Logout
export async function logout(): Promise<void> {
  await removeToken();
}

// Request password reset
export async function requestPasswordReset(email: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/password/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    throw new Error('Erreur lors de la demande');
  }
}
