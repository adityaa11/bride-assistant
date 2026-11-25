CREATE SCHEMA app;

CREATE TABLE app.admin_bootstrap_state (
  bootstrap_key text PRIMARY KEY CHECK (bootstrap_key = 'first-admin'),
  state text NOT NULL CHECK (state IN ('UNINITIALIZED', 'RESERVED', 'SEALED')),
  attempt_id uuid UNIQUE,
  attempt_email text,
  initial_user_id text UNIQUE REFERENCES auth."user"(id) ON DELETE RESTRICT,
  reserved_at timestamptz,
  sealed_at timestamptz,
  CONSTRAINT admin_bootstrap_state_shape CHECK (
    (state = 'UNINITIALIZED' AND attempt_id IS NULL AND attempt_email IS NULL
      AND initial_user_id IS NULL AND reserved_at IS NULL AND sealed_at IS NULL)
    OR (state = 'RESERVED' AND attempt_id IS NOT NULL AND attempt_email IS NOT NULL
      AND initial_user_id IS NULL AND reserved_at IS NOT NULL AND sealed_at IS NULL)
    OR (state = 'SEALED' AND attempt_id IS NOT NULL AND attempt_email IS NOT NULL
      AND initial_user_id IS NOT NULL AND reserved_at IS NOT NULL AND sealed_at IS NOT NULL)
  )
);

INSERT INTO app.admin_bootstrap_state (bootstrap_key, state) VALUES ('first-admin', 'UNINITIALIZED');

CREATE FUNCTION app.guard_admin_bootstrap_state() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'admin bootstrap marker cannot be deleted';
  END IF;
  IF TG_OP = 'INSERT' THEN
    IF NEW.bootstrap_key <> 'first-admin' THEN
      RAISE EXCEPTION 'invalid admin bootstrap key';
    END IF;
    RETURN NEW;
  END IF;
  IF OLD.state = 'SEALED' AND NEW IS DISTINCT FROM OLD THEN
    RAISE EXCEPTION 'sealed admin bootstrap is immutable';
  END IF;
  IF NEW.bootstrap_key IS DISTINCT FROM OLD.bootstrap_key
    OR (OLD.state = 'RESERVED' AND (NEW.attempt_id IS DISTINCT FROM OLD.attempt_id
      OR NEW.attempt_email IS DISTINCT FROM OLD.attempt_email))
    OR (OLD.state = 'UNINITIALIZED' AND NEW.state NOT IN ('UNINITIALIZED', 'RESERVED'))
    OR (OLD.state = 'RESERVED' AND NEW.state NOT IN ('RESERVED', 'SEALED')) THEN
    RAISE EXCEPTION 'invalid admin bootstrap transition';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER admin_bootstrap_state_guard
  BEFORE INSERT OR UPDATE OR DELETE ON app.admin_bootstrap_state
  FOR EACH ROW EXECUTE FUNCTION app.guard_admin_bootstrap_state();
