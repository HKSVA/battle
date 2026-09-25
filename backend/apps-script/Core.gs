/** Pure validation and policy functions; also exercised by the local test suite. */
const CB = {
  capacity: 40, maxFile: 10 * 1024 * 1024,
  sessions: ['17 OCT · 1:00–4:00PM','17 OCT · 6:00–9:00PM','18 OCT · 1:00–4:00PM','18 OCT · 6:00–9:00PM','19 OCT · 1:00–4:00PM','19 OCT · 6:00–9:00PM'],
  soul: [['你瞞我瞞','陳柏宇'],['今天我不想做嘢','張進翹'],['騷靈情歌','張敬軒'],['Superman','AGA'],['趁你旅行時搬走','Moon Tang'],['多得他','王菲']],
  rock: [['懷疑人生','MC 張天賦'],['我的天我的歌','許志安'],['用背脊唱情歌','Gareth.T'],['沙門','陳蕾'],['穿花蝴蝶','衛蘭'],['讓我跟你走','彭羚']],
  headers: ['Registration ID','Submitted At','Name EN','Name ZH','Email','Phone','Instagram','Session','Soul Song','Soul Artist','Rock Song','Rock Artist','Contestant Photo File ID','Contestant Photo URL','Payment Method','Payment Proof File ID','Payment Proof URL','Payment Status','Registration Status','Contestant Card Sent At','Confirmation Sent At','Soul MMO File ID','Rock MMO File ID','Transpose Request','Internal Notes','Request ID','Receipt Secret Hash','Contestant Card File ID','Email 1 State','Email 2 State','Marketing Consent','Competition Consent','Privacy Consent','Media Consent','Personal Statement','Consent Version']
};
function fail_(code,message){const e=new Error(message);e.code=code;throw e;}
function clean_(v,max,required){if(typeof v!=='string') v='';v=v.trim();if(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(v)||v.length>max)fail_('INVALID','資料格式不正確。');if(required&&!v)fail_('INVALID','請完成所有必填資料。');return v;}
function sheetText_(v){return typeof v==='string'&&/^[=+@\-\t\r]/.test(v)?"'"+v:v;}
function song_(value,genre){const parts=String(value||'').split(' — ');const title=(parts[0]||'').replace(/^《|》$/g,'');const pair=CB[genre].find(p=>p[0]===title&&p[1]===parts[1]);if(!pair)fail_('INVALID_SONG','請從指定歌單選擇歌曲。');return pair;}
function validRegistration_(d){
 const v={nameZh:clean_(d.nameZh,80,true),nameEn:clean_(d.nameEn,100,false),email:clean_(d.email,254,true).toLowerCase(),phone:clean_(d.phone,30,true),instagram:clean_(d.instagram,40,false).replace(/^@/,''),session:clean_(d.session,40,true),statement:clean_(d.statement,100,false)};
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)||/[\r\n]/.test(v.email)||!/[0-9]{5}/.test(v.phone.replace(/[\s()+-]/g,'')))fail_('INVALID','請檢查電郵及電話。');
 if(v.instagram&&!/^[A-Za-z0-9_.]{1,30}$/.test(v.instagram))fail_('INVALID','請檢查 Instagram 帳號。');
 if(!CB.sessions.includes(v.session))fail_('INVALID_SESSION','請選擇有效場次。');
 if([...v.statement].length>20)fail_('INVALID','最多20字');
 if(!['FPS','BANK_TRANSFER'].includes(d.paymentMethod))fail_('INVALID','請選擇付款方法。');
 if(d.competitionConsent!==true||d.privacyConsent!==true||d.mediaConsent!==true)fail_('CONSENT','請閱讀並同意必需條款。');
 if(!/^[a-f0-9-]{36}$/.test(d.requestId||'')||!/^[a-f0-9]{64}$/.test(d.receiptSecret||''))fail_('INVALID','請重新載入報名頁。');
 v.soul=song_(d.soul,'soul');v.rock=song_(d.rock,'rock');v.paymentMethod=d.paymentMethod;return v;
}
function active_(r){return ['SUBMITTED','CONFIRMED'].includes(r['Registration Status']);}
function availability_(rows){return CB.sessions.map(session=>({session,remaining:Math.max(0,CB.capacity-rows.filter(r=>r.Session===session&&active_(r)).length)}));}
function assertSlot_(rows,email,session){
 if(rows.some(r=>String(r.Email).replace(/^'/,'').toLowerCase()===email&&r.Session===session&&active_(r)))fail_('DUPLICATE','你已提交此場次報名。如需修改資料，請回覆確認電郵或聯絡主辦單位。');
 if(availability_(rows).find(s=>s.session===session).remaining===0)fail_('FULL','本場次已滿，請選擇其他場次。');
}
function signature_(bytes,mime){const b=bytes.map(n=>(n+256)%256);if(mime==='image/jpeg')return b[0]===255&&b[1]===216&&b[2]===255;if(mime==='image/png')return [137,80,78,71,13,10,26,10].every((v,i)=>b[i]===v);if(mime==='application/pdf')return String.fromCharCode.apply(null,b.slice(0,5))==='%PDF-';return false;}
function checkIn_(session){return session.includes('1:00')?'12:30PM 前':'5:30PM 前';}
function email1_(r){return `${r['Name ZH']} 你好，\n\n我們已收到你的「廣東歌唱擂台 2026 CANTOPOP BATTLE」報名資料及付款紀錄。\n\nRegistration ID\n${r['Registration ID']}\n\n參與場次\n${r.Session}\n\nCANTOPOP SOUL｜細緻靈魂\n《${r['Soul Song']}》— ${r['Soul Artist']}\n\nCANTOPOP ROCK｜力量搖滾\n《${r['Rock Song']}》— ${r['Rock Artist']}\n\n報名費\nHK$350\n\n工作人員將核對你的報名資料及付款紀錄。\n完成核對後，我們將另行發出參賽確認電郵。\n\n名額以成功提交完整報名資料及付款紀錄為準，每場次額滿即止。\n\n附件：\n你的 CANTOPOP BATTLE 選手卡\n\n廣東歌唱擂台 2026\nCANTOPOP BATTLE`;}
function email2_(r){return `${r['Name ZH']} 你好，\n\n你的報名及付款已完成核對，你的參賽名額現已確認。\n\nRegistration ID\n${r['Registration ID']}\n\n參與場次\n${r.Session}\n\n報到時間\n${checkIn_(r.Session)}\n\n比賽地點\n啟德 THE TWINS 雙子匯 2期三道 G/F 中庭\n\n你需要準備的兩首歌曲：\n\nCANTOPOP SOUL｜細緻靈魂\n《${r['Soul Song']}》— ${r['Soul Artist']}\n\nCANTOPOP ROCK｜力量搖滾\n《${r['Rock Song']}》— ${r['Rock Artist']}\n\n比賽所使用的兩首 MMO 已附於本電郵。\n\n如有轉調要求，請於 2026年10月7日或之前直接回覆此電郵提出。\n逾期提出的轉調要求未必能夠安排。\n\n請保存此電郵及你的 Registration ID，以便日後查詢及現場報到。\n\n期待在擂台見到你。\n\n廣東歌唱擂台 2026\nCANTOPOP BATTLE`;}
