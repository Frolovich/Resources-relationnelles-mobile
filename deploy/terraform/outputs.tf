# ==============================================
# Terraform — Sorties
# ==============================================
# Ces sorties servent de "pont" vers Ansible :
# le nom/adresse du serveur créé alimente l'inventaire Ansible.

output "network_name" {
  description = "Nom du réseau créé"
  value       = docker_network.app_network.name
}

output "server_container_name" {
  description = "Nom du conteneur serveur (cible Ansible)"
  value       = docker_container.app_server.name
}

output "mysql_volume" {
  description = "Volume de données MySQL"
  value       = docker_volume.mysql_data.name
}

output "media_volume" {
  description = "Volume des médias"
  value       = docker_volume.media_data.name
}

output "environment" {
  description = "Environnement provisionné"
  value       = var.environment
}
