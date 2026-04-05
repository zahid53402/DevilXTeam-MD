require("./auto-rebrand");
const path = require("path");
const fs = require("fs");

process.on("uncaughtException", (err) => {
  console.error("[Bot CRASH] Uncaught exception:", err.message);
  console.error(err.stack);
});
process.on("unhandledRejection", (reason) => {
  console.error("[Bot CRASH] Unhandled rejection:", reason);
});

if (fs.existsSync("./config.env")) {
  require("dotenv").config({ path: "./config.env" });
}

const sessionUrl = process.env.SESSION_URL || "";
if (sessionUrl) {
  try {
    const axios = require("axios");
    const origGet = axios.get.bind(axios);
    axios.get = function(url, ...args) {
      if (typeof url === "string" && url.includes("raganork.site/api/fetch-session")) {
        const idMatch = url.match(/[?&]id=([^&]+)/);
        if (idMatch) {
          const newUrl = `${sessionUrl.replace(/\/$/, "")}/api/fetch-session?id=${idMatch[1]}`;
          console.log(`  → Redirecting session fetch to: ${newUrl}`);
          return origGet(newUrl, ...args);
        }
      }
      return origGet(url, ...args);
    };
    console.log("- Session URL redirect active:", sessionUrl);
  } catch (e) {
    console.log("- Axios interceptor skip:", e.message);
  }
}

try {
  const { CustomAuthState } = require("./core/auth");
  const origLoadSession = CustomAuthState.prototype.loadSession;
  CustomAuthState.prototype.loadSession = async function() {
    await origLoadSession.call(this);

    if (!this.sessionData.creds || Object.keys(this.sessionData.creds).length === 0) {
      console.log(`- [${this.sessionId}] Auth state empty after fetch, loading from memory/database...`);
      try {
        let credsData = null;

        if (global.__dkmlSessionCreds) {
          const memKeys = [this.sessionId, "creds"];
          for (const mk of memKeys) {
            if (global.__dkmlSessionCreds[mk]) {
              credsData = global.__dkmlSessionCreds[mk];
              console.log(`  ✓ Found creds in memory for key: ${mk} (${Object.keys(credsData).length} keys)`);
              break;
            }
          }
        }

        if (!credsData) {
          console.log(`  ? Memory miss, trying database...`);
          try {
            const { WhatsappSession } = require("./core/database");
            const allRows = await WhatsappSession.findAll({
              attributes: ['sessionId', 'sessionData'],
              raw: true
            });
            console.log(`  ? DB has ${allRows.length} total rows`);
            const keysToTry = [`creds-${this.sessionId}`, `${this.sessionId}-creds`, "creds"];
            for (const key of keysToTry) {
              const match = allRows.find(r => r.sessionId === key);
              if (match && match.sessionData) {
                let rawData = match.sessionData;
                if (typeof rawData === "string") {
                  try { rawData = JSON.parse(rawData); } catch {}
                }
                if (rawData && typeof rawData === "object" && Object.keys(rawData).length > 0) {
                  credsData = rawData;
                  console.log(`  ✓ Found creds in DB via findAll for key: ${key} (${Object.keys(credsData).length} keys)`);
                  break;
                }
              }
            }
          } catch (dbErr2) {
            console.log(`  ? DB fallback error: ${dbErr2.message}`);
          }
        }

        if (credsData) {
          const baileys = require("baileys");
          const revived = JSON.parse(JSON.stringify(credsData), baileys.BufferJSON.reviver);
          this.sessionData.creds = revived;
          this.sessionData.dirty = true;
          console.log(`  ✓ Session ${this.sessionId} loaded (${Object.keys(revived).length} keys, registered=${revived.registered})`);
        } else {
          console.log(`  ✗ No creds found for ${this.sessionId}`);
        }
      } catch (dbErr) {
        console.error(`  ✗ Load error for ${this.sessionId}:`, dbErr.message);
      }
    }
  };
  console.log("- Auth loadSession patch active");
} catch (e) {
  console.log("- Auth patch skip:", e.message);
}

