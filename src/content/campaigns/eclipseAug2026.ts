/**
 * Deep Partial Lunar Eclipse in Pisces — August 27/28, 2026.
 * Single source of truth for every channel in the campaign.
 * Copy is written for human cadence: varied sentence length, no em dashes,
 * no stock LLM diction, no meta-announcements.
 */

export const ECLIPSE_PEAK_UTC = "2026-08-28T04:12:00Z";

export interface EclipseFacts {
  obscuration: string;
  peakUtc: string;
  moonLongitude: string;
  moonVelocity: string;
  sunLongitude: string;
  mansion: string;
  sidereal: string;
  draconic: string;
  square: string;
}

export const eclipseFacts: EclipseFacts = {
  obscuration: "96.2% umbral obscuration",
  peakUtc: "04:12 UTC, August 28, 2026",
  moonLongitude: "4°54′ Pisces (tropical)",
  moonVelocity: "13.14°/day geocentric",
  sunLongitude: "4°54′ Virgo, with Mercury close by",
  mansion: "27th lunar mansion, Al Fargh al Thani, the water wheel",
  sidereal: "Aquarius, Shatabhisha nakshatra",
  draconic: "Sagittarius alignment",
  square: "Uranus at 4° Gemini, square to both lights",
};

export interface Lens {
  key: "scientific" | "atmospheric" | "experiential";
  label: string;
  points: { label: string; value: string }[];
}

export const dashboardLenses: Lens[] = [
  {
    key: "scientific",
    label: "Scientific lens",
    points: [
      { label: "Geocentric velocity", value: "13.14°/day. Fast Moon, short window." },
      { label: "Maximum umbral immersion", value: "04:12 UTC, August 28. 96.2% of the disc inside the umbra." },
      { label: "Baseline alert", value: "Melatonin timing and hydration run off-cycle around full-moon nights for a lot of people. Expect shallow sleep and a jumpy startle response for about two nights either side. Entertainment and reflection only, not medical guidance." },
    ],
  },
  {
    key: "atmospheric",
    label: "Atmospheric lens",
    points: [
      { label: "Virgo Sun", value: "Structure, sorting, the spreadsheet impulse. It wants the list finished before anyone is allowed to feel anything." },
      { label: "Pisces Moon", value: "Surrender and drainage. Old feeling coming loose without a tidy filing system attached to it." },
      { label: "The tension", value: "One side keeps auditing. The other keeps leaking. Most of the friction this week lives in that gap, not in the people you are blaming for it." },
    ],
  },
  {
    key: "experiential",
    label: "Experiential lens",
    points: [
      { label: "Cellular hydration", value: "Water with a pinch of salt, early, before caffeine. Boring and it works." },
      { label: "Boundary enforcement", value: "One no, said plainly, before Friday. Pisces eclipses are famous for the yes you regret by Sunday." },
      { label: "Downshift admin load", value: "Move the fiddly paperwork off the 27th and 28th. Judgement on small details goes soft under a 96% eclipse and you will re-do the work anyway." },
    ],
  },
];

export const substackEssay = {
  title: "The Water Wheel: Navigating the August 2026 Pisces Lunar Eclipse",
  body: `# The water wheel: navigating the August 2026 Pisces lunar eclipse

There is a bucket on the wheel that has been going under the water and coming back up for about eighteen months. You know the one. Same argument with yourself, same 11:40pm scroll, same half-finished apology in the drafts folder.

On the night of the 27th into the 28th, that bucket comes up full.

## What is actually happening up there

The Moon reaches 4°54′ of Pisces and slides almost entirely into Earth's shadow. Not a total eclipse. Close enough that you would notice: 96.2 percent of the disc goes copper and dim, with maximum immersion at 04:12 UTC. Opposite her sits the Sun in Virgo, Mercury nearby, doing what Virgo does, which is take inventory of things that cannot be counted.

Then Uranus, sitting at 4° Gemini, cuts across both of them at a right angle. A T-square. The two lights are already arguing about order versus dissolution, and a third voice interrupts with something nobody prepared for.

That is the shape of the week. Two positions, one interruption.

## The 27th mansion

Older material calls this stretch of sky Al Fargh al Thani, the second spout, sometimes read as the lower lip of a water jar and sometimes as a wheel that lifts water out of a well.

I like the wheel better. A wheel does not choose what it carries. It goes down empty, it comes up full, it tips, it goes down again. The mansion has a reputation in the traditional material for the ending of things and for the loosening of what was bound. Not a punishment. A tipping.

If something has been held in place by effort alone, this is the week the effort stops working. That can read as loss on Tuesday and as relief by the following Monday.

## Three lenses

**Tropical: 4°54′ Pisces.** The seasonal frame. Late-summer clearing, the last sign before the wheel starts over, mutable water with no hard edges. Read this for the felt weather.

**Sidereal: Aquarius, Shatabhisha nakshatra.** Against the fixed stars, the eclipse lands in the hundred healers. Shatabhisha is an enclosure, a circle, and it is associated with things that get better in private and slowly. Under this framing the eclipse is less about drama and more about quarantine, in the useful sense: what needs to be walled off long enough to mend.

**Draconic: Sagittarius alignment.** The chart of intention, measured from the nodes. Sagittarius here reads as a question about meaning. Not what you are doing, why you agreed to it. That question tends to arrive at an inconvenient hour.

Three frames, one event. They do not compete. A tropical reading tells you what the room feels like, the sidereal tells you what the body is doing about it, the draconic tells you why you keep walking back into that room.

## Saturn's part in it

Saturn is in Aries here, out of sect for a night event and not in its own territory. Traditional reading, not the doom version: a boundary that is being tested by conditions it did not design. Where you have been over-managing something, the management itself is what buckles. Where you set an honest limit months ago, that limit holds and you find out it was load-bearing.

## What I would actually do

Nothing clever. Get water in early. Keep the 27th and 28th free of anything that needs precise judgement, because Virgo Sun under a 96 percent eclipse produces very confident opinions about details that turn out to be wrong. Say one no out loud.

And write down what comes up at four in the morning, if you are awake, which under a Uranus square you probably will be. Not to interpret it. Just so it exists somewhere outside your head by Saturday.

The wheel keeps turning either way. Might as well see what came up in the bucket.

*Moonday Live is written for reflection and entertainment. Nothing here is medical, financial or legal advice.*

---

### Sovereign Tier

The house overlay is the part that changes the reading. 4°54′ Pisces landing in your second house is a money-and-worth week. In your seventh it is a completely different conversation, and you would treat it differently.

Sovereign runs your natal placements against this eclipse and shows you which house takes the hit and which one gets the release, plus Sun, Mars through Pluto rather than Moon alone. If you want yours mapped before the 27th, it is on moondaylive.com under Sovereign.`,
};

