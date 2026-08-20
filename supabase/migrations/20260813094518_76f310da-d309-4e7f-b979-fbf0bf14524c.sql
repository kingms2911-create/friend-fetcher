CREATE TABLE public.gyms (id text PRIMARY KEY, data jsonb NOT NULL DEFAULT '{}'::jsonb, updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.app_users (id text PRIMARY KEY, email text, role text, gym_id text, password_hash text, data jsonb NOT NULL DEFAULT '{}'::jsonb, updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.plan_requests (id text PRIMARY KEY, member_id text, gym_id text, status text, data jsonb NOT NULL DEFAULT '{}'::jsonb, updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.checkins (id text PRIMARY KEY, member_id text, gym_id text, data jsonb NOT NULL DEFAULT '{}'::jsonb, updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.food_logs (id text PRIMARY KEY, member_id text, data jsonb NOT NULL DEFAULT '{}'::jsonb, updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.leads (id text PRIMARY KEY, gym_id text, status text, data jsonb NOT NULL DEFAULT '{}'::jsonb, updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.products (id text PRIMARY KEY, scope text, gym_id text, data jsonb NOT NULL DEFAULT '{}'::jsonb, updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.notifications (id text PRIMARY KEY, user_id text, data jsonb NOT NULL DEFAULT '{}'::jsonb, updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.health_issues (id text PRIMARY KEY, member_id text, gym_id text, data jsonb NOT NULL DEFAULT '{}'::jsonb, updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.app_meta (key text PRIMARY KEY, data jsonb NOT NULL DEFAULT '{}'::jsonb, updated_at timestamptz NOT NULL DEFAULT now());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.gyms, public.app_users, public.plan_requests, public.checkins, public.food_logs, public.leads, public.products, public.notifications, public.health_issues, public.app_meta TO anon, authenticated;
GRANT ALL ON public.gyms, public.app_users, public.plan_requests, public.checkins, public.food_logs, public.leads, public.products, public.notifications, public.health_issues, public.app_meta TO service_role;

ALTER TABLE public.gyms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_meta ENABLE ROW LEVEL SECURITY;

CREATE POLICY "app access" ON public.gyms FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "app access" ON public.app_users FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "app access" ON public.plan_requests FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "app access" ON public.checkins FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "app access" ON public.food_logs FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "app access" ON public.leads FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "app access" ON public.products FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "app access" ON public.notifications FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "app access" ON public.health_issues FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "app access" ON public.app_meta FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);