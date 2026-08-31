# ==============================================
# Terraform — Infrastructure as Code (provider Docker)
# ==============================================
# Provisionne l'infrastructure de base de l'application :
#   - un réseau isolé
#   - des volumes persistants (données MySQL, médias)
#   - (démo) un conteneur "serveur" cible pour Ansible
#
# Contexte pédagogique : le provider Docker permet d'exécuter réellement
# `terraform apply` en local, sans cloud ni coût. En production réelle,
# on remplacerait ce provider par un provider cloud (Scaleway, OVH, AWS)
# qui créerait de vraies VM ; Ansible les configurerait ensuite.
#
# Chaîne complète :
#   Terraform (crée l'infrastructure) → Ansible (configure) → Docker (exécute)
# ==============================================

terraform {
  required_version = ">= 1.5"
  required_providers {
    docker = {
      source  = "kreuzwerker/docker"
      version = "~> 3.0"
    }
  }
}

provider "docker" {}

# ----------------------------------------------------
# Réseau isolé (équivalent d'un VPC / réseau privé)
# ----------------------------------------------------
resource "docker_network" "app_network" {
  name   = "${var.project_name}-${var.environment}-net"
  driver = "bridge"
}

# ----------------------------------------------------
# Volumes persistants
# ----------------------------------------------------
resource "docker_volume" "mysql_data" {
  name = "${var.project_name}-${var.environment}-mysql-data"
}

resource "docker_volume" "media_data" {
  name = "${var.project_name}-${var.environment}-media-data"
}

# ----------------------------------------------------
# (Démo) Conteneur "serveur" cible — représente la VM
# que Terraform créerait dans le cloud. Ansible s'y connecterait
# pour installer Docker et lancer l'application.
# ----------------------------------------------------
resource "docker_image" "server_base" {
  name = var.server_image
}

resource "docker_container" "app_server" {
  name  = "${var.project_name}-${var.environment}-server"
  image = docker_image.server_base.image_id

  # Maintient le conteneur actif (simule une VM allumée)
  command = ["sleep", "infinity"]

  networks_advanced {
    name = docker_network.app_network.name
  }

  volumes {
    volume_name    = docker_volume.media_data.name
    container_path = "/var/www/media"
  }

  labels {
    label = "environment"
    value = var.environment
  }
  labels {
    label = "managed-by"
    value = "terraform"
  }
}
