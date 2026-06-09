import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <div className="tera-page">
      <div className="tera-page-shell max-w-5xl pt-20 md:pt-10">
        <div className="tera-surface px-6 py-10 md:px-10 md:py-12">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-tera-border pb-6">
            <div>
              <p className="tera-eyebrow">Legal</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-tera-primary md:text-5xl">Privacy policy</h1>
            </div>
            <Link href="/terms" className="tera-button-secondary">
              View terms
            </Link>
          </div>

          <div className="tera-prose mt-8 prose-p:text-tera-secondary prose-li:text-tera-secondary prose-strong:text-tera-primary">
            <p className="text-base leading-8 text-tera-secondary">
              At Tera, we take your privacy seriously. This Privacy Policy explains how we collect, use, and protect your personal information when you use our AI-powered learning services.
            </p>

            <section>
              <h2>1. Information We Collect</h2>
              <ul>
                <li><strong>Account Information:</strong> We collect your email address so we can create and manage your account.</li>
                <li><strong>Usage Data:</strong> We collect information about how you interact with Tera, including prompts, tools used, and generated content.</li>
                <li><strong>Uploaded Content:</strong> Files and images you upload are processed securely for the features you request.</li>
              </ul>
            </section>

            <section>
              <h2>2. How We Use Your Information</h2>
              <ul>
                <li>Provide, maintain, and improve the product.</li>
                <li>Personalize your experience and generated output.</li>
                <li>Communicate with you about updates, support, and security issues.</li>
                <li>Analyze usage patterns to improve features and reliability.</li>
              </ul>
            </section>

            <section>
              <h2>3. Data Security</h2>
              <p>We use industry-standard protections, encrypted transport, and secure storage providers to reduce the risk of unauthorized access or disclosure.</p>
            </section>

            <section>
              <h2>4. Third-Party Services</h2>
              <p>Tera may rely on third-party model and infrastructure providers to process requests. Those providers are used only to deliver the service and operate under their own privacy and security obligations.</p>
            </section>

            <section>
              <h2>5. Contact</h2>
              <p>If you have questions about this Privacy Policy, contact us at teraaiguide@gmail.com.</p>
            </section>

            <p className="text-sm text-tera-secondary">Last updated: {new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
