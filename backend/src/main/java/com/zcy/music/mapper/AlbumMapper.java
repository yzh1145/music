package com.zcy.music.mapper;

import com.zcy.music.entity.Album;
import com.zcy.music.vo.AlbumVO;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.util.List;

/**
 * 专辑表数据访问。
 */
@Mapper
public interface AlbumMapper {

    String VO_COLUMNS = "a.id, a.name, a.singer_id, g.name AS singer_name, a.cover, a.publish_date, "
            + "a.company, a.intro, (SELECT COUNT(*) FROM song x WHERE x.album_id = a.id AND x.status = 1) AS song_count ";

    @Select("SELECT " + VO_COLUMNS + " FROM album a LEFT JOIN singer g ON g.id = a.singer_id WHERE a.id = #{id}")
    AlbumVO findVOById(Long id);

    @Select("SELECT * FROM album WHERE id = #{id}")
    Album findById(Long id);

    @Select("SELECT " + VO_COLUMNS + " FROM album a LEFT JOIN singer g ON g.id = a.singer_id "
            + "WHERE a.singer_id = #{singerId} ORDER BY a.publish_date DESC")
    List<AlbumVO> selectBySinger(Long singerId);

    @Select("<script>"
            + "SELECT " + VO_COLUMNS + " FROM album a LEFT JOIN singer g ON g.id = a.singer_id"
            + "<where>"
            + "<if test='keyword != null and keyword != \"\"'>AND a.name LIKE CONCAT('%', #{keyword}, '%')</if>"
            + "<if test='singerId != null'>AND a.singer_id = #{singerId}</if>"
            + "</where>"
            + " ORDER BY a.publish_date DESC, a.id DESC LIMIT #{offset}, #{size}"
            + "</script>")
    List<AlbumVO> selectPage(@Param("keyword") String keyword,
                             @Param("singerId") Long singerId,
                             @Param("offset") long offset,
                             @Param("size") int size);

    @Select("<script>"
            + "SELECT COUNT(*) FROM album a"
            + "<where>"
            + "<if test='keyword != null and keyword != \"\"'>AND a.name LIKE CONCAT('%', #{keyword}, '%')</if>"
            + "<if test='singerId != null'>AND a.singer_id = #{singerId}</if>"
            + "</where>"
            + "</script>")
    long countPage(@Param("keyword") String keyword, @Param("singerId") Long singerId);

    @Select("SELECT " + VO_COLUMNS + " FROM album a LEFT JOIN singer g ON g.id = a.singer_id "
            + "WHERE a.name LIKE CONCAT('%', #{keyword}, '%') ORDER BY a.publish_date DESC LIMIT #{limit}")
    List<AlbumVO> search(@Param("keyword") String keyword, @Param("limit") int limit);

    @Select("SELECT COUNT(*) FROM album WHERE name LIKE CONCAT('%', #{keyword}, '%')")
    long countSearch(@Param("keyword") String keyword);

    @Insert("INSERT INTO album(name, singer_id, cover, publish_date, company, intro) "
            + "VALUES(#{name}, #{singerId}, #{cover}, #{publishDate}, #{company}, #{intro})")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(Album album);

    @Update("UPDATE album SET name = #{name}, singer_id = #{singerId}, cover = #{cover}, "
            + "publish_date = #{publishDate}, company = #{company}, intro = #{intro} WHERE id = #{id}")
    int update(Album album);

    @Delete("DELETE FROM album WHERE id = #{id}")
    int delete(Long id);

    @Select("SELECT COUNT(*) FROM album")
    long countAll();
}
