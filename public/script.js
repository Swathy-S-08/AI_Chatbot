const chatForm = document.querySelector('#chatForm');
const messageInput = document.querySelector('#messageInput');
const messages = document.querySelector('#messages');
const micButton = document.querySelector('#micButton');
const statusPill = document.querySelector('#statusPill');
const voiceToggle = document.querySelector('#voiceToggle');
const themeToggle = document.querySelector('#themeToggle');
const clearChatButton = document.querySelector('#clearChatButton');

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
let isListening = false;
let voiceEnabled = true;
const conversationHistory = [];

function applyTheme(theme) {
  const isLight = theme === 'light';
  document.body.classList.toggle('light-theme', isLight);
  themeToggle.textContent = isLight ? 'Dark Mode' : 'Light Mode';
  themeToggle.setAttribute('aria-pressed', String(isLight));
  localStorage.setItem('jarvis-theme', theme);
}

function nowLabel() {
  return new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });
}

function setStatus(text, mode = '') {
  statusPill.textContent = text;
  statusPill.className = `status-pill ${mode}`.trim();
}

function addMessage(role, text, options = {}) {
  const message = document.createElement('article');
  message.className = `message ${role}`;

  const avatar = document.createElement('div');
  avatar.className = 'avatar';
  avatar.textContent = role === 'user' ? 'U' : 'J';

  const bubble = document.createElement('div');
  bubble.className = 'bubble';

  const paragraph = document.createElement('p');
  paragraph.textContent = text;

  const time = document.createElement('time');
  time.textContent = nowLabel();

  bubble.append(paragraph, time);

  if (role === 'bot' && options.copyable !== false) {
    const copyButton = document.createElement('button');
    copyButton.className = 'copy-button';
    copyButton.type = 'button';
    copyButton.textContent = 'Copy';
    copyButton.addEventListener('click', async () => {
      await navigator.clipboard.writeText(text);
      copyButton.textContent = 'Copied';
      setTimeout(() => {
        copyButton.textContent = 'Copy';
      }, 1400);
    });
    bubble.append(copyButton);
  }

  message.append(avatar, bubble);
  messages.append(message);
  messages.scrollTop = messages.scrollHeight;
}

function speak(text) {
  if (!voiceEnabled || !('speechSynthesis' in window)) {
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1;
  utterance.pitch = 1;
  utterance.volume = 1;
  window.speechSynthesis.speak(utterance);
}

function resizeInput() {
  messageInput.style.height = 'auto';
  messageInput.style.height = `${messageInput.scrollHeight}px`;
}

async function sendMessage(text) {
  const trimmed = text.trim();
  if (!trimmed) {
    return;
  }

  addMessage('user', trimmed);
  console.log('User:', trimmed);
  conversationHistory.push({ role: 'user', text: trimmed });

  messageInput.value = '';
  resizeInput();
  setStatus('Thinking');
  chatForm.querySelector('button[type="submit"]').disabled = true;

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: trimmed,
        history: conversationHistory.slice(0, -1)
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Request failed.');
    }

    addMessage('bot', data.reply);
    console.log('Jarvis:', data.reply);
    conversationHistory.push({ role: 'model', text: data.reply });
    speak(data.reply);
    setStatus('Ready');
  } catch (error) {
    const message = error.message || 'Something went wrong.';
    addMessage('bot', message);
    console.error(message);
    speak(message);
    setStatus('Error');
  } finally {
    chatForm.querySelector('button[type="submit"]').disabled = false;
    messageInput.focus();
  }
}

function setupVoiceInput() {
  if (!SpeechRecognition) {
    micButton.disabled = true;
    micButton.title = 'Voice input is not supported in this browser';
    return;
  }

  recognition = new SpeechRecognition();
  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.continuous = false;

  recognition.addEventListener('start', () => {
    isListening = true;
    micButton.classList.add('recording');
    setStatus('Listening', 'listening');
  });

  recognition.addEventListener('end', () => {
    isListening = false;
    micButton.classList.remove('recording');
    if (statusPill.textContent === 'Listening') {
      setStatus('Ready');
    }
  });

  recognition.addEventListener('result', (event) => {
    const transcript = Array.from(event.results)
      .map((result) => result[0].transcript)
      .join(' ')
      .trim();

    messageInput.value = transcript;
    resizeInput();

    if (transcript) {
      setStatus('Voice captured');
      messageInput.focus();
    }
  });

  recognition.addEventListener('error', (event) => {
    const errorMessage = `Voice input error: ${event.error}`;
    addMessage('bot', errorMessage);
    console.error(errorMessage);
    setStatus('Error');
  });
}

chatForm.addEventListener('submit', (event) => {
  event.preventDefault();
  sendMessage(messageInput.value);
});

messageInput.addEventListener('input', resizeInput);

messageInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    chatForm.requestSubmit();
  }
});

micButton.addEventListener('click', () => {
  if (!recognition) {
    return;
  }

  if (isListening) {
    recognition.stop();
  } else {
    recognition.start();
  }
});

voiceToggle.addEventListener('click', () => {
  voiceEnabled = !voiceEnabled;
  voiceToggle.textContent = voiceEnabled ? 'Voice On' : 'Voice Off';
  voiceToggle.setAttribute('aria-pressed', String(voiceEnabled));
  if (!voiceEnabled && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
});

themeToggle.addEventListener('click', () => {
  const nextTheme = document.body.classList.contains('light-theme') ? 'dark' : 'light';
  applyTheme(nextTheme);
});

clearChatButton.addEventListener('click', () => {
  messages.innerHTML = '';
  conversationHistory.length = 0;
  window.speechSynthesis?.cancel();
  addMessage('bot', 'Chat cleared. I am ready for a new conversation.', { copyable: false });
  setStatus('Ready');
  messageInput.focus();
});

applyTheme(localStorage.getItem('jarvis-theme') || 'dark');
setupVoiceInput();
resizeInput();
