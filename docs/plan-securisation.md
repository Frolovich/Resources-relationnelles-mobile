# Plan de sécurisation — (Re)Sources Relationnelles

## 1. Identification des vulnérabilités

### 1.1 Vulnérabilités identifiées

| # | Vulnérabilité | Catégorie OWASP | Criticité | Composant concerné |
|---|---|---|---|---|
| 1 | Injection SQL | A03:2021 | Critique | Backend API |
| 2 | Authentification cassée | A07:2021 | Haute | Login, JWT |
| 3 | Exposition de données sensibles | A02:2021 | Haute | BDD, API |
| 4 | Cross-Site Scripting (XSS) | A03:2021 | Moyenne | Frontend React |
| 5 | Cross-Origin Resource Sharing mal configuré | A05:2021 | Moyenne | Backend CORS |
| 6 | Upload de fichiers malveillants | A08:2021 | Haute | Upload médias |
| 7 | Brute force sur le login | A07:2021 | Moyenne | Endpoint login |
| 8 | Fuite de secrets dans le code source | A02:2021 | Haute | Git, .env |
| 9 | Absence de chiffrement en transit | A02:2021 | Haute | HTTP |
| 10 | Données personnelles non protégées (RGPD) | Réglementaire | Haute | BDD Users |

### 1.2 Surface d'attaque

```
Internet → HTTPS (CERTBOT) → NGINX reverse proxy → Backend Symfony (Docker)
                                                  → MySQL (Docker, réseau interne)
                                                  → NGINX médias (Docker)
```

---

## 2. Solutions mises en place

### 2.1 Chiffrement

| Élément | Solution | Détail technique |
|---------|----------|-----------------|
| Mots de passe | Hachage bcrypt (cost 13) | `Symfony\Component\PasswordHasher` — algorithme `auto` (bcrypt) |
| Communication client-serveur | HTTPS (TLS 1.3) | Certificats Let's Encrypt via CERTBOT en production |
| Token d'authentification | JWT signé RSA (RS256) | Clé privée `config/jwt/private.pem`, clé publique `public.pem` |
| Base de données au repos | Chiffrement natif MySQL InnoDB | `innodb_encrypt_tables=ON`, `innodb_encrypt_log=ON` |
| Fichier .env | Non versionné en production | `.env.local` dans `.gitignore` |

### 2.2 Protection contre les injections SQL

- **ORM Doctrine** : toutes les requêtes passent par le QueryBuilder ou des méthodes Repository
- **Aucune requête SQL brute** dans les contrôleurs ou services
- **Paramètres liés** (`setParameter()`) dans les requêtes DQL personnalisées
- Équivalent Hibernate dans l'écosystème PHP/Symfony

```php
// Exemple : Repository — requête sécurisée
$qb->where('r.status = :status')
    ->setParameter('status', ResourceStatus::APPROVED);
```

### 2.3 Authentification et autorisation (JWT)

| Élément | Configuration |
|---------|---------------|
| Bundle | `lexik/jwt-authentication-bundle` |
| Algorithme | RS256 (RSA + SHA-256) |
| Durée du token | 8 heures (`token_ttl: 28800`) |
| Stockage côté client | `localStorage` (web), `expo-secure-store` (mobile) |
| Refresh token | Non implémenté (session courte) |

**Fichier** : `backend/config/packages/lexik_jwt_authentication.yaml`

```yaml
lexik_jwt_authentication:
    secret_key: '%env(resolve:JWT_SECRET_KEY)%'
    public_key: '%env(resolve:JWT_PUBLIC_KEY)%'
    pass_phrase: '%env(JWT_PASSPHRASE)%'
    token_ttl: 28800
```

### 2.4 CORS (Cross-Origin Resource Sharing)

**Bundle** : `nelmio/cors-bundle`

```yaml
nelmio_cors:
    defaults:
        origin_regex: true
        allow_origin: ['%env(CORS_ALLOW_ORIGIN)%']
        allow_methods: ['GET', 'OPTIONS', 'POST', 'PUT', 'PATCH', 'DELETE']
        allow_headers: ['Content-Type', 'Authorization']
```

Seuls les domaines autorisés (regex) peuvent communiquer avec l'API.

### 2.5 CSRF

Non applicable dans ce projet : l'API est **stateless** (pas de cookies de session). L'authentification se fait via header `Authorization: Bearer <JWT>`, ce qui rend les attaques CSRF impossibles.

### 2.6 Firewall applicatif (Symfony Security)

