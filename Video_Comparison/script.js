/*
 * WalkRL Video Comparison viewer (plain JS, no build step).
 *
 * This file ports the intended UI/logic from `walkrl_videoweb_results_page.jsx`:
 * - Compare panel with Load Players / Sync Play / Pause
 * - Filters (policy / terrain / view) in the gallery
 * - Load Left/Right from gallery cards
 * - Synchronized playback via postMessage to YouTube iframes (enablejsapi=1)
 */

const SYNC_START_TIME = 0;
const BUFFER_DELAY_MS = 700;

// Fallback set (used only when fetch('videos.json') is blocked).
const embeddedVideos = [
  {
    title: "Independent muscle‑controlled walking – Learning env. – Around view",
    policy: "Independent",
    terrain: "Uneven Terrain",
    speed: "1.2",
    view: "Around",
    youtube: "https://www.youtube.com/embed/XYzgVLA2ezk",
  },
  {
    title: "Independent muscle‑controlled 0.7 m/s walking – Sagittal view",
    policy: "Independent",
    terrain: "Level Ground",
    speed: "0.7",
    view: "Sagittal",
    youtube: "https://www.youtube.com/embed/sfHHjqCAYQE",
  },
  {
    title: "Independent muscle‑controlled 0.7 m/s walking – Frontal view",
    policy: "Independent",
    terrain: "Level Ground",
    speed: "0.7",
    view: "Frontal",
    youtube: "https://www.youtube.com/embed/3HUabo3GDXM",
  },
  {
    title: "Independent muscle‑controlled 1.2 m/s walking – Sagittal view",
    policy: "Independent",
    terrain: "Level Ground",
    speed: "1.2",
    view: "Sagittal",
    youtube: "https://www.youtube.com/embed/x-Qeo1EMjSA",
  },
  {
    title: "Independent muscle‑controlled 1.2 m/s walking – Frontal view",
    policy: "Independent",
    terrain: "Level Ground",
    speed: "1.2",
    view: "Frontal",
    youtube: "https://www.youtube.com/embed/nJBgkvjS_rc",
  },
  {
    title: "Independent muscle‑controlled 1.8 m/s walking – Sagittal view",
    policy: "Independent",
    terrain: "Level Ground",
    speed: "1.8",
    view: "Sagittal",
    youtube: "https://www.youtube.com/embed/1B8lW37ZXRQ",
  },
  {
    title: "Independent muscle‑controlled 1.8 m/s walking – Frontal view",
    policy: "Independent",
    terrain: "Level Ground",
    speed: "1.8",
    view: "Frontal",
    youtube: "https://www.youtube.com/embed/5oNz30AzLzM",
  },
  {
    title: "Independent muscle‑controlled downhill 1.2 m/s walking (−5°) – Sagittal view",
    policy: "Independent",
    terrain: "Downhill",
    speed: "1.2",
    view: "Sagittal",
    youtube: "https://www.youtube.com/embed/sKAf_UQ-O6Y",
  },
  {
    title: "Independent muscle‑controlled uphill 1.2 m/s walking (+5°) – Sagittal view",
    policy: "Independent",
    terrain: "Uphill",
    speed: "1.2",
    view: "Sagittal",
    youtube: "https://www.youtube.com/embed/kjXYdIAXUE8",
  },
  {
    title: "Synergistic muscle‑controlled walking – Learning env. – Around view",
    policy: "Synergistic",
    terrain: "Uneven Terrain",
    speed: "1.2",
    view: "Around",
    youtube: "https://www.youtube.com/embed/diMExi0Iq4E",
  },
  {
    title: "Synergistic muscle‑controlled 0.7 m/s walking – Sagittal view",
    policy: "Synergistic",
    terrain: "Level Ground",
    speed: "0.7",
    view: "Sagittal",
    youtube: "https://www.youtube.com/embed/sumCu4m6I2Y",
  },
  {
    title: "Synergistic muscle‑controlled 0.7 m/s walking – Frontal view",
    policy: "Synergistic",
    terrain: "Level Ground",
    speed: "0.7",
    view: "Frontal",
    youtube: "https://www.youtube.com/embed/iHISbEFn5TA",
  },
  {
    title: "Synergistic muscle‑controlled 1.2 m/s walking – Sagittal view",
    policy: "Synergistic",
    terrain: "Level Ground",
    speed: "1.2",
    view: "Sagittal",
    youtube: "https://www.youtube.com/embed/hiaXLBP70Vk",
  },
  {
    title: "Synergistic muscle‑controlled 1.2 m/s walking – Frontal view",
    policy: "Synergistic",
    terrain: "Level Ground",
    speed: "1.2",
    view: "Frontal",
    youtube: "https://www.youtube.com/embed/XvFmis5tfKM",
  },
  {
    title: "Synergistic muscle‑controlled 1.8 m/s walking – Sagittal view",
    policy: "Synergistic",
    terrain: "Level Ground",
    speed: "1.8",
    view: "Sagittal",
    youtube: "https://www.youtube.com/embed/EReJWTIqd8U",
  },
  {
    title: "Synergistic muscle‑controlled 1.8 m/s walking – Frontal view",
    policy: "Synergistic",
    terrain: "Level Ground",
    speed: "1.8",
    view: "Frontal",
    youtube: "https://www.youtube.com/embed/joBIzwvfcSQ",
  },
  {
    title: "Synergistic muscle‑controlled downhill 1.2 m/s walking (−5°) – Sagittal view",
    policy: "Synergistic",
    terrain: "Downhill",
    speed: "1.2",
    view: "Sagittal",
    youtube: "https://www.youtube.com/embed/FEhnDq93reM",
  },
  {
    title: "Synergistic muscle‑controlled uphill 1.2 m/s walking (+5°) – Sagittal view",
    policy: "Synergistic",
    terrain: "Uphill",
    speed: "1.2",
    view: "Sagittal",
    youtube: "https://www.youtube.com/embed/TlbLoZhOS3s",
  },
];

