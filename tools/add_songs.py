# -*- coding: utf-8 -*-
"""向演示库追加一批华语流行歌曲数据，并生成对应的专辑封面 / 歌手头像。

运行：python tools/add_songs.py
产物：
  sql/music_extra.sql                                   —— 可重复执行的追加脚本
  backend/src/main/resources/static/images/album/a11..a18.png
  backend/src/main/resources/static/images/singer/s9..s16.png
  backend/src/main/resources/static/images/singer/cover/s9..s16.png

说明：歌曲、专辑、歌手信息为教学演示整理，音频仍复用已合成的 8 段示例音频，
     歌词为脚本生成的占位文案，不对应任何真实作品版权内容。
"""
from __future__ import annotations

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from gen_assets import IMG, PALETTE, avatar, cover  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SQL_PATH = os.path.join(ROOT, "sql", "music_extra.sql")

# 8 段示例音频的时长（秒），新歌按顺序复用，保证「时长 = 实际音频长度」
TRACK_SECONDS = [48, 42, 56, 38, 60, 44, 52, 46]

# (id, 姓名, 性别 0组合/1男/2女, 地区, 生日, 简介)
SINGERS = [
    (9, "周杰伦", 1, "华语", "1979-01-18", "华语流行天王，把中国风、说唱与钢琴旋律写进大众记忆。"),
    (10, "林俊杰", 1, "新加坡", "1981-03-27", "新加坡创作型歌手，以细腻转音与钢琴情歌著称。"),
    (11, "邓紫棋", 2, "中国香港", "1991-08-16", "90 后唱作人，高音扎实，流行与电子元素融合。"),
    (12, "陈奕迅", 1, "中国香港", "1974-07-27", "香港乐坛常青树，用叙事感极强的嗓音唱都市心事。"),
    (13, "毛不易", 1, "中国内地", "1994-10-11", "民谣唱作人，词句平实，写尽普通人的日常。"),
    (14, "薛之谦", 1, "中国内地", "1983-07-17", "华语流行男歌手，擅长副歌极具记忆点的情歌。"),
    (15, "告五人", 0, "中国台湾", "2017-01-01", "双主唱独立乐团，旋律明亮，编曲带着公路感。"),
    (16, "张韶涵", 2, "中国台湾", "1982-01-19", "华语流行女歌手，声音清亮，代表作传唱度极高。"),
]

# (id, 专辑名, 歌手 id, 封面文件, 发行日期, 唱片公司, 简介)
ALBUMS = [
    (11, "叶惠美", 9, "a11.png", "2003-07-31", "杰威尔音乐", "周杰伦的第四张录音室专辑，中国风与校园叙事的代表作。"),
    (12, "第二天堂", 10, "a12.png", "2004-06-04", "海蝶音乐", "林俊杰早期代表作专辑，钢琴与转音的结合。"),
    (13, "Xposed", 11, "a13.png", "2012-08-01", "蜂鸟音乐", "邓紫棋的转型专辑，唱腔与编曲都更具张力。"),
    (14, "认了吧", 12, "a14.png", "2007-04-24", "环球唱片", "陈奕迅国语专辑，城市情歌的叙事范本。"),
    (15, "平凡的一天", 13, "a15.png", "2018-05-31", "哇唧唧哇", "毛不易首张个人专辑，写给普通人的日常。"),
    (16, "绅士", 14, "a16.png", "2015-06-08", "海蝶音乐", "薛之谦的流行情歌专辑，副歌记忆点极强。"),
    (17, "运气来得若有似无", 15, "a17.png", "2021-09-03", "相信音乐", "告五人专辑，旋律明亮，带着公路与海风的味道。"),
    (18, "潘朵拉", 16, "a18.png", "2006-01-06", "福茂唱片", "张韶涵的代表专辑，清亮嗓音与励志旋律。"),
]

