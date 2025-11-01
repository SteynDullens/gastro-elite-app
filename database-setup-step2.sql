-- Step 2: Create companies table
CREATE TABLE companies (
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










