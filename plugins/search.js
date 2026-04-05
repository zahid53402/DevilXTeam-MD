const { Module } = require("../main");
const config = require("../config");
const axios = require("axios");

const BRAND = "DevilXteam MD";
const isFromMe = config.MODE === "public" ? false : true;

Module(
  {
    pattern: "google ?(.*)",
    fromMe: isFromMe,
    desc: "Search Google",
    usage: ".google <query>",
    use: "search",
  },
  async (message, match) => {
    const query = match[1];
    if (!query) return await message.sendReply("_Need a search query_");
    try {
      await message.react("🔍");
      const { data } = await axios.get(
        `https://apis.davidcyriltech.my.id/google?query=${encodeURIComponent(query)}`,
        { timeout: 15000 }
      );
      if (!data?.results?.length) return await message.sendReply("_No results found_");
      let text = `*╔══ 🔍 GOOGLE SEARCH ══╗*\n*┃ Query:* ${query}\n*╠══════════════╣*\n\n`;
      data.results.slice(0, 8).forEach((r, i) => {
        text += `*${i + 1}. ${r.title}*\n${r.description || ""}\n🔗 ${r.url}\n\n`;
      });
      text += `*╚══ ${BRAND} ══╝*`;
      await message.sendReply(text);
    } catch {
      return await message.sendReply("_Google search error_");
    }
  }
);

Module(
  {
    pattern: "lyrics ?(.*)",
    fromMe: isFromMe,
    desc: "Search song lyrics",
    usage: ".lyrics <song name>",
    use: "search",
  },
  async (message, match) => {
    const query = match[1];
    if (!query) return await message.sendReply("_Need a song name_");
    try {
      await message.react("🎵");
      const { data } = await axios.get(
        `https://apis.davidcyriltech.my.id/lyrics?query=${encodeURIComponent(query)}`,
        { timeout: 15000 }
      );
      if (!data?.lyrics) return await message.sendReply("_Lyrics not found_");
      const lyrics = data.lyrics.length > 4000 ? data.lyrics.substring(0, 4000) + "..." : data.lyrics;
      await message.sendReply(
        `*🎵 ${data.title || query}*\n*🎤 ${data.artist || "Unknown"}*\n\n${lyrics}\n\n_${BRAND}_`
      );
    } catch {
      return await message.sendReply("_Lyrics search error_");
    }
  }
);

Module(
  {
    pattern: "github ?(.*)",
    fromMe: isFromMe,
    desc: "Search GitHub user profile",
    usage: ".github <username>",
    use: "search",
  },
  async (message, match) => {
    const user = match[1];
    if (!user) return await message.sendReply("_Need a GitHub username_");
    try {
      await message.react("🐙");
      const { data } = await axios.get(`https://api.github.com/users/${encodeURIComponent(user)}`, { timeout: 10000 });
      let text =
        `*╔══ 🐙 GITHUB ══╗*\n` +
        `*┃ 👤 ${data.name || data.login}*\n` +
        `*┃ 📝 ${data.bio || "No bio"}*\n` +
        `*┃ 📦 Repos:* ${data.public_repos}\n` +
        `*┃ 👥 Followers:* ${data.followers}\n` +
        `*┃ 👤 Following:* ${data.following}\n` +
        `*┃ 📍 ${data.location || "Unknown"}*\n` +
        `*┃ 🔗 ${data.html_url}*\n` +
        `*╚══ ${BRAND} ══╝*`;
      if (data.avatar_url) {
        await message.sendMessage({ url: data.avatar_url }, "image", { caption: text });
      } else {
        await message.sendReply(text);
      }
    } catch {
      return await message.sendReply("_GitHub user not found_");
    }
  }
);

Module(
  {
    pattern: "npm ?(.*)",
    fromMe: isFromMe,
    desc: "Search NPM packages",
    usage: ".npm <package>",
    use: "search",
  },
  async (message, match) => {
    const pkg = match[1];
    if (!pkg) return await message.sendReply("_Need a package name_");
    try {
      const { data } = await axios.get(`https://registry.npmjs.org/${encodeURIComponent(pkg)}`, { timeout: 10000 });
      const latest = data["dist-tags"]?.latest;
      await message.sendReply(
        `*╔══ 📦 NPM ══╗*\n` +
        `*┃ 📝 ${data.name}*\n` +
        `*┃ 📌 Version:* ${latest || "N/A"}\n` +
        `*┃ 📄 ${data.description || "No description"}*\n` +
        `*┃ 👤 Author:* ${data.author?.name || "Unknown"}\n` +
        `*┃ 📜 License:* ${data.license || "N/A"}\n` +
        `*┃ 🔗 https://npmjs.com/package/${data.name}*\n` +
        `*╚══ ${BRAND} ══╝*`
      );
    } catch {
      return await message.sendReply("_Package not found_");
    }
  }
);

