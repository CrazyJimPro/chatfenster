"""Erzeugt assets/icon.png (512 px), assets/icon.ico und assets/tray.png.

Aufruf: python3 tools/make_icon.py  (braucht Pillow)
"""
from pathlib import Path
from PIL import Image, ImageDraw

S = 1024  # Zeichengröße, wird danach herunterskaliert
OUT = Path(__file__).resolve().parent.parent / "assets"


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


def main():
    OUT.mkdir(exist_ok=True)
    big = draw()
    big.resize((512, 512), Image.LANCZOS).save(OUT / "icon.png")
    big.resize((256, 256), Image.LANCZOS).save(
        OUT / "icon.ico", sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
    )
    big.resize((64, 64), Image.LANCZOS).save(OUT / "tray.png")
    print("Symbole geschrieben nach", OUT)


if __name__ == "__main__":
    main()
