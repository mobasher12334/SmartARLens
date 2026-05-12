// Smart AR Lens - Configuration & Prompts

export const GEMINI_API_KEY = 'YOUR_GEMINI_API_KEY_HERE';

export const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

// Prompt for initial object recognition from camera image
export const RECOGNITION_PROMPT = `أنت مساعد ذكي يتعرف على الأشياء في الصور. أجب بالصيغة التالية دائماً:
الاسم: [اسم الشيء بدقة]
الوصف: [وصف مختصر ومفيد في سطرين]
السعر التقريبي: [سعر تقريبي بالريال السعودي أو الدولار]
بلد المنشأ: [البلد إذا أمكن تحديده]`;

// Prompt template for follow-up questions about an object
export const FOLLOWUP_PROMPT_TEMPLATE = (question: string, objectName: string) =>
  `أجب عن السؤال التالي بناءً على الصورة المرفقة. السؤال: ${question}
الصورة تظهر: ${objectName}
أجب بالعربية، إجابة مختصرة ومفيدة.`;

// Prompt template for text translation to Arabic
export const TRANSLATION_PROMPT_TEMPLATE = (text: string) =>
  `Translate the following text to Arabic. Only return the translation, nothing else.
Text: ${text}`;

// Prompt template for shopping info lookup
export const SHOPPING_PROMPT_TEMPLATE = (objectName: string) =>
  `Find the approximate retail price of this product: ${objectName}.
Suggest 2 similar alternative products with their approximate prices.
Respond in Arabic in this format:
السعر التقريبي: [price]
بدائل مشابهة:
• [name] - [price]
• [name] - [price]`;

// Prompt template for object comparison
export const COMPARISON_PROMPT_TEMPLATE = (name1: string, name2: string) =>
  `قارن بين هذين الشيئين:
الشيء الأول: ${name1}
الشيء الثاني: ${name2}

أجب بالصيغة التالية (جدول مقارنة):
الاسم: ${name1} | ${name2}
الوصف: [وصف مختصر 1] | [وصف مختصر 2]
السعر التقريبي: [سعر 1] | [سعر 2]
بلد المنشأ: [بلد 1] | [بلد 2]
إذا كانا طعاماً أضف سطر: المكونات الغذائية: [معلومات 1] | [معلومات 2]`;

// Gyroscope configuration
export const GYROSCOPE_UPDATE_INTERVAL = 16; // ~60fps
export const ACCELEROMETER_UPDATE_INTERVAL = 16;

// AR anchoring sensitivity multiplier
export const AR_SENSITIVITY = {
  x: 150, // horizontal movement sensitivity
  y: 150, // vertical movement sensitivity
};

// Storage keys
export const STORAGE_KEYS = {
  notes: '@ar_notes',
};
