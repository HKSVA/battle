/** Bound to the master Sheet. Configure Script Properties; never put credentials in public JS. */
function cfg_(){const p=PropertiesService.getScriptProperties().getProperties();['SPREADSHEET_ID','PHOTO_FOLDER_ID','PAYMENT_FOLDER_ID','MMO_FOLDER_ID','REPLY_TO','STAFF_EMAILS','OPEN_AT'].forEach(k=>{if(!p[k])fail_('NOT_CONFIGURED','報名服務尚未開放。');});return p;}
function sheet_(){const c=cfg_(),s=SpreadsheetApp.openById(c.SPREADSHEET_ID).getSheetByName(c.SHEET_NAME||'Registrations');if(!s)fail_('NOT_CONFIGURED','報名服務尚未開放。');const h=s.getRange(1,1,1,CB.headers.length).getValues()[0];if(h.join('|')!==CB.headers.join('|'))fail_('SCHEMA','資料表欄位需要管理員檢查。');return s;}
function rows_(s){if(s.getLastRow()<2)return[];return s.getRange(2,1,s.getLastRow()-1,CB.headers.length).getValues().map((a,i)=>{const r={_row:i+2};CB.headers.forEach((h,j)=>r[h]=a[j]);return r;});}
function put_(s,r,key,value){s.getRange(r._row,CB.headers.indexOf(key)+1).setValue(sheetText_(value));r[key]=value;}
function hash_(s){return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,s).map(b=>('0'+((b+256)%256).toString(16)).slice(-2)).join('');}
function locked_(fn){const l=LockService.getScriptLock();if(!l.tryLock(25000))fail_('BUSY','系統忙碌，請稍後重試。');try{return fn();}finally{l.releaseLock();}}
function open_(){const c=cfg_();if(c.REGISTRATION_ENABLED!=='true'||!Number.isFinite(Date.parse(c.OPEN_AT))||Date.now()<Date.parse(c.OPEN_AT))fail_('CLOSED','暫時未能接受報名，請稍後再試。');}
function json_(v){return ContentService.createTextOutput(JSON.stringify(v)).setMimeType(ContentService.MimeType.JSON);}
function response_(fn){try{return json_({ok:true,...fn()});}catch(e){return json_({ok:false,code:e.code||'SERVICE_ERROR',message:e.code?e.message:'未能完成操作，請稍後重試或聯絡主辦單位。'});}}
function doGet(){return response_(()=>{open_();return {sessions:availability_(rows_(sheet_()))};});}
function doPost(e){return response_(()=>{open_();const raw=e&&e.postData&&e.postData.contents;if(!raw||raw.length>30*1024*1024)fail_('INVALID','提交資料過大。');let d;try{d=JSON.parse(raw);}catch(_){fail_('INVALID','提交格式不正確。');}if(d.action==='register')return register_(d);if(d.action==='complete')return complete_(d);fail_('INVALID','不支援的操作。');});}
function blob_(f,allowed,label){
 if(!f||!allowed.includes(f.mime)||typeof f.base64!=='string'||f.base64.length>Math.ceil(CB.maxFile/3)*4||!/^[A-Za-z0-9+/]*={0,2}$/.test(f.base64))fail_('FILE',label+'必須為指定格式，並不超過10 MB。');
 let bytes;try{bytes=Utilities.base64Decode(f.base64);}catch(_){fail_('FILE',label+'未能讀取。');}
 if(bytes.length<8||bytes.length>CB.maxFile||!signature_(bytes,f.mime))fail_('FILE',label+'檔案內容與格式不符。');
 return Utilities.newBlob(bytes,f.mime);
}
function fileName_(r,suffix,mime){const ext={'image/jpeg':'jpg','image/png':'png','application/pdf':'pdf'}[mime];const name=String(r['Name EN']||r['Name ZH']).replace(/[^\p{L}\p{N}_-]/gu,'_').slice(0,60);return r['Registration ID']+'_S'+(CB.sessions.indexOf(r.Session)+1)+'_'+name+'_'+suffix+'.'+ext;}
function resume_(r,d){if(r['Receipt Secret Hash']!==hash_(d.receiptSecret||''))fail_('INVALID','請使用原本瀏覽器繼續提交。');return {registrationId:r['Registration ID'],paymentStatus:r['Payment Status'],registrationStatus:r['Registration Status'],email1State:r['Email 1 State'],needsCard:!r['Contestant Card File ID']};}
function register_(d){
 const v=validRegistration_(d),photo=blob_(d.photo,['image/jpeg','image/png'],'參賽相片'),proof=blob_(d.proof,['image/jpeg','image/png','application/pdf'],'付款證明');
 return locked_(()=>{
  const s=sheet_(),rows=rows_(s),existing=rows.find(r=>r['Request ID']===d.requestId);
  if(existing)return resume_(existing,d);
  assertSlot_(rows,v.email,v.session);
  const props=PropertiesService.getScriptProperties();const max=rows.reduce((n,r)=>Math.max(n,Number(String(r['Registration ID']).replace('CB26-',''))||0),0);
  const seq=Math.max(Number(props.getProperty('LAST_ID')||0),max)+1;props.setProperty('LAST_ID',String(seq));
  const id='CB26-'+String(seq).padStart(4,'0'),c=cfg_();
  const r={'Registration ID':id,'Submitted At':new Date(),'Name EN':v.nameEn,'Name ZH':v.nameZh,Email:v.email,Phone:v.phone,Instagram:v.instagram,Session:v.session,'Soul Song':v.soul[0],'Soul Artist':v.soul[1],'Rock Song':v.rock[0],'Rock Artist':v.rock[1],'Payment Method':v.paymentMethod,'Payment Status':'PENDING','Registration Status':'SUBMITTED','Request ID':d.requestId,'Receipt Secret Hash':hash_(d.receiptSecret),'Email 1 State':'READY','Email 2 State':'READY','Marketing Consent':d.marketingConsent===true,'Competition Consent':true,'Privacy Consent':true,'Media Consent':true,'Personal Statement':v.statement,'Consent Version':'2026-09-24'};
  const made=[];
  try{
   const p=DriveApp.getFolderById(c.PHOTO_FOLDER_ID).createFile(photo.setName(fileName_(r,'CONTESTANT',d.photo.mime)));made.push(p);
   const q=DriveApp.getFolderById(c.PAYMENT_FOLDER_ID).createFile(proof.setName(fileName_(r,'PAYMENT_'+Utilities.formatDate(new Date(),'Asia/Hong_Kong','yyyyMMdd'),d.proof.mime)));made.push(q);
   r['Soul MMO File ID']=catalogId_('SOUL',v.soul[0],v.soul[1],'KEY0');r['Rock MMO File ID']=catalogId_('ROCK',v.rock[0],v.rock[1],'KEY0');
   r['Contestant Photo File ID']=p.getId();r['Contestant Photo URL']=p.getUrl();r['Payment Proof File ID']=q.getId();r['Payment Proof URL']=q.getUrl();
   r._row=s.getLastRow()+1;s.getRange(r._row,1,1,CB.headers.length).setValues([CB.headers.map(h=>sheetText_(r[h]===undefined?'':r[h]))]);SpreadsheetApp.flush();
  }catch(e){
   // Only trash files created by this attempt when readback proves no registration was written.
   let stored=true;try{stored=rows_(s).some(x=>x['Request ID']===d.requestId);}catch(_){}
   if(!stored)made.forEach(f=>{try{f.setTrashed(true);}catch(_){}});
   throw e;
  }
  return resume_(r,d);
 });
}
function complete_(d){
 if(!/^[a-f0-9-]{36}$/.test(d.requestId||''))fail_('INVALID','提交格式不正確。');
 return locked_(()=>{
  const s=sheet_(),r=rows_(s).find(r=>r['Request ID']===d.requestId);if(!r)fail_('NOT_FOUND','未找到報名資料。');resume_(r,d);
  if(r['Registration Status']==='CANCELLED')fail_('CANCELLED','此報名已取消，請聯絡主辦單位。');
  if(!r['Contestant Card File ID']){const card=blob_(d.card,['image/png'],'選手卡');const file=DriveApp.getFolderById(cfg_().PHOTO_FOLDER_ID).createFile(card.setName(fileName_(r,'ContestantCard','image/png')));put_(s,r,'Contestant Card File ID',file.getId());SpreadsheetApp.flush();}
  if(r['Email 1 State']==='READY')sendOnce_(s,r,1,[DriveApp.getFileById(r['Contestant Card File ID']).getBlob()]);
  if(r['Email 1 State']!=='SENT')fail_('EMAIL_REVIEW','報名資料已收到，電郵狀態待工作人員核查。請勿重複報名，請聯絡主辦單位。');
  return {...resume_(r,d),submitted:true};
 });
}
function sendOnce_(s,r,n,attachments){
 const state='Email '+n+' State',date=n===1?'Contestant Card Sent At':'Confirmation Sent At';
 if(r[state]==='SENT')return;
 if(r[state]!=='READY')fail_('EMAIL_REVIEW','電郵正在處理或結果未明；請先核對寄件紀錄，勿重寄。');
 if(MailApp.getRemainingDailyQuota()<1)fail_('MAIL_QUOTA','寄信配額不足，請稍後重試。');
 const size=attachments.reduce((sum,b)=>sum+b.getBytes().length,0);if(size>24*1024*1024)fail_('ATTACHMENT_SIZE','附件總大小超過24 MB，請先調整 MMO 檔案。');
 put_(s,r,state,'SENDING');if(n===2)put_(s,r,'Registration Status','CONFIRMED');SpreadsheetApp.flush();
 try{
  MailApp.sendEmail({to:String(r.Email).replace(/^'/,''),subject:n===1?'【廣東歌唱擂台 2026】已收到你的報名資料｜Registration Received':'【廣東歌唱擂台 2026】參賽名額確認｜Registration Confirmed',body:n===1?email1_(r):email2_(r),attachments,name:'CANTOPOP BATTLE',replyTo:cfg_().REPLY_TO});
  put_(s,r,date,new Date());put_(s,r,state,'SENT');SpreadsheetApp.flush();
 }catch(e){try{put_(s,r,state,'UNCERTAIN');SpreadsheetApp.flush();}catch(_){}fail_('EMAIL_REVIEW','寄信結果待工作人員核查，系統不會自動重寄。');}
}
function staff_(){const email=Session.getActiveUser().getEmail().toLowerCase(),allowed=cfg_().STAFF_EMAILS.split(',').map(v=>v.trim().toLowerCase());if(!email||!allowed.includes(email))fail_('STAFF','此操作只限獲授權工作人員。');}
function onOpen(){SpreadsheetApp.getUi().createMenu('CANTOPOP BATTLE').addItem('SEND CONFIRMATION','sendConfirmation').addItem('SEND RECEIVED EMAIL','sendReceivedEmail').addItem('CHECK CONFIGURATION','checkConfiguration').addToUi();}
function selected_(s){const a=SpreadsheetApp.getActiveRange();if(!a||a.getSheet().getSheetId()!==s.getSheetId()||a.getNumRows()!==1||a.getRow()<2)fail_('SELECTION','請先選擇一筆報名資料。');const r=rows_(s).find(r=>r._row===a.getRow());if(!r)fail_('SELECTION','請選擇有效報名。');return r;}
function mmo_(id){if(!id)fail_('MMO','請先填入兩首 MMO 的檔案 ID。');const f=DriveApp.getFileById(String(id));const parents=f.getParents();let ok=false;while(parents.hasNext())if(parents.next().getId()===cfg_().MMO_FOLDER_ID)ok=true;if(!ok||f.isTrashed()||!/^audio\//.test(f.getMimeType()))fail_('MMO','MMO 必須在指定資料夾內，並為音訊檔案。');return f;}
function sendConfirmation(){
 staff_();const ui=SpreadsheetApp.getUi(),initial=selected_(sheet_());
 if(ui.alert('SEND CONFIRMATION',initial['Registration ID']+' — '+initial['Name ZH']+'\n請核對款項、兩首 MMO 與轉調版本。寄出參賽確認？',ui.ButtonSet.YES_NO)!==ui.Button.YES)return;
 const result=locked_(()=>{const s=sheet_(),r=rows_(s).find(r=>r['Registration ID']===initial['Registration ID']);if(r['Payment Status']!=='VERIFIED')fail_('PAYMENT','請先人工核款並設定 VERIFIED。');if(r['Registration Status']!=='SUBMITTED')fail_('STATUS','只可確認 SUBMITTED 報名；已確認或取消者不可重寄。');if(r['Email 1 State']!=='SENT')fail_('STATUS','請先完成報名收件電郵。');if(!r['Soul MMO File ID']||r['Soul MMO File ID']===r['Rock MMO File ID'])fail_('MMO','請核對兩個不同的 MMO 檔案 ID。');assertMmoMatch_(r);const soul=mmo_(r['Soul MMO File ID']),rock=mmo_(r['Rock MMO File ID']);sendOnce_(s,r,2,[soul.getBlob(),rock.getBlob()]);return r['Registration ID'];});ui.alert(result+' 確認電郵已寄出。');
}
function sendReceivedEmail(){staff_();const ui=SpreadsheetApp.getUi(),r=selected_(sheet_());if(ui.alert('SEND RECEIVED EMAIL',r['Registration ID']+'：寄出尚未寄送的收件電郵？',ui.ButtonSet.YES_NO)!==ui.Button.YES)return;locked_(()=>{const s=sheet_(),fresh=rows_(s).find(x=>x['Registration ID']===r['Registration ID']);if(!fresh['Contestant Card File ID'])fail_('CARD','選手卡尚未完成，請聯絡參賽者繼續原提交。');sendOnce_(s,fresh,1,[DriveApp.getFileById(fresh['Contestant Card File ID']).getBlob()]);});}
function setup(){
 staff_();const c=cfg_(),ss=SpreadsheetApp.openById(c.SPREADSHEET_ID),name=c.SHEET_NAME||'Registrations';let s=ss.getSheetByName(name);
 if(!s)s=ss.insertSheet(name);if(s.getLastRow()>0){sheet_();return;}
 s.getRange(1,1,1,CB.headers.length).setValues([CB.headers]);s.setFrozenRows(1);s.getRange(1,1,1,CB.headers.length).setFontWeight('bold');
 [['Payment Status',['PENDING','VERIFIED','REJECTED']],['Registration Status',['SUBMITTED','CONFIRMED','CANCELLED']]].forEach(([h,values])=>s.getRange(2,CB.headers.indexOf(h)+1,s.getMaxRows()-1,1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(values,true).setAllowInvalid(false).build()));
 s.getRange(2,1,s.getMaxRows()-1,CB.headers.length).setNumberFormat('@');s.autoResizeColumns(1,12);SpreadsheetApp.flush();
}
function checkConfiguration(){staff_();const c=cfg_();sheet_();[c.PHOTO_FOLDER_ID,c.PAYMENT_FOLDER_ID,c.MMO_FOLDER_ID].forEach(id=>DriveApp.getFolderById(id).getName());SpreadsheetApp.getUi().alert('設定及資料夾可存取。今日剩餘寄信名額：'+MailApp.getRemainingDailyQuota());}

function catalog_(){const s=SpreadsheetApp.openById(cfg_().SPREADSHEET_ID).getSheetByName('MMO Catalog');if(!s||s.getLastRow()<2)return[];return s.getRange(2,1,s.getLastRow()-1,6).getValues().filter(r=>r[5]===true||r[5]==='TRUE');}
function catalogId_(genre,song,artist,key){const r=catalog_().filter(r=>r[0]===genre&&r[1]===song&&r[2]===artist&&r[3]===key);return r.length===1?r[0][4]:'';}
function assertMmoMatch_(r){['Soul','Rock'].forEach(g=>{const fileId=r[g+' MMO File ID'];const matches=catalog_().filter(x=>x[0]===g.toUpperCase()&&x[1]===r[g+' Song']&&x[2]===r[g+' Artist']&&x[4]===fileId);if(matches.length!==1)fail_('MMO','MMO 未有核准的歌曲對應；請先檢查 MMO Catalog。');});}
function setupMmoCatalog(){staff_();const ss=SpreadsheetApp.openById(cfg_().SPREADSHEET_ID);if(ss.getSheetByName('MMO Catalog'))return;const s=ss.insertSheet('MMO Catalog');s.appendRow(['Genre','Song','Artist','Key','File ID','Approved']);const rows=['soul','rock'].flatMap(g=>CB[g].map(p=>[g.toUpperCase(),p[0],p[1],'KEY0','',false]));s.getRange(2,1,rows.length,6).setValues(rows);s.getRange(2,6,rows.length,1).insertCheckboxes();s.setFrozenRows(1);}
