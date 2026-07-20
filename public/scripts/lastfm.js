// lastfm.js - fetches recent tracks from the Last.fm API and renders them
// using the site's own markup/classes instead of a third-party embed image.
document.addEventListener('DOMContentLoaded', async () => {
  const root = document.getElementById('lastfm-reader');
  if (!root) return;

  const user = root.dataset.user;
  const apiKey = root.dataset.apiKey;

  if (!apiKey) {
    root.textContent = 'Last.fm API key not set.';
    return;
  }

  const url = `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${encodeURIComponent(user)}&api_key=${encodeURIComponent(apiKey)}&format=json&limit=6`;

  function buildTrackRow(track) {
    const row = document.createElement('div');
    row.className = 'lastfm-track-row';

    const artUrl = track.image?.find((img) => img.size === 'medium')?.['#text'];
    if (artUrl) {
      const art = document.createElement('img');
      art.className = 'lastfm-track-art';
      art.src = artUrl;
      art.alt = '';
      row.appendChild(art);
    }

    const info = document.createElement('div');
    info.className = 'lastfm-track-info';

    const title = document.createElement('a');
    title.className = 'lastfm-track-title';
    title.href = track.url;
    title.target = '_blank';
    title.rel = 'noopener noreferrer';
    title.textContent = track.name;

    const artist = document.createElement('span');
    artist.className = 'lastfm-track-artist';
    artist.textContent = ` — ${track.artist['#text']}`;

    info.append(title, artist);
    row.appendChild(info);
    return row;
  }

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Last.fm API error: ${res.status}`);
    const data = await res.json();
    const tracks = data?.recenttracks?.track ?? [];

    if (!tracks.length) {
      root.textContent = 'No recent tracks found.';
      return;
    }

    const nowPlayingTrack = tracks[0]?.['@attr']?.nowplaying === 'true' ? tracks[0] : null;
    const recentTracks = nowPlayingTrack ? tracks.slice(1) : tracks;

    const fragment = document.createDocumentFragment();

    if (nowPlayingTrack) {
      const box = document.createElement('div');
      box.className = 'lastfm-now-playing-box';

      const label = document.createElement('span');
      label.className = 'tag lastfm-now-playing';
      label.textContent = 'now playing';

      box.append(label, buildTrackRow(nowPlayingTrack));
      fragment.appendChild(box);
    }

    if (recentTracks.length) {
      const list = document.createElement('ul');
      list.className = 'lastfm-track-list';

      recentTracks.forEach((track) => {
        const item = document.createElement('li');
        item.className = 'lastfm-track';
        item.appendChild(buildTrackRow(track));
        list.appendChild(item);
      });

      fragment.appendChild(list);
    }

    root.replaceChildren(fragment);
  } catch (err) {
    root.textContent = 'Could not load Last.fm data.';
  }
});
