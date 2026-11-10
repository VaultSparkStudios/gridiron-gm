# Player art (work in progress)

Source art for the player renders that will appear on the player card, draft night, free agency
signings and the Hall of Fame induction. Nothing in this folder ships with the game yet; the
screens will load processed copies from `public/` once they are built.

## Status

| | Done | Teams |
|---|---|---|
| Player sprites (6 per team) | 32 / 32 | all |
| Number sheets | 32 / 32 | all (Giants use `numbers/NYG_original.png`) |

Giants: `players/NYG_numbered/NYG_{00-99}.png` are full renders with the real number already on the
chest, shoulders and helmet (1086 x 1448, one per available number, 88 in all). The build follows the
number (slimmer in the teens and 80s, heaviest in the 60s and 70s). Use these for Giants players; the
six number-less Giants sprites are the fallback. Missing numbers are retired by the Giants: 4, 7, 10,
11, 14, 16, 32, 40, 42, 50, 56, 92. A player who arrives wearing one of those uses a fallback sprite
with his number added.

Custom renders: `players/{TEAM}_custom/{TEAM}_{Last}_{##}.png`, realistic renders of named players in the same
pose and framing, shown while the player is on that team. Giants: Dart, Carter, Reese, Nabers, Skattebo, Burns,
Hood, Thomas, Mauigoa, Likely. Texans: Stroud, Collins, Harrison, Anderson, Hunter, Stingley, Dell. Cardinals:
Baker, Froholdt, Johnson Jr., McBride, Sweat. Falcons: Bates III, Lindstrom, London, Robinson, Terrell Jr. Ravens: Andrews, Hamilton, Henry, Jackson, Smith. Bills: Allen, Brown,
Cook III, Dawkins, Rousseau. Panthers: Brown, Horn, Lewis, Lloyd, McMillan. Every other club: its top five (160 in all, listed in the zips' NFL_Player_Render_Index.csv). A suffix in the file name (JohnsonJr, CookIII) is
fine; the number picks between two players with the same last name.

None of the source PNGs here (players/ and numbers/) are kept in git any more (each is 1-2MB; the repo was nearing GitHub's 1GB guideline); earlier copies are still in the history. Keep the zips
they came in as the masters. To add renders: unzip into `players/{TEAM}_custom/`, run
`python3 tools/export_web.py --keep` (from `art/`), and commit only what it writes in `public/players/`. The
manifest is built from the exported webp files, so later runs without the PNGs keep every custom render, and
without a skin list the darker-skin list already in the manifest is kept.

Open notes:
- **MIA**: the sheet came back aqua with orange trim (made for a white jersey); the home jersey is aqua,
  so `clean_number_sheets.py` fills the digits white and keeps the trim.
- **CLE**: the sheet came back plain white; `clean_number_sheets.py` recolours it Browns orange with a
  white outline.

## Layout

- `players/{TEAM}/{TEAM}_{Lean|Athletic|Big}_{Dark|Light}.png`: 1024 x 1536, transparent, no numbers.
  File names were checked against the images (four Giants files were mislabeled by ChatGPT and renamed).
- `numbers/{TEAM}.png`: a cleaned row of ten digits 0-9 (green screens keyed out, specks removed,
  dot textures stripped on DEN and DET).
- `numbers/source/`: the sheets as delivered, before cleaning.
- `tools/compose.py`: puts a number and the moody grade on a player. `python3 compose.py --sheet NYG`
  renders all six. `tools/clean_number_sheets.py` rebuilds `numbers/` from `numbers/source/`.
  `tools/check_players.py TEAM` checks a batch (size, transparency, stray pieces, build/skin labels).

`tools/export_web.py` writes what the game loads into `public/players/` (blank players cropped to
helmet-to-thigh, digit strips, the Giants renders, manifest.json); the game adds the number and lighting.

Needs Python 3 with `opencv-python-headless`, `numpy` and `Pillow`.

## ChatGPT prompt: player sprites

```
TEAM = Pittsburgh Steelers
(Everywhere this prompt says [TEAM], it means the team named on the line above.
[TEAM_CODE] means that team's 2–3 letter abbreviation, e.g. PIT, NYG, KC.)

READ ALL OF THIS BEFORE DOING ANYTHING.

I need player images for a football video game. The game adds jersey numbers itself, so every
image must have NO numbers. These images must all match each other exactly in pose and framing,
so follow every rule below.

WHAT TO MAKE: SIX SEPARATE IMAGES FOR [TEAM]
  1. Lean, darker skin      2. Lean, lighter skin
  3. Athletic, darker skin  4. Athletic, lighter skin
  5. Big, darker skin       6. Big, lighter skin

RULE 1 — ONE PLAYER PER IMAGE. NEVER A GROUP. (MOST IMPORTANT)
- Generate SIX SEPARATE IMAGES. Each image contains exactly ONE player.
- NEVER make an image with more than one player in it, for ANY reason, at ANY point —
  not as a draft, not as a preview, not as a summary, not as a reference, not at the end.
- No group shots, lineups, "team photo", side-by-side, grid, contact sheet, comparison, collage.
- Do NOT generate one big image and crop it into six. Each player is its own full 1024 x 1536 generation.
- Use IMAGE GENERATION. Do not write code.

RULE 2 — BODY BUILDS (REAL NFL PLAYERS, NOT BODYBUILDERS)
- LEAN (QB/WR/CB/S): tall and athletic, long limbs, lean but not skinny, normal arm size.
- ATHLETIC (RB/TE/LB): solid and compact, thick legs and shoulders, some definition, realistic —
  a real running back or linebacker, NOT a fitness model.
- BIG (OL/DL): 310–340 lb linemen. Heavy and thick, NOT ripped: round full belly pushing the jersey
  out, thick soft arms with little definition, wide hips, thick thighs and neck, rounded shoulders.
  NO six-pack, NO veins, NO bulging biceps, NO V-shaped torso. A real starting tackle at media day.
- Similar height across builds (Big is wider, not taller).

RULE 3 — POSE AND FRAMING (IDENTICAL IN ALL SIX)
- Standing, facing the camera, head bowed so the helmet hides the face, hands clasped at the waist.
- Full body, top of helmet to feet, centered: helmet top ~40 px from the top, feet ~40 px from the bottom.

RULE 4 — UNIFORM
- [TEAM]'s real 2026 HOME uniform: jersey, helmet, stripes/decals, pants, socks, colors.
- NO NUMBERS ANYWHERE (chest, back, shoulders, sleeves, helmet). Logos and decals are fine.

RULE 5 — IMAGE STYLE
- PNG, exactly 1024 x 1536, TRANSPARENT background, soft even studio lighting.
- No background, floor, shadow, text, watermark. Clean edges, no halos or specks.

DELIVERY
- One zip with exactly six PNGs and NOTHING ELSE, named:
  [TEAM_CODE]_Lean_Dark.png, [TEAM_CODE]_Lean_Light.png, [TEAM_CODE]_Athletic_Dark.png,
  [TEAM_CODE]_Athletic_Light.png, [TEAM_CODE]_Big_Dark.png, [TEAM_CODE]_Big_Light.png
- Do NOT include or show any preview, overview, or combined image — in the zip or in the chat.

BEFORE YOU DELIVER — for each file answer yes/no: 1024x1536 transparent? ONE player? same pose and
framing? file name matches the image (Big = heaviest, Lean = slimmest, Dark/Light = skin tone)?
Big is heavy, not a bodybuilder? no numbers anywhere? Also confirm: "I did not create any image
containing more than one player." Fix anything that fails before delivering.
```

## ChatGPT prompt: number sheet (attach `numbers/source/NYG_original_sheet.png` as the reference)

```
TEAM = Pittsburgh Steelers
(Everywhere this prompt says [TEAM], it means the team named on the line above.)

READ ALL OF THIS BEFORE DOING ANYTHING.
The attached image is the New York Giants' jersey numbers 0–9. It is EXACTLY the kind of result
I want. Make the same thing for [TEAM]'s 2026 HOME jersey.

RULE 1 — Use IMAGE GENERATION. Do NOT write code, use Python, fonts, SVG or vectors, and do NOT
make a sprite pack, zip, manifest or multiple teams. ONE generated image.
RULE 2 — Draw [TEAM]'s real jersey numbers: real shapes, proportions, stroke, corner cuts, serifs,
fill color and outline colors. NOT a generic block or condensed font.
RULE 3 — Ten digits in ONE row, 0 1 2 3 4 5 6 7 8 9, same height, same baseline, clear gaps,
filling most of the image height.
RULE 4 — Flat and front-on. No jersey, fabric, texture, dots, shadow, glow, 3D or text.
Transparent background, or a solid bright green (#00FF00) with no green in the digits.

Before generating, describe [TEAM]'s real numbers in 2–3 sentences. After, confirm: image
generation and no code? ten digits 0–9 in order? real [TEAM] style? correct colors? flat, nothing
else in the image? Fix and regenerate if anything is "no".
```

## ChatGPT prompt: custom Giants (one named player per chat message)

Attach two images: the matching `players/NYG_numbered/NYG_{##}.png` (pose reference) and a real
photo of the player (gear and build reference). Change the `PLAYER =` line each time.

```
PLAYER = Jaxson Dart
(Everywhere this prompt says [PLAYER], it means the player named on the line above. Find him in
the table below for his number, position and build.)

READ ALL OF THIS BEFORE DOING ANYTHING.

I am making a New York Giants card for a football video game. I attached TWO images:
  - IMAGE A: a Giants player render. This is the EXACT pose, framing, camera angle, lighting and
    uniform style I want. Copy it.
  - IMAGE B: a real photo of [PLAYER]. Use it ONLY for his body type, skin tone and gear.
Make ONE photorealistic image of [PLAYER] standing exactly like IMAGE A.

| Player          | #  | Pos     | Ht    | Wt  | Build notes                                          |
|-----------------|----|---------|-------|-----|------------------------------------------------------|
| Jaxson Dart     | 6  | QB      | 6'2"  | 221 | lean quarterback, white                              |
| Malik Nabers    | 1  | WR      | 6'0"  | 199 | slim, wiry, long arms                                |
| Abdul Carter    | 3  | EDGE    | 6'4"  | 250 | long, explosive edge rusher, broad shoulders         |
| Arvell Reese    | 52 | LB      | 6'4"  | 241 | tall, rangy linebacker                               |
| Cam Skattebo    | 44 | RB      | 5'10" | 216 | short, very thick and stocky, white, beard           |
| Andrew Thomas   | 78 | LT      | 6'5"  | 315 | big tackle, thick, NOT ripped                        |
| Francis Mauigoa | 65 | RG      | 6'6"  | 315 | big Samoan lineman, heavy, round, NOT ripped         |
| Brian Burns     | 0  | EDGE    | 6'5"  | 250 | long, lean, very long arms                           |
| Colton Hood     | 12 | CB      | 6'0"  | 193 | lean cornerback                                      |
| Dru Phillips    | 22 | CB      | 5'11" | 180 | compact, slim nickel corner                          |
| Deonte Banks    | 2  | CB      | 6'2"  | 205 | tall, long cornerback                                |

RULE 1 — ONE PLAYER, ONE IMAGE. NEVER A GROUP.
- Exactly ONE person in the image. No teammates, no side-by-side, no grid, no collage, no preview,
  no comparison, no "here are all of them". Only [PLAYER].
- Use IMAGE GENERATION. Do not write code.

RULE 2 — POSE AND FRAMING: COPY IMAGE A EXACTLY
- Standing straight, facing the camera, shoulders square.
- Head bowed DOWN so the helmet and facemask hide his face. No face visible.
- Arms hanging straight down in front, gloved hands clasped together at the waist.
- Top of the helmet about 35 px from the top edge. The image is cut off at the upper thigh at the
  bottom edge, like IMAGE A. Centered left to right.
- Same camera height and lens as IMAGE A. No tilt, no angle, no action pose.

RULE 3 — HIS REAL BODY (from the table and IMAGE B)
- Match his real height, weight, proportions and skin tone. He should look like HIM, not a generic
  player.
- Real NFL body, NOT a bodybuilder. No exaggerated veins or giant biceps. Linemen (Thomas,
  Mauigoa) are heavy with a full belly and thick soft arms, not a six-pack.

RULE 4 — HIS REAL GEAR (from IMAGE B and what you know about him)
- Giants 2026 HOME uniform exactly like IMAGE A: royal blue jersey, white pants with red/blue
  stripe, blue helmet with red center stripe and white "ny" logos, grey facemask unless he wears a
  different one.
- Copy HIS personal gear: facemask style, visor (clear/tinted/none), gloves, arm sleeves, tape,
  wristbands, towel, under-shirt sleeves, neck roll, anything he is known for.
- His number [#] in white Giants block numbers, in the SAME places as IMAGE A: big on the chest,
  on both shoulders, small on the front of the helmet. The digits must be correct and readable.
- NO name, text, captions or watermarks anywhere.

RULE 5 — IMAGE STYLE
- PNG, exactly 1086 x 1448, TRANSPARENT background. Same soft studio lighting as IMAGE A.
- Photorealistic: real fabric, real skin, real helmet shine. Not a cartoon, not a video-game render.
- No floor, no shadow, no background, no halos or specks around the edges.

DELIVERY
- One PNG named NYG_[LASTNAME]_[##].png (example: NYG_Dart_06.png, NYG_Burns_00.png).
- Do NOT show any other image in the chat.

BEFORE YOU DELIVER — answer yes/no: ONE person? face hidden by the bowed helmet? pose and framing
match IMAGE A? his real build and skin tone? his real gear? correct number on chest, both
shoulders and helmet? 1086x1448 transparent? no text? Fix and regenerate anything that is "no".
```
