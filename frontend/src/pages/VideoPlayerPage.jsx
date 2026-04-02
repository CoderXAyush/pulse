import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { deleteVideo, fetchVideoBlob, fetchVideoById, fetchVideos } from "../services/videoService";

const SKIP_SECONDS = 10;

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

function IconSkipBack() {
  return (
    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z" />
    </svg>
  );
}

function IconSkipForward() {
  return (
    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z" />
    </svg>
  );
}

export default function VideoPlayerPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const videoRef = useRef(null);

  const [sidebarVideos, setSidebarVideos] = useState([]);
  const [listLoading, setListLoading] = useState(true);

  const [video, setVideo] = useState(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [playerLoading, setPlayerLoading] = useState(true);
  const [error, setError] = useState("");

  const [deleting, setDeleting] = useState(false);

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

  const skipBackward = () => {
    const el = videoRef.current;
    if (!el) return;
    el.currentTime = Math.max(0, el.currentTime - SKIP_SECONDS);
  };

  const skipForward = () => {
    const el = videoRef.current;
    if (!el) return;
    const next = el.currentTime + SKIP_SECONDS;
    const dur = el.duration;
    el.currentTime = Number.isFinite(dur) && dur > 0 ? Math.min(dur, next) : next;
  };

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

            <div className="space-y-3">
              <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-black shadow-sm">
                <video
                  key={id}
                  ref={videoRef}
                  className="h-auto w-full"
                  src={videoUrl}
                  controls
                  playsInline
                />
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-start">
                <button
                  type="button"
                  onClick={skipBackward}
                  className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-800 shadow-sm transition hover:bg-zinc-50"
                  aria-label={`Skip back ${SKIP_SECONDS} seconds`}
                >
                  <IconSkipBack />
                  <span>−{SKIP_SECONDS}s</span>
                </button>
                <button
                  type="button"
                  onClick={skipForward}
                  className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-800 shadow-sm transition hover:bg-zinc-50"
                  aria-label={`Skip forward ${SKIP_SECONDS} seconds`}
                >
                  <span>+{SKIP_SECONDS}s</span>
                  <IconSkipForward />
                </button>
              </div>
            </div>

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
