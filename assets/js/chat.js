const API_URL = "https://portfolio-1uj6.onrender.com/api/chat";

async function sendMessage() {
    // Təkrar göndərməni bloklayırıq
    if (window.chatBusy) return;
    
    const inputField = document.getElementById("chatInput");
    const message = inputField.value.trim();
    if (!message) return;

    window.chatBusy = true;
    const chatMessages = document.getElementById("chatMessages");

    // İstifadəçinin mesajı
    const userDiv = document.createElement("div");
    userDiv.className = "bg-emerald-500/10 text-emerald-300 p-3 rounded-xl max-w-[85%] ml-auto border border-emerald-500/20";
    userDiv.innerText = message;
    chatMessages.appendChild(userDiv);

    inputField.value = "";
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Yüklənir göstəricisi
    const loadingDiv = document.createElement("div");
    loadingDiv.id = "botLoading";
    loadingDiv.className = "bg-slate-800/60 text-slate-400 p-3 rounded-xl max-w-[85%] border border-slate-700/50 italic text-xs animate-pulse";
    loadingDiv.innerText = "Cavab yazılır...";
    chatMessages.appendChild(loadingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Server soyuqdursa (Render pulsuz plan) 5 saniyədən sonra xəbərdarlıq çıxarırıq
    const wakeTimer = setTimeout(() => {
        const node = document.getElementById("botLoading");
        if (node) node.innerText = "Server oyanır, ilk sorğu 30-60 saniyə çəkə bilsin...";
    }, 5000);

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: message })
        });

        clearTimeout(wakeTimer);

        if (!response.ok) throw new Error("Network response was not ok");

        const data = await response.json();
        
        // Yüklənir mesajını silirik
        if (loadingDiv) loadingDiv.remove();

        // Botun cavabı
        const botDiv = document.createElement("div");
        botDiv.className = "bg-slate-800/60 text-slate-200 p-3 rounded-xl max-w-[85%] border border-slate-700/50";
        botDiv.innerText = data.response;
        chatMessages.appendChild(botDiv);

    } catch (error) {
        clearTimeout(wakeTimer);
        if (loadingDiv) loadingDiv.remove();

        const errorDiv = document.createElement("div");
        errorDiv.className = "bg-red-500/10 text-red-400 p-3 rounded-xl max-w-[85%] border border-red-500/20 text-xs";
        errorDiv.innerText = "Bağlantı xətası baş verdi və ya server cavab vermədi.";
        chatMessages.appendChild(errorDiv);
    } finally {
        window.chatBusy = false;
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}