-- =============================================
-- FASE 3 — PREPARAÇÃO SUPABASE
-- Correr no SQL Editor ANTES de trocar o dataService
-- =============================================

-- 1. Adicionar coluna metadata às tabelas que precisam de campos extra
ALTER TABLE professionals  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}';
ALTER TABLE services       ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}';
ALTER TABLE customers      ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}';
ALTER TABLE appointments   ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}';
ALTER TABLE products       ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}';
ALTER TABLE cash_sessions  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}';
ALTER TABLE waitlist       ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}';
ALTER TABLE commissions    ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}';

-- 2. Políticas RLS temporárias para desenvolvimento
-- (Permitem acesso total com a anon key — REMOVER antes de produção)
CREATE POLICY "dev_allow_all" ON businesses        FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "dev_allow_all" ON users             FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "dev_allow_all" ON customers         FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "dev_allow_all" ON categories        FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "dev_allow_all" ON professionals     FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "dev_allow_all" ON services          FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "dev_allow_all" ON schedules         FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "dev_allow_all" ON blocks            FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "dev_allow_all" ON appointments      FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "dev_allow_all" ON waitlist          FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "dev_allow_all" ON suppliers         FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "dev_allow_all" ON products          FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "dev_allow_all" ON stock_movements   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "dev_allow_all" ON orders            FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "dev_allow_all" ON order_items       FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "dev_allow_all" ON payments          FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "dev_allow_all" ON commissions       FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "dev_allow_all" ON cash_sessions     FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "dev_allow_all" ON cash_movements    FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "dev_allow_all" ON forms             FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "dev_allow_all" ON config            FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "dev_allow_all" ON loyalty_accounts  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "dev_allow_all" ON loyalty_transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "dev_allow_all" ON rewards           FOR ALL USING (true) WITH CHECK (true);
