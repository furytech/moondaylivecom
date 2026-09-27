
-- 1. Direct UPDATE on existing rows matching each sign id
UPDATE public.transits SET image_url = 'https://ggrhuhwxbwrfbbcwcrmv.supabase.co/storage/v1/object/public/transit-images/aries.png', updated_at = now() WHERE lower(id) = 'aries';
UPDATE public.transits SET image_url = 'https://ggrhuhwxbwrfbbcwcrmv.supabase.co/storage/v1/object/public/transit-images/taurus.png', updated_at = now() WHERE lower(id) = 'taurus';
UPDATE public.transits SET image_url = 'https://ggrhuhwxbwrfbbcwcrmv.supabase.co/storage/v1/object/public/transit-images/gemini.png', updated_at = now() WHERE lower(id) = 'gemini';
UPDATE public.transits SET image_url = 'https://ggrhuhwxbwrfbbcwcrmv.supabase.co/storage/v1/object/public/transit-images/cancer.png', updated_at = now() WHERE lower(id) = 'cancer';
UPDATE public.transits SET image_url = 'https://ggrhuhwxbwrfbbcwcrmv.supabase.co/storage/v1/object/public/transit-images/leo.png', updated_at = now() WHERE lower(id) = 'leo';
UPDATE public.transits SET image_url = 'https://ggrhuhwxbwrfbbcwcrmv.supabase.co/storage/v1/object/public/transit-images/virgo.png', updated_at = now() WHERE lower(id) = 'virgo';
UPDATE public.transits SET image_url = 'https://ggrhuhwxbwrfbbcwcrmv.supabase.co/storage/v1/object/public/transit-images/libra.png', updated_at = now() WHERE lower(id) = 'libra';
UPDATE public.transits SET image_url = 'https://ggrhuhwxbwrfbbcwcrmv.supabase.co/storage/v1/object/public/transit-images/scorpio.png', updated_at = now() WHERE lower(id) = 'scorpio';
UPDATE public.transits SET image_url = 'https://ggrhuhwxbwrfbbcwcrmv.supabase.co/storage/v1/object/public/transit-images/sagittarius.png', updated_at = now() WHERE lower(id) = 'sagittarius';
UPDATE public.transits SET image_url = 'https://ggrhuhwxbwrfbbcwcrmv.supabase.co/storage/v1/object/public/transit-images/capricorn.png', updated_at = now() WHERE lower(id) = 'capricorn';
UPDATE public.transits SET image_url = 'https://ggrhuhwxbwrfbbcwcrmv.supabase.co/storage/v1/object/public/transit-images/aquarius.png', updated_at = now() WHERE lower(id) = 'aquarius';
UPDATE public.transits SET image_url = 'https://ggrhuhwxbwrfbbcwcrmv.supabase.co/storage/v1/object/public/transit-images/pisces.png', updated_at = now() WHERE lower(id) = 'pisces';

-- 2. Ensure all 12 signs exist with populated image_url in transits table

