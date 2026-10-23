const qualifyingSongs = Object.freeze({
  delicate: Object.freeze([
    ['破曉', '林憶蓮'],
    ['野孩子', '楊千嬅'],
    ['勁浪漫 超溫馨', 'Gareth Tong'],
    ['最佳損友', '陳奕迅'],
    ['要還', 'Constance'],
    ['笑忘書', '張敬軒'],
    ['浸浴', '葉巧琳'],
    ["It's Okay to be Sad", '衛蘭'],
    ['高山低谷', '林奕匡'],
    ['暗湧', '王菲']
  ]),
  power: Object.freeze([
    ['下流社會', '陳蕾'],
    ['如何掉眼淚', '鄭秀文'],
    ['樹木真美', 'Serrini'],
    ['時光機', '小肥'],
    ['綻放', '劉浩龍'],
    ['刀槍不入', '盧巧音'],
    ['遠征', 'Dear Jane'],
    ['非愛不可', '關淑怡'],
    ['冷雨夜', 'Beyond'],
    ['記憶棉', 'MC']
  ])
});

function renderSongList(targetId, songs) {
  const target = document.getElementById(targetId);
  const fragment = document.createDocumentFragment();
  songs.forEach(([title, artist], index) => {
    const row = document.createElement('div');
    row.className = 'song-row';
    const number = document.createElement('span');
    number.textContent = String(index + 1).padStart(2, '0');
    const copy = document.createElement('div');
    const song = document.createElement('strong');
    song.textContent = title;
    const singer = document.createElement('small');
    singer.textContent = artist;
    copy.append(song, singer);
    row.append(number, copy);
    fragment.append(row);
  });
  target.replaceChildren(fragment);
}

renderSongList('delicate-list', qualifyingSongs.delicate);
renderSongList('power-list', qualifyingSongs.power);
