# Explication du Plan de Sécurisation — (Re)Sources Relationnelles

> Document destiné au mentor / jury CDA — LIAKHEVYCH Liudmyla

---

## Résumé en une phrase

L'application protège les données personnelles des utilisateurs en combinant **chiffrement** (HTTPS, bcrypt, JWT), **isolation** (Docker), **contrôle d'accès** (rôles), et **conformité RGPD** (consentements explicites).

---

## Comment ça marche concrètement ?

### 1. L'utilisateur se connecte

```
Navigateur → HTTPS (chiffré) → NGINX → Backend Symfony
                                            ↓
                                    Vérifie email + mot de passe (bcrypt)
                                            ↓
                                    Génère un token JWT (signé RSA)
                                            ↓
                                    Renvoie le token au navigateur
```

Le mot de passe n'est **jamais** stocké en clair. On stocke un hash bcrypt (`$2y$13$...`) — irréversible.

### 2. L'utilisateur fait une action (ex: publier une ressource)

```
Navigateur → envoie le JWT dans le header "Authorization: Bearer eyJ..."
         → Backend vérifie la signature du token (clé publique RSA)
         → Vérifie le rôle (ROLE_USER, ROLE_MODERATOR, etc.)
         → Autorise ou refuse (401/403)
```

Pas de session côté serveur (stateless) → pas de cookie de session → pas d'attaque CSRF possible.

### 3. Les données sont isolées

```
┌─────────────────────────────────────┐
│        Un seul docker-compose        │
│                                     │
│  MySQL    → réseau interne seul     │
│  Backend  → seul à parler à MySQL   │
│  NGINX    → seul point d'entrée     │
│  Adminer  → accès BDD (dev only)    │
└─────────────────────────────────────┘
```

MySQL n'est **pas** accessible depuis internet — uniquement depuis le réseau Docker interne.

---

## Les 5 piliers de sécurité du projet

### Pilier 1 : Chiffrement

| Quoi | Comment | Où dans le code |
|------|---------|-----------------|
| Mots de passe | bcrypt (cost 13) | `security.yaml` → `password_hashers: auto` |
| Communication | HTTPS (TLS 1.3) | `nginx/nginx-ssl.conf` + certificat |
| Token auth | JWT signé RSA-256 | `lexik_jwt_authentication.yaml` |
| BDD au repos | MySQL InnoDB encryption | Option native MySQL |

### Pilier 2 : Contrôle d'accès (Firewall)

```yaml
# security.yaml — qui peut faire quoi
/api/public/*       → tout le monde
/api/favorites      → utilisateur connecté (ROLE_USER)
/api/moderation/*   → modérateur (ROLE_MODERATOR)
/api/admin/*        → administrateur (ROLE_ADMIN)
/api/super-admin/*  → super administrateur uniquement
```

### Pilier 3 : Protection des injections

- **Doctrine ORM** = équivalent PHP de Hibernate (Java)
- Toutes les requêtes utilisent des **paramètres liés** (prepared statements)
- Aucun SQL brut dans le code

```php
// JAMAIS ça :
$sql = "SELECT * FROM users WHERE email = '$email'";  // ❌ injection possible

// TOUJOURS ça :
$qb->where('u.email = :email')->setParameter('email', $email);  // ✅ sécurisé
```

### Pilier 4 : RGPD

- Consentements **datés** et **séparés** (CGU, confidentialité, cookies, marketing)
- Suppression logique (soft delete) — les données restent pour audit puis sont purgées
- Pas de données envoyées à des tiers (sauf reCAPTCHA Google — mentionné dans la politique)
- L'utilisateur peut voir toutes ses données (`/api/me`)

### Pilier 5 : DevSecOps

- `.gitignore` : pas de mots de passe ni clés privées dans Git
- Images Docker officielles et maintenues
- `composer audit` / `npm audit` pour détecter les CVE
- Tests automatisés (26 PHPUnit + 23 Jest)

---

## Équivalences Java/Spring → PHP/Symfony

Le jury peut poser des questions en termes Java. Voici les correspondances :

| Java / Spring | PHP / Symfony | Rôle |
|---|---|---|
| Spring Security | `security.yaml` + firewall | Authentification, autorisation |
| `@PreAuthorize("hasRole()")` | `access_control` dans security.yaml | Restriction par rôle |
| Spring Profiles | `APP_ENV=dev/prod/test` | Environnements |
| Hibernate | Doctrine ORM | ORM anti-injection |
| BCryptPasswordEncoder | `PasswordHasherInterface` (bcrypt auto) | Hash mots de passe |
| JWT via Spring Security | `lexik/jwt-authentication-bundle` | Token stateless |
| CORS via Spring | `nelmio/cors-bundle` | Cross-origin |
| CERTBOT + Spring Boot | CERTBOT + NGINX reverse proxy | HTTPS |
| SonarQube | SonarQube (identique, multilangage) | Qualité code |

---

## Ce qu'il faut retenir pour le jury

1. **"Comment gérez-vous l'authentification ?"** → JWT signé RSA, stateless, durée 8h, stocké côté client
2. **"Comment protégez-vous les mots de passe ?"** → bcrypt cost 13, jamais stockés en clair, hashage irréversible
3. **"Injections SQL ?"** → Doctrine ORM (paramètres liés), pas de raw SQL
4. **"HTTPS ?"** → NGINX reverse proxy avec TLS, certificat CERTBOT en production
5. **"RGPD ?"** → Consentements explicites datés, droit d'accès, soft delete, pas de cookies de session
6. **"CORS ?"** → Nelmio bundle, regex sur les origines autorisées, preflight OPTIONS
7. **"Architecture ?"** → Conteneurs Docker isolés, réseau interne, ports exposés minimaux
8. **"DevSecOps ?"** → audit dépendances, .gitignore, tests, images officielles
