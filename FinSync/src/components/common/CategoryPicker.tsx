import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Category } from '@/types';
import { COLORS, SPACING, FONTS } from '@/constants';
import { categoryService } from '@/services/categoryService';

interface CategoryPickerProps {
  selectedCategory?: string;
  onCategorySelect: (category: string) => void;
  type: 'income' | 'expense';
  placeholder?: string;
  disabled?: boolean;
}

const CategoryPicker: React.FC<CategoryPickerProps> = ({
  selectedCategory,
  onCategorySelect,
  type,
  placeholder = 'Select category',
  disabled = false,
}) => {
  const [visible, setVisible] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('');

  useEffect(() => {
    loadCategories();
  }, [type]);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const response = await categoryService.getCategoriesByType(type);
      if (response.success && response.data) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySelect = (category: Category) => {
    onCategorySelect(category.name);
    setVisible(false);
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      Alert.alert('Error', 'Please enter a category name');
      return;
    }

    try {
      const color = newCategoryColor || categoryService.getRandomColor();
      const response = await categoryService.createCategory({
        name: newCategoryName.trim(),
        color,
        type,
      });

      if (response.success && response.data) {
        setCategories(prev => [...prev, response.data!]);
        onCategorySelect(response.data.name);
        setNewCategoryName('');
        setNewCategoryColor('');
        setShowAddCategory(false);
        setVisible(false);
      } else {
        Alert.alert('Error', response.error || 'Failed to create category');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create category');
    }
  };

  const selectedCategoryData = categories.find(cat => cat.name === selectedCategory);

  const CategoryItem = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={styles.categoryItem}
      onPress={() => handleCategorySelect(item)}
    >
      <View style={styles.categoryInfo}>
        <View style={[styles.colorIndicator, { backgroundColor: item.color }]} />
        <Text style={styles.categoryName}>{item.name}</Text>
      </View>
      {selectedCategory === item.name && (
        <Ionicons name="checkmark" size={20} color={COLORS.PRIMARY} />
      )}
    </TouchableOpacity>
  );

  const ColorOption = ({ color, selected, onPress }: {
    color: string;
    selected: boolean;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      style={[
        styles.colorOption,
        { backgroundColor: color },
        selected && styles.selectedColorOption,
      ]}
      onPress={onPress}
    >
      {selected && (
        <Ionicons name="checkmark" size={16} color="white" />
      )}
    </TouchableOpacity>
  );

  return (
    <>
      <TouchableOpacity
        style={[styles.picker, disabled && styles.pickerDisabled]}
        onPress={() => !disabled && setVisible(true)}
        disabled={disabled}
      >
        <View style={styles.pickerContent}>
          {selectedCategoryData ? (
            <View style={styles.selectedCategory}>
              <View style={[styles.colorIndicator, { backgroundColor: selectedCategoryData.color }]} />
              <Text style={styles.selectedCategoryText}>{selectedCategoryData.name}</Text>
            </View>
          ) : (
            <Text style={styles.placeholderText}>{placeholder}</Text>
          )}
        </View>
        <Ionicons 
          name="chevron-down" 
          size={20} 
          color={disabled ? COLORS.TEXT_SECONDARY : COLORS.TEXT_PRIMARY} 
        />
      </TouchableOpacity>

      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setVisible(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              Select {type === 'income' ? 'Income' : 'Expense'} Category
            </Text>
            <TouchableOpacity onPress={() => setShowAddCategory(true)}>
              <Ionicons name="add" size={24} color={COLORS.PRIMARY} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={categories}
            keyExtractor={item => item.id}
            renderItem={CategoryItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.categoriesList}
          />

          {showAddCategory && (
            <View style={styles.addCategorySection}>
              <Text style={styles.addCategoryTitle}>Add New Category</Text>
              
              <TextInput
                style={styles.categoryInput}
                value={newCategoryName}
                onChangeText={setNewCategoryName}
                placeholder="Category name"
                placeholderTextColor={COLORS.TEXT_SECONDARY}
              />

              <Text style={styles.colorSectionTitle}>Choose Color</Text>
              <View style={styles.colorGrid}>
                {categoryService.getCategoryColors().map((color, index) => (
                  <ColorOption
                    key={index}
                    color={color}
                    selected={newCategoryColor === color}
                    onPress={() => setNewCategoryColor(color)}
                  />
                ))}
              </View>

              <View style={styles.addCategoryButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setShowAddCategory(false);
                    setNewCategoryName('');
                    setNewCategoryColor('');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={handleAddCategory}
                >
                  <Text style={styles.addButtonText}>Add Category</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.SURFACE,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: 12,
    padding: SPACING.MD,
  },
  pickerDisabled: {
    opacity: 0.6,
  },
  pickerContent: {
    flex: 1,
  },
  selectedCategory: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedCategoryText: {
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTS.REGULAR,
  },
  placeholderText: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
    fontFamily: FONTS.REGULAR,
  },
  colorIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: SPACING.SM,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.MD,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  cancelText: {
    fontSize: 16,
    color: COLORS.PRIMARY,
    fontFamily: FONTS.MEDIUM,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTS.SEMIBOLD,
  },
  categoriesList: {
    padding: SPACING.MD,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.MD,
    paddingHorizontal: SPACING.SM,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTS.REGULAR,
  },
  addCategorySection: {
    padding: SPACING.MD,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
    backgroundColor: COLORS.SURFACE,
  },
  addCategoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.MD,
    fontFamily: FONTS.SEMIBOLD,
  },
  categoryInput: {
    backgroundColor: COLORS.BACKGROUND,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: 12,
    padding: SPACING.MD,
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.MD,
    fontFamily: FONTS.REGULAR,
  },
  colorSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.SM,
    fontFamily: FONTS.SEMIBOLD,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: SPACING.MD,
  },
  colorOption: {
    width: 32,
    height: 32,
    borderRadius: 16,
    margin: SPACING.XS,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedColorOption: {
    borderWidth: 2,
    borderColor: COLORS.TEXT_PRIMARY,
  },
  addCategoryButtons: {
    flexDirection: 'row',
    gap: SPACING.SM,
  },
  cancelButton: {
    flex: 1,
    padding: SPACING.MD,
    borderRadius: 12,
    backgroundColor: COLORS.LIGHT,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTS.MEDIUM,
  },
  addButton: {
    flex: 1,
    padding: SPACING.MD,
    borderRadius: 12,
    backgroundColor: COLORS.PRIMARY,
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
    fontFamily: FONTS.SEMIBOLD,
  },
});

export default CategoryPicker;