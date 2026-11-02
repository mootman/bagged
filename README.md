# Register (working name)

A summit passport. It fills itself in from your photos, and your friends fill it in when they tag you.

To rename the app, change `src/constants/brand.ts` and `name` in `app.json`.

MVP scope: Colorado 14ers only (the traditional 58).

## The product

Three jobs, in order of how often people need them:

1. **Who's going, and can I join?** Plans with open seats. Your crew's plans, plus public plans from climbers you don't know yet. Inviting suggests friends who want that peak.
2. **What's it like up there right now?** Every ascent can carry a four-tap conditions report (surface, traction, wind, time on top). Peak pages lead with the freshest one. The feed counts fresh reports.
3. **Your record, filled in by your crew.** Climb together, log once: tagging friends or finishing a plan puts the summit on everyone's register. The passport, ridgeline posters and 3D view make that record worth keeping.

Social layer: follow, feed (one card per group climb, milestones like "19th 14er"), kudos (double-tap), comments, want-to-climb lists, "you both want Capitol, plan it together", profiles.

**Demo crew.** Until accounts are live, the app runs on sample friends, plans and reports (`src/lib/social/seed.ts`) and says so on the You tab. The backend schema with row level security is in `supabase/social.sql`; wiring the client to it is the next step.

## What's in the MVP

- **Find summits from your camera roll.** The app reads the GPS location saved on each photo and checks it against the summit of every 14er. Nothing leaves the phone. Matches are grouped by peak and day, and you confirm each one.
- **GPX import.** Works with Garmin, Gaia, CalTopo, or any app that exports GPX.
- **Passport.** A map that lights up the peaks you've done, list progress (`11/58`), Four Favorites, and a diary.
- **Manual logging** from the Peaks tab.
- **Tag your crew.** Each partner gets a claim link: "You summited Quandary with Matt. Claim it." The link opens a page that works without an account. Requires Supabase (see below).
- **Summit card.** A full-bleed 9:16 image for Instagram stories, using your summit photo and list progress.
- **Safety basics.** Warnings on Class 3+ peaks, no route directions, and links to 14ers.com for routes and conditions.

Intentionally left out for now: crews and planning, the want-to-climb list, live GPS tracking, offline maps, Apple Health import, accounts and sync, and a paid tier.

## Visual system

The look comes from the subject: a USGS topo sheet and Colorado trail signage, not a generic dark app.

- **Paper and ink.** Pale topo-sheet ground (`#ECEEE8`). Surfaces separate by tone, not by borders or shadows.
- **One ink color.** Ballpoint blue (`#1B4FCB`) marks what you've climbed and the one action that matters on a screen. Unclimbed stays pencil grey.
- **Overpass**, an open-source cut of Highway Gothic, the typeface on US trail and highway signs. Five sizes, far apart. Sentence case everywhere.
- **The art is the data.** Ridgelines are traced from real elevation tiles. Summits use the topo map's triangle. The 3D relief and the light slider stay as the one showpiece interaction.
- **People are initials** on a pale tint of their own hue, the same every time.
- **Square corners.** No pills, no glow, no gradients except the sky.

## Design principles

Checked against the anti-AI-design rulesets in [taste-skill](https://github.com/leonxlnx/taste-skill), [anti-ai-slop](https://github.com/Vinayak-Shukla-03/anti-ai-slop) and [impeccable](https://github.com/pbakaus/impeccable). The app avoids:
mono micro-labels, uppercase tracked kickers, hairline boxes, dark-with-neon palettes, serif plus mono kits, italic accent words, 1/2/3 lists, middle-dot metadata, decorative coordinates, emoji icons and three-part headlines. Copy uses climbers' words ("We made it up", "Ask to join", "Conditions lately").

## Run it

```bash
npm install
npx expo start
```

The photo scan and summit card need native modules that aren't in Expo Go, so use a development build:

```bash
npx eas-cli@latest build --profile development --platform ios
# or, with Xcode installed:
npx expo run:ios
```

Peaks, logging, and the passport also run in the browser with `npx expo start --web`. The photo scan doesn't work on web.

## Claim links (optional backend)

1. Create a free Supabase project.
2. Run `supabase/schema.sql` in its SQL editor.
3. Copy `.env.example` to `.env` and fill in the URL and anon key.
4. To make links open in a browser, deploy the web build and set `EXPO_PUBLIC_WEB_URL`:
   ```bash
   npx expo export --platform web   # output in dist/, deploy anywhere static (EAS Hosting, Vercel, Netlify)
   ```

Without a backend, everything else still works. Partners are saved but no link is created.

The `claim_funnel` view in Supabase shows tags sent vs. claimed per week. That's the main growth metric to watch.

## Tests

```bash
npx vitest run     # summit detection + GPX parsing
npx tsc --noEmit
npx expo lint
```

## How detection works

`src/lib/detect.ts`

- A photo counts if it's within 120 m of a summit, or 50 m for a GPS track point.
- It's high confidence if it's within 50 m (photos) or 25 m (tracks).
- Each point is credited only to the closest peak, so a photo on Grays doesn't also count for Torreys.
- Points that land on the same peak on the same local day merge into one candidate.
- Five unranked peaks (Conundrum, North Eolus, Mount Cameron, and others) have unverified coordinates. They're marked `approx` and get a wider radius, but never high confidence.

## Data to verify before launch

- Coordinates for the peaks marked `approx` in `src/data/co14ers.ts`.
- The Class 3+ list in `src/app/peak/[id].tsx`.
- Whether Mount Cameron belongs in your version of "the 58". Lists differ.

Peak coordinates come from Wikipedia's list of Colorado fourteeners and soaringweb.org's CO 14er control points.
