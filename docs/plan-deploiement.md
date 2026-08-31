# Plan de déploiement — (Re)Sources Relationnelles

> Document destiné au mentor / jury CDA — LIAKHEVYCH Liudmyla
> Décrit la démarche de déploiement, les environnements, l'automatisation CI/CD,
> l'intégration des tests, la maintenance et le pilotage du projet.

---

## 1. Contexte et vue d'ensemble

L'application (Re)Sources Relationnelles est composée de trois livrables :

| Composant | Technologie | Conteneur / Build |
|-----------|-------------|-------------------|
| Backend API | Symfony 7.4 + API Platform (PHP 8.2) | Image Docker (Apache) |
| Frontend web | React 18 (Create React App) | Build statique servi par NGINX |
| Application mobile | React Native / Expo | Build EAS (iOS / Android) |
| Base de données | MySQL 8.2 | Image Docker |
| Serveur de médias | NGINX | Image Docker |
| Qualité de code | SonarQube / SonarCloud | Analyse statique |

Le déploiement est **conteneurisé** (Docker Compose) et **automatisé** via GitHub Actions,
cohérent avec l'architecture existante décrite dans le `README.md`.

---

## 2. Versioning

### 2.1 Gestion de code source

- **Outil** : Git, hébergé sur GitHub (`github.com/Frolovich/Resources-relationnelles-mobile`)
- **Modèle de branches** (GitHub Flow adapté) :

```
main            → code stable, déployé en production
develop         → intégration continue, déployé en QA
feature/*       → développement d'une fonctionnalité
fix/*           → correctif
release/x.y.z   → préparation d'une version (préproduction)
hotfix/*        → correctif urgent en production
```

### 2.2 Versionnement sémantique (SemVer)

Format `MAJEUR.MINEUR.CORRECTIF` (ex : `1.4.2`) :

| Segment | Incrémenté quand | Exemple |
|---------|------------------|---------|
| MAJEUR | changement incompatible de l'API | 2.0.0 |
| MINEUR | nouvelle fonctionnalité rétrocompatible | 1.5.0 |
| CORRECTIF | correction de bug rétrocompatible | 1.4.3 |

- Chaque version de production est **taguée** dans Git (`git tag v1.4.2`).
- Le tag déclenche automatiquement le pipeline de déploiement production (voir §4).
- Les images Docker sont taguées avec la même version (`backend:1.4.2`) + `latest`.

### 2.3 Revue de code

- Toute modification passe par une **Pull Request** vers `develop` ou `main`.
- La PR doit être **verte** (tests + Quality Gate SonarQube) avant fusion.
- Au moins **1 relecture** obligatoire (protection de branche `main`).

---

## 3. Environnements

Quatre environnements distincts, isolés, cohérents avec le contexte du projet.

| Environnement | Objectif | Branche source | Déploiement | URL type |
|---------------|----------|----------------|-------------|----------|
| **Développement** (local) | Travail quotidien du développeur | `feature/*` | Manuel (`docker compose up`) | localhost |
| **QA / Test** | Tests automatisés + validation fonctionnelle | `develop` | Automatique à chaque merge | qa.ressources-relationnelles.fr |
| **Préproduction** | Validation finale (iso-prod) | `release/*` | Automatique sur branche release | preprod.ressources-relationnelles.fr |
| **Production** | Utilisateurs finaux | `main` + tag | Automatique sur tag, avec approbation manuelle | api.ressources-relationnelles.fr |

### 3.1 Ressources techniques par environnement

| Environnement | vCPU | RAM | Stockage | HTTPS | Base de données |
|---------------|------|-----|----------|-------|-----------------|
| QA | 2 | 4 Go | 20 Go | Certificat auto-signé / staging Let's Encrypt | MySQL dédié (données de test) |
| Préproduction | 2 | 4 Go | 40 Go | Let's Encrypt (staging) | MySQL dédié (copie anonymisée de prod) |
| Production | 4 | 8 Go | 100 Go + sauvegardes | Let's Encrypt (CERTBOT) | MySQL dédié + réplica + backups quotidiens |

