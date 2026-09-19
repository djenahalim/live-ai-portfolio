/**
 * portfolio-contact — Vanilla Web Component with Shadow DOM
 *
 * Contact form widget that mirrors the chatbot's look & feel.
 * Shadow DOM ensures complete CSS isolation from Tailwind/React.
 *
 * Two modes:
 *   1. Floating FAB widget (default) — auto-mounted to <body>
 *   2. Inline embedded form — use <portfolio-contact inline> in your markup
 */
(function () {
  "use strict";

  /* ── API endpoint ───────────────────────────────────────────────────── */
  /* Same Render backend as the chatbot widget — it relays the form to
   * Halim's inbox through Resend. */
  var API_BASE = "https://ai-api-61ol.onrender.com";

  /* ── Greeting speech bubble ─────────────────────────────────────────── */
  /* Off on purpose: the chatbot bubble already greets visitors, so two
   * bubbles at once looked cluttered. Flip to true to bring it back. */
  var SHOW_GREETING_BUBBLE = false;

  /* ─ Shadow DOM CSS ─────────────────────────────────────────────────── */
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
      position: fixed; bottom: 28px; right: 96px; z-index: 2147483647;\
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
    #body {\
      flex: 1; overflow-y: auto; overflow-x: hidden;\
      padding: 18px 16px 12px;\
      display: flex; flex-direction: column;\
    }\
    #body::-webkit-scrollbar { width: 4px; }\
    #body::-webkit-scrollbar-track { background: transparent; }\
    #body::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }\
    \
    #form-title {\
      font-size: 15px; font-weight: 600; color: #e8eaf0;\
      margin-bottom: 4px;\
    }\
    #form-desc {\
      font-size: 12.5px; color: #8a93a8; line-height: 1.5;\
      margin-bottom: 16px;\
    }\
    \
    .field { margin-bottom: 14px; }\
    .field-label {\
      display: block; font-size: 12px; font-weight: 600; color: #c8cad0;\
      margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.5px;\
    }\
    .field-input {\
      width: 100%;\
      background: #0f1117; border: 1px solid rgba(255,255,255,0.1);\
      border-radius: 11px; padding: 10px 13px;\
      color: #e8eaf0; font-size: 13.5px; line-height: 1.5;\
      font-family: 'Inter', system-ui, -apple-system, sans-serif;\
      outline: none; transition: border-color 0.2s, box-shadow 0.2s;\
      caret-color: #4fffb0;\
    }\
    .field-input:focus {\
      border-color: rgba(79,255,176,0.55);\
      box-shadow: 0 0 0 3px rgba(79,255,176,0.08);\
    }\
    .field-input::placeholder { color: rgba(138,147,168,0.6); }\
    textarea.field-input {\
      resize: none; min-height: 90px;\
    }\
    textarea.field-input::-webkit-scrollbar { width: 0; }\
    \
    #submit-btn {\
      width: 100%;\
      display: flex; align-items: center; justify-content: center; gap: 8px;\
      background: linear-gradient(135deg, #4fffb0 0%, #00c97a 100%);\
      color: #0f1117; font-size: 13.5px; font-weight: 600;\
      font-family: 'Inter', system-ui, -apple-system, sans-serif;\
      border: none; border-radius: 11px; padding: 11px 16px;\
      cursor: pointer; transition: transform 0.15s, box-shadow 0.15s;\
      outline: none; margin-top: 4px;\
    }\
    #submit-btn:hover { transform: scale(1.02); box-shadow: 0 4px 20px rgba(79,255,176,0.3); }\
    #submit-btn:active { transform: scale(0.98); }\
    #submit-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; box-shadow: none; }\
    \
    #success {\
      flex: 1; display: none; flex-direction: column;\
      align-items: center; justify-content: center;\
      text-align: center; padding: 20px;\
    }\
    #success.show { display: flex; }\
    #success-icon {\
      width: 48px; height: 48px; border-radius: 50%;\
      background: rgba(79,255,176,0.12);\
      border: 1px solid rgba(79,255,176,0.25);\
      display: flex; align-items: center; justify-content: center;\
      margin-bottom: 14px;\
    }\
    #success-title {\
      font-size: 16px; font-weight: 600; color: #e8eaf0;\
      margin-bottom: 6px;\
    }\
    #success-desc {\
      font-size: 13px; color: #8a93a8; line-height: 1.5;\
      max-width: 240px;\
    }\
    #success-back {\
      margin-top: 18px;\
      background: none; border: 1px solid rgba(255,255,255,0.12);\
      color: #8a93a8; font-size: 12.5px; font-family: inherit;\
      border-radius: 9px; padding: 8px 16px; cursor: pointer;\
      transition: color 0.15s, border-color 0.15s; outline: none;\
    }\
    #success-back:hover { color: #e8eaf0; border-color: rgba(255,255,255,0.25); }\
    \
    #form-error {\
      display: none;\
      margin-top: 10px;\
      font-size: 12.5px; line-height: 1.45; color: #ff9a9a;\
      background: rgba(255,90,90,0.08);\
      border: 1px solid rgba(255,90,90,0.22);\
      border-radius: 9px; padding: 9px 11px;\
    }\
    #form-error.show { display: block; }\
    \
    #form-wrap { display: flex; flex-direction: column; flex: 1; }\
    #form-wrap.hidden { display: none; }\
    \
    /* ── Inline mode overrides ───────────────────────────────────────── */\
    :host([inline]) { display: block; }\
    :host([inline]) #bubble,\
    :host([inline]) #fab,\
    :host([inline]) #close-btn { display: none !important; }\
    :host([inline]) #panel {\
      all: unset; display: flex; flex-direction: column;\
      width: 100%; height: auto; max-height: none;\
      border-radius: 16px;\
      background: #181c27;\
      border: 1px solid rgba(255,255,255,0.08);\
      font-family: 'Inter', system-ui, -apple-system, sans-serif;\
      overflow: hidden;\
    }\
    :host([inline]) #body { max-height: none; }\
  ";

  /* ── Shadow DOM HTML template ───────────────────────────────────────── */
  var MAIL_SVG = '\
    <svg width=\"20\" height=\"20\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#0f1117\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\">\
      <rect x=\"2\" y=\"4\" width=\"20\" height=\"16\" rx=\"2\"/>\
      <path d=\"M22 4L12 13 2 4\"/>\
    </svg>\
  ';

  var MAIL_AVATAR_SVG = '\
    <svg width=\"15\" height=\"15\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#4fffb0\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\">\
      <rect x=\"2\" y=\"4\" width=\"20\" height=\"16\" rx=\"2\"/>\
      <path d=\"M22 4L12 13 2 4\"/>\
    </svg>\
  ';

  var CLOSE_SVG = '\
    <svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.5\" stroke-linecap=\"round\">\
      <line x1=\"18\" y1=\"6\" x2=\"6\" y2=\"18\"/><line x1=\"6\" y1=\"6\" x2=\"18\" y2=\"18\"/>\
    </svg>\
  ';

  var SEND_SVG = '\
    <svg width=\"15\" height=\"15\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#0f1117\" stroke-width=\"2.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\">\
      <line x1=\"22\" y1=\"2\" x2=\"11\" y2=\"13\"/><polygon points=\"22 2 15 22 11 13 2 9 22 2\"/>\
    </svg>\
  ';

  var CHECK_SVG = '\
    <svg width=\"22\" height=\"22\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#4fffb0\" stroke-width=\"2.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\">\
      <polyline points=\"20 6 9 17 4 12\"/>\
    </svg>\
  ';

  var TEMPLATE =
    "<style>" + CSS_TEXT + "</style>" +

    /* Speech bubble */
    '<div id="bubble">' +
      '<div id="bubble-arrow"></div>' +
      'Have a question or project in mind? Send me a message! 💬' +
    "</div>" +

    /* FAB */
    '<button id="fab" type="button" aria-label="Open contact form">' +
      '<span id="badge"></span>' +
      '<span id="fab-icon">' + MAIL_SVG + "</span>" +
    "</button>" +

    /* Panel */
    '<div id="panel" role="dialog" aria-modal="true" aria-label="Contact form">' +

      '<div id="header">' +
        '<div id="header-left">' +
          '<div id="avatar">' + MAIL_AVATAR_SVG + "</div>" +
          "<div>" +
            '<div id="header-name">Contact Halim</div>' +
            '<div id="header-status"><span id="status-dot"></span> Usually replies within a day</div>' +
          "</div>" +
        "</div>" +
        '<button id="close-btn" type="button" aria-label="Close contact form">' + CLOSE_SVG + "</button>" +
      "</div>" +

      '<div id="body">' +

        /* Success state */
        '<div id="success">' +
          '<div id="success-icon">' + CHECK_SVG + "</div>" +
          '<div id="success-title">Message sent</div>' +
          '<div id="success-desc">Thanks for reaching out! I\'ll get back to you as soon as possible.</div>' +
          '<button id="success-back" type="button">Send another message</button>' +
        "</div>" +

        /* Form */
        '<div id="form-wrap">' +
          '<div id="form-title">Get in touch</div>' +
          '<div id="form-desc">Tell me about your project, your team, or the AI integration you have in mind.</div>' +

          '<div class="field">' +
            '<label class="field-label" for="cw-name">Name</label>' +
            '<input class="field-input" id="cw-name" type="text" required placeholder="Your name" />' +
          "</div>" +

          '<div class="field">' +
            '<label class="field-label" for="cw-email">Email</label>' +
            '<input class="field-input" id="cw-email" type="email" required placeholder="you@example.com" />' +
          "</div>" +

          '<div class="field" style="flex:1;">' +
            '<label class="field-label" for="cw-message">Message</label>' +
            '<textarea class="field-input" id="cw-message" required rows="4" placeholder="Tell me about your project..."></textarea>' +
          "</div>" +

          '<div id="form-error" role="alert"></div>' +

          '<button id="submit-btn" type="button">' +
            'Send message ' + SEND_SVG +
          "</button>" +
        "</div>" +

      "</div>" +

    "</div>";

  /* ── Web Component — MUST use ES6 class to extend HTMLElement ───────── */
  class PortfolioContact extends HTMLElement {
    connectedCallback() {
      /* Guard: only initialise once even if moved in the DOM */
      if (this._initialised) return;
      this._initialised = true;

      const shadow = this.attachShadow({ mode: "open" });
      shadow.innerHTML = TEMPLATE;

      /* Element refs */
      this._fab      = shadow.getElementById("fab");
      this._badge    = shadow.getElementById("badge");
      this._bubble   = shadow.getElementById("bubble");
      this._panel    = shadow.getElementById("panel");
      this._closeBtn = shadow.getElementById("close-btn");

      this._name     = shadow.getElementById("cw-name");
      this._email    = shadow.getElementById("cw-email");
      this._message  = shadow.getElementById("cw-message");
      this._submitBtn = shadow.getElementById("submit-btn");
      this._formWrap = shadow.getElementById("form-wrap");
      this._error    = shadow.getElementById("form-error");
      this._success  = shadow.getElementById("success");
      this._backBtn  = shadow.getElementById("success-back");

      /* State */
      this._open = false;
      this._timer = null;

      /* Events */
      this._fab.addEventListener("click", () => this._toggle());
      this._closeBtn.addEventListener("click", () => this._closeForm());

      this._submitBtn.addEventListener("click", () => this._submit());
      this._backBtn.addEventListener("click", () => this._reset());

      /* Auto-resize textarea */
      this._message.addEventListener("input", () => this._autoResize());

      /* Enter to submit in textarea */
      this._message.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          this._submit();
        }
      });

      /* Show greeting bubble after a delay (only in floating mode).
       * The contact widget intentionally stays quiet — the chatbot already
       * greets the visitor, so set SHOW_GREETING_BUBBLE to true to re-enable. */
      if (SHOW_GREETING_BUBBLE && !this.hasAttribute("inline")) {
        setTimeout(() => {
          this._showGreetingBubble();
        }, 5000);
      }
    }

    disconnectedCallback() {
      if (this._timer) clearTimeout(this._timer);
      if (this._bubbleTimer) clearTimeout(this._bubbleTimer);
    }

    /* ── Show speech bubble for 8 seconds ──────────────────────────────── */
    _showGreetingBubble() {
      if (this._open) return;
      this._bubble.classList.add("show");
      this._bubbleTimer = setTimeout(() => {
        this._bubble.classList.remove("show");
      }, 8000);
    }

    _toggle() {
      if (this._open) this._closeForm(); else this._openForm();
    }

    _openForm() {
      this._open = true;
      this._bubble.classList.remove("show");
      if (this._bubbleTimer) clearTimeout(this._bubbleTimer);
      this._panel.classList.add("open");
      this._badge.classList.remove("show");
      setTimeout(() => {
        if (this._name) this._name.focus();
      }, 80);
    }

    _closeForm() {
      this._open = false;
      this._panel.classList.remove("open");
    }

    _autoResize() {
      this._message.style.height = "auto";
      this._message.style.height = this._message.scrollHeight + "px";
    }

    _setError(msg) {
      this._error.textContent = msg;
      this._error.classList.add("show");
    }

    _clearError() {
      this._error.textContent = "";
      this._error.classList.remove("show");
    }

    _submit() {
      const name = this._name.value.trim();
      const email = this._email.value.trim();
      const message = this._message.value.trim();

      this._clearError();

      if (!name || !email || !message) {
        this._setError("Please add your name, email and a message.");
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        this._setError("That email address doesn't look right.");
        return;
      }

      /* Disable button to prevent double-submit */
      this._submitBtn.disabled = true;
      this._submitBtn.textContent = "Sending...";

      var self = this;

      /* The Render instance sleeps when idle — allow time for a cold start,
       * then fail gracefully instead of leaving the button stuck. */
      var controller = new AbortController();
      var timer = setTimeout(function () {
        controller.abort();
      }, 45000);

      /* Posts to the ai-api backend, which emails the form via Resend. */
      fetch(API_BASE + "/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name, email: email, message: message }),
        signal: controller.signal,
      })
        .then(function (res) {
          if (!res.ok) throw new Error("HTTP " + res.status);
          return res.json();
        })
        .then(function (data) {
          if (!data || data.ok !== true) throw new Error("Unexpected response");
          clearTimeout(timer);
          self._message.value = "";
          self._formWrap.classList.add("hidden");
          self._success.classList.add("show");
        })
        .catch(function () {
          clearTimeout(timer);
          self._setError(
            "Sorry, your message couldn't be sent. Please try again in a moment.",
          );
        })
        .then(function () {
          self._submitBtn.disabled = false;
          self._submitBtn.innerHTML = "Send message " + SEND_SVG;
        });
    }

    _reset() {
      this._name.value = "";
      this._email.value = "";
      this._message.value = "";
      this._message.style.height = "auto";
      this._clearError();
      this._success.classList.remove("show");
      this._formWrap.classList.remove("hidden");
      setTimeout(() => this._name.focus(), 50);
    }
  }

  /* ── Register & mount ────────────────────────────────────────────────── */
  if (!customElements.get("portfolio-contact")) {
    customElements.define("portfolio-contact", PortfolioContact);
  }

  function mount() {
    /* Don't auto-mount floating widget if an inline instance exists */
    var inline = document.querySelector("portfolio-contact[inline]");
    if (!inline && !document.querySelector("portfolio-contact:not([inline])")) {
      var el = document.createElement("portfolio-contact");
      document.body.appendChild(el);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();