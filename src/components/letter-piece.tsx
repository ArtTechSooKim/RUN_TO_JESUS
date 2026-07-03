import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';

type LetterPieceProps = {
  letter: string;
  collected: boolean;
  size?: 'sm' | 'md' | 'lg';
};

const SIZES = {
  sm: { box: 24, font: 13 },
  md: { box: 36, font: 18 },
  lg: { box: 56, font: 28 },
};

export function LetterPiece({ letter, collected, size = 'md' }: LetterPieceProps) {
  const dims = SIZES[size];
  return (
    <View
      style={[
        styles.box,
        {
          width: dims.box,
          height: dims.box * 1.15,
          backgroundColor: collected ? 'rgba(255,215,0,0.14)' : 'rgba(255,255,255,0.04)',
          borderColor: collected ? 'rgba(255,215,0,0.65)' : 'rgba(255,255,255,0.1)',
        },
      ]}>
      <ThemedText
        style={{
          fontSize: dims.font,
          fontWeight: '700',
          color: collected ? Colors.dark.gold : 'rgba(255,255,255,0.18)',
        }}>
        {collected ? letter : '·'}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
