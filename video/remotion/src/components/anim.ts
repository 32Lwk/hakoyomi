import { Easing, interpolate, spring } from "remotion";
import { FPS } from "../theme";

/** from フレームから d フレームかけて 0→1 */
export const ramp = (frame: number, from: number, d = 12) =>
  interpolate(frame, [from, from + d], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

export const pop = (frame: number, from: number) =>
  spring({ frame: frame - from, fps: FPS, config: { damping: 200, mass: 0.6 } });

/** 下から少し上がって出る */
export const rise = (frame: number, from: number, d = 14) => {
  const t = ramp(frame, from, d);
  return { opacity: t, transform: `translateY(${(1 - t) * 18}px)` };
};