Module(
  {
    pattern: "imdb ?(.*)",
    fromMe: isFromMe,
    desc: "Search movies/shows on IMDB",
    usage: ".imdb <movie name>",
    use: "search",
  },
  async (message, match) => {
    const query = match[1];
    if (!query) return await message.sendReply("_Need a movie/show name_");
    try {
      await message.react("🎬");
      const { data } = await axios.get(
        `https://apis.davidcyriltech.my.id/imdb?query=${encodeURIComponent(query)}`,
        { timeout: 15000 }
      );
      if (!data?.title) return await message.sendReply("_Movie not found_");
      let text =
        `*╔══ 🎬 IMDB ══╗*\n` +
        `*┃ 🎥 ${data.title}*\n` +
        `*┃ 📅 Year:* ${data.year || "N/A"}\n` +
        `*┃ ⭐ Rating:* ${data.rating || "N/A"}\n` +
        `*┃ 🎭 Genre:* ${data.genre || "N/A"}\n` +
        `*┃ ⏱️ Runtime:* ${data.runtime || "N/A"}\n` +
        `*┃ 🎬 Director:* ${data.director || "N/A"}\n` +
        `*┃ 🎭 Actors:* ${data.actors || "N/A"}\n` +
        `*┃ 📝 Plot:* ${data.plot || "N/A"}\n` +
        `*╚══ ${BRAND} ══╝*`;
      if (data.poster && data.poster !== "N/A") {
        await message.sendMessage({ url: data.poster }, "image", { caption: text });
      } else {
        await message.sendReply(text);
      }
    } catch {
      return await message.sendReply("_IMDB search error_");
    }
  }
);

Module(
  {
    pattern: "wallpaper ?(.*)",
    fromMe: isFromMe,
    desc: "Search HD wallpapers",
    usage: ".wallpaper <query>",
    use: "search",
  },
  async (message, match) => {
    const query = match[1];
    if (!query) return await message.sendReply("_Need a search query_");
    try {
      await message.react("🖼️");
      const { data } = await axios.get(
        `https://apis.davidcyriltech.my.id/wallpaper?query=${encodeURIComponent(query)}`,
        { timeout: 15000 }
      );
      if (!data?.result?.length) return await message.sendReply("_No wallpapers found_");
      const randomImg = data.result[Math.floor(Math.random() * data.result.length)];
      await message.sendMessage({ url: randomImg }, "image", {
        caption: `*🖼️ Wallpaper:* ${query}\n_${BRAND}_`,
      });
    } catch {
      return await message.sendReply("_Wallpaper search error_");
    }
  }
);

Module(
  {
    pattern: "anime ?(.*)",
    fromMe: isFromMe,
    desc: "Search anime info",
    usage: ".anime <name>",
    use: "search",
  },
  async (message, match) => {
    const query = match[1];
    if (!query) return await message.sendReply("_Need an anime name_");
    try {
      await message.react("🎌");
      const { data } = await axios.get(
        `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=1`,
        { timeout: 15000 }
      );
      if (!data?.data?.length) return await message.sendReply("_Anime not found_");
      const a = data.data[0];
      let text =
        `*╔══ 🎌 ANIME ══╗*\n` +
        `*┃ 📺 ${a.title}*\n` +
        `*┃ 🇯🇵 ${a.title_japanese || ""}*\n` +
        `*┃ ⭐ Score:* ${a.score || "N/A"}\n` +
        `*┃ 📊 Rank:* #${a.rank || "N/A"}\n` +
        `*┃ 📺 Episodes:* ${a.episodes || "N/A"}\n` +
        `*┃ 📡 Status:* ${a.status || "N/A"}\n` +
        `*┃ 🎭 Genres:* ${a.genres?.map((g) => g.name).join(", ") || "N/A"}\n` +
        `*┃ 📝 Synopsis:*\n${(a.synopsis || "N/A").substring(0, 500)}\n` +
        `*╚══ ${BRAND} ══╝*`;
      if (a.images?.jpg?.large_image_url) {
        await message.sendMessage({ url: a.images.jpg.large_image_url }, "image", { caption: text });
      } else {
        await message.sendReply(text);
      }
    } catch {
      return await message.sendReply("_Anime search error_");
    }
  }
);

Module(
  {
    pattern: "news ?(.*)",
    fromMe: isFromMe,
    desc: "Get latest news",
    usage: ".news <topic>",
    use: "search",
  },
  async (message, match) => {
    const query = match[1] || "world";
    try {
      await message.react("📰");
      const { data } = await axios.get(
        `https://apis.davidcyriltech.my.id/news?query=${encodeURIComponent(query)}`,
        { timeout: 15000 }
      );
      if (!data?.results?.length) return await message.sendReply("_No news found_");
      let text = `*╔══ 📰 NEWS ══╗*\n*┃ Topic:* ${query}\n*╠══════════════╣*\n\n`;
      data.results.slice(0, 5).forEach((n, i) => {
        text += `*${i + 1}. ${n.title}*\n${n.description || ""}\n🔗 ${n.url || ""}\n\n`;
      });
      text += `*╚══ ${BRAND} ══╝*`;
      await message.sendReply(text);
    } catch {
      return await message.sendReply("_News fetch error_");
    }
  }
);

