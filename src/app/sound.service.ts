import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface SoundOptions {
  volume?: number;
  loop?: boolean;
  playbackRate?: number;
}

export type SoundType = 
  | 'success'
  | 'error'
  | 'warning'
  | 'info'
  | 'click'
  | 'notification'
  | 'payment'
  | 'studentAdded'
  | 'studentRemoved'
  | 'lessonAdded'
  | 'lessonRemoved'
  | 'login'
  | 'logout'
  | 'print'
  | 'bulkPayment'
  | 'receipt'
  | 'enrollment'
  | 'tabSwitch'
  | 'refresh'
  | 'delete'
  | 'edit';

@Injectable({
  providedIn: 'root'
})
export class SoundService {
  // حالة تشغيل الصوت
  private soundEnabledSubject = new BehaviorSubject<boolean>(true);
  soundEnabled$: Observable<boolean> = this.soundEnabledSubject.asObservable();

  // حالة الصوت
  private audioContext: AudioContext | null = null;
  private sounds: Map<string, AudioBuffer> = new Map();
  private isInitialized = false;
  private activeSounds: Map<string, AudioBufferSourceNode> = new Map();

  // حجم الصوت الافتراضي
  private defaultVolume = 0.3;

  constructor() {
    this.initAudioContext();
    this.loadAllSounds();
  }

