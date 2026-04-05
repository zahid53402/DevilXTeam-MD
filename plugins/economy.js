const { Module } = require("../main");
const config = require("../config");

const BRAND = "DevilXteam MD";
const isFromMe = config.MODE === "public" ? false : true;

if (!global.economy) global.economy = {};

function getBalance(jid) {
  if (!global.economy[jid]) global.economy[jid] = { balance: 1000, bank: 0, lastDaily: 0, lastWork: 0, lastRob: 0, inventory: [] };
  return global.economy[jid];
}

Module(
  {
    pattern: "balance ?(.*)",
    fromMe: isFromMe,
    desc: "Check your wallet balance",
    usage: ".balance",
    use: "economy",
  },
  async (message) => {
    const acc = getBalance(message.sender);
    await message.sendReply(
      `*╔══ 💰 WALLET ══╗*\n` +
      `*┃ 👛 Cash:* ${acc.balance} coins\n` +
      `*┃ 🏦 Bank:* ${acc.bank} coins\n` +
      `*┃ 💎 Total:* ${acc.balance + acc.bank} coins\n` +
      `*╚══ ${BRAND} ══╝*`
    );
  }
);

Module(
  {
    pattern: "daily ?(.*)",
    fromMe: isFromMe,
    desc: "Claim daily reward coins",
    usage: ".daily",
    use: "economy",
  },
  async (message) => {
    const acc = getBalance(message.sender);
    const now = Date.now();
    const cooldown = 24 * 60 * 60 * 1000;
    if (now - acc.lastDaily < cooldown) {
      const remaining = cooldown - (now - acc.lastDaily);
      const h = Math.floor(remaining / 3600000);
      const m = Math.floor((remaining % 3600000) / 60000);
      return await message.sendReply(`_Come back in ${h}h ${m}m for your daily reward_`);
    }
    const reward = Math.floor(Math.random() * 500) + 500;
    acc.balance += reward;
    acc.lastDaily = now;
    await message.sendReply(`*🎁 Daily Reward:* +${reward} coins!\n*Balance:* ${acc.balance}\n\n_${BRAND}_`);
  }
);

Module(
  {
    pattern: "work ?(.*)",
    fromMe: isFromMe,
    desc: "Work to earn coins",
    usage: ".work",
    use: "economy",
  },
  async (message) => {
    const acc = getBalance(message.sender);
    const now = Date.now();
    const cooldown = 30 * 60 * 1000;
    if (now - acc.lastWork < cooldown) {
      const remaining = cooldown - (now - acc.lastWork);
      const m = Math.floor(remaining / 60000);
      return await message.sendReply(`_You can work again in ${m} minutes_`);
    }
    const jobs = [
      { job: "Developer", pay: [200, 500] },
      { job: "Doctor", pay: [300, 600] },
      { job: "Teacher", pay: [100, 300] },
      { job: "Chef", pay: [150, 400] },
      { job: "Driver", pay: [100, 250] },
      { job: "YouTuber", pay: [50, 800] },
      { job: "Hacker", pay: [200, 700] },
      { job: "Artist", pay: [100, 350] },
    ];
    const j = jobs[Math.floor(Math.random() * jobs.length)];
    const earned = Math.floor(Math.random() * (j.pay[1] - j.pay[0])) + j.pay[0];
    acc.balance += earned;
    acc.lastWork = now;
    await message.sendReply(
      `*💼 You worked as a ${j.job}*\n*💰 Earned:* +${earned} coins\n*Balance:* ${acc.balance}\n\n_${BRAND}_`
    );
  }
);

Module(
  {
    pattern: "deposit ?(.*)",
    fromMe: isFromMe,
    desc: "Deposit coins to bank",
    usage: ".deposit <amount/all>",
    use: "economy",
  },
  async (message, match) => {
    const acc = getBalance(message.sender);
    let amount = match[1]?.toLowerCase() === "all" ? acc.balance : parseInt(match[1]);
    if (!amount || amount <= 0) return await message.sendReply("_Usage: .deposit <amount/all>_");
    if (amount > acc.balance) return await message.sendReply("_Not enough cash_");
    acc.balance -= amount;
    acc.bank += amount;
    await message.sendReply(`*🏦 Deposited:* ${amount} coins\n*Bank:* ${acc.bank}\n\n_${BRAND}_`);
  }
);

