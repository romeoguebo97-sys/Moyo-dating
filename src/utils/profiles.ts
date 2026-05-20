import { Profile } from "../types";

export const shuffleArray = <T,>(items: T[]): T[] => {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

export const priorityRandomizeProfiles = (items: Profile[]): Profile[] => {
  const score = (p: Profile) =>
    (p.is_premium ? 4 : 0) + (p.is_verified ? 3 : 0) + ((p as any).is_certified ? 2 : 0);
  const buckets = new Map<number, Profile[]>();
  for (const item of items) {
    const key = score(item);
    const list = buckets.get(key) || [];
    list.push(item);
    buckets.set(key, list);
  }
  return Array.from(buckets.keys())
    .sort((a, b) => b - a)
    .flatMap(k => shuffleArray(buckets.get(k) || []));
};
