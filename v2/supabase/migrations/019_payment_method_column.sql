ALTER TABLE whatsapp_config
  ADD COLUMN IF NOT EXISTS payment_method_connected BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN whatsapp_config.payment_method_connected IS
  'Whether a payment method has been confirmed in Meta Business Manager. Checked via Meta API or manually confirmed.';