try {
  const baileys = require("baileys");
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
  function _brandStr(s) {
    if (typeof s !== "string") return s;
    let r = s;
    for (const re of _brandPatterns) {
      re.lastIndex = 0;
      r = r.replace(re, "DevilXteam MD");
    }
    return r;
  }
  function _brandDeep(obj, depth) {
    if (!obj || depth > 10) return obj;
    if (typeof obj === "string") return _brandStr(obj);
    if (Buffer.isBuffer(obj)) {
      try {
        const s = obj.toString("utf8");
        const patched = _brandStr(s);
        if (patched !== s) return Buffer.from(patched, "utf8");
      } catch(e) {}
      return obj;
    }
    if (Array.isArray(obj)) {
      for (let i = 0; i < obj.length; i++) obj[i] = _brandDeep(obj[i], depth+1);
      return obj;
    }
    if (typeof obj === "object") {
      const skip = new Set(["key","private","public","ciphertext","signature","signedPreKey","registrationId"]);
      for (const k of Object.keys(obj)) {
        if (skip.has(k)) continue;
        try { obj[k] = _brandDeep(obj[k], depth+1); } catch {}
      }
    }
    return obj;
  }
  const wrapSendMessage = (sock) => {
    if (!sock || !sock.sendMessage) return sock;
    if (sock.__dxBranded) return sock;
    sock.__dxBranded = true;
    const origSend = sock.sendMessage.bind(sock);
    sock.sendMessage = async function(jid, content, ...args) {
      if (content) _brandDeep(content, 0);
      if (args[0] && typeof args[0] === "object") _brandDeep(args[0], 0);
      return origSend(jid, content, ...args);
    };
    if (sock.relayMessage) {
      const origRelay = sock.relayMessage.bind(sock);
      sock.relayMessage = async function(jid, message, ...args) {
        if (message) _brandDeep(message, 0);
        return origRelay(jid, message, ...args);
      };
    }
    if (sock.sendPresenceUpdate) {
      const origPresence = sock.sendPresenceUpdate.bind(sock);
      sock.sendPresenceUpdate = async function(type, jid) {
        return origPresence(type, jid);
      };
    }
    return sock;
  };
  if (baileys.makeWASocket) {
    const orig = baileys.makeWASocket;
    baileys.makeWASocket = function(...args) {
      const sock = orig(...args);
      return wrapSendMessage(sock);
    };
  }
  if (baileys.default && typeof baileys.default === "function") {
    const origDef = baileys.default;
    baileys.default = function(...args) {
      const sock = origDef(...args);
      return wrapSendMessage(sock);
    };
  }
  const origProto = Object.getPrototypeOf || (() => null);
  const _origBuffer = Buffer.from;
  const _bufferBrand = function(...args) {
    const buf = _origBuffer.apply(Buffer, args);
    if (args[0] && typeof args[0] === "string") {
      const patched = _brandStr(args[0]);
      if (patched !== args[0]) return _origBuffer.call(Buffer, patched, args[1] || "utf8");
    }
    return buf;
  };
  console.log("- Message branding patch active (ultra-deep)");
} catch(e) {
  console.log("- Branding patch skip:", e.message);
}

let suppressLibsignalLogs, initializeDatabase, BotManager, config, SESSION, logger, ensureTempDir, TEMP_DIR, initializeKickBot, cleanupKickBot;
try {
  ({ suppressLibsignalLogs } = require("./core/helpers"));
  suppressLibsignalLogs();
  ({ initializeDatabase } = require("./core/database"));
  ({ BotManager } = require("./core/manager"));
  config = require("./config");
  ({ SESSION, logger } = config);
  ({
    ensureTempDir,
    TEMP_DIR,
    initializeKickBot,
    cleanupKickBot,
  } = require("./core/helpers"));
  console.log("- All core modules loaded successfully");
} catch (modErr) {
  console.error("FATAL: Failed to load core modules:", modErr.message);
  console.error(modErr.stack);
  process.exit(1);
}
const http = require("http");

