-- Update subscription plan names and tour limits
-- Start: 5 tours/month, Standard: 15/month, Pro: 35/month

UPDATE subscription_plans
SET name = 'Start', slug = 'start', max_active_tours = 5
WHERE slug = 'starter';

UPDATE subscription_plans
SET name = 'Standard', slug = 'standard', max_active_tours = 15, price_monthly = 49
WHERE slug = 'professional';

UPDATE subscription_plans
SET name = 'Pro', slug = 'pro', max_active_tours = 35, price_monthly = 99
WHERE slug = 'premium';
