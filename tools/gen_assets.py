# -*- coding: utf-8 -*-
"""生成本地演示素材：专辑/歌单封面、歌手头像、轮播图、头像、试听音频。

输出目录：
  backend/src/main/resources/static/images/{album,singer,singer/cover,playlist,banner,avatar}
  backend/src/main/resources/static/audio/track-{1..8}.wav

说明：所有素材均为程序合成，不含任何第三方版权内容，仅供教学演示。
"""
from __future__ import annotations

import math
import os
import struct
import wave

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STATIC = os.path.join(ROOT, "backend", "src", "main", "resources", "static")
IMG = os.path.join(STATIC, "images")
AUDIO = os.path.join(STATIC, "audio")

FONT_BOLD = "C:/Windows/Fonts/msyhbd.ttc"
FONT_REG = "C:/Windows/Fonts/msyh.ttc"

PALETTE = [
    ("#FF6B6B", "#C20C0C"), ("#5B8CFF", "#1B2A6B"), ("#2ED3B7", "#0B4F4A"),
    ("#FFB84D", "#8A3B00"), ("#B57BFF", "#3B1A66"), ("#FF7AA2", "#7A1030"),
    ("#4AC1FF", "#0B3C5D"), ("#A0E85A", "#2A5C00"), ("#FFD166", "#7A4A00"),
    ("#8FA3BF", "#26313F"),
]


def font(size: int, bold: bool = True) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(FONT_BOLD if bold else FONT_REG, size)


def vertical_gradient(size: tuple[int, int], top: str, bottom: str) -> Image.Image:
    w, h = size
    top_rgb = tuple(int(top[i:i + 2], 16) for i in (1, 3, 5))
    bot_rgb = tuple(int(bottom[i:i + 2], 16) for i in (1, 3, 5))
    rows = []
    for y in range(h):
        t = y / max(h - 1, 1)
        rows.append(tuple(int(top_rgb[i] + (bot_rgb[i] - top_rgb[i]) * t) for i in range(3)))
    arr = np.array(rows, dtype=np.uint8).reshape(h, 1, 3).repeat(w, axis=1)
    return Image.fromarray(arr, "RGB").convert("RGBA")


def wrap_text(draw: ImageDraw.ImageDraw, text: str, fnt: ImageFont.FreeTypeFont, max_width: int) -> list[str]:
    lines, current = [], ""
    for ch in text:
        trial = current + ch
        if draw.textlength(trial, font=fnt) <= max_width:
            current = trial
        else:
            lines.append(current)
            current = ch
    if current:
        lines.append(current)
    return lines


def new_layer(size: tuple[int, int]) -> tuple[Image.Image, ImageDraw.ImageDraw]:
    """创建透明图层：PIL 的 ImageDraw 不会做 alpha 混合，半透明元素必须画在图层上再合成。"""
    layer = Image.new("RGBA", size, (0, 0, 0, 0))
    return layer, ImageDraw.Draw(layer, "RGBA")


