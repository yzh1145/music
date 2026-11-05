package com.zcy.music.mapper;

import com.zcy.music.entity.Singer;
import com.zcy.music.vo.SingerVO;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.util.List;

/**
 * 歌手表数据访问。
 */
@Mapper
public interface SingerMapper {

    String VO_COLUMNS = "s.id, s.name, s.avatar, s.cover, s.gender, s.region, s.birthday, s.intro, s.follow_count, "
            + "(SELECT COUNT(*) FROM song x WHERE x.singer_id = s.id AND x.status = 1) AS song_count, "
            + "(SELECT COUNT(*) FROM album a WHERE a.singer_id = s.id) AS album_count, "
            + "EXISTS(SELECT 1 FROM user_singer us WHERE us.singer_id = s.id AND us.user_id = #{userId}) AS followed ";

    @Select("<script>"
            + "SELECT " + VO_COLUMNS + " FROM singer s"
            + "<where>"
            + "<if test='region != null and region != \"\"'>AND s.region = #{region}</if>"
            + "<if test='keyword != null and keyword != \"\"'>AND s.name LIKE CONCAT('%', #{keyword}, '%')</if>"
            + "</where>"
            + " ORDER BY s.follow_count DESC, s.id ASC LIMIT #{offset}, #{size}"
            + "</script>")
    List<SingerVO> selectPage(@Param("keyword") String keyword,
                              @Param("region") String region,
                              @Param("userId") Long userId,
                              @Param("offset") long offset,
                              @Param("size") int size);

    @Select("<script>"
            + "SELECT COUNT(*) FROM singer s"
            + "<where>"
            + "<if test='region != null and region != \"\"'>AND s.region = #{region}</if>"
            + "<if test='keyword != null and keyword != \"\"'>AND s.name LIKE CONCAT('%', #{keyword}, '%')</if>"
            + "</where>"
            + "</script>")
    long countPage(@Param("keyword") String keyword, @Param("region") String region);

    @Select("SELECT " + VO_COLUMNS + " FROM singer s WHERE s.id = #{id}")
    SingerVO findVOById(@Param("id") Long id, @Param("userId") Long userId);

    @Select("SELECT * FROM singer WHERE id = #{id}")
    Singer findById(Long id);

    @Select("SELECT * FROM singer WHERE id = #{id} FOR UPDATE")
    Singer findByIdForUpdate(Long id);

    @Select("SELECT " + VO_COLUMNS + " FROM singer s ORDER BY s.follow_count DESC, s.id ASC LIMIT #{limit}")
    List<SingerVO> selectHot(@Param("limit") int limit, @Param("userId") Long userId);

    @Select("SELECT " + VO_COLUMNS + " FROM singer s WHERE s.name LIKE CONCAT('%', #{keyword}, '%') "
            + "ORDER BY s.follow_count DESC LIMIT #{limit}")
    List<SingerVO> search(@Param("keyword") String keyword, @Param("userId") Long userId, @Param("limit") int limit);

    @Select("SELECT COUNT(*) FROM singer WHERE name LIKE CONCAT('%', #{keyword}, '%')")
    long countSearch(@Param("keyword") String keyword);

    @Insert("INSERT INTO singer(name, avatar, cover, gender, region, birthday, intro, follow_count) "
            + "VALUES(#{name}, #{avatar}, #{cover}, #{gender}, #{region}, #{birthday}, #{intro}, #{followCount})")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(Singer singer);

    @Update("UPDATE singer SET name = #{name}, avatar = #{avatar}, cover = #{cover}, gender = #{gender}, "
            + "region = #{region}, birthday = #{birthday}, intro = #{intro} WHERE id = #{id}")
    int update(Singer singer);

    @Delete("DELETE FROM singer WHERE id = #{id}")
    int delete(Long id);

    @Update("UPDATE singer SET follow_count = GREATEST(follow_count + #{delta}, 0) WHERE id = #{id}")
    int updateFollowCount(@Param("id") Long id, @Param("delta") int delta);

    @Select("SELECT COUNT(*) FROM singer")
    long countAll();
}
