package com.zcy.music.service;

import com.zcy.music.common.PageResult;
import com.zcy.music.entity.Album;
import com.zcy.music.entity.Banner;
import com.zcy.music.entity.Playlist;
import com.zcy.music.entity.Singer;
import com.zcy.music.entity.Song;
import com.zcy.music.vo.AdminStatsVO;
import com.zcy.music.vo.PlaylistVO;
import com.zcy.music.vo.SongVO;
import com.zcy.music.vo.UserVO;

import java.util.List;

/**
 * 后台管理服务：数据看板与各类资源维护。
 */
public interface AdminService {

    AdminStatsVO stats();

    PageResult<SongVO> songs(String keyword, Integer status, int page, int size);

    void saveSong(Song song);

    void deleteSong(Long id);

    void saveSinger(Singer singer);

    void deleteSinger(Long id);

    void saveAlbum(Album album);

    void deleteAlbum(Long id);

    PageResult<PlaylistVO> playlists(String keyword, int page, int size);

    void savePlaylist(Playlist playlist);

    void deletePlaylist(Long id);

    List<Banner> banners();

    void saveBanner(Banner banner);

    void deleteBanner(Long id);

    PageResult<UserVO> users(String keyword, int page, int size);

    void updateUser(Long id, Integer role, Integer status);
}
