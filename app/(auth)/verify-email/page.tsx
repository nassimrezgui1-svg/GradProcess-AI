"use client"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Mail, ArrowLeft } from "lucide-react"
import { Suspense } from "react"

function VerifyContent() {
  const params = useSearchParams()
  const email = params.get("email") ?? "your email"

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ backgroundColor: "#EEE9FF" }}>
          <Mail className="w-7 h-7" style={{ color: "#6D5EF3" }} />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Verify your email</h1>
        <p className="text-sm text-gray-500 leading-relaxed mb-6">
          We&apos;ve sent a confirmation link to{" "}
          <span className="font-medium text-gray-700">{email}</span>.
          Click the link to activate your account.
        </p>
        <p className="text-xs text-gray-400 mb-6">
          Didn&apos;t receive it? Check your spam folder. The link expires in 24 hours.
        </p>
        <Link
          href="/login"
          className="flex items-center justify-center gap-2 text-sm font-medium"
          style={{ color: "#6D5EF3" }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to sign in
        </Link>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="w-full max-w-md h-48 bg-white rounded-2xl animate-pulse" />}>
      <VerifyContent />
    </Suspense>
  )
}
