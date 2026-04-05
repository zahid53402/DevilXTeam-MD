const { Module } = require("../main");
const config = require("../config");
const { isAdmin } = require("./utils");

const BRAND = "DevilXteam MD";

if (!global.antilinkWarnings) global.antilinkWarnings = {};

Module(
  {
    pattern: "antilink ?(.*)",
    fromMe: true,
    desc: "Toggle anti-link feature in groups",
    usage: ".antilink on/off",
    use: "group",
  },
  async (message, match) => {
    if (!message.isGroup)
      return await message.sendReply("_This command is for groups only_");

    const action = match[1]?.trim()?.toLowerCase();
    if (!action || (action !== "on" && action !== "off" && action !== "status")) {
      const current = config.ANTI_LINK === "true" ? "ON ✅" : "OFF ❌";
      return await message.sendReply(
        `*╔══ 🛡️ ANTILINK ══╗*\n` +
        `*┃ Status:* ${current}\n` +
        `*╠══════════════╣*\n` +
        `*┃ .antilink on* - Enable\n` +
        `*┃ .antilink off* - Disable\n` +
        `*╚══ ${BRAND} ══╝*`
      );
    }

    if (action === "on") {
      config.ANTI_LINK = "true";
      return await message.sendReply("✅ *Anti-link enabled!* Links will be deleted.");
    } else if (action === "off") {
      config.ANTI_LINK = "false";
      return await message.sendReply("❌ *Anti-link disabled!*");
    }
  }
);

Module(
  {
    on: "message",
    fromMe: false,
    excludeFromCommands: true,
  },
  async (message) => {
    try {
      if (!message.isGroup || config.ANTI_LINK !== "true") return;

      const senderIsAdmin = await isAdmin(message, message.sender);
      if (message.fromOwner || senderIsAdmin) return;

      const botIsAdmin = await isAdmin(message);
      if (!botIsAdmin) return;

      const linkPatterns = [
        /https?:\/\/(?:chat\.whatsapp\.com|wa\.me)\/\S+/gi,
        /https?:\/\/(?:t\.me|telegram\.me)\/\S+/gi,
        /https?:\/\/(?:www\.)?discord\.com\/\S+/gi,
        /https?:\/\/(?:www\.)?discord\.gg\/\S+/gi,
      ];

      const text = message.text || message.message || "";
      const containsLink = linkPatterns.some((p) => p.test(text));
      if (!containsLink) return;

      try {
        await message.client.sendMessage(message.jid, {
          delete: message.data.key,
        });
      } catch (_) {}

      const sender = message.sender;
      global.antilinkWarnings[sender] = (global.antilinkWarnings[sender] || 0) + 1;
      const count = global.antilinkWarnings[sender];

      if (count < 3) {
        await message.send(
          `*⚠️ LINKS NOT ALLOWED ⚠️*\n\n` +
          `*User:* @${sender.split("@")[0]}\n` +
          `*Warning:* ${count}/3\n` +
          `*Reason:* Link sending\n\n` +
          `_${BRAND}_`,
          "text",
          { mentions: [sender] }
        );
      } else {
        await message.send(
          `*@${sender.split("@")[0]} REMOVED — Warning limit exceeded!*\n_${BRAND}_`,
          "text",
          { mentions: [sender] }
        );
        await message.client.groupParticipantsUpdate(
          message.jid,
          [sender],
          "remove"
        );
        delete global.antilinkWarnings[sender];
      }
    } catch (e) {
      console.error("Anti-link error:", e.message);
    }
  }
);

Module(
  {
    pattern: "vv ?(.*)",
    fromMe: true,
    desc: "Retrieve view-once messages",
    usage: ".vv (reply to view-once message)",
    use: "owner",
  },
  async (message) => {
    if (!message.quoted && !message.reply_message)
      return await message.sendReply("_Reply to a view-once message_");

    try {
      const quotedMsg = message.quoted || message.reply_message;
      if (quotedMsg.message?.viewOnceMessageV2 || quotedMsg.message?.viewOnceMessage) {
        const forwarded = await message.forwardMessage(message.jid, quotedMsg, {
          readViewOnce: true,
        });
        if (forwarded) {
          await message.react("✅");
        }
      } else {
        const buffer = await message.reply_message.download("buffer");
        if (!buffer) return await message.sendReply("_Couldn't download this message_");

        const mtype = message.reply_message.type;
        if (mtype?.includes("image")) {
          await message.sendReply(buffer, "image");
        } else if (mtype?.includes("video")) {
          await message.sendReply(buffer, "video");
        } else if (mtype?.includes("audio")) {
          await message.sendReply(buffer, "audio");
        } else {
          await message.sendReply("_Unsupported media type_");
        }
      }
    } catch (e) {
      console.error("VV error:", e.message);
      return await message.sendReply("_Error retrieving view-once message_");
    }
  }
);

Module(
  {
    pattern: "antidelete ?(.*)",
    fromMe: true,
    desc: "Toggle anti-delete feature",
    usage: ".antidelete on/off",
    use: "owner",
  },
  async (message, match) => {
    const action = match[1]?.trim()?.toLowerCase();
    const current = config.ANTI_DELETE ? "ON ✅" : "OFF ❌";

    if (!action || action === "status") {
      return await message.sendReply(
        `*Anti-Delete Status:* ${current}\n\n` +
        `*.antidelete on* - Enable\n` +
        `*.antidelete off* - Disable`
      );
    }

    if (action === "on") {
      config.ANTI_DELETE = true;
      return await message.sendReply("✅ *Anti-delete enabled!*");
    } else if (action === "off") {
      config.ANTI_DELETE = false;
      return await message.sendReply("❌ *Anti-delete disabled!*");
    }
  }
);
