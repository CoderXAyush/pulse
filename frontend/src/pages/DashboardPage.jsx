import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { deleteVideo, fetchVideos } from "../services/videoService";

function userCanDeleteVideo(user, video) {
  if (!user || !video) return false;
  if (user.role === "admin") return true;
  if (user.role === "editor") {
    return String(video.userId) === String(user.id);
  }
  return false;
}

function SortArrows({ active, dir }) {
  return (
    <span className="inline-flex flex-col text-[10px] leading-none text-zinc-400" aria-hidden>
      <span className={active && dir === "asc" ? "text-zinc-800" : ""}>▲</span>
      <span className={`-mt-0.5 ${active && dir === "desc" ? "text-zinc-800" : ""}`}>▼</span>
    </span>
  );
}

function formatUploadedAt(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
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

export default function DashboardPage() {
  const { user } = useAuth();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState("asc");

  const sortedVideos = useMemo(() => {
    if (!sortKey) return videos;
    const copy = [...videos];
    copy.sort((a, b) => {
      if (sortKey === "name") {
        const cmp = (a.title || "").localeCompare(b.title || "", undefined, { sensitivity: "base" });
        return sortDir === "asc" ? cmp : -cmp;
      }
      if (sortKey === "size") {
        const sa = Number(a.size) || 0;
        const sb = Number(b.size) || 0;
        return sortDir === "asc" ? sa - sb : sb - sa;
      }
      if (sortKey === "date") {
        const ta = new Date(a.createdAt || 0).getTime();
        const tb = new Date(b.createdAt || 0).getTime();
        return sortDir === "asc" ? ta - tb : tb - ta;
      }
      return 0;
    });
    return copy;
  }, [videos, sortKey, sortDir]);

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      // Newest uploads first feels natural for “Uploaded”; other columns start ascending.
      setSortDir(key === "date" ? "desc" : "asc");
    }
  };

  const loadVideos = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchVideos();
      setVideos(data.videos || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load videos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVideos();
  }, [loadVideos]);

  const handleDelete = async (video) => {
    if (!window.confirm(`Delete “${video.title}”? This cannot be undone.`)) return;
    const vid = video._id || video.id;
    setDeletingId(vid);
    try {
      await deleteVideo(vid);
      setVideos((prev) => prev.filter((v) => String(v._id || v.id) !== String(vid)));
    } catch (err) {
      window.alert(err.response?.data?.message || "Could not delete video");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Dashboard</h1>
        <p className="text-sm text-zinc-500">Track your uploaded videos.</p>
      </div>

      {loading ? <p className="text-sm text-zinc-500">Loading videos...</p> : null}
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      {!loading && !error && videos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-sm text-zinc-500">
          No videos found. Upload your first video.
        </div>
      ) : null}

      {!loading && !error && videos.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50/80 text-xs font-medium uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="w-12 px-2 py-3 text-center">#</th>
                  <th className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => toggleSort("name")}
                      className="inline-flex items-center gap-1.5 rounded-md uppercase tracking-wide text-zinc-500 transition hover:text-zinc-900"
                      aria-sort={sortKey === "name" ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
                    >
                      Name
                      <SortArrows active={sortKey === "name"} dir={sortDir} />
                    </button>
                  </th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Format</th>
                  <th className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => toggleSort("size")}
                      className="inline-flex items-center gap-1.5 rounded-md uppercase tracking-wide text-zinc-500 transition hover:text-zinc-900"
                      aria-sort={sortKey === "size" ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
                    >
                      Size
                      <SortArrows active={sortKey === "size"} dir={sortDir} />
                    </button>
                  </th>
                  <th className="whitespace-nowrap px-4 py-3">
                    <button
                      type="button"
                      onClick={() => toggleSort("date")}
                      className="inline-flex items-center gap-1.5 rounded-md uppercase tracking-wide text-zinc-500 transition hover:text-zinc-900"
                      aria-sort={sortKey === "date" ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
                    >
                      Uploaded
                      <SortArrows active={sortKey === "date"} dir={sortDir} />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {sortedVideos.map((video, index) => (
                  <tr key={video._id || video.id} className="transition hover:bg-zinc-50/80">
                    <td className="px-2 py-3 text-center tabular-nums text-zinc-500">{index + 1}</td>
                    <td className="max-w-[200px] px-4 py-3 font-medium text-zinc-900">
                      <span className="line-clamp-2">{video.title}</span>
                    </td>
                    <td className="max-w-[240px] px-4 py-3 text-zinc-600">
                      <span className="line-clamp-2">{video.description?.trim() ? video.description : "No description"}</span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-zinc-700">
                      {(video.format || "—").toUpperCase()}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-zinc-700">{formatBytes(video.size)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-zinc-600">{formatUploadedAt(video.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <Link
                          to={`/videos/${video._id || video.id}`}
                          className="inline-flex rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100"
                        >
                          Open
                        </Link>
                        {userCanDeleteVideo(user, video) ? (
                          <button
                            type="button"
                            onClick={() => handleDelete(video)}
                            disabled={deletingId === (video._id || video.id)}
                            className="inline-flex rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-800 transition hover:bg-rose-100 disabled:opacity-60"
                          >
                            {deletingId === (video._id || video.id) ? "…" : "Delete"}
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </section>
  );
}
