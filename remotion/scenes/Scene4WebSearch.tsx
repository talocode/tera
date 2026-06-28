import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
} from 'remotion';
import { COLORS } from '../utils/colors';
import { fadeIn, slideInFromLeft, scaleIn } from '../utils/animations';

interface KnowledgeCard {
  title: string;
  source: string;
  snippet: string;
}

const KnowledgeCardComponent: React.FC<{
  card: KnowledgeCard;
  index: number;
  startFrame: number;
}> = ({ card, index, startFrame }) => {
  const frame = useCurrentFrame();

  const opacity = fadeIn(frame, startFrame, 20);
  const slideOffset = slideInFromLeft(frame, startFrame, 25);
  const scale = scaleIn(frame, startFrame, 25, 0.95);

  return (
    <div
      style={{
        marginBottom: '20px',
        opacity,
        transform: `translateX(${slideOffset}px) scale(${scale})`,
        transformOrigin: 'left center',
      }}
    >
      <div
        style={{
          backgroundColor: COLORS.teraPanel,
          borderRadius: '12px',
          padding: '16px',
          border: `1px solid ${COLORS.teraBorder}`,
          transition: 'all 0.3s',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '8px',
          }}
        >
          <div
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '4px',
              background: COLORS.teraNeon,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#000000',
              fontSize: '12px',
              fontWeight: 'bold'
            }}
          >
            📖
          </div>
          <h4
            style={{
              margin: 0,
              fontSize: '16px',
              fontWeight: 600,
              color: COLORS.teraPrimary,
              fontFamily: '"Inter", system-ui, sans-serif',
            }}
          >
            {card.title}
          </h4>
        </div>
        <p
          style={{
            fontSize: '13px',
            color: COLORS.teraSecondary,
            margin: '8px 0',
            lineHeight: '1.5',
            fontFamily: '"Inter", system-ui, sans-serif',
          }}
        >
          {card.snippet}
        </p>
        <p
          style={{
            fontSize: '12px',
            color: COLORS.teraNeon,
            margin: '8px 0 0 0',
            fontFamily: '"Inter", monospace',
            opacity: 0.8
          }}
        >
          {card.source}
        </p>
      </div>
    </div>
  );
};

export const Scene4DeepResearch: React.FC = () => {
  const frame = useCurrentFrame();

  const knowledgeCards: KnowledgeCard[] = [
    {
      title: 'Thermodynamics',
      source: 'grokipedia.com/Thermodynamics',
      snippet:
        'The branch of physical science that deals with the relations between heat and other forms of energy.',
    },
    {
      title: 'Entropy Laws',
      source: 'grokipedia.com/Entropy',
      snippet:
        'A thermodynamic quantity representing the unavailability of a systems thermal energy for conversion into mechanical work.',
    },
    {
      title: 'Statistical Mechanics',
      source: 'grokipedia.com/Statistical_mechanics',
      snippet:
        'A mathematical framework that applies statistical methods and probability theory to large assemblies of microscopic entities.',
    },
  ];

  const headerOpacity = fadeIn(frame, 0, 25);
  const headerScale = scaleIn(frame, 0, 25, 0.95);

  const windowOpacity = fadeIn(frame, 35, 30);
  const windowScale = scaleIn(frame, 35, 30, 0.9);

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
      <div
        style={{
          position: 'absolute',
          width: '700px',
          height: '700px',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${COLORS.teraNeon}15 0%, transparent 70%)`,
          bottom: '-15%',
          left: '-10%',
          filter: 'blur(100px)',
        }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          maxWidth: '900px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            opacity: headerOpacity,
            transform: `scale(${headerScale})`,
            marginBottom: '50px',
            transformOrigin: 'left center',
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
            Deep Research
          </h2>
          <p
            style={{
              fontSize: '18px',
              color: COLORS.teraSecondary,
              margin: 0,
              fontFamily: '"Inter", system-ui, sans-serif',
            }}
          >
            Powered by Grokipedia — the open source of truth
          </p>
        </div>

        <div
          style={{
            opacity: windowOpacity,
            transform: `scale(${windowScale})`,
            transformOrigin: 'top center',
            backgroundColor: COLORS.teraPanel,
            borderRadius: '20px',
            padding: '30px',
            border: `1px solid ${COLORS.teraBorder}`,
            boxShadow: `0 20px 60px ${COLORS.teraNeon}15`,
            backdropFilter: 'blur(20px)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              paddingBottom: '20px',
              borderBottom: `1px solid ${COLORS.teraBorder}`,
              marginBottom: '20px',
            }}
          >
            <div style={{ fontSize: '20px', marginRight: '12px' }}>🕵️</div>
            <div style={{ flex: 1, color: COLORS.teraPrimary, fontSize: '15px', fontWeight: 500 }}>
              Analyzing complex concepts through multi-layered research...
            </div>
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: COLORS.teraNeon, backgroundColor: `${COLORS.teraNeon}20`, padding: '4px 8px', borderRadius: '4px' }}>
              RESEARCH MODE
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {knowledgeCards.map((card, index) => (
              <KnowledgeCardComponent
                key={index}
                card={card}
                index={index}
                startFrame={80 + index * 60}
              />
            ))}
          </div>

          <div
            style={{
              marginTop: '20px',
              paddingTop: '20px',
              borderTop: `1px solid ${COLORS.teraBorder}`,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13px',
              color: COLORS.teraSecondary,
              opacity: fadeIn(frame, 150, 25),
            }}
          >
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: COLORS.teraNeon }} />
            Connected to Grokipedia canonical reference layer
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
