import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, doc, getDocs, limit } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 🔑 REPLACE THIS WITH YOUR FIREBASE CONFIG
const firebaseConfig = {
    apiKey: "AIzaSyCGmrNuFCoYgUEQhtz_vLP2jDcz5RyAiyI",
  authDomain: "sigmaai-f094d.firebaseapp.com",
  projectId: "sigmaai-f094d",
  storageBucket: "sigmaai-f094d.firebasestorage.app",
  messagingSenderId: "779092130725",
  appId: "1:779092130725:web:e1cf32481a63e7b1db064c"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 🛠️ GLOBALS
let currentSessionId = localStorage.getItem('activeSigmaSession') || null;
const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');
const historyList = document.getElementById('history-list');

// 🎬 INTRO CONTROLLER
window.addEventListener('load', () => {
    setTimeout(() => {
        document.getElementById('loader-screen').style.opacity = '0';
        const ui = document.getElementById('app-interface');
        ui.classList.remove('hidden-app');
        setTimeout(() => { ui.classList.add('visible'); document.getElementById('loader-screen').remove(); }, 100);
        
        if (currentSessionId) loadSessionMessages(currentSessionId);
    }, 5500);
});

// 💾 FIREBASE: SAVE MESSAGE
async function dbSave(role, text) {
    if (!currentSessionId) {
        const sessionRef = await addDoc(collection(db, "sessions"), {
            title: text.substring(0, 25) + "...",
            lastUpdated: serverTimestamp()
        });
        currentSessionId = sessionRef.id;
        localStorage.setItem('activeSigmaSession', currentSessionId);
    }
    await addDoc(collection(db, "sessions", currentSessionId, "messages"), {
        role, text, timestamp: serverTimestamp()
    });
}

// 📂 FIREBASE: LOAD SESSION
async function loadSessionMessages(id) {
    currentSessionId = id;
    localStorage.setItem('activeSigmaSession', id);
    chatBox.innerHTML = ''; // Clear UI
    
    const msgRef = collection(db, "sessions", id, "messages");
    const q = query(msgRef, orderBy("timestamp", "asc"));
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach(doc => appendMsg(doc.data().text, doc.data().role === 'user' ? 'user' : 'ai'));
}

// 📜 FIREBASE: SIDEBAR SYNC
onSnapshot(query(collection(db, "sessions"), orderBy("lastUpdated", "desc"), limit(10)), (snapshot) => {
    historyList.innerHTML = '';
    snapshot.forEach(doc => {
        const btn = document.createElement('button');
        btn.className = `menu-item ${doc.id === currentSessionId ? 'active' : ''}`;
        btn.innerText = doc.data().title;
        btn.onclick = () => loadSessionMessages(doc.id);
        historyList.appendChild(btn);
    });
});

// 🧠 AI INTERACTION
async function handleChat() {
    const text = userInput.value.trim();
    if (!text) return;

    appendMsg(text, 'user');
    userInput.value = '';
    await dbSave('user', text);

    const thinking = document.createElement('div');
    thinking.className = 'msg ai thinking-temp';
    thinking.innerHTML = `<div class="ai-ico">Σ</div><div class="content">Computing...</div>`;
    chatBox.appendChild(thinking);

    try {
        const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: text })
        });
        const data = await res.json();
        thinking.remove();
        appendMsg(data.reply, 'ai');
        await dbSave('assistant', data.reply);
    } catch (e) {
        thinking.innerText = "Connection lost. Try again.";
    }
}

// 🎨 UI HELPERS
function appendMsg(text, type) {
    const div = document.createElement('div');
    div.className = `msg ${type}`;
    div.innerHTML = type === 'ai' ? `<div class="ai-ico">Σ</div><div class="content">${marked.parse(text)}</div>` : `<div class="content">${text}</div>`;
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
}

document.getElementById('send-btn').onclick = handleChat;
document.getElementById('new-chat-btn').onclick = () => {
    localStorage.removeItem('activeSigmaSession');
    location.reload();
};