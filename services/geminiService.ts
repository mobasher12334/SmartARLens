// Smart AR Lens - Gemini API Service
// Handles all communication with Google Gemini 1.5 Flash model

import {
  GEMINI_API_URL,
  RECOGNITION_PROMPT,
  FOLLOWUP_PROMPT_TEMPLATE,
  TRANSLATION_PROMPT_TEMPLATE,
  SHOPPING_PROMPT_TEMPLATE,
  COMPARISON_PROMPT_TEMPLATE,
} from '../constants/config';
import { GeminiResponse, ShoppingInfo, ComparisonRow, ChatMessage } from '../types';

/**
 * Send a request to the Gemini API
 */
async function callGemini(
  textPrompt: string,
  imageBase64?: string
): Promise<string> {
  const parts: any[] = [{ text: textPrompt }];

  if (imageBase64) {
    // Strip the data URI prefix if present
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    parts.unshift({
      inline_data: {
        mime_type: 'image/jpeg',
        data: cleanBase64,
      },
    });
  }

  const body = {
    contents: [
      {
        parts,
      },
    ],
    generationConfig: {
      temperature: 0.4,
      topK: 32,
      topP: 1,
      maxOutputTokens: 1024,
    },
  };

  try {
    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Gemini API error:', response.status, errorData);
      throw new Error(`خطأ في الاتصال بالذكاء الاصطناعي (${response.status})`);
    }

    const data = await response.json();

    if (
      data.candidates &&
      data.candidates[0] &&
      data.candidates[0].content &&
      data.candidates[0].content.parts &&
      data.candidates[0].content.parts[0]
    ) {
      return data.candidates[0].content.parts[0].text;
    }

    throw new Error('لم يتم الحصول على إجابة من الذكاء الاصطناعي');
  } catch (error: any) {
    if (error.message.startsWith('خطأ') || error.message.startsWith('لم')) {
      throw error;
    }
    console.error('Network error:', error);
    throw new Error('خطأ في الاتصال بالشبكة. تأكد من اتصالك بالإنترنت.');
  }
}

/**
 * Recognize an object from a camera image
 */
export async function recognizeObject(
  base64Image: string
): Promise<GeminiResponse> {
  const responseText = await callGemini(RECOGNITION_PROMPT, base64Image);

  // Parse structured response
  const lines = responseText.split('\n').filter((l) => l.trim());
  const parsed: GeminiResponse = {
    name: 'شيء غير معروف',
    description: '',
    price: 'غير محدد',
    origin: 'غير محدد',
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('الاسم:')) {
      parsed.name = trimmed.replace('الاسم:', '').trim();
    } else if (trimmed.startsWith('الوصف:')) {
      parsed.description = trimmed.replace('الوصف:', '').trim();
    } else if (trimmed.startsWith('السعر التقريبي:')) {
      parsed.price = trimmed.replace('السعر التقريبي:', '').trim();
    } else if (trimmed.startsWith('بلد المنشأ:')) {
      parsed.origin = trimmed.replace('بلد المنشأ:', '').trim();
    }
  }

  // If description is empty, use remaining unparsed text
  if (!parsed.description) {
    parsed.description = lines
      .filter(
        (l) =>
          !l.includes('الاسم:') &&
          !l.includes('السعر التقريبي:') &&
          !l.includes('بلد المنشأ:')
      )
      .join(' ')
      .trim();
  }

  return parsed;
}

/**
 * Ask a follow-up question about a recognized object
 */
export async function askFollowUp(
  base64Image: string,
  objectName: string,
  chatHistory: ChatMessage[],
  question: string
): Promise<string> {
  // Build context from chat history
  let contextPrompt = FOLLOWUP_PROMPT_TEMPLATE(question, objectName);

  if (chatHistory.length > 0) {
    const historyText = chatHistory
      .slice(-6) // Last 6 messages for context
      .map((m) => `${m.role === 'user' ? 'السؤال' : 'الإجابة'}: ${m.content}`)
      .join('\n');
    contextPrompt += `\n\nسجل المحادثة السابقة:\n${historyText}`;
  }

  return await callGemini(contextPrompt, base64Image);
}

/**
 * Translate text to Arabic
 */
export async function translateText(text: string): Promise<string> {
  const prompt = TRANSLATION_PROMPT_TEMPLATE(text);
  return await callGemini(prompt);
}

/**
 * Get shopping information for a product
 */
export async function getShoppingInfo(
  objectName: string
): Promise<ShoppingInfo> {
  const prompt = SHOPPING_PROMPT_TEMPLATE(objectName);
  const responseText = await callGemini(prompt);

  const result: ShoppingInfo = {
    price: 'غير محدد',
    alternatives: [],
  };

  const lines = responseText.split('\n').filter((l) => l.trim());

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('السعر التقريبي:')) {
      result.price = trimmed.replace('السعر التقريبي:', '').trim();
    } else if (trimmed.startsWith('•') || trimmed.startsWith('-')) {
      const parts = trimmed.replace(/^[•\-]\s*/, '').split(' - ');
      if (parts.length >= 2) {
        result.alternatives.push({
          name: parts[0].trim(),
          price: parts.slice(1).join(' - ').trim(),
        });
      } else {
        result.alternatives.push({
          name: parts[0].trim(),
          price: '',
        });
      }
    }
  }

  return result;
}

/**
 * Compare two objects
 */
export async function compareObjects(
  name1: string,
  name2: string,
  base64Image1?: string,
  base64Image2?: string
): Promise<ComparisonRow[]> {
  const prompt = COMPARISON_PROMPT_TEMPLATE(name1, name2);
  // Use the first image for visual context if available
  const responseText = await callGemini(prompt, base64Image1);

  const rows: ComparisonRow[] = [];
  const lines = responseText.split('\n').filter((l) => l.trim());

  for (const line of lines) {
    const trimmed = line.trim();
    // Try to parse "label: value1 | value2" format
    const colonIdx = trimmed.indexOf(':');
    if (colonIdx > 0) {
      const label = trimmed.substring(0, colonIdx).trim();
      const valuesStr = trimmed.substring(colonIdx + 1).trim();
      const values = valuesStr.split('|').map((v) => v.trim());

      if (values.length >= 2) {
        rows.push({
          label,
          value1: values[0],
          value2: values[1],
        });
      }
    }
  }

  // Ensure we have at least the basic rows
  if (rows.length === 0) {
    rows.push(
      { label: 'الاسم', value1: name1, value2: name2 },
      { label: 'الوصف', value1: '-', value2: '-' },
      { label: 'السعر التقريبي', value1: '-', value2: '-' },
      { label: 'بلد المنشأ', value1: '-', value2: '-' }
    );
  }

  return rows;
}
