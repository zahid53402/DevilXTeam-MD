const { Module } = require("../main");
const config = require("../config");

const BRAND = "DevilXteam MD";

Module(
  {
    pattern: "ship ?(.*)",
    fromMe: false,
    desc: "Randomly pair two group members for fun",
    usage: ".ship",
    use: "fun",
  },
  async (message) => {
    if (!message.isGroup)
      return await message.sendReply("_This command is for groups only_");

    try {
      await message.react("❤️");
      const { participants } = await message.client.groupMetadata(message.jid);
      const members = participants.map((p) => p.id);

      let partner;
      do {
        partner = members[Math.floor(Math.random() * members.length)];
      } while (partner === message.sender && members.length > 1);

      const percent = Math.floor(Math.random() * 101);
      let emoji, msg;
      if (percent >= 80) { emoji = "💖"; msg = "Perfect Match!"; }
      else if (percent >= 50) { emoji = "❤️"; msg = "Great Chemistry!"; }
      else if (percent >= 30) { emoji = "💛"; msg = "Could work out!"; }
      else { emoji = "💔"; msg = "Not the best match..."; }

      const hearts = "❤️".repeat(Math.ceil(percent / 20));

      await message.send(
        `*╔══ ${emoji} LOVE MATCH ══╗*\n\n` +
        `*┃* @${message.sender.split("@")[0]}\n` +
        `*┃*       ❤️ ${percent}% ❤️\n` +
        `*┃* @${partner.split("@")[0]}\n\n` +
        `*┃ ${hearts}*\n` +
        `*┃ ${msg}*\n\n` +
        `*╚══ ${BRAND} ══╝*`,
        "text",
        { mentions: [message.sender, partner] }
      );
    } catch (e) {
      console.error("Ship error:", e.message);
      return await message.sendReply("_Error in ship command_");
    }
  }
);

Module(
  {
    pattern: "bacha ?(.*)",
    fromMe: false,
    desc: "Randomly select a boy from the group",
    usage: ".bacha",
    use: "fun",
  },
  async (message) => {
    if (!message.isGroup)
      return await message.sendReply("_This command is for groups only_");

    try {
      await message.react("👦");
      const { participants } = await message.client.groupMetadata(message.jid);
      const eligible = participants.filter(
        (p) => !p.id.includes(message.client.user?.id?.split(":")[0])
      );

      if (!eligible.length)
        return await message.sendReply("_No members found_");

      const random = eligible[Math.floor(Math.random() * eligible.length)];
      await message.send(
        `*👦 Yeh lo tumhara Bacha!*\n\n@${random.id.split("@")[0]} is your handsome boy! 😎\n\n_${BRAND}_`,
        "text",
        { mentions: [random.id] }
      );
    } catch (e) {
      console.error("Bacha error:", e.message);
    }
  }
);

Module(
  {
    pattern: "bachi ?(.*)",
    fromMe: false,
    desc: "Randomly select a girl from the group",
    usage: ".bachi",
    use: "fun",
  },
  async (message) => {
    if (!message.isGroup)
      return await message.sendReply("_This command is for groups only_");

    try {
      await message.react("👧");
      const { participants } = await message.client.groupMetadata(message.jid);
      const eligible = participants.filter(
        (p) => !p.id.includes(message.client.user?.id?.split(":")[0])
      );

      if (!eligible.length)
        return await message.sendReply("_No members found_");

      const random = eligible[Math.floor(Math.random() * eligible.length)];
      await message.send(
        `*👧 Yeh lo tumhari Bachi!*\n\n@${random.id.split("@")[0]} is your beautiful girl! 💖\n\n_${BRAND}_`,
        "text",
        { mentions: [random.id] }
      );
    } catch (e) {
      console.error("Bachi error:", e.message);
    }
  }
);

Module(
  {
    pattern: "dare ?(.*)",
    fromMe: false,
    desc: "Get a random dare challenge",
    usage: ".dare",
    use: "fun",
  },
  async (message) => {
    const dares = [
      "Send your last selfie in this group! 📸",
      "Change your profile picture to a funny face for 1 hour!",
      "Send a voice note singing your favorite song! 🎤",
      "Text your last contact 'I love you' and screenshot it! 💕",
      "Don't use emojis for 24 hours! 😱",
      "Send the 5th photo in your gallery! 🖼️",
      "Make your status 'I'm a potato' for 3 hours! 🥔",
      "Send a 30 second voice note talking about yourself! 🎙️",
      "Type with your eyes closed for the next 5 messages!",
      "Send a message to your crush right now! 💘",
      "Do 10 pushups and send a voice note counting! 💪",
      "Share your most embarrassing moment! 😂",
    ];
    const dare = dares[Math.floor(Math.random() * dares.length)];
    await message.sendReply(`*🎯 DARE:*\n\n${dare}\n\n_${BRAND}_`);
  }
);

