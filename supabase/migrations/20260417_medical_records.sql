-- Zdravotní záznamy zvířat (vakcíny, léky, ošetření, vyšetření, poznámky)
CREATE TABLE IF NOT EXISTS animal_medical_records (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id      UUID NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
  institution_id UUID NOT NULL,
  record_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  record_type    TEXT NOT NULL DEFAULT 'note'
                 CHECK (record_type IN ('vaccination','deworming','medication','exam','treatment','surgery','note')),
  title          TEXT NOT NULL,
  description    TEXT,
  vet_name       TEXT,
  next_due_date  DATE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by     UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS animal_medical_records_animal_id_idx ON animal_medical_records(animal_id);
CREATE INDEX IF NOT EXISTS animal_medical_records_institution_id_idx ON animal_medical_records(institution_id);

ALTER TABLE animal_medical_records ENABLE ROW LEVEL SECURITY;

-- Členové instituce mohou číst a zapisovat záznamy svých zvířat
CREATE POLICY "medical_records_institution_access"
  ON animal_medical_records
  USING (
    institution_id IN (
      SELECT institution_id FROM institution_members WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    institution_id IN (
      SELECT institution_id FROM institution_members WHERE user_id = auth.uid()
    )
  );
