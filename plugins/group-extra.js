const { Module } = require("../main");
const config = require("../config");
const { isAdmin } = require("./utils");

const BRAND = "DevilXteam MD";

Module(
  {
    pattern: "tagall ?(.*)",
    fromMe: false,
    desc: "Tag all members in a group",
    usage: ".tagall <message>",
    use: "group",
  },
  async (message, match) => {
    if (!message.isGroup)
      return await message.sendReply("_This command is for groups only_");

    const senderIsAdmin = await isAdmin(message, message.sender);
    if (!message.fromOwner && !senderIsAdmin)
      return await message.sendReply("_Only admins can use this command_");

    try {
      const { participants, subject } = await message.client.groupMetadata(
        message.jid
      );

      const customMsg = match[1]?.trim() || "Attention Everyone";

      const emojis = ["📢", "🔊", "🌐", "🔰", "💗", "🔖", "🎉", "🛡️", "⚡", "🚀", "🔥"];
      const emoji = emojis[Math.floor(Math.random() * emojis.length)];

      let text =
        `*╔══ 📢 TAG ALL ══╗*\n` +
        `*┃ 📋 Group:* ${subject}\n` +
        `*┃ 👥 Members:* ${participants.length}\n` +
        `*┃ 📝 Message:* ${customMsg}\n` +
        `*╠══════════════╣*\n`;

      const mentions = [];
      for (const mem of participants) {
        if (!mem.id) continue;
        text += `${emoji} @${mem.id.split("@")[0]}\n`;
        mentions.push(mem.id);
      }

      text += `*╚══ ${BRAND} ══╝*`;

      await message.send(text, "text", { mentions });
    } catch (e) {
      console.error("TagAll error:", e.message);
      return await message.sendReply("_Error tagging all members_");
    }
  }
);

Module(
  {
    pattern: "poll ?(.*)",
    fromMe: false,
    desc: "Create a poll in the group",
    usage: ".poll question;option1,option2,option3",
    use: "group",
  },
  async (message, match) => {
    if (!message.isGroup)
      return await message.sendReply("_This command is for groups only_");

    const input = match[1];
    if (!input || !input.includes(";"))
      return await message.sendReply(
        "_Usage: .poll What's for lunch?;Pizza,Burger,Biryani_"
      );

    const [question, optionsStr] = input.split(";");
    if (!question?.trim() || !optionsStr?.trim())
      return await message.sendReply("_Need both question and options_");

    const options = optionsStr
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean);
    if (options.length < 2)
      return await message.sendReply("_Need at least 2 options_");

    try {
      await message.client.sendMessage(message.jid, {
        poll: {
          name: question.trim(),
          values: options,
          selectableCount: 1,
          toAnnouncementGroup: true,
        },
      });
    } catch (e) {
      console.error("Poll error:", e.message);
      return await message.sendReply("_Error creating poll_");
    }
  }
);

Module(
  {
    pattern: "tag ?(.*)",
    fromMe: false,
    desc: "Tag a specific member with a message",
    usage: ".tag <message> (reply to someone)",
    use: "group",
  },
  async (message, match) => {
    if (!message.isGroup)
      return await message.sendReply("_This command is for groups only_");

    const text = match[1] || "";
    if (message.reply_message) {
      const quotedSender =
        message.quoted?.key?.participant ||
        message.reply_message.sender;
      if (quotedSender) {
        await message.send(
          `${text}\n\n@${quotedSender.split("@")[0]}`,
          "text",
          { mentions: [quotedSender] }
        );
      }
    } else if (message.mention?.length) {
      await message.send(text || "📌", "text", {
        mentions: message.mention,
      });
    } else {
      return await message.sendReply("_Reply to someone or mention them_");
    }
  }
);

