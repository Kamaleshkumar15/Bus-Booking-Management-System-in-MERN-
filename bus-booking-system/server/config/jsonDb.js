const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const COLLECTIONS = [
  'users',
  'drivers',
  'buses',
  'routes',
  'trips',
  'seats',
  'bookings',
  'passengers',
  'payments',
  'refunds',
  'coupons',
  'reviews',
  'notifications',
  'support_tickets',
  'audit_logs',
];

const getDatabaseDir = () => {
  const configured = process.env.JSON_DB_DIR || path.join(__dirname, '..', 'database');
  return path.isAbsolute(configured) ? configured : path.resolve(process.cwd(), configured);
};

const getCollectionPath = (collection) => path.join(getDatabaseDir(), `${collection}.json`);
const generateId = () => crypto.randomBytes(12).toString('hex');

const ensureCollectionFile = (collection) => {
  const dir = getDatabaseDir();
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const filePath = getCollectionPath(collection);
  if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, '[]', 'utf8');
  return filePath;
};

const writeLocks = new Map();
const withLock = (collection, fn) => {
  const prev = writeLocks.get(collection) || Promise.resolve();
  const next = prev.then(fn, fn);
  writeLocks.set(collection, next.catch(() => {}));
  return next;
};

const readJSON = (collection) => {
  const filePath = ensureCollectionFile(collection);
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeJSON = (collection, data) => {
  const filePath = ensureCollectionFile(collection);
  const tmpPath = `${filePath}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tmpPath, filePath);
};

const findAll = (collection, predicate = () => true) => readJSON(collection).filter(predicate);
const findOne = (collection, predicate) => readJSON(collection).find(predicate) || null;
const findById = (collection, id) => (id ? findOne(collection, (item) => String(item._id) === String(id)) : null);

const insertOne = (collection, doc) => {
  const rows = readJSON(collection);
  const now = new Date().toISOString();
  const record = { _id: doc._id || generateId(), ...doc, createdAt: doc.createdAt || now, updatedAt: doc.updatedAt || now };
  rows.push(record);
  writeJSON(collection, rows);
  return record;
};

const insertMany = (collection, docs) => {
  const rows = readJSON(collection);
  const now = new Date().toISOString();
  const records = docs.map((doc) => ({ _id: doc._id || generateId(), ...doc, createdAt: doc.createdAt || now, updatedAt: doc.updatedAt || now }));
  rows.push(...records);
  writeJSON(collection, rows);
  return records;
};

const updateById = (collection, id, updates) => {
  const rows = readJSON(collection);
  const idx = rows.findIndex((item) => String(item._id) === String(id));
  if (idx === -1) return null;
  rows[idx] = { ...rows[idx], ...updates, _id: rows[idx]._id, updatedAt: new Date().toISOString() };
  writeJSON(collection, rows);
  return rows[idx];
};

const updateMany = (collection, predicate, updates) => {
  const rows = readJSON(collection);
  const now = new Date().toISOString();
  let matchedCount = 0;
  const next = rows.map((item) => {
    if (predicate(item)) {
      matchedCount++;
      return { ...item, ...updates, _id: item._id, updatedAt: now };
    }
    return item;
  });
  if (matchedCount > 0) writeJSON(collection, next);
  return { matchedCount };
};

const deleteById = (collection, id) => {
  const rows = readJSON(collection);
  const idx = rows.findIndex((item) => String(item._id) === String(id));
  if (idx === -1) return null;
  const [removed] = rows.splice(idx, 1);
  writeJSON(collection, rows);
  return removed;
};

const deleteMany = (collection, predicate = () => true) => {
  const rows = readJSON(collection);
  const next = rows.filter((item) => !predicate(item));
  const deletedCount = rows.length - next.length;
  if (deletedCount > 0) writeJSON(collection, next);
  return { deletedCount };
};

const count = (collection, predicate = () => true) => readJSON(collection).filter(predicate).length;

const clearAll = () => {
  for (const col of COLLECTIONS) writeJSON(col, []);
};

const sanitizeUser = (doc) => {
  if (!doc) return null;
  const { password, otpCode, otpExpiresAt, ...rest } = doc;
  return rest;
};

const logAudit = ({ actorId, actorRole, action, entity, entityId = '', details = '' }) =>
  insertOne('audit_logs', { actorId: actorId || 'system', actorRole: actorRole || 'system', action, entity, entityId: String(entityId), details });

module.exports = {
  COLLECTIONS,
  getDatabaseDir,
  getDbPath: getDatabaseDir,
  generateId,
  withLock,
  readJSON,
  writeJSON,
  findAll,
  findOne,
  findById,
  insertOne,
  createRecord: insertOne,
  insertMany,
  updateById,
  updateRecord: updateById,
  updateMany,
  deleteById,
  deleteRecord: deleteById,
  deleteMany,
  count,
  clearAll,
  sanitizeUser,
  logAudit,
};
