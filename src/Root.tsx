import { Composition } from 'remotion';
import { PetalPop } from './PetalPop';
import layout from './layout.json';
import { PetalPopIntro } from './intro/PetalPopIntro';
import introLayout from './intro/layout.json';
import { PetalPopDrop1 } from './drop1/PetalPopDrop1';
import drop1 from './drop1/timeline.json';
import { PetalPopBTS } from './bts/PetalPopBTS';
import bts from './bts/timeline.json';
import { PetalPopTeaser1 } from './teaser1/PetalPopTeaser1';
import teaser1 from './teaser1/timeline.json';
import { PetalPopDrop2 } from './drop2/PetalPopDrop2';
import { PetalPopDrop3Catalog } from './drop3c/PetalPopDrop3Catalog';
import drop3c from './drop3c/timeline.json';
import { PetalPopDrop3Fabric } from './drop3f/PetalPopDrop3Fabric';
import drop3f from './drop3f/timeline.json';
import drop2 from './drop2/timeline.json';
import { PetalPopDrop3Teaser } from './drop3/PetalPopDrop3Teaser';
import drop3 from './drop3/timeline.json';
import { PetalPopDrop3Teaser1 } from './drop3t/PetalPopDrop3Teaser1';
import drop3t from './drop3t/timeline.json';

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
    <Composition
      id="PetalPopTeaser1"
      component={PetalPopTeaser1}
      durationInFrames={teaser1.DURATION * teaser1.FPS}
      fps={teaser1.FPS}
      width={teaser1.W}
      height={teaser1.H}
      defaultProps={{ withAudio: false }}
    />
    <Composition
      id="PetalPopDrop2"
      component={PetalPopDrop2}
      durationInFrames={drop2.DURATION * drop2.FPS}
      fps={drop2.FPS}
      width={drop2.W}
      height={drop2.H}
      defaultProps={{ withAudio: false }}
    />
    <Composition
      id="PetalPopDrop3Teaser"
      component={PetalPopDrop3Teaser}
      durationInFrames={Math.round(drop3.DURATION * drop3.FPS)}
      fps={drop3.FPS}
      width={drop3.W}
      height={drop3.H}
      defaultProps={{ withAudio: false }}
    />
    <Composition
      id="PetalPopDrop3Teaser1"
      component={PetalPopDrop3Teaser1}
      durationInFrames={Math.round(drop3t.DURATION * drop3t.FPS)}
      fps={drop3t.FPS}
      width={drop3t.W}
      height={drop3t.H}
      defaultProps={{ withAudio: false }}
    />
    <Composition
      id="PetalPopDrop3Catalog"
      component={PetalPopDrop3Catalog}
      durationInFrames={drop3c.DURATION * drop3c.FPS}
      fps={drop3c.FPS}
      width={drop3c.W}
      height={drop3c.H}
      defaultProps={{ withAudio: false }}
    />
    <Composition
      id="PetalPopDrop3Fabric"
      component={PetalPopDrop3Fabric}
      durationInFrames={drop3f.DURATION * drop3f.FPS}
      fps={drop3f.FPS}
      width={drop3f.W}
      height={drop3f.H}
      defaultProps={{ withAudio: false }}
    />
  </>
);
