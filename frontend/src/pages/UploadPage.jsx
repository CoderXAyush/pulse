import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ProgressBar from "../components/ProgressBar";
import { uploadVideo, waitForVideoProcessed } from "../services/videoService";

const REDIRECT_MS = 2500;

export default function UploadPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [awaitingProcessing, setAwaitingProcessing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!success) return undefined;
    const t = window.setTimeout(() => {
      navigate("/dashboard");
    }, REDIRECT_MS);
    return () => window.clearTimeout(t);
  }, [success, navigate]);

  const canSubmit = useMemo(() => Boolean(file && title.trim()), [file, title]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setAwaitingProcessing(false);
    setError("");
    setSuccess("");
    setUploadProgress(0);

    const formData = new FormData();
    formData.append("video", file);
    formData.append("title", title);
    formData.append("description", description);

    try {
      const data = await uploadVideo(
        formData,
        (event) => {
          const pct = event.percent ?? 0;
          setUploadProgress(pct);
        },
        { fileSize: file.size }
      );

      setUploadProgress(100);
      setAwaitingProcessing(true);

      const videoId = data.video?.id || data.video?._id;
      if (videoId) {
        await waitForVideoProcessed(videoId);
      }

      setSuccess("Upload finished — your video is ready.");
      setTitle("");
      setDescription("");
      setFile(null);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Upload failed");
    } finally {
      setLoading(false);
      setAwaitingProcessing(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Upload Video</h1>
      <p className="mt-1 text-sm text-zinc-500">
        The file is sent first, then the server finishes processing. You will be redirected when everything is done.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <input
          className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none transition focus:border-zinc-400"
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <textarea
          className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none transition focus:border-zinc-400"
          rows={4}
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <input
          className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-900 file:px-3 file:py-1.5 file:text-white"
          type="file"
          accept=".mp4,.mov,.avi,video/mp4,video/quicktime,video/x-msvideo"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          required
        />

        {loading ? (
          <ProgressBar
            value={uploadProgress}
            label={awaitingProcessing ? "Processing video on server…" : "Uploading file…"}
          />
        ) : null}

        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        {success ? (
          <p className="text-sm text-emerald-600">
            {success} Redirecting to dashboard…
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading || !canSubmit}
          className="w-full rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Uploading..." : "Upload"}
        </button>
      </form>
    </section>
  );
}
