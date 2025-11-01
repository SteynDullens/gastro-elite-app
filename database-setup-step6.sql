-- Step 6: Insert default data
INSERT INTO categories (name) VALUES
('Ontbijt'), ('Lunch'), ('Diner'), ('Dessert'), ('Snack'), ('Drank'),
('Breakfast'), ('Appetizer'), ('Main Course'), ('Beverage');

INSERT INTO users (email, password, firstName, lastName, account_type, emailVerified, isActive)
VALUES ('admin@gastro-elite.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4Zv6P7h7Yu', 'Admin', 'User', 'admin', true, true);










