-- Auditní log všech změn profilu zvířete
-- Každé uložení loguje která pole se změnila, z jaké hodnoty na jakou
CREATE TABLE IF NOT EXISTS animal_audit_log (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id    UUID NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
  changed_by   UUID REFERENCES auth.users(id),
  changed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  change_note  TEXT,
  changes      JSONB NOT NULL DEFAULT '[]'::jsonb
  -- changes format: [{"field": "adoption_status", "label": "Status adopce", "old_value": "V příjmu", "new_value": "K adopci"}]
);

CREATE INDEX IF NOT EXISTS animal_audit_log_animal_id_idx ON animal_audit_log(animal_id);
CREATE INDEX IF NOT EXISTS animal_audit_log_changed_at_idx ON animal_audit_log(changed_at DESC);

ALTER TABLE animal_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_log_institution_access" ON animal_audit_log
  FOR ALL USING (
    animal_id IN (
      SELECT a.id FROM animals a
      JOIN institution_members im ON im.institution_id = a.institution_id
      WHERE im.user_id = auth.uid()
    )
  );
