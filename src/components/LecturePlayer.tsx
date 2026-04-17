"use client";

import { useEffect, useRef } from "react";

type Props = {
  lectureId: string;
  src: string;
  initialPosition?: number;
};

export function LecturePlayer({ lectureId, src, initialPosition = 0 }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const accumulatorRef = useRef(0);
  const lastTickRef = useRef<number | null>(null);
  const lastSentPositionRef = useRef(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (initialPosition > 0 && Number.isFinite(initialPosition)) {
      const onLoaded = () => {
        try {
          video.currentTime = initialPosition;
        } catch {}
        video.removeEventListener("loadedmetadata", onLoaded);
      };
      video.addEventListener("loadedmetadata", onLoaded);
    }

    const flush = async (isFinal = false) => {
      const delta = Math.floor(accumulatorRef.current);
      const position = Math.floor(video.currentTime);
      const completed =
        isFinal &&
        video.duration > 0 &&
        position >= Math.floor(video.duration) - 1;
      if (delta <= 0 && position === lastSentPositionRef.current && !completed) return;
      accumulatorRef.current -= delta;
      lastSentPositionRef.current = position;
      const body = JSON.stringify({
        lectureId,
        deltaSeconds: delta,
        position,
        completed: completed || undefined,
      });
      try {
        if (isFinal && "sendBeacon" in navigator) {
          const blob = new Blob([body], { type: "application/json" });
          navigator.sendBeacon("/api/progress", blob);
        } else {
          await fetch("/api/progress", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body,
            keepalive: true,
          });
        }
      } catch {
        // network errors ignored; will retry next tick
      }
    };

    const onTimeUpdate = () => {
      if (video.paused || video.seeking) {
        lastTickRef.current = null;
        return;
      }
      const now = performance.now();
      if (lastTickRef.current != null) {
        const diff = (now - lastTickRef.current) / 1000;
        if (diff > 0 && diff < 2) {
          accumulatorRef.current += diff;
        }
      }
      lastTickRef.current = now;
    };

    const onPause = () => {
      lastTickRef.current = null;
      flush();
    };
    const onEnded = () => {
      lastTickRef.current = null;
      flush(true);
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        lastTickRef.current = null;
        flush();
      }
    };

    const interval = window.setInterval(() => flush(), 10_000);

    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("pause", onPause);
    video.addEventListener("ended", onEnded);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      clearInterval(interval);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("ended", onEnded);
      document.removeEventListener("visibilitychange", onVisibility);
      flush(true);
    };
  }, [lectureId, initialPosition]);

  return (
    <video
      ref={videoRef}
      src={src}
      controls
      playsInline
      controlsList="nodownload"
      className="w-full rounded-lg bg-black"
    />
  );
}
