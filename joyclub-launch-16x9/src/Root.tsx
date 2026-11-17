import {Composition} from 'remotion';
import {JoyClubLaunch, TOTAL_FRAMES, FPS} from './JoyClubLaunch';
export const Root = () => (
  <Composition id="JoyClubLaunch" component={JoyClubLaunch} durationInFrames={TOTAL_FRAMES} fps={FPS} width={1920} height={1080} />
);
