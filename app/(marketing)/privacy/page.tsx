import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Privacy Policy | GradProcess AI",
  description: "How GradProcess AI collects, uses, and protects your personal data.",
}

const LAST_UPDATED = "11 May 2026"
const CONTACT_EMAIL = "privacy@gradprocess.ai"

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white pt-24 pb-20">
      <div className="max-w-3xl mx-auto px-6">
        {/* Header */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full mb-4" style={{ backgroundColor: "#EEE9FF", color: "#6D5EF3" }}>
            Legal
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Privacy Policy</h1>
          <p className="text-gray-500 text-sm">Last updated: {LAST_UPDATED}</p>
        </div>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-700 text-sm leading-relaxed">

          <Section title="1. Who We Are">
            <p>
              GradProcess AI Ltd (&ldquo;GradProcess AI&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) operates the platform at{" "}
              <strong>app.gradprocess.ai</strong>. We are the data controller for personal data processed through our services.
            </p>
            <p>
              Contact: <a href={`mailto:${CONTACT_EMAIL}`} className="underline" style={{ color: "#6D5EF3" }}>{CONTACT_EMAIL}</a>
            </p>
          </Section>

          <Section title="2. Data We Collect">
            <SubHeading>Account data</SubHeading>
            <p>Name, email address, university, degree, and graduation year — provided during signup.</p>

            <SubHeading>Practice session data</SubHeading>
            <p>
              Video recordings, audio, and transcripts from interview practice sessions — only collected after you
              give explicit recording consent. You may opt out of saving recordings or transcripts at any time.
            </p>

            <SubHeading>CV and job description data</SubHeading>
            <p>Documents you upload for CV tailoring and ATS scoring. These are stored encrypted and processed only to provide our services.</p>

            <SubHeading>Application tracker data</SubHeading>
            <p>Job opportunities, notes, and stage history you enter into the Application Tracker.</p>

            <SubHeading>Usage data</SubHeading>
            <p>Log data, IP address, browser type, pages visited, and feature usage — used to improve the platform and detect security issues.</p>

            <SubHeading>Payment data</SubHeading>
            <p>Billing is handled by Stripe. We do not store card numbers or financial credentials. We receive only subscription status and masked card information from Stripe.</p>
          </Section>

          <Section title="3. How We Use Your Data">
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Provide, operate, and improve the GradProcess AI platform</li>
              <li>Generate AI-powered feedback on your CV, interview practice, and applications</li>
              <li>Send transactional emails (account verification, password reset, session reminders)</li>
              <li>Detect and prevent fraud, abuse, and security incidents</li>
              <li>Comply with legal obligations</li>
              <li>Analytics cookies — only if you consent</li>
              <li>Marketing communications — only if you opt in separately</li>
            </ul>
            <p>We do <strong>not</strong> sell your personal data to third parties.</p>
          </Section>

          <Section title="4. AI Processing">
            <p>
              Your CV text, job descriptions, practice transcripts, and other content are sent to{" "}
              <strong>Anthropic&apos;s Claude API</strong> to generate feedback and scores. Please see our{" "}
              <Link href="/ai-disclosure" className="underline" style={{ color: "#6D5EF3" }}>AI Use Disclosure</Link>{" "}
              for full details. We send only the minimum content required; we do not send your name or email to Anthropic.
            </p>
          </Section>

          <Section title="5. Data Storage and Security">
            <p>
              Your data is stored on <strong>Supabase</strong> (hosted on AWS in the EU). All data is encrypted
              at rest (AES-256) and in transit (TLS 1.3). Video recordings are stored in Supabase Storage with
              private bucket policies — no public URLs are generated.
            </p>
            <p>
              We apply Row Level Security (RLS) on all database tables so your data is never accessible to
              other users. We maintain audit logs of security-relevant events.
            </p>
          </Section>

          <Section title="6. Data Retention">
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Active accounts:</strong> data retained while your account is active</li>
              <li><strong>Video recordings:</strong> retained until you delete them or your account</li>
              <li><strong>Deleted recordings/transcripts:</strong> permanently removed within 30 days</li>
              <li><strong>Deleted accounts:</strong> personal data purged within 30 days; anonymised analytics data may be retained</li>
              <li><strong>Audit logs:</strong> retained for 12 months for security purposes</li>
            </ul>
          </Section>

          <Section title="7. Your Rights (GDPR)">
            <p>If you are in the UK or EEA, you have the right to:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Access</strong> — request a copy of your personal data (Settings → Privacy → Export My Data)</li>
              <li><strong>Rectification</strong> — correct inaccurate data via your profile settings</li>
              <li><strong>Erasure</strong> — delete your account and all associated data (Settings → Security → Delete Account)</li>
              <li><strong>Restriction</strong> — limit processing in certain circumstances</li>
              <li><strong>Portability</strong> — receive your data in a machine-readable format</li>
              <li><strong>Object</strong> — object to processing based on legitimate interests</li>
              <li><strong>Withdraw consent</strong> — for recording consent or marketing at any time</li>
            </ul>
            <p>
              To exercise any right, contact <a href={`mailto:${CONTACT_EMAIL}`} className="underline" style={{ color: "#6D5EF3" }}>{CONTACT_EMAIL}</a>.
              We will respond within 30 days. You may also lodge a complaint with the ICO (UK) at{" "}
              <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: "#6D5EF3" }}>ico.org.uk</a>.
            </p>
          </Section>

          <Section title="8. Cookies">
            <p>We use the following categories of cookies:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Essential:</strong> authentication, security, session management — always on</li>
              <li><strong>Analytics:</strong> usage statistics to improve the product — opt-in only</li>
              <li><strong>Marketing:</strong> personalised advertising — opt-in only</li>
            </ul>
            <p>Manage your preferences in Settings → Privacy → Cookie Preferences.</p>
          </Section>

          <Section title="9. Third-Party Services">
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Supabase</strong> — database, authentication, file storage</li>
              <li><strong>Anthropic</strong> — AI language model for feedback generation</li>
              <li><strong>Stripe</strong> — payment processing</li>
              <li><strong>Google</strong> — optional SSO sign-in (if you choose to use it)</li>
            </ul>
            <p>Each provider has its own privacy policy and data processing agreements.</p>
          </Section>

          <Section title="10. Children">
            <p>
              GradProcess AI is intended for users aged 16 and over. We do not knowingly collect data from
              children under 16. If you believe a child under 16 has provided data, please contact us immediately.
            </p>
          </Section>

          <Section title="11. Changes to This Policy">
            <p>
              We may update this policy periodically. We will notify you of material changes by email or an
              in-app notice at least 14 days before the changes take effect.
            </p>
          </Section>

          <div className="mt-12 p-5 rounded-2xl border border-gray-100 bg-gray-50">
            <p className="text-xs text-gray-500">
              Questions about this policy? Email us at{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="underline" style={{ color: "#6D5EF3" }}>{CONTACT_EMAIL}</a>.
              See also our{" "}
              <Link href="/terms" className="underline" style={{ color: "#6D5EF3" }}>Terms of Service</Link> and{" "}
              <Link href="/ai-disclosure" className="underline" style={{ color: "#6D5EF3" }}>AI Use Disclosure</Link>.
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

function SubHeading({ children }: { children: React.ReactNode }) {
  return <p className="font-semibold text-gray-800 mt-3 mb-1">{children}</p>
}