# (歌曲名, 歌手 id, 专辑 id, 分类 id, 是否推荐, 播放量)
SONGS = [
    ("晴天", 9, 11, 1, 1, 1286000),
    ("东风破", 9, 11, 1, 0, 964000),
    ("你听得到", 9, 11, 1, 0, 521000),
    ("江南", 10, 12, 1, 1, 1132000),
    ("美人鱼", 10, 12, 1, 0, 638000),
    ("第二天堂", 10, 12, 1, 0, 412000),
    ("泡沫", 11, 13, 1, 1, 1458000),
    ("我的秘密", 11, 13, 1, 0, 733000),
    ("失真", 11, 13, 1, 0, 356000),
    ("淘汰", 12, 14, 1, 0, 887000),
    ("富士山下", 12, 14, 1, 0, 1024000),
    ("不如不见", 12, 14, 1, 0, 468000),
    ("消愁", 13, 15, 3, 1, 1219000),
    ("平凡的一天", 13, 15, 3, 0, 546000),
    ("借", 13, 15, 3, 0, 389000),
    ("演员", 14, 16, 1, 0, 1387000),
    ("绅士", 14, 16, 1, 0, 702000),
    ("下雨了", 14, 16, 1, 0, 445000),
    ("爱人错过", 15, 17, 2, 1, 1063000),
    ("唯一", 15, 17, 2, 0, 815000),
    ("在这座城市遗失了你", 15, 17, 2, 0, 502000),
    ("隐形的翅膀", 16, 18, 1, 0, 1172000),
    ("潘朵拉", 16, 18, 1, 0, 587000),
    ("口袋的天空", 16, 18, 1, 0, 341000),
]

# (歌单 id, 追加的歌曲名列表)
PLAYLIST_ADD = {
    1: ["晴天", "爱人错过"],
    2: ["泡沫", "唯一"],
    3: ["消愁", "借"],
    4: ["在这座城市遗失了你", "爱人错过"],
}

LYRIC_POOL = [
    "城市的灯 一盏盏亮起",
    "风把心事吹成了雨",
    "我们唱过的那个夏天",
    "还在耳机里轻轻回旋",
    "沿着旧街走到清晨",
    "把孤单交给晚风",
    "如果时间可以倒带",
    "我想再看一次海",
    "人海里 谁在轻声和",
    "把故事唱成副歌",
    "路灯下的影子很长",
    "我们都没有说再见",
    "月亮替我保守秘密",
    "在每一个失眠的夜里",
    "琴弦震动的那一秒",
    "整个世界都安静了",
]


def esc(value: str) -> str:
    """SQL 字符串转义。"""
    return value.replace("\\", "\\\\").replace("'", "''")


def build_lyric(name: str, singer: str, duration: int, seed: int) -> str:
    """生成占位 LRC 歌词：时间轴铺满整首歌，便于验证歌词滚动效果。"""
    lines = [f"[00:00.00]{name} - {singer}", "[00:02.00]作词：演示数据　作曲：演示数据"]
    count = 8
    span = max(duration - 6, count * 3)
    for i in range(count):
        text = LYRIC_POOL[(seed + i * 3) % len(LYRIC_POOL)]
        sec = 4 + round(span * i / count)
        lines.append(f"[00:{sec:02d}.00]{text}")
    return "\\n".join(lines)


