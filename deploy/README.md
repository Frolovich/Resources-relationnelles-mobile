# Déploiement — Infrastructure as Code (Ansible)

Ce dossier automatise le déploiement de (Re)Sources Relationnelles avec **Ansible**,
en cohérence avec la démarche DevSecOps décrite dans `docs/plan-deploiement.md`.

## Pourquoi Ansible

Ansible remplace la configuration **manuelle** du serveur par du code
(*Infrastructure as Code*) : installation de Docker, récupération du projet,
injection des secrets, démarrage des conteneurs, migrations et vérification de santé.
Résultat : un déploiement **reproductible**, **idempotent** et **traçable**.

```
Ansible (configure le serveur)  →  Docker Compose (lance les services)
```

## Structure

```
deploy/ansible/
├── inventory.ini             # Serveurs par environnement (qa / preprod / prod / local)
├── playbook.yml              # Étapes de déploiement
├── env.j2                    # Modèle du fichier .env généré sur le serveur
└── group_vars/
    └── all.example.yml       # Modèle des variables (à copier + chiffrer avec Vault)
```

## Prérequis (poste de contrôle)

```bash
pip install ansible
ansible-galaxy collection install community.docker
```

## Utilisation

```bash
cd deploy/ansible

# 1. Préparer les variables
cp group_vars/all.example.yml group_vars/all.yml
# éditer group_vars/all.yml puis chiffrer les secrets :
ansible-vault encrypt group_vars/all.yml

# 2. Déployer en QA
ansible-playbook -i inventory.ini playbook.yml --limit qa --ask-vault-pass

# 3. Déployer en production (tag précis)
ansible-playbook -i inventory.ini playbook.yml --limit production \
  --extra-vars "deploy_ref=v1.4.2" --ask-vault-pass
```

## Démonstration pédagogique (sans serveur distant)

Pour un projet étudiant, on peut jouer le playbook contre une **VM locale**
(VirtualBox / Vagrant) ou la machine locale via le groupe `local` :

```bash
ansible-playbook -i inventory.ini playbook.yml --limit local --ask-vault-pass
```

Cela démontre l'automatisation complète du déploiement sans coût d'infrastructure.

## Sécurité (DevSecOps)

- Secrets chiffrés avec **Ansible Vault** — jamais en clair dans le dépôt.
- Fichier `.env` généré avec permissions `0600` sur le serveur.
- Playbook **idempotent** : rejouable sans effet de bord.
