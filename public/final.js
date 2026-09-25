(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));

  const menu = $('.menu-toggle');
  const nav = $('.nav');
  menu?.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    menu.setAttribute('aria-expanded', String(open));
    menu.textContent = open ? 'CLOSE' : 'MENU';
  });
  $$('.nav a, .nav button').forEach(element => element.addEventListener('click', () => {
    nav?.classList.remove('open');
    menu?.setAttribute('aria-expanded', 'false');
    if (menu) menu.textContent = 'MENU';
  }));

  const openModal = selector => {
    const modal = $(selector);
    if (!modal) return;
    modal.classList.add('open');
    document.body.classList.add('modal-open');
    $('.modal-close', modal)?.focus();
  };
  const closeModal = modal => {
    modal.classList.remove('open');
    if (!$('.modal.open')) document.body.classList.remove('modal-open');
  };
  $$('.fest-open').forEach(element => element.addEventListener('click', () => openModal('#fest-modal')));
  $$('.terms-open').forEach(element => element.addEventListener('click', event => { event.preventDefault(); openModal('#terms-modal'); }));
  $$('.privacy-open').forEach(element => element.addEventListener('click', event => { event.preventDefault(); openModal('#privacy-modal'); }));
  $$('.modal').forEach(modal => {
    $('.modal-close', modal)?.addEventListener('click', () => closeModal(modal));
    modal.addEventListener('click', event => { if (event.target === modal) closeModal(modal); });
  });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') $$('.modal.open').forEach(closeModal); });

  const datesSubhead = $('.dates .section-head h2 span');
  if (datesSubhead) datesSubhead.textContent = 'IMPORTANT DATES';
  const awardHeadline = $('.award h3');
  if (awardHeadline && !$('.award-lead')) awardHeadline.insertAdjacentHTML('beforebegin', '<p class="award-lead">你爭取的不只是一個名次。</p>');
  const golden = $('.golden');
  if (golden && !$('.golden-badge', golden)) golden.insertAdjacentHTML('afterbegin', '<span class="golden-badge">最多2個</span>');

  const partnerAssets = [
    [['campaign-logo.png'], '2026 廣東歌文化節'],
    [['sva-logo-final.png'], 'SVA'],
    [['the-twins-logo-white.png', 'parsons-music-logo-white.png'], 'THE TWINS、Parsons Music'],
    [['onevent-logo-final.png'], 'ONEVENT PRODUCTIONS'],
    [['portal-music-white.png'], 'PORTAL 212、PORTAL Music'],
    [['sva-logo-final.png', 'parsons-music-logo-white.png', 'jumper-logo.png'], 'SVA、Parsons Music、JUMPER']
  ];
  $$('.partner-group').forEach((group, index) => {
    const [files, label] = partnerAssets[index] || [[], ''];
    const logoRow = document.createElement('div');
    logoRow.className = 'partner-group-logos';
    logoRow.setAttribute('aria-label', label);
    logoRow.innerHTML = files.map(file => `<img src="assets/${file}" alt="${escapeHtml(label)}">`).join('');
    $('h3', group)?.after(logoRow);
  });

  const form = $('#entry-form');
  const originalGrid = $('.form-grid', form);
  const statementField = document.createElement('div');
  statementField.className = 'field full';
  statementField.innerHTML = '<label for="statement">如果我贏到一首歌，我會：*</label><textarea id="statement" name="statement" maxlength="20" required></textarea><small>最多20字 · <span id="statement-count">0</span>/20</small>';
  $('#photo', form).closest('.field').before(statementField);

  const makeStage = (label, className) => {
    const stage = document.createElement('fieldset');
    stage.className = `form-stage ${className}`;
    stage.innerHTML = `<legend>${label}</legend><div class="form-stage-grid"></div>`;
    return stage;
  };
  const profileStage = makeStage('YOUR PROFILE', 'profile-stage');
  const battleStage = makeStage('YOUR BATTLE', 'battle-stage');
  const paymentStage = makeStage('PAYMENT', 'payment-stage');
  const consentStage = makeStage('CONSENT & SUBMIT', 'consent-stage');
  originalGrid.before(profileStage, battleStage, paymentStage, consentStage);
  ['#name-zh','#name-en','#email','#phone','#ig','#statement','#photo'].forEach(selector => $(selector, form).closest('.field') && $('.form-stage-grid', profileStage).append($(selector, form).closest('.field')));
  ['#session','#soul','#rock'].forEach(selector => $('.form-stage-grid', battleStage).append($(selector, form).closest('.field')));
  $('.form-stage-grid', paymentStage).append($('.payment', form), $('#proof', form).closest('.field'));
  const agreement = document.createElement('p');
  agreement.className = 'agreement';
  agreement.textContent = '提交報名即表示你已閱讀並同意參賽條款及私隱收集聲明。';
  const formNote = $$(':scope > p', form)[0];
  $('.form-stage-grid', consentStage).append($('.checks', form), agreement);
  if (formNote) $('.form-stage-grid', consentStage).append(formNote);
  $('.form-stage-grid', consentStage).append($('button[type="submit"]', form), $('#form-status', form));
  originalGrid.remove();

  const previewToggle = $('#preview-toggle');
  const preview = $('#card-preview');
  previewToggle?.addEventListener('click', () => {
    const open = preview.classList.toggle('mobile-open');
    previewToggle.setAttribute('aria-expanded', String(open));
    previewToggle.textContent = open ? 'HIDE CONTESTANT CARD PREVIEW' : 'PREVIEW YOUR CONTESTANT CARD';
  });

  const fields = {
    nameZh: $('#name-zh'), nameEn: $('#name-en'), instagram: $('#ig'), statement: $('#statement'),
    session: $('#session'), soul: $('#soul'), rock: $('#rock'), photo: $('#photo')
  };
  const card = {
    nameEn: $('#card-name-en'), nameZh: $('#card-name-zh'), instagram: $('#card-ig'), statement: $('#card-statement'),
    session: $('#card-session'), soul: $('#card-soul'), rock: $('#card-rock'), photo: $('#photo-preview')
  };
  const state = { photoUrl: '', contestantNumber: '001' };
  const sessionLabel = () => fields.session.value ? `OPEN BATTLE｜${fields.session.value.replace(' · ', '｜')}` : 'OPEN BATTLE｜選擇場次';
  const syncCard = () => {
    card.nameEn.textContent = fields.nameEn.value.trim() || fields.nameZh.value.trim() || 'DISPLAY NAME';
    card.nameZh.textContent = fields.nameZh.value.trim() || '中文名';
    const instagram = fields.instagram.value.trim();
    card.instagram.textContent = instagram ? (instagram.startsWith('@') ? instagram : `@${instagram}`) : '';
    card.instagram.hidden = !instagram;
    card.statement.textContent = fields.statement.value.trim() || '你的答案會顯示在這裡';
    card.session.textContent = sessionLabel();
    card.soul.textContent = fields.soul.value || '請選擇歌曲';
    card.rock.textContent = fields.rock.value || '請選擇歌曲';
    $('#statement-count').textContent = [...fields.statement.value].length;
    saveDraft();
  };
  const saveDraft = () => {
    try {
      localStorage.setItem('cpb2026-draft', JSON.stringify({
        nameZh: fields.nameZh.value, nameEn: fields.nameEn.value, instagram: fields.instagram.value,
        statement: fields.statement.value, session: fields.session.value, soul: fields.soul.value,
        rock: fields.rock.value, photoUrl: state.photoUrl
      }));
    } catch (_) {}
  };
  form.addEventListener('input', syncCard);
  form.addEventListener('change', syncCard);
  fields.photo.addEventListener('change', () => {
    const file = fields.photo.files[0];
    if (!file?.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => { state.photoUrl = reader.result; card.photo.src = state.photoUrl; card.photo.hidden = false; saveDraft(); };
    reader.readAsDataURL(file);
  });
  try {
    const draft = JSON.parse(localStorage.getItem('cpb2026-draft') || '{}');
    ['nameZh','nameEn','instagram','statement','session','soul','rock'].forEach(key => { if (draft[key]) fields[key].value = draft[key]; });
    if (draft.photoUrl) { state.photoUrl = draft.photoUrl; card.photo.src = draft.photoUrl; card.photo.hidden = false; }
  } catch (_) {}
  syncCard();

  const reportTime = () => fields.session.value.includes('1:00') ? '12:30PM 前' : '5:30PM 前';
  form.addEventListener('submit', event => {
    event.preventDefault();
    const status = $('#form-status');
    fields.statement.setCustomValidity([...fields.statement.value].length > 20 ? '最多20字' : '');
    if (!form.checkValidity()) {
      form.reportValidity();
      status.textContent = '請完成所有必填資料及同意項目。';
      status.classList.add('show');
      return;
    }
    $('#submitted').innerHTML = [
      ['參賽者', [fields.nameEn.value, fields.nameZh.value].filter(Boolean).join(' / ')],
      ['比賽場次', fields.session.value], ['報到時間', reportTime()],
      ['CANTOPOP SOUL', fields.soul.value], ['CANTOPOP ROCK', fields.rock.value]
    ].map(([label, value]) => `<div><small>${escapeHtml(label)}</small><br><strong>${escapeHtml(value)}</strong></div>`).join('');
    status.textContent = '報名資料已記錄。付款核實後，大會將以電郵確認正式參賽名額。';
    status.classList.add('show');
    $('#success').classList.add('show');
    $('#success').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  const loadImage = source => new Promise((resolve, reject) => { const image = new Image(); image.onload = () => resolve(image); image.onerror = reject; image.src = source; });
  const drawCover = (context, image, x, y, width, height) => {
    const scale = Math.max(width / image.width, height / image.height);
    const sourceWidth = width / scale, sourceHeight = height / scale;
    context.drawImage(image, (image.width - sourceWidth) / 2, (image.height - sourceHeight) / 2, sourceWidth, sourceHeight, x, y, width, height);
  };
  const fitText = (context, text, maximumWidth, initialSize, family = '"Noto Sans TC", sans-serif') => {
    let size = initialSize;
    do { context.font = `700 ${size}px ${family}`; size -= 2; } while (context.measureText(text).width > maximumWidth && size > 22);
    return size + 2;
  };
  async function downloadCard() {
    const canvas = $('#export-canvas');
    const context = canvas.getContext('2d');
    const background = context.createLinearGradient(0, 0, 1080, 1350);
    background.addColorStop(0, '#06131b'); background.addColorStop(1, '#010405');
    context.fillStyle = background; context.fillRect(0, 0, 1080, 1350);
    const foil = context.createLinearGradient(0, 0, 1080, 1350);
    [['#63dcb0',0],['#d8ffff',.25],['#20bfe8',.5],['#7e79ae',.74],['#b9d98c',1]].forEach(([color, stop]) => foil.addColorStop(stop, color));
    context.strokeStyle = foil; context.lineWidth = 16; context.beginPath(); context.roundRect(18, 18, 1044, 1314, 45); context.stroke();
    try { context.drawImage(await loadImage('assets/battle-logo-official.png'), 75, 42, 520, 170); } catch (_) {}
    if (state.photoUrl) { try { drawCover(context, await loadImage(state.photoUrl), 42, 205, 996, 720); } catch (_) {} } else { context.fillStyle = '#07151b'; context.fillRect(42, 205, 996, 720); }
    const fade = context.createLinearGradient(0, 610, 0, 980); fade.addColorStop(0, 'transparent'); fade.addColorStop(1, '#020607'); context.fillStyle = fade; context.fillRect(42, 610, 996, 380);
    const displayName = fields.nameEn.value || fields.nameZh.value || 'DISPLAY NAME';
    context.fillStyle = '#fff'; context.font = `700 ${fitText(context, displayName, 820, 70, 'Oswald, sans-serif')}px Oswald, sans-serif`; context.fillText(displayName, 72, 835);
    const secondaryName = [fields.nameZh.value || '中文名', fields.instagram.value ? (fields.instagram.value.startsWith('@') ? fields.instagram.value : `@${fields.instagram.value}`) : ''].filter(Boolean).join('  |  ');
    context.font = '700 38px "Noto Sans TC", sans-serif'; context.fillText(secondaryName, 72, 890);
    context.fillStyle = '#b8cbca'; context.font = '500 21px "Noto Sans TC", sans-serif'; context.fillText('如果我贏到一首歌，我會：', 72, 935);
    context.fillStyle = '#fff'; context.font = '700 28px "Noto Sans TC", sans-serif'; context.fillText(fields.statement.value || '你的答案會顯示在這裡', 72, 974);
    const drawSong = (x, color, title, value) => {
      context.fillStyle = '#02090bee'; context.fillRect(x, 1010, 456, 150);
      context.strokeStyle = color; context.lineWidth = 3; context.strokeRect(x, 1010, 456, 150);
      context.fillStyle = color; context.font = '600 20px Oswald, "Noto Sans TC"'; context.fillText(title, x + 20, 1050);
      context.fillStyle = '#fff'; context.font = `700 ${fitText(context, value || '請選擇歌曲', 410, 25)}px "Noto Sans TC"`; context.fillText(value || '請選擇歌曲', x + 20, 1112);
    };
    drawSong(60, '#36f27a', '細緻靈魂｜CANTOPOP SOUL', fields.soul.value);
    drawSong(564, '#00d8ff', '力量搖滾｜CANTOPOP ROCK', fields.rock.value);
    context.textAlign = 'center'; context.fillStyle = '#fff'; context.font = '600 25px Oswald, "Noto Sans TC"'; context.fillText(sessionLabel(), 540, 1242);
    context.fillStyle = '#8fa6a8'; context.font = '500 16px Oswald'; context.fillText(`NO.${state.contestantNumber}`, 540, 1285); context.textAlign = 'left';
    const link = document.createElement('a'); link.download = `CANTOPOP-BATTLE-2026-${state.contestantNumber}.jpg`; link.href = canvas.toDataURL('image/jpeg', .95); link.click();
  }
  $('#download-card').addEventListener('click', downloadCard);
  $('#success-download').addEventListener('click', downloadCard);

  const sticky = $('#sticky-cta');
  if (sticky && 'IntersectionObserver' in window) {
    const visible = new Set();
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => entry.isIntersecting ? visible.add(entry.target) : visible.delete(entry.target));
      const hidden = visible.size > 0;
      sticky.classList.toggle('is-hidden', hidden); sticky.setAttribute('aria-hidden', String(hidden)); sticky.tabIndex = hidden ? -1 : 0;
    }, { threshold: .05 });
    [$('#register'), $('.partners'), $('.footer')].filter(Boolean).forEach(element => observer.observe(element));
  }
})();
