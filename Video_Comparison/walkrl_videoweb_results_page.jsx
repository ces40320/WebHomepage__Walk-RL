import React, { useMemo, useRef, useState } from "react";

export default function WalkRLVideoWebResultsPage() {

  const SYNC_START_TIME = 0;
  const BUFFER_DELAY_MS = 700;

  const videos = [
    { id: "XYzgVLA2ezk", title: "Independent muscle‑controlled walking – Learning env. – Around view", policy: "Independent", terrain: "Uneven Terrain", speed: "1.2 m/s", view: "Around" },
    { id: "sfHHjqCAYQE", title: "Independent muscle‑controlled 0.7 m/s walking – Sagittal view", policy: "Independent", terrain: "Level Ground", speed: "0.7 m/s", view: "Sagittal" },
    { id: "3HUabo3GDXM", title: "Independent muscle‑controlled 0.7 m/s walking – Frontal view", policy: "Independent", terrain: "Level Ground", speed: "0.7 m/s", view: "Frontal" },
    { id: "x-Qeo1EMjSA", title: "Independent muscle‑controlled 1.2 m/s walking – Sagittal view", policy: "Independent", terrain: "Level Ground", speed: "1.2 m/s", view: "Sagittal" },
    { id: "nJBgkvjS_rc", title: "Independent muscle‑controlled 1.2 m/s walking – Frontal view", policy: "Independent", terrain: "Level Ground", speed: "1.2 m/s", view: "Frontal" },
    { id: "1B8lW37ZXRQ", title: "Independent muscle‑controlled 1.8 m/s walking – Sagittal view", policy: "Independent", terrain: "Level Ground", speed: "1.8 m/s", view: "Sagittal" },
    { id: "5oNz30AzLzM", title: "Independent muscle‑controlled 1.8 m/s walking – Frontal view", policy: "Independent", terrain: "Level Ground", speed: "1.8 m/s", view: "Frontal" },
    { id: "sKAf_UQ-O6Y", title: "Independent muscle‑controlled downhill 1.2 m/s walking (−5°) – Sagittal view", policy: "Independent", terrain: "Downhill", speed: "1.2 m/s", view: "Sagittal" },
    { id: "kjXYdIAXUE8", title: "Independent muscle‑controlled uphill 1.2 m/s walking (+5°) – Sagittal view", policy: "Independent", terrain: "Uphill", speed: "1.2 m/s", view: "Sagittal" },
    { id: "diMExi0Iq4E", title: "Synergistic muscle‑controlled walking – Learning env. – Around view", policy: "Synergistic", terrain: "Uneven Terrain", speed: "1.2 m/s", view: "Around" }
  ];

  const buildEmbedUrl = (id) => {
    const params = new URLSearchParams({
      rel: "0",
      modestbranding: "1",
      playsinline: "1",
      enablejsapi: "1"
    });

    return `https://www.youtube-nocookie.com/embed/${id}?${params.toString()}`;
  };

  const buildThumbUrl = (id) => `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
  const buildWatchUrl = (id) => `https://www.youtube.com/watch?v=${id}`;

  const [policyFilter, setPolicyFilter] = useState("All");
  const [terrainFilter, setTerrainFilter] = useState("All");
  const [viewFilter, setViewFilter] = useState("All");

  const filteredVideos = useMemo(() => {
    return videos.filter(v => {
      const p = policyFilter === "All" || v.policy === policyFilter;
      const t = terrainFilter === "All" || v.terrain === terrainFilter;
      const vw = viewFilter === "All" || v.view === viewFilter;
      return p && t && vw;
    });
  }, [policyFilter, terrainFilter, viewFilter]);

  const [videoAId, setVideoAId] = useState(videos[0].id);
  const [videoBId, setVideoBId] = useState(videos[3].id);

  const iframeARef = useRef(null);
  const iframeBRef = useRef(null);

  const [playersLoaded, setPlayersLoaded] = useState(false);

  const sendYTCommand = (iframeRef, func, args = []) => {
    if (!iframeRef.current?.contentWindow) return;

    iframeRef.current.contentWindow.postMessage(JSON.stringify({
      event: "command",
      func,
      args
    }), "*");
  };

  const syncPlay = () => {

    if (!playersLoaded) return;

    sendYTCommand(iframeARef, "seekTo", [SYNC_START_TIME, true]);
    sendYTCommand(iframeBRef, "seekTo", [SYNC_START_TIME, true]);

    setTimeout(() => {
      sendYTCommand(iframeARef, "playVideo");
      sendYTCommand(iframeBRef, "playVideo");
    }, BUFFER_DELAY_MS);

  };

  const pauseBoth = () => {
    sendYTCommand(iframeARef, "pauseVideo");
    sendYTCommand(iframeBRef, "pauseVideo");
  };

  const videoA = videos.find(v => v.id === videoAId) ?? videos[0];
  const videoB = videos.find(v => v.id === videoBId) ?? videos[1];

  const loadIntoCompare = (id, slot) => {

    if (slot === "A") setVideoAId(id);
    else setVideoBId(id);

    setPlayersLoaded(false);

    window.scrollTo({ top: 0, behavior: "smooth" });

  };

  return (

    <div className="min-h-screen bg-slate-50 text-slate-900">

      <section className="mx-auto max-w-7xl px-6 py-12">

        <h1 className="text-4xl font-semibold tracking-tight">WalkRL Video Results</h1>

        <p className="mt-3 max-w-3xl text-slate-600">
          RL locomotion rollout comparison viewer with synchronized playback.
        </p>

      </section>

      <section className="mx-auto max-w-7xl px-6 pb-10">

        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">

          <div className="flex flex-col gap-4 lg:flex-row lg:justify-between lg:items-end">

            <div>
              <h2 className="text-2xl font-semibold">Compare Rollouts</h2>
              <p className="text-sm text-slate-600 mt-2">
                Select two videos then synchronize playback with a single button.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">

              <button
                className="rounded-2xl bg-slate-900 px-4 py-2.5 text-sm text-white"
                onClick={() => setPlayersLoaded(true)}
              >
                Load Players
              </button>

              <button
                disabled={!playersLoaded}
                className={`rounded-2xl px-4 py-2.5 text-sm border ${playersLoaded ? "border-slate-300" : "border-slate-200 text-slate-400 cursor-not-allowed"}`}
                onClick={syncPlay}
              >
                Sync Play
              </button>

              <button
                disabled={!playersLoaded}
                className={`rounded-2xl px-4 py-2.5 text-sm border ${playersLoaded ? "border-slate-300" : "border-slate-200 text-slate-400 cursor-not-allowed"}`}
                onClick={pauseBoth}
              >
                Pause
              </button>

            </div>

          </div>

          <div className="grid gap-6 md:grid-cols-2 mt-6">

            <select
              className="rounded-2xl border px-4 py-3 text-sm"
              value={videoAId}
              onChange={(e) => setVideoAId(e.target.value)}
            >
              {videos.map(v => (
                <option key={v.id} value={v.id}>{v.title}</option>
              ))}
            </select>

            <select
              className="rounded-2xl border px-4 py-3 text-sm"
              value={videoBId}
              onChange={(e) => setVideoBId(e.target.value)}
            >
              {videos.map(v => (
                <option key={v.id} value={v.id}>{v.title}</option>
              ))}
            </select>

          </div>

          <div className="grid gap-6 md:grid-cols-2 mt-6">

            {[videoA, videoB].map((video, idx) => {

              const iframeRef = idx === 0 ? iframeARef : iframeBRef;

              return (

                <div key={video.id} className="rounded-3xl border overflow-hidden">

                  {playersLoaded ? (

                    <iframe
                      ref={iframeRef}
                      title={video.title}
                      className="w-full aspect-video"
                      src={`${buildEmbedUrl(video.id)}&origin=${typeof window !== "undefined" ? window.location.origin : ""}`}
                      allow="autoplay; encrypted-media"
                      allowFullScreen
                    />

                  ) : (

                    <div className="aspect-video bg-slate-200">

                      <img
                        src={buildThumbUrl(video.id)}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />

                    </div>

                  )}

                  <div className="p-4">

                    <div className="font-semibold">{video.title}</div>

                    <div className="text-sm text-slate-600 mt-1">
                      {video.policy} • {video.terrain} • {video.speed} • {video.view}
                    </div>

                  </div>

                </div>

              );

            })}

          </div>

        </div>

      </section>

      <section className="mx-auto max-w-7xl px-6 pb-6">

        <div className="flex flex-wrap gap-3">

          <select
            className="rounded-2xl border px-4 py-2 text-sm"
            value={policyFilter}
            onChange={(e) => setPolicyFilter(e.target.value)}
          >
            {["All", "Independent", "Synergistic"].map(x => (
              <option key={x} value={x}>{x}</option>
            ))}
          </select>

          <select
            className="rounded-2xl border px-4 py-2 text-sm"
            value={terrainFilter}
            onChange={(e) => setTerrainFilter(e.target.value)}
          >
            {["All", "Level Ground", "Uneven Terrain", "Downhill", "Uphill"].map(x => (
              <option key={x} value={x}>{x}</option>
            ))}
          </select>

          <select
            className="rounded-2xl border px-4 py-2 text-sm"
            value={viewFilter}
            onChange={(e) => setViewFilter(e.target.value)}
          >
            {["All", "Sagittal", "Frontal", "Around"].map(x => (
              <option key={x} value={x}>{x}</option>
            ))}
          </select>

        </div>

      </section>

      <section className="mx-auto max-w-7xl px-6 pb-16">

        <div className="grid gap-6 xl:grid-cols-2">

          {filteredVideos.map(v => (

            <div key={v.id} className="rounded-3xl border overflow-hidden bg-white shadow-sm">

              <div className="aspect-video">

                <img
                  src={buildThumbUrl(v.id)}
                  alt={v.title}
                  className="w-full h-full object-cover"
                />

              </div>

              <div className="p-5">

                <div className="font-semibold text-sm">{v.title}</div>

                <div className="text-xs text-slate-600 mt-1">
                  {v.policy} • {v.terrain} • {v.speed} • {v.view}
                </div>

                <div className="flex gap-2 mt-3">

                  <button
                    className="rounded bg-slate-900 text-white px-3 py-1 text-xs"
                    onClick={() => loadIntoCompare(v.id, "A")}
                  >
                    Load Left
                  </button>

                  <button
                    className="rounded border px-3 py-1 text-xs"
                    onClick={() => loadIntoCompare(v.id, "B")}
                  >
                    Load Right
                  </button>

                  <a
                    href={buildWatchUrl(v.id)}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded border px-3 py-1 text-xs"
                  >
                    YouTube
                  </a>

                </div>

              </div>

            </div>

          ))}

        </div>

      </section>

    </div>

  );

}
