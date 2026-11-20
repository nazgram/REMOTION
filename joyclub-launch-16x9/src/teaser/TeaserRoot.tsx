import {Composition} from 'remotion';
import {JoyClubTeaser, TOTAL_FRAMES, FPS, W, H} from './JoyClubTeaser';
export const TeaserRoot = () => <Composition id="JoyClubTeaser" component={JoyClubTeaser} durationInFrames={TOTAL_FRAMES} fps={FPS} width={W} height={H} />;