async function main() {
  ensureTempDir();
  logger.info(`Created temporary directory at ${TEMP_DIR}`);
  console.log(`DevilXteam MD v${require("./package.json").version}`);
  console.log(`- Configured sessions: ${SESSION.join(", ")}`);
  logger.info(`Configured sessions: ${SESSION.join(", ")}`);
  if (SESSION.length === 0) {
    const warnMsg =
      "⚠️ No sessions configured. Please set SESSION environment variable.";
    console.warn(warnMsg);
    logger.warn(warnMsg);
    return;
  }

  try {
    const { preloadDKMLSessions } = require("./core/session-loader");
    await preloadDKMLSessions();
  } catch (err) {
    console.log("Session pre-loader:", err.message);
  }

  try {
    await initializeDatabase();
    console.log("- Database initialized");
    logger.info("Database initialized successfully.");

    // Debug: dump session keys in database
    try {
      const { WhatsappSession } = require("./core/database");
      const allSessions = await WhatsappSession.findAll({ attributes: ['sessionId'] });
      const keys = allSessions.map(s => s.sessionId);
      console.log(`- DB session keys (${keys.length}):`, keys.join(', '));
    } catch (dbgErr) {
      console.log("- DB debug error:", dbgErr.message);
    }
  } catch (dbError) {
    console.error(
      "🚫 Failed to initialize database or load configuration. Bot cannot start.",
      dbError
    );
    logger.fatal(
      "🚫 Failed to initialize database or load configuration. Bot cannot start.",
      dbError
    );
    process.exit(1);
  }

  const botManager = new BotManager();
  global.__dxBotManager = botManager;

  const shutdownHandler = async (signal) => {
    console.log(`\nReceived ${signal}, shutting down...`);
    logger.info(`Received ${signal}, shutting down...`);
    cleanupKickBot();
    await botManager.shutdown();
    process.exit(0);
  };

  process.on("SIGINT", () => shutdownHandler("SIGINT"));
  process.on("SIGTERM", () => shutdownHandler("SIGTERM"));

  await botManager.initializeBots();
  console.log("- Bot initialization complete.");
  logger.info("Bot initialization complete");

  const sendDeployMessage = async () => {
    try {
      const sudoNumbers = (config.SUDO || "").split(",").map(n => n.trim()).filter(Boolean);
      if (sudoNumbers.length === 0) return;

      await new Promise(resolve => setTimeout(resolve, 10000));

      for (const [sessionId, bot] of botManager.bots.entries()) {
        if (bot.sock) {
          for (const num of sudoNumbers) {
            const jid = num.includes("@") ? num : `${num}@s.whatsapp.net`;
            try {
              await bot.sock.sendMessage(jid, {
                text: `✅ *DevilXteam MD Bot Successfully Deployed!*\n\n_Bot is now online and ready._\n\nType *.menu* to get started.`
              });
              logger.info(`Deploy success message sent to ${num}`);
            } catch (err) {
              logger.error(`Failed to send deploy message to ${num}: ${err.message}`);
            }
          }
        }
      }
    } catch (err) {
      logger.error("Deploy message error:", err.message);
    }
  };

  sendDeployMessage();

  initializeKickBot();

  const startServer = () => {
    const PORT = process.env.PORT || 3000;

    const server = http.createServer((req, res) => {
      if (req.url === "/health") {
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end("OK");
      } else {
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end("DevilXteam MD Bot is running!");
      }
    });

    server.listen(PORT, () => {
      logger.info(`Web server listening on port ${PORT}`);
    });
  };

  if (process.env.USE_SERVER !== "false") startServer();
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`Fatal error in main execution: ${error.message}`, error);
    logger.fatal({ err: error }, `Fatal error in main execution`);
    process.exit(1);
  });
}
