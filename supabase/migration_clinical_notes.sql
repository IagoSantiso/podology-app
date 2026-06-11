-- Añade campos clínicos estructurados a visit_history
-- clinical_notes y treatment_* son visibles al paciente
-- podologist_notes (campo existente) es SOLO interno (nunca visible al paciente)

ALTER TABLE visit_history
  ADD COLUMN IF NOT EXISTS clinical_notes text,
  ADD COLUMN IF NOT EXISTS treatment_name text,
  ADD COLUMN IF NOT EXISTS treatment_instructions text;
