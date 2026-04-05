const { Module } = require("../main");
const config = require("../config");

const BRAND = "DevilXteam MD";

Module(
  {
    pattern: "setpp ?(.*)",
    fromMe: true,
    desc: "Set bot profile picture",
    usage: ".setpp (reply to image)",
    use: "owner",
  },
  async (message) => {
    if (!message.reply_message?.image)
      return await message.sendReply("_Reply to an image to set as profile picture_");
    try {
      const media = await message.reply_message.downloadMediaMessage();
      await message.client.updateProfilePicture(message.client.user.id, media);
      await message.sendReply(`*✅ Profile picture updated!*\n_${BRAND}_`);
    } catch (e) {
      return await message.sendReply("_Failed to update profile picture_");
    }
  }
);

Module(
  {
    pattern: "setgpp ?(.*)",
    fromMe: true,
    desc: "Set group profile picture",
    usage: ".setgpp (reply to image)",
    use: "owner",
  },
  async (message) => {
    if (!message.isGroup) return await message.sendReply("_Group only command_");
    if (!message.reply_message?.image)
      return await message.sendReply("_Reply to an image_");
    try {
      const media = await message.reply_message.downloadMediaMessage();
      await message.client.updateProfilePicture(message.jid, media);
      await message.sendReply(`*✅ Group picture updated!*\n_${BRAND}_`);
    } catch (e) {
      return await message.sendReply("_Failed to update group picture_");
    }
  }
);

Module(
  {
    pattern: "setbio ?(.*)",
    fromMe: true,
    desc: "Set bot about/bio",
    usage: ".setbio <text>",
    use: "owner",
  },
  async (message, match) => {
    const bio = match[1];
    if (!bio) return await message.sendReply("_Need bio text_");
    try {
      await message.client.updateProfileStatus(bio);
      await message.sendReply(`*✅ Bio updated:* ${bio}\n_${BRAND}_`);
    } catch {
      return await message.sendReply("_Failed to update bio_");
    }
  }
);

Module(
  {
    pattern: "getdp ?(.*)",
    fromMe: true,
    desc: "Get profile picture of a user",
    usage: ".getdp @user",
    use: "owner",
  },
  async (message) => {
    const jid = message.reply_message?.sender || message.mentions?.[0] || message.sender;
    try {
      const ppUrl = await message.client.profilePictureUrl(jid, "image");
      if (!ppUrl) return await message.sendReply("_No profile picture found_");
      await message.sendMessage({ url: ppUrl }, "image", {
        caption: `*👤 Profile Picture*\n@${jid.split("@")[0]}\n_${BRAND}_`,
        mentions: [jid],
      });
    } catch {
      return await message.sendReply("_Cannot get profile picture_");
    }
  }
);

Module(
  {
    pattern: "listonline ?(.*)",
    fromMe: true,
    desc: "List online contacts",
    usage: ".listonline",
    use: "owner",
  },
  async (message) => {
    try {
      await message.sendReply(`*📡 Checking online status...*\n_This feature requires presence subscription_\n\n_${BRAND}_`);
    } catch {
      return await message.sendReply("_Error checking online status_");
    }
  }
);

Module(
  {
    pattern: "clearchat ?(.*)",
    fromMe: true,
    desc: "Clear chat messages",
    usage: ".clearchat",
    use: "owner",
  },
  async (message) => {
    try {
      await message.client.chatModify({ delete: true, lastMessages: [{ key: message.key, messageTimestamp: message.messageTimestamp }] }, message.jid);
      await message.sendReply(`*✅ Chat cleared*\n_${BRAND}_`);
    } catch {
      return await message.sendReply("_Failed to clear chat_");
    }
  }
);

