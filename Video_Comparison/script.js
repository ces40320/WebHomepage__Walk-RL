/*
 * JavaScript for the WalkRL video comparison viewer.
 *
 * This script loads the video metadata from videos.json, populates
 * the gallery and dropdowns, and handles loading and synchronising
 * YouTube players via the IFrame API. It avoids any build tools
 * and works directly in the browser on GitHub Pages.
 */

// A fallback set of video definitions embedded directly into the script. When the
// page is served from a web server (e.g. GitHub Pages) the JSON file is
// fetched instead. Embedding this data ensures that the page still works
// when opened locally via the file:// protocol, which may block fetch() for
// security reasons.
const embeddedVideos = [
  {
    title: 'Independent muscle‑controlled 1.2 m/s walking – Sagittal view',
    policy: 'Independent',
    terrain: 'Level Ground',
    speed: '1.2',
    view: 'Sagittal',
    youtube: 'https://www.youtube.com/embed/x-Qeo1EMjSA'
  },
  {
    title: 'Independent muscle‑controlled 1.2 m/s walking – Frontal view',
    policy: 'Independent',
    terrain: 'Level Ground',
    speed: '1.2',
    view: 'Frontal',
    youtube: 'https://www.youtube.com/embed/XYzgVLA2ezk'
  },
  {
    title: 'Synergy‑prior muscle‑controlled 1.2 m/s walking – Sagittal view',
    policy: 'Synergy Prior',
    terrain: 'Level Ground',
    speed: '1.2',
    view: 'Sagittal',
    youtube: 'https://www.youtube.com/embed/1RhNvJd6Pu4'
  },
  {
    title: 'Synergy‑prior muscle‑controlled 1.2 m/s walking – Frontal view',
    policy: 'Synergy Prior',
    terrain: 'Level Ground',
    speed: '1.2',
    view: 'Frontal',
    youtube: 'https://www.youtube.com/embed/8pQ_uYdxZxo'
  },
  {
    title: 'Independent muscle‑controlled 0.7 m/s walking – Sagittal view',
    policy: 'Independent',
    terrain: 'Level Ground',
    speed: '0.7',
    view: 'Sagittal',
    youtube: 'https://www.youtube.com/embed/dummy1'
  },
  {
    title: 'Synergy‑prior muscle‑controlled 0.7 m/s walking – Sagittal view',
    policy: 'Synergy Prior',
    terrain: 'Level Ground',
    speed: '0.7',
    view: 'Sagittal',
    youtube: 'https://www.youtube.com/embed/dummy2'
  }
];

let videoData = [];
let playerLeftApi = null;
let playerRightApi = null;
let youtubeApiReady = false;

// Extract the YouTube ID from an embed URL (e.g. https://www.youtube.com/embed/<id>)
function getYouTubeId(url) {
  const parts = url.split('/');
  return parts[parts.length - 1];
}

// Called by the YouTube iframe API when ready
function onYouTubeIframeAPIReady() {
  youtubeApiReady = true;
}

// Show gallery section and hide comparison
function showGallery() {
  document.getElementById('gallerySection').style.display = 'block';
  document.getElementById('compareSection').style.display = 'none';
}

// Show comparison section and hide gallery
function showCompare() {
  document.getElementById('gallerySection').style.display = 'none';
  document.getElementById('compareSection').style.display = 'block';
}

// Populate dropdown selects for comparison
function populateSelects() {
  const leftSelect = document.getElementById('selectLeft');
  const rightSelect = document.getElementById('selectRight');
  videoData.forEach((video, idx) => {
    const optionLeft = document.createElement('option');
    optionLeft.value = idx;
    optionLeft.textContent = video.title;
    leftSelect.appendChild(optionLeft);
    const optionRight = optionLeft.cloneNode(true);
    rightSelect.appendChild(optionRight);
  });
}