**Fichier** : `backend/config/packages/security.yaml`

```yaml
access_control:
    - { path: ^/api/login,           roles: PUBLIC_ACCESS }
    - { path: ^/api/register,        roles: PUBLIC_ACCESS }
    - { path: ^/api/public/resources, roles: PUBLIC_ACCESS }
    - { path: ^/api/moderation,      roles: ROLE_MODERATOR }
    - { path: ^/api/admin,           roles: ROLE_ADMIN }
    - { path: ^/api/super-admin,     roles: ROLE_SUPER_ADMIN }
    - { path: ^/api,                 roles: IS_AUTHENTICATED_FULLY }
```

Hiérarchie des rôles :
```
ROLE_SUPER_ADMIN > ROLE_ADMIN > ROLE_MODERATOR > ROLE_USER
```

### 2.7 Protection contre l'upload malveillant

| Contrôle | Implémentation |
|----------|---------------|
| Types MIME autorisés | `image/jpeg`, `image/png`, `image/webp`, `image/gif`, `video/mp4`, `video/webm` |
| Taille maximale | 10 MB (images), 200 MB (vidéos) |
| Nom de fichier | Généré par `uniqid()` — pas de nom utilisateur |
| Stockage | Séparé du code (volume NGINX dédié) |

### 2.8 Conteneurisation et isolation

```
┌─────────────────────────────────────────────────────┐
│                    Docker Host                       │
│                                                     │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌───────┐ │
│  │ MySQL   │  │ Backend │  │  NGINX  │  │Adminer│ │
│  │ :3306   │  │  :8000  │  │  :8080  │  │ :8103 │ │
│  └────┬────┘  └────┬────┘  └────┬────┘  └───┬───┘ │
│       └─────── réseau interne Docker ────────┘     │
└─────────────────────────────────────────────────────┘
```

- Chaque service dans son propre conteneur
- Réseau Docker interne (non exposé)
- Seuls les ports nécessaires sont mappés vers l'hôte
- MySQL accessible uniquement depuis le réseau Docker (`host.docker.internal`)

### 2.9 Utilisateur dédié SGBD

```yaml
# mysql/.env
MYSQL_USER=user
MYSQL_PASSWORD=user
MYSQL_DATABASE=ressource
```

En production : utilisateur avec droits limités (SELECT, INSERT, UPDATE, DELETE) — pas de DROP ni ALTER.

---

## 3. RGPD (Règlement Général sur la Protection des Données)

### 3.1 Données personnelles collectées

| Donnée | Finalité | Base légale |
|--------|----------|-------------|
| Email | Authentification, communication | Contrat |
| Nom, prénom | Identification sur la plateforme | Contrat |
| Date de naissance | Vérification âge minimum (13 ans) | Intérêt légitime |
| Ville | Personnalisation (optionnel) | Consentement |
| Mot de passe | Authentification | Contrat |

### 3.2 Consentements explicites (inscription)

| Consentement | Obligatoire | Champ Entity |
|---|---|---|
| Conditions d'utilisation | ✅ Oui | `termsAccepted`, `termsAcceptedAt` |
| Politique de confidentialité | ✅ Oui | `privacyPolicyAccepted`, `privacyPolicyAcceptedAt` |
| Cookies | ❌ Non | `cookiesAccepted`, `cookiesAcceptedAt` |
| Communications marketing | ❌ Non | `marketingConsent`, `marketingConsentAt` |

### 3.3 Droits des utilisateurs

| Droit RGPD | Implémentation |
|---|---|
| Droit d'accès | `GET /api/me` — l'utilisateur voit toutes ses données |
| Droit de rectification | Modification du profil |
| Droit à l'effacement | Suppression logique (`deletedAt`) par l'admin |
| Droit à la portabilité | Export CSV (admin) |
| Droit d'opposition | Désinscription, retrait du consentement marketing |

### 3.4 Mesures techniques RGPD

- Mots de passe **jamais** stockés en clair (bcrypt)
- Suppression logique (soft delete) — conservation temporaire pour audit
- Horodatage des consentements (`termsAcceptedAt`, etc.)
- Token JWT à durée limitée (8h)
- Pas de cookies de session (stateless)

---

## 4. HTTPS en production (CERTBOT / Let's Encrypt)

### 4.1 Architecture cible

```
Client → HTTPS (:443) → NGINX reverse proxy → Backend (:8000, HTTP interne)
                                             → NGINX médias (:8080, HTTP interne)
```

