CREATE TABLE public.catalogue_types (
  id smallint PRIMARY KEY,
  code text NOT NULL UNIQUE CHECK (btrim(code) <> ''),
  label text NOT NULL UNIQUE CHECK (btrim(label) <> ''),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT catalogue_types_known CHECK ((id, code, label) IN ((1, 'service', 'Service'), (2, 'action', 'Action')))
);

INSERT INTO public.catalogue_types (id, code, label)
VALUES (1, 'service', 'Service'), (2, 'action', 'Action');

CREATE TABLE public.catalogue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  catalogue_type_id smallint NOT NULL REFERENCES public.catalogue_types(id) ON DELETE RESTRICT,
  name text NOT NULL CHECK (btrim(name) <> ''),
  description text NOT NULL DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.bundle (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (btrim(name) <> ''),
  description text NOT NULL DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.bundle_catalogue (
  bundle_id uuid NOT NULL REFERENCES public.bundle(id) ON DELETE RESTRICT,
  catalogue_id uuid NOT NULL REFERENCES public.catalogue(id) ON DELETE RESTRICT,
  PRIMARY KEY (bundle_id, catalogue_id)
);

CREATE TABLE public.master_package (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (btrim(name) <> ''),
  description text NOT NULL DEFAULT '',
  duration_minutes integer NOT NULL CHECK (duration_minutes > 0),
  base_price numeric(14, 2) NOT NULL CHECK (base_price >= 0),
  published boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.package_catalogue (
  package_id uuid NOT NULL REFERENCES public.master_package(id) ON DELETE RESTRICT,
  catalogue_id uuid NOT NULL REFERENCES public.catalogue(id) ON DELETE RESTRICT,
  PRIMARY KEY (package_id, catalogue_id)
);

CREATE TABLE public.package_bundle (
  package_id uuid NOT NULL REFERENCES public.master_package(id) ON DELETE RESTRICT,
  bundle_id uuid NOT NULL REFERENCES public.bundle(id) ON DELETE RESTRICT,
  PRIMARY KEY (package_id, bundle_id)
);

CREATE TABLE public.promotion (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (btrim(title) <> ''),
  description text NOT NULL DEFAULT '',
  discount_type text NOT NULL CHECK (discount_type IN ('percentage', 'rupiah')),
  discount_value numeric(14, 2) NOT NULL CHECK (discount_value > 0),
  starts_on date NOT NULL,
  ends_on date NOT NULL,
  published boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT promotion_window CHECK (starts_on <= ends_on),
  CONSTRAINT promotion_percent_limit CHECK (discount_type <> 'percentage' OR discount_value <= 100)
);

CREATE TABLE public.promotion_package (
  promotion_id uuid NOT NULL REFERENCES public.promotion(id) ON DELETE RESTRICT,
  package_id uuid NOT NULL REFERENCES public.master_package(id) ON DELETE RESTRICT,
  PRIMARY KEY (promotion_id, package_id)
);
