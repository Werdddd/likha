import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ImagePreviewModal } from '../../components/ImagePreviewModal';
import { JobOrderStatusTimeline } from '../../components/JobOrderStatusTimeline';
import { MilestoneProofUpload, type ProofValue } from '../../components/MilestoneProofUpload';
import { AnimatedPressable, Button, SelectField, TextField } from '../../components/ui';
import { regions } from '../../constants/mock-data';
import { colors, radius, shadow, spacing, type as t } from '../../constants/theme';
import { formatPrice } from '../../lib/format';
import { isTerminalJobOrderStatus, jobOrderStatusLabel } from '../../lib/job-order-status';
import { getSignedUrl, pickAndUploadDocument } from '../../lib/upload';
import { useJobOrderStore } from '../../store/job-order-store';
import { useSessionStore } from '../../store/session-store';
import type { Address, JobOrderMilestone, Region } from '../../types';

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

  useEffect(() => {
    if (!jobOrder) fetchJobOrderById(id);
  }, [id, jobOrder, fetchJobOrderById]);

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
    const { error } = await setStatus(jobOrder.id, 'delivered');
    setBusyAction(null);
    if (error) Alert.alert('Could not update status', error);
  };

  const handleRequestRevision = async () => {
    setBusyAction('request-revision');
    const { error } = await setStatus(jobOrder.id, 'revision');
    setBusyAction(null);
    if (error) Alert.alert('Could not request revision', error);
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
    const canBuyerPay =
      isBuyer && milestone.status === 'pending' && (milestone.kind === 'deposit' || jobOrder.status === 'delivered');
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
      <ScrollView contentContainerStyle={styles.content}>
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
          {isBuyer && jobOrder.status === 'delivered' && (
            <Button
              label={busyAction === 'request-revision' ? 'Requesting…' : 'Request Revision'}
              variant="ghost"
              onPress={handleRequestRevision}
              disabled={busyAction === 'request-revision'}
              style={styles.milestoneActionButton}
            />
          )}
        </View>

        <Text style={styles.sectionLabel}>Total: {formatPrice(jobOrder.price)}</Text>
        {renderMilestone('Deposit', deposit)}
        {renderMilestone('Final Payment', finalMilestone)}

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