def main() -> None:
    # 1. 生成新专辑封面与歌手图
    for album_id, _, _, file_name, _, _, _ in ALBUMS:
        c1, c2 = PALETTE[album_id % len(PALETTE)]
        cover(os.path.join(IMG, "album", file_name), 500, c1, c2, "")

    for singer_id, name, _, _, _, _ in SINGERS:
        c1, c2 = PALETTE[(singer_id * 3) % len(PALETTE)]
        avatar(os.path.join(IMG, "singer", f"s{singer_id}.png"), c1, c2, name[:2])
        cover(os.path.join(IMG, "singer", "cover", f"s{singer_id}.png"), 800, c1, c2, "", "")

    # 2. 组装 SQL
    sql: list[str] = [
        "-- 追加演示歌曲：华语流行歌单（可重复执行）",
        "-- 由 tools/add_songs.py 生成，音频复用已合成的 8 段示例音频。",
        "USE music_db;",
        "",
    ]

    sql.append("INSERT INTO singer (id, name, avatar, cover, gender, region, birthday, intro, follow_count) VALUES")
    rows = []
    for singer_id, name, gender, region, birthday, intro in SINGERS:
        rows.append(
            f"({singer_id}, '{esc(name)}', '/images/singer/s{singer_id}.png', "
            f"'/images/singer/cover/s{singer_id}.png', {gender}, '{esc(region)}', '{birthday}', "
            f"'{esc(intro)}', {1200 + singer_id * 137})"
        )
    sql.append(",\n".join(rows))
    sql.append("ON DUPLICATE KEY UPDATE name = VALUES(name), avatar = VALUES(avatar), cover = VALUES(cover),")
    sql.append("  gender = VALUES(gender), region = VALUES(region), birthday = VALUES(birthday), intro = VALUES(intro);")
    sql.append("")

    sql.append("INSERT INTO album (id, name, singer_id, cover, publish_date, company, intro) VALUES")
    rows = []
    for album_id, name, singer_id, file_name, publish_date, company, intro in ALBUMS:
        rows.append(
            f"({album_id}, '{esc(name)}', {singer_id}, '/images/album/{file_name}', '{publish_date}', "
            f"'{esc(company)}', '{esc(intro)}')"
        )
    sql.append(",\n".join(rows))
    sql.append("ON DUPLICATE KEY UPDATE name = VALUES(name), singer_id = VALUES(singer_id),")
    sql.append("  cover = VALUES(cover), publish_date = VALUES(publish_date), company = VALUES(company), intro = VALUES(intro);")
    sql.append("")

    song_ids: dict[str, int] = {}
    singer_names = {s[0]: s[1] for s in SINGERS}
    album_dates = {a[0]: a[4] for a in ALBUMS}

    sql.append(
        "INSERT INTO song (id, name, singer_id, album_id, cover, audio_url, lyric, duration, category_id,"
        " play_count, like_count, comment_count, is_recommend, status, create_time) VALUES"
    )
    rows = []
    for index, (name, singer_id, album_id, category_id, recommend, play_count) in enumerate(SONGS):
        song_id = 17 + index
        song_ids[name] = song_id
        track = index % len(TRACK_SECONDS) + 1
        duration = TRACK_SECONDS[track - 1]
        album_cover = f"/images/album/{[a[3] for a in ALBUMS if a[0] == album_id][0]}"
        lyric = build_lyric(name, singer_names[singer_id], duration, song_id)
        create_time = f"{album_dates[album_id]} 10:{(index * 7) % 60:02d}:00"
        like_count = play_count // 260
        rows.append(
            f"({song_id}, '{esc(name)}', {singer_id}, {album_id}, '{album_cover}', "
            f"'/audio/track-{track}.wav', '{lyric}', {duration}, {category_id}, "
            f"{play_count}, {like_count}, 0, {recommend}, 1, '{create_time}')"
        )
    sql.append(",\n".join(rows))
    sql.append("ON DUPLICATE KEY UPDATE name = VALUES(name), singer_id = VALUES(singer_id), album_id = VALUES(album_id),")
    sql.append("  cover = VALUES(cover), audio_url = VALUES(audio_url), lyric = VALUES(lyric),")
    sql.append("  duration = VALUES(duration), category_id = VALUES(category_id), play_count = VALUES(play_count),")
    sql.append("  like_count = VALUES(like_count), is_recommend = VALUES(is_recommend);")
    sql.append("")

    # 3. 把新歌挂到已有歌单末尾
    rows = []
    for playlist_id, names in PLAYLIST_ADD.items():
        for offset, name in enumerate(names, start=1):
            rows.append(f"({playlist_id}, {song_ids[name]}, 100 + {offset})")
    sql.append("INSERT IGNORE INTO playlist_song (playlist_id, song_id, sort) VALUES")
    sql.append(",\n".join(rows) + ";")
    sql.append("")

    sql.append(f"SELECT COUNT(*) AS song_total FROM song;")

    with open(SQL_PATH, "w", encoding="utf-8") as file:
        file.write("\n".join(sql))
    print("sql written to", SQL_PATH)


if __name__ == "__main__":
    main()
