package com.zcy.music.mapper;

import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

/**
 * 评论点赞表数据访问。
 */
@Mapper
public interface CommentLikeMapper {

    @Select("SELECT COUNT(*) FROM comment_like WHERE comment_id = #{commentId} AND user_id = #{userId}")
    int exists(@Param("commentId") Long commentId, @Param("userId") Long userId);

    @Insert("INSERT IGNORE INTO comment_like(comment_id, user_id) VALUES(#{commentId}, #{userId})")
    int insert(@Param("commentId") Long commentId, @Param("userId") Long userId);

    @Delete("DELETE FROM comment_like WHERE comment_id = #{commentId} AND user_id = #{userId}")
    int delete(@Param("commentId") Long commentId, @Param("userId") Long userId);
}
