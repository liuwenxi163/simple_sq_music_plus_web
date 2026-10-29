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

The user rejected the broad Canvas 2D waves and giant spectrum presentation. Keep a stable, large square cover and synchronized lyrics as the foreground. Use the pinned React Bits Aurora shaders with a native WebGL2 lifecycle, muted album-derived OKLCH colors and a dark lyric-side scrim. Actual RMS controls brightness, bass controls amplitude and clock advancement, high frequencies control glow. Never substitute an autoplaying timer for an unavailable or paused audio signal. A compact 24px real-frequency rail appears only in spectrum mode. No cover tilt, shaking or animated zoom. Preserve the quiet cream transport control, balanced album/lyric columns and a phone cover/lyrics switch. Stop on pause, hidden pages or reduced motion; cap rendering at 30 FPS and the Aurora canvas at 420,000 pixels. Analysis captures a copy of playback without rerouting audible audio. Unsupported WebGL or capture retains readable static artwork and music.

## Listening room refresh

Cover-led library opening, real account playlist shelves, album-cover playlist headers and quieter download preferences extend the immersive player into browsing. No fabricated recommendations. Show actual NAS-file playback versus platform streaming. The visual scene picker previews six distinct modes without crowding the transport on phones. NOOK Music shares the inclined-stroke family mark while retaining its own record outline.

## Nook atmosphere and spacing

The user rejected the brown-black / cream browse theme and the recommendation text touching the card edge. Match the live Nook reference: cool graphite, clear pale text, cyan actions, lavender and blue ambient depth. The scene is a personal listening room on a desktop or phone after work, with enough light and color to feel welcoming while covers stay readable. This explicit reference takes precedence over the earlier warm editorial direction.

React Bits Grainient supplies the shared background. The user rejected the previous ribbon silhouette and the nearly static movement; use a soft radial color field with clearly visible continuous flow, silk lighting and cursor twirls disabled. Advance shader time at 0.65 per second with flow 2 and scale 1.15 so movement is noticeable within a few seconds, keeping the cool palette and readable foreground. Pin the actual upstream source and license; retain the original field and composite shaders rather than labelling a lookalike as React Bits. A native WebGL renderer and Vue wrapper provide a 24 FPS drawing cap, at most 1.1 million drawing pixels on desktop / 480,000 on phones, reduced-motion still rendering, hidden-page suspension, pause behind the full player and a static fallback. The half-resolution field pass feeds the bounded main canvas. The background reads no account or audio data.

Use a single translucent recommendation stage and a quiet sidebar; ordinary song lists stay open. The stage has 40–54px desktop internal spacing and 24px phone spacing, matching left alignment for the edition, title, action and first-song preview. Cover art has its own balanced column. Shorten the opening so the real recommendation list appears sooner. Cyan action buttons and cool neutral controls are shared across search, library, downloads, playlists and settings. Preserve existing immersive player modes and playback behavior.


QQ recommendations have two explicit selectors: 每日推荐 and 猜你喜欢. Daily remains its actual date-based list; personal radio uses its separate authenticated source, supports 换一批, and shares the existing local-first playback, likes and cloud-playlist actions. Retain the current batch during refresh and report failures inline rather than erasing playable songs. Show actual count and a clear 30-second refresh cooldown.

Playlist origins use a shared text badge with the complete platform name in the library shelf, playlist list and detail header; the phone selector includes the same name. Read the playlist's own source/provider or namespaced identity, never infer ownership from its songs. Explicit local playlists remain NAS 本地 even when they contain cloud tracks. Unknown sources are labelled honestly. Playlist kinds (likes, owned, collected) remain separate from platform identity.

The listening scene targets up to 60 draws per second and starts with a 1.5-million-pixel canvas budget. Reduce the drawing buffer only when measured draw-call time exceeds 12 ms, never solely because browser-scheduled RAF is slow; occluded/background tabs must not cause needless quality loss. Diagnostics expose separate FPS, draw time and real audio-band envelopes without exposing media URLs or account data.

## Member management

Use simple divided member rows, clear names and permission labels. Admin is visibly marked as the default highest-privilege member. Creating members uses an inline form; resetting a password expands within the selected row. Profile opens from the sidebar identity, with own QQ/NetEase account rows, per-member QR status, clear disconnect and separate system management. Ordinary members cannot see global secrets or unavailable admin tools. Empty account and playlist states explain login without substituting another member's content.
