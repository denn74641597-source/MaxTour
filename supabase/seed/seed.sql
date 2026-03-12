-- MaxTour Seed Data
-- Run this after the schema migration for local/demo development

-- ============================================================
-- Create dummy auth.users first (required for profiles FK)
-- ============================================================
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, recovery_token)
VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'aziz@demo.maxtour.uz', crypt('demo123456', gen_salt('bf')), now(), now(), now(), '', ''),
  ('aaaaaaaa-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'nilufar@demo.maxtour.uz', crypt('demo123456', gen_salt('bf')), now(), now(), now(), '', ''),
  ('aaaaaaaa-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sardor@demo.maxtour.uz', crypt('demo123456', gen_salt('bf')), now(), now(), now(), '', ''),
  ('aaaaaaaa-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'kamola@demo.maxtour.uz', crypt('demo123456', gen_salt('bf')), now(), now(), now(), '', ''),
  ('aaaaaaaa-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'bobur@demo.maxtour.uz', crypt('demo123456', gen_salt('bf')), now(), now(), now(), '', ''),
  ('aaaaaaaa-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin@demo.maxtour.uz', crypt('demo123456', gen_salt('bf')), now(), now(), now(), '', ''),
  ('aaaaaaaa-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'user@demo.maxtour.uz', crypt('demo123456', gen_salt('bf')), now(), now(), now(), '', '')
ON CONFLICT (id) DO NOTHING;

-- Also insert into auth.identities (required by Supabase Auth)
INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'email', jsonb_build_object('sub', 'aaaaaaaa-0000-0000-0000-000000000001', 'email', 'aziz@demo.maxtour.uz'), now(), now(), now()),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000002', 'email', jsonb_build_object('sub', 'aaaaaaaa-0000-0000-0000-000000000002', 'email', 'nilufar@demo.maxtour.uz'), now(), now(), now()),
  ('aaaaaaaa-0000-0000-0000-000000000003', 'aaaaaaaa-0000-0000-0000-000000000003', 'aaaaaaaa-0000-0000-0000-000000000003', 'email', jsonb_build_object('sub', 'aaaaaaaa-0000-0000-0000-000000000003', 'email', 'sardor@demo.maxtour.uz'), now(), now(), now()),
  ('aaaaaaaa-0000-0000-0000-000000000004', 'aaaaaaaa-0000-0000-0000-000000000004', 'aaaaaaaa-0000-0000-0000-000000000004', 'email', jsonb_build_object('sub', 'aaaaaaaa-0000-0000-0000-000000000004', 'email', 'kamola@demo.maxtour.uz'), now(), now(), now()),
  ('aaaaaaaa-0000-0000-0000-000000000005', 'aaaaaaaa-0000-0000-0000-000000000005', 'aaaaaaaa-0000-0000-0000-000000000005', 'email', jsonb_build_object('sub', 'aaaaaaaa-0000-0000-0000-000000000005', 'email', 'bobur@demo.maxtour.uz'), now(), now(), now()),
  ('aaaaaaaa-0000-0000-0000-000000000010', 'aaaaaaaa-0000-0000-0000-000000000010', 'aaaaaaaa-0000-0000-0000-000000000010', 'email', jsonb_build_object('sub', 'aaaaaaaa-0000-0000-0000-000000000010', 'email', 'admin@demo.maxtour.uz'), now(), now(), now()),
  ('aaaaaaaa-0000-0000-0000-000000000011', 'aaaaaaaa-0000-0000-0000-000000000011', 'aaaaaaaa-0000-0000-0000-000000000011', 'email', jsonb_build_object('sub', 'aaaaaaaa-0000-0000-0000-000000000011', 'email', 'user@demo.maxtour.uz'), now(), now(), now())
ON CONFLICT DO NOTHING;

-- ============================================================
-- Subscription Plans
-- ============================================================
INSERT INTO subscription_plans (id, name, slug, price_monthly, max_active_tours, can_feature, has_priority_support) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Starter', 'starter', 0, 3, false, false),
  ('00000000-0000-0000-0000-000000000002', 'Professional', 'professional', 49, 15, true, false),
  ('00000000-0000-0000-0000-000000000003', 'Premium', 'premium', 99, 50, true, true);

-- ============================================================
-- Demo Profiles
-- ============================================================

INSERT INTO profiles (id, role, full_name, telegram_username, phone) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', 'agency_manager', 'Aziz Karimov', '@aziz_travel', '+998901234567'),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'agency_manager', 'Nilufar Rakhimova', '@nilufar_tours', '+998901234568'),
  ('aaaaaaaa-0000-0000-0000-000000000003', 'agency_manager', 'Sardor Yusupov', '@sardor_travel', '+998901234569'),
  ('aaaaaaaa-0000-0000-0000-000000000004', 'agency_manager', 'Kamola Umarova', '@kamola_voyage', '+998901234570'),
  ('aaaaaaaa-0000-0000-0000-000000000005', 'agency_manager', 'Bobur Alimov', '@bobur_trips', '+998901234571'),
  ('aaaaaaaa-0000-0000-0000-000000000010', 'admin', 'Admin User', '@maxtour_admin', '+998900000000'),
  ('aaaaaaaa-0000-0000-0000-000000000011', 'user', 'Test User', '@testuser', '+998909999999')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Agencies
-- ============================================================
INSERT INTO agencies (id, owner_id, name, slug, description, phone, telegram_username, instagram_url, city, country, is_verified, is_approved) VALUES
  ('bbbbbbbb-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'Silk Road Adventures', 'silk-road-adventures', 'Premium travel agency specializing in cultural and historical tours across Central Asia. 10+ years of experience.', '+998901234567', '@silkroad_travel', 'https://instagram.com/silkroad_travel', 'Tashkent', 'Uzbekistan', true, true),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000002', 'Samarkand Tours', 'samarkand-tours', 'Your gateway to the jewels of Uzbekistan. Specializing in Umrah packages and family tours.', '+998901234568', '@samarkand_tours', 'https://instagram.com/samarkand_tours', 'Samarkand', 'Uzbekistan', true, true),
  ('bbbbbbbb-0000-0000-0000-000000000003', 'aaaaaaaa-0000-0000-0000-000000000003', 'Tashkent Travel Hub', 'tashkent-travel-hub', 'Modern travel agency offering budget-friendly packages to popular destinations.', '+998901234569', '@tashkent_hub', null, 'Tashkent', 'Uzbekistan', false, true),
  ('bbbbbbbb-0000-0000-0000-000000000004', 'aaaaaaaa-0000-0000-0000-000000000004', 'Golden Voyage', 'golden-voyage', 'Luxury travel experiences to Turkey, UAE, and Southeast Asia.', '+998901234570', '@golden_voyage', 'https://instagram.com/golden_voyage', 'Bukhara', 'Uzbekistan', true, true),
  ('bbbbbbbb-0000-0000-0000-000000000005', 'aaaaaaaa-0000-0000-0000-000000000005', 'EcoTrail Uzbekistan', 'ecotrail-uzbekistan', 'Adventure and eco-tourism in the mountains and deserts of Central Asia.', '+998901234571', '@ecotrail_uz', null, 'Tashkent', 'Uzbekistan', false, false)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Agency Subscriptions
-- ============================================================
INSERT INTO agency_subscriptions (agency_id, plan_id, status, starts_at, ends_at) VALUES
  ('bbbbbbbb-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'active', now(), now() + interval '30 days'),
  ('bbbbbbbb-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'active', now(), now() + interval '30 days'),
  ('bbbbbbbb-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'active', now(), now() + interval '30 days'),
  ('bbbbbbbb-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000003', 'active', now(), now() + interval '30 days');

-- ============================================================
-- Tours
-- ============================================================
INSERT INTO tours (id, agency_id, title, slug, short_description, full_description, country, city, departure_date, return_date, duration_days, price, currency, seats_total, seats_left, hotel_name, hotel_stars, meal_type, transport_type, visa_required, included_services, excluded_services, status, is_featured, cover_image_url) VALUES
  ('cccccccc-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000001', 'Istanbul Cultural Discovery', 'istanbul-cultural-discovery', 'Explore the best of Istanbul — Hagia Sophia, Grand Bazaar, Bosphorus cruise and more.', 'A comprehensive 7-day tour covering Istanbul highlights including the historic Sultanahmet district, Bosphorus cruise, and hidden gems of the Asian side. Professional English and Uzbek speaking guide included.', 'Turkey', 'Istanbul', '2026-04-15', '2026-04-22', 7, 850, 'USD', 20, 12, 'Grand Star Hotel', 4, 'breakfast', 'flight', false, '["Round-trip flights", "Airport transfers", "Hotel accommodation", "Daily breakfast", "Guided tours", "Bosphorus cruise"]', '["Lunch and dinner", "Personal expenses", "Travel insurance"]', 'published', true, null),

  ('cccccccc-0000-0000-0000-000000000002', 'bbbbbbbb-0000-0000-0000-000000000001', 'Cappadocia & Antalya Combo', 'cappadocia-antalya-combo', 'Hot air balloon rides in Cappadocia followed by beach relaxation in Antalya.', 'Experience the magical landscapes of Cappadocia with a hot air balloon ride, then relax on the stunning beaches of Antalya. Perfect for couples and families.', 'Turkey', 'Cappadocia', '2026-05-01', '2026-05-10', 10, 1200, 'USD', 15, 8, 'Cave Suites Hotel & Rixos Antalya', 5, 'all_inclusive', 'flight', false, '["Flights", "Hotels", "Hot air balloon ride", "All meals", "Beach activities", "City tours"]', '["Optional excursions", "Personal shopping"]', 'published', true, null),

  ('cccccccc-0000-0000-0000-000000000003', 'bbbbbbbb-0000-0000-0000-000000000002', 'Umrah Spring Package', 'umrah-spring-2026', 'Complete Umrah package with 5-star hotel near Haram.', 'Premium Umrah package including direct flights, 5-star accommodation within walking distance of Masjid al-Haram, guided religious tours, and Zam Zam water allowance.', 'Saudi Arabia', 'Makkah', '2026-04-20', '2026-04-30', 10, 2200, 'USD', 30, 22, 'Pullman Zamzam', 5, 'full_board', 'flight', true, '["Direct flights", "5-star hotel", "Visa processing", "Full board meals", "Religious guide", "Zam Zam water", "Transport between cities"]', '["Personal shopping", "Additional luggage"]', 'published', true, null),

  ('cccccccc-0000-0000-0000-000000000004', 'bbbbbbbb-0000-0000-0000-000000000002', 'Dubai Family Fun', 'dubai-family-fun', 'Family-friendly Dubai tour with theme parks, desert safari, and shopping.', 'An exciting 6-day family tour featuring visits to Dubai Mall, Burj Khalifa, Aquaventure Waterpark, desert safari, and Marina cruise. Kids under 5 free!', 'UAE', 'Dubai', '2026-03-25', '2026-03-31', 6, 950, 'USD', 25, 18, 'JW Marriott Marina', 5, 'breakfast', 'flight', false, '["Direct flights", "Hotel with breakfast", "Theme park tickets", "Desert safari", "Airport transfers"]', '["Lunch and dinner", "Shopping money", "Photo packages"]', 'published', false, null),

  ('cccccccc-0000-0000-0000-000000000005', 'bbbbbbbb-0000-0000-0000-000000000003', 'Budget Thailand Escape', 'budget-thailand', 'Affordable 8-day Thailand tour — Bangkok, Pattaya and island hopping.', 'The most affordable way to experience Thailand from Uzbekistan. Visit Bangkok temples, enjoy Pattaya nightlife, and relax on tropical islands.', 'Thailand', 'Bangkok', '2026-05-10', '2026-05-18', 8, 650, 'USD', 20, 15, 'Ibis Bangkok & Pattaya Beach Hotel', 3, 'breakfast', 'flight', true, '["Economy flights", "3-star hotels", "Daily breakfast", "Island hopping tour", "Airport transfers"]', '["Visa fees", "Other meals", "Optional excursions", "Travel insurance"]', 'published', false, null),

  ('cccccccc-0000-0000-0000-000000000006', 'bbbbbbbb-0000-0000-0000-000000000003', 'Georgia Weekend Getaway', 'georgia-weekend', 'Quick 4-day trip to Tbilisi and surroundings. Visa-free for Uzbek citizens.', 'A perfect short getaway to beautiful Georgia. Explore Tbilisi Old Town, visit Mtskheta, and enjoy Georgian cuisine and wine tasting.', 'Georgia', 'Tbilisi', '2026-04-10', '2026-04-14', 4, 420, 'USD', 15, 10, 'Rooms Hotel Tbilisi', 4, 'breakfast', 'flight', false, '["Flights", "Hotel", "Breakfast", "Tbilisi city tour", "Mtskheta excursion", "Wine tasting"]', '["Other meals", "Personal expenses"]', 'published', false, null),

  ('cccccccc-0000-0000-0000-000000000007', 'bbbbbbbb-0000-0000-0000-000000000004', 'Maldives Honeymoon Dream', 'maldives-honeymoon', 'Exclusive overwater villa experience in the Maldives. All-inclusive luxury.', 'The ultimate honeymoon destination. Stay in an overwater bungalow, enjoy spa treatments, snorkeling with marine life, and sunset cruises. All-inclusive premium package.', 'Maldives', 'Male', '2026-06-01', '2026-06-08', 7, 3500, 'USD', 8, 3, 'Soneva Fushi', 5, 'all_inclusive', 'flight', true, '["Business class flights", "Overwater villa", "All meals & drinks", "Spa credit", "Snorkeling gear", "Sunset cruise", "Airport transfers"]', '["Extra spa treatments", "Diving courses"]', 'published', true, null),

  ('cccccccc-0000-0000-0000-000000000008', 'bbbbbbbb-0000-0000-0000-000000000004', 'Bali Adventure & Culture', 'bali-adventure', 'Temples, rice terraces, surfing and nightlife in beautiful Bali.', 'Explore the spiritual and natural beauty of Bali. Visit Ubud temples, trek through rice terraces, surf in Kuta, and experience the vibrant nightlife of Seminyak.', 'Indonesia', 'Bali', '2026-05-15', '2026-05-25', 10, 1100, 'USD', 18, 14, 'Alila Ubud & W Seminyak', 5, 'half_board', 'flight', true, '["Flights", "5-star hotels", "Half board meals", "Temple tours", "Rice terrace trek", "Surfing lesson", "Airport transfers"]', '["Visa on arrival fee", "Extra activities", "Nightlife expenses"]', 'published', false, null),

  ('cccccccc-0000-0000-0000-000000000009', 'bbbbbbbb-0000-0000-0000-000000000001', 'Uzbekistan Heritage Trail', 'uzbekistan-heritage', 'Discover the Silk Road cities — Samarkand, Bukhara, Khiva and Tashkent.', 'A comprehensive domestic tour for visitors and locals alike. Explore UNESCO World Heritage sites including Registan Square, Ark Fortress, and Ichan-Kala.', 'Uzbekistan', 'Samarkand', '2026-04-05', '2026-04-12', 7, 380, 'USD', 25, 20, 'Various 3-4 star hotels', 4, 'full_board', 'bus', false, '["Comfortable bus transport", "Hotels in each city", "All meals", "Professional guide", "All entrance fees", "Welcome dinner"]', '["Personal expenses", "Tips for guide"]', 'published', false, null),

  ('cccccccc-0000-0000-0000-000000000010', 'bbbbbbbb-0000-0000-0000-000000000002', 'Egypt Pyramids & Nile', 'egypt-pyramids-nile', 'Visit the Pyramids of Giza, explore Cairo, and cruise the Nile River.', 'A magical journey through ancient Egypt. See the Great Pyramids, the Sphinx, Luxor Temple, and enjoy a luxury Nile cruise from Aswan to Luxor.', 'Egypt', 'Cairo', '2026-05-20', '2026-05-29', 9, 1350, 'USD', 20, 16, 'Marriott Mena House & Nile Cruise', 5, 'full_board', 'flight', true, '["Flights", "5-star hotel in Cairo", "Nile cruise", "Full board", "Pyramid tour", "Luxor temple", "Visa assistance"]', '["Visa fee", "Optional felucca ride", "Personal purchases"]', 'published', false, null),

  ('cccccccc-0000-0000-0000-000000000011', 'bbbbbbbb-0000-0000-0000-000000000003', 'Malaysia Kuala Lumpur Express', 'malaysia-kl-express', 'Quick business + leisure trip to Kuala Lumpur. Modern city meets tropical nature.', 'Perfect for a short getaway. Visit Petronas Towers, Batu Caves, enjoy street food in Jalan Alor, and shop at Bukit Bintang.', 'Malaysia', 'Kuala Lumpur', '2026-04-28', '2026-05-03', 5, 580, 'USD', 20, 17, 'Traders Hotel by Shangri-La', 4, 'breakfast', 'flight', false, '["Flights", "4-star hotel", "Breakfast", "City tour", "Airport transfers", "SIM card"]', '["Other meals", "Shopping", "Optional day trips"]', 'published', false, null),

  ('cccccccc-0000-0000-0000-000000000012', 'bbbbbbbb-0000-0000-0000-000000000004', 'Sharm el Sheikh Beach Holiday', 'sharm-beach-holiday', 'All-inclusive Red Sea beach resort holiday with diving opportunities.', 'Relax at a 5-star all-inclusive resort on the Red Sea. Enjoy water sports, snorkeling at coral reefs, and Egyptian entertainment.', 'Egypt', 'Sharm el Sheikh', '2026-06-10', '2026-06-17', 7, 780, 'USD', 30, 25, 'Rixos Sharm el Sheikh', 5, 'all_inclusive', 'flight', true, '["Charter flight", "5-star all-inclusive resort", "Beach access", "Pool", "Snorkeling trip", "Airport transfers"]', '["Diving course", "Excursions to Cairo", "Personal shopping"]', 'published', false, null);

-- ============================================================
-- Tour Images
-- ============================================================
INSERT INTO tour_images (tour_id, image_url, sort_order) VALUES
  ('cccccccc-0000-0000-0000-000000000001', 'https://placehold.co/800x600/0ea5e9/white?text=Istanbul+1', 1),
  ('cccccccc-0000-0000-0000-000000000001', 'https://placehold.co/800x600/0ea5e9/white?text=Istanbul+2', 2),
  ('cccccccc-0000-0000-0000-000000000003', 'https://placehold.co/800x600/059669/white?text=Umrah+1', 1),
  ('cccccccc-0000-0000-0000-000000000007', 'https://placehold.co/800x600/06b6d4/white?text=Maldives+1', 1),
  ('cccccccc-0000-0000-0000-000000000007', 'https://placehold.co/800x600/06b6d4/white?text=Maldives+2', 2);

-- ============================================================
-- Leads (demo)
-- ============================================================
INSERT INTO leads (tour_id, agency_id, full_name, phone, telegram_username, comment, status) VALUES
  ('cccccccc-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000001', 'Alisher Navoiy', '+998901112233', '@alisher_n', 'Interested in family group booking for 4 people', 'new'),
  ('cccccccc-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000001', 'Dilnoza Karimova', '+998902223344', '@dilnoza_k', 'Can you add a side trip to Antalya?', 'contacted'),
  ('cccccccc-0000-0000-0000-000000000003', 'bbbbbbbb-0000-0000-0000-000000000002', 'Rustam Akbarov', '+998903334455', '@rustam_a', 'Need visa assistance for Saudi Arabia', 'new'),
  ('cccccccc-0000-0000-0000-000000000007', 'bbbbbbbb-0000-0000-0000-000000000004', 'Zarina Sultanova', '+998904445566', '@zarina_s', 'Planning for our anniversary, need the best room available', 'won'),
  ('cccccccc-0000-0000-0000-000000000005', 'bbbbbbbb-0000-0000-0000-000000000003', 'Jasur Toshmatov', '+998905556677', null, 'Is the visa included in the price?', 'new');

-- ============================================================
-- Featured Items
-- ============================================================
INSERT INTO featured_items (tour_id, agency_id, placement_type, starts_at, ends_at) VALUES
  ('cccccccc-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000001', 'home_featured', now(), now() + interval '30 days'),
  ('cccccccc-0000-0000-0000-000000000003', 'bbbbbbbb-0000-0000-0000-000000000002', 'home_featured', now(), now() + interval '30 days'),
  ('cccccccc-0000-0000-0000-000000000007', 'bbbbbbbb-0000-0000-0000-000000000004', 'home_featured', now(), now() + interval '30 days');
