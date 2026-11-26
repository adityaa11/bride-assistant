CREATE TABLE public.booking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id text NOT NULL REFERENCES auth."user"(id) ON DELETE RESTRICT,
  package_id uuid NOT NULL REFERENCES public.master_package(id) ON DELETE RESTRICT,
  promotion_id uuid REFERENCES public.promotion(id) ON DELETE RESTRICT,
  submission_key uuid NOT NULL,
  submission_snapshot jsonb NOT NULL CHECK (
    jsonb_typeof(submission_snapshot) = 'object'
    AND submission_snapshot ?& ARRAY['customerName','whatsapp','email','weddingDate','weddingStartTime','weddingLocation','note','packageId']
  ),
  submission_payload_hash char(64) NOT NULL CHECK (submission_payload_hash ~ '^[0-9a-f]{64}$'),
  wedding_date date NOT NULL,
  wedding_start_time time NOT NULL,
  wedding_location text NOT NULL CHECK (btrim(wedding_location) <> ''),
  status text NOT NULL DEFAULT 'Menunggu Konfirmasi' CHECK (status IN (
    'Menunggu Konfirmasi', 'Menunggu Pembayaran', 'Booking Berhasil',
    'Menunggu Pembatalan Booking', 'Dibatalkan', 'Menunggu Reschedule Booking'
  )),
  package_snapshot jsonb NOT NULL CHECK (jsonb_typeof(package_snapshot) = 'object'),
  promotion_snapshot jsonb CHECK (promotion_snapshot IS NULL OR jsonb_typeof(promotion_snapshot) = 'object'),
  final_price numeric(14,2) NOT NULL CHECK (final_price >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT booking_customer_submission_key_unique UNIQUE (customer_id, submission_key),
  CONSTRAINT booking_promotion_snapshot_pair CHECK ((promotion_id IS NULL) = (promotion_snapshot IS NULL))
);

CREATE INDEX booking_customer_created_idx ON public.booking (customer_id, created_at DESC, id DESC);

CREATE TABLE public.booking_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.booking(id) ON DELETE RESTRICT,
  actor_id text NOT NULL REFERENCES auth."user"(id) ON DELETE RESTRICT,
  from_status text,
  to_status text NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX booking_history_order_idx ON public.booking_status_history (booking_id, occurred_at, id);

CREATE FUNCTION public.reject_booking_fact_change() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF ROW(NEW.customer_id, NEW.package_id, NEW.promotion_id, NEW.submission_key,
         NEW.submission_snapshot, NEW.submission_payload_hash, NEW.wedding_start_time,
         NEW.package_snapshot, NEW.promotion_snapshot, NEW.final_price, NEW.created_at)
     IS DISTINCT FROM
     ROW(OLD.customer_id, OLD.package_id, OLD.promotion_id, OLD.submission_key,
         OLD.submission_snapshot, OLD.submission_payload_hash, OLD.wedding_start_time,
         OLD.package_snapshot, OLD.promotion_snapshot, OLD.final_price, OLD.created_at) THEN
    RAISE EXCEPTION 'BOOKING_FACT_IMMUTABLE' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER booking_fact_immutable BEFORE UPDATE ON public.booking
  FOR EACH ROW EXECUTE FUNCTION public.reject_booking_fact_change();

CREATE FUNCTION public.reject_booking_history_change() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'BOOKING_HISTORY_APPEND_ONLY' USING ERRCODE = '23514';
END $$;
CREATE TRIGGER booking_history_append_only BEFORE UPDATE OR DELETE ON public.booking_status_history
  FOR EACH ROW EXECUTE FUNCTION public.reject_booking_history_change();
