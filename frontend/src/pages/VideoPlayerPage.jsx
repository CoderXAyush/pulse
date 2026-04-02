import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { deleteVideo, fetchVideoBlob, fetchVideoById, fetchVideos } from "../services/videoService";

const SKIP_SECONDS = 10;
const VOLUME_STEP = 0.1;

function userCanDeleteVideo(user, video) {
  if (!user || !video) return false;
  if (user.role === "admin") return true;
  if (user.role === "editor") {
    return String(video.userId) === String(user.id);
  }
  return false;
}

function formatBytes(n) {
  if (n == null || Number.isNaN(Number(n))) return "—";
  const num = Number(n);
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let v = num;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i += 1;
  }
  return `${v.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function formatTime(seconds) {
  if (isNaN(seconds)) return "0:00";
  const date = new Date(seconds * 1000);
  const hh = date.getUTCHours();
  const mm = date.getUTCMinutes();
  const ss = date.getUTCSeconds().toString().padStart(2, "0");
  if (hh) {
    return `${hh}:${mm.toString().padStart(2, "0")}:${ss}`;
  }
  return `${mm}:${ss}`;
}

// Icons
function IconPlay() {
  return <svg viewBox="0 0 24 24" className="w-5 h-5"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>;
}
function IconPause() {
  return <svg viewBox="0 0 24 24" className="w-5 h-5"><path fill="currentColor" d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>;
}
function IconVolumeHigh() {
  return <svg viewBox="0 0 24 24" className="w-5 h-5"><path fill="currentColor" d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>;
}
function IconVolumeOff() {
  return <svg viewBox="0 0 24 24" className="w-5 h-5"><path fill="currentColor" d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>;
}
function IconFullscreen() {
  return <svg viewBox="0 0 24 24" className="w-5 h-5"><path fill="currentColor" d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>;
}
function IconFullscreenExit() {
  return <svg viewBox="0 0 24 24" className="w-5 h-5"><path fill="currentColor" d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/></svg>;
}


export default function VideoPlayerPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const videoRef = useRef(null);
  const playerContainerRef = useRef(null);
  const controlsTimeoutRef = useRef(null);

  const [sidebarVideos, setSidebarVideos] = useState([]);
  const [listLoading, setListLoading] = useState(true);

  const [video, setVideo] = useState(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [playerLoading, setPlayerLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);

  const refreshList = useCallback(async () => {
    try {
      const data = await fetchVideos();
      setSidebarVideos(data.videos || []);
    } catch {
      setSidebarVideos([]);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    setListLoading(true);
    refreshList().finally(() => {
      if (!cancelled) setListLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [refreshList]);

  useEffect(() => {
    const urlRef = { current: null };
    let cancelled = false;

    const loadVideo = async () => {
      setPlayerLoading(true);
      setError("");
      setVideo(null);
      setVideoUrl("");
      try {
        const [metaData, blob] = await Promise.all([fetchVideoById(id), fetchVideoBlob(id)]);
        const objectUrl = URL.createObjectURL(blob);
        urlRef.current = objectUrl;
        if (cancelled) {
          URL.revokeObjectURL(objectUrl);
          return;
        }
        if (metaData.video) {
          setVideo(metaData.video);
          setVideoUrl(objectUrl);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || "Unable to load video");
        }
      } finally {
        if (!cancelled) {
          setPlayerLoading(false);
        }
      }
    };

    loadVideo();

    return () => {
      cancelled = true;
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current);
        urlRef.current = null;
      }
    };
  }, [id]);

  useEffect(() => {
    const sync = () => {
      const el = playerContainerRef.current;
      const active =
        document.fullscreenElement === el ||
        document.webkitFullscreenElement === el;
      setIsFullscreen(!!active);
    };
    document.addEventListener("fullscreenchange", sync);
    document.addEventListener("webkitfullscreenchange", sync);
    return () => {
      document.removeEventListener("fullscreenchange", sync);
      document.removeEventListener("webkitfullscreenchange", sync);
    };
  }, []);

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 2500);
  };

  const handleMouseLeave = () => {
    if (isPlaying) setShowControls(false);
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
      if (volume === 0 && isMuted) {
        setVolume(1);
        videoRef.current.volume = 1;
      }
    }
  };

  const handleVolumeChange = (e) => {
    const vol = parseFloat(e.target.value);
    setVolume(vol);
    if (videoRef.current) {
      videoRef.current.volume = vol;
      videoRef.current.muted = vol === 0;
    }
    setIsMuted(vol === 0);
  };

  const toggleFullscreen = () => {
    const node = playerContainerRef.current;
    if (!node) return;

    const fsEl = document.fullscreenElement || document.webkitFullscreenElement;
    if (fsEl === node) {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
      return;
    }

    const req = node.requestFullscreen || node.webkitRequestFullscreen;
    if (req) {
      req.call(node).catch((err) => console.error(err));
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleProgressChange = (e) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
    setCurrentTime(time);
  };
  
  const skipBackward = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    el.currentTime = Math.max(0, el.currentTime - SKIP_SECONDS);
  }, []);

  const skipForward = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    const next = el.currentTime + SKIP_SECONDS;
    const dur = el.duration;
    el.currentTime = Number.isFinite(dur) && dur > 0 ? Math.min(dur, next) : next;
  }, []);

  useEffect(() => {
    const onKeyDown = (e) => {
      const tag = e.target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || e.target?.isContentEditable) {
        return;
      }
      if (!video || playerLoading || !videoRef.current) return;
      const el = videoRef.current;

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        skipBackward();
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        skipForward();
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        const cur = el.muted ? 0 : el.volume;
        const next = Math.min(1, cur + VOLUME_STEP);
        el.volume = next;
        el.muted = next === 0;
        setVolume(next);
        setIsMuted(next === 0);
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        const cur = el.muted ? 0 : el.volume;
        const next = Math.max(0, cur - VOLUME_STEP);
        el.volume = next;
        el.muted = next === 0;
        setVolume(next);
        setIsMuted(next === 0);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [video, playerLoading, skipBackward, skipForward]);

  const handleDelete = async () => {
    if (!video) return;
    if (!window.confirm(`Delete “${video.title}”? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await deleteVideo(id);
      await refreshList();
      navigate("/dashboard");
    } catch (err) {
      window.alert(err.response?.data?.message || "Could not delete video");
    } finally {
      setDeleting(false);
    }
  };

  const showDelete = video && userCanDeleteVideo(user, video);

  // Reusable Pill Button component
  function PlayerControlButton({ onClick, children, extraClasses = "" }) {
    return (
      <button 
        type="button"
        onClick={onClick} 
        className={`flex h-10 w-10 items-center justify-center rounded-full bg-black/60 shadow-lg backdrop-blur-md transition-all hover:bg-black/90 hover:scale-105 active:scale-95 ${extraClasses}`}
      >
        {children}
      </button>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-5.5rem)] flex-col gap-6 lg:flex-row lg:items-stretch">
      <aside className="order-2 flex w-full shrink-0 flex-col rounded-2xl border border-zinc-200 bg-white shadow-sm lg:order-1 lg:max-h-[calc(100vh-5.5rem)] lg:w-72 lg:min-w-[18rem] xl:w-80">
        <div className="border-b border-zinc-100 p-4">
          <Link
            to="/dashboard"
            className="text-sm font-semibold text-zinc-900 transition hover:text-zinc-600"
          >
            ← Full dashboard
          </Link>
          <p className="mt-1 text-xs text-zinc-500">Pick another video to play here.</p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          {listLoading ? (
            <p className="px-2 py-4 text-sm text-zinc-500">Loading list…</p>
          ) : sidebarVideos.length === 0 ? (
            <p className="px-2 py-4 text-sm text-zinc-500">No videos yet.</p>
          ) : (
            <ul className="space-y-1">
              {sidebarVideos.map((v) => {
                const vid = v._id || v.id;
                const active = String(vid) === String(id);
                return (
                  <li key={vid}>
                    <Link
                      to={`/videos/${vid}`}
                      className={`block rounded-xl px-3 py-2.5 text-left transition ${
                        active
                          ? "bg-zinc-900 text-white"
                          : "text-zinc-700 hover:bg-zinc-100"
                      }`}
                    >
                      <span className="line-clamp-2 text-sm font-medium">{v.title}</span>
                      <span
                        className={`mt-0.5 block text-xs ${active ? "text-zinc-300" : "text-zinc-500"}`}
                      >
                        {formatBytes(v.size)}
                        {v.format ? ` · ${String(v.format).toUpperCase()}` : ""}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>

      <section className="order-1 min-w-0 flex-1 space-y-4 lg:order-2">
        {playerLoading ? (
          <p className="text-sm text-zinc-500">Loading video…</p>
        ) : error ? (
          <p className="text-sm text-rose-600">{error}</p>
        ) : !video ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-sm text-zinc-500">
            Video not found.
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-end gap-3">
              {showDelete ? (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-sm font-medium text-rose-800 transition hover:bg-rose-100 disabled:opacity-60"
                >
                  {deleting ? "Deleting…" : "Delete"}
                </button>
              ) : null}
            </div>

            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">{video.title}</h1>
              <p className="mt-1 text-sm text-zinc-500">{video.description || "No description"}</p>
            </div>

            <div
              ref={playerContainerRef}
              className={`pulse-player group overflow-hidden bg-black transition-all focus:outline-none ${
                isFullscreen
                  ? "relative h-full min-h-[100dvh] w-screen max-w-none rounded-none border-0 shadow-none"
                  : "relative flex justify-center rounded-2xl border border-zinc-200 shadow-sm"
              }`}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              <video
                key={id}
                ref={videoRef}
                className={
                  isFullscreen
                    ? "absolute inset-0 z-0 box-border h-full w-full min-h-0 min-w-0 cursor-pointer bg-black object-contain"
                    : "relative z-0 block max-h-[70vh] w-full cursor-pointer bg-black object-contain"
                }
                src={videoUrl}
                playsInline
                onClick={togglePlay}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />

              {/* Controls overlay bottom (fullscreen: on top of full-bleed video) */}
              <div
                className={`absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/95 via-black/55 to-transparent px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-20 transition-transform duration-300 ${
                  showControls ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0 pointer-events-none"
                }`}
              >
                {/* Custom Progress Bar */}
                <div className="group/progress relative flex h-3 cursor-pointer items-center w-full mt-4">
                  <input
                    type="range"
                    min={0}
                    max={duration || 100}
                    value={currentTime}
                    onChange={handleProgressChange}
                    className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="relative h-1 w-full bg-white/30 flex items-center group-hover/progress:h-[5px] transition-all rounded-full overflow-hidden">
                     {/* Red Progress */}
                     <div 
                        className="h-full bg-red-600 transition-all pointer-events-none" 
                        style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                     />
                  </div>
                  {/* Thumb Indicator outside overflow-hidden */}
                  <div 
                     className="absolute h-3.5 w-3.5 rounded-full bg-red-600 scale-0 group-hover/progress:scale-100 transition-transform shadow-md pointer-events-none" 
                     style={{ left: `calc(${(currentTime / (duration || 1)) * 100}% - 7px)` }}
                  />
                </div>

                {/* Pill Controls Row */}
                <div className="mt-4 flex items-center justify-between text-white">
                  {/* Left Controls */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    <PlayerControlButton onClick={togglePlay}>
                      {isPlaying ? <IconPause /> : <IconPlay />}
                    </PlayerControlButton>

                    <div className="group/volume relative flex items-center">
                       <PlayerControlButton onClick={toggleMute} extraClasses="z-10 relative">
                         {isMuted || volume === 0 ? <IconVolumeOff /> : <IconVolumeHigh />}
                       </PlayerControlButton>
                       <div className="flex h-10 w-0 overflow-hidden items-center rounded-r-full bg-black/60 shadow-lg backdrop-blur-md transition-all duration-300 group-hover/volume:w-24 group-hover/volume:-ml-5 group-hover/volume:pl-8 group-hover/volume:pr-3 opacity-0 group-hover/volume:opacity-100">
                          <input
                             type="range"
                             min={0} max={1} step={0.01}
                             value={isMuted ? 0 : volume}
                             onChange={handleVolumeChange}
                             className="w-full accent-white h-1 bg-white/30 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full cursor-pointer"
                          />
                       </div>
                    </div>

                    <div className="flex h-10 items-center justify-center rounded-full bg-black/60 px-4 text-xs font-semibold tabular-nums tracking-wide shadow-lg backdrop-blur-md">
                       <span>{formatTime(currentTime)}</span>
                       <span className="opacity-60 mx-1.5 font-normal">/</span>
                       <span className="opacity-80 font-medium">{formatTime(duration)}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <PlayerControlButton onClick={toggleFullscreen}>
                      {isFullscreen ? <IconFullscreenExit /> : <IconFullscreen />}
                    </PlayerControlButton>
                  </div>
                </div>
              </div>
            </div>

            {!isFullscreen ? (
              <p className="text-center text-xs text-zinc-500">
                <kbd className="rounded border border-zinc-300 bg-zinc-50 px-1.5 py-0.5 font-mono">←</kbd> /{" "}
                <kbd className="rounded border border-zinc-300 bg-zinc-50 px-1.5 py-0.5 font-mono">→</kbd> jump{" "}
                {SKIP_SECONDS}s · <kbd className="rounded border border-zinc-300 bg-zinc-50 px-1.5 py-0.5 font-mono">↑</kbd> /{" "}
                <kbd className="rounded border border-zinc-300 bg-zinc-50 px-1.5 py-0.5 font-mono">↓</kbd> volume (not
                while typing in a field).
              </p>
            ) : null}

            <div className="grid gap-2 rounded-2xl border border-zinc-200 bg-white p-4 text-sm text-zinc-600">
              <p>Status: {video.status}</p>
              <p>Result: {video.result}</p>
              <p className="break-all">Filename: {video.filename}</p>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
