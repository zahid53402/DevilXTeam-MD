const { Module } = require("../main");
const config = require("../config");
const axios = require("axios");

const BRAND = "DevilXteam MD";
const isFromMe = config.MODE === "public" ? false : true;

Module(
  {
    pattern: "emojimix ?(.*)",
    fromMe: isFromMe,
    desc: "Mix two emojis together",
    usage: ".emojimix 😀+😎",
    use: "fun",
  },
  async (message, match) => {
    const input = match[1]?.trim();
    if (!input || !input.includes("+"))
      return await message.sendReply("_Usage: .emojimix 😀+😎_");
    const [e1, e2] = input.split("+").map((e) => e.trim());
    try {
      const { data } = await axios.get(
        `https://tenor.googleapis.com/v2/featured?q=${encodeURIComponent(e1)}_${encodeURIComponent(e2)}&collection=emoji_kitchen_v5&key=AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ`,
        { timeout: 10000 }
      );
      if (!data?.results?.length) return await message.sendReply("_Cannot mix these emojis_");
      const url = data.results[0].url;
      await message.sendMessage({ url }, "sticker");
    } catch {
      return await message.sendReply("_Emoji mix error_");
    }
  }
);

Module(
  {
    pattern: "joke ?(.*)",
    fromMe: isFromMe,
    desc: "Get a random joke",
    usage: ".joke",
    use: "fun",
  },
  async (message) => {
    try {
      const { data } = await axios.get("https://v2.jokeapi.dev/joke/Any?type=twopart", { timeout: 10000 });
      if (data?.setup) {
        await message.sendReply(`*😂 Joke:*\n\n${data.setup}\n\n${data.delivery}\n\n_${BRAND}_`);
      } else if (data?.joke) {
        await message.sendReply(`*😂 Joke:*\n\n${data.joke}\n\n_${BRAND}_`);
      } else {
        await message.sendReply("_Couldn't fetch joke_");
      }
    } catch {
      return await message.sendReply("_Joke fetch error_");
    }
  }
);

Module(
  {
    pattern: "meme ?(.*)",
    fromMe: isFromMe,
    desc: "Get a random meme",
    usage: ".meme",
    use: "fun",
  },
  async (message) => {
    try {
      const { data } = await axios.get("https://meme-api.com/gimme", { timeout: 10000 });
      if (!data?.url) return await message.sendReply("_Couldn't fetch meme_");
      await message.sendMessage({ url: data.url }, "image", {
        caption: `*😂 ${data.title}*\n👍 ${data.ups} | r/${data.subreddit}\n_${BRAND}_`,
      });
    } catch {
      return await message.sendReply("_Meme fetch error_");
    }
  }
);

Module(
  {
    pattern: "fact ?(.*)",
    fromMe: isFromMe,
    desc: "Get a random fact",
    usage: ".fact",
    use: "fun",
  },
  async (message) => {
    try {
      const { data } = await axios.get("https://uselessfacts.jsph.pl/api/v2/facts/random", { timeout: 10000 });
      await message.sendReply(`*🧠 Random Fact:*\n\n${data.text}\n\n_${BRAND}_`);
    } catch {
      const facts = [
        "Honey never spoils.",
        "Octopuses have three hearts.",
        "Bananas are berries, but strawberries aren't.",
        "A group of flamingos is called a 'flamboyance'.",
        "Sharks are older than trees.",
      ];
      await message.sendReply(`*🧠 Random Fact:*\n\n${facts[Math.floor(Math.random() * facts.length)]}\n\n_${BRAND}_`);
    }
  }
);

Module(
  {
    pattern: "riddle ?(.*)",
    fromMe: isFromMe,
    desc: "Get a random riddle",
    usage: ".riddle",
    use: "fun",
  },
  async (message) => {
    const riddles = [
      { q: "What has keys but no locks?", a: "A piano" },
      { q: "What has hands but can't clap?", a: "A clock" },
      { q: "What has a head and a tail but no body?", a: "A coin" },
      { q: "What gets wetter the more it dries?", a: "A towel" },
      { q: "What can travel around the world while staying in a corner?", a: "A stamp" },
      { q: "What has cities, but no houses?", a: "A map" },
      { q: "What is full of holes but still holds water?", a: "A sponge" },
      { q: "What can you catch but not throw?", a: "A cold" },
      { q: "What has legs but doesn't walk?", a: "A table" },
      { q: "What runs but never walks?", a: "Water" },
    ];
    const r = riddles[Math.floor(Math.random() * riddles.length)];
    await message.sendReply(`*🧩 Riddle:*\n\n${r.q}\n\n||${r.a}||\n_Reply ".answer" to see the answer_\n\n_${BRAND}_`);
  }
);

