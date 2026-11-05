package com.zcy.music.mapper;

import com.zcy.music.vo.SingerVO;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * 用户关注的歌手表数据访问。
 */
@Mapper
public interface UserSingerMapper {

    @Select("SELECT COUNT(*) FROM user_singer WHERE user_id = #{userId} AND singer_id = #{singerId}")
    int exists(@Param("userId") Long userId, @Param("singerId") Long singerId);

    @Insert("INSERT IGNORE INTO user_singer(user_id, singer_id) VALUES(#{userId}, #{singerId})")
    int insert(@Param("userId") Long userId, @Param("singerId") Long singerId);

    @Delete("DELETE FROM user_singer WHERE user_id = #{userId} AND singer_id = #{singerId}")
    int delete(@Param("userId") Long userId, @Param("singerId") Long singerId);

    @Select("SELECT " + SingerMapper.VO_COLUMNS + "FROM singer s "
            + "INNER JOIN user_singer us ON us.singer_id = s.id "
            + "WHERE us.user_id = #{userId} ORDER BY us.create_time DESC")
    List<SingerVO> selectByUser(@Param("userId") Long userId);

    @Select("SELECT COUNT(*) FROM user_singer WHERE user_id = #{userId}")
    long countByUser(Long userId);
}
