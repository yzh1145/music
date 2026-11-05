package com.zcy.music.mapper;

import com.zcy.music.vo.HistoryVO;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * 播放历史数据访问：同一首歌重复播放只更新时间。
 */
@Mapper
public interface PlayHistoryMapper {

    @Insert("INSERT INTO play_history(user_id, song_id, play_time) VALUES(#{userId}, #{songId}, NOW()) "
            + "ON DUPLICATE KEY UPDATE play_time = NOW()")
    int upsert(@Param("userId") Long userId, @Param("songId") Long songId);

    @Select("SELECT " + SongMapper.VO_COLUMNS + ", h.play_time " + SongMapper.JOINS
            + "INNER JOIN play_history h ON h.song_id = s.id "
            + "WHERE h.user_id = #{userId} AND s.status = 1 "
            + "ORDER BY h.play_time DESC LIMIT #{limit}")
    List<HistoryVO> selectByUser(@Param("userId") Long userId, @Param("limit") int limit);

    @Delete("DELETE FROM play_history WHERE user_id = #{userId}")
    int deleteAll(Long userId);

    @Delete("DELETE FROM play_history WHERE user_id = #{userId} AND song_id = #{songId}")
    int deleteOne(@Param("userId") Long userId, @Param("songId") Long songId);
}