Module(
  {
    pattern: "currency ?(.*)",
    fromMe: isFromMe,
    desc: "Convert currency",
    usage: ".currency 100 USD PKR",
    use: "tools",
  },
  async (message, match) => {
    const input = match[1]?.trim();
    if (!input) return await message.sendReply("_Usage: .currency 100 USD PKR_");
    const parts = input.split(/\s+/);
    if (parts.length < 3) return await message.sendReply("_Usage: .currency <amount> <from> <to>_");
    const [amount, from, to] = [parseFloat(parts[0]), parts[1].toUpperCase(), parts[2].toUpperCase()];
    if (isNaN(amount)) return await message.sendReply("_Invalid amount_");
    try {
      const { data } = await axios.get(
        `https://api.exchangerate-api.com/v4/latest/${from}`,
        { timeout: 10000 }
      );
      if (!data?.rates?.[to]) return await message.sendReply("_Invalid currency code_");
      const result = (amount * data.rates[to]).toFixed(2);
      await message.sendReply(
        `*💱 Currency Converter*\n\n` +
        `*${amount} ${from}* = *${result} ${to}*\n\n_${BRAND}_`
      );
    } catch {
      return await message.sendReply("_Currency conversion error_");
    }
  }
);

Module(
  {
    pattern: "ip ?(.*)",
    fromMe: isFromMe,
    desc: "Lookup IP address info",
    usage: ".ip <address>",
    use: "tools",
  },
  async (message, match) => {
    const ip = match[1]?.trim();
    if (!ip) return await message.sendReply("_Need an IP address_");
    try {
      const { data } = await axios.get(`http://ip-api.com/json/${ip}`, { timeout: 10000 });
      if (data.status === "fail") return await message.sendReply("_Invalid IP address_");
      await message.sendReply(
        `*╔══ 🌐 IP LOOKUP ══╗*\n` +
        `*┃ 📍 IP:* ${data.query}\n` +
        `*┃ 🌍 Country:* ${data.country}\n` +
        `*┃ 🏙️ City:* ${data.city}\n` +
        `*┃ 📮 ZIP:* ${data.zip}\n` +
        `*┃ 📡 ISP:* ${data.isp}\n` +
        `*┃ 🏢 Org:* ${data.org}\n` +
        `*┃ ⏰ Timezone:* ${data.timezone}\n` +
        `*┃ 📌 Lat:* ${data.lat}, *Lon:* ${data.lon}\n` +
        `*╚══ ${BRAND} ══╝*`
      );
    } catch {
      return await message.sendReply("_IP lookup error_");
    }
  }
);

Module(
  {
    pattern: "qr ?(.*)",
    fromMe: isFromMe,
    desc: "Generate QR code from text",
    usage: ".qr <text>",
    use: "tools",
  },
  async (message, match) => {
    const text = match[1];
    if (!text) return await message.sendReply("_Need text to generate QR code_");
    try {
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(text)}`;
      await message.sendMessage({ url: qrUrl }, "image", {
        caption: `*📱 QR Code Generated*\n_${BRAND}_`,
      });
    } catch {
      return await message.sendReply("_QR code generation error_");
    }
  }
);

Module(
  {
    pattern: "ss ?(.*)",
    fromMe: isFromMe,
    desc: "Take screenshot of a website",
    usage: ".ss <url>",
    use: "tools",
  },
  async (message, match) => {
    const url = match[1];
    if (!url) return await message.sendReply("_Need a URL_\n_Example: .ss google.com_");
    try {
      await message.react("📸");
      const target = url.startsWith("http") ? url : `https://${url}`;
      const ssUrl = `https://image.thum.io/get/width/1280/crop/720/fullpage/noanimate/${target}`;
      await message.sendMessage({ url: ssUrl }, "image", {
        caption: `*📸 Screenshot:* ${target}\n_${BRAND}_`,
      });
    } catch {
      return await message.sendReply("_Screenshot error_");
    }
  }
);

Module(
  {
    pattern: "shorturl ?(.*)",
    fromMe: isFromMe,
    desc: "Shorten URL with is.gd",
    usage: ".shorturl <url>",
    use: "tools",
  },
  async (message, match) => {
    const url = match[1];
    if (!url) return await message.sendReply("_Need a URL to shorten_");
    try {
      const { data } = await axios.get(
        `https://is.gd/create.php?format=simple&url=${encodeURIComponent(url)}`,
        { timeout: 10000 }
      );
      await message.sendReply(`*🔗 Short URL:*\n${data}\n\n_${BRAND}_`);
    } catch {
      return await message.sendReply("_URL shortening failed_");
    }
  }
);
