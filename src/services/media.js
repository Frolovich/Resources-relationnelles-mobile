// ================================================
// Media Service — URLs pour images et vidéos
// Pointe vers le serveur NGINX sur le port 8080
// ================================================

const MEDIA_BASE_URL = "http://localhost:8080";

export const imageUrl  = (filename) => `${MEDIA_BASE_URL}/images/${filename}`;
export const videoUrl  = (filename) => `${MEDIA_BASE_URL}/videos/${filename}`;
