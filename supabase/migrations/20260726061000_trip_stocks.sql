-- Implementasi Stok Per Trip menggunakan View

-- 1. Tambahkan trip_id ke stock_movements
ALTER TABLE public.stock_movements ADD COLUMN IF NOT EXISTS trip_id uuid REFERENCES public.trips(id) ON DELETE SET NULL;

-- 2. Update trip_id pada stock_movements yang sudah ada berdasarkan transaksi sebelumnya
-- Karena ini dijalankan dari SQL Editor, auth.uid() bernilai NULL, maka kita matikan sementara trigger audit log
ALTER TABLE public.stock_movements DISABLE TRIGGER trg_audit_stock_movements;

UPDATE public.stock_movements sm
SET trip_id = s.trip_id
FROM public.sales s
WHERE sm.reference_type = 'sale' AND sm.reference_id = s.id;

UPDATE public.stock_movements sm
SET trip_id = p.trip_id
FROM public.purchases p
WHERE sm.reference_type = 'purchase' AND sm.reference_id = p.id;

ALTER TABLE public.stock_movements ENABLE TRIGGER trg_audit_stock_movements;

-- 3. Buat VIEW untuk menghitung stok per trip secara otomatis
CREATE OR REPLACE VIEW public.trip_stocks_view AS
SELECT 
    sm.workspace_id,
    sm.trip_id,
    sm.product_id,
    SUM(sm.quantity) AS current_stock
FROM 
    public.stock_movements sm
GROUP BY 
    sm.workspace_id, sm.trip_id, sm.product_id;

-- 4. Update rpc_process_sale untuk memasukkan trip_id ke stock_movements
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
            created_by,
            trip_id
        ) VALUES (
            my_workspace_id,
            v_product_id,
            -v_quantity,
            'out',
            'sale',
            v_sale_id,
            auth.uid(),
            v_trip_id
        );
    END LOOP;

    RETURN v_sale_id;
END;
$$;

-- 5. Update rpc_process_purchase (dari 20260726041000_fix_purchase_price_update.sql) untuk memasukkan trip_id
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
            PERFORM update_product_default_buy_price(v_product_id, v_buy_price);
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

-- 6. Update adjust_stock untuk mendukung trip_id
DROP FUNCTION IF EXISTS adjust_stock(uuid, numeric, text);
DROP FUNCTION IF EXISTS adjust_stock(uuid, numeric, text, uuid);

CREATE OR REPLACE FUNCTION adjust_stock(
    p_product_id uuid,
    p_quantity_delta numeric,
    p_reason text,
    p_trip_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    my_workspace_id uuid;
    my_role text;
    v_movement_id uuid;
    v_product_workspace_id uuid;
BEGIN
    my_workspace_id := get_user_workspace();
    my_role := get_user_role(my_workspace_id);
    
    IF my_role NOT IN ('owner', 'admin', 'partner') THEN
        RAISE EXCEPTION 'Role % is not authorized to adjust stock', my_role;
    END IF;

    -- Validate reason is not empty
    IF p_reason IS NULL OR trim(p_reason) = '' THEN
        RAISE EXCEPTION 'Alasan penyesuaian stok wajib diisi';
    END IF;

    -- Verify product belongs to workspace
    SELECT workspace_id INTO v_product_workspace_id FROM products WHERE id = p_product_id;
    IF v_product_workspace_id IS NULL OR v_product_workspace_id != my_workspace_id THEN
        RAISE EXCEPTION 'Product not found or does not belong to this workspace';
    END IF;

    -- Insert stock movement
    INSERT INTO stock_movements (
        workspace_id,
        product_id,
        type,
        quantity,
        reference_type,
        reason,
        created_by,
        trip_id
    ) VALUES (
        my_workspace_id,
        p_product_id,
        'adjustment'::stock_movement_type,
        p_quantity_delta,
        'manual'::reference_type,
        p_reason,
        auth.uid(),
        p_trip_id
    ) RETURNING id INTO v_movement_id;

    -- Log to activity_logs
    INSERT INTO activity_logs (
        workspace_id,
        user_id,
        action,
        entity_type,
        entity_id,
        metadata
    ) VALUES (
        my_workspace_id,
        auth.uid(),
        'adjust_stock',
        'product',
        p_product_id,
        jsonb_build_object(
            'quantity_delta', p_quantity_delta,
            'reason', p_reason,
            'trip_id', p_trip_id,
            'stock_movement_id', v_movement_id
        )
    );

    RETURN v_movement_id;
END;
$$;

GRANT EXECUTE ON FUNCTION adjust_stock TO authenticated;

