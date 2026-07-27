-- Add is_active to suppliers and customers for soft delete
ALTER TABLE suppliers ADD COLUMN is_active boolean NOT NULL DEFAULT true;
ALTER TABLE customers ADD COLUMN is_active boolean NOT NULL DEFAULT true;
