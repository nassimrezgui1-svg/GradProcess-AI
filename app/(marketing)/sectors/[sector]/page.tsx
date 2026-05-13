import Link from "next/link"
import { sectorContent, sectors } from "@/lib/mock-data"
import { BookOpen, TrendingUp, Users, Briefcase, Code, Award, ArrowRight, ArrowLeft } from "lucide-react"

interface PageProps {
  params: Promise<{ sector: string }>
}

function getSectorKey(slug: string): string {
  if (slug === "management-consulting" || slug === "consulting") return "consulting"
  if (slug === "banking" || slug === "banking-financial-services") return "banking"
  return slug
}

export async function generateStaticParams() {
  return sectors.map(s => ({ sector: s.toLowerCase().replace(/ /g, "-") }))
}

export default async function SectorPage({ params }: PageProps) {
  const { sector: slug } = await params
  const key = getSectorKey(slug)
  const data = sectorContent[key]

  const sectorName = slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")

  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#0a0f1e] to-[#1e293b] pt-32 pb-16 px-6">
        <div className="max-w-7xl mx-auto">
          <Link href="/sectors" className="inline-flex items-center gap-2 text-gray-400 text-sm mb-6 hover:text-gray-200 transition-colors">
            <ArrowLeft className="w-4 h-4" /> All Sectors
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">{data?.name || sectorName}</h1>
          {data?.overview && (
            <p className="text-xl text-gray-300 max-w-3xl leading-relaxed">{data.overview}</p>
          )}
        </div>
      </section>

      {data ? (
        <section className="py-16 px-6 bg-gray-50">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Trends */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                <h3 className="font-bold text-gray-900">Current Trends</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {data.trends.map(t => (
                  <span key={t} className="text-sm bg-blue-50 text-blue-700 border border-blue-100 px-3 py-1.5 rounded-full">{t}</span>
                ))}
              </div>
            </div>

            {/* Graduate roles */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Briefcase className="w-5 h-5 text-purple-500" />
                <h3 className="font-bold text-gray-900">Graduate Roles</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {data.graduateRoles.map(r => (
                  <span key={r} className="text-sm bg-purple-50 text-purple-700 border border-purple-100 px-3 py-1.5 rounded-full">{r}</span>
                ))}
              </div>
            </div>

            {/* Technical areas */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Code className="w-5 h-5 text-orange-500" />
                <h3 className="font-bold text-gray-900">Technical Areas</h3>
              </div>
              <ul className="space-y-2">
                {data.technicalAreas.map(a => (
                  <li key={a} className="text-sm text-gray-700 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0" />
                    {a}
                  </li>
                ))}
              </ul>
            </div>

            {/* Certifications */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Award className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-gray-900">Relevant Certifications</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {data.certifications.map(c => (
                  <span key={c} className="text-sm bg-amber-50 text-amber-700 border border-amber-100 px-3 py-1.5 rounded-full">{c}</span>
                ))}
              </div>
            </div>

            {/* Interview questions */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 md:col-span-2">
              <h3 className="font-bold text-gray-900 mb-4">Sector-Specific Interview Questions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {data.interviewQuestions.map((q, i) => (
                  <div key={i} className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</span>
                    <p className="text-sm text-gray-700">{q}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="py-20 px-6 bg-gray-50">
          <div className="max-w-3xl mx-auto text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Content Coming Soon</h2>
            <p className="text-gray-500 mb-6">
              Full sector content for <strong>{sectorName}</strong> is currently being developed. Sign up to be notified when it launches.
            </p>
            <Link href="/signup" className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors">
              Get notified <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-16 px-6 bg-gradient-to-br from-[#0a0f1e] to-[#1e293b] text-center">
        <h2 className="text-3xl font-bold text-white mb-4">Practice {sectorName} interviews on GradProcess AI</h2>
        <Link href="/signup" className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-blue-700 transition-colors">
          Start free <ArrowRight className="w-4 h-4" />
        </Link>
      </section>
    </div>
  )
}
