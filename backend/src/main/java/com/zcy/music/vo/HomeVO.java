package com.zcy.music.vo;

import com.zcy.music.entity.Banner;
import java.util.List;

/**
 * 首页聚合数据：轮播图、推荐歌单、新歌、热门歌手、推荐单曲。
 */
public record HomeVO(
        List<Banner> banners,
        List<PlaylistVO> recommendPlaylists,
        List<SongVO> newSongs,
        List<SingerVO> hotSingers,
        List<SongVO> recommendSongs) {
}
