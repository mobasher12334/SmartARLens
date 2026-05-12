# 👁️ Smart AR Lens (Spatial AI)

Smart AR Lens is a cutting-edge Augmented Reality (AR) mobile application that merges Generative AI with spatial computing. Simply point your camera at any object in the real world, and the app will instantly analyze it, anchor a futuristic Sci-Fi holographic interface (HUD) to its physical location, and provide you with deep insights, estimated pricing, and origin details.

## 🌟 Key Features

- **🧠 Generative AI Analysis:** Powered by Google's Gemini Vision AI to instantly recognize and describe real-world objects in high detail.
- **🌌 3DOF Spatial Anchoring:** The UI doesn't just stick to your screen; it stays anchored to the object's physical location in your room using device gyroscope/accelerometer data (Spatial AR).
- **🛡️ Cyberpunk HUD Interface:** A dynamic, branching "Minority Report" style interface featuring a targeting reticle, tech lines, and holographic panels.
- **💵 Market Intelligence:** Automatically estimates the market price and the country of origin for scanned objects.
- **📝 Persistent Notes:** Add and save personal notes to scanned objects. Notes are saved persistently on your device.
- **📱 Standalone Mobile App:** Built with React Native and Expo, meaning it runs entirely on your Android/iOS device.

## 🛠️ Tech Stack

- **Framework:** React Native / Expo
- **AR/Camera:** `expo-camera`, `expo-sensors` (DeviceMotion)
- **AI/Backend:** Google Gemini API (`gemini-2.5-flash`)
- **Storage:** `@react-native-async-storage/async-storage`

## 🚀 Getting Started

Follow these steps to run the application on your own device.

### 1. Prerequisites
- [Node.js](https://nodejs.org/) installed on your computer.
- [Expo Go](https://expo.dev/client) app installed on your physical smartphone (available on App Store / Google Play).
- A free API key from Google Gemini (Google AI Studio).

### 2. Installation

Clone the repository and install the dependencies:

```bash
git clone https://github.com/your-username/smart-ar-lens.git
cd smart-ar-lens
npm install
```

### 3. Add Your API Key
For security reasons, the API key is not included in this repository. You must add your own Gemini API key.

1. Get an API key from [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Open the file: `constants/config.ts`.
3. Locate the `GEMINI_API_KEY` variable and replace the placeholder with your actual key:

```typescript
export const GEMINI_API_KEY = 'YOUR_GEMINI_API_KEY_HERE';
```

### 4. Running the App (Local Development)

Start the Expo development server:

```bash
npx expo start
```

1. A QR code will appear in your terminal.
2. Open the **Expo Go** app on your phone.
3. Scan the QR code. The app will bundle and open on your device.

### 5. Building a Standalone App (APK for Android)
If you want to build a real standalone `.apk` file that installs permanently on your phone (without needing Expo Go or your laptop):

```bash
npm install -g eas-cli
eas login
eas build --platform android --profile preview
```
After the build finishes on Expo's servers (usually takes 10-15 minutes), it will give you a link to download the APK directly to your phone.

## 💡 How to Use

1. **Grant Permissions:** Upon first launch, grant the app permission to use your camera.
2. **Aim:** Point the center green reticle at any object in your environment (e.g., a keyboard, a cup, a plant).
3. **Scan:** Tap the "تحديد وتحليل" (Analyze) button. Hold still for a second while the AI takes a high-res photo.
4. **Interact:** The HUD will unfold in 3D space! 
   - Look right to read the detailed description.
   - Look left to access Action buttons (Purchase info, add notes).
   - If you look away, the HUD will gracefully fade out since it remains anchored to the object.
5. **Reset:** Tap the red "مسح عنصر جديد ✕" (Scan new item) button at the bottom to reset the view and scan something else.

## ⚠️ Limitations & Notes
- **3DOF vs 6DOF:** This app uses 3 Degrees of Freedom (3DOF) based on the device's gyroscope. This means the HUD tracks your *head rotation* perfectly in space, but it does not track positional movement (walking forward/backward). It is optimized for standing in place and looking around.
- **Moving Objects:** The app anchors information to a *spatial coordinate* in your room. If you scan a moving object (like a walking pet), the HUD will remain anchored to the empty space where the pet *used to be*.

## 📄 License
This project is open-source and available under the MIT License. Feel free to fork, modify, and build upon it!
