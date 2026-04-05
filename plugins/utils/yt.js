const { execSync, exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");
const crypto = require("crypto");
const https = require("https");

const TEMP_DIR = path.join(os.tmpdir(), "yt-downloads");
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

let _ytDlpPath = null;
let _ytDlpReady = false;

function ensureYtDlpSync() {
  if (_ytDlpReady && _ytDlpPath && fs.existsSync(_ytDlpPath)) return _ytDlpPath;

  const checkPaths = ["/tmp/yt-dlp", "/usr/local/bin/yt-dlp", "/usr/bin/yt-dlp"];
  for (const p of checkPaths) {
    if (fs.existsSync(p)) {
      try { fs.chmodSync(p, 0o755); } catch {}
      try {
        execSync(`"${p}" --version`, { timeout: 5000, stdio: "pipe" });
        _ytDlpPath = p;
        _ytDlpReady = true;
        console.log(`[yt.js] Using yt-dlp at: ${p}`);
        return p;
      } catch {}
    }
  }

  const localPath = path.join(__dirname, "..", "..", "yt-dlp");
  if (fs.existsSync(localPath)) {
    try { fs.chmodSync(localPath, 0o755); } catch {}
    try {
      execSync(`python3 "${localPath}" --version`, { timeout: 5000, stdio: "pipe" });
      _ytDlpPath = `python3 "${localPath}"`;
      _ytDlpReady = true;
      console.log("[yt.js] Using yt-dlp via python3 (local)");
      return _ytDlpPath;
    } catch {}
    try {
      execSync(`"${localPath}" --version`, { timeout: 5000, stdio: "pipe" });
      _ytDlpPath = localPath;
      _ytDlpReady = true;
      console.log("[yt.js] Using yt-dlp direct (local)");
      return localPath;
    } catch {}
  }

  try {
    const which = execSync("which yt-dlp 2>/dev/null", { timeout: 3000 }).toString().trim();
    if (which) {
      try { fs.chmodSync(which, 0o755); } catch {}
      _ytDlpPath = which;
      _ytDlpReady = true;
      console.log(`[yt.js] Using yt-dlp from PATH: ${which}`);
      return which;
    }
  } catch {}

  try {
    console.log("[yt.js] Downloading yt-dlp standalone binary...");
    try {
      execSync("curl -sL https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux -o /tmp/yt-dlp && chmod 755 /tmp/yt-dlp", { timeout: 60000 });
      console.log("[yt.js] Downloaded yt-dlp_linux (standalone ELF binary)");
    } catch {
      execSync("curl -sL https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /tmp/yt-dlp && chmod 755 /tmp/yt-dlp", { timeout: 60000 });
      console.log("[yt.js] Downloaded yt-dlp (universal binary)");
    }
    if (fs.existsSync("/tmp/yt-dlp")) {
      try {
        execSync("/tmp/yt-dlp --version", { timeout: 5000, stdio: "pipe" });
        _ytDlpPath = "/tmp/yt-dlp";
        _ytDlpReady = true;
        return "/tmp/yt-dlp";
      } catch {
        try {
          execSync("python3 /tmp/yt-dlp --version", { timeout: 5000, stdio: "pipe" });
          _ytDlpPath = "python3 /tmp/yt-dlp";
          _ytDlpReady = true;
          console.log("[yt.js] Using yt-dlp via python3 fallback");
          return _ytDlpPath;
        } catch {}
      }
    }
  } catch (e) {
    console.error("[yt.js] Download failed:", e.message);
  }

  try {
    execSync("pip3 install --break-system-packages yt-dlp 2>/dev/null || pip3 install yt-dlp 2>/dev/null", { timeout: 60000 });
    const pipPath = execSync("which yt-dlp 2>/dev/null", { timeout: 3000 }).toString().trim();
    if (pipPath) {
      _ytDlpPath = pipPath;
      _ytDlpReady = true;
      console.log("[yt.js] Installed yt-dlp via pip3");
      return pipPath;
    }
  } catch {}

  console.error("[yt.js] WARNING: No yt-dlp found anywhere!");
  _ytDlpPath = "yt-dlp";
  return "yt-dlp";
}

const YT_DLP_FLAGS = "--no-check-certificate --no-warnings --no-playlist";

function makeTempPath(ext) {
  return path.join(TEMP_DIR, `${crypto.randomBytes(8).toString("hex")}.${ext}`);
}

function parseDuration(str) {
  const parts = str.split(":").map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] || 0;
}

