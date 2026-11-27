import {Composition} from 'remotion';
import {PetalPop4Launch, TOTAL_FRAMES} from './pp4/PetalPop4Launch';
import {LM_FRAMES, PetalPop4LogoMotion} from './pp4/logomotion/PetalPop4LogoMotion';
import {UnitSheet} from './pp4/logomotion/UnitSheet';
import {PetalPop4Vertical, PetalPop4VerticalLong, V_LONG_FRAMES, V_TOTAL_FRAMES} from './pp4/vertical/PetalPop4Vertical';
export const Root = () => (
  <>
    <Composition id="PetalPop4Launch" component={PetalPop4Launch} durationInFrames={TOTAL_FRAMES} fps={60} width={1920} height={1080} />
    <Composition id="PetalPop4Vertical" component={PetalPop4Vertical} durationInFrames={V_TOTAL_FRAMES} fps={60} width={1080} height={1920} />
    <Composition id="PetalPop4VerticalLong" component={PetalPop4VerticalLong} durationInFrames={V_LONG_FRAMES} fps={60} width={1080} height={1920} />
    <Composition id="PetalPop4LogoMotion" component={PetalPop4LogoMotion} durationInFrames={LM_FRAMES} fps={60} width={1080} height={1920} />
    <Composition id="UnitSheet" component={UnitSheet} durationInFrames={10} fps={60} width={1080} height={1920} defaultProps={{page: 0}} calculateMetadata={({props}) => ({props})} />
  </>
);
