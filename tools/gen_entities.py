# -*- coding: utf-8 -*-
"""根据数据库表结构生成实体类（POJO + getter/setter）。

项目未引入 Lombok（离线仓库缺少依赖），因此用脚本统一生成实体代码，
字段顺序、注释与 sql/music.sql 中的表结构保持一致。
"""
from pathlib import Path

BASE = Path(__file__).resolve().parent.parent / "backend" / "src" / "main" / "java" / "com" / "zcy" / "music" / "entity"

# (字段类型, 字段名, 注释)
SCHEMA = {
    "User": ("用户实体", [
        ("Long", "id", "主键"),
        ("String", "username", "登录账号"),
        ("String", "password", "密码（PBKDF2：迭代次数$盐$哈希）"),
        ("String", "nickname", "昵称"),
        ("String", "avatar", "头像地址"),
        ("Integer", "gender", "性别：0未知 1男 2女"),
        ("LocalDate", "birthday", "生日"),
        ("String", "signature", "个性签名"),
        ("String", "phone", "手机号"),
        ("String", "email", "邮箱"),
        ("Integer", "role", "角色：0普通用户 1管理员"),
        ("Integer", "status", "状态：1正常 0禁用"),
        ("LocalDateTime", "createTime", "注册时间"),
        ("LocalDateTime", "updateTime", "更新时间"),
    ]),
    "Singer": ("歌手实体", [
        ("Long", "id", "主键"),
        ("String", "name", "歌手名"),
        ("String", "avatar", "头像"),
        ("String", "cover", "歌手页大图"),
        ("Integer", "gender", "0组合 1男 2女"),
        ("String", "region", "地区"),
        ("LocalDate", "birthday", "出生日期"),
        ("String", "intro", "歌手简介"),
        ("Integer", "followCount", "关注数"),
        ("LocalDateTime", "createTime", "创建时间"),
    ]),
    "Album": ("专辑实体", [
        ("Long", "id", "主键"),
        ("String", "name", "专辑名"),
        ("Long", "singerId", "歌手ID"),
        ("String", "cover", "封面"),
        ("LocalDate", "publishDate", "发行日期"),
        ("String", "company", "唱片公司"),
        ("String", "intro", "专辑简介"),
        ("LocalDateTime", "createTime", "创建时间"),
    ]),
    "Category": ("歌曲分类实体", [
        ("Integer", "id", "主键"),
        ("String", "name", "分类名"),
        ("Integer", "sort", "排序"),
    ]),
    "Song": ("歌曲实体", [
        ("Long", "id", "主键"),
        ("String", "name", "歌曲名"),
        ("Long", "singerId", "歌手ID"),
        ("Long", "albumId", "专辑ID"),
        ("String", "cover", "封面"),
        ("String", "audioUrl", "音频地址"),
        ("String", "lyric", "LRC 歌词"),
        ("Integer", "duration", "时长（秒）"),
        ("Integer", "categoryId", "分类ID"),
        ("Integer", "playCount", "播放量"),
        ("Integer", "likeCount", "喜欢数"),
        ("Integer", "commentCount", "评论数"),
        ("Integer", "isRecommend", "1推荐 0普通"),
        ("Integer", "status", "1上架 0下架"),
        ("LocalDateTime", "createTime", "发布时间"),
        ("LocalDateTime", "updateTime", "更新时间"),
    ]),
    "Playlist": ("歌单实体", [
        ("Long", "id", "主键"),
        ("String", "name", "歌单名"),
        ("String", "cover", "封面"),
        ("String", "intro", "简介"),
        ("Long", "userId", "创建者ID"),
        ("String", "category", "分类标签"),
        ("Integer", "playCount", "播放量"),
        ("Integer", "collectCount", "收藏量"),
        ("Integer", "isRecommend", "1首页推荐"),
        ("Integer", "status", "1正常 0删除"),
        ("LocalDateTime", "createTime", "创建时间"),
        ("LocalDateTime", "updateTime", "更新时间"),
    ]),
    "PlaylistSong": ("歌单歌曲关联实体", [
        ("Long", "id", "主键"),
        ("Long", "playlistId", "歌单ID"),
        ("Long", "songId", "歌曲ID"),
        ("Integer", "sort", "歌单内排序"),
        ("LocalDateTime", "createTime", "加入时间"),
    ]),
    "Comment": ("评论实体", [
        ("Long", "id", "主键"),
        ("Long", "songId", "歌曲ID"),
        ("Long", "userId", "评论人ID"),
        ("String", "content", "评论内容"),
        ("Long", "parentId", "父评论ID，0为一级评论"),
        ("Integer", "likeCount", "点赞数"),
        ("Integer", "status", "1正常 0删除"),
        ("LocalDateTime", "createTime", "评论时间"),
    ]),
    "CommentLike": ("评论点赞实体", [
        ("Long", "id", "主键"),
        ("Long", "commentId", "评论ID"),
        ("Long", "userId", "点赞人ID"),
        ("LocalDateTime", "createTime", "点赞时间"),
    ]),
    "UserSong": ("用户喜欢的歌曲实体", [
        ("Long", "id", "主键"),
        ("Long", "userId", "用户ID"),
        ("Long", "songId", "歌曲ID"),
        ("LocalDateTime", "createTime", "收藏时间"),
    ]),
    "UserPlaylist": ("用户收藏的歌单实体", [
        ("Long", "id", "主键"),
        ("Long", "userId", "用户ID"),
        ("Long", "playlistId", "歌单ID"),
        ("LocalDateTime", "createTime", "收藏时间"),
    ]),
    "UserSinger": ("用户关注的歌手实体", [
        ("Long", "id", "主键"),
        ("Long", "userId", "用户ID"),
        ("Long", "singerId", "歌手ID"),
        ("LocalDateTime", "createTime", "关注时间"),
    ]),
    "PlayHistory": ("播放历史实体", [
        ("Long", "id", "主键"),
        ("Long", "userId", "用户ID"),
        ("Long", "songId", "歌曲ID"),
        ("LocalDateTime", "playTime", "最近播放时间"),
    ]),
    "Banner": ("轮播图实体", [
        ("Long", "id", "主键"),
        ("String", "title", "标题"),
        ("String", "imageUrl", "图片地址"),
        ("Integer", "linkType", "1歌单 2歌曲 3歌手 4外链"),
        ("Long", "linkId", "跳转目标ID"),
        ("Integer", "sort", "排序"),
        ("Integer", "status", "1启用 0禁用"),
        ("LocalDateTime", "createTime", "创建时间"),
    ]),
}

