import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Modal, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radius, spacing } from '../constants/theme';
import { AnimatedPressable } from './ui';

interface ImagePreviewModalProps {
  visible: boolean;
  uri: string | null;
  onClose: () => void;
}

export function ImagePreviewModal({ visible, uri, onClose }: ImagePreviewModalProps) {
  return (
    <Modal visible={visible && !!uri} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        {uri && <Image source={{ uri }} style={styles.image} contentFit="contain" />}
      </Pressable>
      <SafeAreaView style={styles.closeWrap} pointerEvents="box-none">
        <AnimatedPressable style={styles.closeButton} onPress={onClose} scaleTo={0.9} hitSlop={8}>
          <Ionicons name="close" size={22} color={colors.white} />
        </AnimatedPressable>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  closeWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  closeButton: {
    alignSelf: 'flex-end',
    margin: spacing.md,
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
