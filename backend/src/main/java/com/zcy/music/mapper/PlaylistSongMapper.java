package com.zcy.music.mapper;

import com.zcy.music.entity.PlaylistSong;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

/**
 * 歌单歌曲关联表数据访问。
 */
@Mapper
public interface PlaylistSongMapper {

    @Insert("INSERT IGNORE INTO playlist_song(playlist_id, song_id, sort) VALUES(#{playlistId}, #{songId}, #{sort})")
    int insert(PlaylistSong playlistSong);

    @Delete("DELETE FROM playlist_song WHERE playlist_id = #{playlistId} AND song_id = #{songId}")
    int delete(@Param("playlistId") Long playlistId, @Param("songId") Long songId);

    @Delete("DELETE FROM playlist_song WHERE playlist_id = #{playlistId}")
    int deleteByPlaylist(Long playlistId);

    @Delete("DELETE FROM playlist_song WHERE song_id = #{songId}")
    int deleteBySong(Long songId);

    @Select("SELECT COALESCE(MAX(sort), 0) FROM playlist_song WHERE playlist_id = #{playlistId}")
    int maxSort(Long playlistId);

    @Select("SELECT COUNT(*) FROM playlist_song WHERE playlist_id = #{playlistId}")
    int countByPlaylist(Long playlistId);
}
