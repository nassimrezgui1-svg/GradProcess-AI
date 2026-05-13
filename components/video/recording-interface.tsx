"use client"
import { useState, useRef, useEffect, useCallback } from "react"
import { Video, VideoOff, Mic, MicOff, Circle, Square, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"

interface RecordingInterfaceProps {
  onRecordingComplete?: (blob: Blob, duration: number) => void
  className?: string
  maxDuration?: number
}

export function RecordingInterface({ onRecordingComplete, className, maxDuration = 180 }: RecordingInterfaceProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [isCameraOn, setIsCameraOn] = useState(true)
  const [isMicOn, setIsMicOn] = useState(true)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const requestPermissions = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      setStream(mediaStream)
      setPermissionGranted(true)
    } catch {
      setPermissionGranted(false)
    }
  }, [])

  // Attach stream to video element after render
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream
      videoRef.current.play().catch(() => {})
    }
  }, [stream, permissionGranted])

  useEffect(() => {
    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop())
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [stream])

  const startRecording = () => {
    if (!stream) return
    chunksRef.current = []
    const recorder = new MediaRecorder(stream)
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" })
      onRecordingComplete?.(blob, elapsed)
    }
    mediaRecorderRef.current = recorder
    recorder.start()
    setIsRecording(true)
    setElapsed(0)
    intervalRef.current = setInterval(() => {
      setElapsed(prev => {
        if (prev >= maxDuration - 1) {
          stopRecording()
          return prev
        }
        return prev + 1
      })
    }, 1000)
  }

  const stopRecording = () => {
    mediaRecorderRef.current?.stop()
    setIsRecording(false)
    if (intervalRef.current) clearInterval(intervalRef.current)
  }

  const toggleCamera = () => {
    if (stream) {
      stream.getVideoTracks().forEach(t => { t.enabled = !t.enabled })
      setIsCameraOn(prev => !prev)
    }
  }

  const toggleMic = () => {
    if (stream) {
      stream.getAudioTracks().forEach(t => { t.enabled = !t.enabled })
      setIsMicOn(prev => !prev)
    }
  }

  const formatTime = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`

  if (permissionGranted === null) {
    return (
      <div className={cn("bg-gray-900 rounded-2xl flex flex-col items-center justify-center p-12 text-center", className)}>
        <Video className="w-12 h-12 text-gray-400 mb-4" />
        <h3 className="text-white font-semibold mb-2">Camera & Microphone Access</h3>
        <p className="text-gray-400 text-sm mb-6 max-w-xs">
          GradProcess AI needs access to your camera and microphone to record your practice interview.
        </p>
        <button
          onClick={requestPermissions}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition-colors"
        >
          Grant Access
        </button>
      </div>
    )
  }

  if (permissionGranted === false) {
    return (
      <div className={cn("bg-gray-900 rounded-2xl flex flex-col items-center justify-center p-12 text-center", className)}>
        <VideoOff className="w-12 h-12 text-red-400 mb-4" />
        <h3 className="text-white font-semibold mb-2">Permission Denied</h3>
        <p className="text-gray-400 text-sm mb-4">
          Please allow camera and microphone access in your browser settings, then refresh the page.
        </p>
        <button onClick={requestPermissions} className="flex items-center gap-2 text-blue-400 text-sm hover:text-blue-300">
          <RotateCcw className="w-4 h-4" /> Try again
        </button>
      </div>
    )
  }

  return (
    <div className={cn("bg-gray-900 rounded-2xl overflow-hidden", className)}>
      {/* Video preview */}
      <div className="relative aspect-video bg-black">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover"
          style={{ transform: "scaleX(-1)" }}
        />
        {!isCameraOn && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
            <VideoOff className="w-12 h-12 text-gray-500" />
          </div>
        )}
        {isRecording && (
          <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-600 text-white px-3 py-1.5 rounded-lg">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span className="text-sm font-bold">{formatTime(elapsed)}</span>
          </div>
        )}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/50 text-xs">
          {maxDuration - elapsed}s remaining
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 p-4">
        <button
          onClick={toggleCamera}
          className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
            isCameraOn ? "bg-gray-700 text-white hover:bg-gray-600" : "bg-red-600 text-white"
          )}
        >
          {isCameraOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
        </button>
        <button
          onClick={toggleMic}
          className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
            isMicOn ? "bg-gray-700 text-white hover:bg-gray-600" : "bg-red-600 text-white"
          )}
        >
          {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
        </button>
        {!isRecording ? (
          <button
            onClick={startRecording}
            className="flex items-center gap-2 bg-red-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-red-700 transition-colors"
          >
            <Circle className="w-4 h-4" />
            Start Recording
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="flex items-center gap-2 bg-white text-gray-900 px-6 py-2.5 rounded-xl font-medium hover:bg-gray-100 transition-colors"
          >
            <Square className="w-4 h-4" />
            Stop Recording
          </button>
        )}
      </div>
    </div>
  )
}
