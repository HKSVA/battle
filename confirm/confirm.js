(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const endpoint = window.CB_REGISTRATION && window.CB_REGISTRATION.endpoint;
  const state = { sessionToken: '', contestant: null, assignments: null, response: null, performance: null, pending: null };
  const labels = {
    workshop: {'14 NOV':'14 NOV｜5:00–7:00 PM','15 NOV':'15 NOV｜5:00–7:00 PM','BOTH':'BOTH DATES OK｜兩日均可，由大會安排','UNAVAILABLE':'UNAVAILABLE｜兩日均無法出席'},
    qualifying: {'SESSION A':'SESSION A｜2:00–4:30 PM','SESSION B':'SESSION B｜4:30–7:30 PM','BOTH':'BOTH SESSIONS OK｜兩個時段均可，由大會安排','UNAVAILABLE':'UNAVAILABLE｜兩個時段均無法出席'},
    consent: {YES:'願意／同意',NO:'暫不同意／不參與'},
    workshopAssigned: {'14 NOV 5PM':'14 NOV · 5:00PM','15 NOV 5PM':'15 NOV · 5:00PM','15 NOV 6PM':'15 NOV · 6:00PM','14 NOV':'14 NOV · 5:00PM','15 NOV':'15 NOV · 請留意大會通知','UNAVAILABLE':'未能出席'},
    qualifyingAssigned: {'SESSION A':'SESSION A · 2:00–4:30PM','SESSION B':'SESSION B · 4:30–7:30PM','UNAVAILABLE':'未能出席'}
  };

  function setStatus(element, message, success = false) {
    element.textContent = message || '';
    element.classList.toggle('show', Boolean(message));
    element.classList.toggle('success', success);
  }
  async function request(payload, timeoutMs = 20000) {
    if (!endpoint) throw new Error('確認系統尚未設定，請聯絡主辦單位。');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(endpoint, {method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(payload),signal:controller.signal});
      const data = await response.json();
      if (!data.ok) throw new Error(data.message || '未能完成操作，請稍後再試。');
      return data;
    } catch (error) {
      if (error.name === 'AbortError') throw new Error('連線逾時，請稍後再試。');
      throw error;
    } finally { clearTimeout(timeout); }
  }
  function setBusy(button, busy, label) {
    if (!button.dataset.label) button.dataset.label = button.textContent;
    button.disabled = busy;button.textContent = busy ? label : button.dataset.label;
  }
  function selected(name) { const input = document.querySelector(`input[name="${name}"]:checked`);return input ? input.value : ''; }
  function select(name, value) { const input = document.querySelector(`input[name="${name}"][value="${CSS.escape(value || '')}"]`);if (input) input.checked = true; }
  function currentValues() { return {workshop:selected('workshop'),qualifying:selected('qualifying'),specialRemarks:$('#special-remarks').value.trim(),camForYouConsent:selected('camForYouConsent'),cPlusMusicFilmingConsent:selected('cPlusMusicFilmingConsent')}; }
  function fillResponse(response) {
    if (!response) return;
    select('workshop', response.workshop);select('qualifying', response.qualifying);select('camForYouConsent', response.camForYouConsent);select('cPlusMusicFilmingConsent', response.cPlusMusicFilmingConsent);
    $('#special-remarks').value = response.specialRemarks || '';updateRemarksCount();
  }
  function summaryHtml(values) {
    const items = [
      ['Guddy 備戰課', labels.workshop[values.workshop] || '—'],
      ['資格賽時段', labels.qualifying[values.qualifying] || '—'],
      ['CamForYou 電郵分享', labels.consent[values.camForYouConsent] || '—'],
      ['c_plus_music 拍攝意向', labels.consent[values.cPlusMusicFilmingConsent] || '—']
    ];
    if (values.specialRemarks) items.push(['特殊時間安排', values.specialRemarks]);
    return items.map(([key,value]) => `<div><small>${escapeHtml(key)}</small><strong>${escapeHtml(value)}</strong></div>`).join('');
  }
  function escapeHtml(value) { const node = document.createElement('span');node.textContent = String(value);return node.innerHTML; }
  function updateRemarksCount() { $('#remarks-count').textContent = Array.from($('#special-remarks').value).length; }
  function normalizeWorkshopAssignment(value) {
    const raw=String(value||'').trim();
    if(!raw||labels.workshopAssigned[raw])return raw;
    const parsed=new Date(raw);
    if(!Number.isNaN(parsed.getTime())){
      const parts=Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Hong_Kong',day:'numeric',month:'short',hour:'numeric',minute:'2-digit',hour12:true}).formatToParts(parsed).map(part=>[part.type,part.value]));
      const minute=parts.minute==='00'?'':`:${parts.minute}`;
      return `${Number(parts.day)} ${String(parts.month).toUpperCase()} ${parts.hour}${minute}${String(parts.dayPeriod).toUpperCase()}`;
    }
    return raw.toUpperCase().replace(/\s+/g,' ');
  }
  function showAssignments(assignments) {
    const current=assignments||{};
    const workshop=normalizeWorkshopAssignment(current.workshop);
    $('#assigned-workshop').textContent=labels.workshopAssigned[workshop]||'尚待大會編排';
    $('#assigned-qualifying').textContent=labels.qualifyingAssigned[current.qualifying]||'尚待大會編排';
  }
  function fillPerformance(performance) {
    $('#performance-song').value=performance&&performance.songTitle||'';
    $('#filming-17nov').value=performance&&performance.filming17NovInterest||'';
    $('#performance-file').value='';
    const status=$('#performance-upload-state');
    if(performance&&performance.hasUpload){
      status.textContent=`已提交：${performance.songTitle}｜${performance.fileName}`;
      status.classList.add('complete');
    }else{
      status.textContent='尚未提交歌曲及 MP3。';
      status.classList.remove('complete');
    }
  }
  function fileToPayload(file) {
    return new Promise((resolve,reject)=>{
      if(!file)return resolve(null);
      if(!/\.mp3$/i.test(file.name)||file.size>10*1024*1024){reject(new Error('請選擇不超過10 MB的 MP3 檔案。'));return;}
      const reader=new FileReader();
      reader.onerror=()=>reject(new Error('未能讀取 MP3，請重新選擇檔案。'));
      reader.onload=()=>{
        const result=String(reader.result||''),comma=result.indexOf(',');
        if(comma<0){reject(new Error('未能讀取 MP3，請重新選擇檔案。'));return;}
        resolve({name:file.name,mime:'audio/mpeg',base64:result.slice(comma+1)});
      };
      reader.readAsDataURL(file);
    });
  }
  function showApp(data) {
    state.sessionToken = data.sessionToken;state.contestant = data.contestant;state.assignments=data.assignments||{};state.response = data.response;state.performance=data.performance||null;
    $('#contestant-name').textContent = data.contestant.name;$('#contestant-number').textContent = data.contestant.contestantNumber;
    showAssignments(state.assignments);fillPerformance(state.performance);fillResponse(data.response);$('#login-panel').hidden = true;$('#confirmation-app').hidden = false;$('#review-panel').hidden = true;$('#success-panel').hidden = true;
    window.scrollTo({top:0,behavior:'smooth'});
  }
  function logout() {
    state.sessionToken='';state.contestant=null;state.assignments=null;state.response=null;state.performance=null;state.pending=null;
    $('#performance-form').reset();$('#confirmation-form').reset();$('#login-form').reset();fillPerformance(null);updateRemarksCount();
    $('#confirmation-app').hidden=true;$('#review-panel').hidden=true;$('#success-panel').hidden=true;$('#login-panel').hidden=false;
    setStatus($('#login-status'),'');$('#registration-id').focus();window.scrollTo({top:0,behavior:'smooth'});
  }

  $('#login-form').addEventListener('submit', async event => {
    event.preventDefault();const form=event.currentTarget,button=form.querySelector('button[type="submit"]');setStatus($('#login-status'),'');
    if (!form.checkValidity()) { form.reportValidity();return; }
    setBusy(button,true,'核對中…');
    try { showApp(await request({action:'round2Login',registrationId:$('#registration-id').value,phone:$('#phone').value})); }
    catch (error) { setStatus($('#login-status'),error.message); }
    finally { setBusy(button,false); }
  });
  $('#performance-file').addEventListener('change',event=>{
    const file=event.currentTarget.files[0],status=$('#performance-upload-state');
    if(!file){fillPerformance(state.performance);return;}
    status.textContent=`準備上載：${file.name}（${(file.size/1024/1024).toFixed(1)} MB）`;
    status.classList.remove('complete');
  });
  $('#performance-form').addEventListener('submit',async event=>{
    event.preventDefault();const form=event.currentTarget,button=$('#performance-submit');setStatus($('#performance-status'),'');
    if(!form.checkValidity()){form.reportValidity();return;}
    const songTitle=$('#performance-song').value,filming17NovInterest=$('#filming-17nov').value,file=$('#performance-file').files[0]||null;
    if(!file&&!state.performance){setStatus($('#performance-status'),'首次提交必須選擇2分鐘 MMO MP3。');return;}
    if(!file&&state.performance&&state.performance.songTitle!==songTitle){setStatus($('#performance-status'),'更改歌曲時必須重新上載對應的2分鐘 MMO MP3。');return;}
    setBusy(button,true,'上載及提交中…');
    try{
      const payload=await fileToPayload(file);
      const result=await request({action:'round2PerformanceSubmit',sessionToken:state.sessionToken,songTitle,filming17NovInterest,file:payload},90000);
      state.performance=result.performance;state.assignments=result.assignments||state.assignments;showAssignments(state.assignments);fillPerformance(state.performance);
      setStatus($('#performance-status'),'歌曲、拍攝意願及2分鐘 MMO 已成功提交。',true);
    }catch(error){setStatus($('#performance-status'),error.message);}
    finally{setBusy(button,false);}
  });
  $('#special-remarks').addEventListener('input',updateRemarksCount);
  $('#confirmation-form').addEventListener('submit', event => {
    event.preventDefault();const form=event.currentTarget;setStatus($('#form-status'),'');
    if (!form.checkValidity()) { form.reportValidity();setStatus($('#form-status'),'請完成所有必填選項。');return; }
    state.pending=currentValues();$('#review-summary').innerHTML=summaryHtml(state.pending);$('#confirmation-app').hidden=true;$('#review-panel').hidden=false;$('#review-panel').scrollIntoView({behavior:'smooth',block:'start'});
  });
  $('#back-to-form').addEventListener('click',()=>{$('#review-panel').hidden=true;$('#confirmation-app').hidden=false;window.scrollTo({top:0,behavior:'smooth'});});
  $('#submit-confirmation').addEventListener('click',async event=>{
    const button=event.currentTarget;setStatus($('#submit-status'),'');setBusy(button,true,'提交中…');
    try {
      const result=await request({action:'round2Submit',sessionToken:state.sessionToken,...state.pending});state.response=result.response;
      $('#review-panel').hidden=true;$('#success-summary').innerHTML=summaryHtml(result.response);$('#updated-at').textContent=result.response.updatedAt?`最後更新：${new Date(result.response.updatedAt).toLocaleString('zh-HK',{timeZone:'Asia/Hong_Kong'})} HKT`:'';
      $('#success-panel').hidden=false;$('#success-panel').scrollIntoView({behavior:'smooth',block:'start'});
    } catch(error) { setStatus($('#submit-status'),error.message); }
    finally { setBusy(button,false); }
  });
  $('#edit-response').addEventListener('click',()=>{$('#success-panel').hidden=true;fillResponse(state.response);$('#confirmation-app').hidden=false;window.scrollTo({top:0,behavior:'smooth'});});
  $('#logout').addEventListener('click',logout);$('#success-logout').addEventListener('click',logout);
})();
