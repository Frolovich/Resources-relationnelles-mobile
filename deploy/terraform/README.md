# Terraform — Provisionnement de l'infrastructure (IaC)

Ce dossier provisionne l'infrastructure de l'application avec **Terraform**,
en cohérence avec la démarche DevSecOps décrite dans `docs/plan-deploiement.md`.

## Place dans la chaîne de déploiement

```
Terraform (crée l'infrastructure)  →  Ansible (configure)  →  Docker (exécute)
```

- **Terraform** : crée le réseau, les volumes et le serveur cible.
- **Ansible** : installe Docker et déploie l'application sur ce serveur (`../ansible/`).
- **Docker** : exécute les conteneurs (`../../docker-compose.prod.yml`).

## Contexte pédagogique

Le provider utilisé est **Docker** (`kreuzwerker/docker`), ce qui permet d'exécuter
réellement `terraform apply` en local, **sans cloud ni coût**. En production réelle,
on remplacerait ce provider par un provider cloud (Scaleway, OVH, AWS) créant de vraies VM.

## Exécution sans installation locale (via Docker)

Terraform n'a pas besoin d'être installé : on l'exécute dans un conteneur.
Depuis ce dossier (`deploy/terraform`) :

```powershell
# 1. Initialiser (télécharge le provider Docker)
docker run --rm -it `
  -v "${PWD}:/work" -w /work `
  -v /var/run/docker.sock:/var/run/docker.sock `
  hashicorp/terraform:latest init

# 2. Valider la configuration
docker run --rm -it -v "${PWD}:/work" -w /work `
  hashicorp/terraform:latest validate

# 3. Prévisualiser le plan
docker run --rm -it `
  -v "${PWD}:/work" -w /work `
  -v /var/run/docker.sock:/var/run/docker.sock `
  hashicorp/terraform:latest plan

# 4. Appliquer (crée réseau + volumes + serveur)
docker run --rm -it `
  -v "${PWD}:/work" -w /work `
  -v /var/run/docker.sock:/var/run/docker.sock `
  hashicorp/terraform:latest apply -auto-approve

# 5. Détruire (nettoyage)
docker run --rm -it `
  -v "${PWD}:/work" -w /work `
  -v /var/run/docker.sock:/var/run/docker.sock `
  hashicorp/terraform:latest destroy -auto-approve
```

> Le montage `-v /var/run/docker.sock:/var/run/docker.sock` permet à Terraform
> (dans le conteneur) de piloter le Docker de la machine hôte.

## Avec Terraform installé localement

```bash
terraform init
terraform plan
terraform apply
```

## Variables

Voir `variables.tf`. Pour personnaliser :

```bash
cp terraform.tfvars.example terraform.tfvars
# éditer terraform.tfvars (environment, project_name, ...)
```

## Ressources créées

| Ressource | Rôle |
|-----------|------|
| `docker_network.app_network` | Réseau isolé (équivalent VPC) |
| `docker_volume.mysql_data` | Données MySQL persistantes |
| `docker_volume.media_data` | Médias (images / vidéos) |
| `docker_container.app_server` | Serveur cible (démo) pour Ansible |