let videoData = [];
let playersLoaded = false;
let playersReadyCount = 0;
let playersReadyFallbackTimer = null;

let policyFilter = "All";
let terrainFilter = "All";
let viewFilter = "All";

let videoAId = null;
let videoBId = null;

// Extract the YouTube video id from an embed/watch URL.
function getYouTubeId(url) {
  if (!url) return "";
  const u = url.trim();

  const embedMatch = u.match(/\/embed\/([^?&/]+)/);
  if (embedMatch?.[1]) return embedMatch[1];

  const watchMatch = u.match(/[?&]v=([^?&/]+)/);
  if (watchMatch?.[1]) return watchMatch[1];

  return u.split("/").pop();
}

function buildEmbedUrl(id, enableJsApi = true) {
  const params = new URLSearchParams({
    rel: "0",
    modestbranding: "1",
    playsinline: "1",
  });
  if (enableJsApi) params.set("enablejsapi", "1");
  // Keep this aligned with the intended JSX logic: origin is appended at the
  // call-site. (Encoding and adding origin when it's "null" can trigger
  // YouTube player error 153.)
  return `https://www.youtube-nocookie.com/embed/${id}?${params.toString()}`;
}

function buildThumbUrl(id) {
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
}

function getVideoById(id) {
  return videoData.find((v) => getYouTubeId(v.youtube) === id) ?? null;
}

function getFilteredVideos() {
  return videoData.filter((v) => {
    const p = policyFilter === "All" || v.policy === policyFilter;
    const t = terrainFilter === "All" || v.terrain === terrainFilter;
    const vw = viewFilter === "All" || v.view === viewFilter;
    return p && t && vw;
  });
}

function setButtonsEnabled({ syncEnabled, pauseEnabled }) {
  const syncBtn = document.getElementById("syncPlay");
  const pauseBtn = document.getElementById("pauseBoth");
  if (syncBtn) syncBtn.disabled = !syncEnabled;
  if (pauseBtn) pauseBtn.disabled = !pauseEnabled;
}

