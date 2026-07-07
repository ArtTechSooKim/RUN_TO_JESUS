import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react';

const SOURCES = {
  ambient: require('../../assets/sounds/ambient.wav'),
  twinkle: require('../../assets/sounds/twinkle.wav'),
  button: require('../../assets/sounds/button.wav'),
  stamp: require('../../assets/sounds/stamp.wav'),
};

export type SoundKey = 'twinkle' | 'button' | 'stamp';

type SoundEffectsValue = {
  playButton: () => void;
  playTwinkle: () => void;
  playStamp: () => void;
  play: (key: SoundKey) => void;
  /** Looping ambient bed — index/login only. Safe to call repeatedly. */
  startAmbient: () => void;
  stopAmbient: () => void;
};

const SoundEffectsContext = createContext<SoundEffectsValue | null>(null);

/**
 * expo-audio's web shim proxies HTMLMediaElement.play(), which returns a
 * promise that rejects (and logs as an uncaught error) under the browser's
 * autoplay policy until the user has interacted with the page — harmless
 * here since every affected sound is itself triggered by a tap, except the
 * ambient bed's very first attempt on mount. Swallow both the sync throw
 * and the async rejection so it never surfaces as a page error.
 */
function safePlay(player: AudioPlayer) {
  try {
    const result: unknown = player.play();
    if (result && typeof (result as Promise<unknown>).catch === 'function') {
      (result as Promise<unknown>).catch(() => {});
    }
  } catch {
    // ignore
  }
}

function replay(player: AudioPlayer) {
  try {
    player.seekTo(0);
  } catch {
    // ignore
  }
  safePlay(player);
}

export function SoundEffectsProvider({ children }: { children: ReactNode }) {
  const players = useRef<Record<'ambient' | SoundKey, AudioPlayer> | null>(null);
  // Whether the ambient bed *should* be playing right now (per route) — used
  // to retry it from any button tap, since the very first attempt on mount
  // is commonly blocked by the browser's autoplay policy (no gesture yet).
  const ambientWanted = useRef(false);

  if (!players.current) {
    players.current = {
      ambient: createAudioPlayer(SOURCES.ambient),
      twinkle: createAudioPlayer(SOURCES.twinkle),
      button: createAudioPlayer(SOURCES.button),
      stamp: createAudioPlayer(SOURCES.stamp),
    };
    players.current.ambient.loop = true;
    players.current.ambient.volume = 0.35;
  }

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
    const current = players.current;
    return () => {
      if (!current) return;
      for (const player of Object.values(current)) player.remove();
    };
  }, []);

  const startAmbient = () => {
    ambientWanted.current = true;
    const player = players.current?.ambient;
    if (player && !player.playing) safePlay(player);
  };

  const play = (key: SoundKey) => {
    const player = players.current?.[key];
    if (player) replay(player);
    // Piggyback on this real user gesture to retry the ambient bed if it's
    // supposed to be playing but got blocked (see safePlay's docstring).
    if (ambientWanted.current) startAmbient();
  };

  const value: SoundEffectsValue = {
    playButton: () => play('button'),
    playTwinkle: () => play('twinkle'),
    playStamp: () => play('stamp'),
    play,
    startAmbient,
    stopAmbient: () => {
      ambientWanted.current = false;
      players.current?.ambient.pause();
    },
  };

  return <SoundEffectsContext.Provider value={value}>{children}</SoundEffectsContext.Provider>;
}

export function useSoundEffects() {
  const ctx = useContext(SoundEffectsContext);
  if (!ctx) throw new Error('useSoundEffects must be used within SoundEffectsProvider');
  return ctx;
}
