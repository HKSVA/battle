(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const endpoint = window.CB_REGISTRATION && window.CB_REGISTRATION.endpoint;
  const state = { sessionToken: '', contestant: null, assignments: null, performance: null };
  const labels = {
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
    state.sessionToken = data.sessionToken;state.contestant = data.contestant;state.assignments=data.assignments||{};state.performance=data.performance||null;
    $('#contestant-name').textContent = data.contestant.name;$('#contestant-number').textContent = data.contestant.contestantNumber;
    showAssignments(state.assignments);fillPerformance(state.performance);$('#login-panel').hidden = true;$('#confirmation-app').hidden = false;
    window.scrollTo({top:0,behavior:'smooth'});
  }
  function logout() {
    state.sessionToken='';state.contestant=null;state.assignments=null;state.performance=null;
    $('#performance-form').reset();$('#login-form').reset();fillPerformance(null);
    $('#confirmation-app').hidden=true;$('#login-panel').hidden=false;
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
  $('#logout').addEventListener('click',logout);
})();
