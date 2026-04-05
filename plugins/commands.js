const { commands, Module } = require("../main");
const { MODE, HANDLERS, ALIVE, VERSION } = require("../config");
const config = require("../config");
const os = require("os");
const path = require("path");
const fs = require("fs");
const { setVar } = require("./manage");
const { getTotalUserCount } = require("../core/store");
const { parseAliveMessage, sendAliveMessage } = require("./utils/alive-parser");

const isPrivateMode = MODE === "private";

let cachedNewsletterJid = null;
async function getNewsletterJid(sock) {
  if (cachedNewsletterJid) return cachedNewsletterJid;
  try {
    const metadata = await sock.newsletterMetadata("invite", config.CHANNEL_INVITE);
    if (metadata && metadata.id) {
      cachedNewsletterJid = metadata.id;
      return cachedNewsletterJid;
    }
  } catch (e) {
    console.log("Newsletter JID fetch failed:", e.message);
  }
  return null;
}

function channelContext(newsletterJid) {
  if (!newsletterJid) return {};
  return {
    contextInfo: {
      forwardedNewsletterMessageInfo: {
        newsletterJid: newsletterJid,
        newsletterName: "DevilXteam",
        serverMessageId: -1,
      },
      isForwarded: true,
    },
  };
}

const extractCommandName = (pattern) => {
  const match = pattern?.toString().match(/(\W*)([A-Za-z1234567890 ]*)/);
  return match && match[2] ? match[2].trim() : "";
};

const retrieveCommandDetails = (commandName) => {
  const foundCommand = commands.find(
    (cmd) => extractCommandName(cmd.pattern) === commandName
  );
  if (!foundCommand) return null;
  return {
    name: commandName,
    ...foundCommand,
  };
};

Module(
  {
    pattern: "info ?(.*)",
    fromMe: isPrivateMode,
    desc: "Command ki maloomat deta hai",
  },
  async (message, args) => {
    const commandName = args[1]?.trim();
    if (!commandName) {
      return await message.sendReply(
        "_Command ka naam do. Misal: .info insta_"
      );
    }

    const commandDetails = retrieveCommandDetails(commandName);
    if (!commandDetails) {
      return await message.sendReply(
        `_Command '${commandName}' nahi mila. Spelling check karo._`
      );
    }

    let infoMessage = `*───「 Command Details 」───*\n\n`;
    infoMessage += `• *Command:* \`${commandDetails.name}\`\n`;
    infoMessage += `• *Description:* ${commandDetails.desc || "N/A"}\n`;
    infoMessage += `• *Malik Command:* ${
      commandDetails.fromMe ? "Haan" : "Nahi"
    }\n`;
    if (commandDetails.use) infoMessage += `• *Type:* ${commandDetails.use}\n`;
    if (commandDetails.usage)
      infoMessage += `• *Usage:* ${commandDetails.name} ${commandDetails.usage}\n`;
    if (commandDetails.warn)
      infoMessage += `• *Warning:* ${commandDetails.warn}\n`;

    await message.sendReply(infoMessage);
  }
);

Module(
  {
    pattern: "list ?(.*)",
    fromMe: isPrivateMode,
    excludeFromCommands: true,
  },
  async (message, args) => {
    const availableCommands = commands.filter(
      (cmd) => !cmd.excludeFromCommands && cmd.pattern
    );
    const totalCommandCount = availableCommands.length;

    const categorizedCommands = {};
    availableCommands.forEach((cmd) => {
      const category = cmd.use || "General";
      if (!categorizedCommands[category]) {
        categorizedCommands[category] = [];
      }
      const commandName = extractCommandName(cmd.pattern);
      if (commandName) {
        categorizedCommands[category].push({
          name: commandName,
          desc: cmd.desc,
          usage: cmd.usage,
          warn: cmd.warn,
        });
      }
    });

    let responseMessage = `*Total Available Commands: ${totalCommandCount}*\n\n`;
    const handlerPrefix = HANDLERS.match(/\[(\W*)\]/)?.[1]?.[0] || ".";

    for (const category in categorizedCommands) {
      responseMessage += `*───「 ${category.toUpperCase()} 」───*\n\n`;
      categorizedCommands[category].forEach((cmd) => {
        responseMessage += `• \`${handlerPrefix}${cmd.name}\`\n`;
        if (cmd.desc) responseMessage += `  _Tafsilat:_ ${cmd.desc}\n`;
        if (cmd.usage) responseMessage += `  _Istemal:_ ${cmd.usage}\n`;
        if (cmd.warn) responseMessage += `  _Khabardar:_ ${cmd.warn}\n`;
        responseMessage += "\n";
      });
    }
    await message.sendReply(responseMessage);
  }
);

