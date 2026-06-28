type FaqItem = {
  question: string
  answer: string
}

type FaqSectionProps = {
  title?: string
  items: FaqItem[]
}

export default function FaqSection({ title = 'FAQ', items }: FaqSectionProps) {
  return (
    <section className="mt-8 tera-card">
      <p className="tera-eyebrow">{title}</p>
      <div className="mt-6 space-y-6">
        {items.map((item) => (
          <div key={item.question}>
            <h3 className="text-lg font-semibold text-tera-primary">{item.question}</h3>
            <p className="mt-2 text-sm leading-7 text-tera-secondary">{item.answer}</p>
          </div>
        ))}
      </div>
    </section>
  )
}