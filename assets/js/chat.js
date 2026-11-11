const BACKEND_URL = "https://portfolio-1uj6.onrender.com";

function addBubble(text, type) {
    const box = document.getElementById("chatMessages");
    const div = document.createElement("div");
    const styles = {
        user: "bg-emerald-500/20 text-emerald-300 p-3 rounded-xl max-w-[85%] ml-auto border border-emerald-500/30 text-right",
        bot: "bg-slate-800/60 text-slate-200 p-3 rounded-xl max-w-[85%] border border-slate-700/50",
        loading: "bg-slate-800/60 text-slate-400 p-3 rounded-xl max-w-[85%] border border-slate-700/50 italic",
        error: "bg-red-500/10 text-red-400 p-3 rounded-xl max-w-[85%] border border-red-500/20 text-xs"
    };
    div.className = styles[type];
    div.innerText = text;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
    return div;
}

let chatBusy = false;

async function sendMessage() {
    if (chatBusy) return;
    const input = document.getElementById("chatInput");
    const text = input.value.trim();
    if (!text) return;

    addBubble(text, "user");
    input.value = "";
    chatBusy = true;

    const loading = addBubble("RuslanAI düşünür...", "loading");
    const wakeTimer = setTimeout(() => {
        loading.innerText = "Server oyanır, 30-60 saniyə çəkə bilər...";
    }, 5000);

    try {
        const response = await fetch(`${BACKEND_URL}/api/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: text })
        });

        if (!response.ok) {
            throw new Error("HTTP " + response.status);
        }

        const data = await response.json();
        loading.remove();
        addBubble(data.answer || "Məlumat tapılmadı.", "bot");
    } catch (error) {
        console.error("Chat error:", error);
        loading.remove();
        addBubble(
            "Xəta: " + error.message +
            " (F12 → Console-da ətraflı məlumat var)",
            "error"
        );
    } finally {
        clearTimeout(wakeTimer);
        chatBusy = false;
    }
}