function httpGet(url, opts = {}) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      timeout: opts.timeout || 15000,
      headers: opts.headers || { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
    }, (res) => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
        return httpGet(res.headers.location, opts).then(resolve).catch(reject);
      }
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => resolve({ statusCode: res.statusCode, body: Buffer.concat(chunks) }));
      res.on("error", reject);
    });
    req.on("error", reject);
    req.on("timeout", () => { req.destroy(); reject(new Error("timeout")); });
  });
}

function runYtDlp(args, timeout = 60000) {
  return new Promise((resolve, reject) => {
    const ytdlp = ensureYtDlpSync();
    const isWrapped = ytdlp.includes(" ");
    const cmd = isWrapped ? `${ytdlp} ${YT_DLP_FLAGS} ${args}` : `"${ytdlp}" ${YT_DLP_FLAGS} ${args}`;
    exec(cmd, { timeout, maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) return reject(new Error(stderr || err.message));
      resolve(stdout.trim());
    });
  });
}

async function searchYoutube(query, limit = 5) {
  try {
    const encoded = encodeURIComponent(query);
    const url = `https://www.youtube.com/results?search_query=${encoded}`;
    const res = await httpGet(url, { timeout: 15000 });
    const html = res.body.toString();

    const dataMatch = html.match(/var ytInitialData\s*=\s*({.+?});\s*<\/script>/s);
    if (!dataMatch) {
      return await searchYoutubeYtdlp(query, limit);
    }

    const data = JSON.parse(dataMatch[1]);
    const contents = data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents || [];

    const results = [];
    for (const item of contents) {
      const vid = item.videoRenderer;
      if (!vid || !vid.videoId) continue;
      results.push({
        id: vid.videoId,
        title: vid.title?.runs?.[0]?.text || "Unknown",
        url: `https://www.youtube.com/watch?v=${vid.videoId}`,
        duration: parseDuration(vid.lengthText?.simpleText || "0:00"),
        views: parseInt((vid.viewCountText?.simpleText || "0").replace(/[^0-9]/g, "")) || 0,
        channel: vid.ownerText?.runs?.[0]?.text || "Unknown",
        thumbnail: `https://i.ytimg.com/vi/${vid.videoId}/hqdefault.jpg`,
      });
      if (results.length >= limit) break;
    }
    return results.length > 0 ? results : await searchYoutubeYtdlp(query, limit);
  } catch (err) {
    console.error("YouTube search error:", err.message);
    return await searchYoutubeYtdlp(query, limit);
  }
}

async function searchYoutubeYtdlp(query, limit = 5) {
  try {
    const out = await runYtDlp(`ytsearch${limit}:"${query.replace(/"/g, '\\"')}" --flat-playlist --dump-json`, 30000);
    const lines = out.split("\n").filter(Boolean);
    return lines.map((line) => {
      const d = JSON.parse(line);
      return {
        id: d.id,
        title: d.title || "Unknown",
        url: d.url || `https://www.youtube.com/watch?v=${d.id}`,
        duration: d.duration || 0,
        views: d.view_count || 0,
        channel: d.channel || d.uploader || "Unknown",
        thumbnail: d.thumbnail || `https://i.ytimg.com/vi/${d.id}/hqdefault.jpg`,
      };
    });
  } catch (err) {
    console.error("yt-dlp search fallback error:", err.message);
    return [];
  }
}

async function getVideoInfo(url) {
  try {
    const out = await runYtDlp(`-j "${url}"`, 30000);
    const d = JSON.parse(out);
    return {
      id: d.id,
      title: d.title || "Unknown",
      url: d.webpage_url || url,
      duration: d.duration || 0,
      views: d.view_count || 0,
      channel: d.channel || d.uploader || "Unknown",
      thumbnail: d.thumbnail || `https://i.ytimg.com/vi/${d.id}/hqdefault.jpg`,
      description: d.description || "",
    };
  } catch (err) {
    console.error("Video info error:", err.message);
    return null;
  }
}

