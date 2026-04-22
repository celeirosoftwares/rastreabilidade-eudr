-- ============================================================
-- EUDR Traceability Platform — Schema Supabase
-- Compatível com PostgreSQL / Supabase
-- ============================================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis"; -- Para suporte geoespacial futuro

-- ============================================================
-- ORGANIZAÇÕES (multi-tenant root)
-- ============================================================
CREATE TABLE organizations (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         TEXT NOT NULL,
  document_id  TEXT,                        -- CNPJ da organização
  plan         TEXT DEFAULT 'free',         -- 'free' | 'pro' | 'enterprise'
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- USUÁRIOS (vinculados à organização via Supabase Auth)
-- ============================================================
CREATE TABLE users (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  email           TEXT NOT NULL,
  role            TEXT DEFAULT 'member',     -- 'owner' | 'admin' | 'member'
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PROPRIEDADES RURAIS
-- ============================================================
CREATE TABLE properties (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  owner_name      TEXT NOT NULL,
  document_id     TEXT NOT NULL,             -- CPF ou CNPJ do produtor
  car_number      TEXT,                      -- Cadastro Ambiental Rural
  state           TEXT,
  municipality    TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ÁREAS (polígonos georreferenciados dentro de propriedades)
-- ============================================================
CREATE TABLE areas (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id    UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  geojson        JSONB NOT NULL,             -- Polygon / MultiPolygon em GeoJSON
  size_hectares  NUMERIC(10, 4),
  land_use       TEXT,                       -- 'cultivation' | 'native' | 'arl' | 'app'
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- LOTES DE PRODUÇÃO
-- ============================================================
CREATE TABLE lots (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  area_id     UUID REFERENCES areas(id) ON DELETE SET NULL,
  crop_type   TEXT NOT NULL,                 -- 'coffee' | 'soy' | 'sugarcane' | etc.
  harvest_year INT,
  status      TEXT DEFAULT 'active',         -- 'active' | 'harvested' | 'sold' | 'archived'
  metadata    JSONB DEFAULT '{}',            -- Dados específicos por cultura
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- EVENTOS DE RASTREABILIDADE (timeline de cada lote)
-- ============================================================
CREATE TABLE events (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lot_id      UUID NOT NULL REFERENCES lots(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,                 -- 'planting' | 'harvest' | 'transport' | 'processing' | 'sale' | 'certification'
  description TEXT,
  date        DATE NOT NULL,
  metadata    JSONB DEFAULT '{}',            -- Dados extras por tipo de evento
  created_by  UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- DOCUMENTOS ANEXADOS (Supabase Storage)
-- ============================================================
CREATE TABLE documents (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT NOT NULL,                 -- 'property' | 'lot' | 'event'
  entity_id   UUID NOT NULL,
  name        TEXT NOT NULL,
  storage_path TEXT NOT NULL,               -- caminho no Supabase Storage
  mime_type   TEXT,
  size_bytes  BIGINT,
  uploaded_by UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- AUDIT LOG (rastreabilidade de ações)
-- ============================================================
CREATE TABLE audit_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES users(id),
  action      TEXT NOT NULL,                 -- 'create' | 'update' | 'delete'
  entity_type TEXT NOT NULL,
  entity_id   UUID NOT NULL,
  old_data    JSONB,
  new_data    JSONB,
  ip_address  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================================
CREATE INDEX idx_users_organization       ON users(organization_id);
CREATE INDEX idx_properties_organization  ON properties(organization_id);
CREATE INDEX idx_areas_property           ON areas(property_id);
CREATE INDEX idx_lots_property            ON lots(property_id);
CREATE INDEX idx_lots_area                ON lots(area_id);
CREATE INDEX idx_events_lot               ON events(lot_id);
CREATE INDEX idx_events_date              ON events(date);
CREATE INDEX idx_documents_entity         ON documents(entity_type, entity_id);
CREATE INDEX idx_audit_logs_entity        ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_user          ON audit_logs(user_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) — Isolamento multi-tenant
-- ============================================================
ALTER TABLE organizations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE users           ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties      ENABLE ROW LEVEL SECURITY;
ALTER TABLE areas           ENABLE ROW LEVEL SECURITY;
ALTER TABLE lots            ENABLE ROW LEVEL SECURITY;
ALTER TABLE events          ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents       ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs      ENABLE ROW LEVEL SECURITY;

-- Função helper: retorna o organization_id do usuário autenticado
CREATE OR REPLACE FUNCTION get_user_org()
RETURNS UUID AS $$
  SELECT organization_id FROM users WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER;

-- Policies: usuários só veem dados da própria organização
CREATE POLICY "org_isolation_organizations" ON organizations
  FOR ALL USING (id = get_user_org());

CREATE POLICY "org_isolation_users" ON users
  FOR ALL USING (organization_id = get_user_org());

CREATE POLICY "org_isolation_properties" ON properties
  FOR ALL USING (organization_id = get_user_org());

CREATE POLICY "org_isolation_areas" ON areas
  FOR ALL USING (
    property_id IN (SELECT id FROM properties WHERE organization_id = get_user_org())
  );

CREATE POLICY "org_isolation_lots" ON lots
  FOR ALL USING (
    property_id IN (SELECT id FROM properties WHERE organization_id = get_user_org())
  );

CREATE POLICY "org_isolation_events" ON events
  FOR ALL USING (
    lot_id IN (
      SELECT l.id FROM lots l
      JOIN properties p ON l.property_id = p.id
      WHERE p.organization_id = get_user_org()
    )
  );

CREATE POLICY "org_isolation_documents" ON documents
  FOR ALL USING (
    (entity_type = 'property' AND entity_id IN (SELECT id FROM properties WHERE organization_id = get_user_org()))
    OR (entity_type = 'lot' AND entity_id IN (SELECT l.id FROM lots l JOIN properties p ON l.property_id = p.id WHERE p.organization_id = get_user_org()))
  );

CREATE POLICY "org_isolation_audit_logs" ON audit_logs
  FOR ALL USING (user_id IN (SELECT id FROM users WHERE organization_id = get_user_org()));

-- ============================================================
-- TRIGGER: atualiza updated_at automaticamente
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_properties_updated_at BEFORE UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_areas_updated_at BEFORE UPDATE ON areas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_lots_updated_at BEFORE UPDATE ON lots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- DADOS INICIAIS DE EXEMPLO
-- ============================================================
-- (Executar após criar o primeiro usuário via Supabase Auth)
-- INSERT INTO organizations (name, document_id) VALUES ('Fazenda Demo Ltda', '12.345.678/0001-99');
