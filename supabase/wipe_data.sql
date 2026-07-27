-- SQL Script to wipe all transactional data for Production Release
-- This will KEEP your Workspace, Users (bos@toko.com), and Team Members.
-- It will DELETE all Trips, Products, Customers, Suppliers, Sales, Purchases, Expenses, and Logs.

BEGIN;

TRUNCATE TABLE 
  activity_logs,
  stock_movements,
  sale_items,
  sales,
  purchase_items,
  purchases,
  expenses,
  trips,
  products,
  suppliers,
  customers
CASCADE;

COMMIT;