### 3.2 Configuration par environnement

- Les secrets et paramètres sont injectés via **variables d'environnement** (jamais dans le code).
- Fichier `.env.<environnement>` non versionné, ou secrets GitHub / secret manager en CI/CD.
- Modèle fourni : `.env.example` (voir §6).

---

## 4. Déploiements automatisés (CI/CD)

Pipeline complet avec GitHub Actions, structuré en deux workflows.

### 4.1 Intégration continue — `.github/workflows/ci.yml`

Déclenché à chaque **push** et **Pull Request** vers `main` / `develop`.

```
┌────────────────────────────────────────────────────────┐
│                     CI Pipeline                          │
│                                                          │
│  1. backend-tests   → PHPUnit (26 tests) + MySQL service │
│  2. frontend-tests  → Jest (React)                       │
│  3. mobile-tests    → Jest (Expo, 23 tests)              │
│  4. sonarqube       → analyse qualité + Quality Gate     │
│                                                          │
│  ✅ Tout vert → PR mergeable                             │
│  ❌ Un échec  → PR bloquée                               │
└────────────────────────────────────────────────────────┘
```

### 4.2 Déploiement continu — `.github/workflows/cd.yml`

```
Merge sur develop        → build images → push GHCR → déploiement QA (auto)
Branche release/*        → build images → push GHCR → déploiement préprod (auto)
Tag vX.Y.Z sur main      → build images → push GHCR → déploiement prod (approbation manuelle)
```

Étapes de déploiement production :
1. Build des images Docker (backend, frontend statique).
2. Publication dans le registry **GHCR** (GitHub Container Registry), taguées `vX.Y.Z`.
3. **Approbation manuelle** (environnement protégé GitHub `production`).
4. Connexion SSH au serveur, `docker compose pull` + `docker compose up -d`.
5. Migrations base de données (`php bin/console doctrine:migrations:migrate --no-interaction`).
6. Vérification santé (health check `GET /api`, code 200/401 attendu).
7. Notification (succès / échec).

### 4.3 Amélioration continue

- Chaque itération alimente les métriques SonarQube (dette technique, couverture).
- Le Quality Gate durcit progressivement (objectif : couverture > 80 %, 0 vulnérabilité bloquante).
- Retours utilisateurs et anomalies → backlog → nouvelle itération (voir §5, §6).

### 4.4 Infrastructure as Code — Terraform + Ansible

L'infrastructure et sa configuration ne sont **pas gérées manuellement** : elles sont
décrites comme du code (*Infrastructure as Code*), ce qui garantit un déploiement
**reproductible**, **idempotent** et **traçable**, en cohérence avec la démarche DevSecOps.

La chaîne complète comporte trois outils complémentaires :

```
Terraform (crée l'infrastructure)  →  Ansible (configure)  →  Docker (exécute)
```

| Outil | Rôle | Fichiers |
|-------|------|----------|
| **Terraform** | Crée l'infrastructure : réseau, volumes, serveur (VM en prod) | `deploy/terraform/` |
| **Ansible** | Configure le serveur : Docker, code, secrets, migrations | `deploy/ansible/` |
| **Docker** | Exécute les services conteneurisés | `docker-compose.prod.yml` |

**Terraform** (`deploy/terraform/`) provisionne le réseau isolé, les volumes persistants
(données MySQL, médias) et le serveur cible. En contexte pédagogique, le provider **Docker**
permet un `terraform apply` réel en local, sans cloud ni coût ; en production, un provider
cloud (Scaleway, OVH, AWS) créerait de vraies VM.

**Ansible** (`deploy/ansible/`) prend ensuite le relais pour configurer ce serveur.

Le playbook (`deploy/ansible/playbook.yml`) automatise :

