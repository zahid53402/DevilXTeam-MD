const { Module } = require("../main");
const config = require("../config");
const axios = require("axios");
const fs = require("fs");
const os = require("os");
const path = require("path");
const FormData = require("form-data");

const BRAND = "DevilXteam MD";
const isFromMe = config.MODE === "public" ? false : true;

function formatBytes(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

async function uploadToCatbox(buffer, ext) {
  const tempFile = path.join(os.tmpdir(), `upload_${Date.now()}${ext}`);
  fs.writeFileSync(tempFile, buffer);
  try {
    const form = new FormData();
    form.append("fileToUpload", fs.createReadStream(tempFile), `image${ext}`);
    form.append("reqtype", "fileupload");
    const { data } = await axios.post("https://catbox.moe/user/api.php", form, {
      headers: form.getHeaders(),
      timeout: 30000,
    });
    return data;
  } finally {
    try { fs.unlinkSync(tempFile); } catch (_) {}
  }
}

async function getReplyImageBuffer(message) {
  if (!message.reply_message)
    return null;
  try {
    return await message.reply_message.download("buffer");
  } catch {
    return null;
  }
}

async function processImageEffect(message, apiUrlFn, effectName) {
  const buffer = await getReplyImageBuffer(message);
  if (!buffer)
    return await message.sendReply(`_Reply to an image to apply ${effectName} effect_`);

  try {
    await message.react("⏳");
    const imageUrl = await uploadToCatbox(buffer, ".jpg");
    if (!imageUrl) return await message.sendReply("_Failed to upload image_");

    const apiUrl = apiUrlFn(imageUrl);
    const response = await axios.get(apiUrl, {
      responseType: "arraybuffer",
      timeout: 30000,
    });

    if (!response?.data)
      return await message.sendReply(`_${effectName} effect failed_`);

    const resultBuffer = Buffer.from(response.data, "binary");
    await message.sendReply(resultBuffer, "image");
    await message.react("✅");
  } catch (e) {
    console.error(`${effectName} error:`, e.message);
    await message.react("❌");
    return await message.sendReply(`_${effectName} effect error_`);
  }
}

Module(
  {
    pattern: "blur ?(.*)",
    fromMe: isFromMe,
    desc: "Apply blur effect to an image",
    usage: ".blur (reply to image)",
    use: "image",
  },
  async (message) => {
    await processImageEffect(
      message,
      (url) => `https://api.popcat.xyz/v2/blur?image=${encodeURIComponent(url)}`,
      "Blur"
    );
  }
);

Module(
  {
    pattern: "rmbg ?(.*)",
    fromMe: isFromMe,
    desc: "Remove background from image",
    usage: ".rmbg (reply to image)",
    use: "image",
  },
  async (message) => {
    await processImageEffect(
      message,
      (url) => `https://apis.davidcyriltech.my.id/removebg?url=${encodeURIComponent(url)}`,
      "Remove BG"
    );
  }
);

Module(
  {
    pattern: "grey ?(.*)",
    fromMe: isFromMe,
    desc: "Apply greyscale effect to an image",
    usage: ".grey (reply to image)",
    use: "image",
  },
  async (message) => {
    await processImageEffect(
      message,
      (url) => `https://api.popcat.xyz/v2/greyscale?image=${encodeURIComponent(url)}`,
      "Greyscale"
    );
  }
);

Module(
  {
    pattern: "invert ?(.*)",
    fromMe: isFromMe,
    desc: "Invert colors of an image",
    usage: ".invert (reply to image)",
    use: "image",
  },
  async (message) => {
    await processImageEffect(
      message,
      (url) => `https://api.popcat.xyz/v2/invert?image=${encodeURIComponent(url)}`,
      "Invert"
    );
  }
);

Module(
  {
    pattern: "jail ?(.*)",
    fromMe: isFromMe,
    desc: "Put image behind jail bars",
    usage: ".jail (reply to image)",
    use: "image",
  },
  async (message) => {
    await processImageEffect(
      message,
      (url) => `https://api.popcat.xyz/v2/jail?image=${encodeURIComponent(url)}`,
      "Jail"
    );
  }
);

Module(
  {
    pattern: "wanted ?(.*)",
    fromMe: isFromMe,
    desc: "Create a wanted poster from image",
    usage: ".wanted (reply to image)",
    use: "image",
  },
  async (message) => {
    await processImageEffect(
      message,
      (url) => `https://api.popcat.xyz/v2/wanted?image=${encodeURIComponent(url)}`,
      "Wanted"
    );
  }
);

Module(
  {
    pattern: "ad ?(.*)",
    fromMe: isFromMe,
    desc: "Create an ad-style image",
    usage: ".ad (reply to image)",
    use: "image",
  },
  async (message) => {
    await processImageEffect(
      message,
      (url) => `https://api.popcat.xyz/v2/ad?image=${encodeURIComponent(url)}`,
      "Ad"
    );
  }
);

Module(
  {
    pattern: "jokeimg ?(.*)",
    fromMe: isFromMe,
    desc: "Apply joke overlay to image",
    usage: ".jokeimg (reply to image)",
    use: "image",
  },
  async (message) => {
    await processImageEffect(
      message,
      (url) => `https://api.popcat.xyz/v2/jokeoverhead?image=${encodeURIComponent(url)}`,
      "Joke"
    );
  }
);
