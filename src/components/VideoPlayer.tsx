"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize } from "lucide-react";

interface VideoPlayerProps {
  src: string;
  thumbnail?: string | null;
  autoPlay?: boolean;
  muted?: boolean;
  controls?: boolean;
  className?: string;
  onView?: () => void;
}

export const VideoPlayer = ({
  src,
  thumbnail,
  autoPlay = false,
  muted = false,
  controls = true,
  className = "",
  onView,
}: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(muted);
  const [hasViewed, setHasViewed] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => {
      setCurrentTime(video.currentTime);
      setProgress((video.currentTime / video.duration) * 100);
    };

    const updateDuration = () => {
      setDuration(video.duration);
    };

    const handleView = () => {
      if (!hasViewed && video.currentTime > 3) {
        setHasViewed(true);
        onView?.();
      }
    };

    video.addEventListener("timeupdate", updateTime);
    video.addEventListener("timeupdate", handleView);
    video.addEventListener("loadedmetadata", updateDuration);

    return () => {
      video.removeEventListener("timeupdate", updateTime);
      video.removeEventListener("timeupdate", handleView);
      video.removeEventListener("loadedmetadata", updateDuration);
    };
  }, [hasViewed, onView]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;
    const bounds = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - bounds.left) / bounds.width;
    videoRef.current.currentTime = percent * videoRef.current.duration;
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className={`group relative overflow-hidden rounded-lg bg-black ${className}`}>
      <video
        ref={videoRef}
        src={src}
        poster={thumbnail || undefined}
        autoPlay={autoPlay}
        muted={muted}
        loop
        playsInline
        className="h-full w-full object-contain"
        onClick={togglePlay}
      />

      {controls && (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <button
            onClick={togglePlay}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-black shadow-lg transition-transform hover:scale-110"
          >
            {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="ml-1 h-8 w-8" />}
          </button>
        </div>
      )}

      {controls && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          {/* Progress Bar */}
          <div
            className="mb-3 h-1 w-full cursor-pointer overflow-hidden rounded-full bg-white/30"
            onClick={handleProgressClick}
          >
            <div
              className="h-full bg-white transition-all duration-150"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlay}
                className="transition-transform hover:scale-110"
              >
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </button>
              <button
                onClick={toggleMute}
                className="transition-transform hover:scale-110"
              >
                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </button>
              <span className="text-sm">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>
            <button
              onClick={toggleFullscreen}
              className="transition-transform hover:scale-110"
            >
              <Maximize className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
