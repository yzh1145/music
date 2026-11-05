package com.zcy.music.mapper;

import com.zcy.music.vo.SongVO;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * 用户喜欢的歌曲表数据访问。
 */
@Mapper
public interface UserSongMapper {

    @Select("SELECT COUNT(*) FROM user_song WHERE user_id = #{userId} AND song_id = #{songId}")
    int exists(@Param("userId") Long userId, @Param("songId") Long songId);

    @Insert("INSERT IGNORE INTO user_song(user_id, song_id) VALUES(#{userId}, #{songId})")
    int insert(@Param("userId") Long userId, @Param("songId") Long songId);

    @Delete("DELETE FROM user_song WHERE user_id = #{userId} AND song_id = #{songId}")
    int delete(@Param("userId") Long userId, @Param("songId") Long songId);

    @Delete("DELETE FROM user_song WHERE song_id = #{songId}")
    int deleteBySong(Long songId);

    /** 我喜欢的音乐：联表返回歌曲信息 */
    @Select("SELECT " + SongMapper.VO_COLUMNS + SongMapper.JOINS
            + "INNER JOIN user_song us ON us.song_id = s.id "
            + "WHERE us.user_id = #{userId} AND s.status = 1 ORDER BY us.create_time DESC")
    List<SongVO> selectByUser(@Param("userId") Long userId);

    @Select("SELECT COUNT(*) FROM user_song WHERE user_id = #{userId}")
    long countByUser(Long userId);
}
