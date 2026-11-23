import React from 'react';
import {Composition, continueRender, delayRender, staticFile} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {DURATION, FPS, Main} from './Main';

const h = delayRender('fonts');
Promise.all([
  loadFont({family: 'DMSerif', url: staticFile('fonts/dm-serif-display-latin-400-italic.woff2'), style: 'italic'}),
  loadFont({family: 'Caveat', url: staticFile('fonts/caveat-latin-700-normal.woff2'), weight: '700'}),
]).then(() => continueRender(h));

export const RemotionRoot: React.FC = () => (
  <Composition id="HarvardScrapbook" component={Main} durationInFrames={DURATION} fps={FPS} width={1080} height={1920} />
);
