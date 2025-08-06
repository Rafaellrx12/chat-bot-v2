import { botResponses } from "./mensagens.js";
import qrcode from "qrcode-terminal";
import fetch from "node-fetch"; // Se usar Node >=18 pode remover
import { Client } from "whatsapp-web.js";
import express from "express";
import { Server } from "socket.io";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Controle do bot
let client = null;
let botAtivo = false;

// Cache de produtos
let products = [];

// Controle de interação
const ultimaInteracao = new Map();
const TEMPO_INATIVIDADE = 20 * 60 * 1000;

// ---------------- Funções ----------------
async function loadProductCatalog() {
  try {
    const res = await fetch("http://localhost:3001/products");
    if (!res.ok) throw new Error("Erro ao buscar produtos da API");
    const data = await res.json();
    return data.map((p) => ({
      nome: p.name,
      descricao: p.description,
      preco: p.price,
      link: p.link,
      id: p.id,
    }));
  } catch (error) {
    console.error("Erro ao carregar produtos:", error);
    return [];
  }
}

function formatInitialMessage(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

// ---------------- Bot: Start e Stop ----------------
async function iniciarBot() {
  if (botAtivo) return;

  client = new Client();
  botAtivo = true;

  client.on("qr", (qr) => {
    qrcode.generate(qr, { small: true });
    io.emit(
      "qr",
      `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
        qr
      )}`
    );
    io.emit("status", "Aguardando conexão do WhatsApp...");
  });

  client.on("ready", async () => {
    console.log("🛍️ Bot pronto!");
    products = await loadProductCatalog();

    // Limpa QR do front
    io.emit("qr", "");
    // Envia status para front
    io.emit("status", "✅ WhatsApp conectado com sucesso!");
  });

  client.on("message", async (message) => {
    if (message.from.includes("@g.us")) return;

    const userMessage = formatInitialMessage(message.body);
    const userId = message.from;
    const agora = Date.now();

    const ultimaHora = ultimaInteracao.get(userId);
    const isNovaConversa =
      !ultimaHora || agora - ultimaHora >= TEMPO_INATIVIDADE;

    ultimaInteracao.set(userId, agora);

    if (isNovaConversa) {
      await message.reply(botResponses.boasVindas);
      return;
    }

    if (["menu", "oi", "ola"].includes(userMessage)) {
      await message.reply(botResponses.boasVindas);
    } else if (userMessage === "1") {
      await message.reply(botResponses.listaProdutos(products));
    } else if (userMessage === "2") {
      await message.reply(botResponses.formasPagamento);
    } else if (userMessage === "3") {
      await message.reply(botResponses.ajuda);
    } else {
      const matchedProduct = products.find((p) =>
        userMessage.includes(p.nome.toLowerCase())
      );
      if (matchedProduct) {
        await message.reply(botResponses.detalhesProduto(matchedProduct));
      } else {
        await message.reply(botResponses.naoEntendi);
      }
    }
  });

  client.on("disconnected", () => {
    botAtivo = false;
    client = null;
    io.emit("qr", "");
    io.emit("status", "❌ Bot desconectado do WhatsApp.");
    console.log("Bot desconectado");
  });

  // Timer para encerrar sessão
  setInterval(async () => {
    const agora = Date.now();
    for (const [idContato, ultimaHora] of ultimaInteracao.entries()) {
      if (agora - ultimaHora >= TEMPO_INATIVIDADE) {
        await client.sendMessage(
          idContato,
          "⏰ Sua sessão foi encerrada por inatividade.\n\nDigite *menu* para começar novamente."
        );
        ultimaInteracao.delete(idContato);
      }
    }
  }, 60 * 1000);

  client.initialize();
}

async function pararBot() {
  if (!client) return;
  await client.destroy();
  client = null;
  botAtivo = false;
  io.emit("qr", "");
  io.emit("status", "❌ Bot parado manualmente.");
  console.log("Bot parado manualmente");
}

// ---------------- Rotas HTTP ----------------
app.use(express.static(__dirname));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.post("/bot/start", async (req, res) => {
  await iniciarBot();
  res.json({ status: "Bot iniciado" });
});

app.post("/bot/stop", async (req, res) => {
  await pararBot();
  res.json({ status: "Bot parado" });
});

// ---------------- WebSocket ----------------
io.on("connection", () => {
  console.log("Cliente conectado via WebSocket");
});

// ---------------- Iniciar servidor ----------------
server.listen(3000, () => {
  console.log("Servidor iniciado, acesse http://localhost:3000");
});
