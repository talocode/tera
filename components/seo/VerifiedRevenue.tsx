export default function VerifiedRevenue({ className = '' }: { className?: string }) {
  return (
    <section className={className}>
      <p className="tera-eyebrow">Verified revenue</p>
      <p className="mt-3 text-sm text-tera-secondary">
        TeraAI revenue, verified and published.
      </p>
      <iframe
        src="https://trustmrr.com/embed/tera?theme=light&period=30d&color=blue"
        title="TrustMRR verified revenue chart"
        width={640}
        height={360}
        style={{
          width: '100%',
          maxWidth: '640px',
          border: 0,
          borderRadius: '12px',
          overflow: 'hidden',
        }}
        loading="lazy"
      />
    </section>
  )
}