async function downloadVideo(url, quality = "360p") {
  const outPath = makeTempPath("mp4");

  try {
    const qualityMap = { "144p": 144, "240p": 240, "360p": 360, "480p": 480, "720p": 720, "1080p": 1080 };
    const h = qualityMap[quality] || 360;

    const formatStr = `best[height<=${h}][ext=mp4]/best[height<=${h}]/best[ext=mp4]/best`;

    await runYtDlp(`-f "${formatStr}" -o "${outPath}" "${url}"`, 120000);

    if (!fs.existsSync(outPath) || fs.statSync(outPath).size < 10000) {
      const files = fs.readdirSync(path.dirname(outPath));
      const base = path.basename(outPath, ".mp4");
      const alt = files.find((f) => f.startsWith(base));
      if (alt) {
        const altPath = path.join(path.dirname(outPath), alt);
        if (alt !== path.basename(outPath)) {
          fs.renameSync(altPath, outPath);
        }
      }
    }

    if (!fs.existsSync(outPath) || fs.statSync(outPath).size < 10000) {
      throw new Error("Download produced empty file");
    }

    let title = "video";
    try {
      const info = await runYtDlp(`--print title "${url}"`, 15000);
      title = info || "video";
    } catch {}

    return { path: outPath, title };
  } catch (err) {
    if (fs.existsSync(outPath)) fs.unlinkSync(outPath);
    throw new Error(`Video download failed: ${err.message}`);
  }
}

async function downloadAudio(url) {
  const rawPath = makeTempPath("webm");
  const outPath = makeTempPath("mp3");

  try {
    await runYtDlp(`-f "bestaudio" -o "${rawPath}" "${url}"`, 120000);

    if (!fs.existsSync(rawPath) || fs.statSync(rawPath).size < 5000) {
      const dir = path.dirname(rawPath);
      const base = path.basename(rawPath, ".webm");
      const files = fs.readdirSync(dir);
      const alt = files.find((f) => f.startsWith(base));
      if (alt) {
        const altPath = path.join(dir, alt);
        if (altPath !== rawPath) fs.renameSync(altPath, rawPath);
      }
    }

    if (!fs.existsSync(rawPath) || fs.statSync(rawPath).size < 5000) {
      throw new Error("Audio download produced empty file");
    }

    try {
      execSync(`ffmpeg -i "${rawPath}" -codec:a libmp3lame -qscale:a 2 "${outPath}" -y 2>/dev/null`, { timeout: 60000 });
      if (fs.existsSync(rawPath)) fs.unlinkSync(rawPath);
    } catch {
      if (fs.existsSync(outPath)) fs.unlinkSync(outPath);
      fs.renameSync(rawPath, outPath);
    }

    if (!fs.existsSync(outPath) || fs.statSync(outPath).size < 5000) {
      throw new Error("Audio conversion failed");
    }

    let title = "audio";
    try {
      const info = await runYtDlp(`--print title "${url}"`, 15000);
      title = info || "audio";
    } catch {}

    return { path: outPath, title };
  } catch (err) {
    if (fs.existsSync(rawPath)) fs.unlinkSync(rawPath);
    if (fs.existsSync(outPath)) fs.unlinkSync(outPath);
    throw new Error(`Audio download failed: ${err.message}`);
  }
}

function convertM4aToMp3(inputPath) {
  try {
    const outPath = inputPath.replace(/\.m4a$/i, ".mp3");
    execSync(`ffmpeg -i "${inputPath}" -codec:a libmp3lame -qscale:a 2 "${outPath}" -y 2>/dev/null`, { timeout: 60000 });
    return outPath;
  } catch {
    return inputPath;
  }
}

module.exports = {
  searchYoutube,
  getVideoInfo,
  downloadVideo,
  downloadAudio,
  convertM4aToMp3,
};
