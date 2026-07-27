-- =============================================================================
-- Stage Final: RPC for Stock Adjustment (Penyesuaian Stok Manual)
-- =============================================================================

DROP FUNCTION IF EXISTS adjust_stock(uuid, numeric, text);
CREATE OR REPLACE FUNCTION adjust_stock(
    p_product_id uuid,
    p_quantity_delta numeric,
    p_reason text
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

    -- Insert stock movement (trigger will update products.current_stock)
    INSERT INTO stock_movements (
        workspace_id,
        product_id,
        type,
        quantity,
        reference_type,
        reason,
        created_by
    ) VALUES (
        my_workspace_id,
        p_product_id,
        'adjustment'::stock_movement_type,
        p_quantity_delta,
        'manual'::reference_type,
        p_reason,
        auth.uid()
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
            'stock_movement_id', v_movement_id
        )
    );

    RETURN v_movement_id;
END;
$$;

GRANT EXECUTE ON FUNCTION adjust_stock TO authenticated;