Module(
  {
    pattern: "wyr ?(.*)",
    fromMe: isFromMe,
    desc: "Would you rather question",
    usage: ".wyr",
    use: "fun",
  },
  async (message) => {
    const questions = [
      "Would you rather be able to fly or be invisible?",
      "Would you rather have unlimited money or unlimited knowledge?",
      "Would you rather live without music or without movies?",
      "Would you rather be the smartest person or the funniest?",
      "Would you rather control fire or water?",
      "Would you rather never sleep or never eat?",
      "Would you rather time travel to the past or the future?",
      "Would you rather have super speed or super strength?",
      "Would you rather live in a treehouse or underground?",
      "Would you rather speak all languages or play all instruments?",
    ];
    const q = questions[Math.floor(Math.random() * questions.length)];
    await message.sendReply(`*🤔 Would You Rather:*\n\n${q}\n\n_${BRAND}_`);
  }
);

Module(
  {
    pattern: "toss ?(.*)",
    fromMe: isFromMe,
    desc: "Toss a coin",
    usage: ".toss",
    use: "fun",
  },
  async (message) => {
    const result = Math.random() < 0.5 ? "🪙 HEADS" : "💫 TAILS";
    await message.sendReply(`*Coin Toss:* ${result}\n\n_${BRAND}_`);
  }
);

Module(
  {
    pattern: "rps ?(.*)",
    fromMe: isFromMe,
    desc: "Play Rock Paper Scissors",
    usage: ".rps rock/paper/scissors",
    use: "fun",
  },
  async (message, match) => {
    const choices = ["rock", "paper", "scissors"];
    const userChoice = match[1]?.toLowerCase();
    if (!userChoice || !choices.includes(userChoice))
      return await message.sendReply("_Usage: .rps rock/paper/scissors_");
    const botChoice = choices[Math.floor(Math.random() * choices.length)];
    const emojis = { rock: "🪨", paper: "📄", scissors: "✂️" };
    let result;
    if (userChoice === botChoice) result = "🤝 Draw!";
    else if (
      (userChoice === "rock" && botChoice === "scissors") ||
      (userChoice === "paper" && botChoice === "rock") ||
      (userChoice === "scissors" && botChoice === "paper")
    ) result = "🎉 You Win!";
    else result = "😎 Bot Wins!";
    await message.sendReply(
      `*✊ Rock Paper Scissors*\n\n` +
      `*You:* ${emojis[userChoice]} ${userChoice}\n` +
      `*Bot:* ${emojis[botChoice]} ${botChoice}\n\n` +
      `*Result:* ${result}\n\n_${BRAND}_`
    );
  }
);

Module(
  {
    pattern: "hack ?(.*)",
    fromMe: isFromMe,
    desc: "Fake hacking prank message",
    usage: ".hack @user",
    use: "fun",
  },
  async (message) => {
    const target = message.mentions?.[0] || message.reply_message?.sender;
    const name = target ? `@${target.split("@")[0]}` : "target";
    const mentions = target ? [target] : [];
    const steps = [
      `*[■□□□□□□□□□] 10%*\n_Connecting to ${name}'s device..._`,
      `*[■■■□□□□□□□] 30%*\n_Bypassing security..._`,
      `*[■■■■■□□□□□] 50%*\n_Accessing files..._`,
      `*[■■■■■■■□□□] 70%*\n_Downloading data..._`,
      `*[■■■■■■■■■□] 90%*\n_Injecting virus..._`,
      `*[■■■■■■■■■■] 100%*\n\n*✅ Hack complete!*\n_Just kidding! 😂_\n\n_${BRAND}_`,
    ];
    let msg = await message.send(steps[0], "text", { mentions });
    for (let i = 1; i < steps.length; i++) {
      await new Promise((r) => setTimeout(r, 1500));
      try {
        await message.edit(steps[i], message.jid, msg.key);
      } catch {
        msg = await message.send(steps[i], "text", { mentions });
      }
    }
  }
);

