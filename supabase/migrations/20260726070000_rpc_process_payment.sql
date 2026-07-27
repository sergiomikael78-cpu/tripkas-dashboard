-- =============================================================================
-- Stage 5: RPC for processing Payments (Pembayaran Piutang)
-- =============================================================================

DROP FUNCTION IF EXISTS process_payment(uuid, numeric, date, text, boolean);
CREATE OR REPLACE FUNCTION process_payment(
    p_sale_id uuid,
    p_amount numeric,
    p_paid_at date,
    p_notes text,
    p_mark_lunas boolean
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    my_workspace_id uuid;
    my_role text;
    v_payment_id uuid;
    v_sale_workspace_id uuid;
BEGIN
    my_workspace_id := get_user_workspace();
    my_role := get_user_role(my_workspace_id);
    
    IF my_role NOT IN ('owner', 'admin', 'partner') THEN
        RAISE EXCEPTION 'Role % is not authorized to create payments', my_role;
    END IF;

    -- Verify sale ownership
    SELECT workspace_id INTO v_sale_workspace_id FROM sales WHERE id = p_sale_id;
    IF v_sale_workspace_id IS NULL OR v_sale_workspace_id != my_workspace_id THEN
        RAISE EXCEPTION 'Sale not found or does not belong to this workspace';
    END IF;

    -- Insert payment
    INSERT INTO payments (
        sale_id,
        amount,
        paid_at,
        notes,
        created_by
    ) VALUES (
        p_sale_id,
        p_amount,
        p_paid_at,
        p_notes,
        auth.uid()
    ) RETURNING id INTO v_payment_id;

    -- Update sale status if requested
    IF p_mark_lunas THEN
        UPDATE sales 
        SET payment_status = 'lunas'::payment_status 
        WHERE id = p_sale_id;
    END IF;

    RETURN v_payment_id;
END;
$$;

GRANT EXECUTE ON FUNCTION process_payment TO authenticated;
