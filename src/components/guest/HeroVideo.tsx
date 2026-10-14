'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface HeroVideoProps {
  /** Grid placement for the cell, supplied by the mosaic that owns the layout. */
  className?: string;
  onOpen: () => void;
  openLabel: string;
}

/**
 * The drone reel in the mosaic's hero cell. The clip is a 3:2 centre crop of a
 * vertical reel, so it is encoded already cropped rather than letting the
 * browser decode 1920 rows and discard two thirds of them.
 */
export default function HeroVideo({ className, onOpen, openLabel }: HeroVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Set as a property, not the JSX attribute: React drops `muted` often
    // enough that autoplay silently fails, and autoplay is only ever permitted
    // while the video is muted.
    video.muted = true;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => {
      if (reduced.matches) video.pause();
      else void video.play().catch(() => {});
    };
    sync();
    reduced.addEventListener('change', sync);
    return () => reduced.removeEventListener('change', sync);
  }, []);

  const toggleSound = () => {
    const video = videoRef.current;
    if (!video) return;
    const nextMuted = !video.muted;
    video.muted = nextMuted;
    setMuted(nextMuted);
    // Asking for sound is a deliberate gesture, so it also overrides the pause
    // that a reduced-motion preference would otherwise hold the clip in.
    if (!nextMuted) void video.play().catch(() => {});
  };

  return (
    <div
      className={`relative overflow-hidden ${className ?? ''}`}
      style={{ aspectRatio: '3 / 2', backgroundColor: 'var(--paper-sunk)' }}
    >
      <video
        ref={videoRef}
        poster="/video/villa19-hero-poster.jpg"
        loop
        playsInline
        preload="metadata"
        className="absolute inset-0 h-full w-full"
        style={{ objectFit: 'cover' }}
      >
        <source src="/video/villa19-hero.mp4" type="video/mp4" />
      </video>

      {/* Sibling of the sound toggle rather than its parent: a button inside a
          button is invalid, and the toggle has to stay clickable. */}
      <button
        type="button"
        onClick={onOpen}
        className="absolute inset-0 z-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--brass)]"
        aria-label={openLabel}
      />

      <button
        type="button"
        onClick={toggleSound}
        className="absolute bottom-3 left-3 z-20 grid h-10 w-10 place-items-center rounded-xl border border-white/15 bg-[rgba(20,10,8,0.85)] text-white shadow-xl backdrop-blur-md transition-all hover:bg-[var(--brass-light)] hover:text-[var(--maroon-deep)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brass)]"
        aria-label={muted ? 'Unmute video' : 'Mute video'}
        aria-pressed={!muted}
      >
        {muted
          ? <VolumeX className="h-4 w-4" aria-hidden="true" />
          : <Volume2 className="h-4 w-4" aria-hidden="true" />}
      </button>
    </div>
  );
}
