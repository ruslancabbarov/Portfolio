// Lokalda localhost-a, canlıda Render linkinə qoşulur
const IS_LOCAL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

const API_URL = IS_LOCAL
  ? "http://127.0.0.1:8000/api/chat"
  : "https://portfolio-1uj6.onrender.com/api/chat";

function toggleChatbot() {
  const modal = document.getElementById("chatModal");
  modal.classList.toggle("hidden");
  if (!modal.classList.contains("hidden")) {
    document.getElementById("chatInput").focus();
  }
}

function sendQuickPrompt(text) {
  document.getElementById("chatInput").value = text;
  handleUserSubmit(new Event("submit"));
}

async function handleUserSubmit(e) {
  e.preventDefault();
  const input = document.getElementById("chatInput");
  const text = input.value.trim();
  if (!text) return;

  renderChatMessage(text, "user");
  input.value = "";
  const typingId = renderTypingIndicator();

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text }),
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    removeTypingIndicator(typingId);
    renderChatMessage(data.answer, "assistant", data.sources);
  } catch (err) {
    removeTypingIndicator(typingId);
    renderChatMessage(
      "Server hazırda cavab vermir (ilk sorğuda 30-60 saniyə çəkə bilər). Bir az sonra yenidən cəhd et.",
      "assistant"
    );
    console.error(err);
  }
}

function renderChatMessage(text, role, sources = []) {
  const container = document.getElementById("chatContainer");
  const row = document.createElement("div");
  row.className = "flex gap-2 " + (role === "user" ? "justify-end" : "");

  if (role === "user") {
    row.innerHTML = `
      <div class="bg-gradient-to-r from-emerald-500 to-cyan-500 text-navy-900 font-medium p-3 rounded-2xl rounded-tr-none leading-relaxed max-w-[85%]">
        ${escapeHtml(text)}
      </div>`;
  } else {
    const src = sources.length
      ? `<div class="text-[9px] font-mono text-emerald-400/80 pt-1 border-t border-slate-700/50">Source: ${sources.map(escapeHtml).join(", ")}</div>`
      : "";
    row.innerHTML = `
      <div class="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 text-xs">
        <i class="fa-solid fa-bot"></i>
      </div>
      <div class="bg-slate-800/90 border border-slate-700/60 p-3 rounded-2xl rounded-tl-none text-slate-200 leading-relaxed space-y-1.5 max-w-[85%]">
        ${escapeHtml(text).replace(/\n/g, "<br/>")}
        ${src}
      </div>`;
  }
  container.appendChild(row);
  container.scrollTop = container.scrollHeight;
}

function renderTypingIndicator() {
  const container = document.getElementById("chatContainer");
  const id = "typing_" + Date.now();
  const div = document.createElement("div");
  div.id = id;
  div.className = "flex gap-2";
  div.innerHTML = `
    <div class="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 text-xs">
      <i class="fa-solid fa-bot"></i>
    </div>
    <div class="bg-slate-800/90 border border-slate-700/60 px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-1.5">
      <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 typing-dot"></span>
      <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 typing-dot"></span>
      <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 typing-dot"></span>
    </div>`;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
  return id;
}

function removeTypingIndicator(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}