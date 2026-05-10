# (Re)Sources Relationnelles — Mobile

Plateforme de partage de ressources relationnelles : application mobile (React Native / Expo), frontend web (React) et backend Symfony.

## Architecture

```
├── backend/          → API Symfony 7.4 + API Platform (PHP 8.2, Apache, Docker)
├── mysql/            → Base de données MySQL 8.2 (Docker)
├── nginx/            → Serveur de médias NGINX (Docker)
├── src/              → Frontend web React (port 3002)
├── mobile/           → Application mobile iOS & Android (Expo / React Native)
```

## Prérequis

- **Docker Desktop** (pour MySQL, NGINX, Backend)
- **Node.js** 20+ (pour le frontend web et l'application mobile)
- **npm** (installé avec Node.js)
- **Expo Go** sur téléphone (App Store / Google Play) pour tester l'app mobile

---

## Démarrage rapide (tout en une commande)

Depuis la racine du projet :

```powershell
.\start.ps1
```

Pour arrêter :

```powershell
.\stop.ps1
```

---

## Démarrage manuel — Version Desktop (site web)

L'ordre de lancement est important. Chaque service dépend du précédent.

### Étape 1 — Lancer Docker Desktop

Ouvrir Docker Desktop et attendre qu'il soit prêt (icône verte dans la barre des tâches).

**Pourquoi :** Tous les services backend tournent dans des conteneurs Docker.

### Étape 2 — Lancer MySQL (base de données)

```powershell
cd mysql
docker compose up -d
```

**Pourquoi :** La base de données stocke les utilisateurs, ressources, commentaires, favoris. Sans elle, rien ne fonctionne.

**Vérification :** Ouvrir http://localhost:8103 (Adminer) — vous devez voir l'interface de gestion de la BDD.

### Étape 3 — Lancer NGINX (serveur de médias)

```powershell
cd nginx
docker compose up -d
```

**Pourquoi :** NGINX sert les images et vidéos uploadées. Sans lui, les photos/vidéos ne s'affichent pas sur le site ni dans l'app mobile.

**Vérification :** Ouvrir http://localhost:8080/images/test.png — vous devez voir une image.

### Étape 4 — Lancer le Backend Symfony (API)

```powershell
cd backend
docker compose up -d
```
cd ..
**Pourquoi :** L'API gère l'authentification, les ressources, les commentaires, la modération. Le frontend et le mobile communiquent avec cette API.

**Vérification :** Ouvrir http://localhost:8000/api — vous devez voir la documentation API Platform.

### Étape 5 — Lancer le Frontend React (site web)

Depuis la **racine du projet** :

```powershell
$env:PORT=3002; npm start
```

**Pourquoi :** C'est l'interface web que les utilisateurs voient dans leur navigateur.

**Vérification :** Ouvrir http://localhost:3002 — le site s'affiche.

### Résumé Desktop

| # | Commande | Service | Port |
|---|----------|---------|------|
| 1 | Docker Desktop | — | — |
| 2 | `cd mysql; docker compose up -d` | MySQL + Adminer | 3306 / 8103 |
| 3 | `cd nginx; docker compose up -d` | Médias (images/vidéos) | 8080 |
| 4 | `cd backend; docker compose up -d` | API Symfony | 8000 |
| 5 | `$env:PORT=3002; npm start` | Site web React | 3002 |

---

## Démarrage manuel — Version Mobile (Expo)

Pour l'application mobile, il faut **les mêmes 4 premiers services** (MySQL, NGINX, Backend) + Expo au lieu du frontend React.

### Étapes 1 à 4 — Identiques au Desktop

Lancer Docker Desktop, puis MySQL, NGINX, et Backend (voir ci-dessus).

### Étape 5 — Lancer l'application mobile (Expo)

```powershell
cd mobile
npm install          # première fois uniquement
npx expo start --lan
```

**Pourquoi :** Expo compile l'application React Native et génère un QR code. Votre téléphone se connecte à l'API via votre réseau Wi-Fi local.

**Vérification :** Scanner le QR code avec l'app Expo Go sur votre téléphone. L'application doit s'ouvrir.

### Important pour le mobile

- Le téléphone et l'ordinateur doivent être sur le **même réseau Wi-Fi**.
- L'adresse IP de votre machine est configurée dans `mobile/src/config/api.ts` (actuellement `192.168.1.42`). Si votre IP locale est différente, modifiez ce fichier.
- Pour trouver votre IP : `ipconfig` dans PowerShell → chercher l'adresse IPv4 de votre adaptateur Wi-Fi.

### Résumé Mobile

| # | Commande | Service | Port |
|---|----------|---------|------|
| 1 | Docker Desktop | — | — |
| 2 | `cd mysql; docker compose up -d` | MySQL + Adminer | 3306 / 8103 |
| 3 | `cd nginx; docker compose up -d` | Médias (images/vidéos) | 8080 |
| 4 | `cd backend; docker compose up -d` | API Symfony | 8000 |
| 5 | `cd mobile; npx expo start --lan` | App mobile Expo | 8081 |

---

## Arrêt des services

```powershell
.\stop.ps1
```

Ou manuellement (dans n'importe quel ordre) :

```powershell
cd backend
docker compose down
cd ..\nginx
docker compose down
cd ..\mysql
docker compose down
```

Pour le frontend React : fermer la fenêtre PowerShell ou `Ctrl+C`.
Pour Expo : `Ctrl+C` dans le terminal.

---

## Comptes de test

| Email | Mot de passe | Rôle |
|-------|-------------|------|
| `citoyen@ressources.fr` | `Password1` | Citoyen |
| `modo@ressources.fr` | `Password1` | Modérateur |
| `admin@ressources.fr` | `Password1` | Administrateur |
| `superadmin@ressources.fr` | `Password1` | Super Administrateur |

---

## URLs des services

| Service | URL |
|---------|-----|
| Frontend web | http://localhost:3002 |
| API Backend | http://localhost:8000/api |
| Médias (NGINX) | http://localhost:8080 |
| Adminer (BDD) | http://localhost:8103 |

---

## Dépannage

| Problème | Solution |
|----------|----------|
| "Erreur de connexion au serveur" sur le site | Vérifier que le backend est lancé : `docker ps` doit montrer `backend.ressource` |
| Images/vidéos ne s'affichent pas | Vérifier que NGINX est lancé : `docker ps` doit montrer `nginx.media.ressource` |
| L'app mobile ne se connecte pas | Vérifier que l'IP dans `mobile/src/config/api.ts` correspond à votre machine |
| Docker ne démarre pas | Ouvrir Docker Desktop et attendre qu'il soit prêt |
| Port déjà utilisé | `docker compose down` dans le dossier concerné, puis relancer |

---

## Tests

### Tests backend (PHPUnit)

```powershell
docker exec backend.ressource php bin/phpunit
```

### Tests mobile (Jest)

```powershell
cd mobile
npm test
```

---

## Structure de l'application mobile

```
mobile/
├── App.tsx                         # Point d'entrée
├── src/
│   ├── config/api.ts               # Configuration URLs API
│   ├── context/AuthContext.tsx      # Authentification globale
│   ├── components/                  # Composants réutilisables
│   ├── navigation/                  # Navigation (tabs + stack)
│   ├── screens/                     # Écrans de l'application
│   │   ├── HomeScreen.tsx           # Liste des ressources
│   │   ├── ResourceDetailScreen.tsx # Détail + vidéo + commentaires
│   │   ├── CreateResourceScreen.tsx # Upload de ressource
│   │   ├── FavoritesScreen.tsx      # Favoris
│   │   ├── ProfileScreen.tsx        # Profil utilisateur
│   │   ├── LoginScreen.tsx          # Connexion
│   │   ├── RegisterScreen.tsx       # Inscription + anti-robot
│   │   ├── ModerationScreen.tsx     # Modération (modérateur+)
│   │   ├── AdminScreen.tsx          # Stats + utilisateurs (admin+)
│   │   └── SuperAdminScreen.tsx     # Création comptes + logs
│   └── services/                    # Appels API
└── __tests__/                       # Tests unitaires
```

## Fonctionnalités par rôle

### Citoyen (utilisateur connecté)
- Parcourir et rechercher les ressources
- Voir le détail (photo/vidéo) et les commentaires
- Publier des ressources (photo/vidéo)
- Commenter les ressources
- Gérer ses favoris

### Modérateur
- Toutes les fonctionnalités citoyen
- Approuver / refuser les ressources en attente
- Approuver / refuser les commentaires
- Suspendre des utilisateurs

### Administrateur
- Toutes les fonctionnalités modérateur
- Voir les statistiques globales
- Gérer les utilisateurs (activer/désactiver, changer les rôles)
- Supprimer des ressources

### Super Administrateur
- Toutes les fonctionnalités administrateur
- Créer des comptes administrateur/modérateur
- Consulter les logs de modération
