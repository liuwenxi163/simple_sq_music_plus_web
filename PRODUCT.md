# Product

## Register

product

## Users

NAS owners who collect music from their existing streaming accounts. Their latest requirement is playback first, on both desktop and phone, with downloads and playlist sync supporting the listening experience. This project is maintained as a fork for that workflow. The user corrected the earlier management-first direction: the primary experience must be beautiful, immersive playback, drawing on Spotify and their NOOK application.

## Product Purpose

One place to find music, synchronize playlists, manage reliable NAS downloads, fill missing lyrics and artwork through LyricFlow, and listen to the resulting music library. Download, enrichment and playback use the same music directory and account context; job status must reflect real backend state.

## Brand Personality

Focused, musical, organized. Spotify is the category reference for cover-led browsing and an always-available player. A listening-first homepage leads into the music library and player. Downloads, synchronization and metadata remain accessible supporting workflows.

## Anti-references

The upstream frontend was explicitly rejected as unattractive. Avoid its scattered floating controls, excessive glass decoration, debug output, duplicated mobile/desktop flows, bulky settings surfaces and unrelated panels competing for attention. Do not fabricate album recommendations or progress to make an empty library look populated.

## Design Principles

- Music, covers and playback lead the default experience; management stays within easy reach.
- Show the actual status, progress and next available action.
- Keep listening available while navigating and managing music.
- Treat cover art and synchronized lyrics as music content, not decoration.
- Preserve existing accounts, music and useful upstream capabilities.

## Accessibility & Inclusion

Support both touch and keyboard, clear readable text, visible focus, labeled icon controls and reduced motion. Avoid using color alone for download states. Build responsive layouts with the same behavior on desktop and phone.

## Family listening

The default admin is the highest-privilege member. Each family member signs in separately, binds their own platform accounts and owns recommendations, favorites, playlists and history. The NAS music files remain shared. Account management stays in More and the profile entry; no invented family members, open registration or credential borrowing.