function setPlayersLoadedState(loaded) {
  playersLoaded = loaded;

  const leftSlot = document.getElementById("playerLeftSlot");
  const rightSlot = document.getElementById("playerRightSlot");
  const iframeLeft = document.getElementById("playerLeft");
  const iframeRight = document.getElementById("playerRight");

  if (loaded) {
    if (leftSlot) leftSlot.classList.add("loaded");
    if (rightSlot) rightSlot.classList.add("loaded");
    setButtonsEnabled({ syncEnabled: false, pauseEnabled: false });
  } else {
    if (leftSlot) leftSlot.classList.remove("loaded");
    if (rightSlot) rightSlot.classList.remove("loaded");
    if (iframeLeft) iframeLeft.src = "";
    if (iframeRight) iframeRight.src = "";
    setButtonsEnabled({ syncEnabled: false, pauseEnabled: false });
  }
}

function renderPlayerThumbnails() {
  const leftThumb = document.getElementById("playerLeftThumb");
  const rightThumb = document.getElementById("playerRightThumb");

  const vA = videoAId ? getVideoById(videoAId) : null;
  const vB = videoBId ? getVideoById(videoBId) : null;

  if (leftThumb) {
    const id = vA ? getYouTubeId(vA.youtube) : "";
    leftThumb.style.backgroundImage = id ? `url(${buildThumbUrl(id)})` : "none";
  }

  if (rightThumb) {
    const id = vB ? getYouTubeId(vB.youtube) : "";
    rightThumb.style.backgroundImage = id ? `url(${buildThumbUrl(id)})` : "none";
  }
}

function updatePlayerSrcs() {
  const iframeLeft = document.getElementById("playerLeft");
  const iframeRight = document.getElementById("playerRight");

  if (!iframeLeft || !iframeRight) return;
  if (!videoAId || !videoBId) return;

  // Reset ready tracking.
  playersReadyCount = 0;
  if (playersReadyFallbackTimer) clearTimeout(playersReadyFallbackTimer);

  const onIframeLoaded = () => {
    playersReadyCount += 1;
    if (playersReadyCount >= 2) {
      setButtonsEnabled({ syncEnabled: true, pauseEnabled: true });
    }
  };

  playersReadyFallbackTimer = setTimeout(() => {
    // If load events don't fire reliably, still allow controls after a short delay.
    setButtonsEnabled({ syncEnabled: true, pauseEnabled: true });
  }, 1500);

  iframeLeft.onload = onIframeLoaded;
  iframeRight.onload = onIframeLoaded;

  const origin = window.location.origin;
  const originParam = origin && origin !== "null" ? `&origin=${origin}` : "";

  const warnEl = document.getElementById("originWarning");

  console.log("[WalkRL] Loading players", {
    videoAId,
    videoBId,
    origin,
    originParam,
  });

  const originValid = Boolean(originParam);
  if (!originValid) {
    // When opened from file:// or an environment where origin is null,
    // YouTube may reject JS API configuration (error 153).
    // Fallback to normal embed so at least playback works.
    if (warnEl) {
      warnEl.hidden = false;
      warnEl.textContent =
        "Sync Play requires YouTube JS API. Please open this page from http(s) (not file://) to avoid YouTube error 153.";
    }
    setButtonsEnabled({ syncEnabled: false, pauseEnabled: false });
    console.warn("[WalkRL] origin invalid; disabling JS API (no sync).", { origin });
    iframeLeft.src = buildEmbedUrl(videoAId, false);
    iframeRight.src = buildEmbedUrl(videoBId, false);
    return;
  }

  if (warnEl) warnEl.hidden = true;

  iframeLeft.src = `${buildEmbedUrl(videoAId, true)}${originParam}`;
  iframeRight.src = `${buildEmbedUrl(videoBId, true)}${originParam}`;
}

function sendYTCommand(iframe, func, args = []) {
  if (!iframe?.contentWindow) return;
  iframe.contentWindow.postMessage(
    JSON.stringify({
      event: "command",
      func,
      args,
    }),
    "*"
  );
}

