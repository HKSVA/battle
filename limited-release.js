(function () {
  "use strict";
  const config = window.CPB_LIMITED_RELEASE;
  if (!config) return;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const opensAt = Date.parse(config.opensAt);
  const isOpen = () => Date.now() >= opensAt;
  const registrationClosed = config.registrationClosed === true;
  const sessionSelect = $("#session");
  const form = $("#entry-form");
  const submit = form && $('button[type="submit"]', form);
  const apiEndpoint = (window.CB_REGISTRATION || {}).endpoint || "";
  const state = { availability: {} };

  function updateHero() {
    const navCta = $('.nav a.btn[href="#register"]');
    if (navCta) {
      navCta.textContent = registrationClosed ? "活動最新消息" : "查看尚有名額場次";
      navCta.href = registrationClosed ? "#battle-update" : "#register";
    }
    const actions = $(".hero-actions");
    if (actions) actions.innerHTML = registrationClosed
      ? '<a class="btn" href="https://www.instagram.com/cantopopfest" target="_blank" rel="noopener noreferrer">@cantopopfest ↗</a><a class="btn ghost" href="https://www.instagram.com/c_plus_music" target="_blank" rel="noopener noreferrer">@c_plus_music ↗</a><button class="btn ghost fest-open" type="button">CANTOPOPFEST</button>'
      : '<a class="btn release-scroll" href="#register">查看尚有名額場次 →</a><a class="btn secondary-download" href="#card-preview">下載選手卡 ↓</a><button class="btn ghost fest-open" type="button">CANTOPOPFEST</button>';
    const heroFestButton = actions ? $(".fest-open", actions) : null;
    if (heroFestButton) heroFestButton.addEventListener("click", () => {
      const modal = $("#fest-modal");
      if (!modal) return;
      modal.classList.add("open");
      document.body.classList.add("modal-open");
      $(".modal-close", modal)?.focus();
    });
    const heroCopy = $(".hero-copy");
    if (registrationClosed && heroCopy && !$("#battle-update")) {
      const update = document.createElement("div");
      update.className = "hero-update";
      update.id = "battle-update";
      update.innerHTML = '<strong>報名現已截止</strong><p>請大家繼續留意 <a href="https://www.instagram.com/cantopopfest" target="_blank" rel="noopener noreferrer">@cantopopfest</a> 活動專頁。11月即將於私家音樂 <a href="https://www.instagram.com/c_plus_music" target="_blank" rel="noopener noreferrer">@c_plus_music</a> 更新晉級者動向。</p><p>參賽者可於 <a href="https://hksva.com" target="_blank" rel="noopener noreferrer">hksva.com</a> 及 <a href="https://camforyou.co" target="_blank" rel="noopener noreferrer">camforyou.co</a> 使用優惠。</p>';
      actions ? actions.before(update) : heroCopy.append(update);
    }
    const sticky = $("#sticky-cta");
    if (sticky) {
      sticky.textContent = registrationClosed ? "報名已截止" : "查看尚有名額場次";
      if (registrationClosed) {
        sticky.hidden = true;
        sticky.setAttribute("aria-hidden", "true");
        sticky.style.setProperty("display", "none", "important");
      }
    }
  }

  function insertAnnouncement() {
    const hero = $(".hero");
    if (!hero || $("#limited-release")) return;
    const section = document.createElement("section");
    section.className = "release-announcement";
    section.id = "limited-release";
    section.innerHTML = registrationClosed
      ? '<div class="wrap"><div><p class="eyebrow">REGISTRATION UPDATE</p><h2>網上報名正式截止</h2><p class="english">REGISTRATION CLOSED</p><p>感謝各位支持《廣東歌唱擂台2026》！</p><p>所有已報名選手，請留意大會電郵及活動最新消息。</p></div><div><p class="eyebrow">WHAT’S NEXT</p><h3>繼續留意晉級者動向</h3><p>請留意 <a href="https://www.instagram.com/cantopopfest" target="_blank" rel="noopener noreferrer">@cantopopfest</a> 活動專頁。11月即將於私家音樂 <a href="https://www.instagram.com/c_plus_music" target="_blank" rel="noopener noreferrer">@c_plus_music</a> 更新晉級者動向。</p><p>參賽者可於 <a href="https://hksva.com" target="_blank" rel="noopener noreferrer">hksva.com</a> 及 <a href="https://camforyou.co" target="_blank" rel="noopener noreferrer">camforyou.co</a> 使用優惠。</p></div></div>'
      : '<div class="wrap"><div><p class="eyebrow">REGISTRATION UPDATE</p><h2>網上報名正式截止</h2><p class="english">FINAL ENTRIES NOW OPEN</p><p>感謝各位支持《廣東歌唱擂台2026》！</p><p>所有已報名選手，請留意電郵內的指定歌曲 MMO。如曾提出轉調要求，請務必回覆電郵確認。</p></div><div><p class="eyebrow">LIMITED RELEASE</p><h3>少量餘額・限定開放</h3><p class="english">LIMITED SPOTS AVAILABLE</p><p>因應個別場次尚有餘額，大會將分批開放少量報名名額，額滿即止。</p><p class="policy">限額報名選手須使用原調 MMO，不設轉調安排。</p><strong class="release-time">12 OCT 2026 · 3:00PM HKT</strong><a class="btn release-announcement-cta" href="#register"></a></div></div>';
    hero.insertAdjacentElement("afterend", section);
  }

  function updateReleaseGate() {
    if (registrationClosed) {
      if (submit) {
        submit.disabled = true;
        submit.title = "報名已截止";
      }
      return;
    }
    const open = isOpen();
    $$(".release-scroll, .release-announcement-cta").forEach(link => {
      link.textContent = open ? "查看尚有名額場次 →" : "10月12日下午3時開放";
      link.setAttribute("aria-disabled", String(!open));
      if (!open) link.addEventListener("click", event => event.preventDefault(), { once: true });
    });
    if (submit) {
      submit.disabled = !open;
      if (!open) submit.title = "10月12日下午3時開放";
    }
  }

  function updateFestivalModal() {
    const modal = $("#fest-modal .modal-box");
    if (!modal) return;
    const close = $(".modal-close", modal);
    modal.innerHTML = "";
    if (close) modal.append(close);
    const image = document.createElement("img");
    image.className = "fest-latest-image";
    image.src = "assets/cantopopfest-2026-home-banner-revised.png";
    image.alt = "廣東歌文化節2026率先登場活動海報";
    const copy = document.createElement("div");
    copy.className = "fest-latest-copy";
    copy.innerHTML = '<p class="eyebrow">CANTOPOP FEST 2026</p><h2 id="fest-title">廣東歌文化節2026 率先登場</h2><h3>J.Arie雷深如、Manson張進翹、Crystal張紋嘉於雙子匯揭開序幕</h3><h3>知名樂壇聲樂導師Guddy Chan 從擂台戰定義廣東歌標準</h3><h3 class="fest-lead">CANTOPOP BATTLE一連三日開戰　由唱一首歌走向擁有自己的作品</h3><p><strong>「廣東歌文化節2026 CANTOPOP FEST 2026」</strong> 將於 <strong>10月17日（星期六）中午12時</strong> 假 <strong>THE TWINS 雙子匯 II 地下中庭</strong> 率先登場，以「<strong>見證一首廣東歌，從這裡誕生</strong>」為主題，連結創作、歌唱、聲樂教育、音樂、劇場及舞台，呈現一首廣東歌由作品概念、聲音演繹，以至真正登上舞台的過程。</p><p>率先登場活動將邀得 <strong>J.Arie 雷深如、Manson 張進翹、Crystal 張紋嘉、Melissa 林若盈、網絡歌手Guitarchiling 及樂壇知名聲樂導師Guddy Chan</strong> 出席，並由電台DJ <strong>鄒攝</strong> 擔任主持。現場將設歌手分享、Live Performance、聲樂及歌曲演繹示範，同時揭開 <strong>CANTOPOP BATTLE 廣東歌唱擂台</strong> 一連三日賽事。</p><a class="btn ghost" href="https://www.instagram.com/cantopopfest" target="_blank" rel="noopener noreferrer">@cantopopfest ↗</a>';
    modal.append(image, copy);
  }

  function buildSessionCards() {
    if (registrationClosed) return;
    if (!sessionSelect || $("#session-card-grid")) return;
    sessionSelect.classList.add("session-select-source");
    const grid = document.createElement("div");
    grid.className = "session-card-grid";
    grid.id = "session-card-grid";
    grid.setAttribute("role", "radiogroup");
    grid.setAttribute("aria-label", "比賽場次");
    Object.keys(config.sessions).forEach(name => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "session-card";
      button.dataset.session = name;
      button.innerHTML = `<strong>${name}</strong><span>讀取名額中…</span>`;
      button.addEventListener("click", () => {
        if (button.disabled) return;
        sessionSelect.value = name;
        sessionSelect.dispatchEvent(new Event("change", { bubbles: true }));
        renderSessionCards();
      });
      grid.append(button);
    });
    sessionSelect.insertAdjacentElement("afterend", grid);
    sessionSelect.addEventListener("change", renderSessionCards);
  }

  function remainingFor(name) {
    const item = config.sessions[name];
    if (!item || !item.open) return null;
    const backendRemaining = state.availability[name];
    if (!Number.isFinite(backendRemaining)) return null;
    const registrationsSinceRelease = Math.max(0, item.baselineBackendRemaining - backendRemaining);
    const currentRegistrations = item.existingRegistrations + registrationsSinceRelease;
    return Math.max(0, item.releaseLimit - currentRegistrations);
  }

  function renderSessionCards() {
    const openNow = isOpen();
    $$(".session-card").forEach(card => {
      const name = card.dataset.session;
      const item = config.sessions[name];
      const remaining = remainingFor(name);
      const status = $("span", card);
      let disabled = !openNow || !item.open;
      if (!openNow) status.textContent = "10月12日下午3時開放";
      else if (!item.open) status.textContent = "不接受報名";
      else if (remaining === null) status.textContent = "暫未能取得即時名額";
      else if (remaining === 0) { status.textContent = "本輪名額已滿"; disabled = true; }
      else status.textContent = `尚餘 ${remaining} 席`;
      card.disabled = disabled || remaining === null;
      card.classList.toggle("is-selected", sessionSelect.value === name);
      card.setAttribute("aria-checked", String(sessionSelect.value === name));
      const option = [...sessionSelect.options].find(entry => entry.value === name);
      if (option) option.disabled = card.disabled;
      if (card.disabled && sessionSelect.value === name) sessionSelect.value = "";
    });
  }

  async function refreshAvailability() {
    if (!apiEndpoint) { renderSessionCards(); return; }
    try {
      const response = await fetch(apiEndpoint, { method: "GET", cache: "no-store" });
      const data = await response.json();
      if (!data.ok || !Array.isArray(data.sessions)) throw new Error("availability unavailable");
      state.availability = Object.fromEntries(data.sessions.map(item => [item.session, Number(item.remaining)]));
    } catch (error) {
      state.availability = {};
    }
    renderSessionCards();
  }

  function addMmoConsent() {
    if (registrationClosed) return;
    const checks = $(".checks", form);
    if (!checks || $('[name="originalKeyConsent"]', checks)) return;
    const policy = document.createElement("div");
    policy.className = "limited-mmo-policy";
    policy.innerHTML = '<strong>限額報名音樂安排</strong><span>限額報名選手須使用原調 MMO，不設轉調安排。</span>';
    checks.insertAdjacentElement("beforebegin", policy);
    const label = document.createElement("label");
    label.className = "check";
    label.innerHTML = '<input type="checkbox" name="originalKeyConsent" required><span>我已了解並同意使用大會提供之原調 MMO，不設轉調安排。*</span>';
    checks.prepend(label);
    $$(".field", form).forEach(field => {
      if (/轉調|transpose|key change/i.test(field.textContent)) field.hidden = true;
    });
    const statement = $("#statement", form);
    if (statement) statement.maxLength = 20;
  }

  function guardSubmission() {
    if (!form) return;
    form.addEventListener("submit", event => {
      if (registrationClosed) {
        event.preventDefault();
        event.stopImmediatePropagation();
        const status = $("#form-status");
        if (status) status.textContent = "網上報名已截止。";
        return;
      }
      const item = config.sessions[sessionSelect.value];
      const remaining = remainingFor(sessionSelect.value);
      if (!isOpen() || !item || !item.open || remaining === null || remaining <= 0) {
        event.preventDefault();
        event.stopImmediatePropagation();
        const status = $("#form-status");
        if (status) status.textContent = !isOpen() ? "限額報名將於10月12日下午3時開放。" : "請選擇尚有名額的場次。";
      }
    }, true);
  }

  function closeRegistrationForm() {
    if (!registrationClosed) return;
    const register = $("#register");
    if (!register) return;
    const title = $(".section-head h2", register);
    const lede = $(".section-head .lede", register);
    if (title) title.innerHTML = '報名已截止<span>REGISTRATION CLOSED</span>';
    if (lede) lede.textContent = "感謝各位參賽者支持，現時不再接受新報名。";
    const grid = $(".register-grid", register);
    if (grid) {
      grid.hidden = true;
      grid.style.setProperty("display", "none", "important");
    }
    if (!$(".registration-closed-panel", register)) {
      const panel = document.createElement("div");
      panel.className = "registration-closed-panel";
      panel.innerHTML = '<p class="kicker">REGISTRATION CLOSED</p><h3>網上報名已截止</h3><p>請繼續留意 <a href="https://www.instagram.com/cantopopfest" target="_blank" rel="noopener noreferrer">@cantopopfest</a> 活動專頁及私家音樂 <a href="https://www.instagram.com/c_plus_music" target="_blank" rel="noopener noreferrer">@c_plus_music</a> 的晉級者動向。</p>';
      $(".wrap", register).append(panel);
    }
    $$("input, select, textarea, button", form).forEach(control => { control.disabled = true; });
    const style = document.createElement("style");
    style.textContent = '.hero-update{margin:24px 0 0;max-width:760px;padding:20px 22px;border-left:3px solid var(--green);background:#03100dcf;backdrop-filter:blur(8px)}.hero-update strong{display:block;color:var(--green);font:700 22px/1.2 Oswald,"Noto Sans TC",sans-serif;letter-spacing:.04em}.hero-update p{margin:9px 0 0;color:#dbe8e7;line-height:1.65}.hero-update a,.release-announcement a,.registration-closed-panel a{color:var(--green);text-decoration:underline;text-underline-offset:3px}.registration-closed-panel{padding:clamp(32px,6vw,70px);border:1px solid var(--line);background:linear-gradient(135deg,#071218,#03100d)}.registration-closed-panel h3{margin:0 0 14px;font-size:clamp(32px,5vw,58px)}.registration-closed-panel p:last-child{max-width:760px;color:#c2d1d0;font-size:18px;line-height:1.8}@media(max-width:700px){.hero-update{padding:17px}.hero-update strong{font-size:19px}}';
    document.head.append(style);
  }

  updateHero();
  insertAnnouncement();
  updateFestivalModal();
  buildSessionCards();
  addMmoConsent();
  guardSubmission();
  closeRegistrationForm();
  updateReleaseGate();
  if (!registrationClosed) {
    refreshAvailability();
    setInterval(refreshAvailability, 60000);
  }
})();
