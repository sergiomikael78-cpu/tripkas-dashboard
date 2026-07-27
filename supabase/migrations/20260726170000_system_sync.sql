-- =========================================================================================
-- Phase 1: System Synchronization & Audit Fixes
-- =========================================================================================

-- 1. Make purchases.trip_id NULLABLE
-- This allows purchasing directly into Gudang Pusat (no trip)
ALTER TABLE public.purchases ALTER COLUMN trip_id DROP NOT NULL;

-- 2. Drop existing foreign keys to trips and recreate with ON DELETE SET NULL
-- This prevents the "Cannot delete Trip" error, and elegantly returns the records 
-- (sales, purchases, expenses) to Gudang Pusat when a trip is deleted.

-- For purchases
ALTER TABLE public.purchases DROP CONSTRAINT IF EXISTS purchases_trip_id_fkey;
ALTER TABLE public.purchases ADD CONSTRAINT purchases_trip_id_fkey FOREIGN KEY (trip_id) REFERENCES public.trips(id) ON DELETE SET NULL;

-- For sales
ALTER TABLE public.sales DROP CONSTRAINT IF EXISTS sales_trip_id_fkey;
ALTER TABLE public.sales ADD CONSTRAINT sales_trip_id_fkey FOREIGN KEY (trip_id) REFERENCES public.trips(id) ON DELETE SET NULL;

-- For expenses
ALTER TABLE public.expenses DROP CONSTRAINT IF EXISTS expenses_trip_id_fkey;
ALTER TABLE public.expenses ADD CONSTRAINT expenses_trip_id_fkey FOREIGN KEY (trip_id) REFERENCES public.trips(id) ON DELETE SET NULL;

-- stock_movements_trip_id_fkey is already ON DELETE SET NULL from previous migration.

-- 3. Create Trigger to Return Stock when Trip Closes
CREATE OR REPLACE FUNCTION public.handle_trip_status_change()
RETURNS TRIGGER AS $$
DECLARE
    r RECORD;
    v_user_id uuid;
BEGIN
    v_user_id := COALESCE(auth.uid(), NEW.created_by);
    
    -- Check if status changed from running to closed
    IF OLD.status = 'running' AND NEW.status = 'closed' THEN
        -- Loop through all products that have positive stock in this trip
        FOR r IN (SELECT product_id, current_stock FROM public.trip_stocks_view WHERE trip_id = NEW.id AND current_stock > 0)
        LOOP
            -- 1. Deduct from Trip (Out adjustment)
            INSERT INTO public.stock_movements (
                workspace_id, product_id, trip_id, type, quantity, reference_type, reference_id, reason, created_by
            ) VALUES (
                NEW.workspace_id, r.product_id, NEW.id, 'adjustment', -r.current_stock, 'manual', NULL, 'Retur sisa stok karena Trip ' || NEW.code || ' ditutup', v_user_id
            );
            
            -- 2. Add to Gudang Pusat (trip_id = NULL)
            INSERT INTO public.stock_movements (
                workspace_id, product_id, trip_id, type, quantity, reference_type, reference_id, reason, created_by
            ) VALUES (
                NEW.workspace_id, r.product_id, NULL, 'adjustment', r.current_stock, 'manual', NULL, 'Penerimaan sisa stok dari Trip ' || NEW.code || ' yang ditutup', v_user_id
            );
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_handle_trip_status_change ON public.trips;
CREATE TRIGGER trigger_handle_trip_status_change
AFTER UPDATE OF status ON public.trips
FOR EACH ROW EXECUTE FUNCTION public.handle_trip_status_change();