Module(
  {
    pattern: "couple ?(.*)",
    fromMe: isFromMe,
    desc: "Random couple from group",
    usage: ".couple",
    use: "fun",
  },
  async (message) => {
    if (!message.isGroup) return await message.sendReply("_Group only command_");
    try {
      const { participants } = await message.client.groupMetadata(message.jid);
      const members = participants.map((p) => p.id);
      if (members.length < 2) return await message.sendReply("_Need at least 2 members_");
      const p1 = members[Math.floor(Math.random() * members.length)];
      let p2;
      do { p2 = members[Math.floor(Math.random() * members.length)]; } while (p2 === p1);
      await message.send(
        `*💑 Today's Couple:*\n\n` +
        `@${p1.split("@")[0]} ❤️ @${p2.split("@")[0]}\n\n_${BRAND}_`,
        "text", { mentions: [p1, p2] }
      );
    } catch {
      return await message.sendReply("_Error getting couple_");
    }
  }
);

Module(
  {
    pattern: "rate ?(.*)",
    fromMe: isFromMe,
    desc: "Rate something out of 10",
    usage: ".rate <something>",
    use: "fun",
  },
  async (message, match) => {
    const thing = match[1] || "you";
    const rating = Math.floor(Math.random() * 11);
    const stars = "⭐".repeat(rating) + "☆".repeat(10 - rating);
    await message.sendReply(`*📊 Rating:* ${thing}\n\n${stars}\n*${rating}/10*\n\n_${BRAND}_`);
  }
);

Module(
  {
    pattern: "pickone ?(.*)",
    fromMe: isFromMe,
    desc: "Pick one from choices",
    usage: ".pickone option1, option2, option3",
    use: "fun",
  },
  async (message, match) => {
    const input = match[1];
    if (!input) return await message.sendReply("_Usage: .pickone pizza, burger, pasta_");
    const options = input.split(",").map((o) => o.trim()).filter(Boolean);
    if (options.length < 2) return await message.sendReply("_Need at least 2 options_");
    const picked = options[Math.floor(Math.random() * options.length)];
    await message.sendReply(`*🎯 I pick:* ${picked}\n\n_${BRAND}_`);
  }
);

Module(
  {
    pattern: "compliment ?(.*)",
    fromMe: isFromMe,
    desc: "Give a compliment",
    usage: ".compliment @user",
    use: "fun",
  },
  async (message) => {
    const target = message.mentions?.[0] || message.reply_message?.sender || message.sender;
    const compliments = [
      "You're an amazing person! ✨",
      "Your smile lights up the room! 😊",
      "You have the best sense of humor! 😂",
      "You make the world a better place! 🌍",
      "You're incredibly talented! 🎨",
      "Your kindness is inspiring! 💖",
      "You're stronger than you think! 💪",
      "You're a true gem! 💎",
      "The world is lucky to have you! 🌟",
      "You're absolutely wonderful! 🌈",
    ];
    const c = compliments[Math.floor(Math.random() * compliments.length)];
    await message.send(
      `*💝 @${target.split("@")[0]}*\n\n${c}\n\n_${BRAND}_`,
      "text", { mentions: [target] }
    );
  }
);

Module(
  {
    pattern: "insult ?(.*)",
    fromMe: isFromMe,
    desc: "Friendly roast (not offensive)",
    usage: ".insult @user",
    use: "fun",
  },
  async (message) => {
    const target = message.mentions?.[0] || message.reply_message?.sender || message.sender;
    const roasts = [
      "You're like a cloud — everything brightens up when you leave! ☁️",
      "I'd agree with you but then we'd both be wrong! 🤷",
      "You bring everyone so much joy — when you leave! 😂",
      "I'm not saying you're boring, but your password is probably 'password'! 🔑",
      "You're proof that even AI can have bad days! 🤖",
      "You're like a software update — whenever I see you I think 'not now'! 💻",
      "I'd explain it to you but I left my crayons at home! 🖍️",
      "You're not useless — you can always serve as a bad example! 📝",
    ];
    const r = roasts[Math.floor(Math.random() * roasts.length)];
    await message.send(
      `*🔥 @${target.split("@")[0]}*\n\n${r}\n\n_${BRAND}_`,
      "text", { mentions: [target] }
    );
  }
);