Module(
  {
    pattern: "withdraw ?(.*)",
    fromMe: isFromMe,
    desc: "Withdraw coins from bank",
    usage: ".withdraw <amount/all>",
    use: "economy",
  },
  async (message, match) => {
    const acc = getBalance(message.sender);
    let amount = match[1]?.toLowerCase() === "all" ? acc.bank : parseInt(match[1]);
    if (!amount || amount <= 0) return await message.sendReply("_Usage: .withdraw <amount/all>_");
    if (amount > acc.bank) return await message.sendReply("_Not enough in bank_");
    acc.bank -= amount;
    acc.balance += amount;
    await message.sendReply(`*🏦 Withdrawn:* ${amount} coins\n*Cash:* ${acc.balance}\n\n_${BRAND}_`);
  }
);

Module(
  {
    pattern: "rob ?(.*)",
    fromMe: isFromMe,
    desc: "Try to rob another user",
    usage: ".rob @user",
    use: "economy",
  },
  async (message) => {
    if (!message.isGroup) return await message.sendReply("_Group only command_");
    const target = message.mentions?.[0] || message.reply_message?.sender;
    if (!target) return await message.sendReply("_Mention or reply to someone to rob_");
    if (target === message.sender) return await message.sendReply("_You can't rob yourself!_");

    const acc = getBalance(message.sender);
    const now = Date.now();
    if (now - acc.lastRob < 3600000) {
      const m = Math.floor((3600000 - (now - acc.lastRob)) / 60000);
      return await message.sendReply(`_Wait ${m} minutes before robbing again_`);
    }

    const targetAcc = getBalance(target);
    acc.lastRob = now;

    if (Math.random() < 0.4) {
      const stolen = Math.min(Math.floor(Math.random() * 300) + 50, targetAcc.balance);
      if (stolen <= 0) return await message.sendReply("_Target has no money to rob!_");
      targetAcc.balance -= stolen;
      acc.balance += stolen;
      await message.send(
        `*🔫 Robbery Successful!*\nYou stole *${stolen}* coins from @${target.split("@")[0]}!\n\n_${BRAND}_`,
        "text", { mentions: [target] }
      );
    } else {
      const fine = Math.floor(Math.random() * 200) + 50;
      acc.balance = Math.max(0, acc.balance - fine);
      await message.sendReply(`*🚔 Caught!* You got fined *${fine}* coins!\n\n_${BRAND}_`);
    }
  }
);

Module(
  {
    pattern: "gamble ?(.*)",
    fromMe: isFromMe,
    desc: "Gamble your coins",
    usage: ".gamble <amount>",
    use: "economy",
  },
  async (message, match) => {
    const acc = getBalance(message.sender);
    const amount = parseInt(match[1]);
    if (!amount || amount <= 0) return await message.sendReply("_Usage: .gamble <amount>_");
    if (amount > acc.balance) return await message.sendReply("_Not enough coins_");
    if (Math.random() < 0.45) {
      acc.balance += amount;
      await message.sendReply(`*🎰 You won!* +${amount} coins!\n*Balance:* ${acc.balance}\n\n_${BRAND}_`);
    } else {
      acc.balance -= amount;
      await message.sendReply(`*🎰 You lost!* -${amount} coins!\n*Balance:* ${acc.balance}\n\n_${BRAND}_`);
    }
  }
);

Module(
  {
    pattern: "slots ?(.*)",
    fromMe: isFromMe,
    desc: "Play slot machine",
    usage: ".slots <bet>",
    use: "economy",
  },
  async (message, match) => {
    const acc = getBalance(message.sender);
    const bet = parseInt(match[1]) || 100;
    if (bet > acc.balance) return await message.sendReply("_Not enough coins_");
    const symbols = ["🍒", "🍋", "🍊", "🍇", "💎", "7️⃣", "🔔"];
    const s1 = symbols[Math.floor(Math.random() * symbols.length)];
    const s2 = symbols[Math.floor(Math.random() * symbols.length)];
    const s3 = symbols[Math.floor(Math.random() * symbols.length)];
    let result, winAmount;
    if (s1 === s2 && s2 === s3) {
      winAmount = bet * 5;
      acc.balance += winAmount;
      result = `*JACKPOT! 🎉* +${winAmount} coins!`;
    } else if (s1 === s2 || s2 === s3 || s1 === s3) {
      winAmount = bet;
      acc.balance += winAmount;
      result = `*Match! 🎊* +${winAmount} coins!`;
    } else {
      acc.balance -= bet;
      result = `*No match! 😞* -${bet} coins`;
    }
    await message.sendReply(
      `*🎰 SLOTS 🎰*\n\n` +
      `┃ ${s1} ┃ ${s2} ┃ ${s3} ┃\n\n` +
      `${result}\n*Balance:* ${acc.balance}\n\n_${BRAND}_`
    );
  }
);

