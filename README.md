# SWIFT HAND

A shedding card game. Empty your hand first. Last card can still tax you. The table is mean on purpose.

52-card pack plus two Jokers. Black Joker plays as spades. Red Joker plays as hearts.

## Play

Open the site. Play **offline** against the house, or **create a room** and send the code.

Faces use Byron Knoll's classic PNG deck — rank and suit sit in the corner, so a fanned hand stays readable when cards overlap.

## Host on Railway (clean slate)

GitHub’s website only accepts 100 files per upload. This package is ~40 files: `src` and `public` travel as `src.zip` and `public.zip`, and the Railway build unpacks them.

1. Create a **new empty GitHub repo** (no README, no .gitignore).
2. Unzip `swift-hand-github.zip` and open the `swift-hand` folder.
3. On GitHub choose **uploading an existing file**. Drag **everything inside** `swift-hand` — `package.json` must sit at the **repo root**, not inside another folder.
4. Wait until GitHub lists `package.json`, `src.zip`, `public.zip`, `railway-build.mjs`. Commit.
5. Create a **new Railway project** → Deploy from that GitHub repo.
6. Leave **Root Directory** blank.
7. If you fill commands in by hand:
   - **Install / build:** `npm install --include=dev && npm run build:railway`
   - **Start:** `node .output/server/index.mjs`

Do **not** start the site with `vite` or `npm run preview`. Skip `node_modules`.

Offline play works with no extra services. For rooms across restarts, add Railway Postgres and set `DATABASE_URL`.

## Host on Vercel

Same repo. Root Directory blank. Do not set an Output Directory. Build command: `npm run build`.

## Rules in brief

Dump or pick up — never both. First card matches rank, current suit, or a wild (Joker, Ace, 2/Jack on 2/Jack). Then chain same rank, consecutive same-suit, or special pairings.

- **2** / **black Jack** stack pickup debt. **Red Jack** kills it.
- **Queen** hangs. Cover her or pick up 1. Last-card Queen does not put you out.
- **King** skips. With two still in, it bounces.
- **7** reverses. With two still in, it acts like a King.
- **Ace** starts on anything; only Aces follow; last Ace names the suit.
- **Joker** sits on anything and swaps hands with the next seat still in — unless it is your last card, in which case you are out and there is no swap.
