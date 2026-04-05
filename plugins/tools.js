const { Module } = require("../main");
const config = require("../config");
const axios = require("axios");

const BRAND = "DevilXteam MD";
const isFromMe = config.MODE === "public" ? false : true;

Module(
  {
    pattern: "weather ?(.*)",
    fromMe: isFromMe,
    desc: "Get weather info for any city",
    usage: ".weather <city>",
    use: "tools",
  },
  async (message, match) => {
    const city = match[1];
    if (!city) return await message.sendReply("_Need a city name_\n_Example: .weather Karachi_");

    try {
      await message.react("🌤️");
      const apiKey = "2d61a72574c11c4f36173b627f8cb177";
      const { data } = await axios.get(
        `http://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`,
        { timeout: 10000 }
      );

      await message.sendReply(
        `*╔══ 🌍 WEATHER ══╗*\n` +
        `*┃ 📍 ${data.name}, ${data.sys.country}*\n` +
        `*┃ 🌡️ Temp:* ${data.main.temp}°C\n` +
        `*┃ 🌡️ Feels:* ${data.main.feels_like}°C\n` +
        `*┃ 🌡️ Min:* ${data.main.temp_min}°C\n` +
        `*┃ 🌡️ Max:* ${data.main.temp_max}°C\n` +
        `*┃ 💧 Humidity:* ${data.main.humidity}%\n` +
        `*┃ ☁️ Weather:* ${data.weather[0].main}\n` +
        `*┃ 🌫️ Desc:* ${data.weather[0].description}\n` +
        `*┃ 💨 Wind:* ${data.wind.speed} m/s\n` +
        `*╚══ ${BRAND} ══╝*`
      );
      await message.react("✅");
    } catch (e) {
      if (e.response?.status === 404)
        return await message.sendReply("_City not found. Check spelling._");
      return await message.sendReply("_Weather fetch error, try again later_");
    }
  }
);

Module(
  {
    pattern: "wiki ?(.*)",
    fromMe: isFromMe,
    desc: "Search Wikipedia",
    usage: ".wiki <query>",
    use: "tools",
  },
  async (message, match) => {
    const query = match[1];
    if (!query) return await message.sendReply("_Need a search query_");

    try {
      await message.react("📖");
      const { data } = await axios.get(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`,
        { timeout: 10000 }
      );

      if (!data?.extract)
        return await message.sendReply("_No Wikipedia results found_");

      let text =
        `*╔══ 📖 WIKIPEDIA ══╗*\n` +
        `*┃ 📝 ${data.title}*\n` +
        `*╠══════════════╣*\n` +
        `*┃* ${data.extract}\n` +
        `*╚══ ${BRAND} ══╝*`;

      if (data.thumbnail?.source) {
        await message.sendMessage({ url: data.thumbnail.source }, "image", {
          caption: text,
        });
      } else {
        await message.sendReply(text);
      }
      await message.react("✅");
    } catch (e) {
      return await message.sendReply("_Wikipedia search error_");
    }
  }
);

Module(
  {
    pattern: "trt ?(.*)",
    fromMe: isFromMe,
    desc: "Translate text between languages",
    usage: ".trt <lang_code> <text>",
    use: "tools",
  },
  async (message, match) => {
    const input = match[1];
    if (!input) return await message.sendReply(
      "_Usage: .trt ur Hello world_\n_Language codes: ur, hi, ar, es, fr, de, zh, ja, ko, etc._"
    );

    const parts = input.split(" ");
    if (parts.length < 2)
      return await message.sendReply("_Need language code and text_\n_Example: .trt ur Hello_");

    const targetLang = parts[0];
    const text = parts.slice(1).join(" ");

    try {
      await message.react("🌐");
      const { data } = await axios.get(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${targetLang}`,
        { timeout: 10000 }
      );

      const translation = data?.responseData?.translatedText;
      if (!translation)
        return await message.sendReply("_Translation failed_");

      await message.sendReply(
        `*╔══ 🌐 TRANSLATE ══╗*\n` +
        `*┃ 🔤 Original:* ${text}\n` +
        `*┃ 🔠 Translated:* ${translation}\n` +
        `*┃ 🌍 Language:* ${targetLang.toUpperCase()}\n` +
        `*╚══ ${BRAND} ══╝*`
      );
      await message.react("✅");
    } catch (e) {
      return await message.sendReply("_Translation error, try again later_");
    }
  }
);

