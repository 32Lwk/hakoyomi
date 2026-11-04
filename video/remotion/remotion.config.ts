import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
// 日本語フォント（Google Fonts）の読み込みに時間がかかることがあるので長めに待つ
Config.setDelayRenderTimeoutInMilliseconds(120_000);
