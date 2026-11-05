package com.zcy.music.vo;

import java.util.List;

/**
 * 歌单详情：歌单信息与歌曲列表。
 */
public record PlaylistDetailVO(PlaylistVO playlist, List<SongVO> songs) {
}
