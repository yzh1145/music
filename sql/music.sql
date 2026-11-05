-- ============================================================================
-- 仿网易云音乐 · 数据库初始化脚本
-- 数据库：music_db
-- 说明  ：可直接在 MySQL 命令行 / Navicat / DataGrip 中执行，可重复执行
-- 执行  ：mysql -uroot -p < sql/music.sql
-- ============================================================================

DROP DATABASE IF EXISTS music_db;
CREATE DATABASE music_db
    DEFAULT CHARACTER SET utf8mb4
    COLLATE utf8mb4_general_ci;

USE music_db;

-- 说明：为保证演示数据可重复导入、后台删除操作灵活，本库不建立物理外键，
--      表间关系由应用层维护，关联字段均已建立索引。
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================================
-- 一、用户
-- ============================================================================
DROP TABLE IF EXISTS `user`;
CREATE TABLE `user` (
    `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `username`    VARCHAR(50)     NOT NULL                COMMENT '登录账号',
    `password`    VARCHAR(128)    NOT NULL                COMMENT '密码（PBKDF2：迭代次数$盐$哈希）',
    `nickname`    VARCHAR(50)     NOT NULL                COMMENT '昵称',
    `avatar`      VARCHAR(255)             DEFAULT NULL   COMMENT '头像地址',
    `gender`      TINYINT         NOT NULL DEFAULT 0      COMMENT '性别：0未知 1男 2女',
    `birthday`    DATE                     DEFAULT NULL   COMMENT '生日',
    `signature`   VARCHAR(255)             DEFAULT '这个人很懒，什么都没有留下。' COMMENT '个性签名',
    `phone`       VARCHAR(20)              DEFAULT NULL   COMMENT '手机号',
    `email`       VARCHAR(100)             DEFAULT NULL   COMMENT '邮箱',
    `role`        TINYINT         NOT NULL DEFAULT 0      COMMENT '角色：0普通用户 1管理员',
    `status`      TINYINT         NOT NULL DEFAULT 1      COMMENT '状态：1正常 0禁用',
    `create_time` DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '注册时间',
    `update_time` DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_username` (`username`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = '用户表';

-- ============================================================================
-- 二、曲库：歌手 / 专辑 / 分类 / 歌曲
-- ============================================================================
DROP TABLE IF EXISTS `singer`;
CREATE TABLE `singer` (
    `id`           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `name`         VARCHAR(50)     NOT NULL                COMMENT '歌手名',
    `avatar`       VARCHAR(255)             DEFAULT NULL   COMMENT '头像',
    `cover`        VARCHAR(255)             DEFAULT NULL   COMMENT '歌手页大图',
    `gender`       TINYINT         NOT NULL DEFAULT 0      COMMENT '0组合 1男 2女',
    `region`       VARCHAR(50)              DEFAULT '华语' COMMENT '地区',
    `birthday`     DATE                     DEFAULT NULL   COMMENT '出生日期',
    `intro`        TEXT                                    COMMENT '歌手简介',
    `follow_count` INT             NOT NULL DEFAULT 0      COMMENT '关注数',
    `create_time`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_singer_name` (`name`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = '歌手表';

DROP TABLE IF EXISTS `album`;
CREATE TABLE `album` (
    `id`           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `name`         VARCHAR(100)    NOT NULL                COMMENT '专辑名',
    `singer_id`    BIGINT UNSIGNED NOT NULL                COMMENT '歌手ID',
    `cover`        VARCHAR(255)             DEFAULT NULL   COMMENT '封面',
    `publish_date` DATE                     DEFAULT NULL   COMMENT '发行日期',
    `company`      VARCHAR(100)             DEFAULT NULL   COMMENT '唱片公司',
    `intro`        TEXT                                    COMMENT '专辑简介',
    `create_time`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`),
    KEY `idx_album_singer` (`singer_id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = '专辑表';

DROP TABLE IF EXISTS `category`;
CREATE TABLE `category` (
    `id`   INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `name` VARCHAR(20)  NOT NULL                COMMENT '分类名',
    `sort` INT          NOT NULL DEFAULT 0      COMMENT '排序',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_category_name` (`name`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = '歌曲分类表';

DROP TABLE IF EXISTS `song`;
CREATE TABLE `song` (
    `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `name`          VARCHAR(100)    NOT NULL                COMMENT '歌曲名',
    `singer_id`     BIGINT UNSIGNED NOT NULL                COMMENT '歌手ID',
    `album_id`      BIGINT UNSIGNED          DEFAULT NULL   COMMENT '专辑ID',
    `cover`         VARCHAR(255)             DEFAULT NULL   COMMENT '封面',
    `audio_url`     VARCHAR(255)             DEFAULT NULL   COMMENT '音频地址',
    `lyric`         LONGTEXT                                COMMENT 'LRC 歌词',
    `duration`      INT             NOT NULL DEFAULT 0      COMMENT '时长（秒）',
    `category_id`   INT UNSIGNED             DEFAULT NULL   COMMENT '分类ID',
    `play_count`    INT             NOT NULL DEFAULT 0      COMMENT '播放量',
    `like_count`    INT             NOT NULL DEFAULT 0      COMMENT '喜欢数',
    `comment_count` INT             NOT NULL DEFAULT 0      COMMENT '评论数',
    `is_recommend`  TINYINT         NOT NULL DEFAULT 0      COMMENT '1推荐 0普通',
    `status`        TINYINT         NOT NULL DEFAULT 1      COMMENT '1上架 0下架',
    `create_time`   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '发布时间',
    `update_time`   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    KEY `idx_song_singer` (`singer_id`),
    KEY `idx_song_album` (`album_id`),
    KEY `idx_song_category` (`category_id`),
    KEY `idx_song_name` (`name`),
    KEY `idx_song_recommend` (`is_recommend`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = '歌曲表';

-- ============================================================================
-- 三、歌单
-- ============================================================================
DROP TABLE IF EXISTS `playlist`;
CREATE TABLE `playlist` (
    `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `name`          VARCHAR(100)    NOT NULL                COMMENT '歌单名',
    `cover`         VARCHAR(255)             DEFAULT NULL   COMMENT '封面',
    `intro`         TEXT                                    COMMENT '简介',
    `user_id`       BIGINT UNSIGNED NOT NULL                COMMENT '创建者ID',
    `category`      VARCHAR(20)              DEFAULT '流行' COMMENT '分类标签',
    `play_count`    INT             NOT NULL DEFAULT 0      COMMENT '播放量',
    `collect_count` INT             NOT NULL DEFAULT 0      COMMENT '收藏量',
    `is_recommend`  TINYINT         NOT NULL DEFAULT 0      COMMENT '1首页推荐',
    `status`        TINYINT         NOT NULL DEFAULT 1      COMMENT '1正常 0删除',
    `create_time`   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time`   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    KEY `idx_playlist_user` (`user_id`),
    KEY `idx_playlist_recommend` (`is_recommend`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = '歌单表';

DROP TABLE IF EXISTS `playlist_song`;
CREATE TABLE `playlist_song` (
    `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `playlist_id` BIGINT UNSIGNED NOT NULL                COMMENT '歌单ID',
    `song_id`     BIGINT UNSIGNED NOT NULL                COMMENT '歌曲ID',
    `sort`        INT             NOT NULL DEFAULT 0      COMMENT '歌单内排序',
    `create_time` DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '加入时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_playlist_song` (`playlist_id`, `song_id`),
    KEY `idx_ps_song` (`song_id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = '歌单歌曲关联表';

-- ============================================================================
-- 四、互动：评论 / 点赞 / 收藏 / 关注 / 播放历史
-- ============================================================================
DROP TABLE IF EXISTS `comment`;
CREATE TABLE `comment` (
    `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `song_id`     BIGINT UNSIGNED NOT NULL                COMMENT '歌曲ID',
    `user_id`     BIGINT UNSIGNED NOT NULL                COMMENT '评论人ID',
    `content`     VARCHAR(500)    NOT NULL                COMMENT '评论内容',
    `parent_id`   BIGINT UNSIGNED NOT NULL DEFAULT 0      COMMENT '父评论ID，0为一级评论',
    `like_count`  INT             NOT NULL DEFAULT 0      COMMENT '点赞数',
    `status`      TINYINT         NOT NULL DEFAULT 1      COMMENT '1正常 0删除',
    `create_time` DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '评论时间',
    PRIMARY KEY (`id`),
    KEY `idx_comment_song` (`song_id`, `create_time`),
    KEY `idx_comment_parent` (`parent_id`),
    KEY `idx_comment_user` (`user_id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = '评论表';

DROP TABLE IF EXISTS `comment_like`;
CREATE TABLE `comment_like` (
    `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `comment_id`  BIGINT UNSIGNED NOT NULL                COMMENT '评论ID',
    `user_id`     BIGINT UNSIGNED NOT NULL                COMMENT '点赞人ID',
    `create_time` DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '点赞时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_comment_like` (`comment_id`, `user_id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = '评论点赞表';

DROP TABLE IF EXISTS `user_song`;
CREATE TABLE `user_song` (
    `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `user_id`     BIGINT UNSIGNED NOT NULL                COMMENT '用户ID',
    `song_id`     BIGINT UNSIGNED NOT NULL                COMMENT '歌曲ID',
    `create_time` DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '收藏时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_user_song` (`user_id`, `song_id`),
    KEY `idx_us_song` (`song_id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = '用户喜欢的歌曲表';

DROP TABLE IF EXISTS `user_playlist`;
CREATE TABLE `user_playlist` (
    `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `user_id`     BIGINT UNSIGNED NOT NULL                COMMENT '用户ID',
    `playlist_id` BIGINT UNSIGNED NOT NULL                COMMENT '歌单ID',
    `create_time` DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '收藏时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_user_playlist` (`user_id`, `playlist_id`),
    KEY `idx_up_playlist` (`playlist_id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = '用户收藏的歌单表';

DROP TABLE IF EXISTS `user_singer`;
CREATE TABLE `user_singer` (
    `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `user_id`     BIGINT UNSIGNED NOT NULL                COMMENT '用户ID',
    `singer_id`   BIGINT UNSIGNED NOT NULL                COMMENT '歌手ID',
    `create_time` DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '关注时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_user_singer` (`user_id`, `singer_id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = '用户关注的歌手表';

DROP TABLE IF EXISTS `play_history`;
CREATE TABLE `play_history` (
    `id`        BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `user_id`   BIGINT UNSIGNED NOT NULL                COMMENT '用户ID',
    `song_id`   BIGINT UNSIGNED NOT NULL                COMMENT '歌曲ID',
    `play_time` DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '最近播放时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_history_user_song` (`user_id`, `song_id`),
    KEY `idx_history_user_time` (`user_id`, `play_time`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = '播放历史表';

-- ============================================================================
-- 五、运营：轮播图
-- ============================================================================
DROP TABLE IF EXISTS `banner`;
CREATE TABLE `banner` (
    `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `title`       VARCHAR(100)    NOT NULL                COMMENT '标题',
    `image_url`   VARCHAR(255)    NOT NULL                COMMENT '图片地址',
    `link_type`   TINYINT         NOT NULL DEFAULT 1      COMMENT '1歌单 2歌曲 3歌手 4外链',
    `link_id`     BIGINT UNSIGNED          DEFAULT NULL   COMMENT '跳转目标ID',
    `sort`        INT             NOT NULL DEFAULT 0      COMMENT '排序',
    `status`      TINYINT         NOT NULL DEFAULT 1      COMMENT '1启用 0禁用',
    `create_time` DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = '轮播图表';

-- ============================================================================
-- 六、演示数据
-- ============================================================================

-- 6.1 用户（密码均为 123456）
INSERT INTO `user` (`id`, `username`, `password`, `nickname`, `avatar`, `gender`, `birthday`, `signature`, `role`, `status`, `create_time`) VALUES
(1, 'admin', '10000$a1b2c3d4e5f60718$03a11d6a0f47797f661ff5a93377063b1e30748818a166f8ffcf77e53fb22b65', '云音乐管理员', '/images/avatar/u1.png', 1, '1998-05-20', '用音乐记录生活，用代码实现浪漫。', 1, 1, '2026-01-01 10:00:00'),
(2, 'test',  '10000$1122334455667788$a9918c0d8cef7d5a01a1eda29af426dbae919d5284cfda6e873f8592aaf9947e', '听歌的鱼',   '/images/avatar/u2.png', 2, '2002-08-16', '耳机是人类的避难所。', 0, 1, '2026-02-14 20:30:00'),
(3, 'music', '10000$99aabbccddeeff00$0f7a1d21a62c722e03d0e3a0072714f99e925cf53c1ef33e4af20d403a610b25', '南风知我意', '/images/avatar/u3.png', 2, '2000-11-03', '山有木兮木有枝。', 0, 1, '2026-03-08 09:15:00');

-- 6.2 歌手
INSERT INTO `singer` (`id`, `name`, `avatar`, `cover`, `gender`, `region`, `birthday`, `intro`, `follow_count`, `create_time`) VALUES
(1, '林夏',          '/images/singer/s1.png', '/images/singer/cover/s1.png', 2, '华语', '1996-07-12', '新生代创作女歌手，声线清澈，擅长把夏天的风写进旋律里。代表作《夏夜晚风》《雨停之前》。', 18620, '2025-06-01 10:00:00'),
(2, '陈默',          '/images/singer/s2.png', '/images/singer/cover/s2.png', 1, '华语', '1993-02-28', '民谣歌手，背着吉他走过三十座城市，把沿途的故事唱给陌生人听。', 12450, '2025-07-15 10:00:00'),
(3, 'Midnight City', '/images/singer/s3.png', '/images/singer/cover/s3.png', 0, '欧美', '2018-09-01', '来自柏林的电子双人组，用合成器描绘霓虹与午夜。', 9870,  '2025-08-20 10:00:00'),
(4, '苏晚晴',        '/images/singer/s4.png', '/images/singer/cover/s4.png', 2, '华语', '1999-04-05', '国风唱作人，古筝十级，致力于让年轻人重新听见长安。', 15330, '2025-09-10 10:00:00'),
(5, '周野',          '/images/singer/s5.png', '/images/singer/cover/s5.png', 1, '华语', '1991-12-19', '摇滚乐队主唱，嗓音粗粝，唱的是不肯低头的普通人。', 11200, '2025-10-05 10:00:00'),
(6, 'Luna Park',     '/images/singer/s6.png', '/images/singer/cover/s6.png', 2, '日韩', '2000-06-22', '首尔独立音乐人，梦幻流行风格，像月光落在汉江上。', 8760,  '2025-11-11 10:00:00'),
(7, '老K',           '/images/singer/s7.png', '/images/singer/cover/s7.png', 1, '华语', '1994-03-30', '街头说唱歌手，押韵记录城市褶皱里的故事。', 6540,  '2025-12-01 10:00:00'),
(8, '白鹿乐队',      '/images/singer/s8.png', '/images/singer/cover/s8.png', 0, '华语', '2017-05-01', '四人独立乐队，作品里有山、有鹿、有远方。', 10210, '2026-01-08 10:00:00');

-- 6.3 专辑
INSERT INTO `album` (`id`, `name`, `singer_id`, `cover`, `publish_date`, `company`, `intro`, `create_time`) VALUES
(1,  '夏日回声',   1, '/images/album/a1.png',  '2026-06-01', '云上唱片', '一张关于夏天、汽水和晚风的专辑。', '2026-06-01 10:00:00'),
(2,  '城市夜行',   2, '/images/album/a2.png',  '2025-11-12', '木吉他音乐', '写给每一个在深夜赶路的人。', '2025-11-12 10:00:00'),
(3,  'Neon Dreams', 3, '/images/album/a3.png', '2026-03-20', 'Neon Records', '霓虹、合成器与午夜的梦。', '2026-03-20 10:00:00'),
(4,  '长安月',     4, '/images/album/a4.png',  '2025-09-15', '青瓷文化', '古筝与弦乐织就的长安夜色。', '2025-09-15 10:00:00'),
(5,  '逆风',       5, '/images/album/a5.png',  '2026-01-08', '野火音乐', '献给所有逆风而行的人。', '2026-01-08 10:00:00'),
(6,  'Moonlight',  6, '/images/album/a6.png',  '2026-05-22', 'Luna Studio', '月光下的城市与海。', '2026-05-22 10:00:00'),
(7,  '街角故事',   7, '/images/album/a7.png',  '2025-12-01', '地下声场', '街角、便利店、凌晨三点。', '2025-12-01 10:00:00'),
(8,  '白鹿',       8, '/images/album/a8.png',  '2026-02-14', '山野唱片', '山谷里的回声与鹿鸣。', '2026-02-14 10:00:00'),
(9,  '山谷来信',   2, '/images/album/a9.png',  '2026-07-09', '木吉他音乐', '来自南方山谷的九封信。', '2026-07-09 10:00:00'),
(10, '回声之外',   1, '/images/album/a10.png', '2024-08-30', '云上唱片', '林夏的第一张专辑。', '2024-08-30 10:00:00');

-- 6.4 歌曲分类
INSERT INTO `category` (`id`, `name`, `sort`) VALUES
(1, '流行', 1), (2, '摇滚', 2), (3, '民谣', 3), (4, '电子', 4), (5, '说唱', 5), (6, '古风', 6);

-- 6.5 歌曲（音频由 tools/gen_assets.py 本地生成，duration 与实际音频时长一致）
INSERT INTO `song` (`id`, `name`, `singer_id`, `album_id`, `cover`, `audio_url`, `lyric`, `duration`, `category_id`, `play_count`, `like_count`, `comment_count`, `is_recommend`, `status`, `create_time`) VALUES
(1, '夏夜晚风', 1, 1, '/images/album/a1.png', '/audio/track-1.wav',
 '[00:00.00]夏夜晚风 - 林夏\n[00:03.00]作词：林夏\n[00:06.00]作曲：林夏\n[00:10.00]晚风把街灯吹得摇晃\n[00:18.00]汽水在口袋里发了烫\n[00:26.00]我们骑车穿过整座城\n[00:34.00]把夏天甩在身后\n[00:42.00]wu——夏夜的风\n[00:50.00]请你慢一点走',
 48, 1, 128600, 3521, 3, 1, 1, '2026-06-02 09:00:00'),
(2, '雨停之前', 1, 1, '/images/album/a1.png', '/audio/track-2.wav',
 '[00:00.00]雨停之前 - 林夏\n[00:03.00]作词：林夏\n[00:06.00]作曲：林夏\n[00:10.00]乌云压低了屋檐\n[00:18.00]伞下藏着半个夏天\n[00:26.00]你说等雨停就告别\n[00:34.00]我假装没有听见',
 42, 1, 96420, 2890, 1, 1, 1, '2026-06-02 09:05:00'),
(3, '城市夜行', 2, 2, '/images/album/a2.png', '/audio/track-3.wav',
 '[00:00.00]城市夜行 - 陈默\n[00:03.00]作词：陈默\n[00:06.00]作曲：陈默\n[00:10.00]末班车把影子拉长\n[00:18.00]便利店亮着最后的光\n[00:26.00]我把疲惫唱给月亮\n[00:34.00]它说明天还要起床\n[00:42.00]城市啊 请你收留我\n[00:50.00]一个不肯睡的人',
 56, 3, 208400, 5120, 2, 1, 1, '2025-11-13 10:00:00'),
(4, '南方以南', 2, 9, '/images/album/a9.png', '/audio/track-4.wav',
 '[00:00.00]南方以南 - 陈默\n[00:03.00]作词：陈默\n[00:06.00]作曲：陈默\n[00:10.00]火车开过第七座山\n[00:18.00]风里有稻子和炊烟\n[00:26.00]南方以南 有人在等\n[00:34.00]等一封迟到多年的信',
 38, 3, 74210, 1980, 0, 0, 1, '2026-07-10 10:00:00'),
(5, 'Neon Dreams', 3, 3, '/images/album/a3.png', '/audio/track-5.wav',
 '[00:00.00]Neon Dreams - Midnight City\n[00:04.00]Written by Midnight City\n[00:10.00]Neon lights on rainy glass\n[00:18.00]We are dancing way too fast\n[00:26.00]Every shadow wears a crown\n[00:34.00]Midnight city won''t slow down\n[00:42.00]Don''t wake up, don''t wake up\n[00:50.00]Stay inside the neon dream',
 60, 4, 176900, 4210, 2, 1, 1, '2026-03-21 10:00:00'),
(6, '午夜频率', 3, 3, '/images/album/a3.png', '/audio/track-6.wav',
 '[00:00.00]午夜频率 - Midnight City\n[00:04.00]Written by Midnight City\n[00:10.00]Radio waves across the night\n[00:18.00]Static turning into light\n[00:26.00]Tune the dial to 88\n[00:34.00]Find me on the midnight frequency',
 44, 4, 88300, 2015, 1, 0, 1, '2026-03-21 10:05:00'),
(7, '长安月', 4, 4, '/images/album/a4.png', '/audio/track-7.wav',
 '[00:00.00]长安月 - 苏晚晴\n[00:04.00]作词：苏晚晴\n[00:08.00]作曲：苏晚晴\n[00:12.00]长安月色落城头\n[00:20.00]一壶清酒一壶愁\n[00:28.00]故人已在千里外\n[00:36.00]唯有明月照旧楼\n[00:44.00]愿我如星君如月\n[00:52.00]夜夜流光相皎洁',
 52, 6, 143700, 3880, 2, 1, 1, '2025-09-16 10:00:00'),
(8, '折柳', 4, 4, '/images/album/a4.png', '/audio/track-8.wav',
 '[00:00.00]折柳 - 苏晚晴\n[00:04.00]作词：苏晚晴\n[00:08.00]作曲：苏晚晴\n[00:12.00]长亭外 折一枝柳\n[00:20.00]送你到这渡口\n[00:28.00]此去山高水远\n[00:36.00]记得写信给我',
 46, 6, 67900, 1745, 0, 0, 1, '2025-09-16 10:05:00'),
(9, '逆风', 5, 5, '/images/album/a5.png', '/audio/track-1.wav',
 '[00:00.00]逆风 - 周野\n[00:03.00]作词：周野\n[00:06.00]作曲：周野\n[00:10.00]他们把路堵成一面墙\n[00:18.00]我就把墙推倒当桥桩\n[00:26.00]逆着风 才是我的方向\n[00:34.00]哪怕摔得遍体鳞伤',
 48, 2, 231500, 6540, 2, 1, 1, '2026-01-09 10:00:00'),
(10, '野火', 5, 5, '/images/album/a5.png', '/audio/track-2.wav',
 '[00:00.00]野火 - 周野\n[00:03.00]作词：周野\n[00:06.00]作曲：周野\n[00:10.00]野火烧过整个荒原\n[00:18.00]烧不完心里的不甘\n[00:26.00]等到春风再吹一遍\n[00:34.00]我就重新长出火焰',
 42, 2, 128300, 3120, 1, 0, 1, '2026-01-09 10:05:00'),
(11, 'Moonlight', 6, 6, '/images/album/a6.png', '/audio/track-3.wav',
 '[00:00.00]Moonlight - Luna Park\n[00:04.00]Written by Luna Park\n[00:10.00]Moonlight falling on the sea\n[00:18.00]You are here in front of me\n[00:26.00]All the stars are out of tune\n[00:34.00]But they sing for me and you\n[00:42.00]Hold me in the moonlight',
 56, 1, 156800, 4025, 1, 1, 1, '2026-05-23 10:00:00'),
(12, '银河列车', 6, 6, '/images/album/a6.png', '/audio/track-4.wav',
 '[00:00.00]银河列车 - Luna Park\n[00:04.00]作词：Luna Park\n[00:10.00]银河列车 开往凌晨\n[00:18.00]窗外流星 排成一排\n[00:26.00]睡吧睡吧 我的旅人\n[00:34.00]下一站是 你的梦乡',
 38, 1, 91200, 2260, 0, 0, 1, '2026-05-23 10:05:00'),
(13, '街角故事', 7, 7, '/images/album/a7.png', '/audio/track-5.wav',
 '[00:00.00]街角故事 - 老K\n[00:04.00]作词：老K\n[00:08.00]作曲：老K\n[00:12.00]便利店门口的台阶\n[00:20.00]坐着一个失眠的夜\n[00:28.00]外卖箱 旧球鞋\n[00:36.00]城市把故事写进街\n[00:44.00]这都是街角的故事\n[00:52.00]也是我们的故事',
 60, 5, 108400, 2510, 1, 1, 1, '2025-12-02 10:00:00'),
(14, '凌晨三点', 7, 7, '/images/album/a7.png', '/audio/track-6.wav',
 '[00:00.00]凌晨三点 - 老K\n[00:04.00]作词：老K\n[00:08.00]作曲：老K\n[00:12.00]凌晨三点 城市熄灯\n[00:20.00]只有键盘陪我发疯\n[00:28.00]押韵是最后的倔强\n[00:36.00]天亮之前 再写一行',
 44, 5, 62300, 1480, 0, 0, 1, '2025-12-02 10:05:00'),
(15, '白鹿', 8, 8, '/images/album/a8.png', '/audio/track-7.wav',
 '[00:00.00]白鹿 - 白鹿乐队\n[00:04.00]作词：白鹿乐队\n[00:08.00]作曲：白鹿乐队\n[00:12.00]白鹿跑过山岗\n[00:20.00]月光落在它身上\n[00:28.00]我追上整片森林\n[00:36.00]只为听它一声唤\n[00:44.00]山风啊 带我走吧',
 52, 2, 134600, 3320, 1, 1, 1, '2026-02-15 10:00:00'),
(16, '山风', 8, 8, '/images/album/a8.png', '/audio/track-8.wav',
 '[00:00.00]山风 - 白鹿乐队\n[00:04.00]作词：白鹿乐队\n[00:08.00]作曲：白鹿乐队\n[00:12.00]山风穿过旧木门\n[00:20.00]带来远方的人\n[00:28.00]篝火照亮每张脸\n[00:36.00]故事说到夜深',
 46, 2, 87600, 2150, 0, 0, 1, '2026-02-15 10:05:00');

-- 6.6 歌单
INSERT INTO `playlist` (`id`, `name`, `cover`, `intro`, `user_id`, `category`, `play_count`, `collect_count`, `is_recommend`, `status`, `create_time`) VALUES
(1, '夏日限定 · 晚风与汽水', '/images/playlist/p1.png', '冰镇汽水、单车和晚风，把整个夏天装进耳机。', 1, '流行', 328000, 12600, 1, 1, '2026-06-05 10:00:00'),
(2, '深夜 City Pop 电台',    '/images/playlist/p2.png', '霓虹灯下的合成器，陪你穿过零点的城市。',     1, '电子', 215000, 8400,  1, 1, '2026-03-25 10:00:00'),
(3, '华语民谣 · 山谷来信',    '/images/playlist/p3.png', '民谣是写给生活的信，慢慢拆，慢慢读。',       1, '民谣', 186000, 7300,  1, 1, '2026-04-12 10:00:00'),
(4, '燃！摇滚现场',           '/images/playlist/p4.png', '把音量开到最大，让心跳和鼓点同频。',         1, '摇滚', 264000, 9800,  1, 1, '2026-02-20 10:00:00'),
(5, '古风 · 长安月下',        '/images/playlist/p5.png', '一曲长安月，半城旧时光。',                   2, '古风', 54000,  2100,  0, 1, '2026-05-01 10:00:00'),
(6, '说唱街区',               '/images/playlist/p6.png', '街角、便利店、凌晨三点，都是押韵的素材。',   3, '说唱', 43000,  1600,  0, 1, '2026-05-18 10:00:00');

-- 6.7 歌单歌曲
INSERT INTO `playlist_song` (`playlist_id`, `song_id`, `sort`) VALUES
(1, 1, 1), (1, 2, 2), (1, 11, 3), (1, 12, 4), (1, 6, 5), (1, 16, 6),
(2, 5, 1), (2, 6, 2), (2, 3, 3), (2, 13, 4), (2, 14, 5),
(3, 3, 1), (3, 4, 2), (3, 16, 3), (3, 2, 4), (3, 8, 5),
(4, 9, 1), (4, 10, 2), (4, 15, 3), (4, 16, 4), (4, 1, 5),
(5, 7, 1), (5, 8, 2),
(6, 13, 1), (6, 14, 2);

-- 6.8 评论（含二级回复）
INSERT INTO `comment` (`id`, `song_id`, `user_id`, `content`, `parent_id`, `like_count`, `status`, `create_time`) VALUES
(1, 1, 2, '前奏一响，夏天就回来了。', 0, 128, 1, '2026-06-03 21:12:00'),
(2, 1, 3, '骑车穿过整座城那句，写到心里去了。', 0, 86, 1, '2026-06-04 09:30:00'),
(3, 1, 1, '谢谢喜欢，这个夏天一起听风。', 1, 233, 1, '2026-06-04 10:02:00'),
(4, 5, 3, '合成器一出来鸡皮疙瘩就起来了。', 0, 214, 1, '2026-03-22 00:15:00'),
(5, 5, 2, '午夜开着车听这首歌，绝了。', 0, 97, 1, '2026-03-25 23:41:00'),
(6, 9, 2, '逆风才是我的方向，明天继续上班。', 0, 176, 1, '2026-01-10 08:20:00'),
(7, 9, 3, '摔得遍体鳞伤也要往前冲。', 6, 45, 1, '2026-01-10 12:05:00'),
(8, 7, 2, '古筝一响，长安就到了。', 0, 152, 1, '2025-09-17 20:00:00'),
(9, 7, 1, '愿我如星君如月，夜夜流光相皎洁。', 8, 88, 1, '2025-09-18 09:10:00'),
(10, 3, 3, '末班车把影子拉长，这句太真实了。', 0, 64, 1, '2025-11-14 22:30:00'),
(11, 13, 2, '街角故事，也是我们的故事。', 0, 39, 1, '2025-12-03 19:45:00'),
(12, 15, 3, '山风带走所有烦恼。', 0, 51, 1, '2026-02-16 11:20:00');

-- 6.9 评论点赞
INSERT INTO `comment_like` (`comment_id`, `user_id`, `create_time`) VALUES
(1, 2, '2026-06-03 21:20:00'), (1, 3, '2026-06-04 08:00:00'), (3, 2, '2026-06-04 11:00:00'),
(4, 2, '2026-03-22 09:00:00'), (6, 3, '2026-01-10 09:00:00'), (8, 2, '2025-09-18 10:00:00');

-- 6.10 用户收藏 / 关注 / 历史
INSERT INTO `user_song` (`user_id`, `song_id`, `create_time`) VALUES
(2, 1, '2026-06-03 21:10:00'), (2, 5, '2026-03-22 00:10:00'), (2, 9, '2026-01-10 08:15:00'),
(2, 11, '2026-05-24 22:00:00'), (2, 15, '2026-02-16 11:00:00'),
(3, 2, '2026-06-05 19:00:00'), (3, 7, '2025-09-18 09:00:00');

INSERT INTO `user_playlist` (`user_id`, `playlist_id`, `create_time`) VALUES
(2, 1, '2026-06-05 12:00:00'), (2, 4, '2026-02-21 20:00:00'), (3, 2, '2026-03-26 21:00:00');

INSERT INTO `user_singer` (`user_id`, `singer_id`, `create_time`) VALUES
(2, 1, '2026-06-03 21:00:00'), (2, 3, '2026-03-22 00:00:00'), (3, 5, '2026-01-10 08:00:00');

INSERT INTO `play_history` (`user_id`, `song_id`, `play_time`) VALUES
(2, 1, '2026-11-03 21:12:00'), (2, 5, '2026-11-03 20:40:00'), (2, 9, '2026-11-02 08:30:00'),
(2, 11, '2026-11-01 22:10:00'), (3, 7, '2026-11-03 19:00:00');

-- 6.11 轮播图
INSERT INTO `banner` (`id`, `title`, `image_url`, `link_type`, `link_id`, `sort`, `status`) VALUES
(1, '夏日限定 · 晚风与汽水', '/images/banner/b1.png', 1, 1, 1, 1),
(2, '深夜 City Pop 电台',    '/images/banner/b2.png', 1, 2, 2, 1),
(3, '燃！摇滚现场',           '/images/banner/b3.png', 1, 4, 3, 1);

-- 6.12 修正统计字段（与实际评论/点赞数保持一致）
UPDATE `song` SET `comment_count` = (SELECT COUNT(*) FROM `comment` c WHERE c.song_id = `song`.id AND c.status = 1);
UPDATE `comment` SET `like_count` = (SELECT COUNT(*) FROM `comment_like` cl WHERE cl.comment_id = `comment`.id);
UPDATE `playlist` SET `collect_count` = (SELECT COUNT(*) FROM `user_playlist` up WHERE up.playlist_id = `playlist`.id);
UPDATE `singer` SET `follow_count` = (SELECT COUNT(*) FROM `user_singer` us WHERE us.singer_id = `singer`.id);

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- 七、验证
-- ============================================================================
SELECT '用户' AS 表名, COUNT(*) AS 记录数 FROM `user`
UNION ALL SELECT '歌手', COUNT(*) FROM `singer`
UNION ALL SELECT '专辑', COUNT(*) FROM `album`
UNION ALL SELECT '歌曲', COUNT(*) FROM `song`
UNION ALL SELECT '歌单', COUNT(*) FROM `playlist`
UNION ALL SELECT '歌单歌曲', COUNT(*) FROM `playlist_song`
UNION ALL SELECT '评论', COUNT(*) FROM `comment`
UNION ALL SELECT '轮播图', COUNT(*) FROM `banner`;