Module(
  {
    pattern: "truth ?(.*)",
    fromMe: false,
    desc: "Get a random truth question",
    usage: ".truth",
    use: "fun",
  },
  async (message) => {
    const truths = [
      "What's your biggest secret? 🤫",
      "Who was your first crush? 💕",
      "What's the most embarrassing thing you've done?",
      "Have you ever lied to your best friend?",
      "What's the weirdest dream you've had?",
      "Who do you secretly dislike in this group?",
      "What's your phone's screen time today? ⏰",
      "Have you ever stalked someone on social media? 🔍",
      "What's the last lie you told?",
      "If you could be invisible for a day, what would you do?",
      "What's the most childish thing you still do?",
      "Have you ever pretended to be sick to skip school/work?",
    ];
    const truth = truths[Math.floor(Math.random() * truths.length)];
    await message.sendReply(`*🤔 TRUTH:*\n\n${truth}\n\n_${BRAND}_`);
  }
);

Module(
  {
    pattern: "quote ?(.*)",
    fromMe: false,
    desc: "Get a random inspirational quote",
    usage: ".quote",
    use: "fun",
  },
  async (message) => {
    try {
      const { data } = await require("axios").get(
        "https://api.quotable.io/random",
        { timeout: 10000 }
      );
      if (data?.content) {
        await message.sendReply(
          `*📜 Quote:*\n\n_"${data.content}"_\n\n*— ${data.author}*\n\n_${BRAND}_`
        );
      } else {
        const quotes = [
          { q: "The only way to do great work is to love what you do.", a: "Steve Jobs" },
          { q: "In the middle of difficulty lies opportunity.", a: "Albert Einstein" },
          { q: "It does not matter how slowly you go as long as you do not stop.", a: "Confucius" },
        ];
        const r = quotes[Math.floor(Math.random() * quotes.length)];
        await message.sendReply(`*📜 Quote:*\n\n_"${r.q}"_\n\n*— ${r.a}*\n\n_${BRAND}_`);
      }
    } catch {
      const quotes = [
        { q: "Be yourself; everyone else is already taken.", a: "Oscar Wilde" },
        { q: "Two things are infinite: the universe and human stupidity.", a: "Albert Einstein" },
        { q: "The future belongs to those who believe in the beauty of their dreams.", a: "Eleanor Roosevelt" },
      ];
      const r = quotes[Math.floor(Math.random() * quotes.length)];
      await message.sendReply(`*📜 Quote:*\n\n_"${r.q}"_\n\n*— ${r.a}*\n\n_${BRAND}_`);
    }
  }
);

Module(
  {
    pattern: "8ball ?(.*)",
    fromMe: false,
    desc: "Ask the magic 8-ball a question",
    usage: ".8ball <question>",
    use: "fun",
  },
  async (message, match) => {
    if (!match[1]) return await message.sendReply("_Ask a question!_");
    const answers = [
      "🎱 It is certain.", "🎱 It is decidedly so.", "🎱 Without a doubt.",
      "🎱 Yes definitely.", "🎱 You may rely on it.", "🎱 As I see it, yes.",
      "🎱 Most likely.", "🎱 Outlook good.", "🎱 Yes.",
      "🎱 Signs point to yes.", "🎱 Reply hazy, try again.",
      "🎱 Ask again later.", "🎱 Better not tell you now.",
      "🎱 Cannot predict now.", "🎱 Concentrate and ask again.",
      "🎱 Don't count on it.", "🎱 My reply is no.",
      "🎱 My sources say no.", "🎱 Outlook not so good.",
      "🎱 Very doubtful.",
    ];
    const answer = answers[Math.floor(Math.random() * answers.length)];
    await message.sendReply(`*❓ Question:* ${match[1]}\n\n${answer}\n\n_${BRAND}_`);
  }
);
