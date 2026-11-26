import React from 'react';
import {Composition} from 'remotion';
import {PetalPop4BTS} from './BTS';
import plan from '../public/bts/plan.json';
export const RemotionRoot: React.FC = () => (
  <Composition id="PetalPop4BTS" component={PetalPop4BTS} durationInFrames={plan.total} fps={30} width={1080} height={1920} />
);
