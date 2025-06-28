import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useHomeViewModel } from "../../src/screens/home/HomeViewModel";
import { formatCurrency } from "../../src/utils/currencyUtils";

type TimePeriod = "day" | "week" | "month";

const COLORS = {
  primary: "#007AFF",
  background: "#F8F9FA",
  card: "#FFFFFF",
  text: "#1C1C1E",
  textSecondary: "#8E8E93",
  success: "#34C759",
  danger: "#FF3B30",
  warning: "#FF9500",
  border: "#E5E5EA",
};

const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export default function HomeScreen() {
  const {
    spendingData,
    selectedPeriod,
    recentTransactions,
    categoryBreakdown,
    isLoading,
    isRefreshing,
    errorMessage,
    changePeriod,
    refresh,
  } = useHomeViewModel();

  const SpendingCard = ({
    title,
    amount,
    subtitle,
    color,
    icon,
  }: {
    title: string;
    amount: number;
    subtitle?: string;
    color: string;
    icon: keyof typeof Ionicons.glyphMap;
  }) => (
    <View style={[styles.card, { borderLeftColor: color, borderLeftWidth: 4 }]}>
      <View style={styles.cardHeader}>
        <Ionicons name={icon} size={24} color={color} />
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      <Text style={[styles.amount, { color }]}>{formatCurrency(amount)}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );

  const TimePeriodSelector = () => (
    <View style={styles.periodSelector}>
      {(["day", "week", "month"] as TimePeriod[]).map((period) => (
        <TouchableOpacity
          key={period}
          style={[
            styles.periodButton,
            selectedPeriod === period && styles.periodButtonActive,
          ]}
          onPress={() => changePeriod(period)}
          accessibilityRole="button"
          accessibilityState={{ selected: selectedPeriod === period }}
          accessibilityLabel={`Select ${period} period`}
        >
          <Text
            style={[
              styles.periodButtonText,
              selectedPeriod === period && styles.periodButtonTextActive,
            ]}
          >
            {period.charAt(0).toUpperCase() + period.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const TransactionItem = ({ transaction }: { transaction: any }) => (
    <View style={styles.transactionItem}>
      <View style={styles.transactionIcon}>
        <Ionicons
          name={transaction.type === "income" ? "add-circle" : "remove-circle"}
          size={20}
          color={transaction.type === "income" ? COLORS.success : COLORS.danger}
        />
      </View>
      <View style={styles.transactionDetails}>
        <Text style={styles.transactionDescription}>
          {transaction.description}
        </Text>
        <Text style={styles.transactionCategory}>{transaction.category}</Text>
      </View>
      <Text
        style={[
          styles.transactionAmount,
          {
            color:
              transaction.type === "income" ? COLORS.success : COLORS.danger,
          },
        ]}
      >
        {transaction.type === "income" ? "+" : "-"}
        {formatCurrency(Math.abs(transaction.amount))}
      </Text>
    </View>
  );

  const CategoryItem = ({ category }: { category: any }) => (
    <View style={styles.categoryItem}>
      <View
        style={[
          styles.categoryColor,
          { backgroundColor: category.categoryColor },
        ]}
      />
      <View style={styles.categoryDetails}>
        <Text style={styles.categoryName}>{category.categoryName}</Text>
        <Text style={styles.categoryAmount}>
          {formatCurrency(category.amount)} ({category.percentage.toFixed(1)}%)
        </Text>
      </View>
      <Ionicons
        name={
          category.trend === "up"
            ? "trending-up"
            : category.trend === "down"
              ? "trending-down"
              : "remove"
        }
        size={16}
        color={
          category.trend === "up"
            ? COLORS.danger
            : category.trend === "down"
              ? COLORS.success
              : COLORS.textSecondary
        }
      />
    </View>
  );

  const ReceiptCaptureButton = () => (
    <TouchableOpacity style={styles.receiptButton}>
      <Ionicons name="camera" size={24} color={COLORS.card} />
      <Text style={styles.receiptButtonText}>Scan Receipt</Text>
    </TouchableOpacity>
  );

  if (errorMessage) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={COLORS.danger} />
          <Text style={styles.errorText}>{errorMessage}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refresh}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={refresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>FinSync</Text>
          <Text style={styles.subtitle}>
            {selectedPeriod === "day" && "Today's Overview"}
            {selectedPeriod === "week" && "This Week's Overview"}
            {selectedPeriod === "month" && "This Month's Overview"}
          </Text>
        </View>

        <TimePeriodSelector />

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading spending data...</Text>
          </View>
        ) : spendingData ? (
          <View style={styles.cardsContainer}>
            <SpendingCard
              title="Total Income"
              amount={spendingData.totalIncome}
              subtitle={`Daily avg: ${formatCurrency(spendingData.dailyAverage)}`}
              color={COLORS.success}
              icon="trending-up"
            />
            <SpendingCard
              title="Total Expenses"
              amount={spendingData.totalExpenses}
              color={COLORS.danger}
              icon="trending-down"
            />
            <SpendingCard
              title="Net Income"
              amount={spendingData.netIncome}
              color={
                spendingData.netIncome >= 0 ? COLORS.success : COLORS.danger
              }
              icon={
                spendingData.netIncome >= 0
                  ? "checkmark-circle"
                  : "alert-circle"
              }
            />
          </View>
        ) : null}

        {categoryBreakdown.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Spending Breakdown</Text>
            <View style={styles.card}>
              {categoryBreakdown.slice(0, 5).map((category) => (
                <CategoryItem key={category.categoryId} category={category} />
              ))}
            </View>
          </View>
        )}

        {recentTransactions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <View style={styles.card}>
              {recentTransactions.slice(0, 5).map((transaction) => (
                <TransactionItem
                  key={transaction.id}
                  transaction={transaction}
                />
              ))}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <ReceiptCaptureButton />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  periodSelector: {
    flexDirection: "row",
    backgroundColor: COLORS.card,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    borderRadius: 12,
    padding: SPACING.xs,
  },
  periodButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 8,
    alignItems: "center",
  },
  periodButtonActive: {
    backgroundColor: COLORS.primary,
  },
  periodButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.textSecondary,
  },
  periodButtonTextActive: {
    color: COLORS.card,
  },
  cardsContainer: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.md,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.text,
    marginLeft: SPACING.sm,
  },
  amount: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: SPACING.xs,
  },
  section: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  transactionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  transactionIcon: {
    marginRight: SPACING.md,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  transactionCategory: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: "600",
  },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  categoryColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: SPACING.md,
  },
  categoryDetails: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  categoryAmount: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  receiptButton: {
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.md,
    borderRadius: 12,
    gap: SPACING.sm,
  },
  receiptButtonText: {
    color: COLORS.card,
    fontSize: 16,
    fontWeight: "600",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.lg,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginVertical: SPACING.md,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
  },
  retryButtonText: {
    color: COLORS.card,
    fontSize: 16,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.lg,
    minHeight: 200,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
});