Module(
  {
    pattern: "tempmail ?(.*)",
    fromMe: isFromMe,
    desc: "Generate a temporary email address",
    usage: ".tempmail",
    use: "tools",
  },
  async (message) => {
    try {
      await message.react("📧");
      const { data } = await axios.get(
        "https://apis.davidcyriltech.my.id/temp-mail",
        { timeout: 15000 }
      );

      const { email, session_id, expires_at } = data;
      const expiresDate = new Date(expires_at);

      await message.sendReply(
        `*╔══ 📧 TEMP MAIL ══╗*\n` +
        `*┃ ✉️ Email:* ${email}\n` +
        `*┃ ⏳ Expires:* ${expiresDate.toLocaleString()}\n` +
        `*┃ 🔑 Session:* \`${session_id}\`\n` +
        `*╠══════════════╣*\n` +
        `*┃ 📥 Check inbox:*\n` +
        `*┃ .inbox ${session_id}*\n` +
        `*╚══ ${BRAND} ══╝*`
      );
      await message.react("✅");
    } catch (e) {
      return await message.sendReply("_Temp mail generation error_");
    }
  }
);

Module(
  {
    pattern: "inbox ?(.*)",
    fromMe: isFromMe,
    desc: "Check temporary email inbox",
    usage: ".inbox <session_id>",
    use: "tools",
  },
  async (message, match) => {
    const sessionId = match[1]?.trim();
    if (!sessionId)
      return await message.sendReply("_Need session ID_\n_Example: .inbox YOUR_SESSION_ID_");

    try {
      await message.react("📬");
      const { data } = await axios.get(
        `https://apis.davidcyriltech.my.id/temp-mail/inbox?id=${encodeURIComponent(sessionId)}`,
        { timeout: 15000 }
      );

      if (!data?.success)
        return await message.sendReply("_Invalid session ID or expired email_");

      if (data.inbox_count === 0)
        return await message.sendReply("📭 *Inbox is empty*");

      let text = `*📬 You have ${data.inbox_count} message(s)*\n\n`;
      data.messages.forEach((msg, i) => {
        text +=
          `*━━━ Message ${i + 1} ━━━*\n` +
          `*👤 From:* ${msg.from}\n` +
          `*📝 Subject:* ${msg.subject}\n` +
          `*⏰ Date:* ${new Date(msg.date).toLocaleString()}\n` +
          `*📄 Content:* ${msg.body?.substring(0, 200) || "No content"}\n\n`;
      });

      await message.sendReply(text);
    } catch (e) {
      return await message.sendReply("_Error checking inbox_");
    }
  }
);

Module(
  {
    pattern: "tinyurl ?(.*)",
    fromMe: isFromMe,
    desc: "Shorten a URL using TinyURL",
    usage: ".tinyurl <url>",
    use: "tools",
  },
  async (message, match) => {
    const url = match[1];
    if (!url) return await message.sendReply("_Need a URL to shorten_");

    try {
      const { data } = await axios.get(
        `https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`,
        { timeout: 10000 }
      );
      await message.sendReply(`*🔗 Shortened URL:*\n${data}\n\n_${BRAND}_`);
    } catch {
      return await message.sendReply("_URL shortening failed_");
    }
  }
);

