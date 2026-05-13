import Link from "next/link"
import { ArrowRight, BookOpen } from "lucide-react"
import { sectors } from "@/lib/mock-data"

const sectorDescriptions: Record<string, string> = {
  "Banking": "Retail, commercial, and corporate banking. Understanding credit, capital markets, and regulatory frameworks.",
  "Investment Banking": "M&A advisory, capital markets, equity and debt issuance. High intensity, high reward.",
  "Consulting": "Strategy, operations, and transformation consulting. MECE thinking, frameworks, and client impact.",
  "Asset Management": "Portfolio construction, fund management, and investment strategy across equity, fixed income, and alternatives.",
  "Wealth Management": "Private client advisory, financial planning, and relationship-based investment services.",
  "Insurance": "Underwriting, actuarial science, claims, and risk management across life, general, and specialty lines.",
  "Technology": "Software engineering, product management, data science, and technical consulting at top tech firms.",
  "Law": "Corporate, finance, and litigation law. Solicitor and barrister training programmes.",
  "Engineering": "Civil, mechanical, electrical, and chemical engineering graduate programmes at major firms.",
  "FMCG": "Brand management, commercial, supply chain, and marketing at fast-moving consumer goods giants.",
  "Energy": "Oil & gas, renewables, utilities, and energy transition roles at major energy companies.",
  "Healthcare": "Pharmaceutical, medical devices, NHS leadership, and healthcare consulting.",
  "Public Sector": "Civil Service Fast Stream, NHS, and government graduate schemes.",
}

export default function SectorsPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#0a0f1e] to-[#1e293b] pt-32 pb-16 px-6 text-center">
        <h1 className="text-5xl font-bold text-white mb-4">13 sectors. Deep preparation.</h1>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          GradProcess AI has sector-specific content for every major graduate scheme category in the UK and beyond.
        </p>
      </section>

      {/* Sector grid */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sectors.map(sector => (
              <Link
                key={sector}
                href={`/sectors/${sector.toLowerCase().replace(/ /g, "-")}`}
                className="bg-white rounded-2xl border border-gray-100 p-6 hover:border-blue-300 hover:shadow-md transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{sector}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {sectorDescriptions[sector] || "In-depth sector preparation covering trends, technical skills, and interview questions."}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-gradient-to-br from-[#0a0f1e] to-[#1e293b] text-center">
        <h2 className="text-3xl font-bold text-white mb-4">Access all 13 sectors with Pro Student</h2>
        <p className="text-gray-300 mb-8">Deep content, commercial awareness quizzes, and sector-specific interview prep</p>
        <Link
          href="/signup"
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-blue-700 transition-colors"
        >
          Start free <ArrowRight className="w-4 h-4" />
        </Link>
      </section>
    </div>
  )
}
