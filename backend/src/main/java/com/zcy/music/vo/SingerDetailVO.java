package com.zcy.music.vo;

import java.util.List;

/**
 * 歌手详情：歌手信息、代表作（热门 10 首）与专辑列表。
 */
public record SingerDetailVO(SingerVO singer, List<SongVO> songs, List<AlbumVO> albums) {
}
