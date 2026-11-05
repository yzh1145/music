package com.zcy.music.mapper;

import com.zcy.music.entity.Song;
import com.zcy.music.vo.SongVO;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.util.List;

/**
 * 歌曲表数据访问：列表查询统一联表返回 SongVO。
 */
@Mapper
public interface SongMapper {

    /** 列表字段（不含歌词，避免传输大文本） */
    String VO_COLUMNS = "s.id, s.name, s.singer_id, g.name AS singer_name, s.album_id, al.name AS album_name, "
            + "s.cover, s.audio_url, s.duration, s.category_id, c.name AS category_name, "
            + "s.play_count, s.like_count, s.comment_count, s.is_recommend, s.status, s.create_time, "
            + "EXISTS(SELECT 1 FROM user_song us WHERE us.song_id = s.id AND us.user_id = #{userId}) AS liked ";

    String JOINS = "FROM song s "
            + "LEFT JOIN singer g ON g.id = s.singer_id "
            + "LEFT JOIN album al ON al.id = s.album_id "
            + "LEFT JOIN category c ON c.id = s.category_id ";

    @Select("<script>"
            + "SELECT " + VO_COLUMNS + JOINS
            + "<where>"
            + "<if test='status == null'>AND s.status = 1</if>"
            + "<if test='status != null and status != -1'>AND s.status = #{status}</if>"
            + "<if test='keyword != null and keyword != \"\"'>"
            + "AND (s.name LIKE CONCAT('%', #{keyword}, '%') OR g.name LIKE CONCAT('%', #{keyword}, '%'))"
            + "</if>"
            + "<if test='singerId != null'>AND s.singer_id = #{singerId}</if>"
            + "<if test='albumId != null'>AND s.album_id = #{albumId}</if>"
            + "<if test='categoryId != null'>AND s.category_id = #{categoryId}</if>"
            + "<if test='recommend != null and recommend == 1'>AND s.is_recommend = 1</if>"
            + "</where>"
            + "<choose>"
            + "<when test='sort == \"hot\"'>ORDER BY s.play_count DESC, s.id DESC</when>"
            + "<when test='sort == \"like\"'>ORDER BY s.like_count DESC, s.id DESC</when>"
            + "<otherwise>ORDER BY s.create_time DESC, s.id DESC</otherwise>"
            + "</choose>"
            + " LIMIT #{offset}, #{size}"
            + "</script>")
    List<SongVO> selectPage(@Param("keyword") String keyword,
                            @Param("singerId") Long singerId,
                            @Param("albumId") Long albumId,
                            @Param("categoryId") Integer categoryId,
                            @Param("recommend") Integer recommend,
                            @Param("status") Integer status,
                            @Param("sort") String sort,
                            @Param("userId") Long userId,
                            @Param("offset") long offset,
                            @Param("size") int size);

    @Select("<script>"
            + "SELECT COUNT(*) " + JOINS
            + "<where>"
            + "<if test='status == null'>AND s.status = 1</if>"
            + "<if test='status != null and status != -1'>AND s.status = #{status}</if>"
            + "<if test='keyword != null and keyword != \"\"'>"
            + "AND (s.name LIKE CONCAT('%', #{keyword}, '%') OR g.name LIKE CONCAT('%', #{keyword}, '%'))"
            + "</if>"
            + "<if test='singerId != null'>AND s.singer_id = #{singerId}</if>"
            + "<if test='albumId != null'>AND s.album_id = #{albumId}</if>"
            + "<if test='categoryId != null'>AND s.category_id = #{categoryId}</if>"
            + "<if test='recommend != null and recommend == 1'>AND s.is_recommend = 1</if>"
            + "</where>"
            + "</script>")
    long countPage(@Param("keyword") String keyword,
                   @Param("singerId") Long singerId,
                   @Param("albumId") Long albumId,
                   @Param("categoryId") Integer categoryId,
                   @Param("recommend") Integer recommend,
                   @Param("status") Integer status);

    /** 歌曲详情：带歌词 */
    @Select("SELECT " + VO_COLUMNS + ", s.lyric " + JOINS + "WHERE s.id = #{id}")
    SongVO findVOById(@Param("id") Long id, @Param("userId") Long userId);

    @Select("SELECT * FROM song WHERE id = #{id}")
    Song findById(Long id);

    @Select("SELECT * FROM song WHERE id = #{id} FOR UPDATE")
    Song findByIdForUpdate(Long id);

