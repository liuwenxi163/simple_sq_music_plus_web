# Design

## Scene and theme

A NAS owner settles in at their desk or with a phone in the evening, choosing a record and watching the lyrics follow the music. Use an ink-dark music surface that lets covers and listening controls remain prominent without making management text hard to read. Dark is an explicit Spotify reference from the user, not a generic dashboard default.

## Color strategy

Restrained: cool graphite surfaces with a cyan accent reserved for primary actions, playback, active navigation and progress. Use OKLCH tokens. Neutral chroma stays subtle and no surface uses pure black or white. Semantic success, warning and error states also use text and icons.

## Typography

Native system sans with Chinese platform fallbacks. Body 14–15px, section titles 20px, page titles 28px. Labels remain readable, tables use tabular numerals for time and sizes. No display fonts in controls.

## Layout

Desktop: a compact sidebar, a cover-led listening area, an optional details panel and a persistent bottom player. Mobile: a single content column, bottom navigation and compact player, with a full listening view when requested. Album artwork grids are reserved for real albums; downloads and sync jobs use lists and tables.

## Components

Solid primary actions, quiet secondary actions, consistent line icons and 44px touch targets. Empty states explain the first useful action. Use skeletons for pending content, inline errors with retry, explicit destructive confirmations and no decorative metric cards. Existing useful upstream tools remain accessible in the redesigned navigation.

## Motion

150–200ms opacity/transform transitions, ease out, no bounce. Progress fills use scale transforms. Respect prefers-reduced-motion. Synchronized lyrics follow the active line without moving keyboard focus.

## NOOK refinement

The user specifically requested the finish of their NOOK app. Use its calm ink surfaces, precise fine borders, cool accents and subtle ambient depth, translated into a music player. In the expanded player only, album-derived ambient color and breathing cover motion serve immersion. Lyrics transition by opacity and transform, with restrained smooth scroll. Avoid decorative motion in task management pages. Mobile remains in scope after the user explicitly resumed it.

## Immersive listening stage

The user requires visibly different scenes, rather than one background with minor overlays. Keep large clean artwork, synchronized lyrics and transport readable while replacing the background's actual material and geometry per mode:

- 流光: original pinned React Bits Grainient two-pass liquid field, album-derived colors and RMS-driven flow. Keep maximum color brightness restrained behind text.
- 频谱: matte technical-blue background with 64 actual frequency columns, independent peak markers and a small reflection. Compute available height below the rendered song text and above the timeline; never cover the title.
- 极光: the pinned React Bits Aurora shader rotated into a vertical green/violet light curtain, combined with curved translucent filaments. Darken the lyric side.
- 星海: a deep blue night sky with deterministic depth-projected particles and trails. Integrate RMS/bass-dependent travel speed rather than changing positions abruptly; real frequency bands control brightness. At most 420 stars on desktop and 180 on narrow views.
- 声环: an independent dark stage, radial frequency spokes and a closed waveform ring around the artwork. Lift dark album colors so the ring stays visible.
- 静谧: static artwork, subtle tint and no active visual/audio-analysis loop. Music continues playing.

Aurora is exclusive to the curtain, Grainient to the liquid field; the remaining modes do not inherit either light layer. Preserve static identities while paused, but never invent frequency values. Pause, hidden pages and reduced motion stop motion. WebGL resources are initialized lazily, and Canvas 2D supplies real audio-driven fallback shapes. There is one shared animation loop capped at 30 FPS, a 700,000-pixel vector buffer and at most 420,000 pixels for the active shader. Keep the cover stable and respect the phone cover/lyrics switch.

## Listening room refresh

Cover-led library opening, real account playlist shelves, album-cover playlist headers and quieter download preferences extend the immersive player into browsing. No fabricated recommendations. Show actual NAS-file playback versus platform streaming. The visual scene picker previews twelve distinct modes without crowding the transport on phones. NOOK Music shares the folded-N family mark while retaining its own record outline.

## Nook atmosphere and spacing

The user rejected the brown-black / cream browse theme and the recommendation text touching the card edge. Match the live Nook reference: cool graphite, clear pale text, cyan actions, lavender and blue ambient depth. The scene is a personal listening room on a desktop or phone after work, with enough light and color to feel welcoming while covers stay readable. This explicit reference takes precedence over the earlier warm editorial direction.

