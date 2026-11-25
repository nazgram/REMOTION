import React from 'react';
import {Composition} from 'remotion';
import {RayaAgent, FPS, TOTAL} from './RayaAgent';
export const RemotionRoot: React.FC = () => (
  <Composition id="RayaAgent" component={RayaAgent} durationInFrames={Math.round(TOTAL * FPS)} fps={FPS} width={1080} height={1920} defaultProps={{withAudio: false}} />
);
