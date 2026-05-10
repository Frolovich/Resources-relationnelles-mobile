// IP locale pour accès depuis un appareil physique (Expo Go)
const getBaseUrl = (): string => {
  if (__DEV__) {
    return 'http://192.168.1.42:8000';
  }
  return 'https://api.ressources-relationnelles.fr';
};

export const API_BASE_URL = getBaseUrl();

// Media server URL (NGINX)
const getMediaUrl = (): string => {
  if (__DEV__) {
    return 'http://192.168.1.42:8080';
  }
  return 'https://media.ressources-relationnelles.fr';
};

export const MEDIA_BASE_URL = getMediaUrl();
