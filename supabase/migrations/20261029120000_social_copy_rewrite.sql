-- NOT YET APPLIED. Run in the Supabase SQL editor (project ggrhuhwxbwrfbbcwcrmv).
--
-- Rewrites transits.copy for the 12 signs, and the Taurus hashtags (#EarthMedicine becomes #EarthSign).
-- Rows are matched on transits.id, which is the lowercase sign slug ('aries' ... 'pisces').
-- Touches only copy and hashtags. status, published_at, social_posted_at, image_url, ritual_tip and every other
-- column are left alone. (The existing update_transits_updated_at trigger still bumps updated_at on each updated row.)
--
-- The backup is created first. If transits_copy_backup_20261029 already exists this script stops with an error
-- before changing anything, so a second run can never overwrite the backup with the new text.

create table transits_copy_backup_20261029 as select id, copy, hashtags from transits;
alter table transits_copy_backup_20261029 enable row level security;

update transits set copy = 'Moon in Aries sharpens the instinct for bold, rapid action. Notice the impulse to start fresh, and direct that drive into a single, clean initiative.' where id = 'aries';

update transits set copy = 'Moon in Taurus centers attention on what is steady and concrete. Clarity around resources or long-term value deepens when key choices are left unhurried.',
  hashtags = array['#TaurusEnergy', '#VenusVibes', '#EarthSign', '#MoondayLive'] where id = 'taurus';

update transits set copy = 'Moon in Gemini accelerates curiosity and logic. Insights strike from multiple angles at once; capturing them in writing helps map out the mental noise.' where id = 'gemini';

update transits set copy = 'Moon in Cancer turns focus inward toward memory and core emotional foundations. Listen closely to the quiet undertones of a room, and prioritize spaces to reset.' where id = 'cancer';

update transits set copy = 'Moon in Leo invites creative expression and visible presence. Notice where an idea is being held back, and let genuine enthusiasm carry it past the fear of exposure.' where id = 'leo';

update transits set copy = 'Moon in Virgo rewards structural clarity and fine detail. Sorting a complex workflow, clearing an inbox, or organizing a system offers a quiet sense of control.' where id = 'virgo';

update transits set copy = 'Moon in Libra highlights balance and fairness in relationships. Tension in collaboration can ease when you lead with poise. Look for where the two sides align.' where id = 'libra';

update transits set copy = 'Moon in Scorpio cuts straight through superficial layers. Track what is left unspoken or hidden beneath frustration; use that raw intensity for deep work.' where id = 'scorpio';

update transits set copy = 'Moon in Sagittarius widens the lens on immediate problems. Note what calls for a broader perspective, whether it is an unfamiliar philosophy or a distant plan.' where id = 'sagittarius';

update transits set copy = 'Moon in Capricorn favors deliberate, long-term effort. Focus on the unglamorous, foundational work that compounds over time instead of chasing quick returns.' where id = 'capricorn';

update transits set copy = 'Moon in Aquarius widens the mind toward the big picture and how systems fit together. Seek out unusual perspectives and unconventional networks that open up new angles.' where id = 'aquarius';

update transits set copy = 'Moon in Pisces softens rigid boundaries and favors imagination. Use creative, intuitive outlets to work through complex undercurrents without forcing a fix.' where id = 'pisces';

-- Verify: 12 rows, each with its new copy and length
select sign, copy, length(copy) as copy_length, hashtags from transits order by array_position(array['aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces'], id);

-- ROLLBACK (run only if you want the old copy and hashtags back; the backup table must still exist):
-- update transits t set copy = b.copy, hashtags = b.hashtags from transits_copy_backup_20261029 b where b.id = t.id;
-- Once you are happy with the new copy, the backup can be dropped:  drop table transits_copy_backup_20261029;