def cover(path: str, size: int, c1: str, c2: str, title: str, subtitle: str = "", badge: str = "",
          with_text: bool = False) -> None:
    """生成带渐变与唱片纹路的方形封面（2 倍绘制后缩小，边缘更平滑）。

    默认不印文字：页面上封面旁已经显示了标题，小尺寸（40px 列表封面）下文字只会变成噪点。
    需要带标题的版本时传 with_text=True。
    """
    s = size * 2
    img = vertical_gradient((s, s), c1, c2)

    # 唱片圆盘（半透明，需在图层上绘制后合成）
    layer, draw = new_layer((s, s))
    cx, cy, r = s * 0.70, s * 0.30, s * 0.30
    for i in range(14, 0, -1):
        rr = r * i / 14
        draw.ellipse([cx - rr, cy - rr, cx + rr, cy + rr], outline=(255, 255, 255, 26), width=2)
    draw.ellipse([cx - r * 0.16, cy - r * 0.16, cx + r * 0.16, cy + r * 0.16], fill=(20, 20, 20, 120))
    draw.ellipse([cx - r * 0.05, cy - r * 0.05, cx + r * 0.05, cy + r * 0.05], fill=(255, 255, 255, 90))
    img = Image.alpha_composite(img, layer)

    if not with_text:
        img.convert("RGB").resize((size, size), Image.LANCZOS).save(path, quality=92)
        return

    # 底部暗角，保证文字可读
    shade = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shade)
    for i in range(s // 2):
        alpha = int(150 * (i / (s // 2)) ** 1.6)
        sd.rectangle([0, s // 2 + i, s, s // 2 + i + 1], fill=(0, 0, 0, alpha))
    img = Image.alpha_composite(img, shade)
    draw = ImageDraw.Draw(img, "RGBA")

    if badge:
        bf = font(s // 32)
        bw = draw.textlength(badge, font=bf) + s * 0.07
        layer, ld = new_layer((s, s))
        ld.rounded_rectangle([s * 0.07, s * 0.07, s * 0.07 + bw, s * 0.07 + s * 0.062],
                             radius=s * 0.031, fill=(0, 0, 0, 85))
        ld.text((s * 0.07 + s * 0.035, s * 0.075), badge, font=bf, fill=(255, 255, 255, 235))
        img = Image.alpha_composite(img, layer)
        draw = ImageDraw.Draw(img, "RGBA")

    tf = font(int(s * 0.085))
    lines = wrap_text(draw, title, tf, int(s * 0.86))[:2]
    y = s * 0.74
    for line in lines:
        draw.text((s * 0.07, y), line, font=tf, fill=(255, 255, 255, 245))
        y += s * 0.10

    if subtitle:
        sf = font(int(s * 0.036), bold=False)
        draw.text((s * 0.07, s * 0.925), subtitle, font=sf, fill=(255, 255, 255, 175))

    img = img.convert("RGB").resize((size, size), Image.LANCZOS)
    img.save(path, quality=92)


def banner(path: str, c1: str, c2: str, title: str, subtitle: str, badge: str) -> None:
    w, h = 2400, 800
    img = vertical_gradient((w, h), c1, c2)

    # 装饰音波与光晕（半透明图层）
    layer, ld = new_layer((w, h))
    for i in range(46):
        x = w * 0.60 + i * 14
        amp = (math.sin(i * 0.55) * 0.5 + 0.5) * h * 0.30 + 12
        ld.rounded_rectangle([x, h / 2 - amp, x + 7, h / 2 + amp], radius=4, fill=(255, 255, 255, 42))
    ld.ellipse([w * 0.72, -h * 0.35, w * 0.72 + h, h * 0.65], fill=(255, 255, 255, 26))
    img = Image.alpha_composite(img, layer)
    draw = ImageDraw.Draw(img, "RGBA")

    bf = font(40)
    bw = draw.textlength(badge, font=bf) + 56
    layer, ld = new_layer((w, h))
    ld.rounded_rectangle([90, 96, 90 + bw, 160], radius=32, fill=(0, 0, 0, 75))
    ld.text((118, 108), badge, font=bf, fill=(255, 255, 255, 240))
    img = Image.alpha_composite(img, layer)
    draw = ImageDraw.Draw(img, "RGBA")

    tf = font(104)
    draw.text((88, 250), title, font=tf, fill=(255, 255, 255, 250))
    sf = font(44, bold=False)
    draw.text((92, 400), subtitle, font=sf, fill=(255, 255, 255, 205))
    draw.text((92, h - 150), "云音乐 · 发现好音乐", font=font(36, bold=False), fill=(255, 255, 255, 180))

    img.convert("RGB").resize((1200, 400), Image.LANCZOS).save(path, quality=92)


def avatar(path: str, c1: str, c2: str, text: str) -> None:
    s = 600
    img = vertical_gradient((s, s), c1, c2)
    layer, ld = new_layer((s, s))
    ld.ellipse([-s * 0.2, s * 0.45, s * 0.55, s * 1.2], fill=(255, 255, 255, 30))
    img = Image.alpha_composite(img, layer)
    draw = ImageDraw.Draw(img, "RGBA")
    fnt = font(int(s * 0.42))
    tw = draw.textlength(text, font=fnt)
    draw.text(((s - tw) / 2, s * 0.24), text, font=fnt, fill=(255, 255, 255, 240))
    img.convert("RGB").resize((300, 300), Image.LANCZOS).save(path, quality=92)


# ---------------------------------------------------------------------------
# 音频合成
# ---------------------------------------------------------------------------
SR = 16000
CHORDS = {
    "Am": [57, 60, 64], "F": [53, 57, 60], "C": [48, 52, 55], "G": [55, 59, 62],
    "Fmaj7": [53, 57, 60, 64], "Em7": [52, 55, 59, 62], "Dm7": [50, 53, 57, 60],
    "G7": [55, 59, 62, 65], "Cmaj7": [48, 52, 55, 59], "Am7": [57, 60, 64, 67],
}
PROGRESSIONS = [
    ["Am", "F", "C", "G"], ["Fmaj7", "Em7", "Dm7", "G7"], ["Cmaj7", "Am7", "F", "G"],
    ["Am", "G", "F", "C"], ["C", "G", "Am", "F"], ["Dm7", "G7", "Cmaj7", "Am7"],
]

TRACKS = [
    (48, 92, 0, "city"), (42, 84, 1, "dream"), (56, 76, 2, "warm"), (38, 108, 3, "rock"),
    (60, 88, 4, "pop"), (44, 72, 5, "lofi"), (52, 96, 0, "rock"), (46, 80, 1, "warm"),
]


def midi_freq(m: int) -> float:
    return 440.0 * (2 ** ((m - 69) / 12))


def synth_track(seconds: int, bpm: int, prog_idx: int, style: str) -> np.ndarray:
    rng = np.random.default_rng(seed=bpm * 7 + prog_idx)
    beat = 60.0 / bpm
    bar = beat * 4
    total = int(seconds * SR)
    audio = np.zeros(total + SR * 2, dtype=np.float64)
    progression = PROGRESSIONS[prog_idx % len(PROGRESSIONS)]

    # 铺底和弦 + 低音
    bar_count = int(math.ceil(len(audio) / SR / bar)) + 1
    for b in range(bar_count):
        chord = CHORDS[progression[b % len(progression)]]
        start = int(b * bar * SR)
        length = int(bar * SR)
        if start >= len(audio):
            break
        seg = min(length, len(audio) - start)
        t = np.arange(seg) / SR
        env = np.minimum(t / 0.9, 1.0) * np.exp(-t / (bar * 1.6))
        pad = np.zeros(seg)
        for note in chord:
            for detune in (-0.0015, 0.0015):
                f = midi_freq(note) * (1 + detune)
                pad += np.sin(2 * np.pi * f * t) * 0.5
                pad += np.sin(2 * np.pi * f * 2 * t) * 0.12
        pad /= max(len(chord), 1) * 2
        audio[start:start + seg] += pad * env * 0.30

        # 低音：每拍一个根音
        root = chord[0] - 12
        for k in range(4):
            s2 = start + int(k * beat * SR)
            if s2 >= len(audio):
                break
            ln = min(int(beat * 0.9 * SR), len(audio) - s2)
            tt = np.arange(ln) / SR
            bass = np.sin(2 * np.pi * midi_freq(root) * tt) * np.exp(-tt / (beat * 0.5))
            audio[s2:s2 + ln] += bass * 0.34

    # 琶音 / 旋律
    step = beat / 2
    pattern = [0, 1, 2, 3, 2, 1, 2, 0] if style in ("city", "dream") else [0, 2, 1, 3, 2, 1, 3, 2]
    arp_count = int(len(audio) / SR / step) + 1
    for i in range(arp_count):
        s2 = int(i * step * SR)
        if s2 >= len(audio):
            break
        chord = CHORDS[progression[(i // 8) % len(progression)]]
        note = chord[pattern[i % len(pattern)] % len(chord)] + 12
        ln = min(int(step * 2.6 * SR), len(audio) - s2)
        tt = np.arange(ln) / SR
        f = midi_freq(note)
        wave_data = (np.sin(2 * np.pi * f * tt) * 0.7 + np.sin(2 * np.pi * f * 3 * tt) * 0.18)
        env = np.exp(-tt / (step * 0.7)) * np.minimum(tt / 0.006, 1.0)
        audio[s2:s2 + ln] += wave_data * env * (0.11 if style != "rock" else 0.16)

    # 鼓点（低频 kick）
    for k in range(int(len(audio) / SR / beat)):
        s2 = int(k * beat * SR)
        if s2 >= len(audio):
            break
        ln = min(int(0.18 * SR), len(audio) - s2)
        tt = np.arange(ln) / SR
        f = 110 * np.exp(-tt * 22) + 45
        audio[s2:s2 + ln] += np.sin(2 * np.pi * f * tt) * np.exp(-tt * 16) * 0.30

    # 轻微底噪 + 淡入淡出
    audio += rng.normal(0, 0.0025, len(audio))
    audio = audio[:total]
    fade = int(1.6 * SR)
    audio[: int(0.05 * SR)] *= np.linspace(0, 1, int(0.05 * SR))
    if len(audio) > fade:
        audio[-fade:] *= np.linspace(1, 0, fade) ** 1.4
    peak = np.max(np.abs(audio)) or 1.0
    return (audio / peak * 0.86 * 32767).astype(np.int16)


def write_wav(path: str, data: np.ndarray) -> None:
    with wave.open(path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data.tobytes())


ALBUMS = [
    (1, "夏日回声", 0), (2, "城市夜行", 1), (3, "Neon Dreams", 2), (4, "长安月", 3),
    (5, "逆风", 4), (6, "Moonlight", 5), (7, "街角故事", 6), (8, "白鹿", 7),
    (9, "山谷来信", 8), (10, "回声之外", 9),
]
SINGERS = [
    (1, "林夏"), (2, "陈默"), (3, "Midnight"), (4, "苏晚晴"),
    (5, "周野"), (6, "Luna"), (7, "老K"), (8, "白鹿"),
]
PLAYLISTS = [
    (1, "夏日限定", "晚风与汽水"), (2, "深夜电台", "City Pop"), (3, "山谷来信", "华语民谣"),
    (4, "摇滚现场", "把音量开大"), (5, "长安月下", "古风"), (6, "说唱街区", "街角故事"),
]
BANNERS = [
    ("夏日限定 · 晚风与汽水", "冰镇汽水、单车和晚风，把整个夏天装进耳机", "编辑推荐", 0),
    ("深夜 City Pop 电台", "霓虹灯下的合成器，陪你穿过零点的城市", "深夜陪伴", 2),
    ("燃！摇滚现场", "把音量开到最大，让心跳和鼓点同频", "现场精选", 4),
]


def main() -> None:
    for sub in ("album", "singer", "singer/cover", "playlist", "banner", "avatar"):
        os.makedirs(os.path.join(IMG, sub), exist_ok=True)
    os.makedirs(AUDIO, exist_ok=True)

    for idx, name, color_idx in ALBUMS:
        c1, c2 = PALETTE[color_idx % len(PALETTE)]
        cover(os.path.join(IMG, "album", f"a{idx}.png"), 500, c1, c2, name, "专辑 · CloudMusic", "ALBUM")

    for idx, name in SINGERS:
        c1, c2 = PALETTE[(idx * 3) % len(PALETTE)]
        avatar(os.path.join(IMG, "singer", f"s{idx}.png"), c1, c2, name[:2])
        cover(os.path.join(IMG, "singer", "cover", f"s{idx}.png"), 800, c1, c2, name, "歌手 · CloudMusic", "ARTIST")

    for idx, name, sub in PLAYLISTS:
        c1, c2 = PALETTE[(idx * 4 + 2) % len(PALETTE)]
        cover(os.path.join(IMG, "playlist", f"p{idx}.png"), 500, c1, c2, name, sub, "歌单")

    for idx, (title, sub, badge, color_idx) in enumerate(BANNERS, start=1):
        c1, c2 = PALETTE[color_idx % len(PALETTE)]
        banner(os.path.join(IMG, "banner", f"b{idx}.png"), c1, c2, title, sub, badge)

    for idx, text in enumerate(("云", "鱼", "南"), start=1):
        c1, c2 = PALETTE[(idx * 5) % len(PALETTE)]
        avatar(os.path.join(IMG, "avatar", f"u{idx}.png"), c1, c2, text)

    for i, (duration, bpm, prog, style) in enumerate(TRACKS, start=1):
        path = os.path.join(AUDIO, f"track-{i}.wav")
        if os.path.exists(path):
            continue
        write_wav(path, synth_track(duration, bpm, prog, style))

    print("assets generated under", STATIC)


if __name__ == "__main__":
    main()