Module(
  {
    pattern: "genpass ?(.*)",
    fromMe: isFromMe,
    desc: "Generate a random password",
    usage: ".genpass <length>",
    use: "tools",
  },
  async (message, match) => {
    const length = parseInt(match[1]) || 16;
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=";
    let password = "";
    for (let i = 0; i < Math.min(length, 64); i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    await message.sendReply(
      `*🔐 Generated Password:*\n\`${password}\`\n*Length:* ${password.length}\n\n_${BRAND}_`
    );
  }
);

Module(
  {
    pattern: "define ?(.*)",
    fromMe: isFromMe,
    desc: "Get dictionary definition of a word",
    usage: ".define <word>",
    use: "tools",
  },
  async (message, match) => {
    const word = match[1];
    if (!word) return await message.sendReply("_Need a word to define_");

    try {
      const { data } = await axios.get(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,
        { timeout: 10000 }
      );

      if (!data?.[0])
        return await message.sendReply("_Word not found_");

      const entry = data[0];
      let text = `*╔══ 📚 DICTIONARY ══╗*\n`;
      text += `*┃ 📝 Word:* ${entry.word}\n`;
      if (entry.phonetic) text += `*┃ 🔊 Phonetic:* ${entry.phonetic}\n`;
      text += `*╠══════════════╣*\n`;

      entry.meanings?.slice(0, 3).forEach((m) => {
        text += `*┃ 📌 ${m.partOfSpeech}:*\n`;
        m.definitions?.slice(0, 2).forEach((d) => {
          text += `*┃* ${d.definition}\n`;
          if (d.example) text += `*┃* _"${d.example}"_\n`;
        });
      });

      text += `*╚══ ${BRAND} ══╝*`;
      await message.sendReply(text);
    } catch {
      return await message.sendReply("_Word not found or API error_");
    }
  }
);

Module(
  {
    pattern: "calc ?(.*)",
    fromMe: isFromMe,
    desc: "Calculate a math expression",
    usage: ".calc <expression>",
    use: "tools",
  },
  async (message, match) => {
    const expr = match[1];
    if (!expr) return await message.sendReply("_Need a math expression_\n_Example: .calc 2+2*3_");

    try {
      const sanitized = expr.replace(/[^0-9+\-*/().%\s]/g, "");
      if (!sanitized) return await message.sendReply("_Invalid expression_");

      const result = Function('"use strict"; return (' + sanitized + ")")();
      await message.sendReply(
        `*🔢 Calculator*\n\n` +
        `*Expression:* ${sanitized}\n` +
        `*Result:* ${result}\n\n_${BRAND}_`
      );
    } catch {
      return await message.sendReply("_Invalid math expression_");
    }
  }
);

Module(
  {
    pattern: "uptime ?(.*)",
    fromMe: isFromMe,
    desc: "Check bot uptime",
    usage: ".uptime",
    use: "tools",
  },
  async (message) => {
    const uptime = process.uptime();
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const mins = Math.floor((uptime % 3600) / 60);
    const secs = Math.floor(uptime % 60);

    const memUsage = process.memoryUsage();
    const memMB = (memUsage.rss / 1024 / 1024).toFixed(2);

    await message.sendReply(
      `*╔══ ⏱️ UPTIME ══╗*\n` +
      `*┃ ⏰ ${days}d ${hours}h ${mins}m ${secs}s*\n` +
      `*┃ 💾 Memory:* ${memMB} MB\n` +
      `*┃ 📡 Platform:* ${config.PLATFORM}\n` +
      `*╚══ ${BRAND} ══╝*`
    );
  }
);

Module(
  {
    pattern: "ping2 ?(.*)",
    fromMe: isFromMe,
    desc: "Check bot response time",
    usage: ".ping2",
    use: "tools",
    excludeFromCommands: true,
  },
  async (message) => {
    const start = Date.now();
    const sent = await message.sendReply("_Pinging..._");
    const latency = Date.now() - start;
    try {
      await message.edit(`*🏓 Pong!* ${latency}ms\n\n_${BRAND}_`, message.jid, sent.key);
    } catch {
      await message.sendReply(`*🏓 Pong!* ${latency}ms\n\n_${BRAND}_`);
    }
  }
);

Module(
  {
    pattern: "playstore ?(.*)",
    fromMe: isFromMe,
    desc: "Search apps on Play Store",
    usage: ".playstore <app name>",
    use: "tools",
  },
  async (message, match) => {
    const query = match[1];
    if (!query) return await message.sendReply("_Need an app name to search_");

    try {
      await message.react("🔍");
      const { data } = await axios.get(
        `http://ws75.aptoide.com/api/7/apps/search/query=${encodeURIComponent(query)}/limit=5`,
        { timeout: 15000 }
      );

      if (!data?.datalist?.list?.length)
        return await message.sendReply("_No apps found_");

      let text = `*╔══ 📱 PLAY STORE ══╗*\n\n`;
      data.datalist.list.slice(0, 5).forEach((app, i) => {
        const size = (app.size / 1048576).toFixed(2);
        text +=
          `*${i + 1}. ${app.name}*\n` +
          `   📦 ${app.package}\n` +
          `   🏋 ${size} MB | ⭐ ${app.rating?.avg?.toFixed(1) || "N/A"}\n\n`;
      });
      text += `*╚══ ${BRAND} ══╝*`;
      await message.sendReply(text);
    } catch {
      return await message.sendReply("_Play Store search error_");
    }
  }
);
