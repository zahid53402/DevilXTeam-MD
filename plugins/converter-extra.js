const { Module } = require("../main");
const config = require("../config");
const axios = require("axios");

const BRAND = "DevilXteam MD";
const isFromMe = config.MODE === "public" ? false : true;

Module(
  {
    pattern: "tourl ?(.*)",
    fromMe: isFromMe,
    desc: "Upload image and get URL",
    usage: ".tourl (reply to image)",
    use: "converter",
  },
  async (message) => {
    if (!message.reply_message?.image)
      return await message.sendReply("_Reply to an image_");
    try {
      await message.react("⏳");
      const media = await message.reply_message.downloadMediaMessage();
      const FormData = require("form-data");
      const form = new FormData();
      form.append("reqtype", "fileupload");
      form.append("fileToUpload", media, { filename: "image.jpg", contentType: "image/jpeg" });
      const { data } = await axios.post("https://catbox.moe/user/api.php", form, {
        headers: form.getHeaders(),
        timeout: 30000,
      });
      await message.sendReply(`*🔗 Image URL:*\n${data}\n\n_${BRAND}_`);
      await message.react("✅");
    } catch {
      return await message.sendReply("_Upload failed_");
    }
  }
);

Module(
  {
    pattern: "tomp3 ?(.*)",
    fromMe: isFromMe,
    desc: "Convert video to MP3 audio",
    usage: ".tomp3 (reply to video)",
    use: "converter",
  },
  async (message) => {
    if (!message.reply_message?.video)
      return await message.sendReply("_Reply to a video_");
    try {
      await message.react("🎵");
      const media = await message.reply_message.downloadMediaMessage();
      await message.sendMessage(media, "audio", {
        mimetype: "audio/mpeg",
        fileName: "audio.mp3",
      });
      await message.react("✅");
    } catch {
      return await message.sendReply("_Conversion failed_");
    }
  }
);

Module(
  {
    pattern: "toptt ?(.*)",
    fromMe: isFromMe,
    desc: "Convert audio to voice note (PTT)",
    usage: ".toptt (reply to audio)",
    use: "converter",
  },
  async (message) => {
    if (!message.reply_message?.audio)
      return await message.sendReply("_Reply to an audio_");
    try {
      const media = await message.reply_message.downloadMediaMessage();
      await message.sendMessage(media, "audio", {
        mimetype: "audio/ogg; codecs=opus",
        ptt: true,
      });
    } catch {
      return await message.sendReply("_Conversion failed_");
    }
  }
);

Module(
  {
    pattern: "tovn ?(.*)",
    fromMe: isFromMe,
    desc: "Convert audio to voice note",
    usage: ".tovn (reply to audio)",
    use: "converter",
  },
  async (message) => {
    if (!message.reply_message?.audio)
      return await message.sendReply("_Reply to an audio_");
    try {
      const media = await message.reply_message.downloadMediaMessage();
      await message.sendMessage(media, "audio", {
        mimetype: "audio/ogg; codecs=opus",
        ptt: true,
      });
    } catch {
      return await message.sendReply("_Conversion failed_");
    }
  }
);

Module(
  {
    pattern: "togif ?(.*)",
    fromMe: isFromMe,
    desc: "Convert video/sticker to GIF",
    usage: ".togif (reply to video/sticker)",
    use: "converter",
  },
  async (message) => {
    if (!message.reply_message?.video && !message.reply_message?.sticker)
      return await message.sendReply("_Reply to a video or animated sticker_");
    try {
      const media = await message.reply_message.downloadMediaMessage();
      await message.sendMessage(media, "video", {
        gifPlayback: true,
      });
    } catch {
      return await message.sendReply("_Conversion failed_");
    }
  }
);

Module(
  {
    pattern: "toimage ?(.*)",
    fromMe: isFromMe,
    desc: "Convert sticker to image",
    usage: ".toimage (reply to sticker)",
    use: "converter",
  },
  async (message) => {
    if (!message.reply_message?.sticker)
      return await message.sendReply("_Reply to a sticker_");
    try {
      const media = await message.reply_message.downloadMediaMessage();
      await message.sendMessage(media, "image", {
        caption: `_Converted by ${BRAND}_`,
      });
    } catch {
      return await message.sendReply("_Conversion failed_");
    }
  }
);

Module(
  {
    pattern: "toaudio ?(.*)",
    fromMe: isFromMe,
    desc: "Convert video to audio file",
    usage: ".toaudio (reply to video)",
    use: "converter",
  },
  async (message) => {
    if (!message.reply_message?.video)
      return await message.sendReply("_Reply to a video_");
    try {
      const media = await message.reply_message.downloadMediaMessage();
      await message.sendMessage(media, "audio", {
        mimetype: "audio/mpeg",
      });
    } catch {
      return await message.sendReply("_Conversion failed_");
    }
  }
);