| Étape | Action Ansible |
|-------|----------------|
| 1 | Installer Docker + prérequis système |
| 2 | Cloner / mettre à jour le code depuis GitHub |
| 3 | Générer le fichier `.env` (secrets via **Ansible Vault**) |
| 4 | Tirer les images et démarrer les conteneurs (`docker-compose.prod.yml`) |
| 5 | Jouer les migrations Doctrine |
| 6 | Vérifier la santé de l'application (health check) |

Exécution :
```bash
cd deploy/ansible
ansible-playbook -i inventory.ini playbook.yml --limit qa --ask-vault-pass
```

Les environnements (QA / préprod / prod) sont décrits dans `inventory.ini`.
Les secrets sont **chiffrés** avec Ansible Vault, jamais en clair dans le dépôt.

> **Écosystème complet (production réelle)** : Ansible se combine souvent avec
> **Terraform** pour d'abord *créer* l'infrastructure cloud (VM, réseau, base de données),
> puis Ansible la *configure*, et Docker exécute les services. Pour ce projet, l'accent
> est mis sur Ansible + Docker (configuration + exécution), suffisant pour couvrir
> l'automatisation du déploiement.

### 4.5 Contexte du projet pédagogique

Dans le cadre de ce projet étudiant, l'infrastructure de production (serveurs QA / préprod / prod
avec noms de domaine et HTTPS) est décrite comme **architecture cible**. La démonstration
concrète de l'automatisation se fait :