export const redditPost = {
  subreddits: ["r/MoondayLive", "r/AdvancedAstrology"],
  title:
    "Tracking Thread: Deep Partial Lunar Eclipse in Pisces (4°54′) — 96.2% Obscuration & Uranus Square",
  body: `Data first, then three tracking questions at the bottom.

**The aspect math**

Maximum umbral immersion 04:12 UTC, Aug 28 2026. 96.2% obscuration, so deep partial, not total.

Moon 4°54′ Pisces, moving 13.14°/day geocentric.
Sun 4°54′ Virgo, Mercury in the same sign and close enough to colour the opposition with sorting/analysis rather than pure vitality.
Uranus 4° Gemini, partile square to both lights. Mutable T-square, empty leg in Sagittarius.

Nakshatra frame: Shatabhisha (sidereal Aquarius). Arabic/medieval mansion frame: 27th mansion, Al Fargh al Thani, the second spout or water wheel, traditionally read for loosening and endings rather than building.

Draconic positions put the alignment in Sagittarius, which is why I think the "why am I even doing this" flavour is showing up early for people rather than at the eclipse itself.

Saturn in Aries, out of sect for a nocturnal event. I would read that as a stressed boundary rather than the usual doom take.

**What I am tracking and would like peer review on**

1. Natal house activation: which house does 4°54′ Pisces fall in for you, and does the eclipse theme match that house or the house of its ruler? I keep seeing the ruler's house outperform the eclipse house and I want to know if that holds for others.

2. Nervous system: anyone with a partile Uranus contact (natal planet at 3 to 6 degrees of mutable) noticing physical spikes, sleep fragmentation, adrenaline at odd hours in the 48 hours either side? Trying to separate real signal from expectation bias, so please note if you knew the transit beforehand.

3. Timeline release: if you had a Pisces or Virgo eclipse hit in March 2025, did anything from that period actually close out this week, or is this a separate thread entirely?

Post your degree and house system if you contribute, otherwise the data is unusable.`,
};

export const videoStoryboard = {
  title: "45-second vertical cut — Pisces eclipse",
  platforms: "YouTube Shorts, Instagram Reels, TikTok",
  beats: [
    {
      time: "0:00 – 0:04",
      vo: "Ninety six percent of the Moon goes dark on the twenty eighth.",
      visual:
        "Full black frame. Single thin-stroke circle draws itself in ivory. Umbral shadow creeps across from screen right.",
    },
    {
      time: "0:04 – 0:11",
      vo: "Four degrees fifty four of Pisces. Peak at four twelve UTC.",
      visual:
        "Lilac halo ignites at the 4° Pisces mark on a line-art zodiac ring. Degree label types on in monospace. Everything else stays unlit.",
    },
    {
      time: "0:11 – 0:20",
      vo: "The Sun is in Virgo, counting things. The Moon is in Pisces, letting go of them. That is the whole argument.",
      visual:
        "Split composition. Left: thin grid lines assembling. Right: the same lines dissolving into slow particle drift. No faces, no stock footage.",
    },
    {
      time: "0:20 – 0:29",
      vo: "Then Uranus cuts in at four Gemini. Square to both. Expect the interruption.",
      visual:
        "A hard geometric line snaps across the frame at 90 degrees, breaking the halo for six frames. Brief chromatic jitter, then settle.",
    },
    {
      time: "0:29 – 0:38",
      vo: "Practical version. Hydrate early. Say one no. Move the fiddly paperwork off the twenty seventh.",
      visual:
        "Three champagne hairline rules draw in sequence, each with a short ivory caption. Held on black, generous negative space.",
    },
    {
      time: "0:38 – 0:45",
      vo: "Which house it lands in decides what it means. Yours is on Moonday Live.",
      visual:
        "Lilac halo returns, contracts into the Moonday mark. Small caption: moondaylive.com. Cut to black on the beat, no logo sting.",
    },
  ],
  notes:
    "Voiceover: low, direct, unhurried, clinical baseline. No upward inflection at line ends, no music swell. Bed is a single sub-bass drone with one soft impact at 0:20. Captions burned in, Inter, sentence case, ivory on obsidian. All icons thin stroke at 1.5.",
};
