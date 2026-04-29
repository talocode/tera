'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { PLAN_CONFIGS } from '@/lib/plan-config'

type CurrencyConfig = {
  code: string
  symbol: string
  rate: number
}

type PaidPlan = 'pro' | 'plus'

const CURRENCY_CODES: Record<string, CurrencyConfig> = {
  USD: { code: 'USD', symbol: '$', rate: 1 },
  CAD: { code: 'CAD', symbol: 'CA$', rate: 1.35 },
  MXN: { code: 'MXN', symbol: 'Mex$', rate: 16.7 },
  EUR: { code: 'EUR', symbol: 'EUR ', rate: 0.92 },
  GBP: { code: 'GBP', symbol: 'GBP ', rate: 0.79 },
  CHF: { code: 'CHF', symbol: 'CHF ', rate: 0.9 },
  SEK: { code: 'SEK', symbol: 'SEK ', rate: 10.6 },
  NOK: { code: 'NOK', symbol: 'NOK ', rate: 10.7 },
  DKK: { code: 'DKK', symbol: 'DKK ', rate: 6.9 },
  PLN: { code: 'PLN', symbol: 'PLN ', rate: 3.95 },
  CZK: { code: 'CZK', symbol: 'CZK ', rate: 23.5 },
  HUF: { code: 'HUF', symbol: 'HUF ', rate: 360 },
  TRY: { code: 'TRY', symbol: 'TRY ', rate: 32.5 },
  JPY: { code: 'JPY', symbol: 'JPY ', rate: 154 },
  AUD: { code: 'AUD', symbol: 'A$', rate: 1.52 },
  NZD: { code: 'NZD', symbol: 'NZ$', rate: 1.65 },
  CNY: { code: 'CNY', symbol: 'CNY ', rate: 7.24 },
  HKD: { code: 'HKD', symbol: 'HK$', rate: 7.83 },
  SGD: { code: 'SGD', symbol: 'S$', rate: 1.35 },
  KRW: { code: 'KRW', symbol: 'KRW ', rate: 1375 },
  INR: { code: 'INR', symbol: 'INR ', rate: 83.5 },
  IDR: { code: 'IDR', symbol: 'IDR ', rate: 16100 },
  MYR: { code: 'MYR', symbol: 'MYR ', rate: 4.75 },
  PHP: { code: 'PHP', symbol: 'PHP ', rate: 57.5 },
  THB: { code: 'THB', symbol: 'THB ', rate: 36.8 },
  VND: { code: 'VND', symbol: 'VND ', rate: 25450 },
  TWD: { code: 'TWD', symbol: 'NT$', rate: 32.5 },
  AED: { code: 'AED', symbol: 'AED ', rate: 3.67 },
  SAR: { code: 'SAR', symbol: 'SAR ', rate: 3.75 },
  ILS: { code: 'ILS', symbol: 'ILS ', rate: 3.75 },
  ZAR: { code: 'ZAR', symbol: 'R', rate: 18.5 },
  NGN: { code: 'NGN', symbol: 'NGN ', rate: 1450 },
  EGP: { code: 'EGP', symbol: 'EGP ', rate: 47.5 },
  KES: { code: 'KES', symbol: 'KES ', rate: 130 },
  GHS: { code: 'GHS', symbol: 'GHS ', rate: 14.5 },
  BRL: { code: 'BRL', symbol: 'R$', rate: 5.15 },
  ARS: { code: 'ARS', symbol: 'ARS ', rate: 875 },
  CLP: { code: 'CLP', symbol: 'CLP ', rate: 950 },
  COP: { code: 'COP', symbol: 'COP ', rate: 3900 },
  PEN: { code: 'PEN', symbol: 'PEN ', rate: 3.75 },
}

const comparisonRows = [
  { feature: 'AI Conversations', free: 'Unlimited', pro: 'Unlimited', plus: 'Unlimited' },
  { feature: 'Monthly Credits', free: '150', pro: '1,500', plus: '5,000' },
  { feature: 'File Uploads per Day', free: '3', pro: '25', plus: 'Unlimited' },
  { feature: 'Max File Size', free: '10 MB', pro: '500 MB', plus: '2 GB' },
  { feature: 'Deep Research Mode', free: '-', pro: 'Yes', plus: 'Yes' },
  { feature: 'Export to PDF and Word', free: '-', pro: 'Yes', plus: 'Yes' },
  { feature: 'Priority Support', free: '-', pro: 'Yes', plus: '24/7' },
  { feature: 'Analytics Dashboard', free: '-', pro: '-', plus: 'Advanced' },
]

