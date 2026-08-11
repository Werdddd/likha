import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { digitalCategories, getProjectsByCreator, physicalCategories } from '../constants/mock-data';
import { colors, radius, spacing, type as t } from '../constants/theme';
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
}

const PRODUCT_TYPES: Array<{ value: ProductType; label: string }> = [
  { value: 'digital', label: 'Digital (instant download)' },
  { value: 'physical', label: 'Physical / made-to-order' },
];

interface ListingFormProps {
  submitLabel: string;
  onSubmit: (values: ListingFormValues) => void;
}

const placeholderMedia = ['lf-media-1', 'lf-media-2'];
const NO_PROJECT = 'None';

export function ListingForm({ submitLabel, onSubmit }: ListingFormProps) {
  const currentUser = useSessionStore((s) => s.currentUser);
  const myProjects = useMemo(() => getProjectsByCreator(currentUser.id), [currentUser.id]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [productType, setProductType] = useState<ProductType>('digital');
  const [category, setCategory] = useState<ProductCategory>(digitalCategories[0]);
  const [stock, setStock] = useState('');
  const [projectTitle, setProjectTitle] = useState(NO_PROJECT);
  const [mediaSeeds, setMediaSeeds] = useState<string[]>(placeholderMedia);

  const categoryOptions = productType === 'digital' ? digitalCategories : physicalCategories;

  const handleSelectProductType = (value: ProductType) => {
    setProductType(value);
    const options = value === 'digital' ? digitalCategories : physicalCategories;
    if (!(options as ProductCategory[]).includes(category)) {
      setCategory(options[0]);
    }
  };

  const priceValue = Number(price);
  const canSubmit = title.trim().length > 0 && description.trim().length > 0 && priceValue > 0;

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
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.sectionLabel}>Photos</Text>
      <View style={styles.mediaRow}>
        {mediaSeeds.map((seed) => (
          <Image
            key={seed}
            source={{ uri: `https://picsum.photos/seed/${seed}/300/300` }}
            style={styles.mediaThumb}
            contentFit="cover"
          />
        ))}
        <AnimatedPressable
          style={styles.addMedia}
          scaleTo={0.95}
          onPress={() => setMediaSeeds((prev) => [...prev, `lf-media-${prev.length + 1}-${Date.now()}`])}
        >
          <Ionicons name="add" size={22} color={colors.warmBrown} />
          <Text style={styles.addMediaLabel}>Add</Text>
        </AnimatedPressable>
      </View>

      <TextField label="Title" placeholder="Product or service title" value={title} onChangeText={setTitle} />
      <TextField
        label="Description"
        placeholder="Describe what you're offering"
        multiline
        numberOfLines={4}
        value={description}
        onChangeText={setDescription}
      />
      <TextField
        label="Price (₱)"
        placeholder="0"
        keyboardType="numeric"
        value={price}
        onChangeText={setPrice}
      />

      <CheckboxSelectField
        label="Product type"
        value={PRODUCT_TYPES.find((o) => o.value === productType)?.label ?? PRODUCT_TYPES[0].label}
        options={PRODUCT_TYPES.map((o) => o.label)}
        onChange={(label) => {
          const option = PRODUCT_TYPES.find((o) => o.label === label);
          if (option) handleSelectProductType(option.value);
        }}
        icon="pricetag-outline"
        searchable={false}
      />

      {productType === 'physical' && (
        <TextField
          label="Stock (leave blank for made-to-order)"
          placeholder="e.g. 10"
          keyboardType="numeric"
          value={stock}
          onChangeText={setStock}
        />
      )}

      <CheckboxSelectField
        label="Category"
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
  mediaThumb: {
    width: 88,
    height: 88,
    borderRadius: radius.md,
    backgroundColor: colors.softGray,
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
  submit: {
    marginTop: spacing.sm,
  },
});
