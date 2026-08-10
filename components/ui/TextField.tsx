import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from 'react-native';

import { colors, radius, spacing, type as t } from '../../constants/theme';

interface TextFieldProps extends TextInputProps {
  label: string;
  containerStyle?: StyleProp<ViewStyle>;
  leadingIcon?: keyof typeof Ionicons.glyphMap;
  rightElement?: React.ReactNode;
}

export function TextField({ label, style, containerStyle, leadingIcon, rightElement, ...rest }: TextFieldProps) {
  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.inputRow}>
        {leadingIcon ? (
          <Ionicons name={leadingIcon} size={18} color={colors.warmBrown} style={styles.leadingIcon} />
        ) : null}
        <TextInput
          placeholderTextColor={colors.warmBrown}
          style={[styles.input, leadingIcon ? styles.inputWithLeading : null, rightElement ? styles.inputWithTrailing : null, style]}
          {...rest}
        />
        {rightElement ? <View style={styles.trailing}>{rightElement}</View> : null}
      </View>
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
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.softGray + '4d',
    borderRadius: radius.md,
  },
  leadingIcon: {
    marginLeft: spacing.md,
  },
  trailing: {
    marginRight: spacing.md,
  },
  input: {
    ...t.body,
    flex: 1,
    color: colors.ink,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  inputWithLeading: {
    paddingLeft: spacing.sm,
  },
  inputWithTrailing: {
    paddingRight: spacing.sm,
  },
});
