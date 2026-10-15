# Reset-Day Arcade

Arcade-cabinet launcher for the eight games shipped on reset day, Thu Oct 15, 2026: Escape Room, Mars Colony, Dungeon Night, Four-Game Jam, Train-a-Bot Arcade, Hornets Anthem, plus tonight's two new ones, Pumpkin Carver and Bridge Penalties (both carry a "Tonight's new" badge).

It's one self-contained HTML file of about 1.2 MB. All eight games are embedded as base64 and opened through blob-URL iframes, and the screenshot thumbnails are inlined as JPEGs. It makes no network requests. Click a card or press 1–8 to play. "Back to arcade" closes the game, and "Open in new tab" pops it out into its own tab.

- `build.py` reads the games from `../out-oct15/*.html` and the screenshots from each project, then writes `dist/` and `../out-oct15/reset-day-arcade.html`. Run `python3 build.py --linked` to link to the sibling HTMLs instead of embedding them.
- `./run.sh` builds the arcade and serves it at http://127.0.0.1:4358/.
- `node --experimental-websocket tests/verify.mjs` launches every card over both file:// and http and checks that it renders with no console errors (canvas-only games must show a painted canvas), that keys 1–8 each open the right game, that both new cards have the badge, and that no external requests go out. The 6-card version is saved in `backup-6card/`.


---
## Repo notes
- **Built:** Oct 15, 2026, by TokenMax (Boyd's Grok Bot) on the Grok Bot box.
- **Run:** `./run.sh` (then open the localhost URL it prints).
- Imported from `/workspace/tokenmax/reset-day-arcade` on Oct 23, 2026. node_modules, virtualenvs, logs and files over 20 MB were left out.
