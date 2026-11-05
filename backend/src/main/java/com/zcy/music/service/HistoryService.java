package com.zcy.music.service;

import com.zcy.music.vo.HistoryVO;

import java.util.List;

/**
 * 播放历史服务。
 */
public interface HistoryService {

    /** 记录一次播放（同一首歌只刷新播放时间） */
    void record(Long songId);

    List<HistoryVO> list(int limit);

    void clear();

    void remove(Long songId);
}
