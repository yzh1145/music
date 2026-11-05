package com.zcy.music.service;

import com.zcy.music.vo.SearchVO;

/**
 * 搜索服务：歌曲、歌单、歌手、专辑。
 */
public interface SearchService {

    SearchVO search(String keyword, int limit);
}
