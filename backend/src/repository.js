import { DatabaseSync } from 'node:sqlite';
import { readFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { randomBytes } from 'node:crypto';

/** SQLite persistence. Each opaque cookie identifies an isolated synthetic workspace. */
export function createRepository(filename = ':memory:') {
  if (filename !== ':memory:') mkdirSync(dirname(filename), { recursive: true });
  const db = new DatabaseSync(filename, { timeout: 5000 });
  db.exec('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;');
  const version = db.prepare('PRAGMA user_version').get().user_version;
  if (version > 1) { db.close(); throw Error('Database schema is newer than this application.'); }
  if (version < 1) db.exec(readFileSync(new URL('../migrations/001_workspace.sql', import.meta.url), 'utf8'));
  const get = id => {
    const workspace = db.prepare('SELECT revision, updated_at FROM workspaces WHERE id = ?').get(id);
    if (!workspace) return null;
    return {
      revision: workspace.revision, updatedAt: workspace.updated_at,
      sessions: db.prepare('SELECT patient, readings FROM sessions WHERE workspace_id = ? ORDER BY id').all(id).map(s => ({ synthetic: true, patient: JSON.parse(s.patient), readings: JSON.parse(s.readings) })),
      events: db.prepare('SELECT patient_id AS patient, minute, action, recorded_at AS time FROM reviews WHERE workspace_id = ? ORDER BY position').all(id)
    };
  };
  return {
    get,
    create() {
      if (db.prepare('SELECT count(*) AS count FROM workspaces').get().count >= 1000) throw Object.assign(Error('Demo workspace capacity reached.'), { status: 503, code: 'CAPACITY' });
      const id = randomBytes(32).toString('hex');
      db.prepare('INSERT INTO workspaces(id, updated_at) VALUES(?, ?)').run(id, new Date().toISOString());
      return id;
    },
    save(id, revision, sessions, events) {
      db.exec('BEGIN IMMEDIATE');
      try {
        const updated = db.prepare('UPDATE workspaces SET revision = revision + 1, updated_at = ? WHERE id = ? AND revision = ?').run(new Date().toISOString(), id, revision);
        if (!updated.changes) throw Object.assign(Error('This workspace changed in another tab. Reload before saving; export your draft first if needed.'), { status: 409, code: 'REVISION_CONFLICT' });
        db.prepare('DELETE FROM sessions WHERE workspace_id = ?').run(id);
        db.prepare('DELETE FROM reviews WHERE workspace_id = ?').run(id);
        const sessionInsert = db.prepare('INSERT INTO sessions VALUES(?, ?, ?, ?)');
        for (const s of sessions) sessionInsert.run(id, s.patient.id, JSON.stringify(s.patient), JSON.stringify(s.readings));
        const reviewInsert = db.prepare('INSERT INTO reviews VALUES(?, ?, ?, ?, ?, ?)');
        events.forEach((e, i) => reviewInsert.run(id, i, e.patient, e.minute, e.action, e.time));
        db.exec('COMMIT');
        return get(id);
      } catch (error) { db.exec('ROLLBACK'); throw error; }
    },
    close() { db.close(); }
  };
}
