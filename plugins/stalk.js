const { Module } = require("../main");
const config = require("../config");
const axios = require("axios");

const BRAND = "DevilXteam MD";
const isFromMe = config.MODE === "public" ? false : true;

Module(
  {
    pattern: "instastalk ?(.*)",
    fromMe: isFromMe,
    desc: "Stalk Instagram profile",
    usage: ".instastalk <username>",
    use: "stalk",
  },
  async (message, match) => {
    const user = match[1]?.trim();
    if (!user) return await message.sendReply("_Need an Instagram username_");
    try {
      await message.react("📸");
      const { data } = await axios.get(
        `https://apis.davidcyriltech.my.id/stalk/instagram?username=${encodeURIComponent(user)}`,
        { timeout: 15000 }
      );
      if (!data?.result) return await message.sendReply("_Profile not found_");
      const r = data.result;
      let text =
        `*╔══ 📸 INSTAGRAM ══╗*\n` +
        `*┃ 👤 ${r.fullName || r.username}*\n` +
        `*┃ 📝 ${r.bio || "No bio"}*\n` +
        `*┃ 📊 Posts:* ${r.posts || 0}\n` +
        `*┃ 👥 Followers:* ${r.followers || 0}\n` +
        `*┃ 👤 Following:* ${r.following || 0}\n` +
        `*┃ 🔒 Private:* ${r.isPrivate ? "Yes" : "No"}\n` +
        `*┃ ✅ Verified:* ${r.isVerified ? "Yes" : "No"}\n` +
        `*╚══ ${BRAND} ══╝*`;
      if (r.profilePic) {
        await message.sendMessage({ url: r.profilePic }, "image", { caption: text });
      } else {
        await message.sendReply(text);
      }
    } catch {
      return await message.sendReply("_Instagram stalk error_");
    }
  }
);

Module(
  {
    pattern: "gitstalk ?(.*)",
    fromMe: isFromMe,
    desc: "Stalk GitHub profile",
    usage: ".gitstalk <username>",
    use: "stalk",
  },
  async (message, match) => {
    const user = match[1]?.trim();
    if (!user) return await message.sendReply("_Need a GitHub username_");
    try {
      await message.react("🐙");
      const { data } = await axios.get(`https://api.github.com/users/${encodeURIComponent(user)}`, { timeout: 10000 });
      const repos = await axios.get(`https://api.github.com/users/${encodeURIComponent(user)}/repos?sort=stars&per_page=5`, { timeout: 10000 });
      let text =
        `*╔══ 🐙 GITHUB STALK ══╗*\n` +
        `*┃ 👤 ${data.name || data.login}*\n` +
        `*┃ 📝 ${data.bio || "No bio"}*\n` +
        `*┃ 📦 Repos:* ${data.public_repos}\n` +
        `*┃ 📄 Gists:* ${data.public_gists}\n` +
        `*┃ 👥 Followers:* ${data.followers}\n` +
        `*┃ 👤 Following:* ${data.following}\n` +
        `*┃ 🏢 Company:* ${data.company || "N/A"}\n` +
        `*┃ 📍 Location:* ${data.location || "N/A"}\n` +
        `*┃ 📅 Joined:* ${new Date(data.created_at).toLocaleDateString()}\n`;
      if (repos.data?.length) {
        text += `*╠══ ⭐ TOP REPOS ══╣*\n`;
        repos.data.slice(0, 5).forEach((r) => {
          text += `*┃* ${r.name} — ⭐ ${r.stargazers_count}\n`;
        });
      }
      text += `*╚══ ${BRAND} ══╝*`;
      if (data.avatar_url) {
        await message.sendMessage({ url: data.avatar_url }, "image", { caption: text });
      } else {
        await message.sendReply(text);
      }
    } catch {
      return await message.sendReply("_GitHub stalk error_");
    }
  }
);

Module(
  {
    pattern: "npmstalk ?(.*)",
    fromMe: isFromMe,
    desc: "Stalk NPM package info",
    usage: ".npmstalk <package>",
    use: "stalk",
  },
  async (message, match) => {
    const pkg = match[1]?.trim();
    if (!pkg) return await message.sendReply("_Need a package name_");
    try {
      const { data } = await axios.get(`https://registry.npmjs.org/${encodeURIComponent(pkg)}`, { timeout: 10000 });
      const latest = data["dist-tags"]?.latest;
      const ver = data.versions?.[latest];
      await message.sendReply(
        `*╔══ 📦 NPM STALK ══╗*\n` +
        `*┃ 📝 ${data.name}*\n` +
        `*┃ 📌 Latest:* ${latest || "N/A"}\n` +
        `*┃ 📄 ${data.description || "No description"}*\n` +
        `*┃ 👤 Author:* ${data.author?.name || "Unknown"}\n` +
        `*┃ 📜 License:* ${data.license || "N/A"}\n` +
        `*┃ 🔧 Dependencies:* ${ver?.dependencies ? Object.keys(ver.dependencies).length : 0}\n` +
        `*┃ 📅 Modified:* ${new Date(data.time?.modified).toLocaleDateString()}\n` +
        `*┃ 🔗 https://npmjs.com/package/${data.name}*\n` +
        `*╚══ ${BRAND} ══╝*`
      );
    } catch {
      return await message.sendReply("_NPM stalk error_");
    }
  }
);