- **CI (tests + qualité)** : réellement exécuté à chaque `push` via GitHub Actions.
- **CD (build + publication d'image)** : l'image Docker est réellement construite et publiée sur GHCR.
- **Provisionnement Ansible** : jouable contre une **VM locale** (Vagrant / VirtualBox) ou la machine
  locale (groupe `local` de l'inventaire), sans coût d'infrastructure.

Cette approche démontre la **maîtrise** de la chaîne de déploiement automatisée
sans nécessiter d'hébergement payant.

---

## 5. Intégration des tests

### 5.1 Tests unitaires et fonctionnels (bloquants en CI)

| Suite | Outil | Nombre | Portée |
|-------|-------|--------|--------|
| Backend | PHPUnit | 26 | Unitaire (Entity), fonctionnel (login, register), intégration (flux complet) |
| Mobile | Jest | 23 | Services (auth, ressources, favoris), composants (CAPTCHA) |
| Frontend | Jest / React Testing Library | — | Composants React |

Configuration : `backend/phpunit.dist.xml`, `mobile/jest.config.js`.

Exécution en CI :
```bash
# Backend (dans le conteneur, APP_ENV=test)
php bin/phpunit

# Mobile / Frontend
npm test -- --watchAll=false
```

### 5.2 Tests de performance

- **Outil recommandé** : k6 ou Apache JMeter (scénarios : login, liste des ressources, upload).
- Exécutés en préproduction avant passage en production.
- Seuils : temps de réponse API < 300 ms (p95), taux d'erreur < 1 %.

### 5.3 Tests de sécurité (DevSecOps)

- `composer audit` (dépendances PHP), `npm audit` (JS/TS) — exécutés en CI.
- Analyse SonarQube : vulnérabilités, security hotspots.
- `docker scout cves` sur les images.

---

## 6. Maintenances correctives et évolutives

### 6.1 Maintenance corrective (bugs)

| Sévérité | Délai de prise en charge | Procédure |
|----------|--------------------------|-----------|
| Critique (prod HS) | Immédiat | branche `hotfix/*` → prod directe après tests |
| Majeure | < 48 h | `fix/*` → `develop` → cycle normal |
| Mineure | prochaine itération | backlog |

### 6.2 Maintenance évolutive (nouvelles fonctionnalités)

- Nouvelle fonctionnalité → `feature/*` → PR vers `develop`.
- Validation en QA puis préproduction avant intégration à une release.
- Cadence de release planifiée (ex : toutes les 2 à 4 semaines).

### 6.3 Mises à jour techniques

- Veille CVE sur PHP, Symfony, Node, MySQL, images Docker.
- Mise à jour régulière des dépendances (Dependabot recommandé).
- Rotation des secrets (clés JWT, mots de passe BDD) selon politique de sécurité.

---

## 7. Pilotage et reporting

### 7.1 Anomalies et demandes

- **Outil** : GitHub Issues + Projects (Kanban) — suivi anomalies et demandes d'évolution.
- Étiquettes : `bug`, `enhancement`, `critical`, `security`.
- Chaque anomalie liée à une PR de correction (traçabilité).

### 7.2 Performances et disponibilité

| Indicateur | Outil | Cible |
|------------|-------|-------|
| Disponibilité (uptime) | Sonde HTTP / UptimeRobot | > 99 % |
| Temps de réponse API | Logs + monitoring | < 300 ms p95 |
| Erreurs 5xx | Logs Apache / agrégateur | < 1 % |
| État des conteneurs | `docker ps` / healthchecks | Tous « healthy » |
| Qualité du code | SonarQube (dashboard) | Quality Gate « passed » |
| Audit modération | table `moderation_logs` | Traçabilité complète |

### 7.3 Reporting

- **Tableau de bord SonarQube** : évolution dette technique, couverture, vulnérabilités.
- **GitHub Actions** : historique des déploiements (succès/échec, durée).
- **Rapport d'itération** : fonctionnalités livrées, anomalies traitées, métriques.

---

## 8. Récapitulatif des étapes clés et responsabilités

| # | Étape | Ressource / Rôle | Outil |
|---|-------|------------------|-------|
| 1 | Développement + tests locaux | Développeur | Docker, IDE |
| 2 | Push + Pull Request | Développeur | Git / GitHub |
| 3 | CI : tests + qualité | Automatique (GitHub Actions) | PHPUnit, Jest, SonarQube |
| 4 | Revue de code + merge | Relecteur | GitHub PR |
| 5 | Déploiement QA | Automatique | GitHub Actions, Docker |
| 6 | Validation fonctionnelle | QA / Product Owner | Environnement QA |
| 7 | Déploiement préproduction | Automatique (branche release) | GitHub Actions |
| 8 | Tests de performance | Automatique / QA | k6 / JMeter |
| 9 | Tag version + approbation | Responsable technique | Git tag, GitHub environment |
| 10 | Déploiement production | Automatique après approbation | GitHub Actions, SSH, Docker |
| 11 | Migrations + health check | Automatique | Symfony console, curl |
| 12 | Monitoring + reporting | Automatique + équipe | SonarQube, logs, sondes |

---

## 9. Fichiers du dépôt liés au déploiement

| Fichier | Rôle |
|---------|------|
| `docker-compose.yml` | Environnement de développement (tous services) |
| `docker-compose.prod.yml` | Environnement de production (sans outils de dev) |
| `.env.example` | Modèle des variables d'environnement |
| `.github/workflows/ci.yml` | Pipeline d'intégration continue |
| `.github/workflows/cd.yml` | Pipeline de déploiement continu |
| `backend/Dockerfile` | Image du backend Symfony |
| `sonar-project.properties` | Configuration de l'analyse SonarQube |
| `nginx/nginx-prod.conf` | Reverse proxy NGINX + HTTPS (production) |
| `deploy/terraform/*.tf` | Terraform — provisionnement de l'infrastructure (IaC) |
| `deploy/terraform/README.md` | Guide Terraform (exécution via Docker) |
| `deploy/ansible/playbook.yml` | Playbook Ansible — configuration + déploiement (IaC) |
| `deploy/ansible/inventory.ini` | Inventaire des environnements (QA / préprod / prod) |
| `deploy/ansible/env.j2` | Modèle du fichier `.env` généré sur le serveur |
| `deploy/README.md` | Guide de déploiement Ansible |
