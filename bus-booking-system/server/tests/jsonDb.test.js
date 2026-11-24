const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

test('jsonDb supports insert, find, update, delete, and clearAll', () => {
  const tmpFile = path.join(os.tmpdir(), `busbook-test-${Date.now()}.json`);
  process.env.JSON_DB_PATH = tmpFile;

  delete require.cache[require.resolve('../config/jsonDb')];
  const db = require('../config/jsonDb');

  db.clearAll();
  const created = db.insertOne('buses', { busName: 'Test Volvo', busNumber: 'KA-01-TEST' });
  assert.ok(created._id);
  assert.equal(db.count('buses'), 1);

  const found = db.findById('buses', created._id);
  assert.equal(found.busName, 'Test Volvo');

  const updated = db.updateById('buses', created._id, { busName: 'Updated Volvo' });
  assert.equal(updated.busName, 'Updated Volvo');

  const removed = db.deleteById('buses', created._id);
  assert.equal(removed._id, created._id);
  assert.equal(db.count('buses'), 0);

  if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
});
