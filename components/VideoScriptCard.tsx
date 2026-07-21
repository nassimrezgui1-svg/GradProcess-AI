"use client"
import { useState } from "react"
import { ChevronDown, ChevronUp, FileVideo } from "lucide-react"

const SCRIPT = `Graduate recruitment is competitive, fast-moving and often unclear. Most candidates prepare one stage at a time — a CV review here, a mock interview there, a few psychometric questions the night before. But real hiring processes are connected. Your CV shapes your interview. Your motivation affects your final round. Your commercial awareness shows up across every stage.

GradProcess AI helps you practise the full process before it counts. From CV screening and motivational answers to psychometrics, video interviews, competency stories, sector knowledge, SJT, case studies and final interviews, you get a complete simulation of what employers actually test.

At the end, you receive a readiness score, stage-by-stage feedback, priority weaknesses and a personalised preparation plan — so you know exactly what to improve next.

Practise the process. Build confidence. Walk into the real assessment prepared.`

export function VideoScriptCard() {
  const [open, setOpen] = useState(false)

  return (
    <div className="border border-gray-200 rounded-2xl bg-gray-50 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <FileVideo className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Suggested video script</p>
            <p className="text-xs text-gray-500">Use this to create your hero video with AI tools like Higgsfield or Runway</p>
          </div>
        </div>
        {open
          ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0 ml-4" />
          : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0 ml-4" />}
      </button>

      {open && (
        <div className="px-6 pb-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 mt-4 mb-3 font-medium uppercase tracking-wide">Script — 60–90 seconds</p>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-sm text-gray-700 leading-relaxed whitespace-pre-line">
            {SCRIPT}
          </div>
          <p className="text-xs text-gray-400 mt-3">
            Recommended: record as a narrated screen capture or AI-generated cinematic video · Place the final file at{" "}
            <code className="text-blue-500 font-mono">public/assets/gradprocess-ai-hero.mp4</code>
          </p>
        </div>
      )}
    </div>
  )
}
