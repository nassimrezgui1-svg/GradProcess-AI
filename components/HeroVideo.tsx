"use client"
import { useRef, useState, useEffect } from "react"

const VIDEO_SRC = "/assets/gradprocess-ai-hero.mp4"

export function HeroVideoBg() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [loaded, setLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    if (v.readyState >= 3) setLoaded(true)
    v.play().catch(() => setHasError(true))
  }, [])

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden">
      {!hasError && (
        <video
          ref={videoRef}
          src={VIDEO_SRC}
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
          style={{ opacity: loaded ? 1 : 0 }}
          onLoadedData={() => setLoaded(true)}
          onError={() => setHasError(true)}
        />
      )}

      {/* Top vignette — keeps nav readable */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#070B14]/80 via-[#070B14]/30 to-[#070B14]/0 pointer-events-none" />
      {/* Bottom — merges into page */}
      <div className="absolute bottom-0 left-0 right-0 h-2/5 bg-gradient-to-t from-[#070B14] via-[#070B14]/80 to-transparent pointer-events-none" />
      {/* Side vignettes */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ boxShadow: "inset 80px 0 120px rgba(7,11,20,0.6), inset -80px 0 120px rgba(7,11,20,0.6)" }} />

      {(hasError || !loaded) && (
        <div className="absolute inset-0"
          style={{ background: "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(99,102,241,0.15) 0%, rgba(7,11,20,1) 70%)" }} />
      )}
    </div>
  )
}
