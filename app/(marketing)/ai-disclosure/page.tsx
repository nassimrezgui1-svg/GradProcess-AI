import type { Metadata } from "next"
import Link from "next/link"
import { Brain, Shield, AlertCircle, CheckCircle } from "lucide-react"

export const metadata: Metadata = {
  title: "AI Use Disclosure | GradProcess AI",
  description: "How GradProcess AI uses artificial intelligence, what data is sent, and limitations you should know.",
}

const LAST_UPDATED = "11 May 2026"

export default function AiDisclosurePage() {
  return (
    <div className="min-h-screen bg-white pt-24 pb-20">
      <div className="max-w-3xl mx-auto px-6">
        {/* Header */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full mb-4" style={{ backgroundColor: "#EEE9FF", color: "#6D5EF3" }}>
            Legal
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">AI Use Disclosure</h1>
          <p className="text-gray-500 text-sm">Last updated: {LAST_UPDATED}</p>
          <p className="text-gray-600 mt-3 text-sm leading-relaxed">
            GradProcess AI uses artificial intelligence to provide feedback, analysis, and coaching.
            This page explains exactly how AI is used, what data is processed, and its limitations.
          </p>
        </div>

        {/* Key info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {[
            { icon: Brain, title: "Model Used", body: "Anthropic Claude (claude-3-5-sonnet / claude-3-opus)", color: "#6D5EF3" },
            { icon: Shield, title: "Data Sent", body: "Content only — never your name or email", color: "#10B981" },
            { icon: AlertCircle, title: "Limitations", body: "Guidance only, not a guarantee of outcomes", color: "#F59E0B" },
          ].map(({ icon: Icon, title, body, color }) => (
            <div key={title} className="p-4 rounded-2xl border border-gray-100 bg-gray-50">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: `${color}15` }}>
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
              <p className="text-xs font-semibold text-gray-700 mb-1">{title}</p>
              <p className="text-xs text-gray-500 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>

        <div className="space-y-8 text-gray-700 text-sm leading-relaxed">

          <Section title="1. AI Provider">
            <p>
              GradProcess AI uses <strong>Anthropic&apos;s Claude</strong> language models, accessed via the
              Anthropic API. Anthropic is a US AI safety company. Their data processing terms apply to
              content sent to their API. Anthropic does not use API inputs to train their models by default.
            </p>
            <p>
              <a href="https://www.anthropic.com/legal/privacy" target="_blank" rel="noopener noreferrer"
                className="underline" style={{ color: "#6D5EF3" }}>
                Anthropic Privacy Policy →
              </a>
            </p>
          </Section>

          <Section title="2. Where AI Is Used">
            <div className="space-y-3">
              {[
                {
                  feature: "CV Tailoring & ATS Scoring",
                  what: "Your CV text and the job description you provide",
                  output: "ATS score, keyword gaps, tailored bullet suggestions",
                },
                {
                  feature: "STAR Builder",
                  what: "The situation/task/action/result text you write",
                  output: "Structured STAR feedback, suggested improvements",
                },
                {
                  feature: "Video Interview Coaching",
                  what: "Your spoken transcript (audio-to-text) and interview question",
                  output: "Content score, delivery feedback, STAR structure rating",
                },
                {
                  feature: "Application Tracker — AI Breakdown",
                  what: "Company name, role title, sector, and job description text",
                  output: "Role summary, interview questions, prep roadmap, readiness score",
                },
                {
                  feature: "Application Tracker — Role Extraction",
                  what: "Job description text you paste in",
                  output: "Structured role fields (company, sector, skills, deadline)",
                },
                {
                  feature: "Ava — AI Coach",
                  what: "Your typed message and short conversation history",
                  output: "Coaching guidance and answers to preparation questions",
                },
                {
                  feature: "Industry Hub — AI Insights",
                  what: "Your selected sector",
                  output: "Commercial themes, watchlist, talking points for interviews",
                },
                {
                  feature: "Full Process Exam",
                  what: "Your exam answers and the question set",
                  output: "Score, model answer, explanations",
                },
              ].map(r => (
                <div key={r.feature} className="p-4 rounded-xl border border-gray-100 bg-gray-50">
                  <p className="font-semibold text-gray-800 text-xs mb-2">{r.feature}</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Data sent to AI</p>
                      <p className="text-xs text-gray-600">{r.what}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">AI output</p>
                      <p className="text-xs text-gray-600">{r.output}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section title="3. What We Never Send to the AI">
            <div className="space-y-2">
              {[
                "Your name, email address, or account identifiers",
                "Your payment information",
                "Other users' data",
                "Passwords or authentication credentials",
                "Raw video or audio files (only transcribed text is sent)",
              ].map(item => (
                <div key={item} className="flex items-center gap-2.5 text-xs text-gray-700">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </Section>

          <Section title="4. Prompt Injection Protection">
            <p>
              User-supplied content (CVs, job descriptions, transcripts) is wrapped in explicit boundaries
              before being sent to the AI. This instructs the model to treat the content as data only and
              ignore any instructions that might appear within uploaded documents.
            </p>
            <p>
              We also apply content length limits and output validation to reduce the risk of unexpected AI behaviour.
            </p>
          </Section>

          <Section title="5. AI Limitations — Important">
            <div className="p-4 rounded-xl border border-amber-100 bg-amber-50 mb-4">
              <p className="text-xs font-semibold text-amber-800 mb-2 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" /> Please read carefully
              </p>
              <ul className="space-y-1.5 text-xs text-amber-800 list-disc pl-4">
                <li>AI scores and feedback are <strong>guidance only</strong> — not a prediction of actual interview or application outcomes</li>
                <li>Body language analysis is experimental and may be inaccurate</li>
                <li>ATS scores are estimates based on keyword matching — actual ATS systems vary widely</li>
                <li>AI may hallucinate company details or role information — always verify independently</li>
                <li>Interview questions suggested by AI are examples only, not guaranteed to appear</li>
                <li>Do not rely solely on AI feedback — seek guidance from careers advisers and mentors</li>
              </ul>
            </div>
          </Section>

          <Section title="6. Human Review">
            <p>
              GradProcess AI does not employ human reviewers who read your CV, recordings, or practice sessions.
              All feedback is generated automatically by AI models. You should treat all AI output as one data
              point, not as definitive professional advice.
            </p>
          </Section>

          <Section title="7. Data Retention by Anthropic">
            <p>
              By default, Anthropic does not retain API request data beyond 30 days for trust and safety
              monitoring. They do not use API data to train their models without explicit consent from API customers.
              GradProcess AI has not granted Anthropic permission to use your data for model training.
            </p>
          </Section>

          <Section title="8. Your Controls">
            <ul className="list-disc pl-5 space-y-1.5">
              <li>You can disable AI feedback for practice sessions in the recording consent modal</li>
              <li>You can delete your recordings and transcripts at any time</li>
              <li>You can export all your data including AI-generated content via Settings → Privacy</li>
            </ul>
          </Section>

          <div className="mt-12 p-5 rounded-2xl border border-gray-100 bg-gray-50">
            <p className="text-xs text-gray-500">
              Questions about our AI use? Email us at{" "}
              <a href="mailto:ai@gradprocess.ai" className="underline" style={{ color: "#6D5EF3" }}>ai@gradprocess.ai</a>.
              See also our{" "}
              <Link href="/privacy" className="underline" style={{ color: "#6D5EF3" }}>Privacy Policy</Link> and{" "}
              <Link href="/terms" className="underline" style={{ color: "#6D5EF3" }}>Terms of Service</Link>.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-base font-bold text-gray-900 mb-3">{title}</h2>
      <div className="space-y-2.5">{children}</div>
    </section>
  )
}
