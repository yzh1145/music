// 后端接口冒烟测试：验证公共接口、登录、JWT 鉴权与后台接口
const BASE = 'http://127.0.0.1:8080';

async function req(method, path, { token, body } = {}) {
  const headers = {};
  if (body) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = 'Bearer ' + token;
  const res = await fetch(BASE + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = text.slice(0, 200); }
  return { status: res.status, json };
}

const results = [];
function check(name, ok, extra = '') {
  results.push(`${ok ? 'PASS' : 'FAIL'} ${name}${extra ? ' -> ' + extra : ''}`);
}

(async () => {
  const home = await req('GET', '/api/home');
  check('GET /api/home', home.status === 200 && home.json.code === 200,
    `banner=${home.json.data?.banners?.length} playlist=${home.json.data?.recommendPlaylists?.length} newSong=${home.json.data?.newSongs?.length} singer=${home.json.data?.hotSingers?.length}`);

  const songs = await req('GET', '/api/song/page?size=3&sort=hot');
  check('GET /api/song/page', songs.json.code === 200 && songs.json.data.list.length === 3,
    `total=${songs.json.data?.total}`);

  const song = await req('GET', '/api/song/1');
  check('GET /api/song/1', song.json.code === 200 && !!song.json.data?.lyric,
    `${song.json.data?.name} / ${song.json.data?.singerName}`);

  const lyrics = song.json.data?.lyric || '';
  check('歌词 LRC 格式', lyrics.includes('[00:'), lyrics.split('\n').length + ' 行');

  const pl = await req('GET', '/api/playlist/1');
  check('GET /api/playlist/1', pl.json.code === 200 && pl.json.data.songs.length > 0,
    `${pl.json.data?.playlist?.name} / ${pl.json.data?.songs?.length} 首`);

  const singers = await req('GET', '/api/singer/page?size=3');
  check('GET /api/singer/page', singers.json.code === 200, `total=${singers.json.data?.total}`);

  const singer = await req('GET', '/api/singer/1');
  check('GET /api/singer/1', singer.json.code === 200 && singer.json.data.songs.length > 0,
    `${singer.json.data?.singer?.name} / 歌曲 ${singer.json.data?.songs?.length}`);

  const album = await req('GET', '/api/album/1');
  check('GET /api/album/1', album.json.code === 200, `${album.json.data?.album?.name}`);

  const search = await req('GET', '/api/search?keyword=' + encodeURIComponent('夏'));
  check('GET /api/search?keyword=夏', search.json.code === 200,
    `songs=${search.json.data?.songTotal} playlists=${search.json.data?.playlistTotal}`);

  const comments = await req('GET', '/api/comment/page?songId=1&size=5');
  check('GET /api/comment/page', comments.json.code === 200,
    `total=${comments.json.data?.total} 首条回复=${comments.json.data?.list?.[0]?.replies?.length}`);

  const categories = await req('GET', '/api/category/list');
  check('GET /api/category/list', categories.json.code === 200, `分类数=${categories.json.data?.length}`);

  const unauth = await req('GET', '/api/user/profile');
  check('未登录访问 /api/user/profile 返回 401', unauth.json.code === 401, unauth.json.message);

  const login = await req('POST', '/api/auth/login', { body: { username: 'admin', password: '123456' } });
  const token = login.json.data?.token;
  check('POST /api/auth/login (admin)', login.json.code === 200 && !!token,
    `nickname=${login.json.data?.user?.nickname} role=${login.json.data?.user?.role}`);

  const wrong = await req('POST', '/api/auth/login', { body: { username: 'admin', password: 'bad' } });
  check('错误密码返回 400', wrong.json.code === 400, wrong.json.message);

  const profile = await req('GET', '/api/user/profile', { token });
  check('GET /api/user/profile (JWT)', profile.json.code === 200, profile.json.data?.nickname);

  const stats = await req('GET', '/api/admin/stats', { token });
  check('GET /api/admin/stats', stats.json.code === 200,
    `用户${stats.json.data?.userCount} 歌曲${stats.json.data?.songCount} 播放${stats.json.data?.playCount}`);

  const strict = await req('GET', '/api/admin/stats');
  check('未登录后台接口返回 401', strict.json.code === 401);

  const like = await req('POST', '/api/song/2/like', { token });
  check('POST /api/song/2/like', like.json.code === 200, 'liked=' + like.json.data);
  const unlike = await req('POST', '/api/song/2/like', { token });
  check('再次调用取消喜欢', unlike.json.code === 200 && unlike.json.data === false);

  const addComment = await req('POST', '/api/comment', { token, body: { songId: 2, content: '冒烟测试评论' } });
  check('POST /api/comment', addComment.json.code === 200);

  const hist = await req('POST', '/api/history?songId=3', { token });
  const histList = await req('GET', '/api/history', { token });
  check('播放历史记录/查询', hist.json.code === 200 && histList.json.data?.length > 0,
    `历史 ${histList.json.data?.length} 条`);

  const register = await req('POST', '/api/auth/register', { body: { username: 'smoke_' + Date.now() % 100000, password: '123456', nickname: '冒烟用户' } });
  check('POST /api/auth/register', register.json.code === 200 && !!register.json.data?.token, register.json.message);

  console.log(results.join('\n'));
  const failed = results.filter(r => r.startsWith('FAIL')).length;
  console.log(`\n${results.length - failed}/${results.length} 通过`);
})();
