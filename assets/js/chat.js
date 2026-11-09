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

    // 1. İstifadəçinin mesajını göstər
    const userBubble = document.createElement("div");
    userBubble.className = "bg-emerald-500/20 text-emerald-300 p-3 rounded-xl max-w-[85%] ml-auto border border-emerald-500/30 text-right";
    userBubble.innerText = messageText;
    messagesContainer.appendChild(userBubble);

    inputField.value = "";
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // 2. Yüklənir mesajı
    const loadingBubble = document.createElement("div");
    loadingBubble.id = "botLoading";
    loadingBubble.className = "bg-slate-800/60 text-slate-400 p-3 rounded-xl max-w-[85%] border border-slate-700/50 italic";
    loadingBubble.innerText = "RuslanAI düşünür...";
    messagesContainer.appendChild(loadingBubble);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    try {
        const response = await fetch(`${BACKEND_URL}/api/chat`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({ message: messageText })
        });

        const loadingNode = document.getElementById("botLoading");
        if (loadingNode) loadingNode.remove();

        if (!response.ok) {
            throw new Error(`Server status: ${response.status}`);
        }

        const data = await response.json();
        
        // Backend-dən gələn cavabı çıxarırıq (rag.py dict qaytarır: {"answer": "...", ...})
        let answerText = "";
        if (typeof data === "string") {
            answerText = data;
        } else if (typeof data === "object" && data !== null) {
            answerText = data.answer || data.response || data.reply || data.message || JSON.stringify(data);
        }

        const botBubble = document.createElement("div");
        botBubble.className = "bg-slate-800/60 text-slate-200 p-3 rounded-xl max-w-[85%] border border-slate-700/50";
        botBubble.innerText = answerText || "Məlumat tapılmadı.";
        messagesContainer.appendChild(botBubble);

    } catch (error) {
        console.error("Chat Error:", error);
        const loadingNode = document.getElementById("botLoading");
        if (loadingNode) loadingNode.remove();

        const errorBubble = document.createElement("div");
        errorBubble.className = "bg-red-500/20 text-red-300 p-3 rounded-xl max-w-[85%] border border-red-500/30";
        errorBubble.innerText = "Sistem oyanır və ya xəta baş verdi. Zəhmət olmasa bir neçə saniyə sonra yenidən cəhd edin.";
        messagesContainer.appendChild(errorBubble);
    }
    
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}