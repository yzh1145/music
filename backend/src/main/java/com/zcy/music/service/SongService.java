package com.zcy.music.service;

import com.zcy.music.common.PageResult;
import com.zcy.music.vo.SongVO;

/**
 * 歌曲服务。
 */
public interface SongService {

    /**
     * 分页查询歌曲。
     *
     * @param status 1 上架 / 0 下架 / -1 全部（后台），null 表示仅上架
     * @param sort   hot 按播放量、like 按喜欢数、其他按时间
     */
    PageResult<SongVO> page(String keyword, Long singerId, Long albumId, Integer categoryId,
                            Integer recommend, Integer status, String sort, int page, int size);

    SongVO detail(Long id);

    /** 播放量 +1 */
    void addPlayCount(Long id);
}
