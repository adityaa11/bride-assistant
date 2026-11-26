-- M3-SQL-07: durable successful-booking dates and admin closures.
CREATE TABLE public.booking_date_reservation (
  booking_id uuid PRIMARY KEY REFERENCES public.booking(id) ON DELETE RESTRICT,
  wedding_date date NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.admin_closed_date (
  date date PRIMARY KEY,
  closed_by text NOT NULL REFERENCES auth."user"(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now()
);
