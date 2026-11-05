package com.zcy.music.controller;

import com.zcy.music.common.Result;
import com.zcy.music.service.HistoryService;
import com.zcy.music.vo.HistoryVO;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 播放历史接口。
 */
@RestController
@RequestMapping("/api/history")
public class HistoryController {

    private final HistoryService historyService;

    public HistoryController(HistoryService historyService) {
        this.historyService = historyService;
    }

    /** 开始播放时记录历史 */
    @PostMapping
    public Result<Void> record(@RequestParam Long songId) {
        historyService.record(songId);
        return Result.ok();
    }

    @GetMapping
    public Result<List<HistoryVO>> list(@RequestParam(defaultValue = "100") int limit) {
        return Result.ok(historyService.list(limit));
    }

    @DeleteMapping
    public Result<Void> clear() {
        historyService.clear();
        return Result.ok();
    }

    @DeleteMapping("/{songId}")
    public Result<Void> remove(@PathVariable Long songId) {
        historyService.remove(songId);
        return Result.ok();
    }
}
