# (Re)Sources Relationnelles — Mobile

Plateforme de partage de ressources relationnelles : application mobile (React Native / Expo), frontend web (React) et backend Symfony.

## Architecture

```
├── backend/          → API Symfony 7.4 + API Platform (PHP 8.2, Apache, Docker)
├── mysql/            → Base de données MySQL 8.2 (Docker)
├── nginx/            → Serveur de médias NGINX + HTTPS (Docker)
├── src/              → Frontend web React (port 3002)
├── mobile/           → Application mobile iOS & Android (Expo / React Native)
├── docs/             → Documentation (plan de sécurisation, Postman, SQL)
├── docker-compose.yml → Lancement unifié de tous les services
```

## Prérequis

- **Docker Desktop** (pour MySQL, NGINX, Backend)
- **Node.js** 20+ (pour le frontend web et l'application mobile)
- **npm** (installé avec Node.js)
- **Expo Go** sur téléphone (App Store / Google Play) pour tester l'app mobile

---

## Démarrage rapide

### 1. Lancer tous les services Docker (une seule commande)

```powershell
docker compose up --build -d
```

### 2. Première fois uniquement — installer les dépendances PHP et générer les clés JWT

```powershell
docker exec backend.ressource composer install
docker exec backend.ressource php bin/console lexik:jwt:generate-keypair --overwrite
```

### 3. Lancer le frontend React

Dans un autre terminal :

```powershell
npm install          # première fois uniquement
$env:PORT=3002; npm start
```

### 4. Ouvrir le site

→ http://localhost:3002

---

## Démarrage de l'application mobile (Expo)

```powershell
cd mobile
npm install          # première fois uniquement
npx expo start --lan
```

Scanner le QR code avec Expo Go sur le téléphone.

**Important :** Le téléphone et l'ordinateur doivent être sur le même réseau Wi-Fi. L'IP de la machine est configurée dans `mobile/src/config/api.ts`.

---

## Arrêt des services

```powershell
docker compose down
```

Pour le frontend React : `Ctrl+C` dans le terminal.

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
| API Docs | http://localhost:8000/api/docs |
| Médias (NGINX) | http://localhost:8080 |
| HTTPS (NGINX) | https://localhost (certificat auto-signé) |
| Adminer (BDD) | http://localhost:8103 |
| SonarQube | http://localhost:9000 (admin/admin) |

---

## Réinitialiser la base de données

Si la BDD est vide ou corrompue :

```powershell
cmd /c "docker exec -i mysql.db.ressource mysql -u user -puser ressource < mysql\mysql_docker.sql"
```

---

## Dépannage

| Problème | Solution |
|----------|----------|
| "Erreur de connexion au serveur" | Vérifier : `docker ps` doit montrer `backend.ressource` Up |
| Images/vidéos ne s'affichent pas | Vérifier : `docker ps` doit montrer `nginx.media.ressource` Up |
| L'app mobile ne se connecte pas | Vérifier l'IP dans `mobile/src/config/api.ts` |
| Conteneur en conflit (nom déjà utilisé) | `docker rm -f <nom>` puis relancer |
| Upload échoue (fichier trop gros) | PHP configuré pour 200 MB max. Rebuild : `docker compose up --build -d` |
| "Impossible de charger le profil" | JWT manquant : `docker exec backend.ressource php bin/console lexik:jwt:generate-keypair --overwrite` |
| BDD vide | Réinitialiser (voir section ci-dessus) |

---

## Tests

> **Important :** Les tests backend s'exécutent **uniquement via Docker**.

### Tests backend (PHPUnit) — 26 tests

```powershell
# Tous les tests
docker exec -e APP_ENV=test backend.ressource php bin/phpunit

# Avec détail
docker exec -e APP_ENV=test backend.ressource php bin/phpunit --testdox

# Un fichier spécifique
docker exec -e APP_ENV=test backend.ressource php bin/phpunit tests/Unit/Entity/UserTest.php

# Un test par nom
docker exec -e APP_ENV=test backend.ressource php bin/phpunit --filter testSetEmail
```

| Fichier | Type | Ce qu'il teste |
|---------|------|----------------|
| `tests/Unit/Entity/UserTest.php` | Unitaire | UUID, rôles, RGPD, soft delete |
| `tests/Unit/Entity/ResourceTest.php` | Unitaire | Création, statut, compteurs, type |
| `tests/Functional/LoginTest.php` | Fonctionnel | Connexion valide / invalide |
| `tests/Functional/RegistrationTest.php` | Fonctionnel | Inscription, champs manquants, doublon |
| `tests/Integration/FullFlowTest.php` | Intégration | Flux complet, reset mot de passe |
| `tests/Controller/HomeControllerTest.php` | Fonctionnel | Endpoint public resources |

### Tests mobile (Jest) — 23 tests

```powershell
cd mobile
npm test -- --watchAll=false
```

| Fichier | Ce qu'il teste |
|---------|----------------|
| `__tests__/services/authService.test.ts` | Login, register, token |
| `__tests__/services/resourceService.test.ts` | Ressources, upload, catégories |
| `__tests__/services/favoriteService.test.ts` | Ajout/suppression favoris |
| `__tests__/components/RecaptchaModal.test.tsx` | Modal CAPTCHA |

---

## Déploiement (CI/CD + Infrastructure as Code)

Le plan de déploiement complet est dans `docs/plan-deploiement.md`. Points clés :

- **Versioning** : Git + GitHub, GitHub Flow, versionnement sémantique (tags `vX.Y.Z`)
- **CI** (`.github/workflows/ci.yml`) : tests PHPUnit + Jest, audit de sécurité, analyse SonarCloud
- **CD** (`.github/workflows/cd.yml`) : build des images Docker → publication sur GHCR → déploiement par environnement
- **Environnements** : QA, préproduction, production (voir `docker-compose.prod.yml`)
- **Infrastructure as Code** : `Terraform` (crée l'infra) → `Ansible` (configure) → `Docker` (exécute)
  - `deploy/terraform/` — provisionnement (réseau, volumes, serveur) — voir `deploy/terraform/README.md`
  - `deploy/ansible/` — configuration + déploiement — voir `deploy/README.md`
- **Contexte pédagogique** : Terraform (provider Docker) et Ansible sont jouables en local, sans hébergement payant

```powershell
# 1. Provisionner l'infrastructure (Terraform via Docker, sans installation)
cd deploy/terraform
docker run --rm -v "${PWD}:/work" -w /work -v /var/run/docker.sock:/var/run/docker.sock hashicorp/terraform:latest init
docker run --rm -v "${PWD}:/work" -w /work -v /var/run/docker.sock:/var/run/docker.sock hashicorp/terraform:latest apply -auto-approve

# 2. Configurer + déployer (Ansible, exemple QA)
cd ../ansible
ansible-playbook -i inventory.ini playbook.yml --limit qa --ask-vault-pass
```

---

## Sécurité

Le plan de sécurisation complet est dans `docs/plan-securisation.md`. Points clés :

- **HTTPS** : NGINX reverse proxy avec TLS (certificat auto-signé en dev, CERTBOT en production)
- **JWT** : Token RS256, durée 8h (`lexik/jwt-authentication-bundle`)
- **Mots de passe** : bcrypt cost 13 (jamais en clair)
- **Injections SQL** : Doctrine ORM (paramètres liés, pas de SQL brut)
- **Chiffrement BDD** : MySQL InnoDB encryption at rest (`innodb-encrypt-tables=ON`)
- **SonarQube** : Analyse qualité du code (http://localhost:9000)
- **CORS** : `nelmio/cors-bundle` avec regex sur les origines autorisées
- **RGPD** : Consentements explicites datés, soft delete, droit d'accès
- **Conteneurisation** : Services isolés, réseau Docker interne, ports minimaux
- **Firewall** : Contrôle d'accès par rôle (`security.yaml`)

---

## Architecture backend (couches)

```
Controller  → Reçoit les requêtes HTTP, retourne les réponses JSON
Service     → Porte l'intelligence fonctionnelle (règles métier)
Repository  → Accède à la base de données (requêtes via Doctrine)
Entity      → Modèle de données (mapping ORM)
```

---

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
