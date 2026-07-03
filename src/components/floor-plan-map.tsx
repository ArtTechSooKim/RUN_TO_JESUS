import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import type { Station } from '@/constants/stations';

export type StationStatus = {
  cleared: boolean;
  crowdCount: number;
};

type FloorPlanMapProps = {
  image: number;
  aspectRatio: number;
  stations: Station[];
  statusById: Record<string, StationStatus>;
  selectedId: string | null;
  onSelectStation: (id: string) => void;
};

const CROWD_BUSY = 8;
const CROWD_MODERATE = 3;

function markerColor(status: StationStatus) {
  if (status.cleared) return '#3ba55c';
  if (status.crowdCount >= CROWD_BUSY) return '#e5484d';
  if (status.crowdCount >= CROWD_MODERATE) return '#f2b94b';
  return '#9aa0a8';
}

export function FloorPlanMap({
  image,
  aspectRatio,
  stations,
  statusById,
  selectedId,
  onSelectStation,
}: FloorPlanMapProps) {
  return (
    <View style={[styles.mapWrapper, { aspectRatio }]}>
      <Image source={image} style={styles.image} contentFit="contain" />
      {stations.map((station) => {
        const status = statusById[station.id];
        const color = markerColor(status);
        const isSelected = station.id === selectedId;
        return (
          <Pressable
            key={station.id}
            onPress={() => onSelectStation(station.id)}
            style={[
              styles.marker,
              {
                left: `${station.position.x * 100}%`,
                top: `${station.position.y * 100}%`,
                borderColor: color,
                backgroundColor: status.cleared ? color : 'rgba(255,255,255,0.9)',
              },
              isSelected && styles.markerSelected,
            ]}>
            <ThemedText
              type="smallBold"
              style={status.cleared ? styles.markerLabelCleared : { color }}>
              {status.cleared ? '✓' : status.crowdCount}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  mapWrapper: {
    width: '100%',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  marker: {
    position: 'absolute',
    width: 28,
    height: 28,
    marginLeft: -14,
    marginTop: -14,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerSelected: {
    borderWidth: 3,
    transform: [{ scale: 1.25 }],
  },
  markerLabelCleared: {
    color: '#ffffff',
  },
});