Module(
  {
    pattern: "character ?(.*)",
    fromMe: isFromMe,
    desc: "What character are you?",
    usage: ".character",
    use: "fun",
  },
  async (message) => {
    const characters = [
      "Goku 🐉 — You never give up!",
      "Naruto 🍥 — Believe it!",
      "Sukuna 👹 — King of Curses!",
      "Luffy 🏴‍☠️ — Future Pirate King!",
      "Gojo 👓 — The Strongest!",
      "Itachi 🥷 — True Sacrifice!",
      "Vegeta 💪 — Prince of Saiyans!",
      "Eren 🗡️ — Freedom!",
      "Levi ⚔️ — Humanity's Strongest!",
      "Tanjiro 🌊 — Demon Slayer!",
      "Zoro 🗡️ — Three Sword Style!",
      "Light Yagami 📓 — Justice or Evil?",
    ];
    const c = characters[Math.floor(Math.random() * characters.length)];
    await message.sendReply(`*🎭 You are:*\n\n${c}\n\n_${BRAND}_`);
  }
);

Module(
  {
    pattern: "zodiac ?(.*)",
    fromMe: isFromMe,
    desc: "Get your zodiac sign info",
    usage: ".zodiac <sign>",
    use: "fun",
  },
  async (message, match) => {
    const sign = match[1]?.trim()?.toLowerCase();
    const signs = {
      aries: "♈ Aries (Mar 21 - Apr 19) — Bold, ambitious, competitive",
      taurus: "♉ Taurus (Apr 20 - May 20) — Reliable, patient, devoted",
      gemini: "♊ Gemini (May 21 - Jun 20) — Adaptable, curious, social",
      cancer: "♋ Cancer (Jun 21 - Jul 22) — Emotional, protective, intuitive",
      leo: "♌ Leo (Jul 23 - Aug 22) — Creative, passionate, generous",
      virgo: "♍ Virgo (Aug 23 - Sep 22) — Practical, loyal, analytical",
      libra: "♎ Libra (Sep 23 - Oct 22) — Diplomatic, gracious, fair",
      scorpio: "♏ Scorpio (Oct 23 - Nov 21) — Passionate, brave, resourceful",
      sagittarius: "♐ Sagittarius (Nov 22 - Dec 21) — Generous, idealistic, humorous",
      capricorn: "♑ Capricorn (Dec 22 - Jan 19) — Disciplined, responsible, leader",
      aquarius: "♒ Aquarius (Jan 20 - Feb 18) — Progressive, independent, unique",
      pisces: "♓ Pisces (Feb 19 - Mar 20) — Intuitive, gentle, artistic",
    };
    if (!sign || !signs[sign])
      return await message.sendReply("_Usage: .zodiac aries_\n_Available: " + Object.keys(signs).join(", ") + "_");
    await message.sendReply(`*🔮 Zodiac:*\n\n${signs[sign]}\n\n_${BRAND}_`);
  }
);

Module(
  {
    pattern: "aesthetic ?(.*)",
    fromMe: isFromMe,
    desc: "Convert text to aesthetic style",
    usage: ".aesthetic <text>",
    use: "fun",
  },
  async (message, match) => {
    const text = match[1];
    if (!text) return await message.sendReply("_Need text_");
    const aesthetic = text.split("").map((c) => {
      const code = c.charCodeAt(0);
      if (code >= 33 && code <= 126) return String.fromCharCode(code + 65248);
      return c;
    }).join("");
    await message.sendReply(`*✨ Aesthetic:*\n${aesthetic}\n\n_${BRAND}_`);
  }
);

Module(
  {
    pattern: "tiny ?(.*)",
    fromMe: isFromMe,
    desc: "Convert text to tiny/superscript",
    usage: ".tiny <text>",
    use: "fun",
  },
  async (message, match) => {
    const text = match[1];
    if (!text) return await message.sendReply("_Need text_");
    const tinyMap = "ᵃᵇᶜᵈᵉᶠᵍʰⁱʲᵏˡᵐⁿᵒᵖqʳˢᵗᵘᵛʷˣʸᶻ";
    const result = text.toLowerCase().split("").map((c) => {
      const idx = c.charCodeAt(0) - 97;
      return idx >= 0 && idx < 26 ? tinyMap[idx] : c;
    }).join("");
    await message.sendReply(`*🔤 Tiny:*\n${result}\n\n_${BRAND}_`);
  }
);

