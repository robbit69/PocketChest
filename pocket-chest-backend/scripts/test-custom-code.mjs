import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Miniflare } from 'miniflare';

let mf;
let db;
before(async () => {
  mf = new Miniflare({
    modules: true,
    scriptPath: '.wrangler/custom-code-test/index.js',
    compatibilityDate: '2025-08-13',
    d1Databases: ['DB'],
    r2Buckets: ['R2_STORAGE'],
    bindings: { REQUIRE_TOTP: 'false', JWT_SECRET: 'local-custom-code-tests-only' },
  });
  db = await mf.getD1Database('DB');
  const schema = (await readFile('src/schema.sql', 'utf8')).replace(/--[^\n]*/g, '');
  await db.batch(schema.split(';').filter(sql => sql.trim()).map(sql => db.prepare(sql)));
});
after(async () => { await mf?.dispose(); });

async function draft() {
  const response = await mf.dispatchFetch('http://localhost/api/chest', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}',
  });
  assert.equal(response.status, 200);
  const session = await response.json();
  const form = new FormData();
  form.append('textItems', JSON.stringify({ filename: 'test.txt', content: 'custom code test' }));
  const encoded = new Request('http://localhost', { method: 'POST', body: form });
  const uploaded = await mf.dispatchFetch(`http://localhost/api/chest/${session.sessionId}/upload`, {
    method: 'POST', headers: { Authorization: `Bearer ${session.uploadToken}`, 'Content-Type': encoded.headers.get('content-type') }, body: await encoded.arrayBuffer(),
  });
  assert.equal(uploaded.status, 200);
  return { ...session, fileIds: (await uploaded.json()).uploadedFiles.map(file => file.fileId) };
}
function complete(session, code, overrides = {}) {
  return mf.dispatchFetch(`http://localhost/api/chest/${session.sessionId}/complete`, {
    method: 'POST', headers: { Authorization: `Bearer ${session.uploadToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileIds: session.fileIds, validityDays: 1, customRetrievalCode: code, ...overrides }),
  });
}
async function unpublished(session) {
  const row = await db.prepare('SELECT upload_complete, retrieval_code FROM sessions WHERE session_id = ?').bind(session.sessionId).first();
  assert.equal(row.upload_complete, 0);
  assert.equal(row.retrieval_code, null);
}

test('custom code is normalized and retrieves the original file without changing its contents', async () => {
  const session = await draft();
  const response = await complete(session, '  my-files_2026  ');
  assert.equal(response.status, 200);
  assert.equal((await response.json()).retrievalCode, 'MY-FILES_2026');
  const retrieval = await mf.dispatchFetch('http://localhost/api/retrieve/my-files_2026');
  assert.equal(retrieval.status, 200);
  const result = await retrieval.json();
  assert.deepEqual(result.files.map(file => file.fileId), session.fileIds);
  const download = await mf.dispatchFetch(`http://localhost/api/download/${session.fileIds[0]}`, { headers: { Authorization: `Bearer ${result.chestToken}` } });
  assert.equal(await download.text(), 'custom code test');
});

test('duplicate custom code returns 409 and can be changed without uploading again', async () => {
  const first = await draft(), second = await draft();
  assert.equal((await complete(first, 'DUPLICATE_CODE')).status, 200);
  const conflict = await complete(second, 'duplicate_code');
  assert.equal(conflict.status, 409);
  assert.match((await conflict.json()).error, /已被占用/);
  await unpublished(second);
  assert.equal((await complete(second, 'DIFFERENT_CODE')).status, 200);
  const row = await db.prepare('SELECT COUNT(*) as count FROM files WHERE session_id = ?').bind(second.sessionId).first();
  assert.equal(row.count, 1);
});

test('simultaneous attempts at the same code have exactly one winner', async () => {
  const first = await draft(), second = await draft();
  const responses = await Promise.all([complete(first, 'CONCURRENT_CODE'), complete(second, 'CONCURRENT_CODE')]);
  assert.deepEqual(responses.map(r => r.status).sort(), [200, 409]);
  const loser = responses[0].status === 409 ? first : second;
  await unpublished(loser);
  assert.equal((await complete(loser, 'AFTER_CONFLICT')).status, 200);
});

test('four-character codes work and invalid format or non-string values do not publish a session', async () => {
  const session = await draft();
  for (const value of ['abc', 'a'.repeat(33), 'hello world', 'hello/there', '中文取件码测试', 123456, null]) {
    assert.equal((await complete(session, value)).status, 400);
    await unpublished(session);
  }
  assert.equal((await complete(session, 'A1_B')).status, 200);
});

test('config reports the site storage usage and capacity', async () => {
  const response = await mf.dispatchFetch('http://localhost/api/config');
  assert.equal(response.status, 200);
  const config = await response.json();
  assert.equal(config.requireTOTP, false);
  assert.equal(typeof config.storageUsedBytes, 'number');
  assert.equal(config.storageCapacityBytes, 10 * 1024 * 1024 * 1024);
});

test('omitted or blank code keeps six-character automatic codes and old retrieval behavior', async () => {
  for (const value of [undefined, '   ']) {
    const session = await draft();
    const response = await complete(session, value);
    assert.equal(response.status, 200);
    const { retrievalCode } = await response.json();
    assert.match(retrievalCode, /^[A-Z0-9]{6}$/);
    assert.equal((await mf.dispatchFetch(`http://localhost/api/retrieve/${retrievalCode}`)).status, 200);
  }
});

test('foreign file IDs cannot publish or reserve a code', async () => {
  const first = await draft(), second = await draft();
  assert.equal((await complete(first, 'OWNERSHIP_CODE', { fileIds: second.fileIds })).status, 400);
  await unpublished(first);
  assert.equal((await complete(second, 'OWNERSHIP_CODE')).status, 200);
});
