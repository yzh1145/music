#!/usr/bin/env python3
"""生成微信小程序端所需的图标与占位图。

Web 端使用 Element Plus 图标与后端静态封面，小程序端无法复用，因此用脚本生成：

- miniprogram/assets/icons/tabbar-*.png    底部导航图标（普通 / 选中，81×81）
- miniprogram/assets/images/default-cover.png   封面兜底图（300×300）
- miniprogram/assets/images/default-avatar.png  头像兜底图（200×200）
- miniprogram/assets/images/default-banner.png  轮播兜底图（750×250）

用法：python tools/gen_mp_assets.py
脚本可重复执行，输出为透明 PNG（占位图不透明）。
"""

from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
MP = ROOT / "miniprogram"
ICON_DIR = MP / "assets" / "icons"
IMAGE_DIR = MP / "assets" / "images"

SCALE = 4  # 先按 4 倍绘制再缩小，得到平滑边缘
ICON_SIZE = 81
COLOR_NORMAL = (154, 154, 162, 255)
COLOR_ACTIVE = (236, 65, 65, 255)


def rounded_line(draw: ImageDraw.ImageDraw, points, width, fill):
    """带圆头的折线。"""
    draw.line(points, fill=fill, width=width, joint="curve")
    radius = width // 2
    for x, y in (points[0], points[-1]):
        draw.ellipse((x - radius, y - radius, x + radius, y + radius), fill=fill)


def make_canvas(size):
    canvas = Image.new("RGBA", (size * SCALE, size * SCALE), (0, 0, 0, 0))
    return canvas, ImageDraw.Draw(canvas)


def save_icon(canvas, name):
    icon = canvas.resize((ICON_SIZE, ICON_SIZE), Image.LANCZOS)
    icon.save(ICON_DIR / name, "PNG")


def icon_home(color):
    """音符：椭圆符头 + 符干 + 符尾。"""
    canvas, draw = make_canvas(ICON_SIZE)
    s = SCALE
    width = int(6.5 * s)
    # 符头
    draw.ellipse((18 * s, 50 * s, 42 * s, 66 * s), fill=color)
    # 符干
    rounded_line(draw, [(40 * s, 58 * s), (40 * s, 18 * s)], width, color)
    # 符尾
    rounded_line(
        draw,
        [(40 * s, 18 * s), (50 * s, 20 * s), (58 * s, 29 * s)],
        width,
        color,
    )
    return canvas


def icon_playlist(color):
    """歌单：圆角方框 + 三条列表线。"""
    canvas, draw = make_canvas(ICON_SIZE)
    s = SCALE
    width = int(5 * s)
    draw.rounded_rectangle(
        (14 * s, 14 * s, 67 * s, 67 * s),
        radius=12 * s,
        outline=color,
        width=width,
    )
    for y in (29, 41, 53):
        rounded_line(draw, [(25 * s, y * s), (56 * s, y * s)], width, color)
    return canvas


def icon_search(color):
    """搜索：放大镜。"""
    canvas, draw = make_canvas(ICON_SIZE)
    s = SCALE
    width = int(5.5 * s)
    draw.ellipse(
        (14 * s, 14 * s, 52 * s, 52 * s),
        outline=color,
        width=width,
    )
    rounded_line(draw, [(49 * s, 49 * s), (66 * s, 66 * s)], int(7 * s), color)
    return canvas


def icon_user(color):
    """我的：头像与肩部。"""
    canvas, draw = make_canvas(ICON_SIZE)
    s = SCALE
    draw.ellipse((27 * s, 12 * s, 54 * s, 39 * s), fill=color)
    draw.arc(
        (14 * s, 40 * s, 67 * s, 88 * s),
        start=180,
        end=360,
        fill=color,
        width=int(7 * s),
    )
    return canvas


