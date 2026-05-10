/* ===== MyChat — Full Application Logic ===== */
(() => {
    'use strict';

    // ── API Config ──
    const API_BASE = 'https://api.sarvam.ai';
    const API_KEY  = 'sk_mqo0xeyk_cc9EmxFCh3DG53i256LhkKK6';
    const HEADERS  = { 'api-subscription-key': API_KEY };

    // ── DOM Refs ──
    const $ = id => document.getElementById(id);
    const loginPage      = $('login-page');
    const chatPage       = $('chat-page');
    const loginForm      = $('login-form');
    const loginBtn       = $('login-btn');
    const loginUsername   = $('login-username');
    const loginPassword  = $('login-password');
    const sidebar        = $('sidebar');
    const sidebarToggle  = $('sidebar-toggle');
    const newChatBtn     = $('new-chat-btn');
    const deleteChatBtn  = $('delete-chat-btn');
    const chatListEl     = $('chat-list');
    const searchChats    = $('search-chats');
    const themeToggle    = $('theme-toggle');
    const ttsLang        = $('tts-lang');
    const userAvatar     = $('user-avatar');
    const userDisplayName= $('user-display-name');
    const logoutBtn      = $('logout-btn');
    const chatTitle      = $('current-chat-title');
    const messagesEl     = $('chat-messages');
    const welcomeScreen  = $('welcome-screen');
    const messageInput   = $('message-input');
    const sendBtn        = $('send-btn');
    const micBtn         = $('mic-btn');
    const voiceOverlay   = $('voice-overlay');
    const voiceCanvas    = $('voice-canvas');
    const voiceTimer     = $('voice-timer');
    const voiceStatus    = $('voice-status');
    const stopRecordBtn  = $('stop-record-btn');

    // ── State ──
    let username = '';
    let chats = {};          // { id: { title, messages: [{role,content}] } }
    let activeChatId = null;
    let mediaRecorder = null;
    let audioChunks = [];
    let recordStartTime = 0;
    let timerInterval = null;
    let audioContext = null;
    let analyser = null;
    let animFrameId = null;
    let currentAudio = null;

    // ===== INIT =====
    function init() {
        username = localStorage.getItem('mychat_user');
        if (username) {
            showChatPage();
        }
        loadTheme();
        bindEvents();
    }

    // ===== THEME =====
    function loadTheme() {
        const theme = localStorage.getItem('mychat_theme') || 'dark';
        document.documentElement.setAttribute('data-theme', theme);
    }
    function toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('mychat_theme', next);
    }

    // ===== AUTH =====
    function handleLogin(e) {
        e.preventDefault();
        const user = loginUsername.value.trim();
        const pass = loginPassword.value.trim();
        if (!user || !pass) return;

        loginBtn.classList.add('loading');
        setTimeout(() => {
            username = user;
            localStorage.setItem('mychat_user', username);
            loginBtn.classList.remove('loading');
            showChatPage();
        }, 800);
    }

    function handleLogout() {
        username = '';
        localStorage.removeItem('mychat_user');
        loginUsername.value = '';
        loginPassword.value = '';
        chatPage.classList.remove('active');
        loginPage.classList.add('active');
    }

    function showChatPage() {
        loginPage.classList.remove('active');
        chatPage.classList.add('active');
        userAvatar.textContent = username.charAt(0).toUpperCase();
        userDisplayName.textContent = username;
        loadChats();
        if (!activeChatId) createNewChat();
    }

    // ===== CHAT STORAGE =====
    function loadChats() {
        try {
            const data = localStorage.getItem('mychat_chats_' + username);
            chats = data ? JSON.parse(data) : {};
        } catch { chats = {}; }
        const lastActive = localStorage.getItem('mychat_active_' + username);
        if (lastActive && chats[lastActive]) {
            activeChatId = lastActive;
        }
        renderChatList();
        if (activeChatId) renderMessages();
    }

    function saveChats() {
        localStorage.setItem('mychat_chats_' + username, JSON.stringify(chats));
        localStorage.setItem('mychat_active_' + username, activeChatId);
    }

    // ===== CHAT MANAGEMENT =====
    function createNewChat() {
        const id = 'chat_' + Date.now();
        chats[id] = { title: 'New Chat', messages: [] };
        activeChatId = id;
        saveChats();
        renderChatList();
        renderMessages();
    }

    function switchChat(id) {
        if (!chats[id]) return;
        activeChatId = id;
        saveChats();
        renderChatList();
        renderMessages();
        // Close sidebar on mobile
        if (window.innerWidth <= 768) sidebar.classList.remove('open');
    }

    function deleteCurrentChat() {
        if (!activeChatId) return;
        delete chats[activeChatId];
        const ids = Object.keys(chats);
        activeChatId = ids.length ? ids[ids.length - 1] : null;
        if (!activeChatId) createNewChat();
        else {
            saveChats();
            renderChatList();
            renderMessages();
        }
    }

    function renderChatList() {
        const filter = searchChats.value.toLowerCase();
        chatListEl.innerHTML = '';
        const ids = Object.keys(chats).reverse();
        ids.forEach(id => {
            const chat = chats[id];
            if (filter && !chat.title.toLowerCase().includes(filter)) return;
            const el = document.createElement('div');
            el.className = 'chat-item' + (id === activeChatId ? ' active' : '');
            el.textContent = chat.title;
            el.addEventListener('click', () => switchChat(id));
            chatListEl.appendChild(el);
        });
    }

    // ===== MESSAGES =====
    function renderMessages() {
        if (!activeChatId || !chats[activeChatId]) return;
        const chat = chats[activeChatId];
        chatTitle.textContent = chat.title;

        // Clear everything except welcome
        messagesEl.querySelectorAll('.message, .typing-indicator').forEach(el => el.remove());

        if (chat.messages.length === 0) {
            welcomeScreen.style.display = 'flex';
        } else {
            welcomeScreen.style.display = 'none';
            chat.messages.forEach(msg => appendMessageBubble(msg.role, msg.content, false));
        }
        scrollToBottom();
    }

    function appendMessageBubble(role, content, animate = true) {
        const wrapper = document.createElement('div');
        wrapper.className = `message ${role === 'user' ? 'user' : 'ai'}`;
        if (!animate) wrapper.style.animation = 'none';

        const avatar = document.createElement('div');
        avatar.className = 'msg-avatar';
        avatar.textContent = role === 'user' ? username.charAt(0).toUpperCase() : 'AI';

        const bubble = document.createElement('div');
        bubble.className = 'msg-bubble';
        bubble.textContent = content;

        wrapper.appendChild(avatar);
        wrapper.appendChild(bubble);

        // AI messages get action buttons
        if (role === 'assistant') {
            const actions = document.createElement('div');
            actions.className = 'msg-actions';

            // Copy button
            const copyBtn = document.createElement('button');
            copyBtn.className = 'msg-action-btn';
            copyBtn.title = 'Copy';
            copyBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
            copyBtn.addEventListener('click', () => {
                navigator.clipboard.writeText(content);
                copyBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>';
                setTimeout(() => {
                    copyBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
                }, 1500);
            });

            // TTS button
            const speakBtn = document.createElement('button');
            speakBtn.className = 'msg-action-btn';
            speakBtn.title = 'Listen';
            speakBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>';
            speakBtn.addEventListener('click', () => playTTS(content, speakBtn));

            actions.appendChild(copyBtn);
            actions.appendChild(speakBtn);

            // Wrap bubble + actions
            const col = document.createElement('div');
            col.appendChild(bubble);
            col.appendChild(actions);
            wrapper.innerHTML = '';
            wrapper.appendChild(avatar);
            wrapper.appendChild(col);
        }

        messagesEl.appendChild(wrapper);
        scrollToBottom();
    }

    function showTyping() {
        const el = document.createElement('div');
        el.className = 'message ai typing-indicator';
        el.innerHTML = `
            <div class="msg-avatar">AI</div>
            <div class="msg-bubble"><div class="typing-dots"><span></span><span></span><span></span></div></div>
        `;
        messagesEl.appendChild(el);
        scrollToBottom();
    }
    function hideTyping() {
        const el = messagesEl.querySelector('.typing-indicator');
        if (el) el.remove();
    }

    function scrollToBottom() {
        requestAnimationFrame(() => {
            messagesEl.scrollTop = messagesEl.scrollHeight;
        });
    }

    // ===== SEND MESSAGE =====
    async function sendMessage(text) {
        if (!text.trim()) return;
        const content = text.trim();
        messageInput.value = '';
        autoResizeInput();
        updateSendBtn();
        welcomeScreen.style.display = 'none';

        // Add user message
        const chat = chats[activeChatId];
        chat.messages.push({ role: 'user', content });
        appendMessageBubble('user', content);

        // Auto-title from first message
        if (chat.messages.length === 1) {
            chat.title = content.slice(0, 40) + (content.length > 40 ? '…' : '');
            chatTitle.textContent = chat.title;
            renderChatList();
        }
        saveChats();

        // Get AI response
        showTyping();
        try {
            const reply = await callChatAPI(chat.messages);
            hideTyping();
            chat.messages.push({ role: 'assistant', content: reply });
            appendMessageBubble('assistant', reply);
            saveChats();
        } catch (err) {
            hideTyping();
            const errMsg = 'Sorry, something went wrong: ' + err.message;
            chat.messages.push({ role: 'assistant', content: errMsg });
            appendMessageBubble('assistant', errMsg);
            saveChats();
        }
    }

    // ===== API: Chat Completion =====
    async function callChatAPI(messages) {
        const payload = {
            model: 'sarvam-m',
            messages: [
                { role: 'system', content: 'You are MyChat, a helpful multilingual AI assistant. Keep your replies very short and simple — 1 to 3 sentences maximum. Never write long paragraphs. Be direct and friendly. Do not use <think> tags or show your reasoning.' },
                ...messages.map(m => ({ role: m.role, content: m.content }))
            ]
        };

        const res = await fetch(`${API_BASE}/v1/chat/completions`, {
            method: 'POST',
            headers: { ...HEADERS, 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error(`API error ${res.status}`);
        const data = await res.json();
        let reply = data.choices?.[0]?.message?.content || 'No response received.';
        // Strip <think>...</think> blocks from model output
        reply = reply.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
        // Remove leftover markdown bold markers
        reply = reply.replace(/\*\*/g, '');
        return reply;
    }

    // ===== API: Speech-to-Text =====
    async function callSTT(audioBlob) {
        const formData = new FormData();
        formData.append('file', audioBlob, 'audio.webm');
        formData.append('model', 'saaras:v3');
        formData.append('language_code', 'unknown');

        const res = await fetch(`${API_BASE}/speech-to-text`, {
            method: 'POST',
            headers: HEADERS,
            body: formData
        });

        if (!res.ok) throw new Error(`STT error ${res.status}`);
        const data = await res.json();
        return data.transcript || '';
    }

    // ===== API: Text-to-Speech =====
    async function playTTS(text, btn) {
        if (currentAudio) { currentAudio.pause(); currentAudio = null; }
        if (btn) btn.classList.add('playing');

        try {
            const payload = {
                inputs: [text.slice(0, 500)],
                target_language_code: ttsLang.value,
                model: 'bulbul:v3'
            };

            const res = await fetch(`${API_BASE}/text-to-speech`, {
                method: 'POST',
                headers: { ...HEADERS, 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error(`TTS error ${res.status}`);
            const data = await res.json();
            const base64Audio = data.audios?.[0];
            if (!base64Audio) throw new Error('No audio returned');

            const audioBytes = atob(base64Audio);
            const byteArray = new Uint8Array(audioBytes.length);
            for (let i = 0; i < audioBytes.length; i++) byteArray[i] = audioBytes.charCodeAt(i);
            const blob = new Blob([byteArray], { type: 'audio/wav' });
            const url = URL.createObjectURL(blob);

            currentAudio = new Audio(url);
            currentAudio.play();
            currentAudio.onended = () => {
                if (btn) btn.classList.remove('playing');
                URL.revokeObjectURL(url);
                currentAudio = null;
            };
        } catch (err) {
            console.error('TTS Error:', err);
            if (btn) btn.classList.remove('playing');
        }
    }

    // ===== VOICE RECORDING =====
    async function startRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioChunks = [];
            mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunks.push(e.data);
            };

            mediaRecorder.onstop = async () => {
                stream.getTracks().forEach(t => t.stop());
                stopVisualization();
                voiceOverlay.classList.remove('active');
                micBtn.classList.remove('recording');
                clearInterval(timerInterval);

                const blob = new Blob(audioChunks, { type: 'audio/webm' });
                voiceStatus.textContent = 'Transcribing…';

                try {
                    const transcript = await callSTT(blob);
                    if (transcript.trim()) {
                        messageInput.value = transcript;
                        autoResizeInput();
                        updateSendBtn();
                        // Auto-send
                        sendMessage(transcript);
                    }
                } catch (err) {
                    console.error('STT error:', err);
                }
            };

            mediaRecorder.start(250);
            micBtn.classList.add('recording');
            voiceOverlay.classList.add('active');
            voiceStatus.textContent = 'Listening…';
            recordStartTime = Date.now();
            updateTimer();
            timerInterval = setInterval(updateTimer, 1000);
            startVisualization(stream);
        } catch (err) {
            console.error('Mic access denied:', err);
            alert('Microphone access is required for voice input.');
        }
    }

    function stopRecording() {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
        }
    }

    function updateTimer() {
        const elapsed = Math.floor((Date.now() - recordStartTime) / 1000);
        const mins = String(Math.floor(elapsed / 60)).padStart(2, '0');
        const secs = String(elapsed % 60).padStart(2, '0');
        voiceTimer.textContent = `${mins}:${secs}`;
    }

    // ===== AUDIO VISUALIZATION =====
    function startVisualization(stream) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);

        const canvas = voiceCanvas;
        const ctx = canvas.getContext('2d');
        canvas.width = 220;
        canvas.height = 220;

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        function draw() {
            animFrameId = requestAnimationFrame(draw);
            analyser.getByteFrequencyData(dataArray);
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const cx = canvas.width / 2;
            const cy = canvas.height / 2;
            const bars = 48;

            for (let i = 0; i < bars; i++) {
                const val = dataArray[i % bufferLength] / 255;
                const angle = (i / bars) * Math.PI * 2 - Math.PI / 2;
                const minR = 40;
                const maxR = 95;
                const r = minR + val * (maxR - minR);

                const x1 = cx + Math.cos(angle) * minR;
                const y1 = cy + Math.sin(angle) * minR;
                const x2 = cx + Math.cos(angle) * r;
                const y2 = cy + Math.sin(angle) * r;

                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.strokeStyle = `hsl(${240 + i * 3}, 80%, ${55 + val * 25}%)`;
                ctx.lineWidth = 3;
                ctx.lineCap = 'round';
                ctx.stroke();
            }

            // Center circle glow
            const avgVal = dataArray.reduce((a, b) => a + b, 0) / bufferLength / 255;
            const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, 42);
            grd.addColorStop(0, `rgba(129,140,248,${0.15 + avgVal * 0.25})`);
            grd.addColorStop(1, 'transparent');
            ctx.fillStyle = grd;
            ctx.beginPath();
            ctx.arc(cx, cy, 42, 0, Math.PI * 2);
            ctx.fill();
        }
        draw();
    }

    function stopVisualization() {
        if (animFrameId) cancelAnimationFrame(animFrameId);
        if (audioContext) audioContext.close();
        audioContext = null; analyser = null; animFrameId = null;
    }

    // ===== INPUT HANDLING =====
    function autoResizeInput() {
        messageInput.style.height = 'auto';
        messageInput.style.height = Math.min(messageInput.scrollHeight, 140) + 'px';
    }

    function updateSendBtn() {
        const hasText = messageInput.value.trim().length > 0;
        sendBtn.classList.toggle('enabled', hasText);
        sendBtn.disabled = !hasText;
    }

    // ===== EVENT BINDINGS =====
    function bindEvents() {
        // Login
        loginForm.addEventListener('submit', handleLogin);

        // Logout
        logoutBtn.addEventListener('click', handleLogout);

        // Theme
        themeToggle.addEventListener('click', toggleTheme);

        // Sidebar toggle
        sidebarToggle.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                sidebar.classList.toggle('open');
            } else {
                sidebar.classList.toggle('collapsed');
            }
        });

        // New chat & delete
        newChatBtn.addEventListener('click', createNewChat);
        deleteChatBtn.addEventListener('click', deleteCurrentChat);

        // Search
        searchChats.addEventListener('input', renderChatList);

        // Message input
        messageInput.addEventListener('input', () => {
            autoResizeInput();
            updateSendBtn();
        });
        messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage(messageInput.value);
            }
        });

        // Send button
        sendBtn.addEventListener('click', () => sendMessage(messageInput.value));

        // Mic
        micBtn.addEventListener('click', () => {
            if (mediaRecorder && mediaRecorder.state === 'recording') {
                stopRecording();
            } else {
                startRecording();
            }
        });
        stopRecordBtn.addEventListener('click', stopRecording);

        // Welcome chips
        document.querySelectorAll('.chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const prompt = chip.getAttribute('data-prompt');
                sendMessage(prompt);
            });
        });
    }

    // ===== BOOT =====
    init();
})();
