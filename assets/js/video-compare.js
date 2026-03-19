/*
 * Root page video compare controller.
 * Uses Video_Comparison/videos.json when available.
 */

const SYNC_START_TIME = 0;
const BUFFER_DELAY_MS = 700;

const embeddedVideos = [
    {
        title: "Independent muscle-controlled walking - Learning env. - Around view",
        youtube: "https://www.youtube.com/embed/XYzgVLA2ezk",
        policy: "Independent",
        terrain: "Uneven Terrain",
        speed: "1.2",
        view: "Around"
    },
    {
        title: "Independent muscle-controlled 1.2 m/s walking - Sagittal view",
        youtube: "https://www.youtube.com/embed/x-Qeo1EMjSA",
        policy: "Independent",
        terrain: "Level Ground",
        speed: "1.2",
        view: "Sagittal"
    },
    {
        title: "Independent muscle-controlled 1.2 m/s walking - Frontal view",
        youtube: "https://www.youtube.com/embed/nJBgkvjS_rc",
        policy: "Independent",
        terrain: "Level Ground",
        speed: "1.2",
        view: "Frontal"
    },
    {
        title: "Synergistic muscle-controlled walking - Learning env. - Around view",
        youtube: "https://www.youtube.com/embed/diMExi0Iq4E",
        policy: "Synergistic",
        terrain: "Uneven Terrain",
        speed: "1.2",
        view: "Around"
    },
    {
        title: "Synergistic muscle-controlled 1.2 m/s walking - Sagittal view",
        youtube: "https://www.youtube.com/embed/hiaXLBP70Vk",
        policy: "Synergistic",
        terrain: "Level Ground",
        speed: "1.2",
        view: "Sagittal"
    },
    {
        title: "Synergistic muscle-controlled 1.2 m/s walking - Frontal view",
        youtube: "https://www.youtube.com/embed/XvFmis5tfKM",
        policy: "Synergistic",
        terrain: "Level Ground",
        speed: "1.2",
        view: "Frontal"
    }
];

let videoData = [];
let videoAId = "";
let videoBId = "";
let playersLoaded = false;

let filterStateA = { policy: "All", terrain: "All", view: "All" };
let filterStateB = { policy: "All", terrain: "All", view: "All" };

function getYouTubeId(url) {
    if (!url) return "";
    const value = url.trim();

    const embedMatch = value.match(/\/embed\/([^?&/]+)/);
    if (embedMatch && embedMatch[1]) return embedMatch[1];

    const watchMatch = value.match(/[?&]v=([^?&/]+)/);
    if (watchMatch && watchMatch[1]) return watchMatch[1];

    const shortsMatch = value.match(/\/shorts\/([^?&/]+)/);
    if (shortsMatch && shortsMatch[1]) return shortsMatch[1];

    const tail = value.split("/").pop();
    return tail ? tail.split("?")[0] : "";
}

function buildEmbedUrl(id, enableJsApi) {
    const params = new URLSearchParams({
        rel: "0",
        modestbranding: "1",
        playsinline: "1"
    });
    if (enableJsApi) params.set("enablejsapi", "1");
    return "https://www.youtube-nocookie.com/embed/" + id + "?" + params.toString();
}

function buildThumbUrl(id) {
    return "https://img.youtube.com/vi/" + id + "/hqdefault.jpg";
}

function sendYTCommand(iframe, func, args) {
    if (!iframe || !iframe.contentWindow) return;
    iframe.contentWindow.postMessage(
        JSON.stringify({
            event: "command",
            func: func,
            args: args || []
        }),
        "*"
    );
}

function setButtonsEnabled(syncEnabled, pauseEnabled) {
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
    } else {
        if (leftSlot) leftSlot.classList.remove("loaded");
        if (rightSlot) rightSlot.classList.remove("loaded");
        if (iframeLeft) iframeLeft.src = "";
        if (iframeRight) iframeRight.src = "";
        setButtonsEnabled(false, false);
    }
}

function renderPlayerThumbnails() {
    const leftThumb = document.getElementById("playerLeftThumb");
    const rightThumb = document.getElementById("playerRightThumb");
    if (leftThumb) leftThumb.style.backgroundImage = videoAId ? "url(" + buildThumbUrl(videoAId) + ")" : "none";
    if (rightThumb) rightThumb.style.backgroundImage = videoBId ? "url(" + buildThumbUrl(videoBId) + ")" : "none";
}

