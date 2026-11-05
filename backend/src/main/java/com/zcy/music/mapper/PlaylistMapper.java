package com.zcy.music.mapper;

import com.zcy.music.entity.Playlist;
import com.zcy.music.vo.PlaylistVO;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.util.List;

/**
 * 歌单表数据访问。
 */
@Mapper
public interface PlaylistMapper {

    String VO_COLUMNS = "p.id, p.name, p.cover, p.intro, p.user_id, u.nickname AS creator_name, "
            + "u.avatar AS creator_avatar, p.category, "
            + "p.play_count, p.collect_count, p.is_recommend, p.status, p.create_time, "
            + "(SELECT COUNT(*) FROM playlist_song ps WHERE ps.playlist_id = p.id) AS song_count, "
            + "EXISTS(SELECT 1 FROM user_playlist up WHERE up.playlist_id = p.id AND up.user_id = #{userId}) AS collected ";

    String JOINS = "FROM playlist p LEFT JOIN `user` u ON u.id = p.user_id ";

    @Select("<script>"
            + "SELECT " + VO_COLUMNS + JOINS
            + "<where>"
            + "p.status = 1"
            + "<if test='keyword != null and keyword != \"\"'>AND p.name LIKE CONCAT('%', #{keyword}, '%')</if>"
            + "<if test='category != null and category != \"\"'>AND p.category = #{category}</if>"
            + "<if test='recommend != null and recommend == 1'>AND p.is_recommend = 1</if>"
            + "<if test='ownerId != null'>AND p.user_id = #{ownerId}</if>"
            + "</where>"
            + " ORDER BY p.is_recommend DESC, p.collect_count DESC, p.id ASC LIMIT #{offset}, #{size}"
            + "</script>")
    List<PlaylistVO> selectPage(@Param("keyword") String keyword,
                                @Param("category") String category,
                                @Param("recommend") Integer recommend,
                                @Param("ownerId") Long ownerId,
                                @Param("userId") Long userId,
                                @Param("offset") long offset,
                                @Param("size") int size);

    @Select("<script>"
            + "SELECT COUNT(*) FROM playlist p"
            + "<where>"
            + "p.status = 1"
            + "<if test='keyword != null and keyword != \"\"'>AND p.name LIKE CONCAT('%', #{keyword}, '%')</if>"
            + "<if test='category != null and category != \"\"'>AND p.category = #{category}</if>"
            + "<if test='recommend != null and recommend == 1'>AND p.is_recommend = 1</if>"
            + "<if test='ownerId != null'>AND p.user_id = #{ownerId}</if>"
            + "</where>"
            + "</script>")
    long countPage(@Param("keyword") String keyword,
                   @Param("category") String category,
                   @Param("recommend") Integer recommend,
                   @Param("ownerId") Long ownerId);

    @Select("SELECT " + VO_COLUMNS + JOINS + "WHERE p.id = #{id}")
    PlaylistVO findVOById(@Param("id") Long id, @Param("userId") Long userId);

    @Select("SELECT * FROM playlist WHERE id = #{id}")
    Playlist findById(Long id);

    @Select("SELECT * FROM playlist WHERE id = #{id} FOR UPDATE")
    Playlist findByIdForUpdate(Long id);

    @Select("SELECT " + VO_COLUMNS + JOINS + "WHERE p.status = 1 ORDER BY p.collect_count DESC LIMIT #{limit}")
    List<PlaylistVO> selectRecommend(@Param("limit") int limit, @Param("userId") Long userId);

    @Select("SELECT " + VO_COLUMNS + JOINS + "WHERE p.user_id = #{ownerId} AND p.status = 1 "
            + "ORDER BY p.create_time DESC")
    List<PlaylistVO> selectCreated(@Param("ownerId") Long ownerId, @Param("userId") Long userId);

    @Select("SELECT " + VO_COLUMNS + "FROM playlist p "
            + "INNER JOIN user_playlist up ON up.playlist_id = p.id "
            + "LEFT JOIN `user` u ON u.id = p.user_id "
            + "WHERE up.user_id = #{userId} AND p.status = 1 ORDER BY up.create_time DESC")
    List<PlaylistVO> selectCollected(Long userId);

    @Select("SELECT " + VO_COLUMNS + JOINS
            + "WHERE p.status = 1 AND p.name LIKE CONCAT('%', #{keyword}, '%') "
            + "ORDER BY p.collect_count DESC LIMIT #{limit}")
    List<PlaylistVO> search(@Param("keyword") String keyword,
                            @Param("userId") Long userId,
                            @Param("limit") int limit);

    @Select("SELECT COUNT(*) FROM playlist WHERE status = 1 AND name LIKE CONCAT('%', #{keyword}, '%')")
    long countSearch(@Param("keyword") String keyword);

    @Insert("INSERT INTO playlist(name, cover, intro, user_id, category, is_recommend, status) "
            + "VALUES(#{name}, #{cover}, #{intro}, #{userId}, #{category}, #{isRecommend}, #{status})")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(Playlist playlist);

    @Update("UPDATE playlist SET name = #{name}, cover = #{cover}, intro = #{intro}, category = #{category}, "
            + "is_recommend = #{isRecommend}, update_time = NOW() WHERE id = #{id}")
    int update(Playlist playlist);

    @Delete("DELETE FROM playlist WHERE id = #{id}")
    int delete(Long id);

    @Update("UPDATE playlist SET play_count = play_count + 1 WHERE id = #{id}")
    int incrementPlayCount(Long id);

    @Update("UPDATE playlist SET collect_count = GREATEST(collect_count + #{delta}, 0) WHERE id = #{id}")
    int updateCollectCount(@Param("id") Long id, @Param("delta") int delta);

    @Select("SELECT COUNT(*) FROM playlist WHERE status = 1")
    long countAll();
}
