#!/usr/bin/env python3
"""Build Reset-Day Arcade: one self-contained launcher HTML embedding the six Oct 15 games."""
import base64, io, json, os, sys
from PIL import Image

ROOT = os.path.dirname(os.path.abspath(__file__))
TM = os.path.dirname(ROOT)
OUT = os.path.join(TM, "out-oct15")
DIST = os.path.join(ROOT, "dist")
LINKED = "--linked" in sys.argv  # fallback: link sibling HTMLs instead of embedding

GAMES = [
    dict(id="escape-room", title="Boyd Family Escape Room", html="escape-room.html",
         shot="escape-room/screenshots/00-best-title.png", color="#ffcc33", tag="Co-op puzzles",
         desc="Offline co-op escape room: clear six themed rooms (crabs, rockets, sports, robots, word play, vault) to win the control-room keys back from the helper bots."),
    dict(id="mars-colony", title="Mars Colony Sim", html="mars-colony.html",
         shot="mars-colony/screenshots/00-best-starship-landing.png", color="#ff6a3d", tag="Base builder",
         desc="Run a tiny Mars base: keep six colonists breathing, fed and happy, ride out dust storms, and use Starship launch windows to grow the colony to 50 people."),
    dict(id="dungeon-night", title="Dungeon Master Night", html="dungeon-night.html",
         shot="dungeon-night/screenshots/00-best-title.png", color="#b06bff", tag="Family D&D",
         desc="A pre-written AI Dungeon Master leads Sir Bold, Willow and Pip through Emberdeep Keep with d20 rolls, turn-based combat, loot and a Shadow Drake boss."),
    dict(id="four-game-jam", title="Four-Game Jam", html="four-game-jam.html",
         shot="four-game-jam/screenshots/00-best-hub.png", color="#33e0ff", tag="4-in-1 cartridge",
         desc="One cartridge, four games: Castle Crunch tower defense, Robo Works factory, a real CHIP-8 arcade, and the Neon Blaster roguelike shooter."),
    dict(id="train-bot-arcade", title="Train-a-Bot Arcade", html="train-bot-arcade.html",
         shot="train-bot-arcade/screenshots/00-best-watch-bot-learn.png", color="#ff4fd8", tag="Watch the AI learn",
         desc="Steer a robot up a 5-lane neon road, then train a bot with real Q-learning, watch its score climb, and race it on the same seeded track."),
    dict(id="hornets-anthem", title="Hornets Anthem", html="hornets-anthem.html",
         shot="hornets-anthem/screenshots/00-best-release.png", color="#7dff4f", tag="Music release",
         desc="\u201cBuzz Like Thunder\u201d for the Green Hornets 12U: original lyrics, a WebAudio track, karaoke lyric video, lyric sheet and share card."),
]

def thumb(path):
    im = Image.open(path).convert("RGB")
    im.thumbnail((640, 400), Image.LANCZOS)
    buf = io.BytesIO(); im.save(buf, "JPEG", quality=78, optimize=True, progressive=True)
    return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()

cards = []
for g in GAMES:
    src = os.path.join(OUT, g["html"])
    data = open(src, "rb").read()
    c = {k: g[k] for k in ("id", "title", "desc", "color", "tag", "html")}
    c["thumb"] = thumb(os.path.join(TM, g["shot"]))
    c["kb"] = round(len(data) / 1024)
    if not LINKED:
        c["b64"] = base64.b64encode(data).decode()
    cards.append(c)

tpl = open(os.path.join(ROOT, "web", "launcher.html"), encoding="utf-8").read()
payload = json.dumps({"linked": LINKED, "games": cards}, ensure_ascii=True).replace("</", "<\\/")
html = tpl.replace("/*__ARCADE_DATA__*/null", payload)
os.makedirs(DIST, exist_ok=True)
for p in (os.path.join(DIST, "index.html"), os.path.join(DIST, "reset-day-arcade.html"),
          os.path.join(OUT, "reset-day-arcade.html")):
    open(p, "w", encoding="utf-8").write(html)
print(f"built {len(html)/1024/1024:.2f} MB  linked={LINKED}")