### 4.2 Mise en place

```bash
# Installation CERTBOT
apt install certbot python3-certbot-nginx

# Génération du certificat
certbot --nginx -d api.ressources-relationnelles.fr -d media.ressources-relationnelles.fr

# Renouvellement automatique (cron)
certbot renew --quiet
```

### 4.3 Configuration NGINX production

```nginx
server {
    listen 443 ssl http2;
    server_name api.ressources-relationnelles.fr;

    ssl_certificate /etc/letsencrypt/live/api.ressources-relationnelles.fr/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.ressources-relationnelles.fr/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    location / {
        proxy_pass http://backend:80;
    }
}
```

---

## 5. DevSecOps et CVE

### 5.1 DevSecOps

Intégration de la sécurité à chaque étape du cycle de développement :

| Étape | Action sécurité |
|---|---|
| Code | `.gitignore` pour secrets, pas de credentials en dur |
| Build | Dockerfile avec image officielle, dépendances vérifiées |
| Test | Tests fonctionnels (login, registration, accès non autorisé) |
| Deploy | Conteneurs isolés, HTTPS, firewall |
| Monitor | Logs de modération (`moderation_logs`), audit trail |

### 5.2 CVE (Common Vulnerabilities and Exposures)

**Impact sur le projet :**
- Veille sur les CVE des dépendances (`composer audit`, `npm audit`)
- Mise à jour régulière de PHP, Symfony, Node.js, MySQL
- Images Docker basées sur versions stables (`php:8.2-apache`, `mysql:8.2`, `nginx:1.25-alpine`)

```bash
# Vérification des vulnérabilités connues
composer audit          # Backend PHP
npm audit               # Frontend / Mobile
docker scout cves       # Images Docker
```

---

## 6. .gitignore — Protection des secrets

```gitignore
# Fichiers sensibles JAMAIS versionnés
.env.local
.env.*.local
config/jwt/private.pem
config/jwt/public.pem
vendor/
node_modules/
```

Les fichiers `.env` versionnés contiennent uniquement des **valeurs par défaut** pour le développement. En production, les vraies valeurs sont dans `.env.local` (non versionné) ou injectées via variables d'environnement Docker.

---

## 7. Qualité du code (SonarQube)

### 7.1 Règles appliquées

| Règle | Application |
|---|---|
| Pas de SQL brut | Doctrine ORM uniquement |
| Pas de secrets en dur | Variables d'environnement |
| Validation des entrées | `Symfony\Validator` sur les Entity |
| Gestion des erreurs | Try/catch, codes HTTP appropriés |
| Commentaires | PHPDoc sur les Services et Repository |
| Architecture en couches | Controller → Service → Repository |

### 7.2 Architecture des couches backend

```
┌──────────────────────────────────────────┐
│           Controller                      │
│   Reçoit les requêtes HTTP               │
│   Retourne les réponses JSON             │
├──────────────────────────────────────────┤
│           Service                         │
│   Porte l'intelligence fonctionnelle     │
│   Règles métier, validation              │
├──────────────────────────────────────────┤
│           Repository                      │
│   Accède à la base de données            │
│   Requêtes via Doctrine QueryBuilder     │
├──────────────────────────────────────────┤
│           Entity                          │
│   Modèle de données (ORM mapping)        │
└──────────────────────────────────────────┘
```

---

## 8. Plan de continuité et reprise d'activité (PCA/PRA)

### 8.1 Sauvegarde

| Élément | Fréquence | Méthode |
|---|---|---|
| Base de données MySQL | Quotidienne | `mysqldump` automatisé |
| Fichiers médias (NGINX) | Quotidienne | Synchronisation vers stockage externe |
| Code source | Continu | Git (GitHub) |
| Certificats SSL | Renouvellement auto (CERTBOT) | Cron |

### 8.2 Reprise d'activité

| Scénario | Temps de reprise | Action |
|---|---|---|
| Panne serveur | < 30 min | Relancer les conteneurs Docker |
| Corruption BDD | < 1h | Restaurer depuis le dernier dump |
| Perte de données médias | < 2h | Restaurer depuis la sauvegarde |
| Compromission (hack) | < 4h | Rotation des clés JWT, reset des mots de passe, audit |

### 8.3 Monitoring

- Logs Apache dans le conteneur backend
- `moderation_logs` pour l'audit des actions de modération
- `docker ps` pour vérifier l'état des services
- Alertes sur les erreurs 500 (à configurer en production)
