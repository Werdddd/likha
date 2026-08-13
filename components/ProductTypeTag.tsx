import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, type as t } from '../constants/theme';
import type { ProductType } from '../types';

interface ProductTypeTagProps {
  productType: ProductType;
}

export function ProductTypeTag({ productType }: ProductTypeTagProps) {
  const isDigital = productType === 'digital';
  return (
    <View style={styles.tag}>
      <Ionicons name={isDigital ? 'cloud-download-outline' : 'cube-outline'} size={11} color={colors.warmBrown} />
      <Text style={styles.label}>{isDigital ? 'Digital' : 'Physical'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    alignSelf: 'flex-start',
    backgroundColor: colors.softGray + '80',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 2,
    marginTop: 2,
  },
  label: {
    ...t.caption,
    fontSize: 10,
    color: colors.warmBrown,
  },
});
