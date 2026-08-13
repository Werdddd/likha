import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ImagePreviewModal } from '../../components/ImagePreviewModal';
import { JobOrderStatusTimeline } from '../../components/JobOrderStatusTimeline';
import { JobOrderUpdateCard } from '../../components/JobOrderUpdateCard';
import { MilestoneProofUpload, type ProofValue } from '../../components/MilestoneProofUpload';
import { AnimatedPressable, Button, SelectField, TextField } from '../../components/ui';
import { regions } from '../../constants/mock-data';
import { colors, radius, shadow, spacing, type as t } from '../../constants/theme';
import { formatPrice } from '../../lib/format';
import { isTerminalJobOrderStatus, jobOrderStatusLabel } from '../../lib/job-order-status';
import { getSignedUrl, pickAndUploadDocument, pickAndUploadPrivateImages } from '../../lib/upload';
import { useCreatorStore } from '../../store/creator-store';
import { useJobOrderStore } from '../../store/job-order-store';
import { useJobOrderUpdateStore } from '../../store/job-order-update-store';
import { useSessionStore } from '../../store/session-store';
import type { Address, JobOrderMilestone, JobOrderUpdate, Region } from '../../types';

const EMPTY_UPDATES: JobOrderUpdate[] = [];
const UPDATE_ATTACHMENTS_BUCKET = 'job-order-update-attachments';

