// Smart AR Lens - Notes Modal Component
// Shows all saved persistent AR notes with delete capability

import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  I18nManager,
} from 'react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../constants/theme';
import { SavedNote } from '../types';

// Force RTL
I18nManager.forceRTL(true);

interface NotesModalProps {
  visible: boolean;
  notes: SavedNote[];
  onClose: () => void;
  onDeleteNote: (noteId: string) => void;
}

export const NotesModal: React.FC<NotesModalProps> = ({
  visible,
  notes,
  onClose,
  onDeleteNote,
}) => {
  const renderNoteItem = ({ item }: { item: SavedNote }) => (
    <View style={styles.noteItem}>
      <View style={styles.noteContent}>
        <Text style={styles.noteObjectName}>{item.objectName}</Text>
        <Text style={styles.noteText} numberOfLines={2}>
          {item.note}
        </Text>
        <Text style={styles.noteDate}>{item.date}</Text>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => onDeleteNote(item.id)}
      >
        <Text style={styles.deleteIcon}>🗑️</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📋</Text>
      <Text style={styles.emptyText}>لا توجد ملاحظات محفوظة</Text>
      <Text style={styles.emptySubtext}>
        اضغط على 📝 في أي بطاقة لإضافة ملاحظة
      </Text>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>📋 ملاحظاتي</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Notes List */}
          <FlatList
            data={notes}
            keyExtractor={(item) => item.id}
            renderItem={renderNoteItem}
            ListEmptyComponent={renderEmpty}
            contentContainerStyle={
              notes.length === 0 ? styles.emptyList : styles.notesList
            }
            showsVerticalScrollIndicator={false}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: COLORS.darkBackground,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    minHeight: '50%',
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.tableBorder,
  },
  headerTitle: {
    fontSize: FONTS.header,
    fontWeight: 'bold',
    color: COLORS.primaryGreen,
    writingDirection: 'rtl',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 68, 68, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    color: COLORS.red,
    fontSize: FONTS.header,
    fontWeight: 'bold',
  },
  notesList: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noteItem: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: RADIUS.card,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderRightWidth: 3,
    borderRightColor: COLORS.primaryGreen,
  },
  noteContent: {
    flex: 1,
    writingDirection: 'rtl',
  },
  noteObjectName: {
    fontSize: FONTS.description,
    fontWeight: 'bold',
    color: COLORS.primaryGreen,
    marginBottom: SPACING.xs,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  noteText: {
    fontSize: FONTS.chatMessage,
    color: COLORS.white,
    marginBottom: SPACING.xs,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  noteDate: {
    fontSize: FONTS.small,
    color: COLORS.secondaryText,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  deleteButton: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: SPACING.md,
  },
  deleteIcon: {
    fontSize: FONTS.icon,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xxl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  emptyText: {
    fontSize: FONTS.header,
    color: COLORS.secondaryText,
    marginBottom: SPACING.sm,
    writingDirection: 'rtl',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: FONTS.chatMessage,
    color: COLORS.secondaryText,
    writingDirection: 'rtl',
    textAlign: 'center',
    opacity: 0.7,
  },
});
