const { Module } = require("../main");
const config = require("../config");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { getTempPath } = require("../core/helpers");

const isFromMe = config.MODE === "public" ? false : true;
const BRAND = "DevilXteam MD";

Module(
  {
    pattern: "twitter ?(.*)",
    fromMe: isFromMe,
    desc: "Download Twitter/X videos",
    usage: ".twitter <url>",
    use: "download",
  },
  async (message, match) => {
    const url = match[1] || message.reply_message?.text;
    if (!url || !url.startsWith("http"))
      return await message.sendReply("_Need a valid Twitter/X link_");

    try {
      await message.react("⏳");
      const apis = [
        async () => {
          const { data } = await axios.get(
            `https://www.dark-yasiya-api.site/download/twitter?url=${encodeURIComponent(url)}`,
            { timeout: 20000 }
          );
          if (data?.status && data.result?.video_hd) return data.result.video_hd;
          if (data?.status && data.result?.video_sd) return data.result.video_sd;
          return null;
        },
        async () => {
          const { data } = await axios.get(
            `https://api.agatz.xyz/api/twitter?url=${encodeURIComponent(url)}`,
            { timeout: 20000 }
          );
          if (data?.status === 200 && data.data) {
            const hd = data.data.find((i) => i.quality === "HD");
            const sd = data.data.find((i) => i.quality === "SD");
            return (hd || sd || data.data[0])?.url || null;
          }
          return null;
        },
      ];

      let videoUrl = null;
      for (const api of apis) {
        try {
          videoUrl = await api();
          if (videoUrl) break;
        } catch (_) {}
      }

      if (!videoUrl) {
        await message.react("❌");
        return await message.sendReply("_Twitter download failed, try again later_");
      }

      await message.sendReply({ url: videoUrl }, "video");
      await message.react("✅");
    } catch (e) {
      console.error("Twitter DL error:", e.message);
      await message.react("❌");
      return await message.sendReply("_Twitter download error, try again later_");
    }
  }
);

Module(
  {
    pattern: "mediafire ?(.*)",
    fromMe: isFromMe,
    desc: "Download MediaFire files",
    usage: ".mediafire <url>",
    use: "download",
  },
  async (message, match) => {
    const url = match[1] || message.reply_message?.text;
    if (!url) return await message.sendReply("_Need a valid MediaFire link_");

    try {
      await message.react("⏳");
      const { data } = await axios.get(
        `https://www.dark-yasiya-api.site/download/mfire?url=${encodeURIComponent(url)}`,
        { timeout: 30000 }
      );

      if (!data?.status || !data.result?.dl_link)
        return await message.sendReply("_MediaFire download failed. Check if link is valid and public._");

      const { dl_link, fileName, fileType } = data.result;
      const caption =
        `*╔══ 📥 ${BRAND} MEDIAFIRE ══╗*\n` +
        `*┃ 📄 File:* ${fileName || "Unknown"}\n` +
        `*┃ 📦 Type:* ${fileType || "Unknown"}\n` +
        `*╚══ Powered by ${BRAND} ══╝*`;

      await message.sendMessage({ url: dl_link }, "document", {
        fileName: fileName || "mediafire_download",
        mimetype: fileType || "application/octet-stream",
        caption,
      });
      await message.react("✅");
    } catch (e) {
      console.error("MediaFire error:", e.message);
      await message.react("❌");
      return await message.sendReply("_MediaFire download error_");
    }
  }
);

