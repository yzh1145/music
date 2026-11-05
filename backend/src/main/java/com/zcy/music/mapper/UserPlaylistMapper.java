package com.zcy.music.mapper;

import com.zcy.music.vo.PlaylistVO;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * 用户收藏的歌单表数据访问。
 */
@Mapper
public interface UserPlaylistMapper {

    @Select("SELECT COUNT(*) FROM user_playlist WHERE user_id = #{userId} AND playlist_id = #{playlistId}")
    int exists(@Param("userId") Long userId, @Param("playlistId") Long playlistId);

    @Insert("INSERT IGNORE INTO user_playlist(user_id, playlist_id) VALUES(#{userId}, #{playlistId})")
    int insert(@Param("userId") Long userId, @Param("playlistId") Long playlistId);

    @Delete("DELETE FROM user_playlist WHERE user_id = #{userId} AND playlist_id = #{playlistId}")
    int delete(@Param("userId") Long userId, @Param("playlistId") Long playlistId);

    @Select("SELECT " + PlaylistMapper.VO_COLUMNS
            + "FROM playlist p INNER JOIN user_playlist up ON up.playlist_id = p.id "
            + "LEFT JOIN `user` u ON u.id = p.user_id "
            + "WHERE up.user_id = #{userId} AND p.status = 1 ORDER BY up.create_time DESC")
    List<PlaylistVO> selectByUser(@Param("userId") Long userId);

    @Select("SELECT COUNT(*) FROM user_playlist WHERE user_id = #{userId}")
    long countByUser(Long userId);
}
