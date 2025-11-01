-- Step 4: Create remaining tables
CREATE TABLE recipes (
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

CREATE TABLE categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE recipe_categories (
  recipeId INT,
  categoryId INT,
  PRIMARY KEY (recipeId, categoryId),
  FOREIGN KEY (recipeId) REFERENCES recipes(id) ON DELETE CASCADE,
  FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE CASCADE
);

CREATE TABLE ingredients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  recipeId INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit ENUM('piece', 'g', 'kg', 'l', 'ml', 'tsp', 'tbsp', 'cup') NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (recipeId) REFERENCES recipes(id) ON DELETE CASCADE
);