// Populate gallery grid
function populateGrid() {
  const grid = document.getElementById('videoGrid');
  grid.innerHTML = '';
  videoData.forEach((video, idx) => {
    const card = document.createElement('div');
    card.className = 'card';
    // thumbnail
    const thumb = document.createElement('div');
    thumb.className = 'thumb';
    const vid = getYouTubeId(video.youtube);
    thumb.style.backgroundImage = `url(https://img.youtube.com/vi/${vid}/0.jpg)`;
    card.appendChild(thumb);
    // info container
    const info = document.createElement('div');
    info.className = 'info';
    const title = document.createElement('h3');
    title.textContent = video.title;
    info.appendChild(title);
    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.textContent = `${video.policy} • ${video.terrain} • ${video.speed} m/s • ${video.view}`;
    info.appendChild(meta);
    const actions = document.createElement('div');
    actions.className = 'actions';
    const btnLeft = document.createElement('button');
    btnLeft.className = 'button primary';
    btnLeft.textContent = 'Left';
    btnLeft.addEventListener('click', () => {
      document.getElementById('selectLeft').value = idx;
      showCompare();
      loadPlayers();
    });
    const btnRight = document.createElement('button');
    btnRight.className = 'button primary';
    btnRight.textContent = 'Right';
    btnRight.addEventListener('click', () => {
      document.getElementById('selectRight').value = idx;
      showCompare();
      loadPlayers();
    });
    actions.appendChild(btnLeft);
    actions.appendChild(btnRight);
    info.appendChild(actions);
    card.appendChild(info);
    grid.appendChild(card);
  });
}

// Create or update YouTube players with selected videos
function loadPlayers() {
  const leftIdx = parseInt(document.getElementById('selectLeft').value, 10);
  const rightIdx = parseInt(document.getElementById('selectRight').value, 10);
  const leftVideoId = getYouTubeId(videoData[leftIdx].youtube);
  const rightVideoId = getYouTubeId(videoData[rightIdx].youtube);
  // Ensure API is ready
  if (!youtubeApiReady) {
    console.warn('YouTube API not ready yet');
    return;
  }
  // Left player
  if (playerLeftApi) {
    playerLeftApi.loadVideoById({ videoId: leftVideoId, startSeconds: 0 });
  } else {
    playerLeftApi = new YT.Player('playerLeft', {
      videoId: leftVideoId,
      playerVars: { origin: window.location.origin, rel: 0 },
    });
  }
  // Right player
  if (playerRightApi) {
    playerRightApi.loadVideoById({ videoId: rightVideoId, startSeconds: 0 });
  } else {
    playerRightApi = new YT.Player('playerRight', {
      videoId: rightVideoId,
      playerVars: { origin: window.location.origin, rel: 0 },
    });
  }
}

// Synchronise playback of the two videos
function syncPlay() {
  if (!playerLeftApi || !playerRightApi) return;
  // Jump both players to the start
  playerLeftApi.seekTo(0, true);
  playerRightApi.seekTo(0, true);
  // Allow a short buffer period before playing
  setTimeout(() => {
    playerLeftApi.playVideo();
    playerRightApi.playVideo();
  }, 600);
}

// Fetch video metadata and initialise page
async function init() {
  // Attempt to load the external JSON when running on a server. If the fetch
  // fails (e.g. due to file:// restrictions) fall back to the embedded data.
  try {
    const res = await fetch('videos.json');
    if (!res.ok) throw new Error('Failed to fetch videos.json');
    videoData = await res.json();
  } catch (err) {
    console.warn('Using embedded video definitions. Reason:', err);
    videoData = embeddedVideos;
  }
  populateSelects();
  populateGrid();
  // Bind nav buttons
  document.getElementById('toggleGallery').addEventListener('click', showGallery);
  document.getElementById('toggleCompare').addEventListener('click', showCompare);
  document.getElementById('loadPlayers').addEventListener('click', loadPlayers);
  document.getElementById('syncPlay').addEventListener('click', syncPlay);
  // Initially show gallery
  showGallery();
}

// Wait for DOM to load before initialising
document.addEventListener('DOMContentLoaded', init);