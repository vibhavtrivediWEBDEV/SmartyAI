import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WidgetStore, type Widget } from './widgetStore';

const storage = new Map<string, string>();

beforeEach(() => {
  storage.clear();
  vi.stubGlobal('window', {});
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key)
  });
});

describe('WidgetStore user scoping', () => {
  const clock = { id: 'clock-1', category: 'native', type: 'clock', x: 10, y: 20 } as Widget;

  it('migrates legacy widgets once into the first authenticated user scope', () => {
    storage.set('os_desktop_widgets', JSON.stringify([{ id: 'legacy', type: 'clock', x: 1, y: 2 }]));

    expect(WidgetStore.loadWidgets('user-a')).toEqual([
      expect.objectContaining({ id: 'legacy', category: 'native', width: 160, height: 160 })
    ]);
    expect(storage.has('os_desktop_widgets')).toBe(false);
    expect(WidgetStore.loadWidgets('user-b')).toEqual([]);
  });

  it('isolates widget writes and updates by user', () => {
    WidgetStore.addWidget('user-a', clock);
    WidgetStore.addWidget('user-b', { ...clock, id: 'clock-2' });

    WidgetStore.updatePosition('user-a', 'clock-1', 80, 90);

    expect(WidgetStore.loadWidgets('user-a')).toEqual([
      expect.objectContaining({ id: 'clock-1', x: 80, y: 90 })
    ]);
    expect(WidgetStore.loadWidgets('user-b')).toEqual([
      expect.objectContaining({ id: 'clock-2', x: 10, y: 20 })
    ]);
  });

  it('persists reaction widgets only for the user who added them', () => {
    WidgetStore.addWidget('user-a', {
      id: 'reaction-1',
      category: 'native',
      type: 'reaction',
      x: 100,
      y: 100,
      width: 58,
      height: 58
    });

    expect(WidgetStore.loadWidgets('user-a')).toEqual([
      expect.objectContaining({ id: 'reaction-1', type: 'reaction' })
    ]);
    expect(WidgetStore.loadWidgets('user-b')).toEqual([]);
  });

  it('does not remove malformed legacy data', () => {
    storage.set('os_desktop_widgets', '{bad json');

    expect(WidgetStore.loadWidgets('user-a')).toEqual([]);
    expect(storage.get('os_desktop_widgets')).toBe('{bad json');
  });
});