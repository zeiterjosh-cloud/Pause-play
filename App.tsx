import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  BudgetSettings,
  isFirebaseConfigured,
  loadSettings,
  loadTransactions,
  saveFeedback,
  saveSettings,
  saveTransaction,
  Transaction,
} from './src/firebase';

type Screen = 'home' | 'log' | 'insights' | 'settings' | 'feedback';
type FeedbackType = 'suggestion' | 'bug report' | 'general';

const categories = ['Food', 'Transport', 'Shopping', 'Bills', 'Other'];
const feedbackTypes: FeedbackType[] = ['suggestion', 'bug report', 'general'];
const defaultUserId = 'demo-user';

const defaultSettings: BudgetSettings = {
  dailyBudget: 20,
  weeklyBudget: 140,
  softLimitWarnings: true,
  pauseTimerEnabled: true,
};

const startOfDay = (date: Date) => {
  const day = new Date(date);
  day.setHours(0, 0, 0, 0);
  return day.getTime();
};

const startOfWeek = (date: Date) => {
  const week = new Date(date);
  const day = week.getDay();
  const diff = day === 0 ? 6 : day - 1;
  week.setDate(week.getDate() - diff);
  week.setHours(0, 0, 0, 0);
  return week.getTime();
};

const currency = (value: number) => `$${value.toFixed(2)}`;

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [settings, setSettings] = useState<BudgetSettings>(defaultSettings);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const [amountInput, setAmountInput] = useState('');
  const [category, setCategory] = useState(categories[0]);
  const [reviewing, setReviewing] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(30);

  const [dailyInput, setDailyInput] = useState(defaultSettings.dailyBudget.toString());
  const [weeklyInput, setWeeklyInput] = useState(defaultSettings.weeklyBudget.toString());
  const [settingsMessage, setSettingsMessage] = useState('');

  const [rating, setRating] = useState(5);
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('suggestion');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackStatus, setFeedbackStatus] = useState('');
  const [purchaseStatus, setPurchaseStatus] = useState('');

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [remoteSettings, remoteTransactions] = await Promise.all([
          loadSettings(defaultUserId),
          loadTransactions(defaultUserId),
        ]);
        if (remoteSettings) {
          setSettings(remoteSettings);
          setDailyInput(remoteSettings.dailyBudget.toString());
          setWeeklyInput(remoteSettings.weeklyBudget.toString());
        }
        if (remoteTransactions.length) {
          setTransactions(remoteTransactions);
        }
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  useEffect(() => {
    if (!reviewing || secondsLeft === 0) {
      return;
    }

    const interval = setInterval(() => {
      setSecondsLeft((value) => (value <= 1 ? 0 : value - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [reviewing, secondsLeft]);

  const todayStart = startOfDay(new Date());
  const weekStart = startOfWeek(new Date());

  const dailySpent = useMemo(
    () =>
      transactions
        .filter((item) => item.timestamp >= todayStart)
        .reduce((sum, item) => sum + item.amount, 0),
    [transactions, todayStart],
  );

  const weeklySpent = useMemo(
    () =>
      transactions
        .filter((item) => item.timestamp >= weekStart)
        .reduce((sum, item) => sum + item.amount, 0),
    [transactions, weekStart],
  );

  const remaining = settings.dailyBudget - dailySpent;
  const percentUsed = settings.dailyBudget > 0 ? Math.min(dailySpent / settings.dailyBudget, 1) : 0;
  const softWarning = settings.softLimitWarnings && settings.dailyBudget > 0 && percentUsed >= 0.8;

  const pendingAmount = Number.parseFloat(amountInput || '0');
  const remainingAfterPurchase = settings.dailyBudget - (dailySpent + (Number.isFinite(pendingAmount) ? pendingAmount : 0));

  const categoryTotals = useMemo(() => {
    const totals = categories.reduce<Record<string, number>>((acc, item) => {
      acc[item] = 0;
      return acc;
    }, {});

    transactions
      .filter((item) => item.timestamp >= weekStart)
      .forEach((item) => {
        totals[item.category] = (totals[item.category] || 0) + item.amount;
      });

    return totals;
  }, [transactions, weekStart]);

  const weeklyBreakdown = useMemo(() => {
    return Array.from({ length: 7 }).map((_, index) => {
      const day = new Date();
      day.setDate(day.getDate() - index);
      const dayStart = startOfDay(day);
      const next = dayStart + 24 * 60 * 60 * 1000;
      const total = transactions
        .filter((item) => item.timestamp >= dayStart && item.timestamp < next)
        .reduce((sum, item) => sum + item.amount, 0);

      return {
        label: day.toLocaleDateString(undefined, { weekday: 'short' }),
        total,
      };
    });
  }, [transactions]);

  const beginReview = () => {
    const amount = Number.parseFloat(amountInput);
    if (!Number.isFinite(amount) || amount <= 0) {
      setPurchaseStatus('Enter a valid purchase amount.');
      return;
    }

    setPurchaseStatus('');
    setReviewing(true);
    setSecondsLeft(settings.pauseTimerEnabled ? 30 : 0);
  };

  const cancelPurchase = () => {
    setReviewing(false);
    setSecondsLeft(30);
    setAmountInput('');
  };

  const confirmPurchase = async () => {
    const amount = Number.parseFloat(amountInput);
    if (!Number.isFinite(amount) || amount <= 0) {
      return;
    }

    const transaction: Transaction = {
      id: `${Date.now()}`,
      amount,
      category,
      timestamp: Date.now(),
    };

    setTransactions((current) => [transaction, ...current]);
    setReviewing(false);
    setAmountInput('');
    setSecondsLeft(30);
    await saveTransaction(defaultUserId, transaction);
    setScreen('home');
  };

  const persistSettings = async () => {
    const dailyBudget = Number.parseFloat(dailyInput);
    const weeklyBudget = Number.parseFloat(weeklyInput);

    if (!Number.isFinite(dailyBudget) || !Number.isFinite(weeklyBudget) || dailyBudget <= 0 || weeklyBudget <= 0) {
      setSettingsMessage('Budgets must be numbers greater than zero.');
      return;
    }

    const nextSettings: BudgetSettings = {
      ...settings,
      dailyBudget,
      weeklyBudget,
    };

    setSettings(nextSettings);
    setSettingsMessage('Settings saved.');
    await saveSettings(defaultUserId, nextSettings);
  };

  const submitFeedback = async () => {
    if (!feedbackMessage.trim()) {
      setFeedbackStatus('Please enter feedback before submitting.');
      return;
    }

    await saveFeedback(defaultUserId, {
      rating,
      type: feedbackType,
      message: feedbackMessage.trim(),
      createdAt: Date.now(),
    });

    setFeedbackMessage('');
    setRating(5);
    setFeedbackType('suggestion');
    setFeedbackStatus('Thanks! Feedback submitted.');
  };

  const maxCategory = Math.max(...Object.values(categoryTotals), 1);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>PausePay</Text>
        <Text>Loading budget data...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.title}>PausePay</Text>
        <Text style={styles.subtitle}>
          {isFirebaseConfigured ? 'Firebase connected' : 'Firebase not configured (local-only mode)'}
        </Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {screen === 'home' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Home</Text>
            <Text style={styles.metricLabel}>Daily limit</Text>
            <Text style={styles.metricValue}>{currency(settings.dailyBudget)}</Text>
            <Text style={styles.metricLabel}>Remaining today</Text>
            <Text style={[styles.metricValue, remaining < 0 && styles.negative]}>{currency(remaining)}</Text>

            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.max(percentUsed * 100, 3)}%` }]} />
            </View>
            <Text style={styles.progressText}>{Math.round(percentUsed * 100)}% used today</Text>

            {softWarning && <Text style={styles.warning}>⚠️ You are close to today’s budget limit.</Text>}

            <Pressable style={styles.primaryButton} onPress={() => setScreen('log')}>
              <Text style={styles.primaryButtonText}>+ Log Purchase</Text>
            </Pressable>
          </View>
        )}

        {screen === 'log' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Log Purchase</Text>

            <Text style={styles.label}>Amount</Text>
            <TextInput
              style={styles.input}
              keyboardType="decimal-pad"
              placeholder="12.50"
              value={amountInput}
              onChangeText={setAmountInput}
            />

            <Text style={styles.label}>Category</Text>
            <View style={styles.chipWrap}>
              {categories.map((item) => (
                <Pressable
                  key={item}
                  style={[styles.chip, category === item && styles.chipSelected]}
                  onPress={() => setCategory(item)}
                >
                  <Text style={[styles.chipText, category === item && styles.chipTextSelected]}>{item}</Text>
                </Pressable>
              ))}
            </View>

            {!reviewing ? (
              <Pressable style={styles.primaryButton} onPress={beginReview}>
                <Text style={styles.primaryButtonText}>Start pause and review</Text>
              </Pressable>
            ) : (
              <View style={styles.pauseBox}>
                {settings.pauseTimerEnabled && <Text style={styles.timer}>⏳ {secondsLeft}s</Text>}
                <Text style={styles.prompt}>Do you need this right now?</Text>
                <Text style={styles.prompt}>What’s your remaining budget after this?</Text>
                <Text style={styles.remainingAfter}>{currency(remainingAfterPurchase)} left today</Text>

                <View style={styles.rowButtons}>
                  <Pressable style={[styles.secondaryButton, styles.grow]} onPress={cancelPurchase}>
                    <Text style={styles.secondaryButtonText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.primaryButton,
                      styles.grow,
                      settings.pauseTimerEnabled && secondsLeft > 0 && styles.buttonDisabled,
                    ]}
                    disabled={settings.pauseTimerEnabled && secondsLeft > 0}
                    onPress={confirmPurchase}
                  >
                    <Text style={styles.primaryButtonText}>Confirm</Text>
                  </Pressable>
                </View>
              </View>
            )}

            {purchaseStatus ? <Text style={styles.helperText}>{purchaseStatus}</Text> : null}
          </View>
        )}

        {screen === 'insights' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Insights</Text>
            <Text style={styles.label}>Weekly total: {currency(weeklySpent)}</Text>

            <Text style={styles.sectionTitle}>By category (week)</Text>
            {Object.entries(categoryTotals).map(([name, total]) => (
              <View key={name} style={styles.barRow}>
                <Text style={styles.barLabel}>{name}</Text>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${(total / maxCategory) * 100}%` }]} />
                </View>
                <Text style={styles.barValue}>{currency(total)}</Text>
              </View>
            ))}

            <Text style={styles.sectionTitle}>Weekly spending breakdown</Text>
            {weeklyBreakdown.map((item, index) => (
              <View key={`${item.label}-${index}`} style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>{item.label}</Text>
                <Text style={styles.breakdownValue}>{currency(item.total)}</Text>
              </View>
            ))}
          </View>
        )}

        {screen === 'settings' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Settings</Text>

            <Text style={styles.label}>Daily budget</Text>
            <TextInput
              style={styles.input}
              keyboardType="decimal-pad"
              value={dailyInput}
              onChangeText={setDailyInput}
            />

            <Text style={styles.label}>Weekly budget</Text>
            <TextInput
              style={styles.input}
              keyboardType="decimal-pad"
              value={weeklyInput}
              onChangeText={setWeeklyInput}
            />

            <View style={styles.switchRow}>
              <Text style={styles.label}>Soft limit warnings</Text>
              <Switch
                value={settings.softLimitWarnings}
                onValueChange={(value) => setSettings((current) => ({ ...current, softLimitWarnings: value }))}
              />
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.label}>Pause timer</Text>
              <Switch
                value={settings.pauseTimerEnabled}
                onValueChange={(value) => setSettings((current) => ({ ...current, pauseTimerEnabled: value }))}
              />
            </View>

            <Pressable style={styles.primaryButton} onPress={persistSettings}>
              <Text style={styles.primaryButtonText}>Save settings</Text>
            </Pressable>
            {settingsMessage ? <Text style={styles.helperText}>{settingsMessage}</Text> : null}
          </View>
        )}

        {screen === 'feedback' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Feedback</Text>
            <Text style={styles.label}>Rating</Text>
            <View style={styles.chipWrap}>
              {[1, 2, 3, 4, 5].map((item) => (
                <Pressable
                  key={item}
                  style={[styles.chip, rating === item && styles.chipSelected]}
                  onPress={() => setRating(item)}
                >
                  <Text style={[styles.chipText, rating === item && styles.chipTextSelected]}>{item}★</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>Type</Text>
            <View style={styles.chipWrap}>
              {feedbackTypes.map((item) => (
                <Pressable
                  key={item}
                  style={[styles.chip, feedbackType === item && styles.chipSelected]}
                  onPress={() => setFeedbackType(item)}
                >
                  <Text style={[styles.chipText, feedbackType === item && styles.chipTextSelected]}>{item}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>Message</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              multiline
              placeholder="Share a suggestion or bug report"
              value={feedbackMessage}
              onChangeText={setFeedbackMessage}
            />

            <Pressable style={styles.primaryButton} onPress={submitFeedback}>
              <Text style={styles.primaryButtonText}>Submit feedback</Text>
            </Pressable>
            {feedbackStatus ? <Text style={styles.helperText}>{feedbackStatus}</Text> : null}
          </View>
        )}
      </ScrollView>

      <View style={styles.tabBar}>
        {([
          ['home', 'Home'],
          ['log', 'Log'],
          ['insights', 'Insights'],
          ['settings', 'Settings'],
          ['feedback', 'Feedback'],
        ] as Array<[Screen, string]>).map(([value, label]) => (
          <Pressable key={value} style={styles.tabItem} onPress={() => setScreen(value)}>
            <Text style={[styles.tabText, screen === value && styles.tabTextActive]}>{label}</Text>
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f5f8',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
  },
  subtitle: {
    color: '#64748b',
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
    color: '#1f2937',
  },
  metricLabel: {
    color: '#64748b',
    marginTop: 4,
  },
  metricValue: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111827',
  },
  negative: {
    color: '#dc2626',
  },
  progressTrack: {
    marginTop: 12,
    height: 12,
    borderRadius: 999,
    backgroundColor: '#e2e8f0',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366f1',
  },
  progressText: {
    marginTop: 8,
    color: '#475569',
  },
  warning: {
    marginTop: 8,
    color: '#b45309',
    fontWeight: '600',
  },
  primaryButton: {
    marginTop: 16,
    backgroundColor: '#4f46e5',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  label: {
    color: '#334155',
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 6,
  },
  input: {
    borderColor: '#cbd5e1',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
  },
  multilineInput: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderColor: '#cbd5e1',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipSelected: {
    backgroundColor: '#e0e7ff',
    borderColor: '#6366f1',
  },
  chipText: {
    color: '#334155',
  },
  chipTextSelected: {
    color: '#3730a3',
    fontWeight: '600',
  },
  pauseBox: {
    marginTop: 16,
    borderRadius: 10,
    borderColor: '#cbd5e1',
    borderWidth: 1,
    padding: 14,
    backgroundColor: '#f8fafc',
  },
  timer: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1e3a8a',
    marginBottom: 8,
  },
  prompt: {
    color: '#334155',
    marginBottom: 6,
  },
  remainingAfter: {
    marginTop: 4,
    fontWeight: '700',
    color: '#0f766e',
  },
  rowButtons: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 10,
  },
  grow: {
    flex: 1,
  },
  secondaryButton: {
    marginTop: 16,
    borderColor: '#94a3b8',
    borderWidth: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#334155',
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  helperText: {
    marginTop: 8,
    color: '#475569',
  },
  sectionTitle: {
    marginTop: 16,
    marginBottom: 8,
    fontWeight: '700',
    color: '#1f2937',
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  barLabel: {
    width: 80,
    color: '#334155',
  },
  barTrack: {
    flex: 1,
    height: 10,
    backgroundColor: '#e2e8f0',
    borderRadius: 999,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#4f46e5',
  },
  barValue: {
    width: 64,
    textAlign: 'right',
    color: '#334155',
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomColor: '#e2e8f0',
    borderBottomWidth: 1,
  },
  breakdownLabel: {
    color: '#334155',
  },
  breakdownValue: {
    color: '#0f172a',
    fontWeight: '600',
  },
  switchRow: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tabBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopColor: '#cbd5e1',
    borderTopWidth: 1,
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingBottom: 10,
    paddingTop: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
  },
  tabText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#4338ca',
    fontWeight: '700',
  },
});
