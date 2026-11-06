import React from "react";
import { Composition, Sequence } from "remotion";
import { Subtitles } from "./components/Subtitles";
import { Main, mainDefaults } from "./Main";
import { S4PipelineStandalone, pipelineDefaults, type PipelineProps } from "./scenes/Pipeline";
import { JanDemo, janDemoDefaults, janDemoSeconds, type JanDemoProps } from "./scenes/JanDemo";
import { JanDemoReal, REAL_TOTAL_SEC } from "./scenes/JanDemoReal";
import { JanScreen, JAN_SCREEN_SEC } from "./scenes/JanScreen";
import { S1Opening } from "./scenes/S1Opening";
import { S1Real } from "./scenes/S1Real";
import { QrCard } from "./components/QrCard";
import { Closing, Results, Roles, S7, s7Defaults, type S7Props } from "./scenes/S7";
import { ThumbnailA, ThumbnailB, ThumbnailC, ThumbnailD } from "./scenes/Thumbnails";
import { ThumbnailE, ThumbnailF, ThumbnailG, ThumbnailH } from "./scenes/Thumbnails2";
import { ThumbnailI, ThumbnailJ, ThumbnailK, ThumbnailL } from "./scenes/Thumbnails3";
import { ThumbnailM, ThumbnailN, ThumbnailO } from "./scenes/Thumbnails4";
import { FPS, H, W } from "./theme";
import { scene, sec, TOTAL_SEC } from "./timeline";

const common = { fps: FPS, width: W, height: H } as const;

// 単体の素材（字幕つきの確認用は *-sub）
const S1WithSub: React.FC = () => (
  <>
    <S1Opening />
    <Subtitles only={["S1"]} offsetSec={scene("S1").startSec} />
  </>
);
const S7WithSub: React.FC<S7Props> = (p) => (
  <>
    <S7 {...p} />
    <Subtitles only={["S7"]} offsetSec={scene("S7").startSec} />
  </>
);
const S7ResultsOnly: React.FC<S7Props> = (p) => <Results {...p} start={0} />;
const S7ClosingOnly: React.FC<{ repoUrl: string }> = ({ repoUrl }) => (
  <Sequence>
    <Closing repoUrl={repoUrl} start={4} />
  </Sequence>
);
const Pipeline: React.FC<PipelineProps> = (p) => <S4PipelineStandalone {...p} />;

const janMeta = ({ props }: { props: JanDemoProps }) => ({ durationInFrames: sec(janDemoSeconds(props.segments)) });

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Main" component={Main} durationInFrames={sec(TOTAL_SEC)} defaultProps={mainDefaults} {...common} />
    <Composition id="JanDemo-iPhone" component={JanDemo} durationInFrames={sec(janDemoSeconds(janDemoDefaults.iphone.segments))} defaultProps={janDemoDefaults.iphone} calculateMetadata={janMeta} {...common} />
    <Composition id="JanDemo-iPad" component={JanDemo} durationInFrames={sec(janDemoSeconds(janDemoDefaults.ipad.segments))} defaultProps={janDemoDefaults.ipad} calculateMetadata={janMeta} {...common} />
    <Composition id="JanDemo-Real" component={JanDemoReal} durationInFrames={sec(REAL_TOTAL_SEC)} {...common} />
    <Composition id="JanScreen" component={JanScreen} durationInFrames={sec(JAN_SCREEN_SEC)} width={390} height={800} fps={FPS} />
    <Composition id="S1-Real" component={() => (<><S1Real /><QrCard /></>)} durationInFrames={sec(24)} {...common} />
    <Composition id="S1-Opening" component={S1WithSub} durationInFrames={sec(scene("S1").durationSec)} {...common} />
    <Composition id="S4-Pipeline" component={Pipeline} durationInFrames={sec(16)} defaultProps={pipelineDefaults} {...common} />
    <Composition id="S7-Full" component={S7WithSub} durationInFrames={sec(scene("S7").durationSec)} defaultProps={s7Defaults} {...common} />
    <Composition id="S7-Roles" component={() => <Roles start={0} />} durationInFrames={sec(6)} {...common} />
    <Composition id="S7-Results" component={S7ResultsOnly} durationInFrames={sec(6)} defaultProps={s7Defaults} {...common} />
    <Composition id="S7-Closing" component={S7ClosingOnly} durationInFrames={sec(6)} defaultProps={{ repoUrl: s7Defaults.repoUrl }} {...common} />
    <Composition id="ThumbnailA" component={ThumbnailA} durationInFrames={1} {...common} />
    <Composition id="ThumbnailB" component={ThumbnailB} durationInFrames={1} {...common} />
    <Composition id="ThumbnailC" component={ThumbnailC} durationInFrames={1} {...common} />
    <Composition id="ThumbnailD" component={ThumbnailD} durationInFrames={1} {...common} />
    <Composition id="ThumbnailE" component={ThumbnailE} durationInFrames={1} {...common} />
    <Composition id="ThumbnailF" component={ThumbnailF} durationInFrames={1} {...common} />
    <Composition id="ThumbnailG" component={ThumbnailG} durationInFrames={1} {...common} />
    <Composition id="ThumbnailH" component={ThumbnailH} durationInFrames={1} {...common} />
    <Composition id="ThumbnailI" component={ThumbnailI} durationInFrames={1} {...common} />
    <Composition id="ThumbnailJ" component={ThumbnailJ} durationInFrames={1} {...common} />
    <Composition id="ThumbnailK" component={ThumbnailK} durationInFrames={1} {...common} />
    <Composition id="ThumbnailL" component={ThumbnailL} durationInFrames={1} {...common} />
    <Composition id="ThumbnailM" component={ThumbnailM} durationInFrames={1} {...common} />
    <Composition id="ThumbnailN" component={ThumbnailN} durationInFrames={1} {...common} />
    <Composition id="ThumbnailO" component={ThumbnailO} durationInFrames={1} {...common} />
  </>
);
