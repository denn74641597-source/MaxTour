-- Turlar jadvaliga ikki tilli tarjima ustunlarini qo'shish
-- Asl ustunlar: title, full_description, included_services, extra_charges, variable_charges
-- Yangi: *_uz, *_ru ustunlari + source_language, translation_status, translation_error

ALTER TABLE tours
  -- Sarlavha tarjimalari
  ADD COLUMN IF NOT EXISTS title_uz TEXT,
  ADD COLUMN IF NOT EXISTS title_ru TEXT,
  -- Tavsif tarjimalari
  ADD COLUMN IF NOT EXISTS description_uz TEXT,
  ADD COLUMN IF NOT EXISTS description_ru TEXT,
  -- Kiritilgan xizmatlar tarjimalari (asl tuzilishiga mos: jsonb string[])
  ADD COLUMN IF NOT EXISTS included_services_uz JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS included_services_ru JSONB DEFAULT '[]',
  -- Qo'shimcha to'lovlar tarjimalari (asl tuzilishiga mos: jsonb {name,amount,required?}[])
  ADD COLUMN IF NOT EXISTS extra_charges_uz JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS extra_charges_ru JSONB DEFAULT '[]',
  -- O'zgaruvchan to'lovlar tarjimalari (asl tuzilishiga mos: jsonb {name,min_amount,max_amount,required?}[])
  ADD COLUMN IF NOT EXISTS variable_charges_uz JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS variable_charges_ru JSONB DEFAULT '[]',
  -- Metadata
  ADD COLUMN IF NOT EXISTS source_language TEXT DEFAULT 'uz',
  ADD COLUMN IF NOT EXISTS translation_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS translation_error TEXT;

-- Mavjud ma'lumotlarni o'zbek ustunlariga nusxalash
-- (hozirgi turlarning ko'pchiligi o'zbek tilida kiritilgan)
UPDATE tours SET
  title_uz = title,
  description_uz = full_description,
  included_services_uz = included_services,
  extra_charges_uz = extra_charges,
  variable_charges_uz = variable_charges,
  source_language = 'uz',
  translation_status = 'pending'
WHERE title IS NOT NULL;

-- Tez qidirish uchun indeks
CREATE INDEX IF NOT EXISTS idx_tours_translation_status ON tours (translation_status);

COMMENT ON COLUMN tours.source_language IS 'Agentlik kontent kiritgan til: uz yoki ru';
COMMENT ON COLUMN tours.translation_status IS 'pending | translating | completed | failed';
COMMENT ON COLUMN tours.translation_error IS 'Tarjima xatosi matni';