Module(
  {
    pattern: "apk ?(.*)",
    fromMe: isFromMe,
    desc: "Download APK from Aptoide",
    usage: ".apk <app name>",
    use: "download",
  },
  async (message, match) => {
    const query = match[1];
    if (!query) return await message.sendReply("_Need an app name to search_");

    try {
      await message.react("⏳");
      const { data } = await axios.get(
        `http://ws75.aptoide.com/api/7/apps/search/query=${encodeURIComponent(query)}/limit=1`,
        { timeout: 20000 }
      );

      if (!data?.datalist?.list?.length)
        return await message.sendReply("_No app found with that name_");

      const app = data.datalist.list[0];
      const appSize = (app.size / 1048576).toFixed(2);
      const caption =
        `*╔══ 📦 ${BRAND} APK ══╗*\n` +
        `*┃ 📱 Name:* ${app.name}\n` +
        `*┃ 🏋 Size:* ${appSize} MB\n` +
        `*┃ 📦 Package:* ${app.package}\n` +
        `*┃ 📅 Updated:* ${app.updated}\n` +
        `*┃ 👨‍💻 Developer:* ${app.developer?.name || "Unknown"}\n` +
        `*╚══ Powered by ${BRAND} ══╝*`;

      await message.sendMessage({ url: app.file.path_alt }, "document", {
        fileName: `${app.name}.apk`,
        mimetype: "application/vnd.android.package-archive",
        caption,
      });
      await message.react("✅");
    } catch (e) {
      console.error("APK error:", e.message);
      await message.react("❌");
      return await message.sendReply("_APK download error, try again_");
    }
  }
);

Module(
  {
    pattern: "gdrive ?(.*)",
    fromMe: isFromMe,
    desc: "Download Google Drive files",
    usage: ".gdrive <url>",
    use: "download",
  },
  async (message, match) => {
    const url = match[1] || message.reply_message?.text;
    if (!url) return await message.sendReply("_Need a valid Google Drive link_");

    try {
      await message.react("⏳");
      const { data } = await axios.get(
        `https://api.fgmods.xyz/api/downloader/gdrive?url=${encodeURIComponent(url)}&apikey=mnp3grlZ`,
        { timeout: 30000 }
      );

      if (!data?.result?.downloadUrl)
        return await message.sendReply("_GDrive download failed. Check link._");

      await message.sendMessage({ url: data.result.downloadUrl }, "document", {
        fileName: data.result.fileName || "gdrive_file",
        mimetype: data.result.mimetype || "application/octet-stream",
        caption: `*📥 Downloaded via ${BRAND}*`,
      });
      await message.react("✅");
    } catch (e) {
      console.error("GDrive error:", e.message);
      await message.react("❌");
      return await message.sendReply("_GDrive download error_");
    }
  }
);

Module(
  {
    pattern: "spotify ?(.*)",
    fromMe: isFromMe,
    desc: "Download songs from Spotify",
    usage: ".spotify <song name>",
    use: "download",
  },
  async (message, match) => {
    const query = match[1];
    if (!query) return await message.sendReply("_Need a song name_\n_Example: .spotify pasoori_");

    try {
      await message.react("🎵");
      const searchRes = await axios.get(
        `https://jerrycoder.oggyapi.workers.dev/spotify?search=${encodeURIComponent(query)}`,
        { timeout: 20000 }
      );

      if (!searchRes.data?.tracks?.length)
        return await message.sendReply("_No song found on Spotify_");

      const bestSong = searchRes.data.tracks[0];
      const dlRes = await axios.get(
        `https://jerrycoder.oggyapi.workers.dev/dspotify?url=${encodeURIComponent(bestSong.spotifyUrl)}`,
        { timeout: 20000 }
      );

      if (!dlRes.data?.status || !dlRes.data.download_link)
        return await message.sendReply("_Failed to get Spotify download link_");

      const audioUrl = dlRes.data.download_link;
      const title = dlRes.data.title || bestSong.trackName;
      const artist = dlRes.data.artist || bestSong.artist;

      const audioData = await axios.get(audioUrl, {
        responseType: "arraybuffer",
        timeout: 60000,
      });
      const audioBuffer = Buffer.from(audioData.data);

      await message.sendMessage(audioBuffer, "audio", {
        mimetype: "audio/mpeg",
        fileName: `${title}.mp3`,
      });
      await message.react("✅");
    } catch (e) {
      console.error("Spotify error:", e.message);
      await message.react("❌");
      return await message.sendReply("_Spotify download error, try again_");
    }
  }
);
