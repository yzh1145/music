package com.zcy.music.service.impl;

import com.zcy.music.common.BusinessException;
import com.zcy.music.common.UserContext;
import com.zcy.music.entity.Song;
import com.zcy.music.mapper.PlayHistoryMapper;
import com.zcy.music.mapper.SongMapper;
import com.zcy.music.service.HistoryService;
import com.zcy.music.vo.HistoryVO;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * 播放历史服务实现。
 */
@Service
public class HistoryServiceImpl implements HistoryService {

    private final PlayHistoryMapper playHistoryMapper;
    private final SongMapper songMapper;

    public HistoryServiceImpl(PlayHistoryMapper playHistoryMapper, SongMapper songMapper) {
        this.playHistoryMapper = playHistoryMapper;
        this.songMapper = songMapper;
    }

    @Override
    public void record(Long songId) {
        Long userId = UserContext.requireUserId();
        if (songId == null) {
            throw new BusinessException("缺少歌曲 ID");
        }
        Song song = songMapper.findById(songId);
        if (song == null || song.getStatus() == null || song.getStatus() == 0) {
            throw BusinessException.notFound("歌曲不存在或已下架");
        }
        playHistoryMapper.upsert(userId, songId);
    }

    @Override
    public List<HistoryVO> list(int limit) {
        Long userId = UserContext.requireUserId();
        limit = Math.min(Math.max(limit, 1), 200);
        return playHistoryMapper.selectByUser(userId, limit);
    }

    @Override
    public void clear() {
        playHistoryMapper.deleteAll(UserContext.requireUserId());
    }

    @Override
    public void remove(Long songId) {
        playHistoryMapper.deleteOne(UserContext.requireUserId(), songId);
    }
}
