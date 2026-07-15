/**
 * portfolio-chatbot — Vanilla Web Component with Shadow DOM
 *
 * Uses ES6 class syntax (required for extending built-in HTMLElement).
 * Shadow DOM ensures complete CSS isolation from Tailwind/React.
 * Never calls scrollIntoView — avoids TanStack Router's scrollRestoration
 * listener conflict that caused the input-focus freeze.
 */
(function () {
  "use strict";

  /* ── Knowledge base (local fallback) ────────────────────────────────── */
  var KB = [
    {
      re: /\b(hello|hi|hey|sup)\b/i,
      a: "Hey there! 👋 Ask me about Halim's skills, projects, or how to get in touch.",
    },
    {
      re: /skill|stack|tech|language|framework/i,
      a: "Halim's stack: PHP · Laravel · Node.js (backend) — React · Vue.js (frontend) — React Native (mobile) — PostgreSQL · MySQL (databases) — LLMs · RAG · fine-tuning (AI).",
    },
    {
      re: /project|built|work|portfolio/i,
      a: "Recent work: 🤖 AI Knowledge Assistant (RAG + local LLM) · 🏢 Laravel SaaS Platform (multi-tenant, Stripe) · 📱 React Native Delivery App. Check the Projects page for full details!",
    },
    {
      re: /\bai\b|llm|rag|machine.?learning|embedding|fine.?tun/i,
      a: "AI is Halim's superpower — local LLM setup, RAG pipelines, embeddings, fine-tuning, and real-world AI integrations.",
    },
    {
      re: /experience|year|how.?long|senior/i,
      a: "6+ years of full-stack development across startups and enterprise — web, mobile, and AI.",
    },
    {
      re: /hire|contact|email|reach|available|freelance|contract/i,
      a: "Halim is open to full-time, freelance, and contract roles. Head to the Contact page to reach him!",
    },
    {
      re: /who.?are.?you|what.?are.?you|introduce/i,
      a: "I'm Halim's portfolio assistant. Ask me about his skills, projects, experience, or availability! 💬",
    },
  ];

  /* ── API endpoint ───────────────────────────────────────────────────── */
  var API_BASE = "https://ai-api-61ol.onrender.com";

  function getLocalReply(text) {
    var t = (text || "").trim();
    for (var i = 0; i < KB.length; i++) {
      if (KB[i].re.test(t)) return KB[i].a;
    }
    return "Not sure about that one! Try asking about Halim's skills, projects, or how to hire him.";
  }

  /* ── Shadow DOM CSS ─────────────────────────────────────────────────── */
  var CSS_TEXT = "\
    :host { all: initial; display: block; }\
    :host, :host *, :host *::before, :host *::after { box-sizing: border-box; }\
    \
    #bubble {\
      position: fixed; bottom: 96px; right: 28px; z-index: 2147483645;\
      background: #181c27;\
      border: 1px solid rgba(255,255,255,0.08);\
      border-radius: 16px 16px 16px 4px;\
      padding: 12px 16px;\
      max-width: 260px;\
      font-family: 'Inter', system-ui, -apple-system, sans-serif;\
      font-size: 13px;\
      line-height: 1.5;\
      color: #e8eaf0;\
      box-shadow: 0 12px 32px rgba(0,0,0,0.5);\
      opacity: 0;\
      transform: translateY(8px) scale(0.95);\
      pointer-events: none;\
      transition: opacity 0.35s ease, transform 0.35s cubic-bezier(0.34,1.56,0.64,1);\
      transform-origin: bottom right;\
    }\
    #bubble.show {\
      opacity: 1;\
      transform: translateY(0) scale(1);\
    }\
    #bubble-arrow {\
      position: absolute; bottom: -6px; right: 24px;\
      width: 12px; height: 12px;\
      background: #181c27;\
      border-right: 1px solid rgba(255,255,255,0.08);\
      border-bottom: 1px solid rgba(255,255,255,0.08);\
      transform: rotate(45deg);\
    }\
    \
    #fab {\
      position: fixed; bottom: 28px; right: 28px; z-index: 2147483647;\
      width: 56px; height: 56px; border-radius: 50%; border: none; cursor: pointer;\
      background: linear-gradient(135deg, #4fffb0 0%, #00c97a 100%);\
      box-shadow: 0 8px 32px rgba(79,255,176,0.35), 0 2px 8px rgba(0,0,0,0.5);\
      display: flex; align-items: center; justify-content: center;\
      transition: transform 0.18s ease, box-shadow 0.18s ease;\
      outline: none; overflow: visible;\
    }\
    #fab:hover { transform: scale(1.08); }\
    #fab:active { transform: scale(0.96); }\
    \
    #badge {\
      position: absolute; top: 3px; right: 3px;\
      width: 10px; height: 10px; border-radius: 50%;\
      background: #ef4444; border: 2px solid #0f1117; display: none;\
    }\
    #badge.show { display: block; }\
    \
    #panel {\
      position: fixed; bottom: 96px; right: 28px; z-index: 2147483646;\
      width: 360px; max-width: calc(100vw - 40px);\
      height: 500px; max-height: calc(100vh - 130px);\
      border-radius: 20px;\
      background: #181c27;\
      border: 1px solid rgba(255,255,255,0.08);\
      box-shadow: 0 24px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05);\
      display: none; flex-direction: column; overflow: hidden;\
      font-family: 'Inter', system-ui, -apple-system, sans-serif;\
      transform-origin: bottom right;\
    }\
    #panel.open {\
      display: flex;\
      animation: slideIn 0.22s cubic-bezier(0.34,1.56,0.64,1) forwards;\
    }\
    @keyframes slideIn {\
      from { opacity: 0; transform: translateY(10px) scale(0.96); }\
      to   { opacity: 1; transform: translateY(0)   scale(1); }\
    }\
    \
    #header {\
      padding: 14px 16px; border-bottom: 1px solid rgba(255,255,255,0.07);\
      display: flex; align-items: center; justify-content: space-between;\
      flex-shrink: 0; background: rgba(255,255,255,0.02);\
    }\
    #header-left { display: flex; align-items: center; gap: 10px; }\
    #avatar {\
      width: 34px; height: 34px; border-radius: 50%; flex-shrink: 0;\
      background: rgba(79,255,176,0.12); border: 1px solid rgba(79,255,176,0.25);\
      display: flex; align-items: center; justify-content: center;\
    }\
    #header-name { font-size: 13.5px; font-weight: 600; color: #e8eaf0; line-height: 1.2; }\
    #header-status { font-size: 11px; color: #4fffb0; display: flex; align-items: center; gap: 4px; margin-top: 2px; }\
    #status-dot {\
      display: inline-block; width: 6px; height: 6px; border-radius: 50%;\
      background: #4fffb0; animation: pulse 2s ease-in-out infinite;\
    }\
    @keyframes pulse {\
      0%,100% { opacity: 1; transform: scale(1); }\
      50%      { opacity: 0.4; transform: scale(0.8); }\
    }\
    #close-btn {\
      background: none; border: none; cursor: pointer; color: #8a93a8;\
      padding: 6px; border-radius: 8px; line-height: 0; outline: none;\
      transition: color 0.15s, background 0.15s;\
    }\
    #close-btn:hover { color: #e8eaf0; background: rgba(255,255,255,0.06); }\
    \
    #messages {\
      flex: 1; overflow-y: auto; overflow-x: hidden;\
      padding: 14px 14px 8px;\
      display: flex; flex-direction: column; gap: 10px;\
      scroll-behavior: auto;\
    }\
    #messages::-webkit-scrollbar { width: 4px; }\
    #messages::-webkit-scrollbar-track { background: transparent; }\
    #messages::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }\
    \
    .row { display: flex; gap: 7px; }\
    .row.user { justify-content: flex-end; }\
    .row.ai   { justify-content: flex-start; align-items: flex-end; }\
    .ai-dot   { width: 7px; height: 7px; border-radius: 50%; background: #4fffb0; flex-shrink: 0; margin-bottom: 5px; opacity: 0.6; }\
    \
    .bubble {\
      max-width: 84%; padding: 9px 13px;\
      font-size: 13.5px; line-height: 1.55; word-break: break-word; color: #e8eaf0;\
    }\
    .bubble.user {\
      background: rgba(79,255,176,0.1); border: 1px solid rgba(79,255,176,0.22);\
      border-radius: 16px 16px 4px 16px;\
    }\
    .bubble.ai {\
      background: #1e2333; border: 1px solid rgba(255,255,255,0.07);\
      border-radius: 16px 16px 16px 4px;\
    }\
    \
    .typing-dots { display: flex; gap: 4px; align-items: center; padding: 11px 13px; }\
    .dot-anim {\
      width: 6px; height: 6px; border-radius: 50%; background: #4fffb0; opacity: 0.5;\
      animation: dotBounce 1.1s ease-in-out infinite;\
    }\
    .dot-anim:nth-child(2) { animation-delay: 0.18s; }\
    .dot-anim:nth-child(3) { animation-delay: 0.36s; }\
    @keyframes dotBounce {\
      0%,60%,100% { transform: translateY(0);    opacity: 0.4; }\
      30%          { transform: translateY(-5px); opacity: 1;   }\
    }\
    \
    #form { padding: 10px 12px 13px; border-top: 1px solid rgba(255,255,255,0.07); flex-shrink: 0; }\
    #input-wrap {\
      display: flex; align-items: center; gap: 8px;\
      background: #0f1117; border: 1px solid rgba(255,255,255,0.1);\
      border-radius: 13px; padding: 3px 7px 3px 13px;\
      transition: border-color 0.2s, box-shadow 0.2s;\
      cursor: text;\
    }\
    #input-wrap.focused {\
      border-color: rgba(79,255,176,0.55);\
      box-shadow: 0 0 0 3px rgba(79,255,176,0.08);\
    }\
    #textarea {\
      flex: 1; background: none; border: none; outline: none; resize: none;\
      color: #e8eaf0; font-size: 13.5px; line-height: 1.5;\
      font-family: inherit; max-height: 80px; overflow-y: auto;\
      padding: 4px 0; caret-color: #4fffb0;\
    }\
    #textarea::placeholder { color: rgba(138,147,168,0.7); }\
    #textarea::-webkit-scrollbar { width: 0; }\
    #send-btn {\
      flex-shrink: 0; width: 32px; height: 32px; border-radius: 9px;\
      border: none; cursor: pointer; display: flex; align-items: center; justify-content: center;\
      background: rgba(255,255,255,0.07); color: #8a93a8;\
      transition: background 0.18s, color 0.18s, transform 0.15s;\
      outline: none;\
    }\
    #send-btn.active { background: #4fffb0; color: #0f1117; }\
    #send-btn.active:hover { transform: scale(1.08); }\
    #send-btn:disabled { opacity: 0.4; cursor: not-allowed; }\
    #hint { margin-top: 5px; font-size: 10.5px; color: #8a93a8; text-align: center; }\
  ";

  /* ── Shadow DOM HTML template ───────────────────────────────────────── */
  var ROBOT_SVG = '\
    <svg width=\"20\" height=\"20\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#0f1117\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\">\
      <rect x=\"3\" y=\"7\" width=\"18\" height=\"12\" rx=\"2\" ry=\"2\"/>\
      <circle cx=\"9\" cy=\"12\" r=\"1.5\" fill=\"#0f1117\"/>\
      <circle cx=\"15\" cy=\"12\" r=\"1.5\" fill=\"#0f1117\"/>\
      <line x1=\"10\" y1=\"16\" x2=\"14\" y2=\"16\"/>\
      <path d=\"M9 3 L9 7\"/><path d=\"M15 3 L15 7\"/>\
    </svg>\
  ';

  var ROBOT_AVATAR_SVG = '\
    <svg width=\"15\" height=\"15\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#4fffb0\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\">\
      <rect x=\"3\" y=\"7\" width=\"18\" height=\"12\" rx=\"2\" ry=\"2\"/>\
      <circle cx=\"9\" cy=\"12\" r=\"1.5\" fill=\"#4fffb0\"/>\
      <circle cx=\"15\" cy=\"12\" r=\"1.5\" fill=\"#4fffb0\"/>\
      <line x1=\"10\" y1=\"16\" x2=\"14\" y2=\"16\"/>\
      <path d=\"M9 3 L9 7\"/><path d=\"M15 3 L15 7\"/>\
    </svg>\
  ';

  var CLOSE_SVG = '\
    <svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.5\" stroke-linecap=\"round\">\
      <line x1=\"18\" y1=\"6\" x2=\"6\" y2=\"18\"/><line x1=\"6\" y1=\"6\" x2=\"18\" y2=\"18\"/>\
    </svg>\
  ';

  var SEND_SVG = '\
    <svg width=\"15\" height=\"15\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\">\
      <line x1=\"22\" y1=\"2\" x2=\"11\" y2=\"13\"/><polygon points=\"22 2 15 22 11 13 2 9 22 2\"/>\
    </svg>\
  ';

  var TEMPLATE =
    "<style>" + CSS_TEXT + "</style>" +

    /* Speech bubble */
    '<div id="bubble">' +
      '<div id="bubble-arrow"></div>' +
      'Hey there! 👋 I\'m Halim\'s portfolio assistant, your gateway to getting to know him as a developer. Feel free to ask me anything about his skills, experience, or projects!' +
    "</div>" +

    /* FAB */
    '<button id="fab" type="button" aria-label="Open chat">' +
      '<span id="badge"></span>' +
      '<span id="fab-icon">' + ROBOT_SVG + "</span>" +
    "</button>" +

    /* Panel */
    '<div id="panel" role="dialog" aria-modal="true" aria-label="Chat">' +

      '<div id="header">' +
        '<div id="header-left">' +
          '<div id="avatar">' + ROBOT_AVATAR_SVG + "</div>" +
          "<div>" +
            '<div id="header-name">Halim\'s Assistant</div>' +
            '<div id="header-status"><span id="status-dot"></span> Online</div>' +
          "</div>" +
        "</div>" +
        '<button id="close-btn" type="button" aria-label="Close chat">' + CLOSE_SVG + "</button>" +
      "</div>" +

      '<div id="messages" role="log" aria-live="polite"></div>' +

      '<div id="form">' +
        '<div id="input-wrap">' +
          '<textarea id="textarea" rows="1" placeholder="Ask me anything…" aria-label="Type a message"></textarea>' +
          '<button id="send-btn" type="button" aria-label="Send" disabled>' + SEND_SVG + "</button>" +
        "</div>" +
        '<div id="hint">Enter to send · Shift+Enter for new line</div>' +
      "</div>" +

    "</div>";

  /* ── Web Component — MUST use ES6 class to extend HTMLElement ───────── */
  class PortfolioChatBot extends HTMLElement {
    connectedCallback() {
      /* Guard: only initialise once even if moved in the DOM */
      if (this._initialised) return;
      this._initialised = true;

      const shadow = this.attachShadow({ mode: "open" });
      shadow.innerHTML = TEMPLATE;

      /* Element refs */
      this._fab      = shadow.getElementById("fab");
      this._fabIcon  = shadow.getElementById("fab-icon");
      this._badge    = shadow.getElementById("badge");
      this._bubble   = shadow.getElementById("bubble");
      this._panel    = shadow.getElementById("panel");
      this._msgs     = shadow.getElementById("messages");
      this._wrap     = shadow.getElementById("input-wrap");
      this._ta       = shadow.getElementById("textarea");
      this._sendBtn  = shadow.getElementById("send-btn");
      this._closeBtn = shadow.getElementById("close-btn");

      /* State */
      this._open  = false;
      this._busy  = false;
      this._timer = null;

      /* Seed welcome message */
      this._addBubble("ai", "Hi! I'm Halim's assistant. Ask me about his skills, projects, or how to hire him 👋");

      /* Events — all inside Shadow DOM, never leak to document */
      this._fab.addEventListener("click",  () => this._toggle());
      this._closeBtn.addEventListener("click", () => this._closeChat());

      this._ta.addEventListener("focus",  () => this._wrap.classList.add("focused"));
      this._ta.addEventListener("blur",   () => this._wrap.classList.remove("focused"));
      this._wrap.addEventListener("click", () => this._ta.focus());
      this._ta.addEventListener("input",  () => this._syncSendBtn());
      this._ta.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          this._send();
        }
      });

      this._sendBtn.addEventListener("click", () => this._send());

      /* ── On load: wake up server + show speech bubble ──────────────── */
      this._wakeServer();

      setTimeout(() => {
        this._showGreetingBubble();
      }, 3000);
    }

    disconnectedCallback() {
      if (this._timer) clearTimeout(this._timer);
      if (this._bubbleTimer) clearTimeout(this._bubbleTimer);
    }

    /* ── Wake up the Render API server ──────────────────────────────────── */
    _wakeServer() {
      fetch(API_BASE + "/message", { method: "GET" })
        .catch(function () { /* Silently ignore — just waking the server */ });
    }

    /* ── Show speech bubble for 5 seconds ──────────────────────────────── */
    _showGreetingBubble() {
      if (this._open) return; /* Don't show if chat is already open */

      this._bubble.classList.add("show");
      this._bubbleTimer = setTimeout(() => {
        this._bubble.classList.remove("show");
      }, 8000);
    }

    /* ── Chat API call ──────────────────────────────────────────────────── */
    _fetchReply(userText) {
      var self = this;
      return fetch(API_BASE + "/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText }),
      })
        .then(function (res) {
          if (!res.ok) throw new Error("HTTP " + res.status);
          return res.json();
        })
        .then(function (data) {
          return data.response || getLocalReply(userText);
        })
        .catch(function () {
          return getLocalReply(userText);
        });
    }

    _toggle() {
      if (this._open) this._closeChat(); else this._openChat();
    }

    _openChat() {
      this._open = true;
      this._bubble.classList.remove("show");
      if (this._bubbleTimer) clearTimeout(this._bubbleTimer);
      this._panel.classList.add("open");
      this._badge.classList.remove("show");
      this._scrollBottom();
      setTimeout(() => this._ta.focus(), 80);
    }

    _closeChat() {
      this._open = false;
      this._panel.classList.remove("open");
    }

    _syncSendBtn() {
      const hasText = this._ta.value.trim().length > 0;
      this._sendBtn.disabled = !hasText || this._busy;
      this._sendBtn.classList.toggle("active", hasText && !this._busy);
    }

    _send() {
      const text = this._ta.value.trim();
      if (!text || this._busy) return;

      this._busy = true;
      this._ta.value = "";
      this._syncSendBtn();
      this._addBubble("user", text);
      this._showTyping();

      var self = this;
      this._fetchReply(text).then(function (reply) {
        self._removeTyping();
        self._addBubble("ai", reply);
        self._busy = false;
        self._syncSendBtn();
        if (!self._open) self._badge.classList.add("show");
      });
    }

    _addBubble(role, text) {
      const row = document.createElement("div");
      row.className = "row " + role;

      if (role === "ai") {
        const dot = document.createElement("div");
        dot.className = "ai-dot";
        row.appendChild(dot);
      }

      const bubble = document.createElement("div");
      bubble.className = "bubble " + role;
      bubble.textContent = text;
      row.appendChild(bubble);

      this._msgs.appendChild(row);
      this._scrollBottom();
    }

    _showTyping() {
      const row = document.createElement("div");
      row.className = "row ai";
      row.id = "typing-row";

      const dot = document.createElement("div");
      dot.className = "ai-dot";
      row.appendChild(dot);

      const bubble = document.createElement("div");
      bubble.className = "bubble ai typing-dots";
      for (let i = 0; i < 3; i++) {
        const d = document.createElement("div");
        d.className = "dot-anim";
        bubble.appendChild(d);
      }
      row.appendChild(bubble);
      this._msgs.appendChild(row);
      this._scrollBottom();
    }

    _removeTyping() {
      const el = this._msgs.querySelector("#typing-row");
      if (el) el.remove();
    }

    _scrollBottom() {
      this._msgs.scrollTop = this._msgs.scrollHeight;
    }
  }

  /* ── Register & mount ────────────────────────────────────────────────── */
  if (!customElements.get("portfolio-chatbot")) {
    customElements.define("portfolio-chatbot", PortfolioChatBot);
  }

  function mount() {
    if (!document.querySelector("portfolio-chatbot")) {
      document.body.appendChild(document.createElement("portfolio-chatbot"));
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();