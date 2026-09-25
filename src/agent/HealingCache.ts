import fs from 'fs';
import path from 'path';
import { HealingCacheEntry } from '@utils/types';
import { env } from '@utils/env';

type CacheStore = Record<string, HealingCacheEntry>;

const cachePath = path.resolve(process.cwd(), env.ai.cacheFile);

function readStore(): CacheStore {
  if (!fs.existsSync(cachePath)) return {};
  try {
    return JSON.parse(fs.readFileSync(cachePath, 'utf-8')) as CacheStore;
  } catch {
    return {};
  }
}

function writeStore(store: CacheStore): void {
  fs.writeFileSync(cachePath, JSON.stringify(store, null, 2), 'utf-8');
}

export function cacheKey(description: string, primary: string, pageUrl: string): string {
  const url = new URL(pageUrl);
  return `${description}::${primary}::${url.pathname}`;
}

export function getCachedHeal(key: string): HealingCacheEntry | undefined {
  return readStore()[key];
}

export function saveHeal(key: string, entry: HealingCacheEntry): void {
  const store = readStore();
  store[key] = entry;
  writeStore(store);
}
