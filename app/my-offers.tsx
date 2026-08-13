import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedPressable, Badge, type BadgeTone, Button, Card } from '../components/ui';
import { colors, radius, spacing, type as t } from '../constants/theme';
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

const STATUS_TONES: Record<string, BadgeTone> = {
  pending: 'active',
  accepted: 'positive',
  not_selected: 'muted',
  withdrawn: 'muted',
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
          <View style={styles.emptyIconWrap}>
            <Ionicons name="paper-plane-outline" size={32} color={colors.warmBrown} />
          </View>
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
          <Card key={offer.id} style={styles.card}>
            <AnimatedPressable
              onPress={() => handlePressOffer(offer)}
              disabled={openingOfferId === offer.id}
              scaleTo={0.98}
            >
              <View style={styles.cardTop}>
                <Text style={styles.offerDate}>{new Date(offer.createdAt).toLocaleDateString()}</Text>
                <Badge label={STATUS_LABELS[offer.status]} tone={STATUS_TONES[offer.status]} />
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
          </Card>
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
    marginBottom: spacing.sm,
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
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    backgroundColor: colors.softGray + '60',
    alignItems: 'center',
    justifyContent: 'center',
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
