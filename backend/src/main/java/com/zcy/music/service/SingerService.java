package com.zcy.music.service;

import com.zcy.music.common.PageResult;
import com.zcy.music.vo.SingerDetailVO;
import com.zcy.music.vo.SingerVO;

/**
 * 歌手服务。
 */
public interface SingerService {

    PageResult<SingerVO> page(String keyword, String region, int page, int size);

    SingerDetailVO detail(Long id);

    boolean toggleFollow(Long id);
}
