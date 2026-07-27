-- =============================================================================
-- Migration: Automatic Audit Log Triggers
-- =============================================================================

CREATE OR REPLACE FUNCTION process_audit_log()
RETURNS TRIGGER 
SECURITY DEFINER
AS $$
DECLARE
    v_workspace_id uuid;
    v_entity_id uuid;
    v_action text;
    v_metadata jsonb;
    v_user_id uuid;
BEGIN
    -- Get the user ID
    v_user_id := auth.uid();
    
    -- If no user is authenticated (e.g. system operations), we might skip or log as null.
    -- But since this is user-driven, we expect auth.uid()
    IF v_user_id IS NULL THEN
        -- try to find created_by in NEW if available, else skip?
        -- For robust audit, we'll allow null user_id but it's rare.
    END IF;

    -- Determine operation type and set variables
    IF (TG_OP = 'DELETE') THEN
        v_workspace_id := OLD.workspace_id;
        v_entity_id := OLD.id;
        v_action := 'delete_' || trim(trailing 's' from TG_TABLE_NAME);
        v_metadata := jsonb_build_object('old_data', row_to_json(OLD));
    ELSIF (TG_OP = 'UPDATE') THEN
        v_workspace_id := NEW.workspace_id;
        v_entity_id := NEW.id;
        v_action := 'update_' || trim(trailing 's' from TG_TABLE_NAME);
        v_metadata := jsonb_build_object('changes', row_to_json(NEW));
    ELSIF (TG_OP = 'INSERT') THEN
        v_workspace_id := NEW.workspace_id;
        v_entity_id := NEW.id;
        v_action := 'create_' || trim(trailing 's' from TG_TABLE_NAME);
        -- For inserts, storing the whole row might be too much, but useful.
        -- Let's store a brief summary or just the ID since the record exists.
        v_metadata := jsonb_build_object('new_data', row_to_json(NEW));
    END IF;

    -- Insert into activity logs
    IF v_workspace_id IS NOT NULL THEN
        INSERT INTO activity_logs (
            workspace_id, 
            user_id, 
            action, 
            entity_type, 
            entity_id, 
            metadata
        ) VALUES (
            v_workspace_id,
            v_user_id,
            v_action,
            TG_TABLE_NAME,
            v_entity_id,
            v_metadata
        );
    END IF;

    IF (TG_OP = 'DELETE') THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to core transaction tables
-- 1. Sales
DROP TRIGGER IF EXISTS trg_audit_sales ON sales;
CREATE TRIGGER trg_audit_sales
AFTER INSERT OR UPDATE OR DELETE ON sales
FOR EACH ROW EXECUTE FUNCTION process_audit_log();

-- 2. Purchases
DROP TRIGGER IF EXISTS trg_audit_purchases ON purchases;
CREATE TRIGGER trg_audit_purchases
AFTER INSERT OR UPDATE OR DELETE ON purchases
FOR EACH ROW EXECUTE FUNCTION process_audit_log();

-- 3. Expenses
DROP TRIGGER IF EXISTS trg_audit_expenses ON expenses;
CREATE TRIGGER trg_audit_expenses
AFTER INSERT OR UPDATE OR DELETE ON expenses
FOR EACH ROW EXECUTE FUNCTION process_audit_log();

-- 4. Products (Master data is also good to track)
DROP TRIGGER IF EXISTS trg_audit_products ON products;
CREATE TRIGGER trg_audit_products
AFTER INSERT OR UPDATE OR DELETE ON products
FOR EACH ROW EXECUTE FUNCTION process_audit_log();

-- 5. Customers (Master data)
DROP TRIGGER IF EXISTS trg_audit_customers ON customers;
CREATE TRIGGER trg_audit_customers
AFTER INSERT OR UPDATE OR DELETE ON customers
FOR EACH ROW EXECUTE FUNCTION process_audit_log();

-- 6. Suppliers (Master data)
DROP TRIGGER IF EXISTS trg_audit_suppliers ON suppliers;
CREATE TRIGGER trg_audit_suppliers
AFTER INSERT OR UPDATE OR DELETE ON suppliers
FOR EACH ROW EXECUTE FUNCTION process_audit_log();

-- 7. Stock Movements (Already manually tracked in adjust_stock, but we can track all)
-- We will just track IN/OUT here, but since adjust_stock manually inserts, it might duplicate.
-- Actually, let's track stock_movements here and remove the manual insert from adjust_stock if needed,
-- or just track it and let adjust_stock have two logs. Better to just track it via trigger and it covers all.
DROP TRIGGER IF EXISTS trg_audit_stock_movements ON stock_movements;
CREATE TRIGGER trg_audit_stock_movements
AFTER INSERT OR UPDATE OR DELETE ON stock_movements
FOR EACH ROW EXECUTE FUNCTION process_audit_log();
