// Smart AR Lens - Type Definitions

export interface Position {
  x: number;
  y: number;
}

export interface WorldPosition {
  x: number;
  y: number;
  z: number; // estimated depth
}

export interface SensorData {
  gyroscope: { x: number; y: number; z: number };
  accelerometer: { x: number; y: number; z: number };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface ARObject {
  id: string;
  name: string;
  description: string;
  price: string;
  origin: string;
  screenPosition: Position;
  worldPosition: WorldPosition;
  imageBase64: string;
  chatHistory: ChatMessage[];
  notes: string[];
  shoppingInfo: ShoppingInfo | null;
  translatedText: string | null;
  showOriginal: boolean;
  timestamp: number;
  isAskExpanded: boolean;
  isShoppingLoading: boolean;
  isTranslationLoading: boolean;
}

export interface SavedNote {
  id: string;
  objectName: string;
  note: string;
  sensorData: SensorData;
  date: string;
  timestamp: number;
}

export interface ShoppingInfo {
  price: string;
  alternatives: Array<{
    name: string;
    price: string;
  }>;
}

export interface ComparisonRow {
  label: string;
  value1: string;
  value2: string;
}

export interface ComparisonResult {
  object1Name: string;
  object2Name: string;
  rows: ComparisonRow[];
  chatHistory: ChatMessage[];
}

export interface GeminiResponse {
  name: string;
  description: string;
  price: string;
  origin: string;
}
