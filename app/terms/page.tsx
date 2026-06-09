import Link from 'next/link'

export default function TermsPage() {
  return (
    <div className="tera-page">
      <div className="tera-page-shell max-w-5xl pt-20 md:pt-10">
        <div className="tera-surface px-6 py-10 md:px-10 md:py-12">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-tera-border pb-6">
            <div>
              <p className="tera-eyebrow">Legal</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-tera-primary md:text-4xl lg:text-5xl">Terms and conditions</h1>
            </div>
            <Link href="/privacy" className="tera-button-secondary">
              View privacy policy
            </Link>
          </div>

          <div className="tera-prose mt-8 prose-p:text-tera-secondary prose-li:text-tera-secondary prose-strong:text-tera-primary">
            <p className="text-base leading-8 text-tera-secondary">
              By accessing or using Tera, you agree to the following terms. If you do not agree, do not use the service.
            </p>

            <section>
              <h2>1. Acceptance of Terms</h2>
              <p>Creating an account or using Tera means you agree to comply with these terms and any policies referenced alongside them.</p>
            </section>

            <section>
              <h2>2. Description of Service</h2>
              <p>Tera is an AI learning companion designed to help users learn, research, write, and organize information. The service may evolve over time.</p>
            </section>

            <section>
              <h2>3. User Conduct</h2>
              <ul>
                <li>Do not use the product for illegal or unauthorized purposes.</li>
                <li>Do not attempt to bypass security, access controls, or payment restrictions.</li>
                <li>Do not use the service to generate harmful or abusive content.</li>
                <li>Do not share account credentials with unauthorized users.</li>
              </ul>
            </section>

            <section>
              <h2>4. AI Disclaimer</h2>
              <p>AI-generated outputs can be wrong or incomplete. You are responsible for reviewing and verifying important content before relying on it professionally, educationally, financially, medically, or legally.</p>
            </section>

            <section>
              <h2>5. Intellectual Property</h2>
              <p>You retain rights to the content you provide and, subject to applicable law and these terms, the outputs generated for you. Tera retains rights in the software, product design, and underlying systems.</p>
            </section>

            <section>
              <h2>6. Termination</h2>
              <p>We may suspend or terminate access if these terms are violated or if we need to protect the service and its users.</p>
            </section>

            <section>
              <h2>7. Changes</h2>
              <p>We may update these terms from time to time. Continued use of the service after changes take effect constitutes acceptance of the revised terms.</p>
            </section>

            <p className="text-sm text-tera-secondary">Last updated: {new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
