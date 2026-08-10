import { Image } from 'expo-image';
import { StyleSheet } from 'react-native';

import { colors } from '../../constants/theme';

interface AvatarProps {
  uri: string;
  size?: number;
  bordered?: boolean;
}

export function Avatar({ uri, size = 48, bordered = false }: AvatarProps) {
  return (
    <Image
      source={{ uri }}
      style={[
        styles.base,
        { width: size, height: size, borderRadius: size / 2 },
        bordered && styles.bordered,
      ]}
      contentFit="cover"
    />
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.softGray,
  },
  bordered: {
    borderWidth: 2,
    borderColor: colors.white,
  },
});
