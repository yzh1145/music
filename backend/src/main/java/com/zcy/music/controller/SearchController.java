package com.zcy.music.controller;

import com.zcy.music.common.Result;
import com.zcy.music.service.SearchService;
import com.zcy.music.vo.SearchVO;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 搜索接口：一次返回歌曲 / 歌单 / 歌手 / 专辑。
 */
@RestController
@RequestMapping("/api/search")
public class SearchController {

    private final SearchService searchService;

    public SearchController(SearchService searchService) {
        this.searchService = searchService;
    }

    @GetMapping
    public Result<SearchVO> search(@RequestParam(required = false) String keyword,
                                   @RequestParam(defaultValue = "20") int limit) {
        return Result.ok(searchService.search(keyword, limit));
    }
}
