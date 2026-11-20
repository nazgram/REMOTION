import {Composition} from 'remotion';
import {JoyClubLaunch, TOTAL_FRAMES, FPS} from './JoyClubLaunch';
import {JoyClubV3, TOTAL_FRAMES as V3_FRAMES} from './v3/JoyClubV3';
export const Root = () => (
  <>
    <Composition id="JoyClubLaunch" component={JoyClubLaunch} durationInFrames={TOTAL_FRAMES} fps={FPS} width={1920} height={1080} />
    <Composition id="JoyClubV3" component={JoyClubV3} durationInFrames={V3_FRAMES} fps={60} width={1920} height={1080} />
  </>
);