function syncPlay() {
  if (!playersLoaded) return;
  const iframeLeft = document.getElementById("playerLeft");
  const iframeRight = document.getElementById("playerRight");
  if (!iframeLeft || !iframeRight) return;

  sendYTCommand(iframeLeft, "seekTo", [SYNC_START_TIME, true]);
  sendYTCommand(iframeRight, "seekTo", [SYNC_START_TIME, true]);

  setTimeout(() => {
    sendYTCommand(iframeLeft, "playVideo");
    sendYTCommand(iframeRight, "playVideo");
  }, BUFFER_DELAY_MS);
}

function pauseBoth() {
  if (!playersLoaded) return;
  const iframeLeft = document.getElementById("playerLeft");
  const iframeRight = document.getElementById("playerRight");
  if (!iframeLeft || !iframeRight) return;

  sendYTCommand(iframeLeft, "pauseVideo");
  sendYTCommand(iframeRight, "pauseVideo");
}

function buildSelectOptions(selectEl, values) {
  selectEl.innerHTML = "";
  values.forEach((val) => {
    const opt = document.createElement("option");
    opt.value = val;
    opt.textContent = val;
    selectEl.appendChild(opt);
  });
}

function populatePolicyTerrainViewFilters() {
  const policySelect = document.getElementById("filterPolicy");
  const terrainSelect = document.getElementById("filterTerrain");
  const viewSelect = document.getElementById("filterView");

  const policies = Array.from(new Set(videoData.map((v) => v.policy))).sort();
  const terrains = Array.from(new Set(videoData.map((v) => v.terrain))).sort();
  const views = Array.from(new Set(videoData.map((v) => v.view))).sort();

  buildSelectOptions(policySelect, ["All", ...policies]);
  buildSelectOptions(terrainSelect, ["All", ...terrains]);
  buildSelectOptions(viewSelect, ["All", ...views]);

  policySelect.value = policyFilter;
  terrainSelect.value = terrainFilter;
  viewSelect.value = viewFilter;
}

function populateCompareSelects() {
  const selectA = document.getElementById("selectVideoA");
  const selectB = document.getElementById("selectVideoB");
  if (!selectA || !selectB) return;

  selectA.innerHTML = "";
  selectB.innerHTML = "";

  videoData.forEach((v) => {
    const id = getYouTubeId(v.youtube);
    const optA = document.createElement("option");
    optA.value = id;
    optA.textContent = v.title;
    selectA.appendChild(optA);

    const optB = optA.cloneNode(true);
    selectB.appendChild(optB);
  });

  if (videoAId) selectA.value = videoAId;
  if (videoBId) selectB.value = videoBId;
}

function renderGrid() {
  const grid = document.getElementById("videoGrid");
  if (!grid) return;

  const filteredVideos = getFilteredVideos();
  grid.innerHTML = "";

  filteredVideos.forEach((video) => {
    const id = getYouTubeId(video.youtube);

    const card = document.createElement("div");
    card.className = "card";

    const thumb = document.createElement("div");
    thumb.className = "thumb";
    thumb.style.backgroundImage = `url(${buildThumbUrl(id)})`;
    card.appendChild(thumb);

    const info = document.createElement("div");
    info.className = "info";

    const title = document.createElement("h3");
    title.textContent = video.title;
    info.appendChild(title);

    const meta = document.createElement("div");
    meta.className = "meta";
    meta.textContent = `${video.policy} • ${video.terrain} • ${video.speed} m/s • ${video.view}`;
    info.appendChild(meta);

    const actions = document.createElement("div");
    actions.className = "actions";

    const btnLeft = document.createElement("button");
    btnLeft.className = "button primary";
    btnLeft.textContent = "Load Left";
    btnLeft.addEventListener("click", () => {
      loadIntoCompare(id, "A");
    });

    const btnRight = document.createElement("button");
    btnRight.className = "button";
    btnRight.textContent = "Load Right";
    btnRight.addEventListener("click", () => {
      loadIntoCompare(id, "B");
    });

    const ytLink = document.createElement("a");
    ytLink.href = `https://www.youtube.com/watch?v=${id}`;
    ytLink.target = "_blank";
    ytLink.rel = "noreferrer";
    ytLink.textContent = "YouTube";

    actions.appendChild(btnLeft);
    actions.appendChild(btnRight);
    actions.appendChild(ytLink);
    info.appendChild(actions);

    card.appendChild(info);
    grid.appendChild(card);
  });
}