Module(
  {
    pattern: "bubble ?(.*)",
    fromMe: isFromMe,
    desc: "Convert text to bubble letters",
    usage: ".bubble <text>",
    use: "fun",
  },
  async (message, match) => {
    const text = match[1];
    if (!text) return await message.sendReply("_Need text_");
    const result = text.split("").map((c) => {
      const code = c.charCodeAt(0);
      if (code >= 65 && code <= 90) return String.fromCodePoint(0x24B6 + code - 65);
      if (code >= 97 && code <= 122) return String.fromCodePoint(0x24D0 + code - 97);
      if (code >= 48 && code <= 57) return c === "0" ? "⓪" : String.fromCodePoint(0x2460 + code - 49);
      return c;
    }).join("");
    await message.sendReply(`*🫧 Bubble:*\n${result}\n\n_${BRAND}_`);
  }
);

Module(
  {
    pattern: "square2 ?(.*)",
    fromMe: isFromMe,
    desc: "Convert text to square letters",
    usage: ".square2 <text>",
    use: "fun",
  },
  async (message, match) => {
    const text = match[1];
    if (!text) return await message.sendReply("_Need text_");
    const result = text.toUpperCase().split("").map((c) => {
      const code = c.charCodeAt(0);
      if (code >= 65 && code <= 90) return String.fromCodePoint(0x1F130 + code - 65);
      return c;
    }).join("");
    await message.sendReply(`*🔲 Square:*\n${result}\n\n_${BRAND}_`);
  }
);

Module(
  {
    pattern: "clap ?(.*)",
    fromMe: isFromMe,
    desc: "Add clap emoji between words",
    usage: ".clap <text>",
    use: "fun",
  },
  async (message, match) => {
    const text = match[1];
    if (!text) return await message.sendReply("_Need text_");
    await message.sendReply(text.split(/\s+/).join(" 👏 ") + " 👏");
  }
);

Module(
  {
    pattern: "mock ?(.*)",
    fromMe: isFromMe,
    desc: "Convert text to mOcKiNg CaSe",
    usage: ".mock <text>",
    use: "fun",
  },
  async (message, match) => {
    const text = match[1] || message.reply_message?.text;
    if (!text) return await message.sendReply("_Need text or reply to a message_");
    const mocked = text.split("").map((c, i) => i % 2 === 0 ? c.toLowerCase() : c.toUpperCase()).join("");
    await message.sendReply(`${mocked}\n\n_${BRAND}_`);
  }
);

Module(
  {
    pattern: "uwu ?(.*)",
    fromMe: isFromMe,
    desc: "UwU-ify text",
    usage: ".uwu <text>",
    use: "fun",
  },
  async (message, match) => {
    const text = match[1] || message.reply_message?.text;
    if (!text) return await message.sendReply("_Need text_");
    const uwu = text.replace(/[rl]/g, "w").replace(/[RL]/g, "W").replace(/n([aeiou])/gi, "ny$1").replace(/ove/g, "uv") + " uwu~";
    await message.sendReply(`${uwu}\n\n_${BRAND}_`);
  }
);

Module(
  {
    pattern: "ttp ?(.*)",
    fromMe: isFromMe,
    desc: "Text to picture sticker",
    usage: ".ttp <text>",
    use: "fun",
  },
  async (message, match) => {
    const text = match[1];
    if (!text) return await message.sendReply("_Need text_");
    try {
      const url = `https://api.popcat.xyz/text?text=${encodeURIComponent(text)}`;
      await message.sendMessage({ url }, "sticker");
    } catch {
      return await message.sendReply("_TTP error_");
    }
  }
);

Module(
  {
    pattern: "triggered ?(.*)",
    fromMe: isFromMe,
    desc: "Triggered GIF from profile pic",
    usage: ".triggered @user",
    use: "fun",
  },
  async (message) => {
    try {
      const jid = message.mentions?.[0] || message.reply_message?.sender || message.sender;
      const ppUrl = await message.client.profilePictureUrl(jid, "image").catch(() => "https://i.ibb.co/s98DyMMq/NL-1.png");
      const url = `https://some-random-api.com/canvas/misc/triggered?avatar=${encodeURIComponent(ppUrl)}`;
      await message.sendMessage({ url }, "image", { caption: `_Triggered!_ 😤\n_${BRAND}_` });
    } catch {
      return await message.sendReply("_Triggered error_");
    }
  }
);

