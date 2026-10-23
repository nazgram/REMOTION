import { Composition } from 'remotion';
import { PetalPop } from './PetalPop';
import layout from './layout.json';

export const RemotionRoot: React.FC = () => (
  <Composition
    id="PetalPop"
    component={PetalPop}
    durationInFrames={layout.DURATION * layout.FPS}
    fps={layout.FPS}
    width={layout.W}
    height={layout.H}
    defaultProps={{ withAudio: false }}
  />
);
