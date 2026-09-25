const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('backend/apps-script/Core.gs', 'utf8');
const context = {};
vm.createContext(context);
vm.runInContext(source, context);

const valid = {
  nameZh: '測試歌手', nameEn: 'Test Singer', email: 'TEST@example.com',
  phone: '+852 9123 4567', instagram: '@test.singer',
  session: '17 OCT · 1:00–4:00PM',
  statement: '唱給香港聽', paymentMethod: 'FPS',
  competitionConsent: true, privacyConsent: true, mediaConsent: true,
  marketingConsent: false,
  requestId: '123e4567-e89b-12d3-a456-426614174000',
  receiptSecret: 'a'.repeat(64),
  soul: '《你瞞我瞞》 — 陳柏宇', rock: '《懷疑人生》 — MC 張天賦'
};

const normalized = context.validRegistration_(valid);
assert.equal(normalized.email, 'test@example.com');
assert.equal(normalized.instagram, 'test.singer');
assert.deepEqual(Array.from(normalized.soul), ['你瞞我瞞', '陳柏宇']);

assert.throws(() => context.validRegistration_({...valid, statement: '字'.repeat(21)}), /最多20字/);
assert.throws(() => context.validRegistration_({...valid, rock: '《不存在》 — 測試'}), /指定歌單/);
assert.throws(() => context.validRegistration_({...valid, rock: '《娛樂人生》 — 陳蕾'}), /指定歌單/);
assert.equal(context.validRegistration_({...valid, rock: '《娑婆》 — 陳蕾'}).rock[0], '娑婆');
assert.throws(() => context.validRegistration_({...valid, privacyConsent: false}), /必需條款/);

const activeRows = Array.from({length: 40}, (_, i) => ({
  Email: `person${i}@example.com`, Session: valid.session,
  'Registration Status': i === 39 ? 'CANCELLED' : 'SUBMITTED'
}));
assert.equal(context.availability_(activeRows)[0].remaining, 1);
activeRows[39]['Registration Status'] = 'CONFIRMED';
assert.equal(context.availability_(activeRows)[0].remaining, 0);
assert.throws(() => context.assertSlot_(activeRows, 'new@example.com', valid.session), /本場次已滿/);
assert.throws(() => context.assertSlot_(activeRows, 'person0@example.com', valid.session), /已提交此場次/);

assert.equal(context.signature_([0xff, 0xd8, 0xff], 'image/jpeg'), true);
assert.equal(context.signature_([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 'image/png'), true);
assert.equal(context.signature_([0x25, 0x50, 0x44, 0x46, 0x2d], 'application/pdf'), true);
assert.equal(context.signature_([0, 1, 2], 'image/jpeg'), false);

const row = {
  'Name ZH': '測試歌手', 'Registration ID': 'CB26-0001', Session: valid.session,
  'Soul Song': '你瞞我瞞', 'Soul Artist': '陳柏宇',
  'Rock Song': '懷疑人生', 'Rock Artist': 'MC 張天賦'
};
assert.match(context.email1_(row), /已收到你的.*報名資料及付款紀錄/);
assert.doesNotMatch(context.email1_(row), /名額現已確認/);
assert.match(context.email2_(row), /THE TWINS 雙子匯 2期三道 G\/F 中庭/);
assert.match(context.email2_(row), /2026年10月7日/);
assert.equal(context.checkIn_(valid.session), '12:30PM 前');
assert.equal(context.checkIn_('17 OCT · 6:00–9:00PM'), '5:30PM 前');

console.log('Apps Script core policy tests passed.');
