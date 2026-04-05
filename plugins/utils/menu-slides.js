const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const W = 720;
const IMG_H = 400;

function escapeXml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

const defaultImgPath = path.join(__dirname, "images", "default.png");

async function getResizedBotImage() {
  const buf = fs.readFileSync(defaultImgPath);
  return sharp(buf).resize(W, IMG_H, { fit: "cover" }).png().toBuffer();
}

function buildCategorySvg(lines, totalH) {
  const textLines = lines
    .map((l, i) => {
      const y = 20 + i * 32;
      const color = l.startsWith("╭") || l.startsWith("╰") ? "#ff1744" : l.startsWith("┃") ? "#e0e0e0" : "#aaaaaa";
      return `<text x="30" y="${y}" fill="${color}" font-size="22" font-family="monospace">${escapeXml(l)}</text>`;
    })
    .join("\n");

  return `<svg width="${W}" height="${totalH}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${totalH}" fill="#0a0a0a"/>
  ${textLines}
</svg>`;
}

function buildInfoSvg(info, totalH) {
  const lines = [
    { t: `╭═══〘 ${info.botName} 〙═══⊷❍`, c: "#ff1744" },
    { t: `┃✰╭──────────────`, c: "#ff1744" },
    { t: `┃✰│`, c: "#ff1744" },
    { t: `┃✰│  Malik: ${info.botMalik}`, c: "#e0e0e0" },
    { t: `┃✰│  User: ${info.userName}`, c: "#e0e0e0" },
    { t: `┃✰│  Mode: ${info.mode}`, c: "#e0e0e0" },
    { t: `┃✰│  RAM: ${info.ram}`, c: "#e0e0e0" },
    { t: `┃✰│  Users: ${info.totalUsers}`, c: "#e0e0e0" },
    { t: `┃✰│  Version: ${info.version}`, c: "#e0e0e0" },
    { t: `┃✰│  Commands: ${info.totalCmds}`, c: "#ff4081" },
    { t: `┃✰│`, c: "#ff1744" },
    { t: `┃✰│  ▎▍▌▌▉▏▎▌▉▐▏▌▎`, c: "#ff1744" },
    { t: `┃✰│  ▎▍▌▌▉▏▎▌▉▐▏▌▎`, c: "#ff1744" },
    { t: `┃✰│   ${info.botName}`, c: "#ff4081" },
    { t: `┃✰│`, c: "#ff1744" },
    { t: `┃✰│  Channel: ${info.channelLink}`, c: "#ff4081" },
    { t: `┃✰│`, c: "#ff1744" },
    { t: `┃✰╰───────────────`, c: "#ff1744" },
    { t: `╰═════════════════⊷`, c: "#ff1744" },
    { t: ``, c: "#000" },
    { t: `  ⟪ SWIPE FOR COMMANDS ➡️ ⟫`, c: "#ff1744" },
    { t: `  Swipe left to see all categories`, c: "#666666" },
  ];

  const textItems = lines
    .map((l, i) => {
      const y = 20 + i * 32;
      return `<text x="30" y="${y}" fill="${l.c}" font-size="22" font-family="monospace">${escapeXml(l.t)}</text>`;
    })
    .join("\n");

  return `<svg width="${W}" height="${totalH}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${totalH}" fill="#0a0a0a"/>
  ${textItems}
</svg>`;
}

function formatCategory(catName, cmds, prefix, star) {
  const lines = [];
  lines.push(`╭════〘 ${catName} 〙════⊷❍`);
  cmds.forEach((cmd, i) => {
    lines.push(`┃${star}│ ${String(i + 1).padStart(2)}. ${prefix}${cmd}`);
  });
  lines.push(`┃${star}╰─────────────────❍`);
  lines.push(`╰══════════════════⊷❍`);
  return lines;
}

async function generateMenuSlides({ cmdObj, types, prefix, botName, botMalik, userName, mode, ram, totalUsers, version, channelLink }) {
  const tmpDir = path.join(__dirname, "images", "tmp");
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

  const botImgBuf = await getResizedBotImage();
  const star = "✰";
  const slides = [];
  const totalCmds = types.reduce((sum, t) => sum + (cmdObj[t] || []).length, 0);

  const MAX_CMDS_PER_SLIDE = 22;

  const categoryChunks = [];
  for (const cat of types) {
    const cmds = cmdObj[cat] || [];
    if (cmds.length === 0) continue;
    const catName = cat.charAt(0).toUpperCase() + cat.slice(1);
    for (let c = 0; c < cmds.length; c += MAX_CMDS_PER_SLIDE) {
      const slice = cmds.slice(c, c + MAX_CMDS_PER_SLIDE);
      const suffix = cmds.length > MAX_CMDS_PER_SLIDE ? ` (${Math.floor(c / MAX_CMDS_PER_SLIDE) + 1})` : "";
      categoryChunks.push({ catName: catName + suffix, cmds: slice });
    }
  }

  const CATS_PER_SLIDE = 3;
  const slideGroups = [];
  for (let i = 0; i < categoryChunks.length; i += CATS_PER_SLIDE) {
    slideGroups.push(categoryChunks.slice(i, i + CATS_PER_SLIDE));
  }

  const infoLines = 22;
  const infoTextH = infoLines * 32 + 40;
  const coverH = IMG_H + infoTextH;
  const infoSvgBuf = Buffer.from(buildInfoSvg({
    botName, botMalik, userName, mode, ram, totalUsers, version, channelLink, totalCmds,
  }, infoTextH));
  const infoOverlay = await sharp(infoSvgBuf).png().toBuffer();

  const coverPath = path.join(tmpDir, `menu-cover-${Date.now()}.png`);
  await sharp({
    create: { width: W, height: coverH, channels: 3, background: { r: 10, g: 10, b: 10 } },
  })
    .composite([
      { input: botImgBuf, top: 0, left: 0 },
      { input: infoOverlay, top: IMG_H, left: 0 },
    ])
    .png()
    .toFile(coverPath);
  slides.push(coverPath);

  for (let g = 0; g < slideGroups.length; g++) {
    const group = slideGroups[g];
    let allLines = [];
    for (const chunk of group) {
      const catLines = formatCategory(chunk.catName, chunk.cmds, prefix, star);
      allLines = allLines.concat(catLines);
      allLines.push("");
    }

    const textH = allLines.length * 32 + 40;
    const slideH = IMG_H + textH;
    const catSvgBuf = Buffer.from(buildCategorySvg(allLines, textH));
    const catOverlay = await sharp(catSvgBuf).png().toBuffer();

    const slidePath = path.join(tmpDir, `menu-slide-${Date.now()}-${g}.png`);
    await sharp({
      create: { width: W, height: slideH, channels: 3, background: { r: 10, g: 10, b: 10 } },
    })
      .composite([
        { input: botImgBuf, top: 0, left: 0 },
        { input: catOverlay, top: IMG_H, left: 0 },
      ])
      .png()
      .toFile(slidePath);
    slides.push(slidePath);
  }

  return slides;
}

function cleanupSlides(slidePaths) {
  for (const p of slidePaths) {
    try { fs.unlinkSync(p); } catch (_) {}
  }
}

module.exports = { generateMenuSlides, cleanupSlides };
