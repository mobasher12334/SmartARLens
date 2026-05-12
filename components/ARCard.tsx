// Smart AR Lens - AR Card Component
// The floating info card that appears near recognized objects
// Supports: chat, shopping, notes, translation, swipe-to-dismiss

import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  PanResponder,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { COLORS, FONTS, SPACING, RADIUS, CARD } from '../constants/theme';
import { ARObject, ChatMessage, ShoppingInfo } from '../types';

const SCREEN_WIDTH = Dimensions.get('window').width;
const DISMISS_THRESHOLD = 100;

interface ARCardProps {
  object: ARObject;
  gyroOffsetX: number;
  gyroOffsetY: number;
  onClose: (id: string) => void;
  onAskQuestion: (id: string, question: string) => void;
  onSaveNote: (id: string, note: string) => void;
  onShop: (id: string) => void;
  onTranslate: (id: string) => void;
  onToggleTranslation: (id: string) => void;
  isQuestionLoading: boolean;
}

export const ARCard: React.FC<ARCardProps> = ({
  object,
  gyroOffsetX,
  gyroOffsetY,
  onClose,
  onAskQuestion,
  onSaveNote,
  onShop,
  onTranslate,
  onToggleTranslation,
  isQuestionLoading,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const panX = useRef(new Animated.Value(0)).current;
  const [questionText, setQuestionText] = useState('');
  const [noteText, setNoteText] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  // Entrance animation
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

  // Swipe-to-dismiss PanResponder
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 15 && Math.abs(gestureState.dy) < 20;
      },
      onPanResponderMove: (_, gestureState) => {
        panX.setValue(gestureState.dx);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (Math.abs(gestureState.dx) > DISMISS_THRESHOLD) {
          // Dismiss animation
          Animated.parallel([
            Animated.timing(panX, {
              toValue: gestureState.dx > 0 ? SCREEN_WIDTH : -SCREEN_WIDTH,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start(() => onClose(object.id));
        } else {
          // Snap back
          Animated.spring(panX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const handleAskSubmit = () => {
    if (questionText.trim()) {
      onAskQuestion(object.id, questionText.trim());
      setQuestionText('');
    }
  };

  const handleNoteSubmit = () => {
    if (noteText.trim()) {
      onSaveNote(object.id, noteText.trim());
      setNoteText('');
      setShowNoteInput(false);
    }
  };

  // Calculate AR-anchored position
  const cardX = object.screenPosition.x - CARD.maxWidth / 2 + gyroOffsetX;
  const cardY = object.screenPosition.y - 180 + gyroOffsetY;

  // Clamp position to keep card visible on screen
  const clampedX = Math.max(10, Math.min(cardX, SCREEN_WIDTH - CARD.maxWidth - 10));
  const clampedY = Math.max(60, cardY);

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.cardContainer,
        {
          left: clampedX,
          top: clampedY,
          opacity: fadeAnim,
          transform: [
            { translateY: slideAnim },
            { translateX: panX },
          ],
        },
      ]}
    >
      {/* Close Button */}
      <TouchableOpacity
        style={styles.closeButton}
        onPress={() => {
          Animated.parallel([
            Animated.timing(fadeAnim, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start(() => onClose(object.id));
        }}
      >
        <Text style={styles.closeIcon}>✕</Text>
      </TouchableOpacity>

      <ScrollView
        ref={scrollRef}
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      >
        {/* Object Name */}
        <Text style={styles.objectName}>{object.name}</Text>

        {/* Description with translation toggle */}
        <Text style={styles.description}>
          {object.translatedText && !object.showOriginal
            ? object.translatedText
            : object.description}
        </Text>

        {object.translatedText && (
          <TouchableOpacity
            onPress={() => onToggleTranslation(object.id)}
            style={styles.toggleButton}
          >
            <Text style={styles.toggleText}>
              {object.showOriginal ? '🌐 عرض الترجمة' : '📄 عرض الأصلي'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Price & Origin */}
        {object.price && object.price !== 'غير محدد' && (
          <Text style={styles.metaText}>💰 {object.price}</Text>
        )}
        {object.origin && object.origin !== 'غير محدد' && (
          <Text style={styles.metaText}>🌍 {object.origin}</Text>
        )}

        {/* Shopping Info Section */}
        {object.shoppingInfo && (
          <View style={styles.shoppingSection}>
            <View style={styles.divider} />
            <Text style={styles.sectionTitle}>🛒 معلومات التسوق</Text>
            <Text style={styles.shoppingPrice}>
              💰 السعر التقريبي: {object.shoppingInfo.price}
            </Text>
            {object.shoppingInfo.alternatives.length > 0 && (
              <>
                <Text style={styles.shoppingAltTitle}>🔄 بدائل مشابهة:</Text>
                {object.shoppingInfo.alternatives.map((alt, idx) => (
                  <Text key={idx} style={styles.shoppingAltItem}>
                    • {alt.name} {alt.price ? `- ${alt.price}` : ''}
                  </Text>
                ))}
              </>
            )}
          </View>
        )}

        {/* Chat History */}
        {object.chatHistory.length > 0 && (
          <View style={styles.chatSection}>
            <View style={styles.divider} />
            {object.chatHistory.map((msg) => (
              <View
                key={msg.id}
                style={[
                  styles.chatBubble,
                  msg.role === 'user'
                    ? styles.chatBubbleUser
                    : styles.chatBubbleAssistant,
                ]}
              >
                <Text style={styles.chatRole}>
                  {msg.role === 'user' ? '👤' : '🤖'}
                </Text>
                <Text style={styles.chatText}>{msg.content}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Ask Input (expanded) */}
        {object.isAskExpanded && (
          <View style={styles.inputSection}>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.textInput}
                placeholder="اسأل أي شيء عن هذا..."
                placeholderTextColor={COLORS.secondaryText}
                value={questionText}
                onChangeText={setQuestionText}
                textAlign="right"
                onSubmitEditing={handleAskSubmit}
                editable={!isQuestionLoading}
              />
              <TouchableOpacity
                style={styles.sendButton}
                onPress={handleAskSubmit}
                disabled={isQuestionLoading || !questionText.trim()}
              >
                {isQuestionLoading ? (
                  <ActivityIndicator size="small" color={COLORS.primaryGreen} />
                ) : (
                  <Text style={styles.sendIcon}>⬆️</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Note Input */}
        {showNoteInput && (
          <View style={styles.inputSection}>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.textInput}
                placeholder="اكتب ملاحظة..."
                placeholderTextColor={COLORS.secondaryText}
                value={noteText}
                onChangeText={setNoteText}
                textAlign="right"
                onSubmitEditing={handleNoteSubmit}
              />
              <TouchableOpacity
                style={styles.sendButton}
                onPress={handleNoteSubmit}
                disabled={!noteText.trim()}
              >
                <Text style={styles.sendIcon}>💾</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Action Buttons Row */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onShop(object.id)}
          disabled={object.isShoppingLoading}
        >
          {object.isShoppingLoading ? (
            <ActivityIndicator size="small" color={COLORS.primaryGreen} />
          ) : (
            <Text style={styles.actionIcon}>🛒</Text>
          )}
          <Text style={styles.actionLabel}>تسوق</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onAskQuestion(object.id, '__TOGGLE__')}
        >
          <Text style={styles.actionIcon}>💬</Text>
          <Text style={styles.actionLabel}>اسأل</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setShowNoteInput(!showNoteInput)}
        >
          <Text style={styles.actionIcon}>📝</Text>
          <Text style={styles.actionLabel}>ملاحظة</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onTranslate(object.id)}
          disabled={object.isTranslationLoading}
        >
          {object.isTranslationLoading ? (
            <ActivityIndicator size="small" color={COLORS.primaryGreen} />
          ) : (
            <Text style={styles.actionIcon}>🌐</Text>
          )}
          <Text style={styles.actionLabel}>ترجمة</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    position: 'absolute',
    width: CARD.maxWidth,
    minWidth: CARD.minWidth,
    maxHeight: 420,
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.card,
    borderLeftWidth: CARD.borderLeftWidth,
    borderLeftColor: COLORS.primaryGreen,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: CARD.shadowOpacity,
    shadowRadius: CARD.shadowRadius,
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
  scrollContent: {
    padding: SPACING.md,
    paddingTop: SPACING.lg,
    maxHeight: 340,
  },
  objectName: {
    fontSize: FONTS.objectName,
    fontWeight: 'bold',
    color: COLORS.primaryGreen,
    writingDirection: 'rtl',
    textAlign: 'right',
    marginBottom: SPACING.xs,
  },
  description: {
    fontSize: FONTS.description,
    color: COLORS.white,
    writingDirection: 'rtl',
    textAlign: 'right',
    lineHeight: 20,
    marginBottom: SPACING.sm,
  },
  metaText: {
    fontSize: FONTS.chatMessage,
    color: COLORS.secondaryText,
    writingDirection: 'rtl',
    textAlign: 'right',
    marginBottom: 2,
  },
  toggleButton: {
    alignSelf: 'flex-end',
    paddingVertical: 2,
    paddingHorizontal: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  toggleText: {
    fontSize: FONTS.small,
    color: COLORS.primaryGreen,
    writingDirection: 'rtl',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.tableBorder,
    marginVertical: SPACING.sm,
  },
  // Shopping
  shoppingSection: {
    marginTop: SPACING.xs,
  },
  sectionTitle: {
    fontSize: FONTS.description,
    fontWeight: 'bold',
    color: COLORS.primaryGreen,
    writingDirection: 'rtl',
    textAlign: 'right',
    marginBottom: SPACING.xs,
  },
  shoppingPrice: {
    fontSize: FONTS.chatMessage,
    color: COLORS.white,
    writingDirection: 'rtl',
    textAlign: 'right',
    marginBottom: SPACING.xs,
  },
  shoppingAltTitle: {
    fontSize: FONTS.chatMessage,
    color: COLORS.secondaryText,
    writingDirection: 'rtl',
    textAlign: 'right',
    marginBottom: 2,
  },
  shoppingAltItem: {
    fontSize: FONTS.chatMessage,
    color: COLORS.white,
    writingDirection: 'rtl',
    textAlign: 'right',
    paddingRight: SPACING.sm,
    marginBottom: 1,
  },
  // Chat
  chatSection: {
    marginTop: SPACING.xs,
  },
  chatBubble: {
    flexDirection: 'row',
    padding: SPACING.sm,
    borderRadius: RADIUS.small,
    marginBottom: SPACING.xs,
    alignItems: 'flex-start',
  },
  chatBubbleUser: {
    backgroundColor: COLORS.chatBubbleUser,
    flexDirection: 'row-reverse',
  },
  chatBubbleAssistant: {
    backgroundColor: COLORS.chatBubbleAssistant,
    flexDirection: 'row-reverse',
  },
  chatRole: {
    fontSize: FONTS.chatMessage,
    marginLeft: SPACING.xs,
  },
  chatText: {
    flex: 1,
    fontSize: FONTS.chatMessage,
    color: COLORS.white,
    writingDirection: 'rtl',
    textAlign: 'right',
    lineHeight: 18,
  },
  // Input
  inputSection: {
    marginTop: SPACING.sm,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    backgroundColor: COLORS.inputBackground,
    borderRadius: RADIUS.input,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: FONTS.chatMessage,
    color: COLORS.inputText,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 255, 136, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.sm,
  },
  sendIcon: {
    fontSize: 16,
  },
  // Actions
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.tableBorder,
  },
  actionButton: {
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
  },
  actionIcon: {
    fontSize: FONTS.icon,
    marginBottom: 2,
  },
  actionLabel: {
    fontSize: FONTS.small,
    color: COLORS.primaryGreen,
    writingDirection: 'rtl',
  },
});
