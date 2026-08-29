import sharp from "file:///C:/Users/lorsa/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp/dist/index.mjs";

const root = "D:/Projects/gravity viz";
const qaDir = `${root}/design-qa`;
const shotsDir = `${root}/screenshots`;
const sourcePath =
  "C:/Users/lorsa/AppData/Local/Temp/codex-clipboard-94950a40-235f-442f-a7af-08161645e24a.png";

await sharp(`${qaDir}/pass-5-cinematic.jpg`)
  .png()
  .toFile(`${qaDir}/pass-5-cinematic.png`);
await sharp(`${qaDir}/final-analysis.jpg`)
  .png()
  .toFile(`${shotsDir}/gravity-fabric-analysis.png`);
await sharp(`${shotsDir}/gravity-fabric-cinematic.jpg`)
  .png()
  .toFile(`${shotsDir}/gravity-fabric-cinematic.png`);
await sharp(`${qaDir}/height-control.jpg`)
  .png()
  .toFile(`${qaDir}/height-control.png`);

const width = 1357;
const panelHeight = 781;

let sourcePanel = await sharp(sourcePath)
  .resize(width, panelHeight, { fit: "cover" })
  .png()
  .toBuffer();
let implementationPanel = await sharp(
  `${shotsDir}/gravity-fabric-cinematic.jpg`,
)
  .extract({ left: 0, top: 120, width, height: panelHeight })
  .png()
  .toBuffer();

const label = (text, labelWidth) =>
  Buffer.from(
    `<svg width="${width}" height="${panelHeight}">
      <rect x="20" y="20" width="${labelWidth}" height="34" rx="4" fill="#090304" fill-opacity=".82"/>
      <text x="36" y="43" fill="#ffd1a3" font-family="Arial" font-size="15" letter-spacing="2">${text}</text>
    </svg>`,
  );

sourcePanel = await sharp(sourcePanel)
  .composite([{ input: label("SOURCE", 155), top: 0, left: 0 }])
  .png()
  .toBuffer();
implementationPanel = await sharp(implementationPanel)
  .composite([{ input: label("IMPLEMENTATION", 245), top: 0, left: 0 }])
  .png()
  .toBuffer();

await sharp({
  create: {
    width,
    height: panelHeight * 2,
    channels: 3,
    background: "#090304",
  },
})
  .composite([
    { input: sourcePanel, top: 0, left: 0 },
    { input: implementationPanel, top: panelHeight, left: 0 },
  ])
  .png()
  .toFile(`${qaDir}/comparison-final.png`);

console.log("Prepared PNG screenshots and design-qa/comparison-final.png");
