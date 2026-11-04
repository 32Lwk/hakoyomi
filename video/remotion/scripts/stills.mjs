// 確認用の静止画を out/stills/ に書き出す（素材ごと数枚）。
import { execFileSync } from "node:child_process";
import fs from "node:fs";

const shots = [
  ["S1-Opening", 200, "s1-bubbles"],
  ["S1-Opening", 400, "s1-logo"],
  ["S4-Pipeline", 400, "s4-pipeline"],
  ["S7-Roles", 120, "s7-roles"],
  ["S7-Results", 120, "s7-results"],
  ["S7-Closing", 170, "s7-closing"],
  ["Main", 15 * 30 + 600, "main-s2"],
  ["Main", 45 * 30 + 450, "main-s3"],
  ["Main", 70 * 30 + 900, "main-s4"],
  ["Main", 110 * 30 + 300, "main-s45"],
  ["Main", 125 * 30 + 450, "main-s5"],
  ["Main", 145 * 30 + 400, "main-s6"],
];
const only = process.argv.slice(2);
fs.mkdirSync("out/stills", { recursive: true });
for (const [comp, frame, name] of shots) {
  if (only.length && !only.includes(name)) continue;
  execFileSync("npx", ["remotion", "still", "src/index.ts", comp, `out/stills/${name}.png`, `--frame=${frame}`], {
    stdio: ["ignore", "ignore", "inherit"],
  });
  console.log(name);
}
