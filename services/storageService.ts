// Smart AR Lens - Storage Service
// Persistent note storage using AsyncStorage

import AsyncStorage from '@react-native-async-storage/async-storage';
import { SavedNote } from '../types';
import { STORAGE_KEYS } from '../constants/config';

/**
 * Load all saved notes from storage
 */
export async function loadNotes(): Promise<SavedNote[]> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEYS.notes);
    if (json) {
      return JSON.parse(json) as SavedNote[];
    }
    return [];
  } catch (error) {
    console.error('Error loading notes:', error);
    return [];
  }
}

/**
 * Save a new note to storage
 */
export async function saveNote(note: SavedNote): Promise<void> {
  try {
    const existing = await loadNotes();
    existing.push(note);
    await AsyncStorage.setItem(STORAGE_KEYS.notes, JSON.stringify(existing));
  } catch (error) {
    console.error('Error saving note:', error);
    throw new Error('فشل في حفظ الملاحظة');
  }
}

/**
 * Delete a specific note by ID
 */
export async function deleteNote(noteId: string): Promise<void> {
  try {
    const existing = await loadNotes();
    const filtered = existing.filter((n) => n.id !== noteId);
    await AsyncStorage.setItem(STORAGE_KEYS.notes, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting note:', error);
    throw new Error('فشل في حذف الملاحظة');
  }
}

/**
 * Clear all saved notes
 */
export async function clearAllNotes(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.notes);
  } catch (error) {
    console.error('Error clearing notes:', error);
    throw new Error('فشل في مسح الملاحظات');
  }
}