def horizontal_gradient(size, left, right):
    image = Image.new("RGB", (size[0], 1))
    for x in range(size[0]):
        t = x / max(size[0] - 1, 1)
        image.putpixel(
            (x, 0),
            tuple(int(left[i] + (right[i] - left[i]) * t) for i in range(3)),
        )
    return image.resize(size, Image.BILINEAR)


def make_default_cover():
    size = 300
    bg = horizontal_gradient((size, size), (214, 38, 50), (92, 18, 58)).convert("RGBA")
    layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    # 唱片纹路
    for radius in range(40, 150, 18):
        draw.ellipse(
            (size / 2 - radius, size / 2 - radius, size / 2 + radius, size / 2 + radius),
            outline=(255, 255, 255, 28),
            width=2,
        )
    # 中心音符
    draw.ellipse((112, 168, 146, 192), fill=(255, 255, 255, 175))
    draw.rounded_rectangle((142, 92, 152, 184), radius=5, fill=(255, 255, 255, 175))
    draw.polygon(
        [(152, 92), (186, 100), (186, 118), (152, 110)],
        fill=(255, 255, 255, 175),
    )
    layer = layer.filter(ImageFilter.GaussianBlur(0.4))
    out = Image.alpha_composite(bg, layer)
    out.convert("RGB").save(IMAGE_DIR / "default-cover.png", "PNG")


def make_default_avatar():
    size = 200
    bg = horizontal_gradient((size, size), (120, 132, 152), (74, 82, 104)).convert("RGBA")
    layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    draw.ellipse((68, 34, 132, 98), fill=(255, 255, 255, 205))
    draw.arc((28, 92, 172, 208), start=180, end=360, fill=(255, 255, 255, 205), width=26)
    out = Image.alpha_composite(bg, layer)
    out.convert("RGB").save(IMAGE_DIR / "default-avatar.png", "PNG")


def make_default_banner():
    size = (750, 250)
    bg = horizontal_gradient(size, (196, 24, 36), (86, 16, 52)).convert("RGBA")
    layer = Image.new("RGBA", size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    for x in range(0, size[0] + 200, 120):
        draw.ellipse((x - 90, 130, x + 90, 310), fill=(255, 255, 255, 14))
    draw.ellipse((520, 40, 700, 220), outline=(255, 255, 255, 40), width=3)
    draw.ellipse((560, 80, 660, 180), outline=(255, 255, 255, 30), width=2)
    out = Image.alpha_composite(bg, layer)
    out.convert("RGB").save(IMAGE_DIR / "default-banner.png", "PNG")


def make_logo():
    size = 120
    bg = horizontal_gradient((size, size), (196, 24, 36), (120, 16, 48)).convert("RGBA")
    layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    draw.ellipse((42, 66, 60, 80), fill=(255, 255, 255, 240))
    draw.rounded_rectangle((56, 30, 61, 76), radius=2, fill=(255, 255, 255, 240))
    draw.polygon([(61, 30), (79, 35), (79, 44), (61, 39)], fill=(255, 255, 255, 240))
    out = Image.alpha_composite(bg, layer)
    out.convert("RGB").save(IMAGE_DIR / "logo.png", "PNG")


def main():
    ICON_DIR.mkdir(parents=True, exist_ok=True)
    IMAGE_DIR.mkdir(parents=True, exist_ok=True)

    icons = {
        "tabbar-home": icon_home,
        "tabbar-playlist": icon_playlist,
        "tabbar-search": icon_search,
        "tabbar-user": icon_user,
    }
    for name, painter in icons.items():
        canvas = painter(COLOR_NORMAL)
        save_icon(canvas, f"{name}.png")
        canvas = painter(COLOR_ACTIVE)
        save_icon(canvas, f"{name}-active.png")

    make_default_cover()
    make_default_avatar()
    make_default_banner()
    make_logo()

    generated = sorted(p.name for p in ICON_DIR.glob("*.png"))
    print("icons:", ", ".join(generated))
    print("images:", ", ".join(sorted(p.name for p in IMAGE_DIR.glob("*.png"))))


if __name__ == "__main__":
    main()
