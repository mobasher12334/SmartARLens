// Smart AR Lens - Main Application (3DOF Spatial AR & Branching Sci-Fi UI)
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Dimensions,
  ActivityIndicator, StatusBar, Alert, I18nManager,
  Platform, TextInput, ScrollView
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { DeviceMotion } from 'expo-sensors';

import { NotesModal } from './components/NotesModal';
import * as GeminiService from './services/geminiService';
import * as StorageService from './services/storageService';
import { ARObject, SavedNote } from './types';
import { COLORS } from './constants/theme';

I18nManager.forceRTL(true);
const { width: SW, height: SH } = Dimensions.get('window');

// Tuning for the 3DOF effect
const FOV_RAD = Math.PI / 3; // roughly 60 degrees
const MOVEMENT_SCALE = SW / FOV_RAD;

export default function App() {
  const [permission, requestPermission] = useCameraPermissions();
  
  // AR tracking state
  const [currentRotation, setCurrentRotation] = useState({ alpha: 0, beta: 0, gamma: 0 });
  const [anchorRotation, setAnchorRotation] = useState<{ alpha: number, beta: number } | null>(null);
  
  // App state
  const [activeObject, setActiveObject] = useState<ARObject | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  
  // HUD state
  const [showShopping, setShowShopping] = useState(false);
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');
  
  const [notes, setNotes] = useState<SavedNote[]>([]);
  const [notesVisible, setNotesVisible] = useState(false);
  
  const cameraRef = useRef<any>(null);

  useEffect(() => {
    StorageService.loadNotes().then(setNotes);

    // Start 3DOF tracking
    DeviceMotion.setUpdateInterval(30);
    const sub = DeviceMotion.addListener((motionData) => {
      if (motionData.rotation) {
        setCurrentRotation(motionData.rotation);
      }
    });

    return () => sub.remove();
  }, []);

  const genId = () => Math.random().toString(36).substr(2, 9) + Date.now();

  const analyzeObject = async () => {
    if (!cameraRef.current) return;

    setIsLoading(true);
    setLoadingText('📸 جاري التقاط الصورة...');
    
    // Save current rotation as the physical anchor in the room
    setAnchorRotation({ alpha: currentRotation.alpha, beta: currentRotation.beta });

    try {
      const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.5 });
      
      setLoadingText('🤖 الذكاء الاصطناعي يحلل الشبكة الفراغية...');
      const info = await GeminiService.recognizeObject(photo.base64); 
      
      const obj: ARObject = {
        id: genId(), name: info.name, description: info.description,
        price: info.price, origin: info.origin,
        screenPosition: { x: SW / 2, y: SH / 2 },
        worldPosition: { x: 0, y: 0, z: 0 },
        imageBase64: photo.base64 || '', chatHistory: [], notes: [],
        shoppingInfo: null, translatedText: null, showOriginal: false,
        timestamp: Date.now(), isAskExpanded: false,
        isShoppingLoading: false, isTranslationLoading: false,
      };
      
      setActiveObject(obj);
      setShowShopping(false);
      setShowNoteInput(false);
    } catch (err: any) {
      Alert.alert('خطأ', err.message || 'فشل في التعرف');
      setAnchorRotation(null);
    }
    setIsLoading(false);
  };

  const closeCard = () => {
    setActiveObject(null);
    setAnchorRotation(null);
    setShowShopping(false);
    setShowNoteInput(false);
  };

  const saveNote = async () => {
    if (!newNoteText.trim() || !activeObject) return;
    const note: SavedNote = {
      id: genId(),
      objectId: activeObject.id,
      objectName: activeObject.name,
      text: newNoteText,
      timestamp: Date.now()
    };
    const updatedNotes = [...notes, note];
    setNotes(updatedNotes);
    try {
      await StorageService.saveNote(note);
      setNewNoteText('');
      setShowNoteInput(false);
      Alert.alert('تم', 'تم حفظ الملاحظة بنجاح!');
    } catch (e) {
      Alert.alert('خطأ', 'حدث خطأ أثناء الحفظ');
    }
  };

  if (!permission) return <View style={s.container}><ActivityIndicator size="large" color={COLORS.primaryGreen} /></View>;
  if (!permission.granted) {
    return (
      <View style={[s.container, { justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
        <Text style={{ color: 'white', textAlign: 'center', marginBottom: 20 }}>التطبيق يحتاج إلى الكاميرا للعمل</Text>
        <TouchableOpacity style={s.analyzeBtn} onPress={requestPermission}>
          <Text style={s.analyzeBtnText}>منح الصلاحية</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Calculate dynamic TARGET position based on physical device movement
  let centerX = SW / 2;
  let centerY = SH / 2;
  let opacity = 1;

  if (anchorRotation && activeObject) {
    let dAlpha = currentRotation.alpha - anchorRotation.alpha;
    let dBeta = currentRotation.beta - anchorRotation.beta;

    if (dAlpha > Math.PI) dAlpha -= 2 * Math.PI;
    if (dAlpha < -Math.PI) dAlpha += 2 * Math.PI;

    const dx = dAlpha * MOVEMENT_SCALE * -1; 
    const dy = dBeta * MOVEMENT_SCALE * -1.5;

    centerX += dx;
    centerY += dy;

    // Fade out completely if looking away
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance > SW * 0.6) {
      opacity = Math.max(0, 1 - (distance - SW * 0.6) / 100);
    }
  }

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <CameraView 
        style={StyleSheet.absoluteFill} 
        ref={cameraRef}
        facing="back"
      />

      {/* TOP BAR */}
      <View style={s.topBar}>
        <TouchableOpacity style={s.topBtn} onPress={() => setNotesVisible(true)}>
          <Text style={s.topBtnIcon}>📋</Text>
          {notes.length > 0 && <View style={s.badge}><Text style={s.badgeText}>{notes.length}</Text></View>}
        </TouchableOpacity>
        <Text style={s.appTitle}>Spatial HUD Lens</Text>
        <View style={{ width: 46 }} />
      </View>

      {/* CROSSHAIR FOR TARGETING (Hidden when an object is locked) */}
      {!activeObject && !isLoading && (
        <View style={s.reticleContainer}>
          <View style={s.reticleInner} />
          <View style={s.reticleBorder1} />
          <View style={s.reticleBorder2} />
          <View style={s.reticleBorder3} />
          <View style={s.reticleBorder4} />
        </View>
      )}

      {/* ANALYZE BUTTON */}
      {!activeObject && !isLoading && (
        <View style={s.analyzeArea}>
          <TouchableOpacity style={s.analyzeBtn} onPress={analyzeObject} activeOpacity={0.7}>
            <Text style={s.analyzeBtnText}>🎯 تحديد و تحليل</Text>
          </TouchableOpacity>
          <Text style={s.hintText}>وجه المؤشر للشيء وحافظ على ثبات يدك</Text>
        </View>
      )}

      {/* LOADING OVERLAY */}
      {isLoading && (
        <View style={s.loadingOverlay}>
          <View style={s.loadingCard}>
            <ActivityIndicator size="large" color={COLORS.primaryGreen} />
            <Text style={s.loadingText}>{loadingText}</Text>
          </View>
        </View>
      )}

      {/* FLOATING BRANCHING SCI-FI HUD */}
      {activeObject && !isLoading && opacity > 0.05 && (
        <View style={[StyleSheet.absoluteFill, { opacity: opacity, transform: [{ scale: opacity < 1 ? opacity + 0.1 : 1 }] }]}>
          
          {/* CENTER TARGET NODE */}
          <View style={[s.targetNode, { left: centerX - 10, top: centerY - 10 }]} />
          <View style={[s.targetNodePulse, { left: centerX - 15, top: centerY - 15 }]} />

          {/* ================= RIGHT BRANCH: INFO ================= */}
          {/* Path lines */}
          <View style={[s.techLineH, { left: centerX + 10, top: centerY - 1, width: 15 }]} />
          <View style={[s.techLineV, { left: centerX + 25, top: centerY - 81, height: 80 }]} />
          <View style={[s.techLineH, { left: centerX + 25, top: centerY - 81, width: 10 }]} />
          
          {/* Info Card */}
          <View style={[s.infoPanel, { left: centerX + 35, top: centerY - 140 }]}>
            <View style={s.panelHeader}>
              <Text style={s.panelTitle} numberOfLines={1}>{activeObject.name}</Text>
              <Text style={s.panelId}>ID: {activeObject.id.substring(0,6).toUpperCase()}</Text>
            </View>
            <View style={s.panelBody}>
              <ScrollView style={{ maxHeight: 150 }} showsVerticalScrollIndicator={true}>
                <Text style={s.panelDesc}>{activeObject.description}</Text>
              </ScrollView>
            </View>
            <View style={s.panelFooter}>
               <Text style={s.scanStatus}>SCAN COMPLETE // 100%</Text>
            </View>
          </View>


          {/* ================= LEFT BRANCH: ACTIONS ================= */}
          {/* Path lines */}
          <View style={[s.techLineHAction, { left: centerX - 25, top: centerY - 1, width: 15 }]} />
          <View style={[s.techLineVAction, { left: centerX - 25, top: centerY, height: 50 }]} />
          <View style={[s.techLineHAction, { left: centerX - 35, top: centerY + 50, width: 10 }]} />
          
          {/* Actions Card */}
          <View style={[s.actionPanel, { left: centerX - 175, top: centerY + 20 }]}>
            <View style={s.actionPanelHeader}>
              <Text style={s.actionPanelTitle}>ACTIONS</Text>
            </View>
            
            <View style={s.actionBtnRow}>
              {/* Shopping Toggle Button */}
              <TouchableOpacity 
                style={[s.actionBtn, showShopping && s.actionBtnActive]} 
                onPress={() => setShowShopping(!showShopping)}
              >
                <Text style={[s.actionBtnText, showShopping && s.actionBtnTextActive]}>شراء</Text>
              </TouchableOpacity>

              {/* Notes Button */}
              <TouchableOpacity 
                style={[s.actionBtn, showNoteInput && s.actionBtnActive]} 
                onPress={() => setShowNoteInput(!showNoteInput)}
              >
                <Text style={[s.actionBtnText, showNoteInput && s.actionBtnTextActive]}>ملاحظة</Text>
              </TouchableOpacity>
            </View>

            {/* Expanding Shopping Info */}
            {showShopping && (
              <View style={s.expandableDetails}>
                <View style={s.detailRow}>
                  <Text style={s.detailLabel}>السعر التقديري:</Text>
                  <Text style={s.detailValue} numberOfLines={1}>{activeObject.price}</Text>
                </View>
                <View style={s.detailRow}>
                  <Text style={s.detailLabel}>البلد:</Text>
                  <Text style={s.detailValue} numberOfLines={1}>{activeObject.origin}</Text>
                </View>
              </View>
            )}

            {/* Expanding Note Input */}
            {showNoteInput && (
              <View style={s.expandableDetails}>
                <TextInput
                  style={s.noteInput}
                  placeholder="اكتب ملاحظتك..."
                  placeholderTextColor="rgba(0,204,255,0.5)"
                  value={newNoteText}
                  onChangeText={setNewNoteText}
                  autoFocus
                />
                <TouchableOpacity style={s.saveNoteBtn} onPress={saveNote}>
                  <Text style={s.saveNoteText}>حفظ</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      )}

      {/* CANCEL SCAN BUTTON (Visible only when an object is locked) */}
      {activeObject && (
        <View style={s.cancelArea}>
          <TouchableOpacity style={s.cancelBtn} onPress={closeCard} activeOpacity={0.7}>
            <Text style={s.cancelBtnIcon}>✕</Text>
            <Text style={s.cancelBtnText}>مسح عنصر جديد</Text>
          </TouchableOpacity>
        </View>
      )}

      <NotesModal visible={notesVisible} notes={notes} onClose={() => setNotesVisible(false)} onDeleteNote={() => {}} />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  topBar: { position: 'absolute', top: 50, left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 50 },
  topBtn: { width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(0,255,170,0.1)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.primaryGreen },
  topBtnIcon: { fontSize: 22 },
  appTitle: { color: COLORS.primaryGreen, fontSize: 16, fontWeight: '900', letterSpacing: 4, textShadowColor: COLORS.primaryGreen, textShadowOffset: {width: 0, height: 0}, textShadowRadius: 10 },
  badge: { position: 'absolute', top: -4, right: -4, width: 18, height: 18, borderRadius: 9, backgroundColor: COLORS.primaryGreen, justifyContent: 'center', alignItems: 'center' },
  badgeText: { fontSize: 10, fontWeight: 'bold', color: '#000' },
  
  // Crosshair
  reticleContainer: { position: 'absolute', top: '50%', left: '50%', marginTop: -20, marginLeft: -20, width: 40, height: 40, justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  reticleInner: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.primaryGreen, shadowColor: COLORS.primaryGreen, shadowRadius: 10, shadowOpacity: 1 },
  reticleBorder1: { position: 'absolute', top: 0, left: 0, width: 10, height: 2, backgroundColor: COLORS.primaryGreen },
  reticleBorder2: { position: 'absolute', top: 0, left: 0, width: 2, height: 10, backgroundColor: COLORS.primaryGreen },
  reticleBorder3: { position: 'absolute', bottom: 0, right: 0, width: 10, height: 2, backgroundColor: COLORS.primaryGreen },
  reticleBorder4: { position: 'absolute', bottom: 0, right: 0, width: 2, height: 10, backgroundColor: COLORS.primaryGreen },
  
  analyzeArea: { position: 'absolute', bottom: 60, left: 0, right: 0, alignItems: 'center', zIndex: 40 },
  analyzeBtn: { backgroundColor: 'rgba(0,10,5,0.8)', paddingHorizontal: 40, paddingVertical: 18, borderRadius: 30, borderWidth: 2, borderColor: COLORS.primaryGreen, elevation: 8, shadowColor: COLORS.primaryGreen, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 15 },
  analyzeBtnText: { fontSize: 18, fontWeight: 'bold', color: COLORS.primaryGreen, letterSpacing: 1 },
  hintText: { color: 'rgba(0,255,170,0.6)', fontSize: 13, marginTop: 15, textAlign: 'center', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 15, paddingVertical: 5, borderRadius: 10 },
  
  cancelArea: { position: 'absolute', bottom: 60, left: 0, right: 0, alignItems: 'center', zIndex: 80 },
  cancelBtn: { flexDirection: 'row', backgroundColor: 'rgba(255,0,0,0.1)', paddingHorizontal: 30, paddingVertical: 15, borderRadius: 30, borderWidth: 1, borderColor: '#ff4444', alignItems: 'center', gap: 10 },
  cancelBtnIcon: { color: '#ff4444', fontSize: 16, fontWeight: 'bold' },
  cancelBtnText: { color: '#ff4444', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },

  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,5,10,0.9)', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  loadingCard: { backgroundColor: 'rgba(0,15,20,0.95)', padding: 40, borderRadius: 20, alignItems: 'center', gap: 20, borderWidth: 1, borderColor: COLORS.primaryGreen },
  loadingText: { color: COLORS.primaryGreen, fontSize: 18, fontWeight: 'bold', textAlign: 'center', letterSpacing: 2 },
  
  // ================= BRANCHING HUD STYLES =================
  targetNode: { position: 'absolute', width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: COLORS.primaryGreen, backgroundColor: 'rgba(0,255,170,0.2)', zIndex: 70 },
  targetNodePulse: { position: 'absolute', width: 30, height: 30, borderRadius: 15, borderWidth: 1, borderColor: COLORS.primaryGreen, borderStyle: 'dashed', zIndex: 69 },

  // Info Branch (Green)
  techLineH: { position: 'absolute', height: 2, backgroundColor: COLORS.primaryGreen, zIndex: 65, shadowColor: COLORS.primaryGreen, shadowRadius: 5, shadowOpacity: 1 },
  techLineV: { position: 'absolute', width: 2, backgroundColor: COLORS.primaryGreen, zIndex: 65, shadowColor: COLORS.primaryGreen, shadowRadius: 5, shadowOpacity: 1 },
  
  infoPanel: { position: 'absolute', width: 145, backgroundColor: 'rgba(0,20,10,0.85)', borderWidth: 1, borderColor: COLORS.primaryGreen, borderTopRightRadius: 15, borderBottomLeftRadius: 15, zIndex: 70, overflow: 'hidden' },
  panelHeader: { backgroundColor: 'rgba(0,255,170,0.2)', padding: 8, borderBottomWidth: 1, borderBottomColor: COLORS.primaryGreen },
  panelTitle: { color: '#fff', fontSize: 14, fontWeight: '900', letterSpacing: 1 },
  panelId: { color: COLORS.primaryGreen, fontSize: 9, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', marginTop: 2 },
  panelBody: { padding: 10 },
  panelDesc: { color: 'rgba(255,255,255,0.8)', fontSize: 11, lineHeight: 16 },
  panelFooter: { padding: 6, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'flex-end' },
  scanStatus: { color: COLORS.primaryGreen, fontSize: 8, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },

  // Actions Branch (Cyan)
  techLineHAction: { position: 'absolute', height: 2, backgroundColor: '#00ccff', zIndex: 65, shadowColor: '#00ccff', shadowRadius: 5, shadowOpacity: 1 },
  techLineVAction: { position: 'absolute', width: 2, backgroundColor: '#00ccff', zIndex: 65, shadowColor: '#00ccff', shadowRadius: 5, shadowOpacity: 1 },
  
  actionPanel: { position: 'absolute', width: 140, backgroundColor: 'rgba(0,15,30,0.85)', borderWidth: 1, borderColor: '#00ccff', borderTopLeftRadius: 15, borderBottomRightRadius: 15, zIndex: 70, overflow: 'hidden' },
  actionPanelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(0,204,255,0.2)', padding: 6, borderBottomWidth: 1, borderBottomColor: '#00ccff' },
  actionPanelTitle: { color: '#00ccff', fontSize: 10, fontWeight: 'bold', letterSpacing: 1, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  actionBtnRow: { flexDirection: 'row', padding: 8, gap: 5 },
  actionBtn: { flex: 1, backgroundColor: 'rgba(0,204,255,0.1)', paddingVertical: 8, borderRadius: 4, borderWidth: 1, borderColor: 'rgba(0,204,255,0.3)', alignItems: 'center' },
  actionBtnActive: { backgroundColor: 'rgba(0,204,255,0.3)', borderColor: '#00ccff' },
  actionBtnText: { color: '#00ccff', fontSize: 11, fontWeight: 'bold' },
  actionBtnTextActive: { color: '#fff' },
  
  expandableDetails: { backgroundColor: 'rgba(0,0,0,0.6)', padding: 8, borderTopWidth: 1, borderTopColor: 'rgba(0,204,255,0.3)' },
  detailRow: { marginBottom: 6 },
  detailLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 10, marginBottom: 2 },
  detailValue: { color: '#00ccff', fontSize: 11, fontWeight: 'bold' },
  
  noteInput: { backgroundColor: 'rgba(0,204,255,0.1)', color: '#fff', fontSize: 12, padding: 8, borderRadius: 4, borderWidth: 1, borderColor: 'rgba(0,204,255,0.3)', marginBottom: 8, textAlign: 'right' },
  saveNoteBtn: { backgroundColor: '#00ccff', paddingVertical: 6, borderRadius: 4, alignItems: 'center' },
  saveNoteText: { color: '#000', fontSize: 11, fontWeight: 'bold' }
});
