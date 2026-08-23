#!/bin/bash
# Génère un certificat auto-signé pour le développement local
# En production, remplacer par CERTBOT (Let's Encrypt)

openssl req -x509 -nodes -days 365 \
  -newkey rsa:2048 \
  -keyout /etc/nginx/ssl/privkey.pem \
  -out /etc/nginx/ssl/fullchain.pem \
  -subj "/C=FR/ST=IDF/L=Paris/O=ReSources Relationnelles/CN=localhost"

echo "Certificat SSL auto-signé généré."
