import {Composition} from 'remotion';
import {PetalPop4Launch, TOTAL_FRAMES} from './pp4/PetalPop4Launch';
export const Root = () => <Composition id="PetalPop4Launch" component={PetalPop4Launch} durationInFrames={TOTAL_FRAMES} fps={60} width={1920} height={1080} />;
