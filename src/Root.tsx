import { Composition } from 'remotion';
import { PetalPop } from './PetalPop';
import layout from './layout.json';
import { PetalPopIntro } from './intro/PetalPopIntro';
import introLayout from './intro/layout.json';
import { PetalPopDrop1 } from './drop1/PetalPopDrop1';
import drop1 from './drop1/timeline.json';
import { PetalPopBTS } from './bts/PetalPopBTS';
import bts from './bts/timeline.json';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="PetalPop"
      component={PetalPop}
      durationInFrames={layout.DURATION * layout.FPS}
      fps={layout.FPS}
      width={layout.W}
      height={layout.H}
      defaultProps={{ withAudio: false }}
    />
    <Composition
      id="PetalPopIntro"
      component={PetalPopIntro}
      durationInFrames={introLayout.DURATION * introLayout.FPS}
      fps={introLayout.FPS}
      width={introLayout.W}
      height={introLayout.H}
      defaultProps={{ withAudio: false }}
    />
    <Composition
      id="PetalPopDrop1"
      component={PetalPopDrop1}
      durationInFrames={drop1.DURATION * drop1.FPS}
      fps={drop1.FPS}
      width={drop1.W}
      height={drop1.H}
      defaultProps={{ withAudio: false }}
    />
    <Composition
      id="PetalPopBTS"
      component={PetalPopBTS}
      durationInFrames={bts.DURATION * bts.FPS}
      fps={bts.FPS}
      width={bts.W}
      height={bts.H}
      defaultProps={{ withAudio: false }}
    />
    <Composition
      id="PetalPopBTSEn"
      component={PetalPopBTS}
      durationInFrames={bts.DURATION * bts.FPS}
      fps={bts.FPS}
      width={bts.W}
      height={bts.H}
      defaultProps={{ withAudio: false, lang: 'en' as const }}
    />
  </>
);