    @Select("SELECT " + VO_COLUMNS + ", ps.sort " + JOINS
            + "INNER JOIN playlist_song ps ON ps.song_id = s.id "
            + "WHERE ps.playlist_id = #{playlistId} AND s.status = 1 ORDER BY ps.sort ASC, ps.id ASC")
    List<SongVO> selectByPlaylist(@Param("playlistId") Long playlistId, @Param("userId") Long userId);

    @Select("SELECT " + VO_COLUMNS + JOINS
            + "WHERE s.singer_id = #{singerId} AND s.status = 1 "
            + "ORDER BY s.play_count DESC, s.id ASC LIMIT #{limit}")
    List<SongVO> selectBySinger(@Param("singerId") Long singerId,
                                @Param("userId") Long userId,
                                @Param("limit") int limit);

    @Select("SELECT " + VO_COLUMNS + JOINS
            + "WHERE s.album_id = #{albumId} AND s.status = 1 ORDER BY s.id ASC")
    List<SongVO> selectByAlbum(@Param("albumId") Long albumId, @Param("userId") Long userId);

    /** 新歌榜 */
    @Select("SELECT " + VO_COLUMNS + JOINS
            + "WHERE s.status = 1 ORDER BY s.create_time DESC, s.id DESC LIMIT #{limit}")
    List<SongVO> selectNew(@Param("limit") int limit, @Param("userId") Long userId);

    /** 推荐单曲 */
    @Select("SELECT " + VO_COLUMNS + JOINS
            + "WHERE s.status = 1 AND s.is_recommend = 1 ORDER BY s.play_count DESC LIMIT #{limit}")
    List<SongVO> selectRecommend(@Param("limit") int limit, @Param("userId") Long userId);

    @Select("SELECT " + VO_COLUMNS + JOINS
            + "WHERE s.status = 1 AND (s.name LIKE CONCAT('%', #{keyword}, '%') "
            + "OR g.name LIKE CONCAT('%', #{keyword}, '%')) "
            + "ORDER BY s.play_count DESC LIMIT #{limit}")
    List<SongVO> search(@Param("keyword") String keyword,
                        @Param("userId") Long userId,
                        @Param("limit") int limit);

    @Select("SELECT COUNT(*) FROM song s LEFT JOIN singer g ON g.id = s.singer_id "
            + "WHERE s.status = 1 AND (s.name LIKE CONCAT('%', #{keyword}, '%') "
            + "OR g.name LIKE CONCAT('%', #{keyword}, '%'))")
    long countSearch(@Param("keyword") String keyword);

    @Insert("INSERT INTO song(name, singer_id, album_id, cover, audio_url, lyric, duration, category_id, "
            + "is_recommend, status) VALUES(#{name}, #{singerId}, #{albumId}, #{cover}, #{audioUrl}, #{lyric}, "
            + "#{duration}, #{categoryId}, #{isRecommend}, #{status})")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(Song song);

    @Update("UPDATE song SET name = #{name}, singer_id = #{singerId}, album_id = #{albumId}, cover = #{cover}, "
            + "audio_url = #{audioUrl}, lyric = #{lyric}, duration = #{duration}, category_id = #{categoryId}, "
            + "is_recommend = #{isRecommend}, status = #{status}, update_time = NOW() WHERE id = #{id}")
    int update(Song song);

    @Delete("DELETE FROM song WHERE id = #{id}")
    int delete(Long id);

    @Update("UPDATE song SET play_count = play_count + 1 WHERE id = #{id}")
    int incrementPlayCount(Long id);

    @Update("UPDATE song SET like_count = GREATEST(like_count + #{delta}, 0) WHERE id = #{id}")
    int updateLikeCount(@Param("id") Long id, @Param("delta") int delta);

    @Update("UPDATE song SET comment_count = GREATEST(comment_count + #{delta}, 0) WHERE id = #{id}")
    int updateCommentCount(@Param("id") Long id, @Param("delta") int delta);

    @Select("SELECT COUNT(*) FROM song WHERE singer_id = #{singerId}")
    long countBySinger(Long singerId);

    @Select("SELECT COUNT(*) FROM song WHERE album_id = #{albumId}")
    long countByAlbum(Long albumId);

    @Select("SELECT COUNT(*) FROM song")
    long countAll();

    @Select("SELECT COALESCE(SUM(play_count), 0) FROM song")
    long sumPlayCount();
}
