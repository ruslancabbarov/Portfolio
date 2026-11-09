// Render backend canlı URL ünvanı
const BACKEND_URL = "https://portfolio-1uj6.onrender.com";

function toggleChatbot() {
    const modal = document.getElementById("chatbotModal");
    if (modal) {
        modal.classList.toggle("hidden");
    }
}

async function sendMessage() {
    const inputField = document.getElementById("chatInput");
    const messagesContainer = document.getElementById("chatMessages");
    
    if (!inputField || !messagesContainer) return;
    
    const messageText = inputField.value.trim();
    if (!messageText) return;

    // İstifadəçinin mesajını ekrana əlavə et
    const userBubble = document.createElement("div");
    userBubble.className = "bg-emerald-500/20 text-emerald-300 p-3 rounded-xl max-w-[85%] ml-auto border border-emerald-500/30 text-right";
    userBubble.innerText = messageText;
    messagesContainer.appendChild(userBubble);

    inputField.value = "";
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Yüklənir mesajı
    const loadingBubble = document.createElement("div");
    loadingBubble.id = "botLoading";
    loadingBubble.className = "bg-slate-800/60 text-slate-400 p-3 rounded-xl max-w-[85%] border border-slate-700/50 italic";
    loadingBubble.innerText = "RuslanAI cavab yazır...";
    messagesContainer.appendChild(loadingBubble);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    try {
        const response = await fetch(`${BACKEND_URL}/chat`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ message: messageText })
        });

        const data = await response.json();
        
        // Yüklənir mesajını sil
        const loadingNode = document.getElementById("botLoading");
        if (loadingNode) loadingNode.remove();

        // Botun cavabını ekrana əlavə et
        const botBubble = document.createElement("div");
        botBubble.className = "bg-slate-800/60 text-slate-200 p-3 rounded-xl max-w-[85%] border border-slate-700/50";
        botBubble.innerText = data.response || data.message || "Cavab alına bilmədi.";
        messagesContainer.appendChild(botBubble);

    } catch (error) {
        const loadingNode = document.getElementById("botLoading");
        if (loadingNode) loadingNode.remove();

        const errorBubble = document.createElement("div");
        errorBubble.className = "bg-red-500/20 text-red-300 p-3 rounded-xl max-w-[85%] border border-red-500/30";
        errorBubble.innerText = "Xəta baş verdi. Xahiş edirik backend bağlantısını yoxlayın.";
        messagesContainer.appendChild(errorBubble);
    }
    
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}