function getFilterState(side) {
    return side === "A" ? filterStateA : filterStateB;
}

function getFilteredVideos(filterState) {
    return videoData.filter((v) => {
        const p = filterState.policy === "All" || v.policy === filterState.policy;
        const t = (() => {
            if (filterState.terrain === "All") return true;

            // Split Level Ground by speed.
            // Example option value: "Level Ground (0.7m/s)"
            const match = String(filterState.terrain).match(/^Level Ground \(([^)]+)m\/s\)$/);
            if (match) {
                const speed = normalizeSpeed(match[1]);
                return v.terrain === "Level Ground" && normalizeSpeed(v.speed) === speed;
            }

            // Back-compat: allow plain "Level Ground"
            if (filterState.terrain === "Level Ground") return v.terrain === "Level Ground";

            return v.terrain === filterState.terrain;
        })();
        const vw = filterState.view === "All" || v.view === filterState.view;
        return p && t && vw;
    });
}

function normalizeSpeed(val) {
    const n = parseFloat(val);
    if (Number.isNaN(n)) return String(val || "");
    return String(n);
}

function buildSelectOptions(selectEl, values) {
    if (!selectEl) return;
    selectEl.innerHTML = "";
    values.forEach((val) => {
        const opt = document.createElement("option");
        opt.value = val;
        opt.textContent = val;
        selectEl.appendChild(opt);
    });
}

function populateFilterSelectsFor(side) {
    const suffix = side === "A" ? "A" : "B";
    const policySelect = document.getElementById("filterPolicy" + suffix);
    const terrainSelect = document.getElementById("filterTerrain" + suffix);
    const viewSelect = document.getElementById("filterView" + suffix);
    if (!policySelect || !terrainSelect || !viewSelect) return;

    const states = getFilterState(side);

    const policies = Array.from(new Set(videoData.map((v) => v.policy))).filter(Boolean).sort();

    const groundSpeeds = Array.from(
        new Set(
            videoData
                .filter((v) => v.terrain === "Level Ground" && v.speed !== undefined && v.speed !== null)
                .map((v) => normalizeSpeed(v.speed))
        )
    )
        .filter(Boolean)
        .sort((a, b) => parseFloat(a) - parseFloat(b));

    const otherTerrains = Array.from(
        new Set(videoData.map((v) => v.terrain))
    ).filter(Boolean).filter((t) => t !== "Level Ground");

    // Keep requested ordering: Level Ground speeds first, then the rest.
    const orderedOtherTerrains = ["Downhill", "Uphill", "Uneven Terrain"].filter((t) => otherTerrains.includes(t));
    const remainingOther = otherTerrains.filter((t) => !orderedOtherTerrains.includes(t)).sort();

    const terrainOptions = [
        "All",
        ...groundSpeeds.map((s) => "Level Ground (" + s + "m/s)"),
        ...orderedOtherTerrains,
        ...remainingOther
    ];

    buildSelectOptions(policySelect, ["All", ...policies]);
    buildSelectOptions(terrainSelect, terrainOptions);

    policySelect.value = states.policy;
    terrainSelect.value = states.terrain;
    // View options are dependent on current policy+terrain; computed separately.
    populateViewSelectFor(side);
}

function populateViewSelectFor(side) {
    const suffix = side === "A" ? "A" : "B";
    const viewSelect = document.getElementById("filterView" + suffix);
    if (!viewSelect) return;

    const states = getFilterState(side);
    const tempState = { policy: states.policy, terrain: states.terrain, view: "All" };

    // Determine which views exist for the current policy+terrain.
    const filteredForViews = getFilteredVideos(tempState);
    const viewSet = new Set(filteredForViews.map((v) => v.view).filter((x) => Boolean(x)));

    // Keep requested order: Sagittal / Frontal / Around.
    const orderedViews = ["Sagittal", "Frontal", "Around"];
    const availableViews = orderedViews.filter((v) => viewSet.has(v));

    buildSelectOptions(viewSelect, ["All", ...availableViews]);

    const current = states.view;
    const isAll = current === "All";
    const isValidSpecific = !isAll && availableViews.includes(current);

    if (isValidSpecific) {
        viewSelect.value = current;
        return;
    }

    if (!isAll) {
        // Current specific view no longer exists under current policy+terrain.
        // Pick the first available view, or fall back to "All".
        states.view = availableViews[0] || "All";
    }

    viewSelect.value = states.view;
}

