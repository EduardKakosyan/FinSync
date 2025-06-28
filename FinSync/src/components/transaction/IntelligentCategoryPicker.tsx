import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
  Alert,
  Animated,
  Vibration,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Category } from '@/types';
import { COLORS, SPACING, FONTS } from '@/constants';
import { categoryService } from '@/services/categoryService';

interface IntelligentCategoryPickerProps {
  selectedCategory?: string;
  onCategorySelect: (category: string) => void;
  transactionType: 'income' | 'expense';
  description?: string;
  amount?: number;
  placeholder?: string;
  disabled?: boolean;
  recentCategories?: string[];
  suggestedCategories?: string[];
}

interface CategorySuggestion {
  category: Category;
  confidence: number;
  reason: 'recent' | 'description_match' | 'amount_match' | 'time_pattern' | 'popular';
  reasonText: string;
}

interface CategoryGroup {
  title: string;
  categories: CategorySuggestion[];
  icon: string;
  color: string;
}

const IntelligentCategoryPicker: React.FC<IntelligentCategoryPickerProps> = ({
  selectedCategory,
  onCategorySelect,
  transactionType,
  description = '',
  amount = 0,
  placeholder = 'Select category',
  disabled = false,
  recentCategories = [],
  suggestedCategories = [],
}) => {
  const [visible, setVisible] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('');
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      loadCategories();
    }
  }, [visible, transactionType]);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const response = await categoryService.getCategoriesByType(transactionType);
      if (response.success && response.data) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setLoading(false);
    }
  };

  // Intelligent category suggestions based on various factors
  const categoryGroups = useMemo((): CategoryGroup[] => {
    if (!categories.length) return [];

    const suggestions: CategorySuggestion[] = [];
    const usedCategoryIds = new Set<string>();

    // 1. Recent categories (highest priority)
    recentCategories.forEach(categoryName => {
      const category = categories.find(c => c.name === categoryName);
      if (category && !usedCategoryIds.has(category.id)) {
        suggestions.push({
          category,
          confidence: 0.9,
          reason: 'recent',
          reasonText: 'Recently used',
        });
        usedCategoryIds.add(category.id);
      }
    });

    // 2. Description-based matching
    if (description.length > 3) {
      const descriptionLower = description.toLowerCase();
      const keywords = descriptionLower.split(' ').filter(word => word.length > 2);
      
      categories.forEach(category => {
        if (usedCategoryIds.has(category.id)) return;
        
        const categoryLower = category.name.toLowerCase();
        let matchScore = 0;
        let matchedKeywords: string[] = [];
        
        // Check for direct name match
        if (categoryLower.includes(descriptionLower) || descriptionLower.includes(categoryLower)) {
          matchScore = 0.8;
          matchedKeywords = [category.name];
        } else {
          // Check keyword matches
          keywords.forEach(keyword => {
            if (categoryLower.includes(keyword)) {
              matchScore += 0.2;
              matchedKeywords.push(keyword);
            }
          });
        }
        
        // Smart category mapping based on common keywords
        const smartMatches = getSmartCategoryMatches(descriptionLower, category.name);
        if (smartMatches.score > 0) {
          matchScore = Math.max(matchScore, smartMatches.score);
          matchedKeywords = [...matchedKeywords, ...smartMatches.keywords];
        }
        
        if (matchScore > 0.1) {
          suggestions.push({
            category,
            confidence: Math.min(matchScore, 0.85),
            reason: 'description_match',
            reasonText: `Matches: ${matchedKeywords.join(', ')}`,
          });
          usedCategoryIds.add(category.id);
        }
      });
    }

    // 3. Amount-based suggestions
    if (amount > 0) {
      categories.forEach(category => {
        if (usedCategoryIds.has(category.id)) return;
        
        const amountRange = getTypicalAmountRange(category.name, transactionType);
        if (amount >= amountRange.min && amount <= amountRange.max) {
          suggestions.push({
            category,
            confidence: 0.6,
            reason: 'amount_match',
            reasonText: `Typical for $${amount}`,
          });
          usedCategoryIds.add(category.id);
        }
      });
    }

    // 4. Time-based patterns (e.g., lunch time = food)
    const timeBasedSuggestions = getTimeBasedSuggestions(categories, transactionType);
    timeBasedSuggestions.forEach(suggestion => {
      if (!usedCategoryIds.has(suggestion.category.id)) {
        suggestions.push(suggestion);
        usedCategoryIds.add(suggestion.category.id);
      }
    });

    // 5. Popular categories
    const popularCategories = getPopularCategories(categories, transactionType);
    popularCategories.forEach(category => {
      if (!usedCategoryIds.has(category.id)) {
        suggestions.push({
          category,
          confidence: 0.4,
          reason: 'popular',
          reasonText: 'Commonly used',
        });
        usedCategoryIds.add(category.id);
      }
    });

    // Group suggestions by type
    const groups: CategoryGroup[] = [];

    // Smart suggestions (high confidence)
    const smartSuggestions = suggestions
      .filter(s => s.confidence > 0.6)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 4);
    
    if (smartSuggestions.length > 0) {
      groups.push({
        title: 'Smart Suggestions',
        categories: smartSuggestions,
        icon: 'bulb',
        color: COLORS.WARNING,
      });
    }

    // Recent categories
    const recentSuggestions = suggestions
      .filter(s => s.reason === 'recent')
      .slice(0, 3);
    
    if (recentSuggestions.length > 0) {
      groups.push({
        title: 'Recently Used',
        categories: recentSuggestions,
        icon: 'time',
        color: COLORS.INFO,
      });
    }

    // All other categories
    const remainingCategories = categories
      .filter(cat => !usedCategoryIds.has(cat.id))
      .map(category => ({
        category,
        confidence: 0.3,
        reason: 'popular' as const,
        reasonText: 'Available',
      }));
    
    if (remainingCategories.length > 0) {
      groups.push({
        title: 'All Categories',
        categories: remainingCategories,
        icon: 'grid',
        color: COLORS.TEXT_SECONDARY,
      });
    }

    return groups;
  }, [categories, description, amount, recentCategories, transactionType]);

  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return categoryGroups;
    
    const searchLower = searchQuery.toLowerCase();
    return categoryGroups.map(group => ({
      ...group,
      categories: group.categories.filter(item =>
        item.category.name.toLowerCase().includes(searchLower)
      ),
    })).filter(group => group.categories.length > 0);
  }, [categoryGroups, searchQuery]);

  const handleCategorySelect = useCallback((category: Category) => {
    onCategorySelect(category.name);
    setVisible(false);
    setSearchQuery('');
    
    // Haptic feedback
    if (Platform.OS === 'ios') {
      Vibration.vibrate([30]);
    }
  }, [onCategorySelect]);

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      Alert.alert('Error', 'Please enter a category name');
      return;
    }

    try {
      const color = newCategoryColor || getRandomCategoryColor();
      const response = await categoryService.createCategory({
        name: newCategoryName.trim(),
        color,
        type: transactionType,
      });

      if (response.success && response.data) {
        setCategories(prev => [...prev, response.data!]);
        handleCategorySelect(response.data);
        setNewCategoryName('');
        setNewCategoryColor('');
        setShowAddCategory(false);
      } else {
        Alert.alert('Error', response.error || 'Failed to create category');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create category');
    }
  };

  const selectedCategoryData = categories.find(cat => cat.name === selectedCategory);

  const CategorySuggestionItem = ({ item }: { item: CategorySuggestion }) => {
    const confidenceColor = getConfidenceColor(item.confidence);
    
    return (
      <TouchableOpacity
        style={styles.categoryItem}
        onPress={() => handleCategorySelect(item.category)}
      >
        <View style={styles.categoryInfo}>
          <View style={[
            styles.colorIndicator,
            { backgroundColor: item.category.color }
          ]} />
          <View style={styles.categoryDetails}>
            <Text style={styles.categoryName}>{item.category.name}</Text>
            <View style={styles.suggestionInfo}>
              <View style={[
                styles.confidenceBadge,
                { backgroundColor: confidenceColor }
              ]}>
                <Text style={styles.confidenceText}>
                  {Math.round(item.confidence * 100)}%
                </Text>
              </View>
              <Text style={styles.reasonText}>{item.reasonText}</Text>
            </View>
          </View>
        </View>
        
        {selectedCategory === item.category.name && (
          <Ionicons name="checkmark-circle" size={24} color={COLORS.SUCCESS} />
        )}
      </TouchableOpacity>
    );
  };

  const CategoryGroupHeader = ({ group }: { group: CategoryGroup }) => (
    <View style={styles.groupHeader}>
      <View style={[styles.groupIcon, { backgroundColor: group.color }]}>
        <Ionicons name={group.icon as any} size={16} color="white" />
      </View>
      <Text style={styles.groupTitle}>{group.title}</Text>
      <Text style={styles.groupCount}>({group.categories.length})</Text>
    </View>
  );

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, fadeAnim]);

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
              <View style={[
                styles.colorIndicator,
                { backgroundColor: selectedCategoryData.color }
              ]} />
              <Text style={styles.selectedCategoryText}>
                {selectedCategoryData.name}
              </Text>
            </View>
          ) : (
            <Text style={styles.placeholderText}>{placeholder}</Text>
          )}
        </View>
        
        <View style={styles.pickerActions}>
          {/* AI Badge */}
          <View style={styles.aiBadge}>
            <Ionicons name="sparkles" size={12} color={COLORS.WARNING} />
            <Text style={styles.aiBadgeText}>AI</Text>
          </View>
          
          <Ionicons
            name="chevron-down"
            size={20}
            color={disabled ? COLORS.TEXT_SECONDARY : COLORS.TEXT_PRIMARY}
          />
        </View>
      </TouchableOpacity>

      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <Animated.View style={[styles.modalContainer, { opacity: fadeAnim }]}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setVisible(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            
            <View style={styles.modalTitleContainer}>
              <Ionicons name="sparkles" size={20} color={COLORS.WARNING} />
              <Text style={styles.modalTitle}>
                Smart {transactionType === 'income' ? 'Income' : 'Expense'} Categories
              </Text>
            </View>
            
            <TouchableOpacity onPress={() => setShowAddCategory(true)}>
              <Ionicons name="add" size={24} color={COLORS.PRIMARY} />
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={COLORS.TEXT_SECONDARY} />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search categories..."
              placeholderTextColor={COLORS.TEXT_SECONDARY}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={COLORS.TEXT_SECONDARY} />
              </TouchableOpacity>
            )}
          </View>

          {/* Categories List */}
          <FlatList
            data={filteredGroups}
            keyExtractor={(item, index) => `${item.title}-${index}`}
            renderItem={({ item: group }) => (
              <View style={styles.groupContainer}>
                <CategoryGroupHeader group={group} />
                {group.categories.map((categoryItem, index) => (
                  <CategorySuggestionItem
                    key={`${group.title}-${categoryItem.category.id}-${index}`}
                    item={categoryItem}
                  />
                ))}
              </View>
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.categoriesList}
          />

          {/* Add Category Section */}
          {showAddCategory && (
            <View style={styles.addCategorySection}>
              <Text style={styles.addCategoryTitle}>Add New Category</Text>
              
              <TextInput
                style={styles.categoryInput}
                value={newCategoryName}
                onChangeText={setNewCategoryName}
                placeholder="Category name"
                placeholderTextColor={COLORS.TEXT_SECONDARY}
                autoFocus
              />

              <Text style={styles.colorSectionTitle}>Choose Color</Text>
              <View style={styles.colorGrid}>
                {getCategoryColors().map((color, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      newCategoryColor === color && styles.selectedColorOption,
                    ]}
                    onPress={() => setNewCategoryColor(color)}
                  >
                    {newCategoryColor === color && (
                      <Ionicons name="checkmark" size={16} color="white" />
                    )}
                  </TouchableOpacity>
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
        </Animated.View>
      </Modal>
    </>
  );
};

// Helper functions

function getSmartCategoryMatches(description: string, categoryName: string): { score: number; keywords: string[] } {
  const categoryMappings = {
    'food & dining': ['restaurant', 'food', 'lunch', 'dinner', 'breakfast', 'coffee', 'pizza', 'burger', 'meal'],
    'transportation': ['uber', 'taxi', 'gas', 'fuel', 'parking', 'metro', 'bus', 'train'],
    'shopping': ['store', 'amazon', 'mall', 'buy', 'purchase', 'walmart', 'target'],
    'entertainment': ['movie', 'cinema', 'game', 'concert', 'show', 'streaming', 'netflix'],
    'bills & utilities': ['electric', 'water', 'internet', 'phone', 'cable', 'bill', 'utility'],
    'health & medical': ['doctor', 'hospital', 'pharmacy', 'medicine', 'dental', 'medical'],
  };

  const categoryLower = categoryName.toLowerCase();
  const keywords = categoryMappings[categoryLower] || [];
  
  let score = 0;
  const matchedKeywords: string[] = [];
  
  keywords.forEach(keyword => {
    if (description.includes(keyword)) {
      score += 0.3;
      matchedKeywords.push(keyword);
    }
  });

  return { score: Math.min(score, 0.8), keywords: matchedKeywords };
}

function getTypicalAmountRange(categoryName: string, type: 'income' | 'expense'): { min: number; max: number } {
  const categoryLower = categoryName.toLowerCase();
  
  if (type === 'expense') {
    const expenseRanges = {
      'food & dining': { min: 5, max: 100 },
      'transportation': { min: 10, max: 200 },
      'shopping': { min: 20, max: 500 },
      'entertainment': { min: 10, max: 150 },
      'bills & utilities': { min: 50, max: 300 },
      'health & medical': { min: 20, max: 1000 },
    };
    
    for (const [category, range] of Object.entries(expenseRanges)) {
      if (categoryLower.includes(category.split(' ')[0])) {
        return range;
      }
    }
  }
  
  return { min: 0, max: Infinity };
}

function getTimeBasedSuggestions(categories: Category[], type: 'income' | 'expense'): CategorySuggestion[] {
  const now = new Date();
  const hour = now.getHours();
  const suggestions: CategorySuggestion[] = [];
  
  if (type === 'expense') {
    // Lunch time (11-14)
    if (hour >= 11 && hour <= 14) {
      const foodCategory = categories.find(c => c.name.toLowerCase().includes('food'));
      if (foodCategory) {
        suggestions.push({
          category: foodCategory,
          confidence: 0.7,
          reason: 'time_pattern',
          reasonText: 'Lunch time',
        });
      }
    }
    
    // Evening entertainment (18-22)
    if (hour >= 18 && hour <= 22) {
      const entertainmentCategory = categories.find(c => c.name.toLowerCase().includes('entertainment'));
      if (entertainmentCategory) {
        suggestions.push({
          category: entertainmentCategory,
          confidence: 0.6,
          reason: 'time_pattern',
          reasonText: 'Evening hours',
        });
      }
    }
  }
  
  return suggestions;
}

function getPopularCategories(categories: Category[], type: 'income' | 'expense'): Category[] {
  // In a real app, this would be based on usage statistics
  const popularNames = type === 'expense' 
    ? ['Food & Dining', 'Transportation', 'Shopping', 'Bills & Utilities']
    : ['Salary', 'Freelance', 'Investments'];
  
  return categories.filter(cat => 
    popularNames.some(name => cat.name.toLowerCase().includes(name.toLowerCase()))
  );
}

function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.8) return COLORS.SUCCESS;
  if (confidence >= 0.6) return COLORS.WARNING;
  if (confidence >= 0.4) return COLORS.INFO;
  return COLORS.TEXT_SECONDARY;
}

