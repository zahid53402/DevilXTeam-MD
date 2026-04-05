const { Module } = require("../main");
const config = require("../config");

const BRAND = "DevilXteam MD";

Module(
  {
    pattern: "save ?(.*)",
    fromMe: true,
    desc: "Save/forward replied media to chat",
    usage: ".save (reply to media)",
    use: "owner",
  },
  async (message) => {
    if (!message.reply_message)
      return await message.sendReply("_Reply to a message to save it_");

    try {
      const buffer = await message.reply_message.download("buffer");
      if (!buffer)
        return await message.sendReply("_Couldn't download this media_");

      const type = message.reply_message.type || "";
      if (type.includes("image")) {
        await message.sendReply(buffer, "image");
      } else if (type.includes("video")) {
        await message.sendReply(buffer, "video");
      } else if (type.includes("audio")) {
        await message.sendMessage(buffer, "audio", { mimetype: "audio/mp4" });
      } else if (type.includes("sticker")) {
        await message.sendMessage(buffer, "sticker");
      } else if (type.includes("document")) {
        await message.sendMessage(buffer, "document", {
          fileName: "saved_file",
        });
      } else {
        await message.sendReply("_Unsupported media type_");
      }
    } catch (e) {
      console.error("Save error:", e.message);
      return await message.sendReply("_Error saving media_");
    }
  }
);

Module(
  {
    pattern: "forward ?(.*)",
    fromMe: true,
    desc: "Forward a quoted message to specified JID",
    usage: ".forward <number> (reply to message)",
    use: "owner",
  },
  async (message, match) => {
    if (!message.reply_message || !message.quoted)
      return await message.sendReply("_Reply to a message to forward it_");

    const target = match[1]?.trim();
    if (!target)
      return await message.sendReply("_Need target number_\n_Example: .forward 923001234567_");

    const jid = target.includes("@") ? target : `${target}@s.whatsapp.net`;

    try {
      await message.forwardMessage(jid, message.quoted);
      await message.sendReply(`_✅ Forwarded to ${target}_`);
    } catch (e) {
      console.error("Forward error:", e.message);
      return await message.sendReply("_Error forwarding message_");
    }
  }
);

Module(
  {
    pattern: "broadcast ?(.*)",
    fromMe: true,
    desc: "Broadcast message to all groups",
    usage: ".broadcast <message>",
    use: "owner",
  },
  async (message, match) => {
    const text = match[1];
    if (!text)
      return await message.sendReply("_Need a message to broadcast_");

    try {
      const groups = await message.client.groupFetchAllParticipating();
      const groupIds = Object.keys(groups);
      let sent = 0;

      const broadcastMsg =
        `*╔══ 📢 BROADCAST ══╗*\n\n${text}\n\n*╚══ ${BRAND} ══╝*`;

      for (const gid of groupIds) {
        try {
          await message.client.sendMessage(gid, { text: broadcastMsg });
          sent++;
          await new Promise((r) => setTimeout(r, 1000));
        } catch (_) {}
      }

      await message.sendReply(
        `_✅ Broadcast sent to ${sent}/${groupIds.length} groups_`
      );
    } catch (e) {
      console.error("Broadcast error:", e.message);
      return await message.sendReply("_Broadcast error_");
    }
  }
);

Module(
  {
    pattern: "jid ?(.*)",
    fromMe: true,
    desc: "Get JID of current chat or replied user",
    usage: ".jid",
    use: "owner",
  },
  async (message) => {
    if (message.reply_message && message.quoted?.key?.participant) {
      return await message.sendReply(
        `🆔 *User JID:* ${message.quoted.key.participant}\n🆔 *Chat JID:* ${message.jid}\n\n*DevilXteam MD*`
      );
    }
    await message.sendReply(`🆔 *Chat JID:* ${message.jid}\n\n*DevilXteam MD*`);
  }
);

Module(
  {
    pattern: "block ?(.*)",
    fromMe: true,
    desc: "Block a user",
    usage: ".block (reply or @mention)",
    use: "owner",
  },
  async (message, match) => {
    let target;
    if (message.reply_message && message.quoted?.key?.participant) {
      target = message.quoted.key.participant;
    } else if (message.mention?.length) {
      target = message.mention[0];
    } else if (match[1]) {
      target = match[1].includes("@") ? match[1] : `${match[1]}@s.whatsapp.net`;
    }

    if (!target) return await message.sendReply("_Reply to someone or mention them_");

    try {
      await message.client.updateBlockStatus(target, "block");
      await message.sendReply(`_✅ Blocked @${target.split("@")[0]}_`, "text", {
        mentions: [target],
      });
    } catch (e) {
      return await message.sendReply("_Error blocking user_");
    }
  }
);

Module(
  {
    pattern: "unblock ?(.*)",
    fromMe: true,
    desc: "Unblock a user",
    usage: ".unblock (reply or @mention)",
    use: "owner",
  },
  async (message, match) => {
    let target;
    if (message.reply_message && message.quoted?.key?.participant) {
      target = message.quoted.key.participant;
    } else if (message.mention?.length) {
      target = message.mention[0];
    } else if (match[1]) {
      target = match[1].includes("@") ? match[1] : `${match[1]}@s.whatsapp.net`;
    }

    if (!target) return await message.sendReply("_Reply to someone or mention them_");

    try {
      await message.client.updateBlockStatus(target, "unblock");
      await message.sendReply(`_✅ Unblocked @${target.split("@")[0]}_`, "text", {
        mentions: [target],
      });
    } catch (e) {
      return await message.sendReply("_Error unblocking user_");
    }
  }
);
