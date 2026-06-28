import type { Metadata } from 'next'
import Link from 'next/link'
import FaqSection from '@/components/seo/FaqSection'
import JsonLd from '@/components/seo/JsonLd'
import SeoFooter from '@/components/seo/SeoFooter'
import { buildPageMetadata, faqPageSchema } from '@/lib/seo'

const faqs = [
  {
    question: 'What is an AI learning companion?',
    answer:
      'An AI learning companion is a tool designed to help you understand topics over time—not just answer one question. It supports explanation, follow-up questions, research, notes, and turning what you learn into next steps.',
  },
  {
    question: 'How is TeraAI different from a normal chatbot?',
    answer:
      'TeraAI is built around learning workflows: clearer explanations, cited web research when you need current information, specialized tools, notes, and conversation history in one workspace.',
  },
  {
    question: 'Can TeraAI help with research?',
    answer:
      'Yes. TeraAI supports web-backed research with citations on supported plans, and deeper research modes on Pro and Plus.',
  },
  {
    question: 'Can TeraAI help me understand difficult topics?',
    answer:
      'Yes. You can ask for step-by-step explanations, examples, comparisons, and follow-up questions until the idea clicks.',
  },
  {
    question: 'Is TeraAI only for students?',
    answer:
      'No. Students use TeraAI for study and exam prep, but self-learners, researchers, and builders also use it to explore ideas and plan projects.',
  },
  {
    question: 'Can I use TeraAI to build projects from what I learn?',
    answer:
      'Yes. Many people use TeraAI to move from understanding a topic to outlining a project, comparing approaches, and keeping notes organized as they build.',
  },
]

export const metadata: Metadata = buildPageMetadata({
  title: 'AI Learning Companion for Deep Understanding | TeraAI',
  description:
    'TeraAI is an AI learning companion that helps you understand difficult topics, research clearly, and turn what you study into real projects.',
  path: '/ai-learning-companion',
})

export default function AiLearningCompanionPage() {
  return (
    <div className="tera-page">
      <JsonLd data={faqPageSchema(faqs)} />
      <div className="tera-page-shell pt-20 md:pt-10">
        <section className="tera-surface overflow-hidden px-6 py-10 md:px-10 md:py-14">
          <div className="max-w-4xl">
            <p className="tera-eyebrow">AI learning companion</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-tera-primary md:text-5xl lg:text-6xl">
              AI Learning Companion for Deep Understanding
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-8 text-tera-secondary md:text-lg">
              TeraAI helps you learn difficult topics, research clearly, and turn what you study into real projects.
            </p>
            <div className="mt-8">
              <Link href="/new" className="tera-button-primary">
                Start learning with TeraAI
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-8 tera-card">
          <h2 className="text-2xl font-semibold text-tera-primary">What is an AI learning companion?</h2>
          <p className="mt-4 text-sm leading-7 text-tera-secondary md:text-base">
            A learning companion focuses on understanding, not just quick replies. It helps you ask better questions,
            connect ideas, and keep context as you work through a topic.
          </p>
        </section>

        <section className="mt-8 tera-card">
          <h2 className="text-2xl font-semibold text-tera-primary">
            Why normal chatbots are not enough for deep learning
          </h2>
          <p className="mt-4 text-sm leading-7 text-tera-secondary md:text-base">
            One-off answers can help, but deep learning needs continuity: follow-ups, sources, notes, and a workspace
            that remembers what you are working on.
          </p>
        </section>

        <section className="mt-8 tera-card">
          <h2 className="text-2xl font-semibold text-tera-primary">How TeraAI helps you learn</h2>
          <ul className="mt-4 space-y-3 text-sm leading-7 text-tera-secondary">
            <li>Explain complex ideas in plain language</li>
            <li>Ask better follow-up questions</li>
            <li>Research topics with cited web answers when needed</li>
            <li>Connect concepts across a thread</li>
            <li>Turn knowledge into project plans and next steps</li>
          </ul>
        </section>

        <section className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="tera-card">
            <h2 className="text-xl font-semibold text-tera-primary">Who TeraAI is for</h2>
            <ul className="mt-4 space-y-2 text-sm leading-7 text-tera-secondary">
              <li>Students</li>
              <li>Self learners</li>
              <li>Researchers</li>
              <li>Builders</li>
            </ul>
          </div>
          <div className="tera-card-subtle px-6 py-6">
            <h2 className="text-xl font-semibold text-tera-primary">Example workflows</h2>
            <ul className="mt-4 space-y-2 text-sm leading-7 text-tera-secondary">
              <li>Understand a topic step by step</li>
              <li>Compare sources and viewpoints</li>
              <li>Prepare for exams with guided review</li>
              <li>Research a project idea</li>
              <li>Create a learning roadmap</li>
            </ul>
          </div>
        </section>

        <section className="mt-8 tera-card-subtle px-6 py-6">
          <h2 className="text-xl font-semibold text-tera-primary">Related guides</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/" className="tera-button-secondary">
              Homepage
            </Link>
            <Link href="/ai-study-assistant" className="tera-button-secondary">
              AI study assistant
            </Link>
            <Link href="/ai-research-assistant" className="tera-button-secondary">
              AI research assistant
            </Link>
          </div>
        </section>

        <FaqSection items={faqs} />
        <SeoFooter />
      </div>
    </div>
  )
}
