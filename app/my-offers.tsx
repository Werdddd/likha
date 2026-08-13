import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedPressable, Button } from '../components/ui';
import { colors, radius, shadow, spacing, type as t } from '../constants/theme';
import { formatPrice } from '../lib/format';
import { useJobOfferStore } from '../store/job-offer-store';
import { useJobOrderStore } from '../store/job-order-store';
import { useSessionStore } from '../store/session-store';
import type { JobOffer } from '../types';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  not_selected: 'Not Selected',
  withdrawn: 'Withdrawn',
};

export default function MyOffersScreen() {
  const currentUserId = useSessionStore((s) => s.currentUser.id);
  const myOffers = useJobOfferStore((s) => s.myOffers);
  const fetchMyOffers = useJobOfferStore((s) => s.fetchMyOffers);
  const withdrawOffer = useJobOfferStore((s) => s.withdrawOffer);
  const fetchJobOrderByJobPostId = useJobOrderStore((s) => s.fetchJobOrderByJobPostId);
  const [refreshing, setRefreshing] = useState(false);
  const [openingOfferId, setOpeningOfferId] = useState<string | null>(null);
  const [withdrawingOfferId, setWithdrawingOfferId] = useState<string | null>(null);

  useEffect(() => {
    if (currentUserId) fetchMyOffers(currentUserId);
  }, [currentUserId, fetchMyOffers]);

  const onRefresh = useCallback(async () => {
    if (!currentUserId) return;
    setRefreshing(true);
    await fetchMyOffers(currentUserId);
    setRefreshing(false);
  }, [currentUserId, fetchMyOffers]);

  const handlePressOffer = async (offer: JobOffer) => {
    if (offer.status !== 'accepted') {
      router.push(`/job-post/${offer.jobPostId}`);
      return;
    }
    setOpeningOfferId(offer.id);
    const jobOrder = await fetchJobOrderByJobPostId(offer.jobPostId);
    setOpeningOfferId(null);
    router.push(jobOrder ? `/job-order/${jobOrder.id}` : `/job-post/${offer.jobPostId}`);
  };

  const handleWithdraw = (offer: JobOffer) => {
    Alert.alert('Withdraw this offer?', "The buyer won't be able to accept it anymore.", [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Withdraw',
        style: 'destructive',
        onPress: async () => {
          setWithdrawingOfferId(offer.id);
          const { error } = await withdrawOffer(offer.id);
          setWithdrawingOfferId(null);
          if (error) Alert.alert('Could not withdraw this offer', error);
        },
      },
    ]);
  };

  if (myOffers.length === 0) {
    return (
      <SafeAreaView style={styles.screen} edges={['left', 'right', 'bottom']}>
        <Stack.Screen options={{ title: 'My Offers' }} />
        <ScrollView
          contentContainerStyle={styles.empty}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.ink} />}
        >
          <Ionicons name="paper-plane-outline" size={40} color={colors.softGray} />
          <Text style={styles.emptyTitle}>No offers yet</Text>
          <Text style={styles.emptyBody}>Offers you submit on job posts will show up here.</Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right', 'bottom']}>
      <Stack.Screen options={{ title: 'My Offers' }} />
      <ScrollView
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.ink} />}
      >
        {myOffers.map((offer) => (
          <View key={offer.id} style={styles.card}>
            <AnimatedPressable
              onPress={() => handlePressOffer(offer)}
              disabled={openingOfferId === offer.id}
              scaleTo={0.98}
            >
              <View style={styles.cardTop}>
                <Text style={styles.offerDate}>{new Date(offer.createdAt).toLocaleDateString()}</Text>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusLabel}>{STATUS_LABELS[offer.status]}</Text>
                </View>
              </View>
              <Text style={styles.offerPrice}>{formatPrice(offer.price)}</Text>
              <Text style={styles.offerPitch} numberOfLines={2}>
                {offer.pitch}
              </Text>
            </AnimatedPressable>
            {offer.status === 'pending' && (
              <Button
                label={withdrawingOfferId === offer.id ? 'Withdrawing…' : 'Withdraw Offer'}
                variant="ghost"
                onPress={() => handleWithdraw(offer)}
                disabled={withdrawingOfferId === offer.id}
                style={styles.withdrawButton}
              />
            )}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  list: {
    padding: spacing.md,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadow.sm,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  offerDate: {
    ...t.label,
    color: colors.ink,
  },
  statusBadge: {
    backgroundColor: colors.softGray + '80',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  statusLabel: {
    ...t.caption,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: colors.ink,
  },
  offerPrice: {
    ...t.h3,
    color: colors.ink,
    marginTop: spacing.xs,
  },
  offerPitch: {
    ...t.caption,
    color: colors.warmBrown,
    marginTop: 2,
  },
  withdrawButton: {
    marginTop: spacing.sm,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    ...t.h3,
    color: colors.ink,
    marginTop: spacing.md,
  },
  emptyBody: {
    ...t.body,
    color: colors.warmBrown,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});
