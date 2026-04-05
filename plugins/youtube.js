const { Module } = require("../main");
const fs = require("fs");
const path = require("path");
const {
  downloadVideo,
  downloadAudio,
  searchYoutube,
  getVideoInfo,
  convertM4aToMp3,
} = require("./utils/yt");
const { spotifyTrack } = require("./utils/misc");

const config = require("../config");
const MODE = config.MODE;
const fromMe = MODE === "public" ? false : true;

const VIDEO_SIZE_LIMIT = 1024 * 1024 * 1024;
const DOWNLOAD_DOC_LIMIT = 50 * 1024 * 1024;

const downloadSearchSessions = new Map();
const downloadVideoSessions = new Map();

function makeProgressBar(pct, width = 14) {
  const filled = Math.max(0, Math.min(width, Math.round((pct / 100) * width)));
  return "▓".repeat(filled) + "░".repeat(width - filled);
}

function makeDownloadMsg(title, elapsed, pct) {
  const bar = makeProgressBar(pct);
  const shortTitle = title.length > 35 ? title.slice(0, 35) + "..." : title;
  return (
    "╔══ ⬇️ *DevilXteam MD DOWNLOADER* ══╗\n\n" +
    `📹 *${shortTitle}*\n\n` +
    `${bar} ${pct}%\n` +
    `⏱️ *Time:* ${elapsed}s\n` +
    "📡 *Downloading...*\n\n" +
    "╚══ _Powered by DevilXteam MD_ ══╝"
  );
}

function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

function formatViews(views) {
  if (views >= 1000000) {
    return (views / 1000000).toFixed(1) + "M";
  } else if (views >= 1000) {
    return (views / 1000).toFixed(1) + "K";
  }
  return views?.toString() || "N/A";
}

Module(
  {
    pattern: "song ?(.*)",
    fromMe: fromMe,
    desc: "YouTube pe search aur audio download",
    usage: ".song <query>",
    use: "download",
  },
  async (message, match) => {
    const query = match[1];
    if (!query) {
      return await message.sendReply(
        "_Please provide a search query!_\n_Example: .song faded alan walker_"
      );
    }

    try {
      const searchMsg = await message.sendReply("_YouTube pe search ho raha hai..._");
      const results = await searchYoutube(query, 10);

      if (!results || results.length === 0) {
        return await message.edit(
          "_No results found!_",
          message.jid,
          searchMsg.key
        );
      }

      let resultText = "YouTube Search Results\n\n";
      resultText += `_Found ${results.length} results for:_ *${query}*\n\n`;

      results.forEach((video, index) => {
        resultText += `*${index + 1}.* ${video.title}\n`;
        resultText += `   _Duration:_ \`${
          video.duration
        }\` | _Views:_ \`${formatViews(video.views)}\`\n`;
        resultText += `   _Channel:_ ${video.channel.name}\n\n`;
      });

      resultText += "_Reply with a number (1-10) to download audio_";

      await message.edit(resultText, message.jid, searchMsg.key);
    } catch (error) {
      console.error("Song search error:", error);
      await message.sendReply("_Search nakaam. Baad mein try karo._");
    }
  }
);

Module(
  {
    pattern: "yts ?(.*)",
    fromMe: fromMe,
    desc: "YouTube pe tafseeli search",
    usage: ".yts <query>",
    use: "download",
  },
  async (message, match) => {
    const query = match[1];
    if (!query) {
      return await message.sendReply(
        "_Please provide a search query!_\n_Example: .yts ncs music_"
      );
    }

    try {
      const searchMsg = await message.sendReply("_YouTube pe search ho raha hai..._");
      const results = await searchYoutube(query, 10);

      if (!results || results.length === 0) {
        return await message.edit(
          "_No results found!_",
          message.jid,
          searchMsg.key
        );
      }

      let resultText = "YouTube Search Results\n\n";
      resultText += `_Found ${results.length} results for:_ *${query}*\n\n`;

      results.forEach((video, index) => {
        resultText += `*${index + 1}.* ${video.title}\n`;
        resultText += `   _Duration:_ \`${
          video.duration
        }\` | _Views:_ \`${formatViews(video.views)}\`\n`;
        resultText += `   _Channel:_ ${video.channel.name}\n\n`;
      });

      resultText += "_Reply with a number (1-10) to see video details_";

      await message.edit(resultText, message.jid, searchMsg.key);
    } catch (error) {
      console.error("YTS search error:", error);
      await message.sendReply("_Search nakaam. Baad mein try karo._");
    }
  }
);