TEMPLATE = """package com.zcy.music.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.io.Serializable;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * {comment}，对应数据库表 {table}。
 */
public class {name} implements Serializable {{

{fields}
{accessors}}}
"""

FIELD_TMPL = """    /** {comment} */
{annotation}    private {type} {field};
"""


def annotation_for(type_name: str, field: str) -> str:
    # 密码不参与 JSON 序列化；时间统一为 yyyy-MM-dd HH:mm:ss / yyyy-MM-dd
    if field == "password":
        return "    @JsonIgnore\n"
    if type_name == "LocalDateTime":
        return '    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss")\n'
    if type_name == "LocalDate":
        return '    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")\n'
    return ""


def cap(s: str) -> str:
    return s[0].upper() + s[1:]


def main() -> None:
    BASE.mkdir(parents=True, exist_ok=True)
    for name, (comment, fields) in SCHEMA.items():
        table = "".join(("_" + c.lower()) if c.isupper() else c for c in name).lstrip("_")
        body = "".join(FIELD_TMPL.format(
            comment=c, type=t, field=f, annotation=annotation_for(t, f)) for t, f, c in fields)
        accessors = []
        for t, f, c in fields:
            accessors.append(f"""
    public {t} get{cap(f)}() {{
        return {f};
    }}

    public void set{cap(f)}({t} {f}) {{
        this.{f} = {f};
    }}
""")
        content = TEMPLATE.format(comment=comment, table=table, name=name,
                                  fields=body, accessors="".join(accessors))
        (BASE / f"{name}.java").write_text(content, encoding="utf-8")
    print(f"generated {len(SCHEMA)} entities -> {BASE}")


if __name__ == "__main__":
    main()
