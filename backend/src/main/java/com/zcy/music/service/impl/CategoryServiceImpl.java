package com.zcy.music.service.impl;

import com.zcy.music.entity.Category;
import com.zcy.music.mapper.CategoryMapper;
import com.zcy.music.service.CategoryService;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * 歌曲分类服务实现。
 */
@Service
public class CategoryServiceImpl implements CategoryService {

    private final CategoryMapper categoryMapper;

    public CategoryServiceImpl(CategoryMapper categoryMapper) {
        this.categoryMapper = categoryMapper;
    }

    @Override
    public List<Category> list() {
        return categoryMapper.selectAll();
    }
}