Module(
  {
    pattern: "ytv ?(.*)",
    fromMe: fromMe,
    desc: "YouTube video quality chun ke download karo",
    usage: ".ytv <link>",
    use: "download",
  },
  async (message, match) => {
    let url = match[1] || message.reply_message?.text;

    if (url && /\bhttps?:\/\/\S+/gi.test(url)) {
      url = url.match(/\bhttps?:\/\/\S+/gi)[0];
    }

    if (!url || (!url.includes("youtube.com") && !url.includes("youtu.be"))) {
      return await message.sendReply(
        "_Please provide a valid YouTube link!_\n_Example: .ytv https://youtube.com/watch?v=xxxxx or https://youtube.com/shorts/xxxxx_"
      );
    }

    // Convert YouTube Shorts URL to regular watch URL if needed
    if (url.includes("youtube.com/shorts/")) {
      const shortId = url.match(/youtube\.com\/shorts\/([A-Za-z0-9_-]+)/)?.[1];
      if (shortId) {
        url = `https://www.youtube.com/watch?v=${shortId}`;
      }
    }

    try {
      const infoMsg = await message.sendReply("_📊 Fetching video info..._");
      const info = await getVideoInfo(url);

      const videoFormats = info.formats
        .filter((f) => f.type === "video" && f.quality)
        .sort((a, b) => {
          const getRes = (q) => {
            const match = q.match(/(\d+)/);
            return match ? parseInt(match[1]) : 0;
          };
          return getRes(b.quality) - getRes(a.quality);
        });

      const uniqueQualities = [...new Set(videoFormats.map((f) => f.quality))];

      const videoIdMatch = url.match(
        /(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([^&\s/?]+)/
      );
      const videoId = videoIdMatch ? videoIdMatch[1] : info.videoId || "";

      let qualityText = "_*Select Video Quality*_\n\n";
      qualityText += `_*${info.title}*_\n\n(${videoId})\n\n`;

      if (uniqueQualities.length === 0) {
        return await message.edit(
          "_No video formats available for this video._",
          message.jid,
          infoMsg.key
        );
      }

      uniqueQualities.forEach((quality, index) => {
        const format = videoFormats.find((f) => f.quality === quality);
        const audioFormat = info.formats.find((f) => f.type === "audio");

        let sizeInfo = "";
        if (format.size && audioFormat?.size) {
          // Parse sizes and estimate total
          const parseSize = (sizeStr) => {
            const match = sizeStr.match(/([\d.]+)\s*(KB|MB|GB)/i);
            if (!match) return 0;
            const value = parseFloat(match[1]);
            const unit = match[2].toUpperCase();
            if (unit === "KB") return value * 1024;
            if (unit === "MB") return value * 1024 * 1024;
            if (unit === "GB") return value * 1024 * 1024 * 1024;
            return value;
          };

          const videoSize = parseSize(format.size);
          const audioSize = parseSize(audioFormat.size);
          const totalSize = videoSize + audioSize;

          if (totalSize > 0) {
            sizeInfo = ` ~ _${formatBytes(totalSize)}_`;
          }
        }

        qualityText += `*${index + 1}.* _*${quality}*_${sizeInfo}\n`;
      });

      const audioFormat = info.formats.find((f) => f.type === "audio");
      if (audioFormat) {
        let audioSizeInfo = "";
        if (audioFormat.size) {
          const parseSize = (sizeStr) => {
            const match = sizeStr.match(/([\d.]+)\s*(KB|MB|GB)/i);
            if (!match) return 0;
            const value = parseFloat(match[1]);
            const unit = match[2].toUpperCase();
            if (unit === "KB") return value * 1024;
            if (unit === "MB") return value * 1024 * 1024;
            if (unit === "GB") return value * 1024 * 1024 * 1024;
            return value;
          };
          const audioSize = parseSize(audioFormat.size);
          if (audioSize > 0) {
            audioSizeInfo = ` ~ _${formatBytes(audioSize)}_`;
          }
        }
        qualityText += `*${
          uniqueQualities.length + 1
        }.* _*Audio Only*_${audioSizeInfo}\n`;
      }

      qualityText += "\n_Reply with a number to download_";

      await message.edit(qualityText, message.jid, infoMsg.key);
    } catch (error) {
      console.error("YTV info error:", error);
      await message.sendReply(
        "_Failed to fetch video info. Please check the link._"
      );
    }
  }
);

Module(
  {
    pattern: "video ?(.*)",
    fromMe: fromMe,
    desc: "YouTube video 360p mein download karo",
    usage: ".video <link>",
    use: "download",
  },
  async (message, match) => {
    let url = match[1] || message.reply_message?.text;

    if (url && /\bhttps?:\/\/\S+/gi.test(url)) {
      url = url.match(/\bhttps?:\/\/\S+/gi)[0];
    }

    if (!url || (!url.includes("youtube.com") && !url.includes("youtu.be"))) {
      return await message.sendReply(
        "_Please provide a valid YouTube link!_\n_Example: .video https://youtube.com/watch?v=xxxxx or https://youtube.com/shorts/xxxxx_"
      );
    }

    // Convert YouTube Shorts URL to regular watch URL if needed
    if (url.includes("youtube.com/shorts/")) {
      const shortId = url.match(/youtube\.com\/shorts\/([A-Za-z0-9_-]+)/)?.[1];
      if (shortId) {
        url = `https://www.youtube.com/watch?v=${shortId}`;
      }
    }

    let downloadMsg;
    let videoPath;

    try {
      downloadMsg = await message.sendReply("_Video download ho raha hai..._");
      const result = await downloadVideo(url, "360p");
      videoPath = result.path;

      await message.edit("_Uploading video..._", message.jid, downloadMsg.key);

      const stats = fs.statSync(videoPath);

      if (stats.size > VIDEO_SIZE_LIMIT) {
        const stream = fs.createReadStream(videoPath);
        await message.sendMessage({ stream }, "document", {
          fileName: `${result.title}.mp4`,
          mimetype: "video/mp4",
          caption: `_*${result.title}*_\n\n_File size: ${formatBytes(
            stats.size
          )}_\n_Quality: 360p_`,
        });
        stream.destroy();
      } else {
        const stream = fs.createReadStream(videoPath);
        await message.sendReply({ stream }, "video", {
          caption: `_*${result.title}*_\n\n_Quality: 360p_`,
        });
        stream.destroy();
      }

      await message.edit("_Download complete!_", message.jid, downloadMsg.key);

      await new Promise((resolve) => setTimeout(resolve, 100));
      if (fs.existsSync(videoPath)) {
        fs.unlinkSync(videoPath);
      }
    } catch (error) {
      console.error("Video download error:", error);
      if (downloadMsg) {
        await message.edit("_Download failed!_", message.jid, downloadMsg.key);
      } else {
        await message.sendReply("_Download nakaam. Dobara try karo._");
      }

      if (videoPath && fs.existsSync(videoPath)) {
        fs.unlinkSync(videoPath);
      }
    }
  }
);

Module(
  {
    pattern: "yta ?(.*)",
    fromMe: fromMe,
    desc: "YouTube audio document mein download karo",
    usage: ".yta <link>",
    use: "download",
  },
  async (message, match) => {
    let url = match[1] || message.reply_message?.text;

    if (url && /\bhttps?:\/\/\S+/gi.test(url)) {
      url = url.match(/\bhttps?:\/\/\S+/gi)[0];
    }

    if (!url || (!url.includes("youtube.com") && !url.includes("youtu.be"))) {
      return await message.sendReply(
        "_Please provide a valid YouTube link!_\n_Example: .yta https://youtube.com/watch?v=xxxxx or https://youtube.com/shorts/xxxxx_"
      );
    }

    // Convert YouTube Shorts URL to regular watch URL if needed
    if (url.includes("youtube.com/shorts/")) {
      const shortId = url.match(/youtube\.com\/shorts\/([A-Za-z0-9_-]+)/)?.[1];
      if (shortId) {
        url = `https://www.youtube.com/watch?v=${shortId}`;
      }
    }

    let downloadMsg;
    let audioPath;

    try {
      downloadMsg = await message.sendReply("_Audio download ho raha hai..._");
      const result = await downloadAudio(url);
      audioPath = result.path;

      const mp3Path = await convertM4aToMp3(audioPath);
      audioPath = mp3Path;

      await message.edit("_Sending audio..._", message.jid, downloadMsg.key);

      const stream = fs.createReadStream(audioPath);
      await message.sendMessage({ stream }, "document", {
        fileName: `${result.title}.m4a`,
        mimetype: "audio/mp4",
        caption: `_*${result.title}*_`,
      });
      stream.destroy();

      await message.edit("_Download complete!_", message.jid, downloadMsg.key);

      await new Promise((resolve) => setTimeout(resolve, 100));
      if (fs.existsSync(audioPath)) {
        fs.unlinkSync(audioPath);
      }
    } catch (error) {
      console.error("YTA download error:", error);
      if (downloadMsg) {
        await message.edit("_Download failed!_", message.jid, downloadMsg.key);
      } else {
        await message.sendReply("_Download nakaam. Dobara try karo._");
      }

      if (audioPath && fs.existsSync(audioPath)) {
        fs.unlinkSync(audioPath);
      }
    }
  }
);

Module(
  {
    pattern: "play ?(.*)",
    fromMe: fromMe,
    desc: "Play audio from YouTube search or link",
    usage: ".play <song name or link>",
    use: "download",
  },
  async (message, match) => {
    let input = match[1] || message.reply_message?.text;
    if (!input) {
      return await message.sendReply(
        "_Please provide a song name or link!_\n_Example: .play faded alan walker_"
      );
    }

    let downloadMsg;
    let audioPath;

    try {
      let url = null;
      if (/\bhttps?:\/\/\S+/gi.test(input)) {
        const urlMatch = input.match(/\bhttps?:\/\/\S+/gi);
        if (
          urlMatch &&
          (urlMatch[0].includes("youtube.com") ||
            urlMatch[0].includes("youtu.be"))
        ) {
          url = urlMatch[0];
          // Convert YouTube Shorts URL to regular watch URL if needed
          if (url.includes("youtube.com/shorts/")) {
            const shortId = url.match(
              /youtube\.com\/shorts\/([A-Za-z0-9_-]+)/
            )?.[1];
            if (shortId) {
              url = `https://www.youtube.com/watch?v=${shortId}`;
            }
          }
        }
      }

      if (url) {
        downloadMsg = await message.sendReply("_Audio download ho raha hai..._");
        const result = await downloadAudio(url);
        audioPath = result.path;

        const mp3Path = await convertM4aToMp3(audioPath);
        audioPath = mp3Path;

        await message.edit(
          `_Sending *${result.title}*..._`,
          message.jid,
          downloadMsg.key
        );

        const stream1 = fs.createReadStream(audioPath);
        await message.sendReply({ stream: stream1 }, "audio", {
          mimetype: "audio/mp4",
        });
        stream1.destroy();

        await message.edit(
          `_Downloaded *${result.title}*!_`,
          message.jid,
          downloadMsg.key
        );

        await new Promise((resolve) => setTimeout(resolve, 100));
        if (fs.existsSync(audioPath)) {
          fs.unlinkSync(audioPath);
        }
      } else {
        const query = input;
        downloadMsg = await message.sendReply("_Searching..._");
        const results = await searchYoutube(query, 1);

        if (!results || results.length === 0) {
          return await message.edit(
            "_No results found!_",
            message.jid,
            downloadMsg.key
          );
        }

        const video = results[0];
        await message.edit(
          `_Downloading *${video.title}*..._`,
          message.jid,
          downloadMsg.key
        );

        const result = await downloadAudio(video.url);
        audioPath = result.path;

        const mp3Path = await convertM4aToMp3(audioPath);
        audioPath = mp3Path;

        await message.edit(
          `_Sending *${video.title}*..._`,
          message.jid,
          downloadMsg.key
        );

        const stream2 = fs.createReadStream(audioPath);
        await message.sendReply({ stream: stream2 }, "audio", {
          mimetype: "audio/mp4",
        });
        stream2.destroy();

        await message.edit(
          `_Downloaded *${video.title}*!_`,
          message.jid,
          downloadMsg.key
        );

        await new Promise((resolve) => setTimeout(resolve, 100));
        if (fs.existsSync(audioPath)) {
          fs.unlinkSync(audioPath);
        }
      }
    } catch (error) {
      console.error("Play error:", error);
      if (downloadMsg) {
        await message.edit("_Download failed!_", message.jid, downloadMsg.key);
      } else {
        await message.sendReply("_Download nakaam. Dobara try karo._");
      }

      if (audioPath && fs.existsSync(audioPath)) {
        fs.unlinkSync(audioPath);
      }
    }
  }
);

Module(
  {
    on: "text",
    fromMe: fromMe,
  },
  async (message, match) => {
    const numberMatch = message.text?.match(/^\d+$/);
    if (!numberMatch) return;
    const selectedNumber = parseInt(numberMatch[0]);
    if (
      !message.reply_message ||
      !message.reply_message.fromMe ||
      !message.reply_message.message
    ) {
      return;
    }
    const repliedText = message.reply_message.message;
    if (
      repliedText.includes("YouTube Search Results") &&
      repliedText.includes("to download audio")
    ) {
      if (selectedNumber < 1 || selectedNumber > 10) {
        return await message.sendReply("_Please select a number between 1-10_");
      }

      const lines = repliedText.split("\n");
      let videoTitle = null;
      let videoUrl = null;

      try {
        const queryMatch = repliedText.match(
          /Found \d+ results for:_\s*\*(.+?)\*/
        );
        if (!queryMatch) return;

        const query = queryMatch[1];
        const results = await searchYoutube(query, 10);

        if (!results[selectedNumber - 1]) {
          return await message.sendReply("_Invalid selection!_");
        }

        const selectedVideo = results[selectedNumber - 1];
        let downloadMsg;
        let audioPath;

        try {
          downloadMsg = await message.sendReply(
            `_Downloading *${selectedVideo.title}*..._`
          );

          const result = await downloadAudio(selectedVideo.url);
          audioPath = result.path;

          const mp3Path = await convertM4aToMp3(audioPath);
          audioPath = mp3Path;

          await message.edit(
            "_Sending audio..._",
            message.jid,
            downloadMsg.key
          );

          const stream3 = fs.createReadStream(audioPath);
          await message.sendReply({ stream: stream3 }, "audio", {
            mimetype: "audio/mp4",
          });
          stream3.destroy();

          await message.edit(
            "_Download complete!_",
            message.jid,
            downloadMsg.key
          );

          await new Promise((resolve) => setTimeout(resolve, 100));
          if (fs.existsSync(audioPath)) {
            fs.unlinkSync(audioPath);
          }
        } catch (error) {
          console.error("Song download error:", error);
          if (downloadMsg) {
            await message.edit(
              "_Download failed!_",
              message.jid,
              downloadMsg.key
            );
          }

          if (audioPath && fs.existsSync(audioPath)) {
            fs.unlinkSync(audioPath);
          }
        }
      } catch (error) {
        console.error("Song selection error:", error);
        await message.sendReply("_Failed to process your selection._");
      }
    } else if (
      repliedText.includes("YouTube Search Results") &&
      repliedText.includes("see video details")
    ) {
      if (selectedNumber < 1 || selectedNumber > 10) {
        return await message.sendReply("_Please select a number between 1-10_");
      }

      try {
        const queryMatch = repliedText.match(
          /Found \d+ results for:_\s*\*(.+?)\*/
        );
        if (!queryMatch) return;

        const query = queryMatch[1];
        const results = await searchYoutube(query, 10);

        if (!results[selectedNumber - 1]) {
          return await message.sendReply("_Invalid selection!_");
        }

        const selectedVideo = results[selectedNumber - 1];

        const axios = require("axios");
        const thumbnailResponse = await axios.get(selectedVideo.thumbnail, {
          responseType: "arraybuffer",
        });
        const thumbnailBuffer = Buffer.from(thumbnailResponse.data);

        let caption = `_*${selectedVideo.title}*_\n\n`;
        caption += `*Channel:* ${selectedVideo.channel.name}\n`;
        caption += `*Duration:* \`${selectedVideo.duration}\`\n`;
        caption += `*Views:* \`${formatViews(selectedVideo.views)}\`\n`;
        caption += `*Uploaded:* ${selectedVideo.uploadedAt || "N/A"}\n\n`;
        caption += `*URL:* ${selectedVideo.url}\n\n`;
        caption += "_Reply with:_\n";
        caption += "*1.* Audio\n";
        caption += "*2.* Video";

        await message.sendReply(thumbnailBuffer, "image", {
          caption: caption,
        });
      } catch (error) {
        console.error("YTS video info error:", error);
        await message.sendReply("_Failed to fetch video info._");
      }
    } else if (
      repliedText.includes("Reply with:") &&
      repliedText.includes("* Audio")
    ) {
      if (selectedNumber !== 1 && selectedNumber !== 2) {
        return await message.sendReply(
          "_Please select 1 for Audio or 2 for Video_"
        );
      }

      try {
        const urlMatch = repliedText.match(/\*URL:\*\s*(https?:\/\/\S+)/m);
        if (!urlMatch) return;

        const url = urlMatch[1].trim();
        const titleMatch = repliedText.match(/_\*([^*]+)\*_/);
        const title = titleMatch ? titleMatch[1] : "Video";

        let downloadMsg;
        let filePath;

        if (selectedNumber === 1) {
          try {
            downloadMsg = await message.sendReply(`_Audio download ho raha hai..._`);

            const result = await downloadAudio(url);
            filePath = result.path;

            const mp3Path = await convertM4aToMp3(filePath);
            filePath = mp3Path;

            await message.edit(
              "_Sending audio..._",
              message.jid,
              downloadMsg.key
            );

            const stream4 = fs.createReadStream(filePath);
            await message.sendReply({ stream: stream4 }, "audio", {
              mimetype: "audio/mp4",
            });
            stream4.destroy();

            await message.edit(
              "_Download complete!_",
              message.jid,
              downloadMsg.key
            );

            await new Promise((resolve) => setTimeout(resolve, 100));
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
          } catch (error) {
            console.error("YTS audio download error:", error);
            if (downloadMsg) {
              await message.edit(
                "_Download failed!_",
                message.jid,
                downloadMsg.key
              );
            }

            if (filePath && fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
          }
        } else if (selectedNumber === 2) {
          try {
            downloadMsg = await message.sendReply(`_Video download ho raha hai..._`);

            const result = await downloadVideo(url, "360p");
            filePath = result.path;

            await message.edit(
              "_Uploading video..._",
              message.jid,
              downloadMsg.key
            );

            const stats = fs.statSync(filePath);

            if (stats.size > VIDEO_SIZE_LIMIT) {
              const stream5 = fs.createReadStream(filePath);
              await message.sendMessage({ stream: stream5 }, "document", {
                fileName: `${result.title}.mp4`,
                mimetype: "video/mp4",
                caption: `_*${result.title}*_\n\n_File size: ${formatBytes(
                  stats.size
                )}_\n_Quality: 360p_`,
              });
              stream5.destroy();
            } else {
              const stream6 = fs.createReadStream(filePath);
              await message.sendReply({ stream: stream6 }, "video", {
                caption: `_*${result.title}*_\n\n_Quality: 360p_`,
              });
              stream6.destroy();
            }

            await message.edit(
              "_Download complete!_",
              message.jid,
              downloadMsg.key
            );

            await new Promise((resolve) => setTimeout(resolve, 100));
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
          } catch (error) {
            console.error("YTS video download error:", error);
            if (downloadMsg) {
              await message.edit(
                "_Download failed!_",
                message.jid,
                downloadMsg.key
              );
            }

            if (filePath && fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
          }
        }
      } catch (error) {
        console.error("YTS download selection error:", error);
        await message.sendReply("_Failed to process download._");
      }
    } else if (
      repliedText.includes("Select Video Quality") &&
      repliedText.includes("Reply with a number")
    ) {
      try {
        const lines = repliedText.split("\n");
        let videoId = "";

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();

          if (
            line.startsWith("(") &&
            line.endsWith(")") &&
            line.length >= 13 &&
            !line.includes("Select") &&
            !line.includes("Reply") &&
            !line.match(/^\*\d+\./)
          ) {
            videoId = line.replace(/[()]/g, "").trim();
            if (videoId.length >= 10) break;
          }
        }

        if (!videoId || videoId.length < 10) {
          return await message.sendReply("_Failed to retrieve video ID._");
        }

        const url = `https://www.youtube.com/watch?v=${videoId}`;

        const titleMatch = repliedText.match(/_\*([^*]+)\*_/);
        if (!titleMatch) return;

        const qualityLines = lines.filter((line) => line.match(/^\*\d+\./));

        if (!qualityLines[selectedNumber - 1]) {
          return await message.sendReply("_Invalid quality selection!_");
        }

        const selectedLine = qualityLines[selectedNumber - 1];
        const isAudioOnly = selectedLine.includes("Audio Only");

        if (isAudioOnly) {
          let downloadMsg;
          let audioPath;

          try {
            downloadMsg = await message.sendReply("_Audio download ho raha hai..._");

            const result = await downloadAudio(url);
            audioPath = result.path;

            const mp3Path = await convertM4aToMp3(audioPath);
            audioPath = mp3Path;

            await message.edit(
              "_Sending audio..._",
              message.jid,
              downloadMsg.key
            );

            const stream = fs.createReadStream(audioPath);
            await message.sendMessage({ stream }, "document", {
              fileName: `${result.title}.m4a`,
              mimetype: "audio/mp4",
              caption: `_*${result.title}*_`,
            });
            stream.destroy();

            await message.edit(
              "_Download complete!_",
              message.jid,
              downloadMsg.key
            );

            await new Promise((resolve) => setTimeout(resolve, 100));
            if (fs.existsSync(audioPath)) {
              fs.unlinkSync(audioPath);
            }
          } catch (error) {
            console.error("YTV audio download error:", error);
            if (downloadMsg) {
              await message.edit(
                "_Download failed!_",
                message.jid,
                downloadMsg.key
              );
            }

            if (audioPath && fs.existsSync(audioPath)) {
              fs.unlinkSync(audioPath);
            }
          }
        } else {
          const qualityMatch = selectedLine.match(/(\d+p)/);
          if (!qualityMatch) return;

          const selectedQuality = qualityMatch[1];

          let downloadMsg;
          let videoPath;

          try {
            downloadMsg = await message.sendReply(
              `_Downloading video at *${selectedQuality}*..._`
            );

            const result = await downloadVideo(url, selectedQuality);
            videoPath = result.path;

            await message.edit(
              "_Uploading video..._",
              message.jid,
              downloadMsg.key
            );

            const stats = fs.statSync(videoPath);

            if (stats.size > VIDEO_SIZE_LIMIT) {
              const stream7 = fs.createReadStream(videoPath);
              await message.sendMessage({ stream: stream7 }, "document", {
                fileName: `${result.title}.mp4`,
                mimetype: "video/mp4",
                caption: `_*${result.title}*_\n\n_File size: ${formatBytes(
                  stats.size
                )}_\n_Quality: ${selectedQuality}_`,
              });
              stream7.destroy();
            } else {
              const stream8 = fs.createReadStream(videoPath);
              await message.sendReply({ stream: stream8 }, "video", {
                caption: `_*${result.title}*_\n\n_Quality: ${selectedQuality}_`,
              });
              stream8.destroy();
            }

            await message.edit(
              "_Download complete!_",
              message.jid,
              downloadMsg.key
            );

            await new Promise((resolve) => setTimeout(resolve, 100));
            if (fs.existsSync(videoPath)) {
              fs.unlinkSync(videoPath);
            }
          } catch (error) {
            console.error("YTV video download error:", error);
            if (downloadMsg) {
              await message.edit(
                "_Download failed!_",
                message.jid,
                downloadMsg.key
              );
            }

            if (videoPath && fs.existsSync(videoPath)) {
              fs.unlinkSync(videoPath);
            }
          }
        }
      } catch (error) {
        console.error("YTV quality selection error:", error);
        await message.sendReply("_Failed to process quality selection._");
      }
    }
  }
);

Module(
  {
    pattern: "download ?(.*)",
    fromMe: fromMe,
    desc: "YouTube search aur download",
    usage: ".download <naam ya link>",
    use: "download",
  },
  async (message, match) => {
    const axios = require("axios");
    let input = (match[1] || "").trim();

    if (!input) {
      return await message.sendReply(
        "*⬇️ DevilXteam MD Downloader*\n\n" +
          "_Kaise use karein:_\n" +
          "• `download despacito` — naam se search\n" +
          "• `download https://youtube.com/...` — link se\n\n" +
          "_YouTube songs, videos sab milenge! 🎵_"
      );
    }

    const isYoutubeLink = /(?:youtube\.com|youtu\.be)/i.test(input);

    if (isYoutubeLink) {
      const urlMatch = input.match(/https?:\/\/\S+/);
      if (!urlMatch) return await message.sendReply("_Invalid link!_");
      let url = urlMatch[0];
      if (url.includes("youtube.com/shorts/")) {
        const sid = url.match(/youtube\.com\/shorts\/([A-Za-z0-9_-]+)/)?.[1];
        if (sid) url = `https://www.youtube.com/watch?v=${sid}`;
      }
      let videoTitle = "YouTube Video";
      try {
        const info = await getVideoInfo(url);
        if (info?.title) videoTitle = info.title;
      } catch {}
      downloadVideoSessions.set(message.jid, { url, title: videoTitle });
      return await message.sendReply(
        "*✅ YouTube link mila!*\n\n" +
          `📹 *${videoTitle.length > 45 ? videoTitle.slice(0, 45) + "..." : videoTitle}*\n` +
          `🔗 \`${url}\`\n\n` +
          "*Kya chahiye?*\n" +
          "*1.* 🎵 Audio (MP3)\n" +
          "*2.* 🎬 Video (480p)\n\n" +
          "_Reply mein 1 ya 2 type karo_"
      );
    }

    const searchMsg = await message.sendReply(
      "_🔍 YouTube pe search ho raha hai..._"
    );

    try {
      const results = await searchYoutube(input, 10);

      if (!results || results.length === 0) {
        return await message.edit(
          "_Koi result nahi mila. Dobara try karo._",
          message.jid,
          searchMsg.key
        );
      }

      downloadSearchSessions.set(message.jid, { results, query: input });

      await message.edit(
        `_✅ ${results.length} results mile! Thumbnails bheji ja rahi hain..._`,
        message.jid,
        searchMsg.key
      );

      const albumItems = [];
      for (let i = 0; i < results.length; i++) {
        const v = results[i];
        const caption =
          `*${i + 1}.* 📹 *${v.title}*\n` +
          `📺 ${v.channel?.name || "Unknown"}\n` +
          `👁️ ${formatViews(v.views)} views  ⏱️ ${v.duration || "N/A"}`;
        try {
          const thumbRes = await axios.get(v.thumbnail, {
            responseType: "arraybuffer",
            timeout: 6000,
          });
          albumItems.push({ image: Buffer.from(thumbRes.data), caption });
        } catch {
          albumItems.push({ image: { url: v.thumbnail }, caption });
        }
      }

      if (albumItems.length > 0) {
        try {
          await message.client.albumMessage(
            message.jid,
            albumItems,
            message.data
          );
        } catch {
          for (const item of albumItems) {
            try {
              await message.sendMessage(item.image, "image", { caption: item.caption });
            } catch {}
          }
        }
      }

      await message.sendReply(
        `*⬇️ ${results.length} results mile!*\n\n` +
          `_Swipe kar ke dekho — number reply karo (1-${results.length}) video select karne ke liye_`
      );
    } catch (err) {
      console.error("Download search error:", err);
      await message.edit(
        "_Search fail. Dobara try karo._",
        message.jid,
        searchMsg.key
      );
    }
  }
);

Module(
  {
    on: "text",
    fromMe: fromMe,
  },
  async (message, match) => {
    const text = message.text?.trim();
    if (!text || !/^\d+$/.test(text)) return;
    const num = parseInt(text);
    if (!message.reply_message?.fromMe) return;

    const repliedText = message.reply_message?.message || "";
    const jid = message.jid;

    const hasSearchSession = downloadSearchSessions.has(jid);
    const hasVideoSession = downloadVideoSessions.has(jid);

    const isSearchReply =
      hasSearchSession &&
      (repliedText.includes("Number reply karo") ||
        repliedText.includes("results mile") ||
        repliedText.includes("views") ||
        repliedText.includes("📹") ||
        /^\*\d+\.\*/.test(repliedText));

    const isVideoChoiceReply =
      hasVideoSession &&
      (repliedText.includes("Kya chahiye") ||
        repliedText.includes("Audio") ||
        repliedText.includes("Video") ||
        repliedText.includes("YouTube link mila") ||
        repliedText.includes("Selected:"));

    if (isSearchReply) {
      const session = downloadSearchSessions.get(jid);
      if (!session) {
        return await message.sendReply(
          "_Session expire ho gaya. Dobara `.download` type karo._"
        );
      }
      if (num < 1 || num > session.results.length) {
        return await message.sendReply(
          `_1 se ${session.results.length} ke beech number dalo_`
        );
      }
      const selected = session.results[num - 1];
      downloadSearchSessions.delete(jid);
      downloadVideoSessions.set(jid, {
        url: selected.url,
        title: selected.title,
      });
      return await message.sendReply(
        `*✅ Selected:* _${selected.title}_\n\n` +
          "*Kya chahiye?*\n" +
          "*1.* 🎵 Audio (MP3)\n" +
          "*2.* 🎬 Video (480p)\n\n" +
          "_Reply mein 1 ya 2 type karo_"
      );
    }

    if (isVideoChoiceReply) {
      if (num !== 1 && num !== 2) {
        return await message.sendReply(
          "_Sirf 1 (Audio) ya 2 (Video) type karo_"
        );
      }

      const session = downloadVideoSessions.get(jid);
      if (!session) {
        return await message.sendReply(
          "_Session expire ho gaya. Dobara `download` type karo._"
        );
      }
      downloadVideoSessions.delete(jid);

      const { url, title } = session;
      const isAudio = num === 1;

      let elapsed = 0;
      let pct = 5;
      const progressMsg = await message.sendReply(
        makeDownloadMsg(title, elapsed, pct)
      );

      const animInterval = setInterval(async () => {
        elapsed += 2;
        pct = Math.min(88, pct + Math.floor(Math.random() * 12) + 6);
        try {
          await message.edit(
            makeDownloadMsg(title, elapsed, pct),
            message.jid,
            progressMsg.key
          );
        } catch {}
      }, 2000);

      let filePath;
      try {
        if (isAudio) {
          const result = await downloadAudio(url);
          filePath = result.path;
          const mp3Path = await convertM4aToMp3(filePath);
          filePath = mp3Path;
        } else {
          const result = await downloadVideo(url, "480p");
          filePath = result.path;
        }

        clearInterval(animInterval);

        const stats = fs.statSync(filePath);
        const fileSize = stats.size;

        await message.edit(
          "╔══ ✅ *DOWNLOAD COMPLETE!* ══╗\n\n" +
            `📹 *${title.length > 35 ? title.slice(0, 35) + "..." : title}*\n\n` +
            "▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 100%\n" +
            `⏱️ *Time:* ${elapsed}s | 📦 *Size:* ${formatBytes(fileSize)}\n\n` +
            "╚══ _Powered by DevilXteam MD_ ══╝",
          message.jid,
          progressMsg.key
        );

        if (isAudio) {
          const stream = fs.createReadStream(filePath);
          if (fileSize > DOWNLOAD_DOC_LIMIT) {
            await message.sendMessage({ stream }, "document", {
              fileName: `${title}.mp3`,
              mimetype: "audio/mpeg",
              caption: `🎵 *${title}*\n_Size: ${formatBytes(fileSize)}_`,
            });
          } else {
            await message.sendReply({ stream }, "audio", {
              mimetype: "audio/mp4",
            });
          }
          stream.destroy();
        } else {
          const stream = fs.createReadStream(filePath);
          if (fileSize > DOWNLOAD_DOC_LIMIT) {
            await message.sendMessage({ stream }, "document", {
              fileName: `${title}.mp4`,
              mimetype: "video/mp4",
              caption: `🎬 *${title}*\n_Quality: 480p | Size: ${formatBytes(fileSize)}_`,
            });
          } else {
            await message.sendReply({ stream }, "video", {
              caption: `🎬 *${title}*\n_Quality: 480p_`,
            });
          }
          stream.destroy();
        }

        await new Promise((r) => setTimeout(r, 2000));
        try {
          await message.deleteMessage(message.jid, progressMsg.key);
        } catch {}
      } catch (err) {
        clearInterval(animInterval);
        console.error("Download cmd error:", err);
        try {
          await message.edit(
            "_❌ Download fail ho gaya. Dobara try karo._",
            message.jid,
            progressMsg.key
          );
        } catch {}
      } finally {
        if (filePath && fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    }
  }
);

Module(
  {
    pattern: "spotify ?(.*)",
    fromMe: fromMe,
    desc: "Download audio from Spotify link",
    usage: ".spotify <spotify link>",
    use: "download",
  },
  async (message, match) => {
    let url = match[1] || message.reply_message?.text;

    if (url && /\bhttps?:\/\/\S+/gi.test(url)) {
      url = url.match(/\bhttps?:\/\/\S+/gi)[0];
    }

    if (!url || !url.includes("spotify.com")) {
      return await message.sendReply(
        "_Please provide a valid Spotify link!_\n_Example: .spotify https://open.spotify.com/track/xxxxx_"
      );
    }

    let downloadMsg;
    let audioPath;

    try {
      downloadMsg = await message.sendReply("_Fetching Spotify info..._");
      const spotifyInfo = await spotifyTrack(url);
      const { title, artist } = spotifyInfo;

      await message.edit(
        `_Downloading *${title}* by *${artist}*..._`,
        message.jid,
        downloadMsg.key
      );

      const query = `${title} ${artist}`;
      const results = await searchYoutube(query, 1);

      if (!results || results.length === 0) {
        return await message.edit(
          "_No matching songs found on YouTube!_",
          message.jid,
          downloadMsg.key
        );
      }

      const video = results[0];
      const result = await downloadAudio(video.url);
      audioPath = result.path;

      const mp3Path = await convertM4aToMp3(audioPath);
      audioPath = mp3Path;

      await message.edit(
        "_Sending audio..._",
        message.jid,
        downloadMsg.key
      );

      const stream = fs.createReadStream(audioPath);
      await message.sendReply({ stream: stream }, "audio", {
        mimetype: "audio/mp4",
      });
      stream.destroy();

      await message.edit(
        "_Download complete!_",
        message.jid,
        downloadMsg.key
      );

      await new Promise((resolve) => setTimeout(resolve, 100));
      if (fs.existsSync(audioPath)) {
        fs.unlinkSync(audioPath);
      }
    } catch (error) {
      console.error("Spotify download error:", error);
      if (downloadMsg) {
        await message.edit("_Download failed!_", message.jid, downloadMsg.key);
      } else {
        await message.sendReply("_Download nakaam. Dobara try karo._");
      }

      if (audioPath && fs.existsSync(audioPath)) {
        fs.unlinkSync(audioPath);
      }
    }
  }
);
