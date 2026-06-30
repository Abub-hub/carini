CREATE DATABASE IF NOT EXISTS carini3
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE carini3;

CREATE TABLE IF NOT EXISTS companies (
  id        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name      VARCHAR(100)  NOT NULL,
  email     VARCHAR(150)  NOT NULL UNIQUE,
  password  VARCHAR(255)  NOT NULL,
  whatsapp  VARCHAR(20)   DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS cars (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  carName     VARCHAR(100)  NOT NULL,
  plaque      VARCHAR(30)   NOT NULL UNIQUE,
  brand       VARCHAR(60)   DEFAULT NULL,
  model       VARCHAR(60)   DEFAULT NULL,
  year        SMALLINT UNSIGNED DEFAULT NULL,
  color       VARCHAR(40)   DEFAULT NULL,
  fuelType    ENUM('Essence','Diesel','Hybride','Électrique') DEFAULT NULL,
  transmission ENUM('Manuelle','Automatique') DEFAULT NULL,
  seats       TINYINT UNSIGNED DEFAULT NULL,
  mileage     INT UNSIGNED  DEFAULT NULL,
  dailyPrice  DECIMAL(10,2) NOT NULL DEFAULT 0,
  status      ENUM('disponible','maintenance') NOT NULL DEFAULT 'disponible',
  description TEXT          DEFAULT NULL,
  companyId   INT UNSIGNED  NOT NULL,
  FOREIGN KEY (companyId) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS car_images (
  id        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  car_id    INT UNSIGNED  NOT NULL,
  url       VARCHAR(255)  NOT NULL,
  position  INT UNSIGNED  NOT NULL DEFAULT 0,
  FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS clients (
  id        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nom       VARCHAR(100)  NOT NULL,
  prenom    VARCHAR(100)  NOT NULL,
  telephone VARCHAR(20)   NOT NULL,
  email     VARCHAR(150)  DEFAULT NULL,
  cin       VARCHAR(40)   DEFAULT NULL,
  permis    VARCHAR(40)   DEFAULT NULL,
  address   VARCHAR(255)  DEFAULT NULL,
  companyId INT UNSIGNED  NOT NULL,
  FOREIGN KEY (companyId) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS location (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  car_id      INT UNSIGNED  NOT NULL,
  client_id   INT UNSIGNED  NOT NULL,
  dateDebut   DATE          NOT NULL,
  dateFin     DATE          NOT NULL,
  totalPrice  DECIMAL(10,2) DEFAULT NULL,
  deposit     DECIMAL(10,2) DEFAULT NULL,
  status      ENUM('en_cours','terminee','annulee') NOT NULL DEFAULT 'en_cours',
  companyId   INT UNSIGNED  NOT NULL,
  FOREIGN KEY (car_id)    REFERENCES cars(id)      ON DELETE CASCADE,
  FOREIGN KEY (client_id) REFERENCES clients(id)   ON DELETE CASCADE,
  FOREIGN KEY (companyId) REFERENCES companies(id) ON DELETE CASCADE
);

-- ── Migration for existing databases (MySQL 8+) ──
-- Safe to re-run: each statement is a no-op if the column/table already exists.
ALTER TABLE cars
  ADD COLUMN IF NOT EXISTS brand        VARCHAR(60)   DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS model        VARCHAR(60)   DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS year         SMALLINT UNSIGNED DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS color        VARCHAR(40)   DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS fuelType     ENUM('Essence','Diesel','Hybride','Électrique') DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS transmission ENUM('Manuelle','Automatique') DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS seats        TINYINT UNSIGNED DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS mileage      INT UNSIGNED  DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS dailyPrice   DECIMAL(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS status       ENUM('disponible','maintenance') NOT NULL DEFAULT 'disponible',
  ADD COLUMN IF NOT EXISTS description  TEXT DEFAULT NULL;

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS email   VARCHAR(150) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS cin     VARCHAR(40)  DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS permis  VARCHAR(40)  DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS address VARCHAR(255) DEFAULT NULL;

ALTER TABLE location
  ADD COLUMN IF NOT EXISTS totalPrice DECIMAL(10,2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deposit    DECIMAL(10,2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS status     ENUM('en_cours','terminee','annulee') NOT NULL DEFAULT 'en_cours';

CREATE TABLE IF NOT EXISTS car_images (
  id        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  car_id    INT UNSIGNED  NOT NULL,
  url       VARCHAR(255)  NOT NULL,
  position  INT UNSIGNED  NOT NULL DEFAULT 0,
  FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE CASCADE
);