React Bits Grainient supplies the shared background. The user rejected the previous ribbon silhouette and the nearly static movement; use a soft radial color field with clearly visible continuous flow, silk lighting and cursor twirls disabled. Advance shader time at 0.65 per second with flow 2 and scale 1.15 so movement is noticeable within a few seconds, keeping the cool palette and readable foreground. Pin the actual upstream source and license; retain the original field and composite shaders rather than labelling a lookalike as React Bits. A native WebGL renderer and Vue wrapper provide a 24 FPS drawing cap, at most 1.1 million drawing pixels on desktop / 480,000 on phones, reduced-motion still rendering, hidden-page suspension, pause behind the full player and a static fallback. The half-resolution field pass feeds the bounded main canvas. The background reads no account or audio data.

Use a single translucent recommendation stage and a quiet sidebar; ordinary song lists stay open. The stage has 40–54px desktop internal spacing and 24px phone spacing, matching left alignment for the edition, title, action and first-song preview. Cover art has its own balanced column. Shorten the opening so the real recommendation list appears sooner. Cyan action buttons and cool neutral controls are shared across search, library, downloads, playlists and settings. Preserve existing immersive player modes and playback behavior.


QQ recommendations have two explicit selectors: 每日推荐 and 猜你喜欢. Daily remains its actual date-based list; personal radio uses its separate authenticated source, supports 换一批, and shares the existing local-first playback, likes and cloud-playlist actions. Retain the current batch during refresh and report failures inline rather than erasing playable songs. Show actual count and a clear 30-second refresh cooldown.

Playlist origins use a shared text badge with the complete platform name in the library shelf, playlist list and detail header; the phone selector includes the same name. Read the playlist's own source/provider or namespaced identity, never infer ownership from its songs. Explicit local playlists remain NAS 本地 even when they contain cloud tracks. Unknown sources are labelled honestly. Playlist kinds (likes, owned, collected) remain separate from platform identity.

The player exposes FPS, draw submission time, active effect and real audio envelopes as coarse DOM diagnostics without URLs or credentials. Measure drawing cost independently of browser frame throttling; do not claim foreground performance from background-tab measurements.

## Member management

Use simple divided member rows, clear names and permission labels. Admin is visibly marked as the default highest-privilege member. Creating members uses an inline form; resetting a password expands within the selected row. Profile opens from the sidebar identity, with own QQ/NetEase account rows, per-member QR status, clear disconnect and separate system management. Ordinary members cannot see global secrets or unavailable admin tools. Empty account and playlist states explain login without substituting another member's content.

## Audio motion recovery

The user reported no motion after the Aurora update. A running renderer and a live track are insufficient proof: require actual nonzero samples/frequency data. Rebind capture after source changes and resume. After persistent silence, attempt a fresh capture once, then a single isolated inaudible analysis element with the same authorized URL. The audible player remains independent. Display recovery/unavailable states honestly, never fake frequency movement. Retain stable cover/lyric layout, increase contour visibility and audio-driven Aurora movement so a valid signal is perceptible. Respect pause, hidden pages, static mode and reduced motion. Background frame throttling must not artificially slow elapsed shader time.

## Twelve listening ateliers and folded-N identity

The 2026-10-30 expansion adds a physical vinyl turntable with a real rotating label and tonearm, a blue/magenta perspective neon tunnel, seven dusk landscape ridges, twenty-four refractive petals, teal water caustics and a complete light paper/ink player. Each is an independent recipe in scene-ateliers.js and scene-recipes.js, driven by the same real audio sample and scene clock. Vinyl motion stops without live signal; ink includes dark transport, lyrics and source badges rather than merely a light background. Preserve the original six modes and stored IDs. The picker is four columns on desktop, three on phones and six on short landscape, with bounded scroll height.

Replace the previous slashes with the folded-N vector family. The Nook main mark is the blue/teal folded N; the music variant adds a record and groove outline. Use the same SVG in navigation, the player and the Nook music entry, plus correctly sized 192/512 PWA icons and a cache-versioned favicon. Masters and the size comparison live in docs/brand. This design intentionally supersedes the older inclined-stroke mark.
