import React from 'react';
import {Composition, continueRender, delayRender, staticFile} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {DURATION, FPS, Main} from './Main';
import {Full, FULL_DURATION} from './Full';
import {Varsity, VARSITY_DURATION} from './Varsity';

const h = delayRender('fonts', {timeoutInMilliseconds: 120000});
Promise.all([
  loadFont({family: 'DMSerif', url: staticFile('fonts/dm-serif-display-latin-400-italic.woff2'), style: 'italic'}),
  loadFont({family: 'Caveat', url: staticFile('fonts/caveat-latin-700-normal.woff2'), weight: '700'}),
  loadFont({family: 'AGLight', url: staticFile('varsity/AppleGaramond-Light.ttf')}),
  loadFont({family: 'AGLightItalic', url: staticFile('varsity/AppleGaramond-LightItalic.ttf')}),
  loadFont({family: 'DreamAvenue', url: staticFile('varsity/DreamAvenue.ttf')}),
  loadFont({family: 'PoppinsLight', url: staticFile('varsity/Poppins-Light.woff2')}),
  loadFont({family: 'PoppinsMedium', url: staticFile('varsity/Poppins-Medium.woff2')}),
  loadFont({family: 'AGRegular', url: staticFile('varsity/AppleGaramond.ttf')}),
  loadFont({family: 'AGItalic', url: staticFile('varsity/AppleGaramond-Italic.ttf')}),
]).then(() => continueRender(h)).catch(() => continueRender(h));

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="HarvardScrapbook" component={Main} durationInFrames={DURATION} fps={FPS} width={1080} height={1920} />
    <Composition id="HarvardFull" component={Full} durationInFrames={FULL_DURATION} fps={FPS} width={1080} height={1920} />
    <Composition id="HarvardVarsityQuotes" component={Varsity} durationInFrames={VARSITY_DURATION} fps={FPS} width={1080} height={1920} />
  </>
);
