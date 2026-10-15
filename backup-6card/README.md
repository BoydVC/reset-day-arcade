# Reset-Day Arcade

Arcade-cabinet launcher for the six games shipped on reset day, Thu Oct 15, 2026: Escape Room, Mars Colony, Dungeon Night, Four-Game Jam, Train-a-Bot Arcade, Hornets Anthem.

It's one self-contained HTML file of about 1 MB. All six games are embedded as base64 and opened through blob-URL iframes, and the screenshot thumbnails are inlined as JPEGs. It makes no network requests. Click a card or press 1–6 to play. "Back to arcade" closes the game, and "Open in new tab" pops it out into its own tab.

- `build.py` reads the games from `../out-oct15/*.html` and the screenshots from each project, then writes `dist/` and `../out-oct15/reset-day-arcade.html`. Run `python3 build.py --linked` to link to the sibling HTMLs instead of embedding them.
- `./run.sh` builds the arcade and serves it at http://127.0.0.1:4358/.
- `node --experimental-websocket tests/verify.mjs` launches every card over both file:// and http and checks that it renders with no console errors.
