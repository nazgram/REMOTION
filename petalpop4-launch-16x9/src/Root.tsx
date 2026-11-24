import {Composition} from 'remotion';
import {PetalPop4Launch, TOTAL_FRAMES} from './pp4/PetalPop4Launch';
import {PetalPop4Vertical, V_TOTAL_FRAMES} from './pp4/vertical/PetalPop4Vertical';
export const Root = () => (
  <>
    <Composition id="PetalPop4Launch" component={PetalPop4Launch} durationInFrames={TOTAL_FRAMES} fps={60} width={1920} height={1080} />
    <Composition id="PetalPop4Vertical" component={PetalPop4Vertical} durationInFrames={V_TOTAL_FRAMES} fps={60} width={1080} height={1920} />
  </>
);