function bytesToSize(bytes) {
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  if (bytes === 0) return "0 Byte";
  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
  return Math.round(bytes / Math.pow(1024, i), 2) + " " + sizes[i];
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

async function parseAlive(message, aliveMessage) {
  if (!aliveMessage) {
    const defaultAliveMessage = "Main zinda hoon!";
    return await message.sendReply(defaultAliveMessage);
  }

  if (aliveMessage.includes("$")) {
    const parsedMessage = await parseAliveMessage(aliveMessage, message);
    if (parsedMessage) {
      await sendAliveMessage(message, parsedMessage);
    } else {
      await message.sendReply(aliveMessage);
    }
  } else {
    await message.sendReply(aliveMessage);
  }
}

const manage = {
  setVar: async (key, value, message) => {
    await message.sendReply(
      `_Attempted to set ${key} to ${value}. (Note: This is a placeholder and doesn't persist changes in this demo)_`
    );
  },
};

Module(
  {
    pattern: "alive",
    fromMe: isPrivateMode,
    desc: "Check karta hai bot zinda hai ya nahi.",
  },
  async (message, match) => {
    await parseAlive(message, ALIVE);
  }
);

Module(
  {
    pattern: "setalive ?(.*)",
    fromMe: true,
    desc: "Sets the alive message for the bot with formatting options.",
    usage:
      ".setalive <message> (with placeholders)\n.setalive help (show formatting help)",
    dontAddCommandList: true,
  },
  async (message, match) => {
    if (!match[1]) {
      return await message.sendReply(`*Alive Message Setup*

*Usage:*
• \`.setalive <message>\` - Set alive message
• \`.setalive help\` - Show detailed formatting help
• \`.setalive get\` - View current alive message
• \`.setalive del\` - Delete custom alive message
• \`.testalive\` - Test current alive message

*Quick Example:*
\`.setalive Hey $user! $botname is online!
_Version: $version_
_Uptime: $uptime_
_Istemal karne walas: $users_ $pp\`

*Use \`.setalive help\` for all available placeholders.*`);
    }

    const input = match[1].toLowerCase();

    if (input === "help") {
      const helpText = `*Alive Message Formatting Help*

*Available Placeholders:*

*Bot Stats:*
• \`$botname\` - Bot's display name
• \`$owner\` - Bot owner name
• \`$version\` - Bot version
• \`$mode\` - Bot mode (private/public)
• \`$server\` - Server OS
• \`$uptime\` - Bot uptime

*System Stats:*
• \`$ram\` - Dastiyab RAM
• \`$totalram\` - Total RAM
• \`$users\` - Total users in database

*Istemal karne wala Info:*
• \`$user\` - Sender's name
• \`$number\` - Sender's number
• \`$date\` - Current date
• \`$time\` - Current time

*Media Options:*
• \`$pp\` - Sender's profile picture
• \`$media:url\` - Custom image/video URL

*Example Messages:*

*Simple:*
\`Hey $user! $botname is alive!\`

*Detailed:*
\`*$botname Status*
_Hi $user!_
*Stats:*
• _Version: $version_
• _Mode: $mode_
• _Uptime: $uptime_
• _Istemal karne walas: $users_
• _RAM: $ram/$totalram_
*Date:* _$date at $time_ $pp\`

*With Custom Media:*
\`$botname is online! $media:https://example.com/image.jpg\`

*With Video (auto gif playback):*
\`Bot status: Active! $media:https://example.com/video.mp4\`

*Notes:*
• Messages limited to 2000 characters
• Videos auto-play as GIFs
• \`$pp\` includes sender's profile picture
• URLs in \`$media:\` must be direct links
• Use quotes for multi-word messages`;

      return await message.sendReply(helpText);
    }

    if (input === "get") {
      const current = ALIVE;
      if (!current) {
        return await message.sendReply(
          "_Koi custom alive message nahi! Default use ho raha hai._"
        );
      }
      return await message.sendReply(
        `*Mojuda Alive Message:*\n\n${current}\n\n_Tip: Use_ \`.testalive\` _to test your message!_`
      );
    }

    if (input === "del" || input === "delete") {
      await setVar("ALIVE", "");
      return await message.sendReply(
        "_Custom alive message delete ho gaya! Ab default use hoga._"
      );
    }

    const aliveMessage = match[1];
    if (aliveMessage.length > 2000) {
      return await message.sendReply(
        "_Alive message bohat lamba hai! 2000 huroof se kam rakho._"
      );
    }

    await setVar("ALIVE", aliveMessage);
    return await message.sendReply(
      `_Alive message kaamyabi se set ho gaya!_\n\n*Preview:*\n${aliveMessage}\n\n_Tip: Use_ \`.testalive\` _to test your message!_`
    );
  }
);

Module(
  {
    pattern: "menu",
    fromMe: isPrivateMode,
    use: "utility",
    desc: "Bot ka command menu dikhata hai.",
  },
  async (message, match) => {
    const emojis = { General: "⚙️", utility: "🛠️", admin: "👑", group: "👥", download: "📥", sticker: "🎨", fun: "🎮", game: "🎯", search: "🔍", tools: "🔧", ai: "🤖", owner: "🔐", misc: "📦" };
    const getEmoji = (cat) => emojis[cat] || emojis[cat.toLowerCase()] || "⚡";

    let types = [
      ...new Set(
        commands.filter((e) => e.pattern).map((e) => e.use || "General")
      ),
    ];

    let cmd_obj = {};
    for (const command of commands) {
      let type_det = command.use || "General";
      if (!cmd_obj[type_det]?.length) cmd_obj[type_det] = [];
      let cmd_name = extractCommandName(command.pattern);
      if (cmd_name) cmd_obj[type_det].push(cmd_name);
    }

    const handlerPrefix = HANDLERS !== "false" ? HANDLERS.split("")[0] : "";
    const used = bytesToSize(os.freemem());
    const total = bytesToSize(os.totalmem());
    const totalUsers = await getTotalUserCount();
    const infoParts = config.BOT_INFO.split(";");
    const botName = infoParts[0] || "DevilXteam MD";
    const botMalik = infoParts[1] || "N/A";
    const botVersion = VERSION;
    const totalCmds = types.reduce((sum, t) => sum + (cmd_obj[t] || []).length, 0);

    const botImagePath = path.join(__dirname, "utils", "images", "default.png");
    const botImageBuf = fs.existsSync(botImagePath) ? fs.readFileSync(botImagePath) : null;

    let cmdCounter = 0;
    const catEntries = [];
    for (const n of types) {
      const cmds = cmd_obj[n] || [];
      if (cmds.length === 0) continue;
      const catName = n.charAt(0).toUpperCase() + n.slice(1);
      let catText = `╭─❏ ${getEmoji(n)} *${catName}* ❐ ─ ⊹`;
      for (const x of cmds) {
        cmdCounter++;
        catText += `\n│ ✦ \`${handlerPrefix}${x.trim()}\``;
      }
      catText += `\n╰─────────── ⊹ _${cmds.length} cmds_ ⊹`;
      catEntries.push(catText);
    }

    const allCommandsText = catEntries.join("\n\n");
    const now = new Date();
    const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
    const dateStr = now.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
    const uptimeSec = process.uptime();
    const uptimeH = Math.floor(uptimeSec / 3600);
    const uptimeM = Math.floor((uptimeSec % 3600) / 60);

    const fullCaption = `⬡ ──────────────── ⬡
     *✦ ${botName} ✦*
     _👑 DevilXteam_
⬡ ──────────────── ⬡

┏━━━━━━━━━━━━━━━━━━┓
┃   *⚡ B O T  S T A T U S*
┗━━━━━━━━━━━━━━━━━━┛
┃
┃  👑  *Owner*   ∙ ${botMalik}
┃  👤  *User*    ∙ ${message.senderName?.replace(/[\r\n]+/gm, "") || "User"}
┃  🔐  *Mode*    ∙ ${MODE}
┃  🖥️  *Host*    ∙ ${os.platform() === "linux" ? "Linux" : "Unknown"}
┃  📊  *RAM*     ∙ ${used} / ${total}
┃  👥  *Users*   ∙ ${totalUsers}
┃  ⚙️  *Ver*     ∙ v${botVersion}
┃  📦  *Cmds*    ∙ ${totalCmds}
┃  🕐  *Time*    ∙ ${timeStr}
┃  📅  *Date*    ∙ ${dateStr}
┃  ⏱️  *Uptime*  ∙ ${uptimeH}h ${uptimeM}m
┃
╰━━━━━━━━━━━━━━━━━━╯

⬡ ── *C O M M A N D S* ── ⬡

${allCommandsText}

⬡ ── *T E A M  M E M B E R S* ── ⬡

┃ 😈 *Black Devil*
┃    wa.me/923049730127
┃
┃ 👑 *D.Kumail*
┃    wa.me/923554080521
┃
┃ 🦁 *Zahid King*
┃    wa.me/923044154575
┃
┃ ✍️ *Waqar Writs*
┃    wa.me/923375626980
┃
┃ 🎭 *Marco Malik*
┃    wa.me/923706328012

⬡ ──────────────── ⬡
> _⚡ Powered by ${botName}_
> _👑 D.Kumail • DevilXteam_
⬡ ──────────────── ⬡`;

    try {
      const nlJid = await getNewsletterJid(message.client);
      const chCtx = channelContext(nlJid);

      console.log("[MENU] Sending single image + full menu caption...");

      await message.client.sendMessage(message.jid, {
        image: botImageBuf,
        caption: fullCaption,
        ...chCtx,
      });

      console.log("[MENU] Menu sent!");

      (async () => {
        try {
          const fallbackOgg = path.join(__dirname, "utils", "audio", "menu-voice-opus.ogg");
          const fallbackMp3 = path.join(__dirname, "utils", "audio", "menu-voice.mp3");
          if (fs.existsSync(fallbackOgg)) {
            await message.client.sendMessage(message.jid, {
              audio: fs.readFileSync(fallbackOgg),
              mimetype: "audio/ogg; codecs=opus",
              ptt: true,
            });
          } else if (fs.existsSync(fallbackMp3)) {
            await message.client.sendMessage(message.jid, {
              audio: fs.readFileSync(fallbackMp3),
              mimetype: "audio/mpeg",
              ptt: true,
            });
          }
        } catch (_) {}
      })();
    } catch (error) {
      console.error("Error sending menu:", error);
      await message.client.sendMessage(message.jid, {
        text: `🔥 *${botName}*\n\n${catEntries.join("\n\n")}\n\n> 📢 ${config.CHANNEL_LINK}`,
      });
    }
  }
);
Module(
  {
    pattern: "games ?(.*)",
    fromMe: isPrivateMode,
    desc: "Sab available games dikhata hai",
  },
  async (message, args) => {
    const gameCommands = commands.filter(
      (cmd) => cmd.use === "game" && cmd.pattern
    );
    if (!gameCommands.length) {
      return await message.sendReply("_Koi game install nahi._");
    }
    const handlerPrefix = HANDLERS.match(/\[(\W*)\]/)?.[1]?.[0] || ".";
    let response = `*───「 Dastiyab Games 」───*\n\n`;
    gameCommands.forEach((cmd) => {
      const name = extractCommandName(cmd.pattern);
      if (name) {
        response += `• *Command:* \`${handlerPrefix}${name}\`\n`;
        response += `• *Description:* ${cmd.desc || "N/A"}\n`;
        if (cmd.use) response += `• *Type:* ${cmd.use}\n`;
        if (cmd.usage) response += `• *Usage:* ${cmd.usage}\n`;
        if (cmd.warn) response += `• *Warning:* ${cmd.warn}\n`;
        response += "\n";
      }
    });
    await message.sendReply(response);
  }
);

Module(
  {
    pattern: "setinfo ?(.*)",
    fromMe: true,
    desc: "Shows info about bot configuration commands.",
    use: "settings",
  },
  async (message, match) => {
    const infoParts = config.BOT_INFO.split(";");
    const infoText = `*───「 Bot Info 」───*

*Bot Name:* ${infoParts[0] || "DevilXteam MD"}
*Malik:* ${infoParts[1] || "DevilXteam"}

_Owner naam change karne ke liye:_
- Command: \`.setowner <name>\`
- Example: \`.setowner John\`

_Bot name aur image deploy ke waqt set hota hai aur change nahi hota._`;

    return await message.sendReply(infoText);
  }
);

Module(
  {
    pattern: "setowner ?(.*)",
    fromMe: true,
    desc: "Bot ka malik set karta hai",
    use: "settings",
  },
  async (message, match) => {
    const owner = match[1]?.trim();
    if (!owner)
      return await message.sendReply("_Malik ka naam do: .setowner MalikName_");
    await setVar("BOT_INFO", "DevilXteam MD;" + owner + ";default");
    return await message.sendReply(
      `_Bot malik kaamyabi se update ho gaya!_\n\n*New Malik:* ${owner}`
    );
  }
);
Module(
  {
    pattern: "testalive",
    fromMe: true,
    desc: "Mojuda alive message test karo.",
    usage: ".testalive",
    use: "utility",
  },
  async (message, match) => {
    const aliveMessage = ALIVE;

    if (!aliveMessage) {
      return await message.sendReply(
        "*Default Alive Message Test:*\nI'm alive!"
      );
    }

    await message.sendReply("*Alive Message Test:*");
    await parseAlive(message, aliveMessage);
  }
);
