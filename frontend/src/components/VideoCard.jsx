import { Link } from "react-router-dom";

const badgeClass = {
  safe: "bg-emerald-50 text-emerald-700",
  flagged: "bg-rose-50 text-rose-700",
  processing: "bg-amber-50 text-amber-700",
  completed: "bg-zinc-100 text-zinc-700",
};

export default function VideoCard({ video }) {
  return (
    <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="mb-2 flex items-start justify-between gap-3">
        <h3 className="line-clamp-1 text-base font-medium text-zinc-900">{video.title}</h3>
        <span className={`rounded-md px-2 py-1 text-xs ${badgeClass[video.status] || badgeClass.completed}`}>
          {video.status}
        </span>
      </div>
      <p className="line-clamp-2 min-h-10 text-sm text-zinc-500">{video.description || "No description"}</p>
      <div className="mt-4 flex items-center justify-between">
        <span className={`rounded-md px-2 py-1 text-xs ${badgeClass[video.result] || badgeClass.safe}`}>
          {video.result}
        </span>
        <Link
          to={`/videos/${video._id || video.id}`}
          className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs text-zinc-700 transition hover:bg-zinc-100"
        >
          Open
        </Link>
      </div>
    </article>
  );
}
