# Design

## Scene and theme

A NAS owner settles in at their desk or with a phone in the evening, choosing a record and watching the lyrics follow the music. Use an ink-dark music surface that lets covers and listening controls remain prominent without making management text hard to read. Dark is an explicit Spotify reference from the user, not a generic dashboard default.

## Color strategy

Restrained: warm charcoal surfaces with a cool cyan accent reserved for primary actions, playback, active navigation and progress. Use OKLCH tokens. Neutral chroma stays subtle and no surface uses pure black or white. Semantic success, warning and error states also use text and icons.

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