function loadIntoCompare(id, slot) {
  if (slot === "A") videoAId = id;
  else videoBId = id;

  const selectA = document.getElementById("selectVideoA");
  const selectB = document.getElementById("selectVideoB");
  if (slot === "A" && selectA) selectA.value = id;
  if (slot === "B" && selectB) selectB.value = id;

  // Follow React behavior: switching videos resets playersLoaded.
  if (playersLoaded) setPlayersLoadedState(false);
  renderPlayerThumbnails();

  // Keep the user anchored at the compare panel.
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function init() {
  const iframeLeft = document.getElementById("playerLeft");
  const iframeRight = document.getElementById("playerRight");
  const loadPlayersBtn = document.getElementById("loadPlayers");
  const syncBtn = document.getElementById("syncPlay");
  const pauseBtn = document.getElementById("pauseBoth");

  // Initial hard-disable to match UI behavior.
  setButtonsEnabled({ syncEnabled: false, pauseEnabled: false });

  // Fetch video metadata.
  try {
    const res = await fetch("videos.json");
    if (!res.ok) throw new Error("Failed to fetch videos.json");
    videoData = await res.json();
  } catch (err) {
    console.warn("Using embedded video definitions. Reason:", err);
    videoData = embeddedVideos;
  }

  if (!videoData.length) {
    console.error("No video data available.");
    return;
  }

  // Defaults (porting the JSX intent: A = first, B = 4th).
  videoAId = getYouTubeId(videoData[0]?.youtube);
  videoBId = getYouTubeId(videoData[3]?.youtube) || getYouTubeId(videoData[1]?.youtube);

  populateCompareSelects();
  populatePolicyTerrainViewFilters();

  renderPlayerThumbnails();
  renderGrid();
  setPlayersLoadedState(false);

  // Bind compare controls.
  if (loadPlayersBtn) {
    loadPlayersBtn.addEventListener("click", () => {
      if (!videoAId || !videoBId) return;
      setPlayersLoadedState(true);
      renderPlayerThumbnails(); // keep thumbs updated behind iframe for quick glance
      updatePlayerSrcs();
    });
  }
  if (syncBtn) syncBtn.addEventListener("click", syncPlay);
  if (pauseBtn) pauseBtn.addEventListener("click", pauseBoth);

  // Bind select controls (dropdowns).
  const selectA = document.getElementById("selectVideoA");
  const selectB = document.getElementById("selectVideoB");
  if (selectA) {
    selectA.addEventListener("change", (e) => {
      videoAId = e.target.value;
      renderPlayerThumbnails();
      if (playersLoaded) updatePlayerSrcs();
    });
  }
  if (selectB) {
    selectB.addEventListener("change", (e) => {
      videoBId = e.target.value;
      renderPlayerThumbnails();
      if (playersLoaded) updatePlayerSrcs();
    });
  }

  // Bind filter controls.
  const policySelect = document.getElementById("filterPolicy");
  const terrainSelect = document.getElementById("filterTerrain");
  const viewSelect = document.getElementById("filterView");

  if (policySelect) {
    policySelect.addEventListener("change", (e) => {
      policyFilter = e.target.value;
      renderGrid();
    });
  }
  if (terrainSelect) {
    terrainSelect.addEventListener("change", (e) => {
      terrainFilter = e.target.value;
      renderGrid();
    });
  }
  if (viewSelect) {
    viewSelect.addEventListener("change", (e) => {
      viewFilter = e.target.value;
      renderGrid();
    });
  }

  // Ensure iframe tags start without src.
  if (iframeLeft) iframeLeft.src = "";
  if (iframeRight) iframeRight.src = "";
}

document.addEventListener("DOMContentLoaded", init);