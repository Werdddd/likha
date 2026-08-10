import { ScrollView, StyleSheet } from 'react-native';

import { spacing } from '../constants/theme';
import { Chip } from './ui/Chip';

interface FilterBarProps {
  options: string[];
  selected: string | null;
  onSelect: (value: string | null) => void;
}

export function FilterBar({ options, selected, onSelect }: FilterBarProps) {
  return (
    <ScrollView
      horizontal
      style={styles.scroll}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      <Chip label="All" selected={selected === null} onPress={() => onSelect(null)} />
      {options.map((option) => (
        <Chip
          key={option}
          label={option}
          selected={selected === option}
          onPress={() => onSelect(selected === option ? null : option)}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 0,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
});
