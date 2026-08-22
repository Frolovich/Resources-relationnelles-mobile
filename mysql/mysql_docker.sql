-- ==============================================
-- (Re)Sources Relationnelles — Base de données
-- Généré depuis Doctrine Entity mappings
-- ==============================================

-- Supprimer les tables existantes
DROP TABLE IF EXISTS user_resource_progress;
DROP TABLE IF EXISTS reports;
DROP TABLE IF EXISTS moderation_logs;
DROP TABLE IF EXISTS favorites;
DROP TABLE IF EXISTS comments;
DROP TABLE IF EXISTS statistiques;
DROP TABLE IF EXISTS resources;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS doctrine_migration_versions;

-- ==============================================
-- Table `users`
-- ==============================================
CREATE TABLE users (
  id VARCHAR(36) NOT NULL,
  roles JSON NOT NULL,
  email VARCHAR(180) NOT NULL,
  password VARCHAR(255) NOT NULL,
  status TINYINT DEFAULT 1 NOT NULL,
  name VARCHAR(100) NOT NULL,
  surname VARCHAR(100) NOT NULL,
  nickname VARCHAR(100) DEFAULT NULL,
  city VARCHAR(100) DEFAULT NULL,
  registered_at DATETIME NOT NULL,
  birthdate DATE DEFAULT NULL,
  deleted_at DATETIME DEFAULT NULL,
  reset_token VARCHAR(100) DEFAULT NULL,
  reset_token_expires_at DATETIME DEFAULT NULL,
  cookies_accepted TINYINT DEFAULT 0 NOT NULL,
  cookies_accepted_at DATETIME DEFAULT NULL,
  terms_accepted TINYINT DEFAULT 0 NOT NULL,
  terms_accepted_at DATETIME DEFAULT NULL,
  privacy_policy_accepted TINYINT DEFAULT 0 NOT NULL,
  privacy_policy_accepted_at DATETIME DEFAULT NULL,
  marketing_consent TINYINT DEFAULT 0 NOT NULL,
  marketing_consent_at DATETIME DEFAULT NULL,
  UNIQUE INDEX UNIQ_EMAIL (email),
  PRIMARY KEY (id)
) DEFAULT CHARACTER SET utf8mb4;

-- ==============================================
-- Table `categories`
-- ==============================================
CREATE TABLE categories (
  id INT AUTO_INCREMENT NOT NULL,
  name VARCHAR(100) NOT NULL,
  PRIMARY KEY (id)
) DEFAULT CHARACTER SET utf8mb4;

-- ==============================================
-- Table `resources`
-- ==============================================
CREATE TABLE resources (
  id INT AUTO_INCREMENT NOT NULL,
  popular INT DEFAULT 0 NOT NULL,
  favori INT DEFAULT 0 NOT NULL,
  saved INT DEFAULT 0 NOT NULL,
  description LONGTEXT DEFAULT NULL,
  content LONGTEXT DEFAULT NULL,
  type VARCHAR(10) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' NOT NULL,
  restreint TINYINT DEFAULT NULL,
  date_creation DATETIME NOT NULL,
  date_publication DATETIME DEFAULT NULL,
  deleted_at DATETIME DEFAULT NULL,
  user_id VARCHAR(36) NOT NULL,
  category_id INT NOT NULL,
  INDEX IDX_EF66EBAEA76ED395 (user_id),
  INDEX IDX_EF66EBAE12469DE2 (category_id),
  PRIMARY KEY (id),
  CONSTRAINT FK_EF66EBAEA76ED395 FOREIGN KEY (user_id) REFERENCES users (id),
  CONSTRAINT FK_EF66EBAE12469DE2 FOREIGN KEY (category_id) REFERENCES categories (id)
) DEFAULT CHARACTER SET utf8mb4;

-- ==============================================
-- Table `comments`
-- ==============================================
CREATE TABLE comments (
  id INT AUTO_INCREMENT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' NOT NULL,
  date DATETIME NOT NULL,
  content LONGTEXT DEFAULT NULL,
  user_id VARCHAR(36) NOT NULL,
  resource_id INT NOT NULL,
  INDEX IDX_5F9E962AA76ED395 (user_id),
  INDEX IDX_5F9E962A89329D25 (resource_id),
  PRIMARY KEY (id),
  CONSTRAINT FK_5F9E962AA76ED395 FOREIGN KEY (user_id) REFERENCES users (id),
  CONSTRAINT FK_5F9E962A89329D25 FOREIGN KEY (resource_id) REFERENCES resources (id)
) DEFAULT CHARACTER SET utf8mb4;

-- ==============================================
-- Table `statistiques`
-- ==============================================
CREATE TABLE statistiques (
  id INT AUTO_INCREMENT NOT NULL,
  date_creation DATETIME NOT NULL,
  views INT DEFAULT 0 NOT NULL,
  favorites INT DEFAULT 0 NOT NULL,
  saves INT DEFAULT 0 NOT NULL,
  resource_id INT NOT NULL,
  UNIQUE INDEX UNIQ_B31AB06689329D25 (resource_id),
  PRIMARY KEY (id),
  CONSTRAINT FK_B31AB06689329D25 FOREIGN KEY (resource_id) REFERENCES resources (id)
) DEFAULT CHARACTER SET utf8mb4;

-- ==============================================
-- Table `favorites`
-- ==============================================
CREATE TABLE favorites (
  id INT AUTO_INCREMENT NOT NULL,
  created_at DATETIME NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  resource_id INT NOT NULL,
  INDEX IDX_E46960F5A76ED395 (user_id),
  INDEX IDX_E46960F589329D25 (resource_id),
  UNIQUE INDEX UNIQ_USER_RESOURCE (user_id, resource_id),
  PRIMARY KEY (id),
  CONSTRAINT FK_E46960F5A76ED395 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT FK_E46960F589329D25 FOREIGN KEY (resource_id) REFERENCES resources (id) ON DELETE CASCADE
) DEFAULT CHARACTER SET utf8mb4;

