package com.zcy.music.service;

import com.zcy.music.common.PageResult;
import com.zcy.music.vo.AlbumDetailVO;
import com.zcy.music.vo.AlbumVO;

/**
 * 专辑服务。
 */
public interface AlbumService {

    PageResult<AlbumVO> page(String keyword, Long singerId, int page, int size);

    AlbumDetailVO detail(Long id);
}