Module(
  {
    pattern: "base64encode ?(.*)",
    fromMe: isFromMe,
    desc: "Encode text to Base64",
    usage: ".base64encode <text>",
    use: "tools",
  },
  async (message, match) => {
    const text = match[1];
    if (!text) return await message.sendReply("_Need text to encode_");
    const encoded = Buffer.from(text).toString("base64");
    await message.sendReply(`*🔐 Base64 Encoded:*\n\`${encoded}\`\n\n_${BRAND}_`);
  }
);

Module(
  {
    pattern: "base64decode ?(.*)",
    fromMe: isFromMe,
    desc: "Decode Base64 to text",
    usage: ".base64decode <base64>",
    use: "tools",
  },
  async (message, match) => {
    const text = match[1];
    if (!text) return await message.sendReply("_Need base64 text to decode_");
    try {
      const decoded = Buffer.from(text, "base64").toString("utf8");
      await message.sendReply(`*🔓 Decoded:*\n${decoded}\n\n_${BRAND}_`);
    } catch {
      return await message.sendReply("_Invalid base64 text_");
    }
  }
);

Module(
  {
    pattern: "binary ?(.*)",
    fromMe: isFromMe,
    desc: "Convert text to binary",
    usage: ".binary <text>",
    use: "tools",
  },
  async (message, match) => {
    const text = match[1];
    if (!text) return await message.sendReply("_Need text_");
    const binary = text.split("").map((c) => c.charCodeAt(0).toString(2).padStart(8, "0")).join(" ");
    await message.sendReply(`*🔢 Binary:*\n${binary}\n\n_${BRAND}_`);
  }
);

Module(
  {
    pattern: "frombinary ?(.*)",
    fromMe: isFromMe,
    desc: "Convert binary to text",
    usage: ".frombinary <binary>",
    use: "tools",
  },
  async (message, match) => {
    const text = match[1];
    if (!text) return await message.sendReply("_Need binary text_");
    try {
      const decoded = text.split(" ").map((b) => String.fromCharCode(parseInt(b, 2))).join("");
      await message.sendReply(`*🔤 Text:*\n${decoded}\n\n_${BRAND}_`);
    } catch {
      return await message.sendReply("_Invalid binary_");
    }
  }
);

Module(
  {
    pattern: "morse ?(.*)",
    fromMe: isFromMe,
    desc: "Convert text to Morse code",
    usage: ".morse <text>",
    use: "tools",
  },
  async (message, match) => {
    const text = match[1];
    if (!text) return await message.sendReply("_Need text_");
    const morseMap = {
      A: ".-", B: "-...", C: "-.-.", D: "-..", E: ".", F: "..-.", G: "--.",
      H: "....", I: "..", J: ".---", K: "-.-", L: ".-..", M: "--", N: "-.",
      O: "---", P: ".--.", Q: "--.-", R: ".-.", S: "...", T: "-", U: "..-",
      V: "...-", W: ".--", X: "-..-", Y: "-.--", Z: "--..",
      "0": "-----", "1": ".----", "2": "..---", "3": "...--", "4": "....-",
      "5": ".....", "6": "-....", "7": "--...", "8": "---..", "9": "----.",
      " ": "/",
    };
    const morse = text.toUpperCase().split("").map((c) => morseMap[c] || c).join(" ");
    await message.sendReply(`*📡 Morse Code:*\n${morse}\n\n_${BRAND}_`);
  }
);

Module(
  {
    pattern: "reverse ?(.*)",
    fromMe: isFromMe,
    desc: "Reverse text",
    usage: ".reverse <text>",
    use: "tools",
  },
  async (message, match) => {
    const text = match[1];
    if (!text) return await message.sendReply("_Need text_");
    await message.sendReply(`*🔄 Reversed:*\n${text.split("").reverse().join("")}\n\n_${BRAND}_`);
  }
);

Module(
  {
    pattern: "count ?(.*)",
    fromMe: isFromMe,
    desc: "Count characters, words, lines",
    usage: ".count <text>",
    use: "tools",
  },
  async (message, match) => {
    const text = match[1] || message.reply_message?.text;
    if (!text) return await message.sendReply("_Need text or reply to a message_");
    const chars = text.length;
    const words = text.split(/\s+/).filter(Boolean).length;
    const lines = text.split("\n").length;
    await message.sendReply(
      `*📊 Text Stats:*\n\n` +
      `*📝 Characters:* ${chars}\n` +
      `*📖 Words:* ${words}\n` +
      `*📄 Lines:* ${lines}\n\n_${BRAND}_`
    );
  }
);
