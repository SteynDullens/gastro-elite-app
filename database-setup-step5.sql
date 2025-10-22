-- Step 5: Create additional tables
CREATE TABLE error_logs (
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

CREATE TABLE password_reset_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  token VARCHAR(255) NOT NULL,
  expiresAt TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT false,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE employee_links (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  user_id INT NOT NULL,
  status ENUM('pending','accepted') DEFAULT 'pending',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_employee_link (company_id, user_id)
);








