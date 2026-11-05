package com.zcy.music.mapper;

import com.zcy.music.entity.Comment;
import com.zcy.music.vo.CommentVO;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.util.List;

/**
 * 评论表数据访问。
 */
@Mapper
public interface CommentMapper {

    String VO_COLUMNS = "c.id, c.song_id, c.user_id, u.nickname, u.avatar, c.content, c.parent_id, "
            + "c.like_count, c.create_time, "
            + "EXISTS(SELECT 1 FROM comment_like cl WHERE cl.comment_id = c.id AND cl.user_id = #{userId}) AS liked ";

    @Select("SELECT " + VO_COLUMNS + "FROM comment c LEFT JOIN `user` u ON u.id = c.user_id "
            + "WHERE c.song_id = #{songId} AND c.parent_id = 0 AND c.status = 1 "
            + "ORDER BY c.like_count DESC, c.id DESC LIMIT #{offset}, #{size}")
    List<CommentVO> selectRoot(@Param("songId") Long songId,
                               @Param("userId") Long userId,
                               @Param("offset") long offset,
                               @Param("size") int size);

    @Select("SELECT COUNT(*) FROM comment WHERE song_id = #{songId} AND parent_id = 0 AND status = 1")
    long countRoot(@Param("songId") Long songId);

    /** 批量取一级评论下的二级回复 */
    @Select("<script>"
            + "SELECT " + VO_COLUMNS + "FROM comment c LEFT JOIN `user` u ON u.id = c.user_id "
            + "WHERE c.status = 1 AND c.parent_id IN "
            + "<foreach collection='parentIds' item='pid' open='(' separator=',' close=')'>#{pid}</foreach>"
            + " ORDER BY c.id ASC"
            + "</script>")
    List<CommentVO> selectReplies(@Param("parentIds") List<Long> parentIds, @Param("userId") Long userId);

    @Select("SELECT * FROM comment WHERE id = #{id}")
    Comment findById(Long id);

    @Select("SELECT * FROM comment WHERE id = #{id} FOR UPDATE")
    Comment findByIdForUpdate(Long id);

    @Insert("INSERT INTO comment(song_id, user_id, content, parent_id) "
            + "VALUES(#{songId}, #{userId}, #{content}, #{parentId})")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(Comment comment);

    @Update("UPDATE comment SET like_count = GREATEST(like_count + #{delta}, 0) WHERE id = #{id}")
    int updateLikeCount(@Param("id") Long id, @Param("delta") int delta);

    /** 逻辑删除 */
    @Update("UPDATE comment SET status = 0 WHERE id = #{id}")
    int softDelete(Long id);

    @Select("SELECT COUNT(*) FROM comment WHERE status = 1")
    long countAll();

    @Select("SELECT COUNT(*) FROM comment WHERE song_id = #{songId} AND status = 1")
    long countBySong(Long songId);
}
