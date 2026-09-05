import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearAudioCache, playSound } from '../audioPlayer';
import { SOUND_REACTION_EVENT, type SoundReactionDetail } from '../soundReactionEvent';

class MockAudio {
  static rejectPlay = false;

  volume = 1;
  loop = false;
  currentTime = 0;
  preload = '';

  constructor(public readonly src = '') {}

  addEventListener(type: string, listener: EventListenerOrEventListenerObject): void {
    if (type !== 'canplaythrough') return;
    queueMicrotask(() => {
      if (typeof listener === 'function') listener(new Event(type));
      else listener.handleEvent(new Event(type));
    });
  }

  load(): void {}
  pause(): void {}

  cloneNode(): MockAudio {
    return new MockAudio(this.src);
  }

  async play(): Promise<void> {
    if (MockAudio.rejectPlay) throw new Error('playback blocked');
  }
}

class MockCustomEvent<T> extends Event {
  readonly detail: T;

  constructor(type: string, init: CustomEventInit<T>) {
    super(type);
    this.detail = init.detail as T;
  }
}

describe('audioPlayer sound reactions', () => {
  beforeEach(() => {
    MockAudio.rejectPlay = false;
    vi.stubGlobal('window', new EventTarget());
    vi.stubGlobal('Audio', MockAudio);
    vi.stubGlobal('CustomEvent', MockCustomEvent);
  });

  afterEach(() => {
    clearAudioCache();
    vi.unstubAllGlobals();
  });

  it('dispatches the mapped emoji after playback starts', async () => {
    const reactions: SoundReactionDetail[] = [];
    window.addEventListener(SOUND_REACTION_EVENT, (event) => {
      reactions.push((event as CustomEvent<SoundReactionDetail>).detail);
    });

    await playSound('baigan');

    expect(reactions).toEqual([{
      soundId: 'baigan',
      emoji: '😒',
      label: 'Baigan',
      color: '#5AC8FA',
    }]);
  });

  it('does not dispatch when playback fails', async () => {
    const listener = vi.fn();
    window.addEventListener(SOUND_REACTION_EVENT, listener);
    MockAudio.rejectPlay = true;

    await playSound('baigan');

    expect(listener).not.toHaveBeenCalled();
  });

  it('does not dispatch for an unmapped sound', async () => {
    const listener = vi.fn();
    window.addEventListener(SOUND_REACTION_EVENT, listener);

    await playSound('not-in-settings');

    expect(listener).not.toHaveBeenCalled();
  });
});