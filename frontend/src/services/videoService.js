import api from "./api";

export async function fetchVideos(params = {}) {
  const { data } = await api.get("/videos", { params });
  return data;
}

export async function fetchVideoById(id) {
  const { data } = await api.get(`/videos/${id}`);
  return data;
}

/**
 * @param {FormData} payload
 * @param {(evt: import("axios").AxiosProgressEvent) => void} [onUploadProgress]
 * @param {{ fileSize?: number }} [opts] Pass file.size when available so progress works if the browser reports total=0.
 */
export async function uploadVideo(payload, onUploadProgress, opts = {}) {
  const { fileSize } = opts;
  const { data } = await api.post("/videos/upload", payload, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (evt) => {
      if (!onUploadProgress) return;
      const total =
        evt.total && evt.total > 0 ? evt.total : fileSize && fileSize > 0 ? fileSize : 0;
      if (!total) return;
      const loaded = Math.min(evt.loaded, total);
      const percent = Math.min(100, Math.round((loaded * 100) / total));
      onUploadProgress({ ...evt, total, loaded, percent });
    },
  });
  return data;
}

/** Poll until the video leaves the processing pipeline (completed) or fails by timeout. */
export async function waitForVideoProcessed(videoId, { maxMs = 300000, intervalMs = 500 } = {}) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    const { video } = await fetchVideoById(videoId);
    if (video.status === "completed") {
      return video;
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error("Processing is taking longer than expected. Check the dashboard for status.");
}

export async function fetchVideoBlob(id) {
  const { data } = await api.get(`/videos/stream/${id}`, {
    responseType: "blob",
  });
  return data;
}

export async function deleteVideo(id) {
  const { data } = await api.delete(`/videos/${id}`);
  return data;
}
