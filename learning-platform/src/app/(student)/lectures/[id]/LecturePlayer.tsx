"use client";

import { useEffect, useRef } from "react";

export default function LecturePlayer({
  src,
  lectureId,
  durationSec,
}: {
  src: string;
  lectureId: string;
  durationSec: number;
}) {
  const startedRef = useRef<number>(Date.now());
  const lastSentRef = useRef<number>(0);

  useEffect(() => {
    // Periodically estimate watch time as elapsed wall time minus pauses.
    // Drive's iframe doesn't expose detailed events, so we send heartbeats
    // every 10s based on the page being visible.
    let visibleMs = 0;
    let lastTick = Date.now();
    let visible = !document.hidden;

    const onVis = () => {
      const now = Date.now();
      if (visible) visibleMs += now - lastTick;
      visible = !document.hidden;
      lastTick = now;
    };
    document.addEventListener("visibilitychange", onVis);

    const interval = setInterval(async () => {
      const now = Date.now();
      if (visible) visibleMs += now - lastTick;
      lastTick = now;
      const seconds = Math.floor(visibleMs / 1000);
      if (seconds <= lastSentRef.current) return;
      lastSentRef.current = seconds;
      const completed = durationSec > 0 && seconds >= Math.floor(durationSec * 0.9);
      navigator.sendBeacon?.(
        "/api/lectures/heartbeat",
        new Blob(
          [JSON.stringify({ lecture_id: lectureId, watched_sec: seconds, completed })],
          { type: "application/json" }
        )
      );
    }, 10_000);

    const onUnload = () => {
      const now = Date.now();
      if (visible) visibleMs += now - lastTick;
      const seconds = Math.floor(visibleMs / 1000);
      if (seconds <= lastSentRef.current) return;
      const completed = durationSec > 0 && seconds >= Math.floor(durationSec * 0.9);
      navigator.sendBeacon?.(
        "/api/lectures/heartbeat",
        new Blob(
          [JSON.stringify({ lecture_id: lectureId, watched_sec: seconds, completed })],
          { type: "application/json" }
        )
      );
    };
    window.addEventListener("beforeunload", onUnload);

    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("beforeunload", onUnload);
      clearInterval(interval);
      onUnload();
    };
  }, [lectureId, durationSec]);

  return (
    <div className="aspect-video w-full bg-black rounded-md overflow-hidden">
      <iframe
        src={src}
        allow="autoplay; encrypted-media"
        allowFullScreen
        className="w-full h-full border-0"
      />
    </div>
  );
}