Module(
  {
    pattern: "coinflip ?(.*)",
    fromMe: isFromMe,
    desc: "Flip a coin and bet",
    usage: ".coinflip heads/tails <amount>",
    use: "economy",
  },
  async (message, match) => {
    const input = match[1]?.trim()?.split(/\s+/);
    if (!input || input.length < 2) return await message.sendReply("_Usage: .coinflip heads 100_");
    const choice = input[0].toLowerCase();
    const bet = parseInt(input[1]);
    if (!["heads", "tails"].includes(choice)) return await message.sendReply("_Choose heads or tails_");
    if (!bet || bet <= 0) return await message.sendReply("_Invalid bet amount_");
    const acc = getBalance(message.sender);
    if (bet > acc.balance) return await message.sendReply("_Not enough coins_");
    const result = Math.random() < 0.5 ? "heads" : "tails";
    const emoji = result === "heads" ? "🪙" : "💫";
    if (result === choice) {
      acc.balance += bet;
      await message.sendReply(`${emoji} *${result.toUpperCase()}!*\n*You won* +${bet} coins!\n*Balance:* ${acc.balance}\n\n_${BRAND}_`);
    } else {
      acc.balance -= bet;
      await message.sendReply(`${emoji} *${result.toUpperCase()}!*\n*You lost* -${bet} coins!\n*Balance:* ${acc.balance}\n\n_${BRAND}_`);
    }
  }
);

Module(
  {
    pattern: "leaderboard ?(.*)",
    fromMe: isFromMe,
    desc: "Show richest users",
    usage: ".leaderboard",
    use: "economy",
  },
  async (message) => {
    const entries = Object.entries(global.economy);
    if (!entries.length) return await message.sendReply("_No economy data yet_");
    const sorted = entries
      .map(([jid, acc]) => ({ jid, total: acc.balance + acc.bank }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
    const medals = ["🥇", "🥈", "🥉"];
    let text = `*╔══ 🏆 LEADERBOARD ══╗*\n\n`;
    sorted.forEach((e, i) => {
      const medal = medals[i] || `${i + 1}.`;
      text += `*${medal}* @${e.jid.split("@")[0]} — *${e.total}* coins\n`;
    });
    text += `\n*╚══ ${BRAND} ══╝*`;
    await message.send(text, "text", { mentions: sorted.map((e) => e.jid) });
  }
);

Module(
  {
    pattern: "pay ?(.*)",
    fromMe: isFromMe,
    desc: "Transfer coins to another user",
    usage: ".pay @user <amount>",
    use: "economy",
  },
  async (message, match) => {
    const target = message.mentions?.[0] || message.reply_message?.sender;
    if (!target) return await message.sendReply("_Mention someone to pay_");
    if (target === message.sender) return await message.sendReply("_Can't pay yourself!_");
    const amount = parseInt(match[1]?.replace(/\D/g, ""));
    if (!amount || amount <= 0) return await message.sendReply("_Invalid amount_");
    const acc = getBalance(message.sender);
    if (amount > acc.balance) return await message.sendReply("_Not enough coins_");
    const targetAcc = getBalance(target);
    acc.balance -= amount;
    targetAcc.balance += amount;
    await message.send(
      `*💸 Transfer Successful!*\n*Sent:* ${amount} coins to @${target.split("@")[0]}\n*Your Balance:* ${acc.balance}\n\n_${BRAND}_`,
      "text", { mentions: [target] }
    );
  }
);

Module(
  {
    pattern: "dice ?(.*)",
    fromMe: isFromMe,
    desc: "Roll dice and bet on number",
    usage: ".dice <number 1-6> <bet>",
    use: "economy",
  },
  async (message, match) => {
    const input = match[1]?.trim()?.split(/\s+/);
    if (!input || input.length < 2) return await message.sendReply("_Usage: .dice 4 100_");
    const guess = parseInt(input[0]);
    const bet = parseInt(input[1]);
    if (guess < 1 || guess > 6) return await message.sendReply("_Pick a number between 1-6_");
    if (!bet || bet <= 0) return await message.sendReply("_Invalid bet_");
    const acc = getBalance(message.sender);
    if (bet > acc.balance) return await message.sendReply("_Not enough coins_");
    const roll = Math.floor(Math.random() * 6) + 1;
    const diceEmojis = ["", "⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
    if (roll === guess) {
      const winAmount = bet * 5;
      acc.balance += winAmount;
      await message.sendReply(`${diceEmojis[roll]} *Rolled: ${roll}*\n*You guessed right!* +${winAmount} coins!\n*Balance:* ${acc.balance}\n\n_${BRAND}_`);
    } else {
      acc.balance -= bet;
      await message.sendReply(`${diceEmojis[roll]} *Rolled: ${roll}*\n*Wrong guess!* -${bet} coins\n*Balance:* ${acc.balance}\n\n_${BRAND}_`);
    }
  }
);