export default function JobOrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const currentUserId = useSessionStore((s) => s.currentUser.id);

  const jobOrder = useJobOrderStore((s) => s.jobOrders.find((o) => o.id === id));
  const fetchJobOrderById = useJobOrderStore((s) => s.fetchJobOrderById);
  const uploadMilestoneProof = useJobOrderStore((s) => s.uploadMilestoneProof);
  const releaseMilestone = useJobOrderStore((s) => s.releaseMilestone);
  const setStatus = useJobOrderStore((s) => s.setStatus);
  const setAddress = useJobOrderStore((s) => s.setAddress);
  const uploadFinalFile = useJobOrderStore((s) => s.uploadFinalFile);
  const getFinalFileDownloadUrl = useJobOrderStore((s) => s.getFinalFileDownloadUrl);
  const subscribeToJobOrder = useJobOrderStore((s) => s.subscribeToJobOrder);
  const submitForReview = useJobOrderStore((s) => s.submitForReview);
  const confirmDelivery = useJobOrderStore((s) => s.confirmDelivery);
  const fetchCreatorsByIds = useCreatorStore((s) => s.fetchByIds);

  const updates = useJobOrderUpdateStore((s) => s.updatesByJobOrder[id] ?? EMPTY_UPDATES);
  const fetchUpdates = useJobOrderUpdateStore((s) => s.fetchUpdates);
  const postUpdate = useJobOrderUpdateStore((s) => s.postUpdate);
  const subscribeToJobOrderUpdates = useJobOrderUpdateStore((s) => s.subscribeToJobOrderUpdates);
  const [updateDraft, setUpdateDraft] = useState('');
  const [isPostingUpdate, setIsPostingUpdate] = useState(false);
  const [updateImages, setUpdateImages] = useState<Array<{ path: string; previewUri: string }>>([]);
  const [isUploadingUpdateImages, setIsUploadingUpdateImages] = useState(false);
  const [updateFile, setUpdateFile] = useState<{ path: string; fileName: string } | null>(null);
  const [isUploadingUpdateFile, setIsUploadingUpdateFile] = useState(false);

  const [depositProof, setDepositProof] = useState<ProofValue | null>(null);
  const [finalProof, setFinalProof] = useState<ProofValue | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [proofUrls, setProofUrls] = useState<Record<string, string | null>>({});
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [line1, setLine1] = useState('');
  const [city, setCity] = useState('');
  const [addrRegion, setAddrRegion] = useState<Region>(regions[0]);
  const [postalCode, setPostalCode] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!jobOrder) fetchJobOrderById(id);
  }, [id, jobOrder, fetchJobOrderById]);

  useEffect(() => {
    if (!id) return;
    const unsubscribe = subscribeToJobOrder(id);
    return unsubscribe;
  }, [id, subscribeToJobOrder]);

  useEffect(() => {
    if (jobOrder) fetchCreatorsByIds([jobOrder.buyerId, jobOrder.creatorId]);
  }, [jobOrder?.buyerId, jobOrder?.creatorId, fetchCreatorsByIds]);

  useEffect(() => {
    if (id) fetchUpdates(id);
  }, [id, fetchUpdates]);

  useEffect(() => {
    if (!id) return;
    const unsubscribe = subscribeToJobOrderUpdates(id);
    return unsubscribe;
  }, [id, subscribeToJobOrderUpdates]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchJobOrderById(id), fetchUpdates(id)]);
    setRefreshing(false);
  }, [id, fetchJobOrderById, fetchUpdates]);

  if (!jobOrder) {
    return (
      <SafeAreaView style={styles.screen} edges={['left', 'right', 'bottom']}>
        <Stack.Screen options={{ title: 'Job Order' }} />
        <Text style={styles.body}>Job order not found.</Text>
      </SafeAreaView>
    );
  }

  const isBuyer = jobOrder.buyerId === currentUserId;
  const isCreator = jobOrder.creatorId === currentUserId;
  const deposit = jobOrder.milestones.find((m) => m.kind === 'deposit');
  const finalMilestone = jobOrder.milestones.find((m) => m.kind === 'final');
  const terminal = isTerminalJobOrderStatus(jobOrder.status);
  const needsShippingAddress = jobOrder.deliverableType === 'physical';

  const handleViewProof = async (milestone: JobOrderMilestone) => {
    if (!milestone.paymentProofPath) return;
    if (proofUrls[milestone.id]) {
      setPreviewUrl(proofUrls[milestone.id]);
      return;
    }
    const url = await getSignedUrl('payment-proofs', milestone.paymentProofPath);
    setProofUrls((prev) => ({ ...prev, [milestone.id]: url }));
    setPreviewUrl(url);
  };

  const handleSubmitPayment = async (milestone: JobOrderMilestone, proof: ProofValue) => {
    setBusyAction(milestone.id);
    const { error } = await uploadMilestoneProof(jobOrder.id, milestone.id, proof.path);
    setBusyAction(null);
    if (error) {
      Alert.alert('Could not submit payment', error);
      return;
    }
    if (milestone.kind === 'deposit') setDepositProof(null);
    else setFinalProof(null);
  };

  const handleRelease = async (milestone: JobOrderMilestone) => {
    setBusyAction(milestone.id);
    const { error } = await releaseMilestone(jobOrder.id, milestone.id);
    setBusyAction(null);
    if (error) Alert.alert('Could not release this milestone', error);
  };

  const handleSubmitForReview = async () => {
    setBusyAction('submit-review');
    const { error } = await submitForReview(jobOrder.id);
    setBusyAction(null);
    if (error) Alert.alert('Could not update status', error);
  };

  const handleRequestRevision = async () => {
    setBusyAction('request-revision');
    const { error } = await setStatus(jobOrder.id, 'revision');
    setBusyAction(null);
    if (error) Alert.alert('Could not request revision', error);
  };

  const handleConfirmDelivery = () => {
    Alert.alert(
      "Confirm you're satisfied?",
      "This unlocks the final payment. Only confirm once you've reviewed the updates and you're happy with the work.",
      [
        { text: 'Not yet', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setBusyAction('confirm-delivery');
            const { error } = await confirmDelivery(jobOrder.id);
            setBusyAction(null);
            if (error) Alert.alert('Could not confirm', error);
          },
        },
      ],
    );
  };

  const handlePickUpdateImages = async () => {
    setIsUploadingUpdateImages(true);
    const picked = await pickAndUploadPrivateImages(UPDATE_ATTACHMENTS_BUCKET, currentUserId, 'update-img');
    setIsUploadingUpdateImages(false);
    if (picked.length > 0) setUpdateImages((prev) => [...prev, ...picked]);
  };

  const handleRemoveUpdateImage = (path: string) => setUpdateImages((prev) => prev.filter((img) => img.path !== path));

  const handlePickUpdateFile = async () => {
    setIsUploadingUpdateFile(true);
    const file = await pickAndUploadDocument(UPDATE_ATTACHMENTS_BUCKET, currentUserId, 'update-file');
    setIsUploadingUpdateFile(false);
    if (file) setUpdateFile(file);
  };

  const handlePostUpdate = async () => {
    const body = updateDraft.trim();
    if (!body) return;
    setIsPostingUpdate(true);
    const { error } = await postUpdate(jobOrder.id, currentUserId, body, {
      filePath: updateFile?.path,
      fileName: updateFile?.fileName,
      imagePaths: updateImages.map((img) => img.path),
    });
    setIsPostingUpdate(false);
    if (error) {
      Alert.alert('Could not post update', error);
      return;
    }
    setUpdateDraft('');
    setUpdateImages([]);
    setUpdateFile(null);
  };

  const handleSaveAddress = async () => {
    const address: Address = {
      fullName: fullName.trim(),
      phone: phone.trim(),
      line1: line1.trim(),
      city: city.trim(),
      region: addrRegion,
      postalCode: postalCode.trim(),
    };
    setBusyAction('save-address');
    const { error } = await setAddress(jobOrder.id, address);
    setBusyAction(null);
    if (error) Alert.alert('Could not save address', error);
  };

  const handleUploadFinalFile = async () => {
    setIsUploadingFile(true);
    const file = await pickAndUploadDocument('job-deliverables', currentUserId, 'final');
    setIsUploadingFile(false);
    if (!file) return;
    const { error } = await uploadFinalFile(jobOrder.id, file.path, file.fileName);
    if (error) Alert.alert('Could not upload file', error);
  };

  const handleDownloadFinalFile = async () => {
    const url = await getFinalFileDownloadUrl(jobOrder.id);
    if (!url) {
      Alert.alert('Download unavailable', 'This file could not be retrieved right now.');
      return;
    }
    Linking.openURL(url);
  };

  const renderMilestone = (label: string, milestone?: JobOrderMilestone) => {
    if (!milestone) return null;
    // The final payment only unlocks after the buyer has explicitly confirmed they're satisfied
    // (see the "Confirm" gate below) — reaching "delivered" alone isn't enough.
    const canBuyerPay =
      isBuyer &&
      milestone.status === 'pending' &&
      (milestone.kind === 'deposit' || (jobOrder.status === 'delivered' && jobOrder.buyerConfirmedAt !== null));
    const proof = milestone.kind === 'deposit' ? depositProof : finalProof;
    const setProof = milestone.kind === 'deposit' ? setDepositProof : setFinalProof;

    return (
      <View style={styles.card}>
        <View style={styles.milestoneTop}>
          <Text style={styles.milestoneLabel}>{label}</Text>
          <Text style={styles.milestoneAmount}>{formatPrice(milestone.amount)}</Text>
        </View>
        <Text style={styles.milestoneStatus}>
          {milestone.status === 'pending' && 'Awaiting payment'}
          {milestone.status === 'paid' && 'Submitted — awaiting confirmation'}
          {milestone.status === 'released' && 'Released ✓'}
        </Text>

        {milestone.kind === 'final' &&
          milestone.status === 'pending' &&
          jobOrder.status === 'delivered' &&
          jobOrder.buyerConfirmedAt === null &&
          isBuyer && (
            <Text style={styles.milestoneHint}>
              Review the updates below and confirm you're satisfied to unlock this payment.
            </Text>
          )}

        {milestone.paymentProofPath && (
          <AnimatedPressable style={styles.viewProofLink} scaleTo={0.97} onPress={() => handleViewProof(milestone)}>
            <Ionicons name="image-outline" size={13} color={colors.ink} />
            <Text style={styles.viewProofLinkLabel}>View proof of payment</Text>
          </AnimatedPressable>
        )}

        {canBuyerPay && (
          <View style={styles.milestoneAction}>
            <MilestoneProofUpload
              bucket="payment-proofs"
              userId={currentUserId}
              prefix={`job-${milestone.kind}`}
              value={proof}
              onChange={setProof}
            />
            {proof && (
              <Button
                label={busyAction === milestone.id ? 'Submitting…' : 'Submit Payment'}
                onPress={() => handleSubmitPayment(milestone, proof)}
                disabled={busyAction === milestone.id}
                style={styles.milestoneActionButton}
              />
            )}
          </View>
        )}

        {isCreator && milestone.status === 'paid' && (
          <Button
            label={busyAction === milestone.id ? 'Releasing…' : 'Confirm Receipt & Release'}
            variant="secondary"
            onPress={() => handleRelease(milestone)}
            disabled={busyAction === milestone.id}
            style={styles.milestoneActionButton}
          />
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right', 'bottom']}>
      <Stack.Screen options={{ title: `Job Order #${jobOrder.id.slice(-6)}` }} />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.ink} />}
      >
        <Text style={styles.orderDate}>Started {new Date(jobOrder.createdAt).toLocaleString()}</Text>

        <View style={styles.card}>
          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>{jobOrderStatusLabel(jobOrder.status)}</Text>
          </View>
          {terminal ? (
            <Text style={styles.terminalText}>
              {jobOrder.status === 'completed'
                ? 'This job order is complete.'
                : 'This job order was cancelled.'}
            </Text>
          ) : (
            <View style={styles.timelineWrap}>
              <JobOrderStatusTimeline status={jobOrder.status} />
            </View>
          )}

          {isCreator && (jobOrder.status === 'in_progress' || jobOrder.status === 'revision') && (
            <Button
              label={busyAction === 'submit-review' ? 'Submitting…' : 'Submit for Review'}
              onPress={handleSubmitForReview}
              disabled={busyAction === 'submit-review'}
              style={styles.milestoneActionButton}
            />
          )}
          {isBuyer && jobOrder.status === 'delivered' && jobOrder.buyerConfirmedAt === null && (
            <View style={styles.reviewActionRow}>
              <Button
                label={busyAction === 'request-revision' ? 'Requesting…' : 'Request Revision'}
                variant="ghost"
                onPress={handleRequestRevision}
                disabled={busyAction === 'request-revision'}
                style={styles.reviewActionButton}
              />
              <Button
                label={busyAction === 'confirm-delivery' ? 'Confirming…' : "I'm Satisfied — Confirm"}
                onPress={handleConfirmDelivery}
                disabled={busyAction === 'confirm-delivery'}
                style={styles.reviewActionButton}
              />
            </View>
          )}
          {isBuyer && jobOrder.status === 'delivered' && jobOrder.buyerConfirmedAt !== null && (
            <View style={styles.confirmedRow}>
              <Ionicons name="checkmark-circle" size={15} color={colors.golden} />
              <Text style={styles.confirmedText}>You confirmed this delivery — pay the balance below.</Text>
            </View>
          )}
        </View>

        <Text style={styles.sectionLabel}>Total: {formatPrice(jobOrder.price)}</Text>
        {renderMilestone('Deposit', deposit)}
        {renderMilestone('Final Payment', finalMilestone)}

        <Text style={styles.sectionLabel}>Progress Updates</Text>
        {isCreator && !terminal && (
          <View style={styles.card}>
            <TextField
              label=""
              placeholder="Share what you've been working on..."
              multiline
              numberOfLines={3}
              value={updateDraft}
              onChangeText={setUpdateDraft}
              containerStyle={styles.updateInputWrap}
            />

            {updateImages.length > 0 && (
              <View style={styles.updateMediaRow}>
                {updateImages.map((img) => (
                  <View key={img.path} style={styles.updateMediaThumbWrap}>
                    <Image source={{ uri: img.previewUri }} style={styles.updateMediaThumb} contentFit="cover" />
                    <AnimatedPressable
                      style={styles.removeMediaButton}
                      scaleTo={0.9}
                      onPress={() => handleRemoveUpdateImage(img.path)}
                      hitSlop={6}
                    >
                      <Ionicons name="close" size={13} color={colors.white} />
                    </AnimatedPressable>
                  </View>
                ))}
              </View>
            )}

            {updateFile && (
              <View style={styles.fileRow}>
                <Ionicons name="document-attach-outline" size={16} color={colors.ink} />
                <Text style={styles.fileName} numberOfLines={1}>
                  {updateFile.fileName}
                </Text>
                <AnimatedPressable onPress={() => setUpdateFile(null)} scaleTo={0.9} hitSlop={6}>
                  <Ionicons name="close-circle" size={16} color={colors.warmBrown} />
                </AnimatedPressable>
              </View>
            )}

            <View style={styles.updateAttachRow}>
              <AnimatedPressable
                style={styles.updateAttachButton}
                scaleTo={0.96}
                onPress={handlePickUpdateImages}
                disabled={isUploadingUpdateImages}
              >
                {isUploadingUpdateImages ? (
                  <ActivityIndicator size="small" color={colors.warmBrown} />
                ) : (
                  <>
                    <Ionicons name="image-outline" size={15} color={colors.warmBrown} />
                    <Text style={styles.updateAttachButtonLabel}>Add photos</Text>
                  </>
                )}
              </AnimatedPressable>
              <AnimatedPressable
                style={styles.updateAttachButton}
                scaleTo={0.96}
                onPress={handlePickUpdateFile}
                disabled={isUploadingUpdateFile}
              >
                {isUploadingUpdateFile ? (
                  <ActivityIndicator size="small" color={colors.warmBrown} />
                ) : (
                  <>
                    <Ionicons name="attach-outline" size={15} color={colors.warmBrown} />
                    <Text style={styles.updateAttachButtonLabel}>{updateFile ? 'Replace file' : 'Add file'}</Text>
                  </>
                )}
              </AnimatedPressable>
            </View>

            <Button
              label={isPostingUpdate ? 'Posting…' : 'Post Update'}
              onPress={handlePostUpdate}
              disabled={!updateDraft.trim() || isPostingUpdate}
              style={styles.milestoneActionButton}
            />
          </View>
        )}
        {updates.length === 0 ? (
          <Text style={styles.milestoneStatus}>
            {isCreator ? 'Post your first update to keep the buyer in the loop.' : 'No updates posted yet.'}
          </Text>
        ) : (
          updates.map((update) => (
            <JobOrderUpdateCard key={update.id} update={update} jobOrderId={jobOrder.id} currentUserId={currentUserId} />
          ))
        )}

        {isCreator && (
          <>
            <Text style={styles.sectionLabel}>Final deliverable</Text>
            <View style={styles.card}>
              {jobOrder.finalFileName ? (
                <View style={styles.fileRow}>
                  <Ionicons name="document-attach-outline" size={18} color={colors.ink} />
                  <Text style={styles.fileName} numberOfLines={1}>
                    {jobOrder.finalFileName}
                  </Text>
                </View>
              ) : (
                <Text style={styles.milestoneStatus}>No file uploaded yet.</Text>
              )}
              <AnimatedPressable
                style={styles.filePicker}
                scaleTo={0.98}
                onPress={handleUploadFinalFile}
                disabled={isUploadingFile}
              >
                {isUploadingFile ? (
                  <ActivityIndicator size="small" color={colors.warmBrown} />
                ) : (
                  <>
                    <Ionicons name="cloud-upload-outline" size={18} color={colors.warmBrown} />
                    <Text style={styles.filePickerLabel}>
                      {jobOrder.finalFileName ? 'Replace file' : 'Upload final file'}
                    </Text>
                  </>
                )}
              </AnimatedPressable>
            </View>
          </>
        )}

        {isBuyer && jobOrder.status === 'completed' && jobOrder.finalFilePath && (
          <>
            <Text style={styles.sectionLabel}>Final deliverable</Text>
            <Button label="Download Final File" onPress={handleDownloadFinalFile} />
          </>
        )}

        {needsShippingAddress && (
          <>
            <Text style={styles.sectionLabel}>Shipping address</Text>
            {jobOrder.address ? (
              <View style={styles.card}>
                <Text style={styles.addressName}>{jobOrder.address.fullName}</Text>
                <Text style={styles.addressLine}>{jobOrder.address.phone}</Text>
                <Text style={styles.addressLine}>
                  {jobOrder.address.line1}, {jobOrder.address.city}, {jobOrder.address.region}{' '}
                  {jobOrder.address.postalCode}
                </Text>
              </View>
            ) : isBuyer ? (
              <View style={styles.card}>
                <TextField label="Full name" placeholder="Juan Dela Cruz" value={fullName} onChangeText={setFullName} />
                <TextField label="Phone" placeholder="09XX XXX XXXX" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
                <TextField label="Address" placeholder="House no., street, barangay" value={line1} onChangeText={setLine1} />
                <TextField label="City" placeholder="City" value={city} onChangeText={setCity} />
                <SelectField label="Region" value={addrRegion} options={regions} onChange={(v) => setAddrRegion(v as Region)} />
                <TextField label="Postal code" placeholder="1000" keyboardType="numeric" value={postalCode} onChangeText={setPostalCode} />
                <Button
                  label={busyAction === 'save-address' ? 'Saving…' : 'Save Address'}
                  onPress={handleSaveAddress}
                  disabled={busyAction === 'save-address'}
                />
              </View>
            ) : (
              <Text style={styles.milestoneStatus}>Waiting for the buyer to add a shipping address.</Text>
            )}
          </>
        )}
      </ScrollView>

      <ImagePreviewModal visible={!!previewUrl} uri={previewUrl} onClose={() => setPreviewUrl(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  orderDate: {
    ...t.caption,
    color: colors.warmBrown,
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadow.sm,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    backgroundColor: colors.softGray + '80',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  statusBadgeText: {
    ...t.caption,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: colors.ink,
  },
  terminalText: {
    ...t.bodyMedium,
    color: colors.terracotta,
    marginTop: spacing.md,
  },
  timelineWrap: {
    marginTop: spacing.md,
  },
  sectionLabel: {
    ...t.label,
    color: colors.ink,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  milestoneTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  milestoneLabel: {
    ...t.bodyMedium,
    color: colors.ink,
  },
  milestoneAmount: {
    ...t.h3,
    color: colors.ink,
  },
  milestoneStatus: {
    ...t.caption,
    color: colors.warmBrown,
    marginTop: 2,
  },
  milestoneHint: {
    ...t.caption,
    color: colors.terracotta,
    marginTop: spacing.xs,
  },
  reviewActionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  reviewActionButton: {
    flex: 1,
  },
  confirmedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.md,
  },
  confirmedText: {
    ...t.caption,
    color: colors.golden,
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  updateInputWrap: {
    marginBottom: spacing.sm,
  },
  updateMediaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  updateMediaThumbWrap: {
    width: 64,
    height: 64,
  },
  updateMediaThumb: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    backgroundColor: colors.softGray,
  },
  removeMediaButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: radius.pill,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.canvas,
  },
  updateAttachRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  updateAttachButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.softGray + '4d',
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs + 2,
  },
  updateAttachButtonLabel: {
    ...t.caption,
    color: colors.warmBrown,
  },
  viewProofLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
  },
  viewProofLinkLabel: {
    ...t.caption,
    color: colors.ink,
    textDecorationLine: 'underline',
  },
  milestoneAction: {
    marginTop: spacing.sm,
  },
  milestoneActionButton: {
    marginTop: spacing.sm,
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  fileName: {
    ...t.body,
    color: colors.ink,
    flex: 1,
  },
  filePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.softGray,
    borderStyle: 'dashed',
    borderRadius: radius.md,
    paddingVertical: spacing.md,
  },
  filePickerLabel: {
    ...t.bodyMedium,
    color: colors.warmBrown,
  },
  addressName: {
    ...t.bodyMedium,
    color: colors.ink,
  },
  addressLine: {
    ...t.body,
    color: colors.warmBrown,
    marginTop: 2,
  },
  body: {
    ...t.body,
    padding: spacing.lg,
  },
});
