import { Pressable, type GestureResponderEvent, type PressableProps } from 'react-native';

import { useSoundEffects, type SoundKey } from '@/hooks/use-sound-effects';

type SoundPressableProps = PressableProps & {
  /** Defaults to the generic button click. Pass 'twinkle' or 'stamp' to override, or 'none' for silent (e.g. backdrop dismiss taps). */
  sound?: SoundKey | 'none';
};

/** Drop-in <Pressable> that plays a UI sound on press — use this instead of Pressable for anything that reads as a "button." */
export function SoundPressable({ sound = 'button', onPress, ...rest }: SoundPressableProps) {
  const { play } = useSoundEffects();

  function handlePress(e: GestureResponderEvent) {
    if (sound !== 'none') play(sound);
    onPress?.(e);
  }

  return <Pressable onPress={handlePress} {...rest} />;
}
