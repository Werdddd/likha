import { Image } from 'expo-image';
import { StyleSheet } from 'react-native';

import { colors } from '../../constants/theme';

interface AvatarProps {
  uri: string;
  size?: number;
}

export function Avatar({ uri, size = 48 }: AvatarProps) {
  return (
    <Image
      source={{ uri }}
      style={[
        styles.base,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
      contentFit="cover"
    />
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.softGray,
    borderWidth: 2,
    borderColor: colors.white,
  },
});