function populateCompareSelectsFor(side) {
    const selectEl = side === "A" ? document.getElementById("selectVideoA") : document.getElementById("selectVideoB");
    if (!selectEl) return;

    const filteredVideos = getFilteredVideos(getFilterState(side));
    selectEl.innerHTML = "";

    for (let i = 0; i < filteredVideos.length; i += 1) {
        const item = filteredVideos[i];
        const id = getYouTubeId(item.youtube);
        if (!id) continue;

        const option = document.createElement("option");
        option.value = id;
        option.textContent = item.title;
        selectEl.appendChild(option);
    }

    const availableIds = filteredVideos
        .map((v) => getYouTubeId(v.youtube))
        .filter((id) => Boolean(id));

    const currentId = side === "A" ? videoAId : videoBId;
    const newId = availableIds.includes(currentId) ? currentId : availableIds[0] || "";

    if (side === "A") videoAId = newId;
    else videoBId = newId;

    selectEl.value = newId;
    renderPlayerThumbnails();
}

function updatePlayerSrcs() {
    const iframeLeft = document.getElementById("playerLeft");
    const iframeRight = document.getElementById("playerRight");
    const warnEl = document.getElementById("originWarning");
    if (!iframeLeft || !iframeRight || !videoAId || !videoBId) return;

    const origin = window.location.origin;
    const protocol = window.location.protocol;
    // YouTube JS API (enablejsapi) + origin is sensitive to file:// and some browsers
    // may expose a non-"null" origin even on file URLs. Treat non-http(s) as invalid.
    const originParam =
        protocol === "http:" || protocol === "https:"
            ? origin && origin !== "null"
                ? "&origin=" + origin
                : ""
            : "";

    if (!originParam) {
        if (warnEl) {
            warnEl.hidden = false;
            warnEl.textContent = "Sync Play requires http(s). file:// 환경에서는 일반 재생만 가능합니다.";
        }
        setButtonsEnabled(false, false);
        iframeLeft.src = buildEmbedUrl(videoAId, false);
        iframeRight.src = buildEmbedUrl(videoBId, false);
        return;
    }

    if (warnEl) warnEl.hidden = true;

    let loadedCount = 0;
    const onLoaded = function () {
        loadedCount += 1;
        if (loadedCount >= 2) setButtonsEnabled(true, true);
    };
    iframeLeft.onload = onLoaded;
    iframeRight.onload = onLoaded;

    iframeLeft.src = buildEmbedUrl(videoAId, true) + originParam;
    iframeRight.src = buildEmbedUrl(videoBId, true) + originParam;
}

function syncPlay() {
    if (!playersLoaded) return;
    const iframeLeft = document.getElementById("playerLeft");
    const iframeRight = document.getElementById("playerRight");
    sendYTCommand(iframeLeft, "seekTo", [SYNC_START_TIME, true]);
    sendYTCommand(iframeRight, "seekTo", [SYNC_START_TIME, true]);
    setTimeout(function () {
        sendYTCommand(iframeLeft, "playVideo", []);
        sendYTCommand(iframeRight, "playVideo", []);
    }, BUFFER_DELAY_MS);
}

function pauseBoth() {
    if (!playersLoaded) return;
    const iframeLeft = document.getElementById("playerLeft");
    const iframeRight = document.getElementById("playerRight");
    sendYTCommand(iframeLeft, "pauseVideo", []);
    sendYTCommand(iframeRight, "pauseVideo", []);
}

async function loadVideoData() {
    try {
        const res = await fetch("Video_Comparison/videos.json");
        if (!res.ok) throw new Error("videos.json fetch failed");
        const data = await res.json();
        if (Array.isArray(data) && data.length) return data;
    } catch (err) {
        console.warn("Using embedded video fallback:", err);
    }
    return embeddedVideos;
}

