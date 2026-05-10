-- MySQL Workbench Forward Engineering

-- -----------------------------------------------------
-- Table `users`
-- -----------------------------------------------------

CREATE TABLE users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100),
  surname VARCHAR(100), 
  email VARCHAR(255) UNIQUE,
  password TEXT,
  date_registre DATETIME DEFAULT CURRENT_TIMESTAMP,
  statu BOOLEAN DEFAULT TRUE, 
  role ENUM('citizen','moderator','admin','superadmin') DEFAULT 'citizen',
  deleted_at DATETIME NULL
);

--
-- Dumping data for table `utilisateur`
--
INSERT INTO users (name, surname, email, password) VALUES ('Johny', 'Jein', 'jhony@mail.com', '123456');
ALTER TABLE users 
ADD nickname VARCHAR(100) NULL,
ADD city VARCHAR(100) NULL,
ADD birthdate DATE NULL;
-- -----------------------------------------------------
-- Table `categories`
-- -----------------------------------------------------

CREATE TABLE categories (
  category_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100)
);

INSERT INTO categories (name) VALUES ('Video'), ('Photo');

-- -----------------------------------------------------
-- Table `resources`
-- -----------------------------------------------------

CREATE TABLE resources (
  resource_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  category_id INT,
  popular INT DEFAULT 0,
  favori INT DEFAULT 0,
  saved INT DEFAULT 0,
  description TEXT,
  content TEXT,
  type ENUM('video','photo'),
  status ENUM('pending','approved','rejected') DEFAULT 'pending',
  restreint BOOLEAN,
  date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
  date_publication DATETIME NULL,
  deleted_at DATETIME NULL,

  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (category_id) REFERENCES categories(category_id)
);

INSERT INTO resources (user_id, category_id, description, content, type) VALUES (1, 1, 'My first video', 'video.mp4', 'video');

-- -----------------------------------------------------
-- Table `comments`
-- -----------------------------------------------------

CREATE TABLE comments (
  comment_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  resource_id INT,
  statut ENUM('pending','approved','rejected') DEFAULT 'pending',
  date DATETIME DEFAULT CURRENT_TIMESTAMP,
  content TEXT,

  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (resource_id) REFERENCES resources(resource_id)
);

INSERT INTO comments (user_id, resource_id, content) VALUES (1, 1, 'Nice video!');

-- -----------------------------------------------------
-- Table `statistiques`
-- -----------------------------------------------------

CREATE TABLE statistiques (
  statistique_id INT AUTO_INCREMENT PRIMARY KEY,
  resource_id INT,
  date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
  views INT DEFAULT 0,
  favorites INT DEFAULT 0,
  saves INT DEFAULT 0,

  FOREIGN KEY (resource_id) REFERENCES resources(resource_id)
);

INSERT INTO statistiques (resource_id, views, favorites, saves)
VALUES (1, 10, 2, 1);