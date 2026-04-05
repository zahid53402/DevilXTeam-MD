/**
 * DevilXteam MD — Auto Rebrand Module (Ultra)
 * =============================================
 * Yeh file automatically "Raganork/Ragnarok" ko "DevilXteam MD" se replace karti hai
 * — console logs, stdout, WhatsApp messages, sent messages edit, sab jagah.
 *
 * Usage: index.js ki PEHLI line mein add karo:
 *   require("./auto-rebrand");
 *
 * BotManager ke baad add karo:
 *   global.__dxBotManager = botManager;
 *
 * Environment variable (optional):
 *   BOT_NAME=DevilXteam MD
 */

const BOT_NAME = process.env.BOT_NAME || "DevilXteam MD";

const _brandPatterns = [
  /[Rr]agan[oó]rk\s*-?\s*[Mm][Dd]/gi,
  /[Rr]agan[oó]rk\s*[Bb]ot/gi,
  /[Rr]agan[oó]rk/gi,
  /[Rr]agnarok\s*-?\s*[Mm][Dd]/gi,
  /[Rr]agnarok\s*[Bb]ot/gi,
  /[Rr]agnarok/gi,
  /RAGANORK\s*-?\s*MD/g,
  /RAGANORK/g,
  /RAGNAROK\s*-?\s*MD/g,
  /RAGNAROK/g,
];

function _patchStr(a) {
  if (typeof a !== "string") return a;
  let r = a;
  for (const re of _brandPatterns) {
    re.lastIndex = 0;
    r = r.replace(re, BOT_NAME);
  }
  return r;
}

function _hasRag(s) {
  if (typeof s !== "string") return false;
  for (const re of _brandPatterns) {
    re.lastIndex = 0;
    if (re.test(s)) return true;
  }
  return false;
}

const _origLog = console.log.bind(console);
const _origErr = console.error.bind(console);
const _origWarn = console.warn.bind(console);
const _origInfo = console.info.bind(console);
console.log = function (...args) { _origLog(...args.map(_patchStr)); };
console.error = function (...args) { _origErr(...args.map(_patchStr)); };
console.warn = function (...args) { _origWarn(...args.map(_patchStr)); };
console.info = function (...args) { _origInfo(...args.map(_patchStr)); };

const _origStdoutWrite = process.stdout.write.bind(process.stdout);
process.stdout.write = function (chunk, ...rest) {
  if (typeof chunk === "string") chunk = _patchStr(chunk);
  return _origStdoutWrite(chunk, ...rest);
};

const _origFromCodePoint = String.fromCodePoint;
String.fromCodePoint = function (...args) {
  return _patchStr(_origFromCodePoint.apply(String, args));
};

const patchBaileysSocket = (socket) => {
  if (!socket || socket.__dxRebrand) return socket;
  socket.__dxRebrand = true;

  if (socket.sendMessage) {
    const origSend = socket.sendMessage.bind(socket);
    socket.sendMessage = async function (jid, content, ...rest) {
      if (content) {
        if (typeof content.text === "string") content.text = _patchStr(content.text);
        if (typeof content.caption === "string") content.caption = _patchStr(content.caption);
        if (content.buttons) {
          for (const b of content.buttons) {
            if (b.buttonText?.displayText) b.buttonText.displayText = _patchStr(b.buttonText.displayText);
          }
        }
        if (typeof content.footer === "string") content.footer = _patchStr(content.footer);
        if (typeof content.title === "string") content.title = _patchStr(content.title);
      }
      return origSend(jid, content, ...rest);
    };
  }

  if (socket.relayMessage) {
    const origRelay = socket.relayMessage.bind(socket);
    socket.relayMessage = async function (jid, message, ...rest) {
      if (message) {
        const deepPatch = (obj, d) => {
          if (!obj || d > 8) return;
          for (const k of Object.keys(obj)) {
            if (typeof obj[k] === "string") obj[k] = _patchStr(obj[k]);
            else if (typeof obj[k] === "object") deepPatch(obj[k], d + 1);
          }
        };
        deepPatch(message, 0);
      }
      return origRelay(jid, message, ...rest);
    };
  }

  if (socket.ev) {
    socket.ev.on("messages.upsert", async (m) => {
      try {
        if (!m?.messages) return;
        for (const msg of m.messages) {
          if (!msg.key?.fromMe) continue;
          const txt = msg.message?.conversation
            || msg.message?.extendedTextMessage?.text
            || msg.message?.imageMessage?.caption
            || "";
          if (_hasRag(txt)) {
            const patched = _patchStr(txt);
            try {
              await socket.sendMessage(msg.key.remoteJid, {
                text: patched,
                edit: msg.key,
              });
            } catch {}
          }
        }
      } catch {}
    });
  }

  return socket;
};

const patchBotManager = () => {
  if (!global.__dxBotManager) return;
  const mgr = global.__dxBotManager;
  if (mgr.sessions) {
    for (const [, sess] of Object.entries(mgr.sessions)) {
      if (sess?.client) patchBaileysSocket(sess.client);
    }
  }
  if (mgr.bots) {
    for (const [, bot] of Object.entries(mgr.bots)) {
      if (bot?.sock) patchBaileysSocket(bot.sock);
      if (bot?.client) patchBaileysSocket(bot.client);
    }
  }
};

setInterval(patchBotManager, 2000);

console.log(`[auto-rebrand] ${BOT_NAME} branding active (ultra mode)`);
