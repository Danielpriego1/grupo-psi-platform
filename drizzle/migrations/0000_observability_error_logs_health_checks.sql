-- 1) Registro estructurado de errores de la app (cliente y funciones)
CREATE TABLE public.app_error_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  correlation_id text NOT NULL,
  kind text NOT NULL DEFAULT 'render',
  route text,
  message text NOT NULL,
  status_code integer,
  duration_ms integer,
  user_agent text,
  user_id uuid,
  detail jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT app_error_logs_kind_check CHECK (kind IN ('render','network','function','http','manual')),
  CONSTRAINT app_error_logs_message_len CHECK (char_length(message) <= 2000),
  CONSTRAINT app_error_logs_corr_len CHECK (char_length(correlation_id) BETWEEN 4 AND 64),
  CONSTRAINT app_error_logs_route_len CHECK (route IS NULL OR char_length(route) <= 300),
  CONSTRAINT app_error_logs_ua_len CHECK (user_agent IS NULL OR char_length(user_agent) <= 500)
);

CREATE INDEX app_error_logs_created_at_idx ON public.app_error_logs (created_at DESC);
CREATE INDEX app_error_logs_correlation_idx ON public.app_error_logs (correlation_id);

GRANT INSERT ON public.app_error_logs TO anon;
GRANT SELECT, INSERT, DELETE ON public.app_error_logs TO authenticated;
GRANT ALL ON public.app_error_logs TO service_role;

ALTER TABLE public.app_error_logs ENABLE ROW LEVEL SECURITY;

-- Cualquier visitante puede reportar un error (solo insertar, nunca leer)
CREATE POLICY "anyone can report an error"
ON public.app_error_logs FOR INSERT TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "admins read error logs"
ON public.app_error_logs FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'superadmin'::public.app_role));

CREATE POLICY "admins delete error logs"
ON public.app_error_logs FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'superadmin'::public.app_role));

-- 2) Resultado de cada verificación de salud
CREATE TABLE public.service_health_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checked_at timestamptz NOT NULL DEFAULT now(),
  source text NOT NULL DEFAULT 'monitor',
  status text NOT NULL,
  ok boolean NOT NULL,
  latency_ms integer,
  failed_dependency text,
  correlation_id text,
  checks jsonb NOT NULL DEFAULT '[]'::jsonb,
  CONSTRAINT service_health_checks_status_check CHECK (status IN ('ok','degraded','down'))
);

CREATE INDEX service_health_checks_checked_at_idx ON public.service_health_checks (checked_at DESC);

GRANT SELECT ON public.service_health_checks TO authenticated;
GRANT ALL ON public.service_health_checks TO service_role;

ALTER TABLE public.service_health_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins read health checks"
ON public.service_health_checks FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'superadmin'::public.app_role));

-- 3) Incidentes abiertos: evita alertas repetidas por el mismo problema
CREATE TABLE public.service_health_incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opened_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz,
  dependency text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  consecutive_failures integer NOT NULL DEFAULT 1,
  last_alert_at timestamptz,
  last_message text,
  CONSTRAINT service_health_incidents_status_check CHECK (status IN ('open','resolved'))
);

CREATE UNIQUE INDEX service_health_incidents_open_unique
  ON public.service_health_incidents (dependency)
  WHERE status = 'open';

GRANT SELECT ON public.service_health_incidents TO authenticated;
GRANT ALL ON public.service_health_incidents TO service_role;

ALTER TABLE public.service_health_incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins read health incidents"
ON public.service_health_incidents FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'superadmin'::public.app_role));