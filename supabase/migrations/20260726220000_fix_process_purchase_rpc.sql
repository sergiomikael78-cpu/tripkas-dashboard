-- FIX: Update process_purchase RPC to call the correct helper function (update_product_cost_price)

CREATE OR REPLACE FUNCTION process_purchase(payload json)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    my_workspace_id uuid;
    my_role text;
    v_purchase_id uuid;
    v_supplier_id uuid;
    v_trip_id uuid;
    v_purchase_date date;
    v_notes text;
    v_item json;
    
    -- Item vars
    v_product_id uuid;
    v_quantity numeric;
    v_buy_price numeric;
BEGIN
    my_workspace_id := get_user_workspace();
    my_role := get_user_role(my_workspace_id);
    
    IF my_role NOT IN ('owner', 'admin', 'partner') THEN
        RAISE EXCEPTION 'Role % is not authorized to create purchases', my_role;
    END IF;

    -- Extract payload
    v_supplier_id := (payload->>'supplier_id')::uuid;
    v_trip_id := (payload->>'trip_id')::uuid;
    v_purchase_date := (payload->>'purchase_date')::date;
    v_notes := payload->>'notes';

    -- Insert purchase
    INSERT INTO purchases (
        workspace_id, 
        trip_id, 
        supplier_id, 
        purchase_date, 
        notes, 
        created_by
    ) VALUES (
        my_workspace_id,
        v_trip_id,
        v_supplier_id,
        v_purchase_date,
        v_notes,
        auth.uid()
    ) RETURNING id INTO v_purchase_id;

    -- Process items
    FOR v_item IN SELECT * FROM json_array_elements(payload->'items')
    LOOP
        v_product_id := (v_item->>'product_id')::uuid;
        v_quantity := (v_item->>'quantity')::numeric;
        v_buy_price := (v_item->>'buy_price')::numeric;
        
        IF v_quantity <= 0 THEN
            RAISE EXCEPTION 'Quantity must be positive';
        END IF;

        -- Check if user is owner/admin for updating default_buy_price
        -- Partner can create purchase but cannot update default_buy_price
        IF my_role IN ('owner', 'admin') THEN
            PERFORM update_product_cost_price(v_product_id, v_buy_price);
        END IF;

        -- Insert purchase item
        INSERT INTO purchase_items (
            purchase_id,
            product_id,
            quantity,
            buy_price
        ) VALUES (
            v_purchase_id,
            v_product_id,
            v_quantity,
            v_buy_price
        );

        -- Record stock movement
        INSERT INTO stock_movements (
            workspace_id,
            product_id,
            quantity,
            type,
            reference_type,
            reference_id,
            created_by,
            trip_id
        ) VALUES (
            my_workspace_id,
            v_product_id,
            v_quantity,
            'in',
            'purchase',
            v_purchase_id,
            auth.uid(),
            v_trip_id
        );
    END LOOP;

    RETURN v_purchase_id;
END;
$$;
