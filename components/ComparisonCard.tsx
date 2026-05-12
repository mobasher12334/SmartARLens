// Smart AR Lens - Comparison Card Component
// Table comparing two AR objects side by side with chat capability

import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { COLORS, FONTS, SPACING, RADIUS, CARD } from '../constants/theme';
import { ComparisonRow, ChatMessage } from '../types';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface ComparisonCardProps {
  object1Name: string;
  object2Name: string;
  rows: ComparisonRow[];
  chatHistory: ChatMessage[];
  gyroOffsetX: number;
  gyroOffsetY: number;
  position: { x: number; y: number };
  onClose: () => void;
  onAskQuestion: (question: string) => void;
  isLoading: boolean;
  isQuestionLoading: boolean;
}

export const ComparisonCard: React.FC<ComparisonCardProps> = ({
  object1Name,
  object2Name,
  rows,
  chatHistory,
  gyroOffsetX,
  gyroOffsetY,
  position,
  onClose,
  onAskQuestion,
  isLoading,
  isQuestionLoading,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const [questionText, setQuestionText] = useState('');
  const [showAsk, setShowAsk] = useState(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleSubmit = () => {
    if (questionText.trim()) {
      onAskQuestion(questionText.trim());
      setQuestionText('');
    }
  };

  const cardWidth = Math.min(SCREEN_WIDTH - 20, 340);
  const cardX = position.x - cardWidth / 2 + gyroOffsetX;
  const cardY = position.y + gyroOffsetY;
  const clampedX = Math.max(10, Math.min(cardX, SCREEN_WIDTH - cardWidth - 10));
  const clampedY = Math.max(80, cardY);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          left: clampedX,
          top: clampedY,
          width: cardWidth,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      {/* Close Button */}
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Text style={styles.closeIcon}>✕</Text>
      </TouchableOpacity>

      {/* Title */}
      <Text style={styles.title}>📊 مقارنة</Text>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primaryGreen} />
          <Text style={styles.loadingText}>جاري المقارنة...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
        >
          {/* Table Header */}
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.tableCell, styles.tableCellHeader, styles.labelCell]}>
              المعيار
            </Text>
            <Text style={[styles.tableCell, styles.tableCellHeader]}>
              {object1Name}
            </Text>
            <Text style={[styles.tableCell, styles.tableCellHeader]}>
              {object2Name}
            </Text>
          </View>

          {/* Table Rows */}
          {rows.map((row, index) => (
            <View
              key={index}
              style={[
                styles.tableRow,
                index % 2 === 0
                  ? styles.tableRowEven
                  : styles.tableRowOdd,
              ]}
            >
              <Text style={[styles.tableCell, styles.labelCell, styles.labelText]}>
                {row.label}
              </Text>
              <Text style={[styles.tableCell, styles.valueText]}>
                {row.value1}
              </Text>
              <Text style={[styles.tableCell, styles.valueText]}>
                {row.value2}
              </Text>
            </View>
          ))}

          {/* Chat History */}
          {chatHistory.length > 0 && (
            <View style={styles.chatSection}>
              {chatHistory.map((msg) => (
                <View
                  key={msg.id}
                  style={[
                    styles.chatBubble,
                    msg.role === 'user'
                      ? styles.chatBubbleUser
                      : styles.chatBubbleAssistant,
                  ]}
                >
                  <Text style={styles.chatText}>
                    {msg.role === 'user' ? '👤' : '🤖'} {msg.content}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Ask Input */}
          {showAsk && (
            <View style={styles.inputRow}>
              <TextInput
                style={styles.textInput}
                placeholder="اسأل عن المقارنة..."
                placeholderTextColor={COLORS.secondaryText}
                value={questionText}
                onChangeText={setQuestionText}
                textAlign="right"
                onSubmitEditing={handleSubmit}
                editable={!isQuestionLoading}
              />
              <TouchableOpacity
                style={styles.sendButton}
                onPress={handleSubmit}
                disabled={isQuestionLoading || !questionText.trim()}
              >
                {isQuestionLoading ? (
                  <ActivityIndicator size="small" color={COLORS.primaryGreen} />
                ) : (
                  <Text style={styles.sendIcon}>⬆️</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}

      {/* Ask Button */}
      {!isLoading && (
        <TouchableOpacity
          style={styles.askToggle}
          onPress={() => setShowAsk(!showAsk)}
        >
          <Text style={styles.askToggleText}>
            {showAsk ? '🔼 إخفاء' : '💬 اسأل عن المقارنة'}
          </Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    maxHeight: 450,
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.card,
    borderLeftWidth: 4,
    borderLeftColor: '#FFD700',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
    overflow: 'hidden',
  },
  closeButton: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 68, 68, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  closeIcon: {
    color: COLORS.red,
    fontSize: 12,
    fontWeight: 'bold',
  },
  title: {
    fontSize: FONTS.header,
    fontWeight: 'bold',
    color: '#FFD700',
    textAlign: 'center',
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
    writingDirection: 'rtl',
  },
  loadingContainer: {
    padding: SPACING.xxl,
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.secondaryText,
    marginTop: SPACING.sm,
    fontSize: FONTS.description,
    writingDirection: 'rtl',
  },
  scrollContent: {
    paddingHorizontal: SPACING.sm,
    maxHeight: 320,
  },
  // Table
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.tableBorder,
  },
  tableHeader: {
    backgroundColor: 'rgba(0, 255, 136, 0.15)',
  },
  tableRowEven: {
    backgroundColor: COLORS.tableRowEven,
  },
  tableRowOdd: {
    backgroundColor: COLORS.tableRowOdd,
  },
  tableCell: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xs,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  tableCellHeader: {
    fontWeight: 'bold',
    color: COLORS.primaryGreen,
    fontSize: FONTS.small,
  },
  labelCell: {
    flex: 0.8,
  },
  labelText: {
    color: COLORS.secondaryText,
    fontSize: FONTS.small,
    fontWeight: '600',
  },
  valueText: {
    color: COLORS.white,
    fontSize: FONTS.small,
  },
  // Chat
  chatSection: {
    marginTop: SPACING.sm,
  },
  chatBubble: {
    padding: SPACING.sm,
    borderRadius: RADIUS.small,
    marginBottom: SPACING.xs,
  },
  chatBubbleUser: {
    backgroundColor: COLORS.chatBubbleUser,
  },
  chatBubbleAssistant: {
    backgroundColor: COLORS.chatBubbleAssistant,
  },
  chatText: {
    fontSize: FONTS.small,
    color: COLORS.white,
    writingDirection: 'rtl',
    textAlign: 'right',
    lineHeight: 16,
  },
  // Input
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.xs,
  },
  textInput: {
    flex: 1,
    backgroundColor: COLORS.inputBackground,
    borderRadius: RADIUS.input,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: FONTS.small,
    color: COLORS.inputText,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 255, 136, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.sm,
  },
  sendIcon: {
    fontSize: 14,
  },
  askToggle: {
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.tableBorder,
    alignItems: 'center',
  },
  askToggleText: {
    fontSize: FONTS.small,
    color: '#FFD700',
    writingDirection: 'rtl',
  },
});
