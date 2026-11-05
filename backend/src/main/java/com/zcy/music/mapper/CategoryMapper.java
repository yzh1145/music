package com.zcy.music.mapper;

import com.zcy.music.entity.Category;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * 歌曲分类数据访问。
 */
@Mapper
public interface CategoryMapper {

    @Select("SELECT id, name, sort FROM category ORDER BY sort ASC, id ASC")
    List<Category> selectAll();
}
