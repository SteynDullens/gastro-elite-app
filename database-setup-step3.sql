-- Step 3: Add foreign key constraints
ALTER TABLE users ADD CONSTRAINT fk_users_company FOREIGN KEY (companyId) REFERENCES companies(id) ON DELETE SET NULL;
ALTER TABLE companies ADD CONSTRAINT fk_companies_owner FOREIGN KEY (ownerId) REFERENCES users(id) ON DELETE CASCADE;








