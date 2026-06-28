import React from 'react';
import { Composition, Sequence, Audio } from 'remotion';
import { AUDIO_CONFIG, useAudio } from './utils/audio';
import { Scene1HeroIntro } from './scenes/Scene1HeroIntro';
import { Scene2ProblemStatement } from './scenes/Scene2ProblemStatement';
import { Scene3ChatInterface } from './scenes/Scene3ChatInterface';
import { Scene4DeepResearch } from './scenes/Scene4WebSearch'; // Reusing file for simplicity
import { Scene5AITools } from './scenes/Scene5AITools';
import { Scene6PricingTiers } from './scenes/Scene6PricingTiers';
import { Scene7MobileExperience } from './scenes/Scene7MobileExperience';
import { Scene8CTA } from './scenes/Scene8CTA';

const VIDEO_WIDTH = 1920;
const VIDEO_HEIGHT = 1080;
const VIDEO_FPS = 30;
const VIDEO_DURATION = 2700; // 90 seconds at 30fps

const SCENE1_DURATION = 150;
const SCENE2_DURATION = 150;
const SCENE3_DURATION = 450;
const SCENE4_DURATION = 300;
const SCENE5_DURATION = 600;
const SCENE6_DURATION = 450;
const SCENE7_DURATION = 300;
const SCENE8_DURATION = 300;

export const TeraDemo: React.FC = () => {
  return (
    <>
      <Composition
        id="TeraDemoVideo"
        component={MainVideo}
        durationInFrames={VIDEO_DURATION}
        fps={VIDEO_FPS}
        width={VIDEO_WIDTH}
        height={VIDEO_HEIGHT}
      />
    </>
  );
};

const MainVideo: React.FC = () => {
  let currentFrame = 0;

  const scene1Start = currentFrame; currentFrame += SCENE1_DURATION;
  const scene2Start = currentFrame; currentFrame += SCENE2_DURATION;
  const scene3Start = currentFrame; currentFrame += SCENE3_DURATION;
  const scene4Start = currentFrame; currentFrame += SCENE4_DURATION;
  const scene5Start = currentFrame; currentFrame += SCENE5_DURATION;
  const scene6Start = currentFrame; currentFrame += SCENE6_DURATION;
  const scene7Start = currentFrame; currentFrame += SCENE7_DURATION;
  const scene8Start = currentFrame; currentFrame += SCENE8_DURATION;

  return (
    <>
      {useAudio.background && <Audio src={AUDIO_CONFIG.backgroundMusic.path} startFrom={AUDIO_CONFIG.backgroundMusic.startFrame} volume={AUDIO_CONFIG.backgroundMusic.volume} />}
      {useAudio.voiceover && <Audio src={AUDIO_CONFIG.voiceover.path} startFrom={AUDIO_CONFIG.voiceover.startFrame} volume={AUDIO_CONFIG.voiceover.volume} />}

      <Sequence from={scene1Start} durationInFrames={SCENE1_DURATION}><Scene1HeroIntro /></Sequence>
      <Sequence from={scene2Start} durationInFrames={SCENE2_DURATION}><Scene2ProblemStatement /></Sequence>
      <Sequence from={scene3Start} durationInFrames={SCENE3_DURATION}><Scene3ChatInterface /></Sequence>
      <Sequence from={scene4Start} durationInFrames={SCENE4_DURATION}><Scene4DeepResearch /></Sequence>
      <Sequence from={scene5Start} durationInFrames={SCENE5_DURATION}><Scene5AITools /></Sequence>
      <Sequence from={scene6Start} durationInFrames={SCENE6_DURATION}><Scene6PricingTiers /></Sequence>
      <Sequence from={scene7Start} durationInFrames={SCENE7_DURATION}><Scene7MobileExperience /></Sequence>
      <Sequence from={scene8Start} durationInFrames={SCENE8_DURATION}><Scene8CTA /></Sequence>
    </>
  );
};