-- ==============================================
-- Table `moderation_logs`
-- ==============================================
CREATE TABLE moderation_logs (
  id INT AUTO_INCREMENT NOT NULL,
  action VARCHAR(50) NOT NULL,
  reason LONGTEXT DEFAULT NULL,
  created_at DATETIME NOT NULL,
  moderator_id VARCHAR(36) NOT NULL,
  resource_id INT DEFAULT NULL,
  comment_id INT DEFAULT NULL,
  target_user_id VARCHAR(36) DEFAULT NULL,
  INDEX IDX_13191A4ED0AFA354 (moderator_id),
  INDEX IDX_13191A4E89329D25 (resource_id),
  INDEX IDX_13191A4EF8697D13 (comment_id),
  INDEX IDX_13191A4E6C066AFE (target_user_id),
  PRIMARY KEY (id),
  CONSTRAINT FK_13191A4ED0AFA354 FOREIGN KEY (moderator_id) REFERENCES users (id),
  CONSTRAINT FK_13191A4E89329D25 FOREIGN KEY (resource_id) REFERENCES resources (id) ON DELETE SET NULL,
  CONSTRAINT FK_13191A4EF8697D13 FOREIGN KEY (comment_id) REFERENCES comments (id) ON DELETE SET NULL,
  CONSTRAINT FK_13191A4E6C066AFE FOREIGN KEY (target_user_id) REFERENCES users (id)
) DEFAULT CHARACTER SET utf8mb4;

-- ==============================================
-- Table `reports`
-- ==============================================
CREATE TABLE reports (
  id INT AUTO_INCREMENT NOT NULL,
  reason LONGTEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' NOT NULL,
  created_at DATETIME NOT NULL,
  resolved_at DATETIME DEFAULT NULL,
  reporter_id VARCHAR(36) NOT NULL,
  reported_user_id VARCHAR(36) DEFAULT NULL,
  resource_id INT DEFAULT NULL,
  comment_id INT DEFAULT NULL,
  INDEX IDX_F11FA745E1CFE6F5 (reporter_id),
  INDEX IDX_F11FA745E7566E (reported_user_id),
  INDEX IDX_F11FA74589329D25 (resource_id),
  INDEX IDX_F11FA745F8697D13 (comment_id),
  PRIMARY KEY (id),
  CONSTRAINT FK_F11FA745E1CFE6F5 FOREIGN KEY (reporter_id) REFERENCES users (id),
  CONSTRAINT FK_F11FA745E7566E FOREIGN KEY (reported_user_id) REFERENCES users (id),
  CONSTRAINT FK_F11FA74589329D25 FOREIGN KEY (resource_id) REFERENCES resources (id) ON DELETE SET NULL,
  CONSTRAINT FK_F11FA745F8697D13 FOREIGN KEY (comment_id) REFERENCES comments (id) ON DELETE SET NULL
) DEFAULT CHARACTER SET utf8mb4;

-- ==============================================
-- Table `user_resource_progress`
-- ==============================================
CREATE TABLE user_resource_progress (
  id INT AUTO_INCREMENT NOT NULL,
  progress INT DEFAULT 0 NOT NULL,
  exploited TINYINT DEFAULT 0 NOT NULL,
  exploited_at DATETIME DEFAULT NULL,
  updated_at DATETIME NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  resource_id INT NOT NULL,
  INDEX IDX_749283C0A76ED395 (user_id),
  INDEX IDX_749283C089329D25 (resource_id),
  UNIQUE INDEX UNIQ_USER_RESOURCE_PROGRESS (user_id, resource_id),
  PRIMARY KEY (id),
  CONSTRAINT FK_749283C0A76ED395 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT FK_749283C089329D25 FOREIGN KEY (resource_id) REFERENCES resources (id) ON DELETE CASCADE
) DEFAULT CHARACTER SET utf8mb4;

-- ==============================================
-- Données de test
-- ==============================================

-- Comptes de test (mot de passe: Password1)
INSERT INTO users (id, name, surname, email, roles, password, birthdate, status, registered_at, terms_accepted, privacy_policy_accepted) VALUES
(UUID(), 'Citoyen', 'Test', 'citoyen@ressources.fr', '["ROLE_USER"]', '$2y$13$TF6r8kajPKrqdF3mNQtcnOauy1OvgUwX9W8Sh4aYRoKvTnBiNoUNq', '1990-01-01', 1, NOW(), 1, 1),
(UUID(), 'Modo', 'Test', 'modo@ressources.fr', '["ROLE_MODERATOR"]', '$2y$13$TF6r8kajPKrqdF3mNQtcnOauy1OvgUwX9W8Sh4aYRoKvTnBiNoUNq', '1990-01-01', 1, NOW(), 1, 1),
(UUID(), 'Admin', 'Test', 'admin@ressources.fr', '["ROLE_ADMIN"]', '$2y$13$TF6r8kajPKrqdF3mNQtcnOauy1OvgUwX9W8Sh4aYRoKvTnBiNoUNq', '1990-01-01', 1, NOW(), 1, 1),
(UUID(), 'Super', 'Admin', 'superadmin@ressources.fr', '["ROLE_SUPER_ADMIN"]', '$2y$13$TF6r8kajPKrqdF3mNQtcnOauy1OvgUwX9W8Sh4aYRoKvTnBiNoUNq', '1990-01-01', 1, NOW(), 1, 1);

-- Catégories
INSERT INTO categories (name) VALUES ('Communication'), ('Confiance en soi'), ('Gestion du stress'), ('Empathie');