  /**
   * تهيئة سياق الصوت
   */
  private initAudioContext(): void {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // إعادة تفعيل السياق عند التفاعل مع المستخدم
      document.addEventListener('click', () => {
        if (this.audioContext?.state === 'suspended') {
          this.audioContext.resume();
        }
      }, { once: false });
    } catch (error) {
      console.warn('⚠️ Web Audio API غير مدعومة في هذا المتصفح');
    }
  }

  /**
   * تحميل جميع الأصوات
   */
  private loadAllSounds(): void {
    // تعريف جميع الأصوات مع المسارات
    const soundDefinitions: { [key in SoundType]?: { url: string; fallback?: string } } = {
      success: { url: '/assets/sounds/success.mp3', fallback: '/assets/sounds/success.wav' },
      error: { url: '/assets/sounds/error.mp3', fallback: '/assets/sounds/error.wav' },
      warning: { url: '/assets/sounds/warning.mp3', fallback: '/assets/sounds/warning.wav' },
      info: { url: '/assets/sounds/info.mp3', fallback: '/assets/sounds/info.wav' },
      click: { url: '/assets/sounds/click.mp3', fallback: '/assets/sounds/click.wav' },
      notification: { url: '/assets/sounds/notification.mp3', fallback: '/assets/sounds/notification.wav' },
      payment: { url: '/assets/sounds/payment.mp3', fallback: '/assets/sounds/payment.wav' },
      studentAdded: { url: '/assets/sounds/student-added.mp3', fallback: '/assets/sounds/student-added.wav' },
      studentRemoved: { url: '/assets/sounds/student-removed.mp3', fallback: '/assets/sounds/student-removed.wav' },
      lessonAdded: { url: '/assets/sounds/lesson-added.mp3', fallback: '/assets/sounds/lesson-added.wav' },
      lessonRemoved: { url: '/assets/sounds/lesson-removed.mp3', fallback: '/assets/sounds/lesson-removed.wav' },
      login: { url: '/assets/sounds/login.mp3', fallback: '/assets/sounds/login.wav' },
      logout: { url: '/assets/sounds/logout.mp3', fallback: '/assets/sounds/logout.wav' },
      print: { url: '/assets/sounds/print.mp3', fallback: '/assets/sounds/print.wav' },
      bulkPayment: { url: '/assets/sounds/bulk-payment.mp3', fallback: '/assets/sounds/bulk-payment.wav' },
      receipt: { url: '/assets/sounds/receipt.mp3', fallback: '/assets/sounds/receipt.wav' },
      enrollment: { url: '/assets/sounds/enrollment.mp3', fallback: '/assets/sounds/enrollment.wav' },
      tabSwitch: { url: '/assets/sounds/tab-switch.mp3', fallback: '/assets/sounds/tab-switch.wav' },
      refresh: { url: '/assets/sounds/refresh.mp3', fallback: '/assets/sounds/refresh.wav' },
      delete: { url: '/assets/sounds/delete.mp3', fallback: '/assets/sounds/delete.wav' },
      edit: { url: '/assets/sounds/edit.mp3', fallback: '/assets/sounds/edit.wav' }
    };

    // تحميل الأصوات
    Object.entries(soundDefinitions).forEach(([key, def]) => {
      const soundType = key as SoundType;
      this.loadSound(soundType, def.url, def.fallback);
    });
  }

  /**
   * تحميل صوت فردي
   */
  private loadSound(type: SoundType, url: string, fallback?: string): void {
    if (!this.audioContext) return;

    fetch(url)
      .then(response => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.arrayBuffer();
      })
      .then(arrayBuffer => this.audioContext!.decodeAudioData(arrayBuffer))
      .then(audioBuffer => {
        this.sounds.set(type, audioBuffer);
        console.log(`✅ Sound loaded: ${type}`);
      })
      .catch(() => {
        // محاولة تحميل الصوت الاحتياطي
        if (fallback) {
          fetch(fallback)
            .then(response => {
              if (!response.ok) throw new Error(`HTTP ${response.status}`);
              return response.arrayBuffer();
            })
            .then(arrayBuffer => this.audioContext!.decodeAudioData(arrayBuffer))
            .then(audioBuffer => {
              this.sounds.set(type, audioBuffer);
              console.log(`✅ Sound loaded (fallback): ${type}`);
            })
            .catch(() => {
              console.warn(`⚠️ Failed to load sound: ${type}`);
              // إنشاء صوت اصطناعي كحل أخير
              this.createSyntheticSound(type);
            });
        } else {
          console.warn(`⚠️ Failed to load sound: ${type}`);
          this.createSyntheticSound(type);
        }
      });
  }

  /**
   * إنشاء صوت اصطناعي باستخدام Web Audio API
   */
  private createSyntheticSound(type: SoundType): void {
    if (!this.audioContext) return;

    try {
      const duration = 0.3;
      const sampleRate = this.audioContext.sampleRate;
      const frameCount = duration * sampleRate;
      const buffer = this.audioContext.createBuffer(1, frameCount, sampleRate);
      const data = buffer.getChannelData(0);

      let frequency = 440;
      let type2: OscillatorType = 'sine';

      switch (type) {
        case 'success':
          frequency = 523.25; // C5
          break;
        case 'error':
          frequency = 220; // A3
          type2 = 'sawtooth';
          break;
        case 'warning':
          frequency = 392; // G4
          break;
        case 'notification':
          frequency = 880; // A5
          break;
        case 'payment':
          frequency = 659.25; // E5
          break;
        case 'studentAdded':
        case 'enrollment':
          frequency = 523.25;
          break;
        case 'studentRemoved':
        case 'lessonRemoved':
        case 'delete':
          frequency = 300;
          type2 = 'square';
          break;
        case 'login':
          frequency = 659.25;
          break;
        case 'logout':
          frequency = 392;
          break;
        case 'print':
          frequency = 440;
          break;
        case 'click':
        case 'tabSwitch':
          frequency = 1000;
          break;
        default:
          frequency = 440;
      }

      for (let i = 0; i < frameCount; i++) {
        const t = i / sampleRate;
        let value = 0;
        const decay = 1 - t / duration;

        if (type2 === 'sine') {
          value = Math.sin(2 * Math.PI * frequency * t) * decay;
        } else if (type2 === 'square') {
          value = (Math.sin(2 * Math.PI * frequency * t) > 0 ? 1 : -1) * decay;
        } else if (type2 === 'sawtooth') {
          value = (2 * (t * frequency % 1) - 1) * decay;
        }

        data[i] = value * 0.5;
      }

      this.sounds.set(type, buffer);
      console.log(`✅ Synthetic sound created: ${type}`);
    } catch (error) {
      console.warn(`⚠️ Failed to create synthetic sound: ${type}`);
    }
  }

  /**
   * تشغيل الصوت
   */
  play(type: SoundType, options: SoundOptions = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      // التحقق من تمكين الصوت
      if (!this.soundEnabledSubject.getValue()) {
        resolve();
        return;
      }

      // التحقق من وجود سياق الصوت
      if (!this.audioContext) {
        resolve();
        return;
      }

      // استعادة سياق الصوت إذا كان معلقاً
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }

      const buffer = this.sounds.get(type);
      if (!buffer) {
        console.warn(`⚠️ Sound not found: ${type}`);
        resolve();
        return;
      }

      try {
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;

        const gainNode = this.audioContext.createGain();
        gainNode.gain.value = options.volume ?? this.defaultVolume;

        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        // إعداد التكرار وسرعة التشغيل
        source.loop = options.loop || false;
        if (options.playbackRate) {
          source.playbackRate.value = options.playbackRate;
        }

        // حفظ الصوت النشط
        const soundId = `${type}_${Date.now()}`;
        this.activeSounds.set(soundId, source);

        source.onended = () => {
          this.activeSounds.delete(soundId);
          resolve();
        };

        source.start(0);
      } catch (error) {
        console.error(`❌ Error playing sound ${type}:`, error);
        reject(error);
      }
    });
  }

  /**
   * تشغيل صوت النجاح
   */
  playSuccess(volume?: number): Promise<void> {
    return this.play('success', { volume });
  }

  /**
   * تشغيل صوت الخطأ
   */
  playError(volume?: number): Promise<void> {
    return this.play('error', { volume });
  }

  /**
   * تشغيل صوت التحذير
   */
  playWarning(volume?: number): Promise<void> {
    return this.play('warning', { volume });
  }

  /**
   * تشغيل صوت الإشعار
   */
  playNotification(volume?: number): Promise<void> {
    return this.play('notification', { volume });
  }

  /**
   * تشغيل صوت الدفع
   */
  playPayment(volume?: number): Promise<void> {
    return this.play('payment', { volume });
  }

  /**
   * تشغيل صوت إضافة طالب
   */
  playStudentAdded(volume?: number): Promise<void> {
    return this.play('studentAdded', { volume });
  }

  /**
   * تشغيل صوت حذف طالب
   */
  playStudentRemoved(volume?: number): Promise<void> {
    return this.play('studentRemoved', { volume });
  }

  /**
   * تشغيل صوت إضافة حصة
   */
  playLessonAdded(volume?: number): Promise<void> {
    return this.play('lessonAdded', { volume });
  }

  /**
   * تشغيل صوت حذف حصة
   */
  playLessonRemoved(volume?: number): Promise<void> {
    return this.play('lessonRemoved', { volume });
  }

  /**
   * تشغيل صوت تسجيل الدخول
   */
  playLogin(volume?: number): Promise<void> {
    return this.play('login', { volume });
  }

  /**
   * تشغيل صوت تسجيل الخروج
   */
  playLogout(volume?: number): Promise<void> {
    return this.play('logout', { volume });
  }

  /**
   * تشغيل صوت الطباعة
   */
  playPrint(volume?: number): Promise<void> {
    return this.play('print', { volume });
  }

  /**
   * تشغيل صوت الدفع الجماعي
   */
  playBulkPayment(volume?: number): Promise<void> {
    return this.play('bulkPayment', { volume });
  }

  /**
   * تشغيل صوت الإيصال
   */
  playReceipt(volume?: number): Promise<void> {
    return this.play('receipt', { volume });
  }

  /**
   * تشغيل صوت التسجيل في حصة
   */
  playEnrollment(volume?: number): Promise<void> {
    return this.play('enrollment', { volume });
  }

  /**
   * تشغيل صوت تبديل التبويب
   */
  playTabSwitch(volume?: number): Promise<void> {
    return this.play('tabSwitch', { volume });
  }

  /**
   * تشغيل صوت التحديث
   */
  playRefresh(volume?: number): Promise<void> {
    return this.play('refresh', { volume });
  }

  /**
   * تشغيل صوت الحذف
   */
  playDelete(volume?: number): Promise<void> {
    return this.play('delete', { volume });
  }

  /**
   * تشغيل صوت التعديل
   */
  playEdit(volume?: number): Promise<void> {
    return this.play('edit', { volume });
  }

  /**
   * تشغيل صوت النقر
   */
  playClick(volume?: number): Promise<void> {
    return this.play('click', { volume });
  }

  /**
   * تشغيل صوت معلومات
   */
  playInfo(volume?: number): Promise<void> {
    return this.play('info', { volume });
  }

  /**
   * تشغيل صوت مخصص (مع إمكانية تحديد التردد والمدة)
   */
  playCustom(frequency: number, duration: number = 0.3, type: OscillatorType = 'sine', volume: number = 0.3): Promise<void> {
    return new Promise((resolve) => {
      if (!this.soundEnabledSubject.getValue() || !this.audioContext) {
        resolve();
        return;
      }

      try {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.type = type;
        oscillator.frequency.value = frequency;

        gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + duration);

        setTimeout(resolve, duration * 1000 + 100);
      } catch (error) {
        console.error('Error playing custom sound:', error);
        resolve();
      }
    });
  }

  /**
   * إيقاف جميع الأصوات النشطة
   */
  stopAll(): void {
    this.activeSounds.forEach((source, id) => {
      try {
        source.stop();
      } catch (e) {
        // تجاهل الأخطاء
      }
      this.activeSounds.delete(id);
    });
  }

  /**
   * إيقاف صوت معين
   */
  stopSound(type: SoundType): void {
    this.activeSounds.forEach((source, id) => {
      if (id.startsWith(type)) {
        try {
          source.stop();
        } catch (e) {
          // تجاهل الأخطاء
        }
        this.activeSounds.delete(id);
      }
    });
  }

  /**
   * تمكين/تعطيل الصوت
   */
  toggleSound(): void {
    this.soundEnabledSubject.next(!this.soundEnabledSubject.getValue());
  }

  /**
   * تعيين حالة الصوت
   */
  setSoundEnabled(enabled: boolean): void {
    this.soundEnabledSubject.next(enabled);
    if (!enabled) {
      this.stopAll();
    }
  }

  /**
   * الحصول على حالة الصوت
   */
  isSoundEnabled(): boolean {
    return this.soundEnabledSubject.getValue();
  }

  /**
   * ضبط مستوى الصوت الافتراضي
   */
  setDefaultVolume(volume: number): void {
    this.defaultVolume = Math.max(0, Math.min(1, volume));
  }

  /**
   * الحصول على مستوى الصوت الافتراضي
   */
  getDefaultVolume(): number {
    return this.defaultVolume;
  }

  /**
   * معاينة الصوت
   */
  previewSound(type: SoundType): Promise<void> {
    return this.play(type, { volume: this.defaultVolume });
  }

  /**
   * الحصول على قائمة الأصوات المتاحة
   */
  getAvailableSounds(): SoundType[] {
    return Array.from(this.sounds.keys()) as SoundType[];
  }

  /**
   * التحقق من تحميل الصوت
   */
  isSoundLoaded(type: SoundType): boolean {
    return this.sounds.has(type);
  }
}