INSERT INTO public.transits (
  id, sign, symbol, element, ruler, dates, transit_title, transit_aspect,
  copy, power_hour, ritual_tip, hashtags, image_url, status, published_at, social_posted_at, created_at, updated_at
) VALUES (
  'aries',
  'Aries',
  '♈',
  'Fire',
  'Mars',
  'Mar 21 – Apr 19',
  'Moon in Aries Sextile Mars',
  'Cardinal Ignition',
  'A high-octane charge pulses through your morning instincts. When the Moon harmonizes with Mars, your gut reactions are razor-sharp. Channel primal drive into a bold initiative before the afternoon lull.',
  '08:15 AM EST',
  'Burn frankincense or red cedar while declaring three assertive non-negotiables for the day.',
  ARRAY['#AriesSeason', '#LunarInstinct', '#MarsEnergy', '#DailyTransit', '#MoondayLive']::text[],
  'https://ggrhuhwxbwrfbbcwcrmv.supabase.co/storage/v1/object/public/transit-images/aries.png',
  'pending',
  NULL,
  NULL,
  '2026-09-26T00:00:00Z'::timestamptz,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  updated_at = now();

INSERT INTO public.transits (
  id, sign, symbol, element, ruler, dates, transit_title, transit_aspect,
  copy, power_hour, ritual_tip, hashtags, image_url, status, published_at, social_posted_at, created_at, updated_at
) VALUES (
  'taurus',
  'Taurus',
  '♉',
  'Earth',
  'Venus',
  'Apr 20 – May 20',
  'Moon in Taurus Trine Venus',
  'Sensory Resonance',
  'Earth medicine grounds your nervous system. Savor slow rituals and physical sensations today. Financial clarity crystallizes if you refuse to rush key negotiations.',
  '11:30 AM EST',
  'Drink warm matcha or oat milk with cinnamon; hold raw emerald or green aventurine.',
  ARRAY['#TaurusEnergy', '#VenusVibes', '#EarthMedicine', '#MoondayLive']::text[],
  'https://ggrhuhwxbwrfbbcwcrmv.supabase.co/storage/v1/object/public/transit-images/taurus.png',
  'pending',
  NULL,
  NULL,
  '2026-09-26T00:00:00Z'::timestamptz,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  updated_at = now();

INSERT INTO public.transits (
  id, sign, symbol, element, ruler, dates, transit_title, transit_aspect,
  copy, power_hour, ritual_tip, hashtags, image_url, status, published_at, social_posted_at, created_at, updated_at
) VALUES (
  'gemini',
  'Gemini',
  '♊',
  'Air',
  'Mercury',
  'May 21 – Jun 20',
  'Mercury Conjunct Moon in Gemini',
  'Synaptic Cascade',
  'Your mind operates as an antenna picking up frequencies across multiple rooms. Draft, pitch, and converse with witty precision. Keep notes handy for lightning-bolt ideas.',
  '01:45 PM EST',
  'Write three micro-journal entries across the day capturing unexpected synchronistic words.',
  ARRAY['#GeminiVibe', '#MercuryMind', '#CosmicCuriosity', '#MoondayLive']::text[],
  'https://ggrhuhwxbwrfbbcwcrmv.supabase.co/storage/v1/object/public/transit-images/gemini.png',
  'pending',
  NULL,
  NULL,
  '2026-09-26T00:00:00Z'::timestamptz,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  updated_at = now();

INSERT INTO public.transits (
  id, sign, symbol, element, ruler, dates, transit_title, transit_aspect,
  copy, power_hour, ritual_tip, hashtags, image_url, status, published_at, social_posted_at, created_at, updated_at
) VALUES (
  'cancer',
  'Cancer',
  '♋',
  'Water',
  'The Moon',
  'Jun 21 – Jul 22',
  'Moon Trine Neptune in Pisces',
  'Oceanic Intuition',
  'Psychic boundaries soften today. Trust dreams, subtle undertones in conversation, and emotional ripples. Create a protective cocoon at home tonight to replenish your reservoir.',
  '07:20 PM EST',
  'Take a saltwater or Epsom salt bath infused with lavender oil under low candle glow.',
  ARRAY['#CancerZodiac', '#LunarSanctuary', '#IntuitiveFlow', '#MoondayLive']::text[],
  'https://ggrhuhwxbwrfbbcwcrmv.supabase.co/storage/v1/object/public/transit-images/cancer.png',
  'pending',
  NULL,
  NULL,
  '2026-09-26T00:00:00Z'::timestamptz,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  updated_at = now();

INSERT INTO public.transits (
  id, sign, symbol, element, ruler, dates, transit_title, transit_aspect,
  copy, power_hour, ritual_tip, hashtags, image_url, status, published_at, social_posted_at, created_at, updated_at
) VALUES (
  'leo',
  'Leo',
  '♌',
  'Fire',
  'The Sun',
  'Jul 23 – Aug 22',
  'Sun Trine Moon in Fire Sign',
  'Solar Radiance',
  'Your creative aura commands attention without having to force it. Step into visibility, present your vision, and let your genuine enthusiasm warm everyone in your orbit.',
  '12:00 PM EST',
  'Wear gold or bright citrine jewelry; stand in direct sunlight for 3 minutes taking deep breaths.',
  ARRAY['#LeoSeason', '#SolarConfidence', '#HeartOfGold', '#MoondayLive']::text[],
  'https://ggrhuhwxbwrfbbcwcrmv.supabase.co/storage/v1/object/public/transit-images/leo.png',
  'pending',
  NULL,
  NULL,
  '2026-09-26T00:00:00Z'::timestamptz,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  updated_at = now();

INSERT INTO public.transits (
  id, sign, symbol, element, ruler, dates, transit_title, transit_aspect,
  copy, power_hour, ritual_tip, hashtags, image_url, status, published_at, social_posted_at, created_at, updated_at
) VALUES (
  'virgo',
  'Virgo',
  '♍',
  'Earth',
  'Mercury',
  'Aug 23 – Sep 22',
  'Moon Sextile Saturn in Pisces',
  'Sacred Architecture',
  'Efficiency is your spiritual devotional today. Organizing spreadsheets, physical spaces, or workflow bottlenecks releases massive trapped vital energy.',
  '09:40 AM EST',
  'Cleanse your desk surface with rosemary mist before beginning deep focused work.',
  ARRAY['#VirgoEnergy', '#SacredOrder', '#MindfulFocus', '#MoondayLive']::text[],
  'https://ggrhuhwxbwrfbbcwcrmv.supabase.co/storage/v1/object/public/transit-images/virgo.png',
  'pending',
  NULL,
  NULL,
  '2026-09-26T00:00:00Z'::timestamptz,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  updated_at = now();

INSERT INTO public.transits (
  id, sign, symbol, element, ruler, dates, transit_title, transit_aspect,
  copy, power_hour, ritual_tip, hashtags, image_url, status, published_at, social_posted_at, created_at, updated_at
) VALUES (
  'libra',
  'Libra',
  '♎',
  'Air',
  'Venus',
  'Sep 23 – Oct 22',
  'Moon in Libra Trine Jupiter',
  'Harmonic Equilibrium',
  'Diplomacy, aesthetic refinement, and partnership agreements encounter auspicious goodwill. Bridge differences with calm poise and an eye for mutual elevation.',
  '03:10 PM EST',
  'Arrange fresh flowers or spritz rosewater mist around your workspace to reset harmonic balance.',
  ARRAY['#LibraBalance', '#VenusMagic', '#CosmicHarmony', '#MoondayLive']::text[],
  'https://ggrhuhwxbwrfbbcwcrmv.supabase.co/storage/v1/object/public/transit-images/libra.png',
  'pending',
  NULL,
  NULL,
  '2026-09-26T00:00:00Z'::timestamptz,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  updated_at = now();

INSERT INTO public.transits (
  id, sign, symbol, element, ruler, dates, transit_title, transit_aspect,
  copy, power_hour, ritual_tip, hashtags, image_url, status, published_at, social_posted_at, created_at, updated_at
) VALUES (
  'scorpio',
  'Scorpio',
  '♏',
  'Water',
  'Pluto / Mars',
  'Oct 23 – Nov 21',
  'Moon Sextile Pluto in Aquarius',
  'Subterranean Alchemy',
  'Uncover hidden truths beneath superficial appearances. You possess penetrating psychological insight today. Transmute stagnant grief or frustration into laser-focused ambition.',
  '10:05 PM EST',
  'Burn a black or dark red candle while journaling uncensored truths you are ready to master.',
  ARRAY['#ScorpioDepth', '#PlutoAlchemy', '#TransformationalTruth', '#MoondayLive']::text[],
  'https://ggrhuhwxbwrfbbcwcrmv.supabase.co/storage/v1/object/public/transit-images/scorpio.png',
  'pending',
  NULL,
  NULL,
  '2026-09-26T00:00:00Z'::timestamptz,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  updated_at = now();

INSERT INTO public.transits (
  id, sign, symbol, element, ruler, dates, transit_title, transit_aspect,
  copy, power_hour, ritual_tip, hashtags, image_url, status, published_at, social_posted_at, created_at, updated_at
) VALUES (
  'sagittarius',
  'Sagittarius',
  '♐',
  'Fire',
  'Jupiter',
  'Nov 22 – Dec 21',
  'Moon Trine Jupiter in Gemini',
  'Horizon Expansion',
  'A wanderlust urge stirs your philosophical engine. Broaden your mental horizon through foreign concepts, big-picture brainstorming, or booking travel ventures.',
  '02:30 PM EST',
  'Place a map, globe, or photo of your dream pilgrimage on your desk while setting expansive goals.',
  ARRAY['#SagittariusPath', '#JupiterBlessings', '#EndlessHorizon', '#MoondayLive']::text[],
  'https://ggrhuhwxbwrfbbcwcrmv.supabase.co/storage/v1/object/public/transit-images/sagittarius.png',
  'pending',
  NULL,
  NULL,
  '2026-09-26T00:00:00Z'::timestamptz,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  updated_at = now();

INSERT INTO public.transits (
  id, sign, symbol, element, ruler, dates, transit_title, transit_aspect,
  copy, power_hour, ritual_tip, hashtags, image_url, status, published_at, social_posted_at, created_at, updated_at
) VALUES (
  'capricorn',
  'Capricorn',
  '♑',
  'Earth',
  'Saturn',
  'Dec 22 – Jan 19',
  'Moon Conjunct Saturnian Node',
  'Granite Mastery',
  'Long-term structural building triumphs over temporary gratification. Lay keystones for multi-year empires today; your patience will be rewarded tenfold.',
  '07:45 AM EST',
  'Touch bare stone or mountain crystals; sketch a 3-month milestone ladder on parchment.',
  ARRAY['#CapricornDiscipline', '#LegacyBuilding', '#SaturnianPower', '#MoondayLive']::text[],
  'https://ggrhuhwxbwrfbbcwcrmv.supabase.co/storage/v1/object/public/transit-images/capricorn.png',
  'pending',
  NULL,
  NULL,
  '2026-09-26T00:00:00Z'::timestamptz,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  updated_at = now();

INSERT INTO public.transits (
  id, sign, symbol, element, ruler, dates, transit_title, transit_aspect,
  copy, power_hour, ritual_tip, hashtags, image_url, status, published_at, social_posted_at, created_at, updated_at
) VALUES (
  'aquarius',
  'Aquarius',
  '♒',
  'Air',
  'Uranus / Saturn',
  'Jan 20 – Feb 18',
  'Moon Trine Uranus in Taurus',
  'Quantum Breakthrough',
  'Electrifying innovations pop into consciousness when you step off conventional tracks. Connect with like-minded eccentrics and pioneer decentralized solutions.',
  '04:15 PM EST',
  'Unplug all blue-light electronics for 30 minutes at dusk to allow clean cosmic downloads.',
  ARRAY['#AquariusVision', '#FuturisticThinking', '#BreakTheMold', '#MoondayLive']::text[],
  'https://ggrhuhwxbwrfbbcwcrmv.supabase.co/storage/v1/object/public/transit-images/aquarius.png',
  'pending',
  NULL,
  NULL,
  '2026-09-26T00:00:00Z'::timestamptz,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  updated_at = now();

INSERT INTO public.transits (
  id, sign, symbol, element, ruler, dates, transit_title, transit_aspect,
  copy, power_hour, ritual_tip, hashtags, image_url, status, published_at, social_posted_at, created_at, updated_at
) VALUES (
  'pisces',
  'Pisces',
  '♓',
  'Water',
  'Neptune / Jupiter',
  'Feb 19 – Mar 20',
  'Moon Conjunct Neptune in Pisces',
  'Mystic Solitude',
  'The veil is thin and musical harmonies stir deep spiritual remembrance. Immerse yourself in creative expression, poetry, or prayer. Surrender the need to control outcomes.',
  '06:00 PM EST',
  'Diffuse sandalwood or cedarwood oil; listen to 432Hz or 528Hz solfeggio frequencies while meditating.',
  ARRAY['#PiscesMagic', '#MysticCurrents', '#NeptunianDream', '#MoondayLive']::text[],
  'https://ggrhuhwxbwrfbbcwcrmv.supabase.co/storage/v1/object/public/transit-images/pisces.png',
  'pending',
  NULL,
  NULL,
  '2026-09-26T00:00:00Z'::timestamptz,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  updated_at = now();
