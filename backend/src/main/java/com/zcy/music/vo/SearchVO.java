package com.zcy.music.vo;

import java.util.List;

/**
 * 搜索聚合结果：歌曲、歌单、歌手、专辑四类。
 */
public record SearchVO(
        List<SongVO> songs,
        List<PlaylistVO> playlists,
        List<SingerVO> singers,
        List<AlbumVO> albums,
        long songTotal,
        long playlistTotal,
        long singerTotal,
        long albumTotal) {
}
