import React from "react";
import {
  ScrollView,
  RefreshControl,
  SafeAreaView,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useHomeViewModel } from "../../src/screens/home/HomeViewModel";
import { formatCurrency } from "../../src/utils/currencyUtils";
import { 
  Typography, 
  Card, 
  Button, 
  useColors, 
  useTokens,
  Heading1,
  BodyText,
  Amount,
  Caption,
  ResponsiveContainer,
  Grid,
  Stack,
  SafeScroll,
  useResponsiveDimensions
} from "../../src/design-system";

type TimePeriod = "day" | "week" | "month";

export default function HomeScreen() {
  const colors = useColors();
  const tokens = useTokens();
  const { isTablet } = useResponsiveDimensions();
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
    <Card 
      variant="elevated" 
      style={{ 
        borderLeftColor: color, 
        borderLeftWidth: 4,
        marginBottom: tokens.Spacing.md
      }}
    >
      <View style={{ 
        flexDirection: 'row', 
        alignItems: 'center', 
        marginBottom: tokens.Spacing.sm 
      }}>
        <Ionicons name={icon} size={24} color={color} />
        <Typography 
          variant="label" 
          style={{ marginLeft: tokens.Spacing.sm }}
        >
          {title}
        </Typography>
      </View>
      <Amount style={{ color, marginBottom: tokens.Spacing.xs }}>
        {formatCurrency(amount)}
      </Amount>
      {subtitle && (
        <Caption color="secondary">{subtitle}</Caption>
      )}
    </Card>
  );

  const TimePeriodSelector = () => (
    <Card variant="default" padding="xs">
      <Stack direction="row" spacing="xs">
        {(["day", "week", "month"] as TimePeriod[]).map((period) => (
          <Button
            key={period}
            variant={selectedPeriod === period ? "primary" : "ghost"}
            size="small"
            style={{ flex: 1 }}
            onPress={() => changePeriod(period)}
            accessibilityState={{ selected: selectedPeriod === period }}
            accessibilityLabel={`Select ${period} period`}
          >
            {period.charAt(0).toUpperCase() + period.slice(1)}
          </Button>
        ))}
      </Stack>
    </Card>
  );

  const TransactionItem = ({ transaction }: { transaction: any }) => (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: tokens.Spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    }}>
      <View style={{ marginRight: tokens.Spacing.md }}>
        <Ionicons
          name={transaction.type === "income" ? "add-circle" : "remove-circle"}
          size={20}
          color={transaction.type === "income" ? colors.success : colors.error}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Typography variant="body" style={{ marginBottom: tokens.Spacing.xs }}>
          {transaction.description}
        </Typography>
        <Caption color="secondary">{transaction.category}</Caption>
      </View>
      <Amount
        style={{
          color: transaction.type === "income" ? colors.success : colors.error,
        }}
      >
        {transaction.type === "income" ? "+" : "-"}
        {formatCurrency(Math.abs(transaction.amount))}
      </Amount>
    </View>
  );

  const CategoryItem = ({ category }: { category: any }) => (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: tokens.Spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    }}>
      <View
        style={{
          width: 12,
          height: 12,
          borderRadius: 6,
          backgroundColor: category.categoryColor,
          marginRight: tokens.Spacing.md,
        }}
      />
      <View style={{ flex: 1 }}>
        <Typography variant="body" style={{ marginBottom: tokens.Spacing.xs }}>
          {category.categoryName}
        </Typography>
        <Caption color="secondary">
          {formatCurrency(category.amount)} ({category.percentage.toFixed(1)}%)
        </Caption>
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
            ? colors.error
            : category.trend === "down"
              ? colors.success
              : colors.textSecondary
        }
      />
    </View>
  );

  const ReceiptCaptureButton = () => (
    <Button
      variant="primary"
      size="large"
      fullWidth
      leftIcon={<Ionicons name="camera" size={24} color={colors.textInverse} />}
      style={{ marginTop: tokens.Spacing.md }}
    >
      Scan Receipt
    </Button>
  );

  if (errorMessage) {
    return (
      <SafeAreaView style={{ 
        flex: 1, 
        backgroundColor: colors.background 
      }}>
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: tokens.Spacing.lg,
        }}>
          <Ionicons name="alert-circle" size={48} color={colors.error} />
          <BodyText 
            color="secondary" 
            align="center"
            style={{ 
              marginVertical: tokens.Spacing.md 
            }}
          >
            {errorMessage}
          </BodyText>
          <Button variant="primary" onPress={refresh}>
            Retry
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ 
      flex: 1, 
      backgroundColor: colors.background 
    }}>
      <ResponsiveContainer maxWidth={isTablet ? 1024 : undefined}>
        <SafeScroll
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={refresh} />
          }
        >
          {/* Header */}
          <Stack spacing="md" style={{ padding: tokens.Spacing.lg }}>
            <Heading1>FinSync</Heading1>
            <BodyText color="secondary">
              {selectedPeriod === "day" && "Today's Overview"}
              {selectedPeriod === "week" && "This Week's Overview"}
              {selectedPeriod === "month" && "This Month's Overview"}
            </BodyText>
          </Stack>

          {/* Time Period Selector */}
          <View style={{
            paddingHorizontal: tokens.Spacing.lg,
            marginBottom: tokens.Spacing.lg,
          }}>
            <TimePeriodSelector />
          </View>

          {/* Loading State */}
          {isLoading ? (
            <View style={{
              justifyContent: 'center',
              alignItems: 'center',
              padding: tokens.Spacing.lg,
              minHeight: 200,
            }}>
              <BodyText color="secondary" align="center">
                Loading spending data...
              </BodyText>
            </View>
          ) : spendingData ? (
            /* Spending Cards - Responsive Grid */
            <View style={{ paddingHorizontal: tokens.Spacing.lg }}>
              <Grid 
                columns={isTablet ? 3 : 1} 
                spacing="md"
                style={{ marginBottom: tokens.Spacing.lg }}
              >
                <SpendingCard
                  title="Total Income"
                  amount={spendingData.totalIncome}
                  subtitle={`Daily avg: ${formatCurrency(spendingData.dailyAverage)}`}
                  color={colors.success}
                  icon="trending-up"
                />
                <SpendingCard
                  title="Total Expenses"
                  amount={spendingData.totalExpenses}
                  color={colors.error}
                  icon="trending-down"
                />
                <SpendingCard
                  title="Net Income"
                  amount={spendingData.netIncome}
                  color={spendingData.netIncome >= 0 ? colors.success : colors.error}
                  icon={
                    spendingData.netIncome >= 0
                      ? "checkmark-circle"
                      : "alert-circle"
                  }
                />
              </Grid>
            </View>
          ) : null}

          {/* Content Grid for Tablet */}
          {isTablet && (categoryBreakdown.length > 0 || recentTransactions.length > 0) ? (
            <View style={{ paddingHorizontal: tokens.Spacing.lg }}>
              <Grid columns={2} spacing="lg">
                {/* Spending Breakdown */}
                {categoryBreakdown.length > 0 && (
                  <Stack spacing="md">
                    <Typography variant="h3">Spending Breakdown</Typography>
                    <Card variant="default">
                      {categoryBreakdown.slice(0, 5).map((category) => (
                        <CategoryItem key={category.categoryId} category={category} />
                      ))}
                    </Card>
                  </Stack>
                )}

                {/* Recent Transactions */}
                {recentTransactions.length > 0 && (
                  <Stack spacing="md">
                    <Typography variant="h3">Recent Transactions</Typography>
                    <Card variant="default">
                      {recentTransactions.slice(0, 5).map((transaction) => (
                        <TransactionItem
                          key={transaction.id}
                          transaction={transaction}
                        />
                      ))}
                    </Card>
                  </Stack>
                )}
              </Grid>
            </View>
          ) : (
            /* Mobile Layout - Stacked */
            <Stack spacing="lg" style={{ paddingHorizontal: tokens.Spacing.lg }}>
              {/* Spending Breakdown */}
              {categoryBreakdown.length > 0 && (
                <Stack spacing="md">
                  <Typography variant="h3">Spending Breakdown</Typography>
                  <Card variant="default">
                    {categoryBreakdown.slice(0, 5).map((category) => (
                      <CategoryItem key={category.categoryId} category={category} />
                    ))}
                  </Card>
                </Stack>
              )}

              {/* Recent Transactions */}
              {recentTransactions.length > 0 && (
                <Stack spacing="md">
                  <Typography variant="h3">Recent Transactions</Typography>
                  <Card variant="default">
                    {recentTransactions.slice(0, 5).map((transaction) => (
                      <TransactionItem
                        key={transaction.id}
                        transaction={transaction}
                      />
                    ))}
                  </Card>
                </Stack>
              )}
            </Stack>
          )}

          {/* Receipt Capture Button */}
          <View style={{
            paddingHorizontal: tokens.Spacing.lg,
            marginTop: tokens.Spacing.lg,
          }}>
            <ReceiptCaptureButton />
          </View>
        </SafeScroll>
      </ResponsiveContainer>
    </SafeAreaView>
  );
}