Module(
  {
    pattern: "gay ?(.*)",
    fromMe: isFromMe,
    desc: "Gay overlay on profile pic (joke)",
    usage: ".gay @user",
    use: "fun",
  },
  async (message) => {
    try {
      const jid = message.mentions?.[0] || message.reply_message?.sender || message.sender;
      const ppUrl = await message.client.profilePictureUrl(jid, "image").catch(() => "https://i.ibb.co/s98DyMMq/NL-1.png");
      const url = `https://some-random-api.com/canvas/misc/lgbt?avatar=${encodeURIComponent(ppUrl)}`;
      await message.sendMessage({ url }, "image", { caption: `_🏳️‍🌈_\n_${BRAND}_` });
    } catch {
      return await message.sendReply("_Error_");
    }
  }
);

Module(
  {
    pattern: "wasted ?(.*)",
    fromMe: isFromMe,
    desc: "GTA Wasted overlay on profile pic",
    usage: ".wasted @user",
    use: "fun",
  },
  async (message) => {
    try {
      const jid = message.mentions?.[0] || message.reply_message?.sender || message.sender;
      const ppUrl = await message.client.profilePictureUrl(jid, "image").catch(() => "https://i.ibb.co/s98DyMMq/NL-1.png");
      const url = `https://some-random-api.com/canvas/misc/wasted?avatar=${encodeURIComponent(ppUrl)}`;
      await message.sendMessage({ url }, "image", { caption: `_Wasted!_ 💀\n_${BRAND}_` });
    } catch {
      return await message.sendReply("_Error_");
    }
  }
);

Module(
  {
    pattern: "ship2 ?(.*)",
    fromMe: isFromMe,
    desc: "Ship two mentioned users",
    usage: ".ship2 @user1 @user2",
    use: "fun",
  },
  async (message) => {
    const m1 = message.mentions?.[0];
    const m2 = message.mentions?.[1];
    if (!m1 || !m2) return await message.sendReply("_Mention two people_\n_Example: .ship2 @user1 @user2_");
    const percent = Math.floor(Math.random() * 101);
    let emoji = percent >= 80 ? "💖" : percent >= 50 ? "❤️" : percent >= 30 ? "💛" : "💔";
    await message.send(
      `*${emoji} Love Calculator*\n\n` +
      `@${m1.split("@")[0]} ❤️ @${m2.split("@")[0]}\n\n` +
      `*Match:* ${percent}%\n\n_${BRAND}_`,
      "text", { mentions: [m1, m2] }
    );
  }
);

Module(
  {
    pattern: "nhentai ?(.*)",
    fromMe: isFromMe,
    desc: "Get a random anime quote",
    usage: ".animequote",
    use: "fun",
    excludeFromCommands: true,
  },
  async (message) => {
    await message.sendReply("_This command is not available._");
  }
);

Module(
  {
    pattern: "animequote ?(.*)",
    fromMe: isFromMe,
    desc: "Get random anime quote",
    usage: ".animequote",
    use: "fun",
  },
  async (message) => {
    try {
      const { data } = await axios.get("https://animechan.io/api/v1/quotes/random", { timeout: 10000 });
      if (data?.data) {
        const q = data.data;
        await message.sendReply(
          `*🎌 Anime Quote:*\n\n_"${q.content}"_\n\n*— ${q.character?.name || "Unknown"}*\n*📺 ${q.anime?.name || "Unknown Anime"}*\n\n_${BRAND}_`
        );
      } else {
        const quotes = [
          { q: "People's lives don't end when they die. It ends when they lose faith.", c: "Itachi Uchiha", a: "Naruto" },
          { q: "If you don't take risks, you can't create a future.", c: "Luffy", a: "One Piece" },
          { q: "The world isn't perfect. But it's there for us, doing the best it can.", c: "Roy Mustang", a: "FMA" },
        ];
        const r = quotes[Math.floor(Math.random() * quotes.length)];
        await message.sendReply(`*🎌 Anime Quote:*\n\n_"${r.q}"_\n\n*— ${r.c}*\n*📺 ${r.a}*\n\n_${BRAND}_`);
      }
    } catch {
      return await message.sendReply("_Anime quote error_");
    }
  }
);
