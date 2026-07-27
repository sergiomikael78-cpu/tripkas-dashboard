-- =============================================================================
-- Stage 4: RPC for processing Sales (Transaksi Atomik Penjualan)
-- =============================================================================

-- 1. Helper function to bypass RLS and get the actual cost price of a product
-- This is needed because Partner/Staff cannot view `default_buy_price` directly due to masking.
DROP FUNCTION IF EXISTS get_product_cost_price(uuid);
CREATE OR REPLACE FUNCTION get_product_cost_price(p_product_id uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_cost_price numeric;
    v_workspace_id uuid;
    my_workspace_id uuid;
BEGIN
    my_workspace_id := get_user_workspace();
    
    SELECT default_buy_price, workspace_id INTO v_cost_price, v_workspace_id
    FROM products
    WHERE id = p_product_id;

    IF v_workspace_id != my_workspace_id THEN
        RAISE EXCEPTION 'Unauthorized workspace';
    END IF;

    RETURN coalesce(v_cost_price, 0);
END;
$$;

GRANT EXECUTE ON FUNCTION get_product_cost_price TO authenticated;

-- 2. Main RPC for processing sales
DROP FUNCTION IF EXISTS process_sale(json);
CREATE OR REPLACE FUNCTION process_sale(payload json)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    my_workspace_id uuid;
    my_role text;
    v_sale_id uuid;
    v_customer_id uuid;
    v_trip_id uuid;
    v_sale_date date;
    v_notes text;
    v_payment_status text;
    v_due_date date;
    v_item json;
    
    -- Item vars
    v_product_id uuid;
    v_quantity numeric;
    v_sell_price numeric;
    v_cost_price numeric;
    v_profit numeric;
BEGIN
    my_workspace_id := get_user_workspace();
    my_role := get_user_role(my_workspace_id);
    
    IF my_role NOT IN ('owner', 'admin', 'partner') THEN
        RAISE EXCEPTION 'Role % is not authorized to create sales', my_role;
    END IF;

    -- Extract payload
    v_customer_id := (payload->>'customer_id')::uuid;
    v_trip_id := NULLIF(payload->>'trip_id', '')::uuid;
    v_sale_date := (payload->>'sale_date')::date;
    v_notes := payload->>'notes';
    v_payment_status := COALESCE(payload->>'payment_status', 'lunas');
    v_due_date := NULLIF(payload->>'due_date', '')::date;

    -- Verify customer ownership
    IF NOT EXISTS (SELECT 1 FROM customers WHERE id = v_customer_id AND workspace_id = my_workspace_id) THEN
        RAISE EXCEPTION 'Customer not found or does not belong to this workspace';
    END IF;

    -- Insert sale
    INSERT INTO sales (
        workspace_id, 
        customer_id, 
        trip_id, 
        sale_date, 
        notes, 
        payment_status, 
        due_date,
        created_by
    ) VALUES (
        my_workspace_id,
        v_customer_id,
        v_trip_id,
        v_sale_date,
        v_notes,
        v_payment_status::payment_status,
        v_due_date,
        auth.uid()
    ) RETURNING id INTO v_sale_id;

    -- Process items
    FOR v_item IN SELECT * FROM json_array_elements(payload->'items')
    LOOP
        v_product_id := (v_item->>'product_id')::uuid;
        v_quantity := (v_item->>'quantity')::numeric;
        v_sell_price := (v_item->>'sell_price')::numeric;
        
        IF v_quantity <= 0 THEN
            RAISE EXCEPTION 'Quantity must be positive';
        END IF;
        
        -- Get real cost price securely
        v_cost_price := get_product_cost_price(v_product_id);
        
        -- Calculate profit for this line item
        v_profit := (v_sell_price - v_cost_price) * v_quantity;

        -- Insert sale item
        INSERT INTO sale_items (
            sale_id,
            product_id,
            quantity,
            sell_price,
            cost_price_snapshot,
            profit
        ) VALUES (
            v_sale_id,
            v_product_id,
            v_quantity,
            v_sell_price,
            v_cost_price,
            v_profit
        );

        -- Record stock movement (negative quantity for sales)
        INSERT INTO stock_movements (
            workspace_id,
            product_id,
            quantity,
            type,
            reference_type,
            reference_id,
            created_by
        ) VALUES (
            my_workspace_id,
            v_product_id,
            -v_quantity,
            'out',
            'sale',
            v_sale_id,
            auth.uid()
        );
    END LOOP;

    RETURN v_sale_id;
END;
$$;

GRANT EXECUTE ON FUNCTION process_sale TO authenticated;