Module(
  {
    pattern: "archivechat ?(.*)",
    fromMe: true,
    desc: "Archive current chat",
    usage: ".archivechat",
    use: "owner",
  },
  async (message) => {
    try {
      await message.client.chatModify({ archive: true, lastMessages: [{ key: message.key, messageTimestamp: message.messageTimestamp }] }, message.jid);
      await message.sendReply(`*✅ Chat archived*\n_${BRAND}_`);
    } catch {
      return await message.sendReply("_Failed to archive chat_");
    }
  }
);

Module(
  {
    pattern: "unarchivechat ?(.*)",
    fromMe: true,
    desc: "Unarchive current chat",
    usage: ".unarchivechat",
    use: "owner",
  },
  async (message) => {
    try {
      await message.client.chatModify({ archive: false, lastMessages: [{ key: message.key, messageTimestamp: message.messageTimestamp }] }, message.jid);
      await message.sendReply(`*✅ Chat unarchived*\n_${BRAND}_`);
    } catch {
      return await message.sendReply("_Failed to unarchive chat_");
    }
  }
);

Module(
  {
    pattern: "pinchat ?(.*)",
    fromMe: true,
    desc: "Pin current chat",
    usage: ".pinchat",
    use: "owner",
  },
  async (message) => {
    try {
      await message.client.chatModify({ pin: true }, message.jid);
      await message.sendReply(`*📌 Chat pinned*\n_${BRAND}_`);
    } catch {
      return await message.sendReply("_Failed to pin chat_");
    }
  }
);

Module(
  {
    pattern: "unpinchat ?(.*)",
    fromMe: true,
    desc: "Unpin current chat",
    usage: ".unpinchat",
    use: "owner",
  },
  async (message) => {
    try {
      await message.client.chatModify({ pin: false }, message.jid);
      await message.sendReply(`*📌 Chat unpinned*\n_${BRAND}_`);
    } catch {
      return await message.sendReply("_Failed to unpin chat_");
    }
  }
);

Module(
  {
    pattern: "disappear ?(.*)",
    fromMe: true,
    desc: "Set disappearing messages timer",
    usage: ".disappear 7d/24h/90d/off",
    use: "owner",
  },
  async (message, match) => {
    const val = match[1]?.toLowerCase();
    const durations = { "24h": 86400, "7d": 604800, "90d": 7776000, "off": 0 };
    if (!val || !durations.hasOwnProperty(val))
      return await message.sendReply("_Usage: .disappear 24h/7d/90d/off_");
    try {
      await message.client.sendMessage(message.jid, { disappearingMessagesInChat: durations[val] });
      await message.sendReply(`*⏱️ Disappearing messages:* ${val === "off" ? "OFF" : val}\n_${BRAND}_`);
    } catch {
      return await message.sendReply("_Failed to set disappearing messages_");
    }
  }
);

Module(
  {
    pattern: "markread ?(.*)",
    fromMe: true,
    desc: "Mark all messages as read",
    usage: ".markread",
    use: "owner",
  },
  async (message) => {
    try {
      await message.client.readMessages([message.key]);
      await message.sendReply(`*✅ Messages marked as read*\n_${BRAND}_`);
    } catch {
      return await message.sendReply("_Failed to mark as read_");
    }
  }
);

Module(
  {
    pattern: "vcf ?(.*)",
    fromMe: true,
    desc: "Save number as vCard contact",
    usage: ".vcf 923001234567 Name",
    use: "owner",
  },
  async (message, match) => {
    const input = match[1]?.trim();
    if (!input) return await message.sendReply("_Usage: .vcf 923001234567 Name_");
    const parts = input.split(/\s+/);
    const number = parts[0];
    const name = parts.slice(1).join(" ") || "Contact";
    try {
      const vcard =
        `BEGIN:VCARD\nVERSION:3.0\nFN:${name}\n` +
        `TEL;type=CELL;waid=${number}:+${number}\nEND:VCARD`;
      await message.client.sendMessage(message.jid, {
        contacts: { displayName: name, contacts: [{ vcard }] },
      });
    } catch {
      return await message.sendReply("_Failed to create vCard_");
    }
  }
);
