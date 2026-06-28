import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
} from 'remotion';
import { COLORS } from '../utils/colors';
import { fadeIn, slideInFromLeft, slideInFromRight, slideInFromTop, scaleIn } from '../utils/animations';

interface PricingPlan {
  name: string;
  price: string;
  description: string;
  features: string[];
  highlighted?: boolean;
}

const PricingCard: React.FC<{
  plan: PricingPlan;
  index: number;
  startFrame: number;
}> = ({ plan, index, startFrame }) => {
  const frame = useCurrentFrame();

  const opacity = fadeIn(frame, startFrame, 25);
  const scale = scaleIn(frame, startFrame, 25, 0.9);

  // Lift effect for highlighted card
  const yOffset = plan.highlighted
    ? interpolate(
        (frame - startFrame) % 60,
        [0, 30, 60],
        [0, -15, 0],
        {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        }
      )
    : 0;

  return (
    <div
      style={{
        opacity,
        transform: `scale(${scale}) translateY(${yOffset}px)`,
        transformOrigin: 'center center',
      }}
    >
      <div
        style={{
          backgroundColor: plan.highlighted ? 'rgba(255, 255, 255, 0.08)' : COLORS.teraPanel,
          borderRadius: '16px',
          padding: '32px 24px',
          border: plan.highlighted
            ? '2px solid #ffffff'
            : `1px solid ${COLORS.teraBorder}`,
          position: 'relative',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: plan.highlighted
            ? '0 20px 60px rgba(255, 255, 255, 0.15)'
            : '0 8px 24px rgba(255, 255, 255, 0.08)',
          transition: 'all 0.3s ease',
        }}
      >
        {/* Popular badge */}
        {plan.highlighted && (
          <div
            style={{
              position: 'absolute',
              top: '-12px',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: '#ffffff',
              color: '#000000',
              padding: '6px 16px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 700,
              fontFamily: '"Inter", system-ui, sans-serif',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Most Popular
          </div>
        )}

        {/* Plan name */}
        <h3
          style={{
            margin: '0 0 8px 0',
            fontSize: '20px',
            fontWeight: 700,
            color: COLORS.teraPrimary,
            fontFamily: '"Inter", system-ui, sans-serif',
          }}
        >
          {plan.name}
        </h3>

        {/* Description */}
        <p
          style={{
            margin: '0 0 20px 0',
            fontSize: '13px',
            color: COLORS.teraSecondary,
            fontFamily: '"Inter", system-ui, sans-serif',
            minHeight: '40px',
          }}
        >
          {plan.description}
        </p>

        {/* Price */}
        <div style={{ marginBottom: '24px' }}>
          <div
            style={{
              fontSize: '32px',
              fontWeight: 800,
              color: COLORS.teraPrimary,
              fontFamily: '"Inter", system-ui, sans-serif',
            }}
          >
            {plan.price}
          </div>
          {plan.price !== 'Free' && (
            <p
              style={{
                margin: '4px 0 0 0',
                fontSize: '13px',
                color: COLORS.teraSecondary,
                fontFamily: '"Inter", system-ui, sans-serif',
              }}
            >
              per month
            </p>
          )}
        </div>

        {/* Features list */}
        <div style={{ flex: 1, marginBottom: '24px' }}>
          {plan.features.map((feature, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '12px',
                fontSize: '14px',
                color: COLORS.teraPrimary,
                fontFamily: '"Inter", system-ui, sans-serif',
              }}
            >
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#000000',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  flexShrink: 0,
                }}
              >
                ✓
              </div>
              <span>{feature}</span>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <button
          style={{
            padding: '12px 24px',
            borderRadius: '12px',
            border: 'none',
            backgroundColor: plan.highlighted ? '#ffffff' : 'transparent',
            color: plan.highlighted ? '#000000' : '#ffffff',
            fontSize: '14px',
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: '"Inter", system-ui, sans-serif',
            borderTop: plan.highlighted ? 'none' : `1px solid #ffffff`,
            boxShadow: plan.highlighted ? '0 4px 16px rgba(255, 255, 255, 0.2)' : 'none',
            transition: 'all 0.2s',
          }}
          disabled
        >
          {plan.name === 'Free' ? 'Get Started' : 'Upgrade'}
        </button>
      </div>
    </div>
  );
};

export const Scene6PricingTiers: React.FC = () => {
  const frame = useCurrentFrame();

  const headerOpacity = fadeIn(frame, 0, 25);
  const headerScale = scaleIn(frame, 0, 25, 0.95);

  const pricingPlans: PricingPlan[] = [
    {
      name: 'Free',
      price: 'Free',
      description: 'Perfect for getting started',
      features: [
        'Unlimited conversations',
        '90 file uploads/month',
        '5 web searches/month',
        'Basic tools',
      ],
    },
    {
      name: 'Pro',
      price: '$5',
      description: 'For serious learners',
      features: [
        'Unlimited conversations',
        '750 file uploads/month',
        '100 web searches/month',
        'Deep research mode',
        'PDF/Word export',
      ],
      highlighted: true,
    },
    {
      name: 'Plus',
      price: '$15',
      description: 'For power users',
      features: [
        'Unlimited conversations',
        'Unlimited uploads',
        'Unlimited web searches',
        'Advanced analytics',
        'Team collaboration',
        'API access',
      ],
    },
  ];

  return (
    <AbsoluteFill
      style={{
        background: COLORS.darkGradient,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        padding: '60px 40px',
      }}
    >
      {/* Background decoration */}
      <div
        style={{
          position: 'absolute',
          width: '700px',
          height: '700px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255, 255, 255, 0.08) 0%, transparent 70%)',
          top: '-15%',
          right: '-10%',
          filter: 'blur(100px)',
        }}
      />

      {/* Main content */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          maxWidth: '1200px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Section Title */}
        <div
          style={{
            opacity: headerOpacity,
            transform: `scale(${headerScale})`,
            marginBottom: '60px',
            textAlign: 'center',
            transformOrigin: 'center center',
          }}
        >
          <h2
            style={{
              fontSize: '48px',
              fontWeight: 800,
              color: COLORS.teraPrimary,
              margin: '0 0 12px 0',
              fontFamily: '"Inter", system-ui, sans-serif',
            }}
          >
            Simple, Transparent Pricing
          </h2>
          <p
            style={{
              fontSize: '18px',
              color: COLORS.teraSecondary,
              margin: 0,
              fontFamily: '"Inter", system-ui, sans-serif',
            }}
          >
            Choose the perfect plan for your learning journey
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '32px',
            width: '100%',
            alignItems: 'stretch',
          }}
        >
          {pricingPlans.map((plan, index) => (
            <PricingCard
              key={index}
              plan={plan}
              index={index}
              startFrame={80 + index * 50}
            />
          ))}
        </div>

        {/* Bottom note */}
        <div
          style={{
            marginTop: '50px',
            textAlign: 'center',
            opacity: fadeIn(frame, 200, 30),
          }}
        >
          <p
            style={{
              fontSize: '14px',
              color: COLORS.teraSecondary,
              fontFamily: '"Inter", system-ui, sans-serif',
              margin: 0,
            }}
          >
            All plans include access to core features. Cancel anytime, no commitments.
          </p>
        </div>
      </div>
    </AbsoluteFill>
  );
};
