import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

export default function useSocket(onProgress, token) {
  const socketRef = useRef(null);

  useEffect(() => {
    const socketUrl = import.meta.env.VITE_SOCKET_URL || "http://localhost:5001";
    const opts = { transports: ["websocket"] };
    if (token) {
      opts.auth = { token };
    }
    socketRef.current = io(socketUrl, opts);

    if (onProgress) {
      socketRef.current.on("processingProgress", onProgress);
    }

    return () => {
      if (onProgress) {
        socketRef.current.off("processingProgress", onProgress);
      }
      socketRef.current.disconnect();
    };
  }, [onProgress, token]);

  return socketRef.current;
}
