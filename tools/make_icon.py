"""Erzeugt assets/icon.png (512 px), assets/icon.ico und assets/tray/
(Symbole für den Infobereich und die Windows-Taskleiste, mit Zähler 1-9 und 9+).

Aufruf: python3 tools/make_icon.py  (braucht Pillow und die Schrift DejaVu Sans)
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

S = 1024  # Zeichengröße, wird danach herunterskaliert
OUT = Path(__file__).resolve().parent.parent / "assets"
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
TRAY_SIZES = [(16, 16), (20, 20), (24, 24), (32, 32), (48, 48), (64, 64)]


def gradient(size, top, bottom):
    img = Image.new("RGBA", (size, size))
    d = ImageDraw.Draw(img)
    for y in range(size):
        t = y / (size - 1)
        c = tuple(round(top[i] + (bottom[i] - top[i]) * t) for i in range(3)) + (255,)
        d.line([(0, y), (size, y)], fill=c)
    return img


def bubble(d, box, tail, fill):
    x0, y0, x1, y1 = box
    d.rounded_rectangle(box, radius=(y1 - y0) // 2.6, fill=fill)
    d.polygon(tail, fill=fill)


def draw():
    bg = gradient(S, (79, 70, 229), (124, 58, 237))  # Indigo -> Violett
    mask = Image.new("L", (S, S), 0)
    ImageDraw.Draw(mask).rounded_rectangle((32, 32, S - 32, S - 32), radius=220, fill=255)
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    img.paste(bg, (0, 0), mask)

    d = ImageDraw.Draw(img)
    # hintere Sprechblase (hellblau, rechts oben)
    bubble(d, (400, 210, 840, 520), [(720, 500), (800, 610), (640, 515)], (196, 210, 255, 255))
    # vordere Sprechblase (weiß, links unten)
    bubble(d, (180, 380, 690, 740), [(270, 720), (220, 840), (380, 735)], (255, 255, 255, 255))
    # drei Punkte in der vorderen Blase
    for cx in (325, 435, 545):
        d.ellipse((cx - 38, 522, cx + 38, 598), fill=(99, 64, 233, 255))
    return img


def badge(text, diameter):
    """Roter Kreis mit weißer Zahl, Größe in Zeichen-Pixeln."""
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    # Weißer Rand, damit sich der Kreis auch vom Indigo-Symbol abhebt
    border = diameter // 16
    x0 = S - diameter
    d.ellipse((x0, x0, S - 1, S - 1), fill=(255, 255, 255, 255))
    d.ellipse((x0 + border, x0 + border, S - 1 - border, S - 1 - border), fill=(220, 38, 38, 255))
    font = ImageFont.truetype(FONT, round(diameter * (0.74 if len(text) == 1 else 0.56)))
    d.text((x0 + diameter / 2, x0 + diameter / 2), text, font=font, fill=(255, 255, 255, 255), anchor="mm")
    return img


def tray_states():
    """(Dateiname-Zusatz, Text) für jeden Zähler-Stand."""
    return [(str(n), str(n)) for n in range(1, 10)] + [("9plus", "9+")]


def main():
    OUT.mkdir(exist_ok=True)
    big = draw()
    big.resize((512, 512), Image.LANCZOS).save(OUT / "icon.png")
    big.resize((256, 256), Image.LANCZOS).save(
        OUT / "icon.ico", sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
    )

    tray = OUT / "tray"
    tray.mkdir(exist_ok=True)

    def save(img, name, sizes):
        # PNG für Linux, ICO für Windows (dort je Größe scharf statt skaliert)
        img.resize((64, 64), Image.LANCZOS).save(tray / f"{name}.png")
        img.resize((256, 256), Image.LANCZOS).save(tray / f"{name}.ico", sizes=sizes)

    save(big, "tray", TRAY_SIZES)
    for suffix, text in tray_states():
        # Infobereich: Symbol mit Zähler; der Kreis ist groß, damit die Zahl
        # auch bei 16 Pixeln lesbar bleibt
        state = big.copy()
        state.alpha_composite(badge(text, round(S * 0.72)))
        save(state, f"tray-{suffix}", TRAY_SIZES)
        # Windows-Taskleiste: nur der Kreis, wird über das Programmsymbol gelegt
        save(badge(text, S), f"badge-{suffix}", [(16, 16), (20, 20), (24, 24), (32, 32)])
    print("Symbole geschrieben nach", OUT)


if __name__ == "__main__":
    main()
