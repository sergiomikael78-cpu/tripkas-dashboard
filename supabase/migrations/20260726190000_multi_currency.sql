-- =============================================================================
-- Multi-Currency Support (KHR, USD, IDR)
-- =============================================================================

-- 1. Create workspace_settings table
CREATE TABLE IF NOT EXISTS public.workspace_settings (
    workspace_id uuid PRIMARY KEY REFERENCES public.workspaces(id) ON DELETE CASCADE,
    khr_to_usd_rate numeric NOT NULL DEFAULT 4000,
    usd_to_idr_rate numeric NOT NULL DEFAULT 16000,
    updated_at timestamptz DEFAULT now(),
    updated_by uuid REFERENCES auth.users(id)
);

ALTER TABLE public.workspace_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view workspace settings" ON public.workspace_settings
    FOR SELECT USING (workspace_id = public.get_user_workspace());

CREATE POLICY "Owner/Admin can update workspace settings" ON public.workspace_settings
    FOR ALL USING (
        workspace_id = public.get_user_workspace() 
        AND public.get_user_role(workspace_id) IN ('owner', 'admin')
    );

-- Populate existing workspaces
INSERT INTO public.workspace_settings (workspace_id)
SELECT id FROM public.workspaces
ON CONFLICT (workspace_id) DO NOTHING;

-- 2. Modify sale_items table
ALTER TABLE public.sale_items ADD COLUMN currency text NOT NULL DEFAULT 'IDR';
ALTER TABLE public.sale_items ADD COLUMN foreign_sell_price numeric;
ALTER TABLE public.sale_items ADD COLUMN khr_to_usd_rate_snapshot numeric;
ALTER TABLE public.sale_items ADD COLUMN usd_to_idr_rate_snapshot numeric;

-- 3. Modify products table
ALTER TABLE public.products ADD COLUMN default_sell_currency text NOT NULL DEFAULT 'KHR';

-- 4. Update process_sale RPC
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
    v_currency text;
    v_foreign_sell_price numeric;
    v_sell_price numeric;
    v_cost_price numeric;
    
    -- Rates
    v_khr_to_usd numeric;
    v_usd_to_idr numeric;
BEGIN
    my_workspace_id := get_user_workspace();
    my_role := get_user_role(my_workspace_id);
    
    IF my_role NOT IN ('owner', 'admin', 'partner') THEN
        RAISE EXCEPTION 'Role % is not authorized to create sales', my_role;
    END IF;

    -- Get current active rates
    SELECT khr_to_usd_rate, usd_to_idr_rate INTO v_khr_to_usd, v_usd_to_idr
    FROM public.workspace_settings
    WHERE workspace_id = my_workspace_id;
    
    IF v_khr_to_usd IS NULL OR v_khr_to_usd = 0 THEN v_khr_to_usd := 4000; END IF;
    IF v_usd_to_idr IS NULL OR v_usd_to_idr = 0 THEN v_usd_to_idr := 16000; END IF;

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
        
        -- Default IDR handling for backward compatibility
        v_currency := COALESCE(v_item->>'currency', 'IDR');
        v_foreign_sell_price := (v_item->>'foreign_sell_price')::numeric;
        
        IF v_foreign_sell_price IS NULL THEN
            -- fallback for old UI clients that only send sell_price (IDR)
            v_sell_price := (v_item->>'sell_price')::numeric;
            v_foreign_sell_price := v_sell_price;
        ELSE
            -- calculate IDR sell_price based on currency rules
            IF v_currency = 'KHR' THEN
                v_sell_price := (v_foreign_sell_price / v_khr_to_usd) * v_usd_to_idr;
            ELSIF v_currency = 'USD' THEN
                v_sell_price := v_foreign_sell_price * v_usd_to_idr;
            ELSE
                -- IDR
                v_sell_price := v_foreign_sell_price;
            END IF;
        END IF;

        IF v_quantity <= 0 THEN
            RAISE EXCEPTION 'Quantity must be positive';
        END IF;
        
        -- Get real cost price securely
        v_cost_price := get_product_cost_price(v_product_id);

        -- Insert sale item
        INSERT INTO sale_items (
            sale_id,
            product_id,
            quantity,
            sell_price,
            cost_price_snapshot,
            currency,
            foreign_sell_price,
            khr_to_usd_rate_snapshot,
            usd_to_idr_rate_snapshot
        ) VALUES (
            v_sale_id,
            v_product_id,
            v_quantity,
            v_sell_price,
            v_cost_price,
            v_currency,
            v_foreign_sell_price,
            v_khr_to_usd,
            v_usd_to_idr
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