const faqs = [
  { q: 'Can I upgrade later?', a: 'Yes. You can move to Pro or Plus at any time, and the new limits apply immediately.' },
  { q: 'Is there a contract?', a: 'No. Plans are monthly and you can cancel anytime.' },
  { q: 'Do you offer refunds?', a: 'Yes. Paid plans include a 7-day money-back guarantee.' },
  { q: 'What payment methods are supported?', a: 'Major cards, PayPal, and other methods supported by Lemon Squeezy.' },
]

const convertPrice = (price: number, currencyCode: string) => {
  const currency = CURRENCY_CODES[currencyCode]
  if (!currency) return price
  return Math.round(price * currency.rate * 100) / 100
}

export default function PricingPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [currentPlan, setCurrentPlan] = useState<string | null>(null)
  const [currency, setCurrency] = useState<CurrencyConfig>(CURRENCY_CODES.USD)
  const [countryCode, setCountryCode] = useState('')

  useEffect(() => {
    const loadUserAndCurrency = async () => {
      try {
        const response = await fetch('/api/location/currency', { cache: 'no-store' })
        if (response.ok) {
          const data = await response.json()
          const currencyCode = data.currency || 'USD'
          setCurrency(CURRENCY_CODES[currencyCode] || CURRENCY_CODES.USD)
          setCountryCode(data.countryCode || '')
        }
      } catch (error) {
        setCurrency(CURRENCY_CODES.USD)
      }

      if (!user) return

      try {
        const response = await fetch('/api/billing/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id }),
        })

        const data = await response.json()
        if (data.success) {
          setCurrentPlan(data.plan)
        }
      } catch (error) {
        console.error('Error loading user plan:', error)
      }
    }

    void loadUserAndCurrency()
  }, [user])

  const handleCheckout = async (plan: PaidPlan) => {
    if (!user) {
      router.push('/auth/signin')
      return
    }

    if (currentPlan === plan) {
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/billing/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan,
          email: user.email,
          userId: user.id,
          currencyCode: currency.code,
          returnUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/profile`,
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.details || data.error || 'Failed to create checkout session')
      if (!data.checkoutUrl) throw new Error('No checkout URL returned')

      window.location.href = data.checkoutUrl
    } catch (error) {
      console.error('Checkout error:', error)
      const message = error instanceof Error ? error.message : 'Failed to initiate checkout'
      alert(`Error: ${message}. Please try again or contact support.`)
    } finally {
      setLoading(false)
    }
  }

  const plans = [
    {
      ...PLAN_CONFIGS.free,
      cta: 'Start Free',
      current: currentPlan === 'free',
      highlighted: false,
      displayPrice: 0,
    },
    {
      ...PLAN_CONFIGS.pro,
      cta: 'Upgrade to Pro',
      current: currentPlan === 'pro',
      highlighted: true,
      displayPrice: convertPrice(PLAN_CONFIGS.pro.price, currency.code),
    },
    {
      ...PLAN_CONFIGS.plus,
      cta: 'Upgrade to Plus',
      current: currentPlan === 'plus',
      highlighted: false,
      displayPrice: convertPrice(PLAN_CONFIGS.plus.price, currency.code),
    },
  ]

  return (
    <div className="tera-page">
      <div className="tera-page-shell pt-24 md:pt-10">
        <section className="tera-surface overflow-hidden px-6 py-10 md:px-10 md:py-12">
          <p className="tera-eyebrow">Pricing</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-tera-primary md:text-5xl">Choose the level of Tera that fits your work.</h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-tera-secondary">
            Conversations stay free. Upgrade when you need more computational credits, larger file limits, deeper research, or analytics.
          </p>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-[30px] border p-7 backdrop-blur-2xl ${plan.highlighted ? 'border-white/16 bg-tera-elevated/92 shadow-panel' : 'border-tera-border bg-tera-panel/78 shadow-soft-lg'}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="tera-eyebrow">Plan</p>
                  <h2 className="mt-3 text-2xl font-semibold text-tera-primary">{plan.displayName}</h2>
                  <p className="mt-3 text-sm leading-7 text-tera-secondary">{plan.description}</p>
                </div>
                {plan.highlighted && <span className="tera-badge border-tera-neon/20 bg-tera-highlight text-tera-neon">Popular</span>}
              </div>

              <div className="mt-8 border-t border-tera-border pt-6">
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-semibold tracking-[-0.04em] text-tera-primary">{currency.symbol}{plan.displayPrice.toFixed(2)}</span>
                  <span className="pb-1 text-sm text-tera-secondary">{plan.period}</span>
                </div>
                {currency.code !== 'USD' && (
                  <p className="mt-2 text-xs uppercase tracking-[0.22em] text-tera-secondary">{currency.code}{countryCode ? ` - ${countryCode}` : ''}</p>
                )}
              </div>

              <div className="mt-6 space-y-3 border-t border-tera-border pt-6">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-3 text-sm leading-7 text-tera-secondary">
                    <span className="mt-2 h-2.5 w-2.5 rounded-full bg-tera-neon" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <button
                type="button"
                disabled={plan.current || (loading && plan.name !== 'free')}
                onClick={() => {
                  if (plan.name === 'free') {
                    router.push(user ? '/new' : '/auth/signin')
                    return
                  }
                  void handleCheckout(plan.name as PaidPlan)
                }}
                className={`mt-8 w-full ${plan.current ? 'tera-button-secondary cursor-default justify-center opacity-70' : plan.cta.startsWith('Upgrade') ? 'tera-button-upgrade justify-center' : plan.highlighted ? 'tera-button-primary justify-center' : 'tera-button-secondary justify-center'}`}
              >
                {plan.current ? 'Current plan' : loading && plan.name !== 'free' ? 'Processing...' : plan.cta}
              </button>
            </div>
          ))}
        </section>

        <section className="tera-surface mt-8 overflow-hidden p-6 md:p-8">
          <div className="flex items-center justify-between gap-4 border-b border-tera-border pb-5">
            <div>
              <p className="tera-eyebrow">Comparison</p>
              <h2 className="mt-2 text-2xl font-semibold text-tera-primary">Plan breakdown</h2>
            </div>
          </div>
          <div className="custom-scrollbar mt-6 overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead>
                <tr className="border-b border-tera-border text-[0.68rem] uppercase tracking-[0.22em] text-tera-secondary">
                  <th className="px-4 py-3 font-medium">Feature</th>
                  <th className="px-4 py-3 font-medium">Free</th>
                  <th className="px-4 py-3 font-medium">Pro</th>
                  <th className="px-4 py-3 font-medium">Plus</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row) => (
                  <tr key={row.feature} className="border-b border-tera-border/70 last:border-0">
                    <td className="px-4 py-4 text-tera-primary">{row.feature}</td>
                    <td className="px-4 py-4 text-tera-secondary">{row.free}</td>
                    <td className="px-4 py-4 text-tera-secondary">{row.pro}</td>
                    <td className="px-4 py-4 text-tera-secondary">{row.plus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="tera-card">
            <p className="tera-eyebrow">FAQ</p>
            <div className="mt-4 space-y-4">
              {faqs.map((faq) => (
                <div key={faq.q} className="rounded-[22px] border border-tera-border bg-white/[0.03] px-5 py-4">
                  <h3 className="text-base font-medium text-tera-primary">{faq.q}</h3>
                  <p className="mt-2 text-sm leading-7 text-tera-secondary">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="tera-card-subtle px-6 py-6">
            <p className="tera-eyebrow">Need help?</p>
            <h3 className="mt-3 text-xl font-semibold text-tera-primary">Talk to support before you upgrade.</h3>
            <p className="mt-4 text-sm leading-7 text-tera-secondary">
              If you need help choosing a plan or resolving billing issues, contact support or browse the help center.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href="mailto:Teraaiguide@gmail.com" className="tera-button-primary">Contact support</a>
              <button type="button" onClick={() => router.push('/help')} className="tera-button-secondary">Open help center</button>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