async function initCompare() {
    const compareSection = document.getElementById("compareSection");
    if (!compareSection) return;

    setButtonsEnabled(false, false);
    videoData = await loadVideoData();
    if (!videoData.length) return;

    videoAId = getYouTubeId(videoData[0].youtube);
    videoBId = getYouTubeId((videoData[3] && videoData[3].youtube) || videoData[1].youtube);

    // Default filters:
    // A = Independent / Uneven Terrain / All
    // B = Synergistic / Uneven Terrain / All
    filterStateA = { policy: "Independent", terrain: "Uneven Terrain", view: "All" };
    filterStateB = { policy: "Synergistic", terrain: "Uneven Terrain", view: "All" };

    populateFilterSelectsFor("A");
    populateFilterSelectsFor("B");
    populateCompareSelectsFor("A");
    populateCompareSelectsFor("B");
    setPlayersLoadedState(false);

    const loadPlayersBtn = document.getElementById("loadPlayers");
    const syncBtn = document.getElementById("syncPlay");
    const pauseBtn = document.getElementById("pauseBoth");
    const selectA = document.getElementById("selectVideoA");
    const selectB = document.getElementById("selectVideoB");

    if (loadPlayersBtn) {
        loadPlayersBtn.addEventListener("click", function () {
            if (!videoAId || !videoBId) return;
            setPlayersLoadedState(true);
            updatePlayerSrcs();
        });
    }

    if (syncBtn) syncBtn.addEventListener("click", syncPlay);
    if (pauseBtn) pauseBtn.addEventListener("click", pauseBoth);

    if (selectA) {
        selectA.addEventListener("change", function (event) {
            videoAId = event.target.value;
            renderPlayerThumbnails();
            if (playersLoaded) updatePlayerSrcs();
        });
    }

    if (selectB) {
        selectB.addEventListener("change", function (event) {
            videoBId = event.target.value;
            renderPlayerThumbnails();
            if (playersLoaded) updatePlayerSrcs();
        });
    }

    // Filter (Left A)
    const policySelectA = document.getElementById("filterPolicyA");
    const terrainSelectA = document.getElementById("filterTerrainA");
    const viewSelectA = document.getElementById("filterViewA");

    if (policySelectA) {
        policySelectA.addEventListener("change", function (event) {
            filterStateA.policy = event.target.value;
            populateViewSelectFor("A");
            populateCompareSelectsFor("A");
            if (playersLoaded && videoAId && videoBId) updatePlayerSrcs();
        });
    }
    if (terrainSelectA) {
        terrainSelectA.addEventListener("change", function (event) {
            filterStateA.terrain = event.target.value;
            populateViewSelectFor("A");
            populateCompareSelectsFor("A");
            if (playersLoaded && videoAId && videoBId) updatePlayerSrcs();
        });
    }
    if (viewSelectA) {
        viewSelectA.addEventListener("change", function (event) {
            filterStateA.view = event.target.value;
            populateCompareSelectsFor("A");
            if (playersLoaded && videoAId && videoBId) updatePlayerSrcs();
        });
    }

    // Filter (Right B)
    const policySelectB = document.getElementById("filterPolicyB");
    const terrainSelectB = document.getElementById("filterTerrainB");
    const viewSelectB = document.getElementById("filterViewB");

    if (policySelectB) {
        policySelectB.addEventListener("change", function (event) {
            filterStateB.policy = event.target.value;
            populateViewSelectFor("B");
            populateCompareSelectsFor("B");
            if (playersLoaded && videoAId && videoBId) updatePlayerSrcs();
        });
    }
    if (terrainSelectB) {
        terrainSelectB.addEventListener("change", function (event) {
            filterStateB.terrain = event.target.value;
            populateViewSelectFor("B");
            populateCompareSelectsFor("B");
            if (playersLoaded && videoAId && videoBId) updatePlayerSrcs();
        });
    }
    if (viewSelectB) {
        viewSelectB.addEventListener("change", function (event) {
            filterStateB.view = event.target.value;
            populateCompareSelectsFor("B");
            if (playersLoaded && videoAId && videoBId) updatePlayerSrcs();
        });
    }
}

document.addEventListener("DOMContentLoaded", initCompare);
