package com.zcy.music.mapper;

import com.zcy.music.entity.Banner;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.util.List;

/**
 * 轮播图数据访问。
 */
@Mapper
public interface BannerMapper {

    @Select("SELECT * FROM banner WHERE status = 1 ORDER BY sort ASC, id ASC")
    List<Banner> selectEnabled();

    @Select("SELECT * FROM banner ORDER BY sort ASC, id ASC")
    List<Banner> selectAll();

    @Select("SELECT * FROM banner WHERE id = #{id}")
    Banner findById(Long id);

    @Insert("INSERT INTO banner(title, image_url, link_type, link_id, sort, status) "
            + "VALUES(#{title}, #{imageUrl}, #{linkType}, #{linkId}, #{sort}, #{status})")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(Banner banner);

    @Update("UPDATE banner SET title = #{title}, image_url = #{imageUrl}, link_type = #{linkType}, "
            + "link_id = #{linkId}, sort = #{sort}, status = #{status} WHERE id = #{id}")
    int update(Banner banner);

    @Delete("DELETE FROM banner WHERE id = #{id}")
    int delete(Long id);
}