Module(
  {
    pattern: "tagadmins ?(.*)",
    fromMe: false,
    desc: "Tag all admins in the group",
    usage: ".tagadmins <message>",
    use: "group",
  },
  async (message, match) => {
    if (!message.isGroup)
      return await message.sendReply("_This command is for groups only_");

    try {
      const { participants, subject } = await message.client.groupMetadata(
        message.jid
      );
      const admins = participants.filter(
        (p) => p.admin === "admin" || p.admin === "superadmin"
      );

      const customMsg = match[1]?.trim() || "Attention Admins";
      let text =
        `*╔══ 👑 ADMINS ══╗*\n` +
        `*┃ 📋 Group:* ${subject}\n` +
        `*┃ 📝 ${customMsg}*\n` +
        `*╠══════════════╣*\n`;

      const mentions = [];
      for (const admin of admins) {
        text += `👑 @${admin.id.split("@")[0]}\n`;
        mentions.push(admin.id);
      }

      text += `*╚══ ${BRAND} ══╝*`;
      await message.send(text, "text", { mentions });
    } catch (e) {
      console.error("TagAdmins error:", e.message);
      return await message.sendReply("_Error tagging admins_");
    }
  }
);

Module(
  {
    pattern: "ginfo ?(.*)",
    fromMe: false,
    desc: "Get group info",
    usage: ".ginfo",
    use: "group",
  },
  async (message) => {
    if (!message.isGroup)
      return await message.sendReply("_This command is for groups only_");

    try {
      const metadata = await message.client.groupMetadata(message.jid);
      const admins = metadata.participants.filter(
        (p) => p.admin === "admin" || p.admin === "superadmin"
      );
      const owner = metadata.participants.find(
        (p) => p.admin === "superadmin"
      );

      await message.sendReply(
        `*╔══ 📋 GROUP INFO ══╗*\n` +
        `*┃ 📝 Name:* ${metadata.subject}\n` +
        `*┃ 🆔 ID:* ${metadata.id}\n` +
        `*┃ 👥 Members:* ${metadata.participants.length}\n` +
        `*┃ 👑 Admins:* ${admins.length}\n` +
        `*┃ 👤 Owner:* @${owner?.id?.split("@")[0] || "Unknown"}\n` +
        `*┃ 📅 Created:* ${new Date(metadata.creation * 1000).toLocaleDateString()}\n` +
        `*┃ 📝 Desc:* ${metadata.desc?.substring(0, 100) || "No description"}\n` +
        `*╚══ ${BRAND} ══╝*`,
        "text",
        { mentions: owner?.id ? [owner.id] : [] }
      );
    } catch (e) {
      return await message.sendReply("_Error getting group info_");
    }
  }
);

Module(
  {
    pattern: "link ?(.*)",
    fromMe: false,
    desc: "Get group invite link",
    usage: ".link",
    use: "group",
  },
  async (message) => {
    if (!message.isGroup)
      return await message.sendReply("_This command is for groups only_");

    const botIsAdmin = await isAdmin(message);
    if (!botIsAdmin)
      return await message.sendReply("_Bot needs to be admin_");

    try {
      const code = await message.client.groupInviteCode(message.jid);
      await message.sendReply(
        `*🔗 Group Invite Link:*\nhttps://chat.whatsapp.com/${code}\n\n_${BRAND}_`
      );
    } catch (e) {
      return await message.sendReply("_Error getting group link_");
    }
  }
);

Module(
  {
    pattern: "resetlink ?(.*)",
    fromMe: true,
    desc: "Reset group invite link",
    usage: ".resetlink",
    use: "group",
  },
  async (message) => {
    if (!message.isGroup)
      return await message.sendReply("_This command is for groups only_");

    const botIsAdmin = await isAdmin(message);
    if (!botIsAdmin)
      return await message.sendReply("_Bot needs to be admin_");

    try {
      await message.client.groupRevokeInvite(message.jid);
      const newCode = await message.client.groupInviteCode(message.jid);
      await message.sendReply(
        `*✅ Group link reset!*\n*🔗 New link:* https://chat.whatsapp.com/${newCode}\n\n_${BRAND}_`
      );
    } catch (e) {
      return await message.sendReply("_Error resetting link_");
    }
  }
);