function getCategoryColors(): string[] {
  return [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
    '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D5A6BD',
  ];
}

function getRandomCategoryColor(): string {
  const colors = getCategoryColors();
  return colors[Math.floor(Math.random() * colors.length)];
}

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
    minHeight: 56,
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
  pickerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.SM,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    paddingHorizontal: SPACING.XS,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
  },
  aiBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.WARNING,
    fontFamily: FONTS.BOLD,
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
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.SM,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTS.SEMIBOLD,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.SURFACE,
    margin: SPACING.MD,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTS.REGULAR,
    marginLeft: SPACING.SM,
  },
  categoriesList: {
    padding: SPACING.MD,
  },
  groupContainer: {
    marginBottom: SPACING.LG,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.SM,
    paddingBottom: SPACING.SM,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  groupIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.SM,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTS.SEMIBOLD,
    flex: 1,
  },
  groupCount: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    fontFamily: FONTS.REGULAR,
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
  categoryDetails: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTS.REGULAR,
    marginBottom: 2,
  },
  suggestionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.SM,
  },
  confidenceBadge: {
    paddingHorizontal: SPACING.XS,
    paddingVertical: 2,
    borderRadius: 8,
  },
  confidenceText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: FONTS.BOLD,
  },
  reasonText: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    fontFamily: FONTS.REGULAR,
    fontStyle: 'italic',
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

export default IntelligentCategoryPicker;