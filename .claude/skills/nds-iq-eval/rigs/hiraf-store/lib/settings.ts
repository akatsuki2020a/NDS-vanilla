// Store settings, kept in memory like the rest of the data.
export type Settings = {
  shipping: { fee: number; freeOver: number };
  tax: { vatNumber: string };
  store: { open: boolean; closedMessage: string };
  notifications: { emails: string[] };
};

const defaults = (): Settings => ({
  shipping: { fee: 25, freeOver: 300 },
  tax: { vatNumber: '300012345600003' },
  store: { open: true, closedMessage: '' },
  notifications: { emails: ['orders@hiraf.example'] },
});

export function getSettings(): Settings {
  const g = globalThis as typeof globalThis & { __hirafSettings?: Settings };
  return (g.__hirafSettings ??= defaults());
}

export function saveSettings(next: Settings): Settings {
  const g = globalThis as typeof globalThis & { __hirafSettings?: Settings };
  g.__hirafSettings = next;
  return next;
}
