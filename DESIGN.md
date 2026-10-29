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

The user requested a substantial visual redesign, large album art and audio visual effects, explicitly welcoming shader rendering. The full player now has one signature effect: an album-colored fluid light field rendered with a WebGL fragment shader, responding to captured playback energy. A dedicated spectrum mode reads actual FFT values; static mode remains beautiful without GPU support. Large clean cover art and balanced lyric typography lead the stage, with a quiet full-width transport beneath. Desktop shows cover and lyrics together; phone switches between cover and lyrics with fixed accessible playback controls. Respect reduced motion, stop rendering on pause or hidden tabs, bound drawing-buffer size, and keep audio output independent of the analysis graph.

## Listening room refresh

Cover-led library opening, real account playlist shelves, album-cover playlist headers and quieter download preferences extend the immersive player into browsing. No fabricated recommendations. Show actual NAS-file playback versus platform streaming. The visual scene picker previews six distinct modes without crowding the transport on phones. NOOK Music shares the inclined-stroke family mark while retaining its own record outline.

## Nook atmosphere and spacing

The user rejected the brown-black / cream browse theme and the recommendation text touching the card edge. Match the live Nook reference: cool graphite, clear pale text, cyan actions, lavender and blue ambient depth. The scene is a personal listening room on a desktop or phone after work, with enough light and color to feel welcoming while covers stay readable. This explicit reference takes precedence over the earlier warm editorial direction.

React Bits Color Bends supplies the shared background. Pin the actual upstream source and license; retain the original fragment shader rather than labelling a lookalike as React Bits. A native WebGL renderer and Vue wrapper provide a 24 FPS drawing cap, at most 1.1 million drawing pixels on desktop / 480,000 on phones, reduced-motion still rendering, hidden-page suspension, pause behind the full player and a static fallback. The background reads no account or audio data.

Use a single translucent recommendation stage and a quiet sidebar; ordinary song lists stay open. The stage has 40–54px desktop internal spacing and 24px phone spacing, matching left alignment for the edition, title, action and first-song preview. Cover art has its own balanced column. Shorten the opening so the real recommendation list appears sooner. Cyan action buttons and cool neutral controls are shared across search, library, downloads, playlists and settings. Preserve existing immersive player modes and playback behavior.
