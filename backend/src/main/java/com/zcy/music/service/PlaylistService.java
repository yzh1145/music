package com.zcy.music.service;

import com.zcy.music.common.PageResult;
import com.zcy.music.entity.Playlist;
import com.zcy.music.vo.PlaylistDetailVO;
import com.zcy.music.vo.PlaylistVO;

import java.util.List;

/**
 * 歌单服务。
 */
public interface PlaylistService {

    PageResult<PlaylistVO> page(String keyword, String category, Integer recommend, int page, int size);

    PlaylistDetailVO detail(Long id);

    List<PlaylistVO> created();

    List<PlaylistVO> collected();

    PlaylistVO create(Playlist playlist);

    void update(Playlist playlist);

    void delete(Long id);

    void addSong(Long playlistId, Long songId);

    void removeSong(Long playlistId, Long songId);

    /** 播放歌单：播放量 +1 */
    void addPlayCount(Long id);

    boolean toggleCollect(Long id);
}
