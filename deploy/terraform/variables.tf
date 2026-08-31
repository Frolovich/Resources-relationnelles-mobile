# ==============================================
# Terraform — Variables
# ==============================================

variable "project_name" {
  description = "Nom du projet (préfixe des ressources)"
  type        = string
  default     = "ressources-relationnelles"
}

variable "environment" {
  description = "Environnement cible (qa, preprod, production)"
  type        = string
  default     = "qa"

  validation {
    condition     = contains(["qa", "preprod", "production"], var.environment)
    error_message = "L'environnement doit être : qa, preprod ou production."
  }
}

variable "server_image" {
  description = "Image de base du serveur cible (démo). En prod : image d'OS de la VM cloud."
  type        = string
  default     = "debian:12-slim"
}
