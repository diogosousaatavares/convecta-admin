-- =============================================
-- FASE 4 — RLS DEFINITIVO (multi-tenant)
-- Correr no SQL Editor do Supabase
-- =============================================

-- 1. Função helper (SECURITY DEFINER evita recursão na tabela users)
CREATE OR REPLACE FUNCTION get_my_business_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT business_id FROM public.users WHERE id = auth.uid();
$$;

-- 2. Remover políticas de desenvolvimento
DROP POLICY IF EXISTS "dev_allow_all" ON businesses;
DROP POLICY IF EXISTS "dev_allow_all" ON users;
DROP POLICY IF EXISTS "dev_allow_all" ON customers;
DROP POLICY IF EXISTS "dev_allow_all" ON categories;
DROP POLICY IF EXISTS "dev_allow_all" ON professionals;
DROP POLICY IF EXISTS "dev_allow_all" ON services;
DROP POLICY IF EXISTS "dev_allow_all" ON schedules;
DROP POLICY IF EXISTS "dev_allow_all" ON blocks;
DROP POLICY IF EXISTS "dev_allow_all" ON appointments;
DROP POLICY IF EXISTS "dev_allow_all" ON waitlist;
DROP POLICY IF EXISTS "dev_allow_all" ON suppliers;
DROP POLICY IF EXISTS "dev_allow_all" ON products;
DROP POLICY IF EXISTS "dev_allow_all" ON stock_movements;
DROP POLICY IF EXISTS "dev_allow_all" ON orders;
DROP POLICY IF EXISTS "dev_allow_all" ON order_items;
DROP POLICY IF EXISTS "dev_allow_all" ON payments;
DROP POLICY IF EXISTS "dev_allow_all" ON commissions;
DROP POLICY IF EXISTS "dev_allow_all" ON cash_sessions;
DROP POLICY IF EXISTS "dev_allow_all" ON cash_movements;
DROP POLICY IF EXISTS "dev_allow_all" ON forms;
DROP POLICY IF EXISTS "dev_allow_all" ON config;
DROP POLICY IF EXISTS "dev_allow_all" ON loyalty_accounts;
DROP POLICY IF EXISTS "dev_allow_all" ON loyalty_transactions;
DROP POLICY IF EXISTS "dev_allow_all" ON rewards;

-- 3. Tabela users — só vê/edita a própria linha
CREATE POLICY "users_own_row" ON users
  FOR ALL USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- 4. businesses — só vê o seu negócio
CREATE POLICY "businesses_own" ON businesses
  FOR ALL USING (id = get_my_business_id())
  WITH CHECK (id = get_my_business_id());

-- 5. Todas as outras tabelas filtradas por business_id
DO $$
DECLARE
  tbl text;
  tables text[] := ARRAY[
    'customers','categories','professionals','services','schedules','blocks',
    'appointments','waitlist','suppliers','products','stock_movements',
    'orders','payments','commissions','cash_sessions',
    'cash_movements','forms','config','loyalty_accounts','rewards'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    EXECUTE format(
      'CREATE POLICY "own_business_%1$s" ON %1$s
         FOR ALL
         USING (business_id = get_my_business_id())
         WITH CHECK (business_id = get_my_business_id());',
      tbl
    );
  END LOOP;
END $$;

-- loyalty_transactions não tem business_id direto — usa join por loyalty_account
CREATE POLICY "own_business_loyalty_tx" ON loyalty_transactions
  FOR ALL USING (
    loyalty_account_id IN (
      SELECT id FROM loyalty_accounts WHERE business_id = get_my_business_id()
    )
  );

-- order_items não tem business_id — usa join por order
CREATE POLICY "own_business_order_items" ON order_items
  FOR ALL USING (
    order_id IN (
      SELECT id FROM orders WHERE business_id = get_my_business_id()
    )
  );

-- Verificar resultado:
-- SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename;
