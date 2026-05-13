import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Terms of Service | GradProcess AI",
  description: "GradProcess AI terms of service, acceptable use, and subscription terms.",
}

const LAST_UPDATED = "11 May 2026"
const CONTACT_EMAIL = "legal@gradprocess.ai"

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white pt-24 pb-20">
      <div className="max-w-3xl mx-auto px-6">
        {/* Header */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full mb-4" style={{ backgroundColor: "#EEE9FF", color: "#6D5EF3" }}>
            Legal
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Terms of Service</h1>
          <p className="text-gray-500 text-sm">Last updated: {LAST_UPDATED}</p>
        </div>

        <div className="space-y-8 text-gray-700 text-sm leading-relaxed">

          <Section title="1. Acceptance of Terms">
            <p>
              By creating an account or using GradProcess AI (&ldquo;the Platform&rdquo;, &ldquo;Service&rdquo;), you agree to
              these Terms of Service and our <Link href="/privacy" className="underline" style={{ color: "#6D5EF3" }}>Privacy Policy</Link>.
              If you do not agree, do not use the Service.
            </p>
            <p>
              You must be at least 16 years old to use GradProcess AI. By using the Service, you confirm that
              you meet this age requirement.
            </p>
          </Section>

          <Section title="2. Description of Service">
            <p>
              GradProcess AI provides AI-powered tools to help students and graduates prepare for competitive
              graduate recruitment schemes, including CV tailoring, interview practice, psychometric test
              preparation, application tracking, and sector-specific commercial awareness content.
            </p>
            <p>
              The Service is provided &ldquo;as is&rdquo; for educational and preparation purposes only. AI-generated
              feedback, scores, and recommendations are guidance only and do not guarantee interview or
              application success.
            </p>
          </Section>

          <Section title="3. Account Registration">
            <ul className="list-disc pl-5 space-y-1.5">
              <li>You must provide accurate and complete information when creating an account</li>
              <li>You are responsible for maintaining the security of your password and account</li>
              <li>You must notify us immediately of any unauthorised account access</li>
              <li>You may not share your account credentials with others</li>
              <li>Each person may hold only one account</li>
            </ul>
          </Section>

          <Section title="4. Acceptable Use">
            <p>You agree <strong>not</strong> to:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Use the Service for any unlawful purpose or in violation of any regulations</li>
              <li>Attempt to gain unauthorised access to any part of the platform or another user&apos;s data</li>
              <li>Upload malicious code, viruses, or harmful content</li>
              <li>Use the Service to generate, store, or transmit content that is illegal, abusive, harassing, or defamatory</li>
              <li>Reverse engineer, decompile, or extract the source code of the Platform</li>
              <li>Use automated scripts or bots to access the Service without our written permission</li>
              <li>Misrepresent AI-generated feedback as your own original written work in actual job applications without review and amendment</li>
              <li>Resell or sublicense access to the Service</li>
            </ul>
          </Section>

          <Section title="5. AI-Generated Content">
            <p>
              GradProcess AI uses large language models (including Anthropic&apos;s Claude) to generate feedback,
              suggestions, and analysis. By using AI features, you acknowledge:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>AI feedback is for preparation guidance only — not a guarantee of interview outcomes</li>
              <li>AI outputs may occasionally contain errors or inaccuracies</li>
              <li>You should critically review all AI-generated content before use</li>
              <li>You retain ownership of content you upload; we do not claim ownership of your CV or recordings</li>
            </ul>
            <p>See our full <Link href="/ai-disclosure" className="underline" style={{ color: "#6D5EF3" }}>AI Use Disclosure</Link> for details.</p>
          </Section>

          <Section title="6. Recording Consent">
            <p>
              Video interview practice requires your explicit consent before camera and microphone access.
              You may revoke consent and delete recordings at any time via Settings. We will never share
              your recordings publicly or with third parties without your explicit consent.
            </p>
          </Section>

          <Section title="7. Subscription and Billing">
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Paid plans are billed monthly or annually in advance via Stripe</li>
              <li>Subscriptions automatically renew unless cancelled before the renewal date</li>
              <li>You can cancel at any time; access continues until the end of the billing period</li>
              <li>We do not offer pro-rata refunds for partial billing periods, except as required by law</li>
              <li>We reserve the right to modify pricing with 30 days&apos; notice</li>
              <li>Student discounts require a valid university email address</li>
            </ul>
          </Section>

          <Section title="8. Intellectual Property">
            <p>
              The GradProcess AI platform, including its design, code, AI prompts, and content, is owned by
              GradProcess AI Ltd and protected by copyright and other intellectual property laws.
            </p>
            <p>
              You retain all rights to content you upload (CVs, recordings, notes). By uploading content, you
              grant us a limited licence to process it solely to provide the Service to you.
            </p>
          </Section>

          <Section title="9. Disclaimer of Warranties">
            <p>
              The Service is provided &ldquo;as is&rdquo; without warranties of any kind. We do not warrant that the
              Service will be uninterrupted, error-free, or that AI feedback will be accurate or suitable for
              your specific situation. We are not liable for any employment decisions made by you or recruiters
              based on use of this platform.
            </p>
          </Section>

          <Section title="10. Limitation of Liability">
            <p>
              To the maximum extent permitted by law, GradProcess AI Ltd shall not be liable for indirect,
              incidental, special, or consequential damages arising from your use of the Service. Our total
              liability shall not exceed the amount you paid us in the 12 months preceding the claim.
            </p>
          </Section>

          <Section title="11. Termination">
            <p>
              We may suspend or terminate your account if you breach these Terms. You may close your account
              at any time via Settings. Upon termination, your personal data will be deleted in accordance
              with our <Link href="/privacy" className="underline" style={{ color: "#6D5EF3" }}>Privacy Policy</Link>.
            </p>
          </Section>

          <Section title="12. Governing Law">
            <p>
              These Terms are governed by the laws of England and Wales. Any disputes shall be subject to the
              exclusive jurisdiction of the courts of England and Wales.
            </p>
          </Section>

          <Section title="13. Changes to These Terms">
            <p>
              We may update these Terms from time to time. We will notify you of material changes at least 14
              days before they take effect. Continued use of the Service after changes constitutes acceptance
              of the updated Terms.
            </p>
          </Section>

          <div className="mt-12 p-5 rounded-2xl border border-gray-100 bg-gray-50">
            <p className="text-xs text-gray-500">
              Questions about these Terms? Email us at{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="underline" style={{ color: "#6D5EF3" }}>{CONTACT_EMAIL}</a>.
              See also our{" "}
              <Link href="/privacy" className="underline" style={{ color: "#6D5EF3" }}>Privacy Policy</Link> and{" "}
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
