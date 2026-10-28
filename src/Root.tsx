import { Composition } from 'remotion';
import { PetalPop } from './PetalPop';
import layout from './layout.json';
import { PetalPopIntro } from './intro/PetalPopIntro';
import introLayout from './intro/layout.json';

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
  </>
);
