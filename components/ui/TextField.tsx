import { StyleSheet, Text, TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from 'react-native';

import { colors, radius, spacing, type as t } from '../../constants/theme';

interface TextFieldProps extends TextInputProps {
  label: string;
  containerStyle?: StyleProp<ViewStyle>;
}

export function TextField({ label, style, containerStyle, ...rest }: TextFieldProps) {
  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.warmBrown}
        style={[styles.input, style]}
        {...rest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.md,
  },
  label: {
    ...t.label,
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  input: {
    ...t.body,
    color: colors.ink,
    backgroundColor: colors.softGray + '4d',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
});
