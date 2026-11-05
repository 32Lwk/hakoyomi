// design.md §4：白の下地・濃グレーの文字・濃紺は主色・琥珀は「違う」だけ。良し悪しの色（緑・赤）は使わない。
import { loadFont } from "@remotion/google-fonts/NotoSansJP";

const { fontFamily: noto } = loadFont("normal", {
  weights: ["400", "500", "700"],
  ignoreTooManyRequestsWarning: true,
});

export const FONT = `${noto}, "Hiragino Sans", "Hiragino Kaku Gothic ProN", sans-serif`;

export const C = {
  white: "#FFFFFF",
  base: "#F6F7F9", // 図の下地（ごく薄いグレー）
  line: "#D9DDE3",
  text: "#1F2933", // 濃グレー
  sub: "#5B6573",
  muted: "#98A1AD",
  navy: "#1E3A5F",
  navySoft: "#E8EEF5",
  amber: "#F5B700", // 「違う」だけに使う
  amberSoft: "#FFF4CC",
  black: "#0E1116",
} as const;

export const FPS = 30;
export const W = 1920;
export const H = 1080;

// 画面録画の場面の配置（全場面で同じ）
export const LAYOUT = {
  phone: { x: 190, y: 24, screenW: 390, screenH: 844, bezel: 16, radius: 56 },
  panel: { x: 670, y: 80, w: 1200 },
  subtitle: { bottom: 34, maxW: 1560 },
} as const;
