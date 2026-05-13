"use client"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Clock, CheckCircle, XCircle } from "lucide-react"

interface Question {
  id: string
  question: string
  options: string[]
  correct: number
  explanation: string
  timeLimit?: number
  passage?: string
}

interface QuestionCardProps {
  question: Question
  questionNumber: number
  totalQuestions: number
  onAnswer: (selectedIndex: number, isCorrect: boolean) => void
  showExplanation?: boolean
}

export function QuestionCard({ question, questionNumber, totalQuestions, onAnswer, showExplanation = false }: QuestionCardProps) {
  const [selected, setSelected] = useState<number | null>(null)
  const [timeLeft, setTimeLeft] = useState(question.timeLimit || 75)
  const [answered, setAnswered] = useState(false)

  useEffect(() => {
    setSelected(null)
    setAnswered(false)
    setTimeLeft(question.timeLimit || 75)
  }, [question.id, question.timeLimit])

  useEffect(() => {
    if (answered) return
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          if (!answered) {
            setAnswered(true)
            onAnswer(-1, false)
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [answered, onAnswer])

  const handleSelect = (idx: number) => {
    if (answered) return
    setSelected(idx)
    setAnswered(true)
    onAnswer(idx, idx === question.correct)
  }

  const timerColor = timeLeft > 30 ? "text-green-600" : timeLeft > 10 ? "text-amber-600" : "text-red-600"

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
        <span className="text-sm font-medium text-gray-500">
          Question {questionNumber} of {totalQuestions}
        </span>
        <div className={cn("flex items-center gap-1.5 font-bold text-sm", timerColor)}>
          <Clock className="w-4 h-4" />
          {timeLeft}s
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-gray-100">
        <div
          className="h-full bg-blue-600 transition-all duration-1000"
          style={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
        />
      </div>

      <div className="p-6">
        {/* Passage (for verbal) */}
        {question.passage && (
          <div className="bg-gray-50 rounded-xl p-4 mb-4 text-sm text-gray-700 leading-relaxed border border-gray-200">
            {question.passage}
          </div>
        )}

        {/* Question */}
        <p className="text-base font-medium text-gray-900 mb-6 leading-relaxed">{question.question}</p>

        {/* Options */}
        <div className="space-y-3">
          {question.options.map((option, idx) => {
            const isSelected = selected === idx
            const isCorrect = idx === question.correct
            let optionStyle = "border-gray-200 hover:border-blue-300 hover:bg-blue-50"

            if (answered) {
              if (isCorrect) optionStyle = "border-green-400 bg-green-50"
              else if (isSelected && !isCorrect) optionStyle = "border-red-400 bg-red-50"
              else optionStyle = "border-gray-200 opacity-60"
            } else if (isSelected) {
              optionStyle = "border-blue-500 bg-blue-50"
            }

            return (
              <button
                key={idx}
                onClick={() => handleSelect(idx)}
                disabled={answered}
                className={cn(
                  "w-full text-left px-4 py-3 rounded-xl border-2 transition-all text-sm font-medium flex items-center gap-3",
                  optionStyle
                )}
              >
                <span className="w-6 h-6 rounded-full border-2 border-current flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="flex-1">{option}</span>
                {answered && isCorrect && <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />}
                {answered && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />}
              </button>
            )
          })}
        </div>

        {/* Explanation */}
        {answered && showExplanation && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <p className="text-xs font-semibold text-blue-700 mb-1">Explanation</p>
            <p className="text-sm text-blue-800">{question.explanation}</p>
          </div>
        )}
      </div>
    </div>
  )
}
