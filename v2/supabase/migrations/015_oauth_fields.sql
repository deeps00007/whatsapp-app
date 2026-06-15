ALTER TABLE whatsapp_config ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE whatsapp_config ADD COLUMN IF NOT EXISTS business_name TEXT;
ALTER TABLE whatsapp_config ADD COLUMN IF NOT EXISTS code_verification_status TEXT DEFAULT 'NOT_VERIFIED';
ALTER TABLE whatsapp_config ADD COLUMN IF NOT EXISTS quality_rating TEXT;
