-- ==============================================
-- Table `users`
-- ==============================================
CREATE TABLE users (
  id           VARCHAR(36)  NOT NULL,
  email        VARCHAR(180) NOT NULL,
  roles        JSON         NOT NULL,
  password     VARCHAR(255) NOT NULL,
  status       TINYINT(1)   NOT NULL DEFAULT 1,
  name         VARCHAR(100) NOT NULL,
  surname      VARCHAR(100) NOT NULL,
  nickname     VARCHAR(100) NULL,
  city         VARCHAR(100) NULL,
  registered_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  birthdate    DATE         NULL,
  deleted_at   DATETIME     NULL,
  cookies_accepted          TINYINT(1) NOT NULL DEFAULT 0,
  cookies_accepted_at       DATETIME   NULL,
  terms_accepted            TINYINT(1) NOT NULL DEFAULT 0,
  terms_accepted_at         DATETIME   NULL,
  privacy_policy_accepted   TINYINT(1) NOT NULL DEFAULT 0,
  privacy_policy_accepted_at DATETIME  NULL,
  marketing_consent         TINYINT(1) NOT NULL DEFAULT 0,
  marketing_consent_at      DATETIME   NULL,
  PRIMARY KEY (id),
  UNIQUE KEY UNIQ_EMAIL (email)
) DEFAULT CHARACTER SET utf8mb4;

INSERT INTO users (id, name, surname, email, roles, password, birthdate)
VALUES (UUID(), 'Johny', 'Jein', 'jhony@mail.com', '["ROLE_USER"]', '123456', '1990-01-01');

-- ==============================================
-- Table `categories`
-- ==============================================
CREATE TABLE categories (
  id   INT          AUTO_INCREMENT NOT NULL,
  name VARCHAR(100) NOT NULL,
  PRIMARY KEY (id)
) DEFAULT CHARACTER SET utf8mb4;

INSERT INTO categories (name) VALUES ('Video'), ('Photo');

-- ==============================================
-- Table `resources`
-- ==============================================
CREATE TABLE resources (
  id               INT AUTO_INCREMENT NOT NULL,
  user_id          VARCHAR(36)  NOT NULL,
  category_id      INT          NOT NULL,
  popular          INT          NOT NULL DEFAULT 0,
  favori           INT          NOT NULL DEFAULT 0,
  saved            INT          NOT NULL DEFAULT 0,
  description      LONGTEXT     NULL,
  content          LONGTEXT     NULL,
  type             VARCHAR(10)  NOT NULL,
  status           VARCHAR(20)  NOT NULL DEFAULT 'pending',
  restreint        TINYINT(1)   NULL,
  date_creation    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  date_publication DATETIME     NULL,
  deleted_at       DATETIME     NULL,
  PRIMARY KEY (id),
  INDEX IDX_user_id (user_id),
  INDEX IDX_category_id (category_id),
  CONSTRAINT FK_resources_user     FOREIGN KEY (user_id)     REFERENCES users (id),
  CONSTRAINT FK_resources_category FOREIGN KEY (category_id) REFERENCES categories (id)
) DEFAULT CHARACTER SET utf8mb4;

-- ==============================================
-- Table `comments`
-- ==============================================
CREATE TABLE comments (
  id          INT AUTO_INCREMENT NOT NULL,
  user_id     VARCHAR(36) NOT NULL,
  resource_id INT         NOT NULL,
  status      VARCHAR(20) NOT NULL DEFAULT 'pending',
  date        DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  content     LONGTEXT    NULL,
  PRIMARY KEY (id),
  INDEX IDX_comment_user (user_id),
  INDEX IDX_comment_resource (resource_id),
  CONSTRAINT FK_comments_user     FOREIGN KEY (user_id)     REFERENCES users (id),
  CONSTRAINT FK_comments_resource FOREIGN KEY (resource_id) REFERENCES resources (id)
) DEFAULT CHARACTER SET utf8mb4;

-- ==============================================
-- Table `statistiques`
-- ==============================================
CREATE TABLE statistiques (
  id            INT AUTO_INCREMENT NOT NULL,
  resource_id   INT      NOT NULL,
  date_creation DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  views         INT      NOT NULL DEFAULT 0,
  favorites     INT      NOT NULL DEFAULT 0,
  saves         INT      NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY UNIQ_resource_id (resource_id),
  CONSTRAINT FK_statistiques_resource FOREIGN KEY (resource_id) REFERENCES resources (id)
) DEFAULT CHARACTER SET utf8mb4;
