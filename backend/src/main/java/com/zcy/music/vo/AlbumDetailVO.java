package com.zcy.music.vo;

import java.util.List;

/**
 * 专辑详情：专辑信息与歌曲列表。
 */
public record AlbumDetailVO(AlbumVO album, List<SongVO> songs) {
}
