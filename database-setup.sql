-- Gastro-Elite Database Setup
-- Run this in phpMyAdmin SQL tab

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  firstName VARCHAR(100) NOT NULL,
  lastName VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  account_type ENUM('user', 'business', 'admin') DEFAULT 'user',
  companyId INT NULL,
  isActive BOOLEAN DEFAULT true,
  emailVerified BOOLEAN DEFAULT false,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_name VARCHAR(255) NOT NULL,
  vat_number VARCHAR(50),
  kvk_number VARCHAR(50),
  address TEXT,
  contact_name VARCHAR(100),
  contact_phone VARCHAR(50),
  contact_email VARCHAR(150),
  kvk_document_path VARCHAR(500),
  status ENUM('pending','approved','rejected') DEFAULT 'pending',
  rejection_reason TEXT NULL,
  ownerId INT NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Add foreign key constraint for users.companyId
ALTER TABLE users ADD CONSTRAINT fk_users_company FOREIGN KEY (companyId) REFERENCES companies(id) ON DELETE SET NULL;

-- Add foreign key constraint for companies.ownerId
ALTER TABLE companies ADD CONSTRAINT fk_companies_owner FOREIGN KEY (ownerId) REFERENCES users(id) ON DELETE CASCADE;

-- Create recipes table
CREATE TABLE IF NOT EXISTS recipes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  image VARCHAR(500),
  batchSize INT,
  servings INT,
  instructions TEXT,
  userId INT NOT NULL,
  companyId INT NULL,
  isPublic BOOLEAN DEFAULT false,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (companyId) REFERENCES companies(id) ON DELETE SET NULL
);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create recipe_categories junction table
CREATE TABLE IF NOT EXISTS recipe_categories (
  recipeId INT,
  categoryId INT,
  PRIMARY KEY (recipeId, categoryId),
  FOREIGN KEY (recipeId) REFERENCES recipes(id) ON DELETE CASCADE,
  FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE CASCADE
);

-- Create ingredients table
CREATE TABLE IF NOT EXISTS ingredients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  recipeId INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit ENUM('piece', 'g', 'kg', 'l', 'ml', 'tsp', 'tbsp', 'cup') NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (recipeId) REFERENCES recipes(id) ON DELETE CASCADE
);

-- Create error_logs table
CREATE TABLE IF NOT EXISTS error_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  level ENUM('error', 'warning', 'info') NOT NULL,
  message TEXT NOT NULL,
  stack TEXT,
  userId INT NULL,
  ipAddress VARCHAR(45),
  userAgent TEXT,
  url VARCHAR(500),
  method VARCHAR(10),
  statusCode INT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL
);

-- Create password_reset_tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  token VARCHAR(255) NOT NULL,
  expiresAt TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT false,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Create employee_links table
CREATE TABLE IF NOT EXISTS employee_links (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  user_id INT NOT NULL,
  status ENUM('pending','accepted') DEFAULT 'pending',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_employee_link (company_id, user_id)
);

-- Insert default categories
INSERT IGNORE INTO categories (name) VALUES
('Ontbijt'), ('Lunch'), ('Diner'), ('Dessert'), ('Snack'), ('Drank'),
('Breakfast'), ('Appetizer'), ('Main Course'), ('Beverage');

-- Create admin user (password: admin123!)
INSERT IGNORE INTO users (email, password, firstName, lastName, account_type, emailVerified, isActive)
VALUES ('admin@gastro-elite.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4Zv6P7h7Yu', 'Admin', 'User', 'admin', true, true);

-- Note: The admin password is 'admin123!' - change this after first login
