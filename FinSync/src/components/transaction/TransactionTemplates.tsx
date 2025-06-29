import React, { useState, useEffect, useCallback } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONTS } from '@/constants';
import { CreateTransactionInput } from '@/types';
import { formatCurrency } from '@/utils/currencyUtils';

interface TransactionTemplate {
  id: string;
  name: string;
  description: string;
  amount?: number;
  category: string;
  type: 'income' | 'expense';
  frequency: 'once' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  icon: string;
  color: string;
  isRecurring: boolean;
  tags: string[];
  createdAt: Date;
  usageCount: number;
}

interface TransactionTemplatesProps {
  visible: boolean;
  onClose: () => void;
  onSelectTemplate: (template: Partial<CreateTransactionInput>) => void;
  transactionType?: 'income' | 'expense';
}

const TransactionTemplates: React.FC<TransactionTemplatesProps> = ({
  visible,
  onClose,
  onSelectTemplate,
  transactionType,
}) => {
  const [templates, setTemplates] = useState<TransactionTemplate[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'income' | 'expense'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      loadTemplates();
      if (transactionType) {
        setSelectedCategory(transactionType);
      }
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, transactionType]);

  const loadTemplates = useCallback(() => {
    // Start with empty templates for clean user experience
    const defaultTemplates: TransactionTemplate[] = [];
    
    setTemplates(defaultTemplates);
  }, []);

  const filteredTemplates = templates.filter(template => {
    const matchesCategory = selectedCategory === 'all' || template.type === selectedCategory;
    const matchesSearch = !searchQuery || 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesCategory && matchesSearch;
  }).sort((a, b) => b.usageCount - a.usageCount); // Sort by usage

  const handleSelectTemplate = useCallback((template: TransactionTemplate) => {
    const transactionData: Partial<CreateTransactionInput> = {
      amount: template.amount || 0,
      description: template.description,
      category: template.category,
      type: template.type,
      date: new Date(),
    };
    
    onSelectTemplate(transactionData);
    onClose();
    
    // Update usage count (in real app, save to storage)
    setTemplates(prev => prev.map(t => 
      t.id === template.id 
        ? { ...t, usageCount: t.usageCount + 1 }
        : t
    ));
  }, [onSelectTemplate, onClose]);

  const getFrequencyIcon = (frequency: TransactionTemplate['frequency']) => {
    switch (frequency) {
      case 'daily': return 'sunny';
      case 'weekly': return 'calendar';
      case 'monthly': return 'calendar-outline';
      case 'yearly': return 'calendar-clear';
      default: return 'time';
    }
  };

  const getFrequencyColor = (frequency: TransactionTemplate['frequency']) => {
    switch (frequency) {
      case 'daily': return COLORS.WARNING;
      case 'weekly': return COLORS.INFO;
      case 'monthly': return COLORS.PRIMARY;
      case 'yearly': return COLORS.SUCCESS;
      default: return COLORS.TEXT_SECONDARY;
    }
  };

  const TemplateItem = ({ item }: { item: TransactionTemplate }) => (
    <TouchableOpacity
      style={styles.templateItem}
      onPress={() => handleSelectTemplate(item)}
    >
      <View style={styles.templateHeader}>
        <View style={[
          styles.templateIcon,
          { backgroundColor: item.color },
        ]}>
          <Ionicons
            name={item.icon as any}
            size={20}
            color="white"
          />
        </View>
        
        <View style={styles.templateInfo}>
          <Text style={styles.templateName}>{item.name}</Text>
          <Text style={styles.templateDescription}>{item.description}</Text>
        </View>
        
        <View style={styles.templateMeta}>
          {item.amount && (
            <Text style={[
              styles.templateAmount,
              { color: item.type === 'income' ? COLORS.SUCCESS : COLORS.DANGER },
            ]}>
              {formatCurrency(item.amount, 'CAD')}
            </Text>
          )}
          
          <View style={styles.templateBadges}>
            {item.isRecurring && (
              <View style={[
                styles.frequencyBadge,
                { backgroundColor: getFrequencyColor(item.frequency) },
              ]}>
                <Ionicons
                  name={getFrequencyIcon(item.frequency)}
                  size={10}
                  color="white"
                />
                <Text style={styles.frequencyText}>
                  {item.frequency}
                </Text>
              </View>
            )}
            
            <View style={styles.usageBadge}>
              <Text style={styles.usageText}>
                Used {item.usageCount}x
              </Text>
            </View>
          </View>
        </View>
      </View>
      
      <View style={styles.templateTags}>
        {item.tags.slice(0, 3).map((tag, index) => (
          <View key={index} style={styles.tag}>
            <Text style={styles.tagText}>#{tag}</Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );

  const CategoryFilter = () => (
    <View style={styles.categoryFilter}>
      {(['all', 'income', 'expense'] as const).map(category => (
        <TouchableOpacity
          key={category}
          style={[
            styles.categoryButton,
            selectedCategory === category && styles.categoryButtonActive,
          ]}
          onPress={() => setSelectedCategory(category)}
        >
          <Text style={[
            styles.categoryButtonText,
            selectedCategory === category && styles.categoryButtonTextActive,
          ]}>
            {category === 'all' ? 'All' : category.charAt(0).toUpperCase() + category.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          
          <View style={styles.titleContainer}>
            <Ionicons name="bookmark" size={20} color={COLORS.PRIMARY} />
            <Text style={styles.title}>Transaction Templates</Text>
          </View>
          
          <TouchableOpacity onPress={() => setShowCreateTemplate(true)}>
            <Ionicons name="add" size={24} color={COLORS.PRIMARY} />
          </TouchableOpacity>
        </View>

        {/* Search and Filters */}
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={COLORS.TEXT_SECONDARY} />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search templates..."
              placeholderTextColor={COLORS.TEXT_SECONDARY}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={COLORS.TEXT_SECONDARY} />
              </TouchableOpacity>
            )}
          </View>
          
          <CategoryFilter />
        </View>

        {/* Templates List */}
        <View style={styles.listContainer}>
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>
              {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''}
            </Text>
            <Text style={styles.listSubtitle}>
              Sorted by usage
            </Text>
          </View>
          
          <FlatList
            data={filteredTemplates}
            keyExtractor={item => item.id}
            renderItem={TemplateItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.templatesList}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="bookmark-outline" size={48} color={COLORS.TEXT_SECONDARY} />
                <Text style={styles.emptyTitle}>No templates found</Text>
                <Text style={styles.emptySubtitle}>
                  {searchQuery 
                    ? 'Try adjusting your search terms'
                    : 'Create your first template to get started'
                  }
                </Text>
              </View>
            }
          />
        </View>

      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  header: {
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
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.SM,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTS.SEMIBOLD,
  },
  searchSection: {
    padding: SPACING.MD,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.SURFACE,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: 12,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    marginBottom: SPACING.MD,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTS.REGULAR,
    marginLeft: SPACING.SM,
  },
  categoryFilter: {
    flexDirection: 'row',
    gap: SPACING.SM,
  },
  categoryButton: {
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderRadius: 20,
    backgroundColor: COLORS.SURFACE,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  categoryButtonActive: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.PRIMARY,
  },
  categoryButtonText: {
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTS.MEDIUM,
  },
  categoryButtonTextActive: {
    color: 'white',
  },
  listContainer: {
    flex: 1,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    backgroundColor: COLORS.LIGHT,
  },
  listTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTS.SEMIBOLD,
  },
  listSubtitle: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    fontFamily: FONTS.REGULAR,
  },
  templatesList: {
    padding: SPACING.MD,
  },
  templateItem: {
    backgroundColor: COLORS.SURFACE,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: 12,
    padding: SPACING.MD,
    marginBottom: SPACING.MD,
  },
  templateHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.SM,
  },
  templateIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.MD,
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTS.SEMIBOLD,
    marginBottom: 2,
  },
  templateDescription: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    fontFamily: FONTS.REGULAR,
  },
  templateMeta: {
    alignItems: 'flex-end',
  },
  templateAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: FONTS.BOLD,
    marginBottom: SPACING.XS,
  },
  templateBadges: {
    alignItems: 'flex-end',
    gap: SPACING.XS,
  },
  frequencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.XS,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
  },
  frequencyText: {
    fontSize: 10,
    color: 'white',
    fontWeight: 'bold',
    fontFamily: FONTS.BOLD,
  },
  usageBadge: {
    backgroundColor: COLORS.LIGHT,
    paddingHorizontal: SPACING.XS,
    paddingVertical: 2,
    borderRadius: 6,
  },
  usageText: {
    fontSize: 10,
    color: COLORS.TEXT_SECONDARY,
    fontFamily: FONTS.REGULAR,
  },
  templateTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.XS,
  },
  tag: {
    backgroundColor: COLORS.LIGHT,
    paddingHorizontal: SPACING.SM,
    paddingVertical: 2,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 10,
    color: COLORS.TEXT_SECONDARY,
    fontFamily: FONTS.REGULAR,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.XXL,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTS.SEMIBOLD,
    marginTop: SPACING.MD,
    marginBottom: SPACING.SM,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    fontFamily: FONTS.REGULAR,
    textAlign: 'center',
    paddingHorizontal: SPACING.LG,
  },
  quickActions: {
    padding: SPACING.MD,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
    backgroundColor: COLORS.SURFACE,
  },
  quickActionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTS.SEMIBOLD,
    marginBottom: SPACING.SM,
  },
  quickActionButtons: {
    flexDirection: 'row',
    gap: SPACING.SM,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.SM,
    backgroundColor: COLORS.LIGHT,
    borderRadius: 8,
    gap: SPACING.XS,
  },
  quickActionText: {
    fontSize: 12,
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTS.MEDIUM,
  },
});

export default TransactionTemplates;