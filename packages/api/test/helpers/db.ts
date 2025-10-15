import fs from 'fs';
import path from 'path';

export function useIsolatedDb() {
  const tmp = path.join(process.cwd(), 'packages/api/data', `test-${Date.now()}-${Math.random().toString(36).slice(2)}.sqlite`);
  const prev = process.env.DATABASE_PATH;
  process.env.DATABASE_PATH = tmp;
  return {
    path: tmp,
    cleanup: () => {
      try { fs.unlinkSync(tmp); } catch {}
      if (prev) process.env.DATABASE_PATH = prev; else delete process.env.DATABASE_PATH;
    }
  };
}


