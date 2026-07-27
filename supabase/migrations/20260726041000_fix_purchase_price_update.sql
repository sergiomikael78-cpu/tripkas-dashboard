-- Helper function to bypass RLS for updating product cost price safely
DROP FUNCTION IF EXISTS update_product_cost_price(uuid, numeric);
CREATE OR REPLACE FUNCTION update_product_cost_price(p_product_id uuid, p_buy_price numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Bypass RLS
SET search_path = public
AS $$
DECLARE
    v_workspace_id uuid;
BEGIN
    -- Validasi caller: must be owner, admin, or partner of the product's workspace
    SELECT workspace_id INTO v_workspace_id FROM products WHERE id = p_product_id;
    
    IF v_workspace_id IS NULL THEN
        RAISE EXCEPTION 'Product not found';
    END IF;

    IF v_workspace_id != get_user_workspace() THEN
        RAISE EXCEPTION 'Unauthorized workspace';
    END IF;

    IF get_user_role(v_workspace_id) NOT IN ('owner', 'admin', 'partner') THEN
        RAISE EXCEPTION 'Unauthorized role';
    END IF;

    UPDATE products 
    SET default_buy_price = p_buy_price 
    WHERE id = p_product_id;
END;
$$;

GRANT EXECUTE ON FUNCTION update_product_cost_price TO authenticated;

-- Update process_purchase to use the helper function
CREATE OR REPLACE FUNCTION process_purchase(payload json)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    my_workspace_id uuid;
    my_user_id uuid;
    v_trip_id uuid;
    v_supplier_id uuid;
    v_purchase_date date;
    v_notes text;
    v_purchase_id uuid;
    
    item json;
    v_product_id uuid;
    v_quantity numeric;
    v_buy_price numeric;
    v_item_id uuid;
BEGIN
    -- Get user workspace and user id
    my_workspace_id := get_user_workspace();
    my_user_id := auth.uid();
    
    IF my_workspace_id IS NULL THEN
        RAISE EXCEPTION 'User does not belong to any workspace';
    END IF;

    -- Extract main fields
    v_trip_id := (payload->>'trip_id')::uuid;
    v_supplier_id := (payload->>'supplier_id')::uuid;
    v_purchase_date := (payload->>'purchase_date')::date;
    v_notes := payload->>'notes';

    -- Validate Trip
    IF NOT EXISTS (SELECT 1 FROM trips WHERE id = v_trip_id AND workspace_id = my_workspace_id) THEN
        RAISE EXCEPTION 'Invalid trip_id or unauthorized';
    END IF;

    -- Validate Supplier
    IF NOT EXISTS (SELECT 1 FROM suppliers WHERE id = v_supplier_id AND workspace_id = my_workspace_id) THEN
        RAISE EXCEPTION 'Invalid supplier_id or unauthorized';
    END IF;

    -- Insert Purchase
    INSERT INTO purchases (workspace_id, trip_id, supplier_id, purchase_date, notes, created_by)
    VALUES (my_workspace_id, v_trip_id, v_supplier_id, v_purchase_date, v_notes, my_user_id)
    RETURNING id INTO v_purchase_id;

    -- Loop items
    FOR item IN SELECT * FROM json_array_elements(payload->'items')
    LOOP
        v_product_id := (item->>'product_id')::uuid;
        v_quantity := (item->>'quantity')::numeric;
        v_buy_price := (item->>'buy_price')::numeric;

        -- Validate Product
        IF NOT EXISTS (SELECT 1 FROM products WHERE id = v_product_id AND workspace_id = my_workspace_id) THEN
            RAISE EXCEPTION 'Invalid product_id or unauthorized: %', v_product_id;
        END IF;

        -- Insert Purchase Item
        INSERT INTO purchase_items (purchase_id, product_id, quantity, buy_price)
        VALUES (v_purchase_id, v_product_id, v_quantity, v_buy_price)
        RETURNING id INTO v_item_id;

        -- Insert Stock Movement
        INSERT INTO stock_movements (workspace_id, product_id, type, quantity, reference_type, reference_id, reason, created_by)
        VALUES (my_workspace_id, v_product_id, 'in', v_quantity, 'purchase', v_item_id, 'Pembelian ' || v_purchase_id, my_user_id);

        -- Update Product Buy Price using helper
        PERFORM update_product_cost_price(v_product_id, v_buy_price);
    END LOOP;

    RETURN v_purchase_id;
END;
$$;
