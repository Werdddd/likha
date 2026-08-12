import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { digitalCategories, physicalCategories } from '../constants/mock-data';
import { colors, radius, spacing, type as t } from '../constants/theme';
import { pickAndUploadDocument, pickAndUploadImages } from '../lib/upload';
import { useProjectStore } from '../store/project-store';
import { useSessionStore } from '../store/session-store';
import type { ProductCategory, ProductType } from '../types';
import { AnimatedPressable, Button, CheckboxSelectField, SelectField, TextField } from './ui';

export interface ListingFormValues {
  title: string;
  description: string;
  price: number;
  productType: ProductType;
  category: ProductCategory;
  stock: number | null;
  projectId?: string;
  images: string[];
  digitalFilePath?: string;
  digitalFileName?: string;
}

const PRODUCT_TYPES: Array<{ value: ProductType; label: string }> = [
  { value: 'digital', label: 'Digital (instant download)' },
  { value: 'physical', label: 'Physical / made-to-order' },
];

interface ListingFormProps {
  submitLabel: string;
  onSubmit: (values: ListingFormValues) => void;
  isSubmitting?: boolean;
}

const NO_PROJECT = 'None';

export function ListingForm({ submitLabel, onSubmit, isSubmitting }: ListingFormProps) {
  const currentUser = useSessionStore((s) => s.currentUser);
  const fetchByCreator = useProjectStore((s) => s.fetchByCreator);
  const projectsById = useProjectStore((s) => s.projectsById);
  const myProjects = useMemo(
    () => Object.values(projectsById).filter((p) => p.creatorId === currentUser.id),
    [projectsById, currentUser.id],
  );

  useEffect(() => {
    if (currentUser.id) fetchByCreator(currentUser.id);
  }, [currentUser.id, fetchByCreator]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [productType, setProductType] = useState<ProductType>('digital');
  const [category, setCategory] = useState<ProductCategory>(digitalCategories[0]);
  const [stock, setStock] = useState('');
  const [projectTitle, setProjectTitle] = useState(NO_PROJECT);
  const [images, setImages] = useState<string[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [digitalFile, setDigitalFile] = useState<{ path: string; fileName: string } | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  const categoryOptions = productType === 'digital' ? digitalCategories : physicalCategories;

  const handleSelectProductType = (value: ProductType) => {
    setProductType(value);
    const options = value === 'digital' ? digitalCategories : physicalCategories;
    if (!(options as ProductCategory[]).includes(category)) {
      setCategory(options[0]);
    }
    if (value === 'physical') setDigitalFile(null);
  };

  const priceValue = Number(price);
  const canSubmit =
    title.trim().length > 0 &&
    description.trim().length > 0 &&
    priceValue > 0 &&
    (productType === 'physical' || digitalFile !== null) &&
    !isSubmitting;

  const handleAddImages = async () => {
    setIsUploadingImages(true);
    const urls = await pickAndUploadImages('listing-media', currentUser.id, 'media');
    setIsUploadingImages(false);
    if (urls.length > 0) setImages((prev) => [...prev, ...urls]);
  };

  const handleRemoveImage = (url: string) => setImages((prev) => prev.filter((u) => u !== url));

  const handlePickDigitalFile = async () => {
    setIsUploadingFile(true);
    const file = await pickAndUploadDocument('digital-files', currentUser.id, 'file');
    setIsUploadingFile(false);
    if (file) setDigitalFile(file);
  };

  const handleSubmit = () => {
    const linkedProject = myProjects.find((p) => p.title === projectTitle);
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      price: priceValue,
      productType,
      category,
      stock: productType === 'digital' ? null : stock.trim().length > 0 ? Number(stock) : null,
      projectId: linkedProject?.id,
      images,
      digitalFilePath: digitalFile?.path,
      digitalFileName: digitalFile?.fileName,
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.sectionLabel}>Photos</Text>
      <View style={styles.mediaRow}>
        {images.map((url) => (
          <View key={url} style={styles.mediaThumbWrap}>
            <Image source={{ uri: url }} style={styles.mediaThumb} contentFit="cover" />
            <AnimatedPressable
              style={styles.removeMediaButton}
              scaleTo={0.9}
              onPress={() => handleRemoveImage(url)}
              hitSlop={6}
            >
              <Ionicons name="close" size={13} color={colors.white} />
            </AnimatedPressable>
          </View>
        ))}
        <AnimatedPressable
          style={styles.addMedia}
          scaleTo={0.95}
          onPress={handleAddImages}
          disabled={isUploadingImages}
        >
          {isUploadingImages ? (
            <ActivityIndicator size="small" color={colors.warmBrown} />
          ) : (
            <>
              <Ionicons name="add" size={22} color={colors.warmBrown} />
              <Text style={styles.addMediaLabel}>Add</Text>
            </>
          )}
        </AnimatedPressable>
      </View>

      <Text style={styles.requiredHint}>Fields marked * are required.</Text>

      <TextField label="Title *" placeholder="Product or service title" value={title} onChangeText={setTitle} />
      <TextField
        label="Description *"
        placeholder="Describe what you're offering"
        multiline
        numberOfLines={4}
        value={description}
        onChangeText={setDescription}
      />
      <TextField
        label="Price (₱) *"
        placeholder="0"
        keyboardType="numeric"
        value={price}
        onChangeText={setPrice}
      />

      <CheckboxSelectField
        label="Product type *"
        value={PRODUCT_TYPES.find((o) => o.value === productType)?.label ?? PRODUCT_TYPES[0].label}
        options={PRODUCT_TYPES.map((o) => o.label)}
        onChange={(label) => {
          const option = PRODUCT_TYPES.find((o) => o.label === label);
          if (option) handleSelectProductType(option.value);
        }}
        icon="pricetag-outline"
        searchable={false}
      />

      {productType === 'digital' ? (
        <View style={styles.fileSection}>
          <Text style={styles.sectionLabel}>Digital file *</Text>
          {digitalFile ? (
            <View style={styles.fileRow}>
              <Ionicons name="document-attach-outline" size={18} color={colors.ink} />
              <Text style={styles.fileName} numberOfLines={1}>
                {digitalFile.fileName}
              </Text>
              <AnimatedPressable onPress={() => setDigitalFile(null)} scaleTo={0.9} hitSlop={6}>
                <Ionicons name="close-circle" size={18} color={colors.warmBrown} />
              </AnimatedPressable>
            </View>
          ) : (
            <AnimatedPressable
              style={styles.filePicker}
              scaleTo={0.98}
              onPress={handlePickDigitalFile}
              disabled={isUploadingFile}
            >
              {isUploadingFile ? (
                <ActivityIndicator size="small" color={colors.warmBrown} />
              ) : (
                <>
                  <Ionicons name="cloud-upload-outline" size={18} color={colors.warmBrown} />
                  <Text style={styles.filePickerLabel}>Upload the file buyers will receive</Text>
                </>
              )}
            </AnimatedPressable>
          )}
          <Text style={styles.fileHint}>
            Delivered to buyers automatically after purchase. Stays private until then.
          </Text>
        </View>
      ) : (
        <TextField
          label="Stock (leave blank for made-to-order)"
          placeholder="e.g. 10"
          keyboardType="numeric"
          value={stock}
          onChangeText={setStock}
        />
      )}

      <CheckboxSelectField
        label="Category *"
        value={category}
        options={categoryOptions}
        onChange={(v) => setCategory(v as ProductCategory)}
        icon="grid-outline"
        searchable={false}
      />

      {myProjects.length > 0 && (
        <SelectField
          label="Link to a project (optional)"
          value={projectTitle}
          options={[NO_PROJECT, ...myProjects.map((p) => p.title)]}
          onChange={setProjectTitle}
          icon="sparkles-outline"
        />
      )}

      <Button label={submitLabel} disabled={!canSubmit} onPress={handleSubmit} style={styles.submit} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
  },
  sectionLabel: {
    ...t.label,
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  mediaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  mediaThumbWrap: {
    width: 88,
    height: 88,
  },
  mediaThumb: {
    width: 88,
    height: 88,
    borderRadius: radius.md,
    backgroundColor: colors.softGray,
  },
  removeMediaButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: radius.pill,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.canvas,
  },
  requiredHint: {
    ...t.caption,
    color: colors.warmBrown,
    marginBottom: spacing.sm,
  },
  addMedia: {
    width: 88,
    height: 88,
    borderRadius: radius.md,
    backgroundColor: colors.softGray + '4d',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  addMediaLabel: {
    ...t.label,
    color: colors.warmBrown,
  },
  fileSection: {
    marginBottom: spacing.md,
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.softGray + '4d',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
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
  fileHint: {
    ...t.caption,
    color: colors.warmBrown,
    marginTop: spacing.xs,
  },
  submit: {
    marginTop: spacing.sm,
  },
});
