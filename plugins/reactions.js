const { Module } = require("../main");
const config = require("../config");

const BRAND = "DevilXteam MD";
const isFromMe = config.MODE === "public" ? false : true;

Module(
  {
    pattern: "autoreact ?(.*)",
    fromMe: true,
    desc: "Toggle auto react on messages",
    usage: ".autoreact on/off",
    use: "settings",
  },
  async (message, match) => {
    const val = match[1]?.toLowerCase();
    if (!val || !["on", "off"].includes(val))
      return await message.sendReply("_Usage: .autoreact on/off_");
    global.autoReact = val === "on";
    await message.sendReply(`*Auto React:* ${val === "on" ? "✅ ON" : "❌ OFF"}\n\n_${BRAND}_`);
  }
);

Module(
  {
    pattern: "autoread ?(.*)",
    fromMe: true,
    desc: "Toggle auto read messages",
    usage: ".autoread on/off",
    use: "settings",
  },
  async (message, match) => {
    const val = match[1]?.toLowerCase();
    if (!val || !["on", "off"].includes(val))
      return await message.sendReply("_Usage: .autoread on/off_");
    global.autoRead = val === "on";
    await message.sendReply(`*Auto Read:* ${val === "on" ? "✅ ON" : "❌ OFF"}\n\n_${BRAND}_`);
  }
);

Module(
  {
    pattern: "autotyping ?(.*)",
    fromMe: true,
    desc: "Toggle auto typing indicator",
    usage: ".autotyping on/off",
    use: "settings",
  },
  async (message, match) => {
    const val = match[1]?.toLowerCase();
    if (!val || !["on", "off"].includes(val))
      return await message.sendReply("_Usage: .autotyping on/off_");
    global.autoTyping = val === "on";
    await message.sendReply(`*Auto Typing:* ${val === "on" ? "✅ ON" : "❌ OFF"}\n\n_${BRAND}_`);
  }
);

Module(
  {
    pattern: "autorecording ?(.*)",
    fromMe: true,
    desc: "Toggle auto recording indicator",
    usage: ".autorecording on/off",
    use: "settings",
  },
  async (message, match) => {
    const val = match[1]?.toLowerCase();
    if (!val || !["on", "off"].includes(val))
      return await message.sendReply("_Usage: .autorecording on/off_");
    global.autoRecording = val === "on";
    await message.sendReply(`*Auto Recording:* ${val === "on" ? "✅ ON" : "❌ OFF"}\n\n_${BRAND}_`);
  }
);

Module(
  {
    pattern: "autostatus ?(.*)",
    fromMe: true,
    desc: "Toggle auto view and react to statuses",
    usage: ".autostatus on/off",
    use: "settings",
  },
  async (message, match) => {
    const val = match[1]?.toLowerCase();
    if (!val || !["on", "off"].includes(val))
      return await message.sendReply("_Usage: .autostatus on/off_");
    global.autoStatus = val === "on";
    await message.sendReply(`*Auto Status View:* ${val === "on" ? "✅ ON" : "❌ OFF"}\n\n_${BRAND}_`);
  }
);

Module(
  {
    pattern: "autobio ?(.*)",
    fromMe: true,
    desc: "Set auto-updating bio/about",
    usage: ".autobio on/off",
    use: "settings",
  },
  async (message, match) => {
    const val = match[1]?.toLowerCase();
    if (!val || !["on", "off"].includes(val))
      return await message.sendReply("_Usage: .autobio on/off_");
    global.autoBio = val === "on";
    if (val === "on") {
      const updateBio = async () => {
        try {
          const uptime = process.uptime();
          const h = Math.floor(uptime / 3600);
          const m = Math.floor((uptime % 3600) / 60);
          await message.client.updateProfileStatus(
            `${BRAND} | Uptime: ${h}h ${m}m | ${new Date().toLocaleTimeString()}`
          );
        } catch (_) {}
      };
      if (global.autoBioInterval) clearInterval(global.autoBioInterval);
      global.autoBioInterval = setInterval(updateBio, 60000);
      updateBio();
    } else {
      if (global.autoBioInterval) clearInterval(global.autoBioInterval);
    }
    await message.sendReply(`*Auto Bio:* ${val === "on" ? "✅ ON" : "❌ OFF"}\n\n_${BRAND}_`);
  }
);

Module(
  {
    pattern: "antibadword ?(.*)",
    fromMe: true,
    desc: "Toggle bad word filter in groups",
    usage: ".antibadword on/off",
    use: "group",
  },
  async (message, match) => {
    if (!message.isGroup) return await message.sendReply("_Group only command_");
    const val = match[1]?.toLowerCase();
    if (!val || !["on", "off"].includes(val))
      return await message.sendReply("_Usage: .antibadword on/off_");
    if (!global.antibadword) global.antibadword = {};
    global.antibadword[message.jid] = val === "on";
    await message.sendReply(`*Anti Bad Word:* ${val === "on" ? "✅ ON" : "❌ OFF"}\n\n_${BRAND}_`);
  }
);

Module(
  {
    pattern: "antisticker ?(.*)",
    fromMe: true,
    desc: "Toggle sticker filter in groups",
    usage: ".antisticker on/off",
    use: "group",
  },
  async (message, match) => {
    if (!message.isGroup) return await message.sendReply("_Group only command_");
    const val = match[1]?.toLowerCase();
    if (!val || !["on", "off"].includes(val))
      return await message.sendReply("_Usage: .antisticker on/off_");
    if (!global.antisticker) global.antisticker = {};
    global.antisticker[message.jid] = val === "on";
    await message.sendReply(`*Anti Sticker:* ${val === "on" ? "✅ ON" : "❌ OFF"}\n\n_${BRAND}_`);
  }
);
