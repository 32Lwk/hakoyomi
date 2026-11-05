import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { AUDIO } from "./captions";
import { Subtitles } from "./components/Subtitles";
import { JanDemoReal } from "./scenes/JanDemoReal";
import { S2b, S3, S4, S5, S6 } from "./scenes/AppScenes";
import { pipelineDefaults, type PipelineProps } from "./scenes/Pipeline";
import { S1Real } from "./scenes/S1Real";
import { QrCard } from "./components/QrCard";
import { S7, s7Defaults, type S7Props } from "./scenes/S7";
import { C } from "./theme";
import { SCENES, sec, type SceneId } from "./timeline";

export type MainProps = { pipeline: PipelineProps; s7: S7Props; narration: boolean; subtitles: boolean };
export const mainDefaults: MainProps = { pipeline: pipelineDefaults, s7: s7Defaults, narration: true, subtitles: true };

const render = (id: SceneId, p: MainProps) => {
  switch (id) {
    case "S1":
      return <S1Real />;
    case "S2":
      return <JanDemoReal captions={false} />;
    case "S2b":
      return <S2b />;
    case "S3":
      return <S3 />;
    case "S4":
      return <S4 pipeline={p.pipeline} />;
    case "S4.5":
      return null;
    case "S5":
      return <S5 />;
    case "S6":
      return <S6 />;
    case "S7":
      return <S7 {...p.s7} />;
  }
};

export const Main: React.FC<MainProps> = (p) => (
  <AbsoluteFill style={{ background: C.white }}>
    {SCENES.map((s) => (
      <Sequence key={s.id} name={`${s.id} ${s.title}`} from={sec(s.startSec)} durationInFrames={sec(s.durationSec)}>
        {render(s.id, p)}
      </Sequence>
    ))}
    {p.narration
      ? AUDIO.map((a) => (
          <Sequence key={a.id} name={`声 ${a.id}`} from={sec(a.start)} durationInFrames={sec(a.duration) + 2} layout="none">
            <Audio src={staticFile(a.src)} />
          </Sequence>
        ))
      : null}
    {p.subtitles ? <Subtitles /> : null}
    <QrCard />
  </AbsoluteFill>
);
