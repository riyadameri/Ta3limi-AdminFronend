import { Injectable, NgZone } from '@angular/core';
import Swal from 'sweetalert2';

declare const navigator: any;

export interface ReceiptData {
  receiptNumber: string;
  date: string;
  time: string;
  studentName: string;
  studentId: string;
  className: string;
  month: string;
  amount: number;
  paymentMethod: string;
  academicYear?: string;
  parentPhone?: string;
  notes?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PrinterService {
  private port: any = null;
  private writer: any = null;
  private reader: any = null;
  private isConnected: boolean = false;
  
  // إعدادات الطابعة للورق 80 مم
  private readonly PRINT_WIDTH = 576; // 80 مم × 8 نقطة/مم = 640 نقطة، لكننا نستخدم 576 للهامش
  private readonly PRINT_HEIGHT = 900; // ارتفاع ديناميكي
  private readonly CANVAS_WIDTH = 576;
  private readonly CANVAS_HEIGHT = 900;
  private readonly MAX_CHUNK_SIZE = 1024;
  private readonly COMPANY_NAME = 'أكاديمية الرواد للتعليم والمعارف';
  private readonly DEVELOPER_NAME = 'ريدوكس';
  private readonly FOOTER_TEXT = 'تتمنى لكم تجربة تعليمية ممتعة ومفيدة';
  private readonly COMPANY_ADDRESS = 'الجزائر، ولاية الجزائر';
  private readonly QR_CODE_TEXT = 'أكاديمية الرواد للتعليم والمعارف\nالموقع: academy-arrowad.edu.dz\nهاتف: 1234567890';

  // روابط الصور
  private readonly REDOX_LOGO_URL = 'https://redox-sm.onrender.com/favicon.ico';
  private readonly ACADEMY_LOGO_URL = 'https://redox-sm.onrender.com/favicon.ico';

  constructor(private ngZone: NgZone) {
    window.addEventListener('beforeunload', () => {
      this.disconnect();
    });
  }

  /**
   * الاتصال بالطابعة الحرارية
   */
  async connectToThermalPrinter(baudRate: number = 115200): Promise<boolean> {
    try {
      if (!('serial' in navigator)) {
        throw new Error('واجهة الطابعة غير مدعومة في هذا المتصفح. الرجاء استخدام Chrome أو Edge.');
      }

      this.port = await navigator.serial.requestPort();
      
      await this.port.open({
        baudRate: baudRate,
        dataBits: 8,
        stopBits: 1,
        parity: 'none',
        flowControl: 'none'
      });

      this.writer = this.port.writable.getWriter();
      
      // تهيئة الطابعة
      await this.writer.write(new Uint8Array([0x1B, 0x40])); // Initialize
      await this.writer.write(new Uint8Array([0x1B, 0x33, 0x18])); // Set line spacing

      this.isConnected = true;

      this.ngZone.run(() => {
        Swal.fire({
          icon: 'success',
          title: '✅ تم الاتصال',
          text: 'تم الاتصال بالطابعة الحرارية بنجاح',
          timer: 1500,
          showConfirmButton: false
        });
      });

      console.log('✅ تم الاتصال بالطابعة بنجاح');
      return true;

    } catch (err: any) {
      console.error("❌ خطأ الاتصال:", err);
      this.showConnectionError(err);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * إنشاء QR Code باستخدام Canvas
   */
  private generateQRCode(text: string): HTMLCanvasElement {
    const qrCanvas = document.createElement('canvas');
    qrCanvas.width = 120;
    qrCanvas.height = 120;
    
    const ctx = qrCanvas.getContext('2d')!;
    
    // خلفية بيضاء
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, qrCanvas.width, qrCanvas.height);
    
    // إنشاء QR Code بسيط
    ctx.fillStyle = '#000000';
    
    // إطار خارجي
    ctx.lineWidth = 3;
    ctx.strokeRect(10, 10, qrCanvas.width - 20, qrCanvas.height - 20);
    
    // نمط داخلي بسيط
    const size = 8;
    const offset = 20;
    
    // نقاط QR Code نموذجية
    for (let i = 0; i < 7; i++) {
      for (let j = 0; j < 7; j++) {
        if ((i === 0 || i === 6 || j === 0 || j === 6) || 
            (i >= 2 && i <= 4 && j >= 2 && j <= 4)) {
          ctx.fillRect(offset + i * size, offset + j * size, size - 1, size - 1);
        }
      }
    }
    
    // إضافة نص
    ctx.fillStyle = '#333333';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('QR Code', qrCanvas.width / 2, qrCanvas.height - 8);
    
    return qrCanvas;
  }

  /**
   * تحميل الصورة من رابط
   */
  private async loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  }

  /**
   * إنشاء وإعداد Canvas للفاتورة بتصميم احترافي
   */
/**
 * إنشاء وإعداد Canvas للفاتورة بتصميم احترافي
 */
private async createReceiptCanvas(data: ReceiptData): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  canvas.width = this.CANVAS_WIDTH;
  canvas.height = this.CANVAS_HEIGHT;
  
  const ctx = canvas.getContext('2d')!;
  
  // خلفية بيضاء
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // === تنسيق النص ===
  ctx.fillStyle = '#000000';
  ctx.textBaseline = 'top';
  
  // === رأس الإيصال ===
  ctx.textAlign = 'center';
  ctx.font = 'bold 30px "Arial", sans-serif';
  ctx.fillText('أكاديمية الرواد للتعليم والمعارف', canvas.width / 2, 10);
  
  // معلومات المؤسسة
  ctx.font = '16px "Arial", sans-serif';
  ctx.fillText('الجزائر ، ولاية تقرت', canvas.width / 2, 45);
  ctx.fillText('الهاتف : 0673586274', canvas.width / 2, 65);
  
  // خط فاصل
  this.drawDoubleLine(ctx, 10, 85, canvas.width - 20);
  
  // === معلومات الإيصال ===
  let yPos = 105;
  
  ctx.textAlign = 'center';
  ctx.font = 'bold 22px "Arial", sans-serif';
  ctx.fillText('إيصـــــــال دفـــــــع', canvas.width / 2, yPos);
  
  yPos += 30;
  this.drawSingleLine(ctx, 10, yPos, canvas.width - 20);
  yPos += 10;
  
  // معلومات أساسية
  ctx.textAlign = 'right';
  ctx.font = '18px "Arial", sans-serif';
  
  const infoItems = [
    { label: 'رقم الإيصال:', value: data.receiptNumber },
    { label: 'التاريخ:', value: this.formatArabicNumber(data.date) },
    { label: 'الوقت:', value: this.formatArabicNumber(data.time) },
    { label: 'طريقة الدفع:', value: this.translatePaymentMethod(data.paymentMethod) }
  ];
  
  infoItems.forEach(item => {
    ctx.fillText(`${item.label} ${item.value}`, canvas.width - 15, yPos);
    yPos += 25;
  });
  
  yPos += 10;
  this.drawSingleLine(ctx, 10, yPos, canvas.width - 20);
  yPos += 15;
  
  // === معلومات الطالب ===
  ctx.font = 'bold 20px "Arial", sans-serif';
  ctx.fillText('معلومات الطالب', canvas.width - 15, yPos);
  yPos += 30;
  
  ctx.font = '18px "Arial", sans-serif';
  
  const studentInfo = [
    { label: 'الاســـم:', value: data.studentName },
    { label: 'رقم التسجيل:', value: data.studentId },
    { label: 'الصف:', value: data.className },
    { label: 'المستوى:', value: data.academicYear || 'غير محدد' },
    { label: 'هاتف ولي الأمر:', value: data.parentPhone || 'غير محدد' }
  ];
  
  studentInfo.forEach(item => {
    if (item.value) {
      ctx.fillText(`${item.label} ${item.value}`, canvas.width - 15, yPos);
      yPos += 25;
    }
  });
  
  yPos += 10;
  this.drawDoubleLine(ctx, 10, yPos, canvas.width - 20);
  yPos += 20;
  
  // === تفاصيل الدفع ===
  ctx.textAlign = 'center';
  ctx.font = 'bold 22px "Arial", sans-serif';
  ctx.fillText('تفاصيل الدفع', canvas.width / 2, yPos);
  yPos += 35;
  
  // رأس الجدول
  ctx.fillStyle = '#2C3E50';
  ctx.fillRect(15, yPos, canvas.width - 30, 35);
  
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'right';
  ctx.fillText('البند', canvas.width - 25, yPos + 10);
  
  ctx.textAlign = 'center';
  ctx.fillText('المبلغ (دج)', canvas.width / 2, yPos + 10);
  
  ctx.textAlign = 'left';
  ctx.fillText('الكمية', 30, yPos + 10);
  
  yPos += 35;
  
  // صف البيانات
  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1;
  ctx.strokeRect(15, yPos, canvas.width - 30, 35);
  
  ctx.fillStyle = '#000000';
  ctx.textAlign = 'right';
  ctx.font = '18px "Arial", sans-serif';
  ctx.fillText(data.className, canvas.width - 25, yPos + 10);
  
  ctx.textAlign = 'center';
  ctx.fillText(this.formatArabicNumber(data.amount.toString()), canvas.width / 2, yPos + 10);
  
  ctx.textAlign = 'left';
  ctx.fillText('1', 30, yPos + 10);
  
  yPos += 35;
  
  // الفترة
  ctx.strokeRect(15, yPos, canvas.width - 30, 35);
  ctx.textAlign = 'right';
  ctx.fillText(`لفترة: ${data.month}`, canvas.width - 25, yPos + 10);
  
  yPos += 50;
  
  // === الإجمالي - منفصل عن الجدول ===
  this.drawSingleLine(ctx, 10, yPos, canvas.width - 20);
  yPos += 20;
  
  ctx.textAlign = 'center';
  ctx.font = 'bold 24px "Arial", sans-serif';
  ctx.fillStyle = '#000000';
  ctx.fillText('الإجمالي المستحق:', canvas.width / 2, yPos);
  
  yPos += 50;
  this.drawSingleLine(ctx, 10, yPos, canvas.width - 20, '#FF0000');
  yPos += 30;
  
  ctx.font = 'bold 28px "Arial", sans-serif';
  ctx.fillStyle = '#E74C3C';
  ctx.fillText(`${(data.amount.toLocaleString('en-US'))} دينار جزائري`, canvas.width / 2, yPos);
  
  yPos += 40;
  
  // خط فاصل زخرفي
  this.drawDecorationLine(ctx, 10, yPos, canvas.width - 20);
  yPos += 30;
  
  // === الملاحظات ===
  if (data.notes && data.notes.trim()) {
    ctx.textAlign = 'right';
    ctx.font = 'bold 18px "Arial", sans-serif';
    ctx.fillStyle = '#2C3E50';
    ctx.fillText('ملاحظات:', canvas.width - 15, yPos);
    yPos += 25;
    
    ctx.font = '16px "Arial", sans-serif';
    ctx.fillStyle = '#000000';
    
    // تقسيم النص إذا كان طويلاً - تعريف نوع المصفوفة بشكل صريح
    const maxWidth = canvas.width - 30;
    const words = data.notes.split(' ');
    let line = '';
    const lines: string[] = []; // تعريف صريح للنوع
    
    for (const word of words) {
      const testLine = line + word + ' ';
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && line !== '') {
        lines.push(line);
        line = word + ' ';
      } else {
        line = testLine;
      }
    }
    
    if (line) {
      lines.push(line);
    }
    
    // رسم الأسطر
    lines.forEach((lineText: string, index: number) => {
      if (yPos < canvas.height - 150) { // تأكد من عدم تجاوز المساحة
        ctx.fillText(lineText.trim(), canvas.width - 15, yPos);
        yPos += 22;
      }
    });
    
    yPos += 10;
  }
  
  // === QR Code ===
  const qrCanvas = this.generateQRCode(this.QR_CODE_TEXT);
  const qrSize = 80;
  const qrX = canvas.width - qrSize - 20;
  const qrY = canvas.height - qrSize - 120;
  
  ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);
  
  ctx.textAlign = 'center';
  ctx.font = '12px "Arial", sans-serif';
  ctx.fillStyle = '#666666';
  ctx.fillText('المسح للتحقق', qrX + qrSize/2, qrY + qrSize + 15);
  
  // === التذييل ===
  ctx.textAlign = 'center';
  ctx.font = '16px "Arial", sans-serif';
  ctx.fillStyle = '#2C3E50';
  
  const footerItems = [
    'نظام إدارة التعليم',
    'مطور بواسطة: ريدوكس',
    this.FOOTER_TEXT,
    'هذا إيصال رسمي - يرجى الاحتفاظ به للمراجعة'
  ];
  
  let footerY = canvas.height - 90;
  footerItems.forEach(item => {
    ctx.fillText(item, canvas.width / 2, footerY);
    footerY += 40;
  });
  
  // === رسالة الشكر ===
  ctx.font = 'bold 18px "Arial", sans-serif';
  ctx.fillStyle = '#27AE60';
  ctx.fillText('شكراً لثقتكم الغالية', canvas.width / 2, canvas.height - 20);
  
  return canvas;
}

  /**
   * تحويل الأرقام إلى عربية صحيحة
   */
  private formatArabicNumber(num: string): string {
    const westernNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    const arabicNumerals = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

    return num.split('').map(char => {
      const index = westernNumerals.indexOf(char);
      return index !== -1 ? arabicNumerals[index] : char;
    }).join('');
  }

  /**
   * تحسين تحويل Canvas إلى صورة نقطية للطابعة الحرارية
   */
  private canvasToRaster(canvas: HTMLCanvasElement): Uint8Array {
    const ctx = canvas.getContext('2d')!;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // حساب عرض الصورة بالبايت
    const widthBytes = Math.ceil(canvas.width / 8);
    const rasterData = new Uint8Array(widthBytes * canvas.height);
    
    // تعبئة كل البايتات بالصفر
    rasterData.fill(0);
    
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const i = (y * canvas.width + x) * 4;
        
        // تحويل RGB إلى grayscale
        const red = data[i];
        const green = data[i + 1];
        const blue = data[i + 2];
        const gray = Math.floor((red * 0.3 + green * 0.59 + blue * 0.11));
        
        // إذا كان اللون داكن (العتبة يمكن ضبطها)
        if (gray < 200) {
          const byteIndex = Math.floor(y * widthBytes + x / 8);
          const bitIndex = 7 - (x % 8);
          rasterData[byteIndex] |= (1 << bitIndex);
        }
      }
    }
    
    return rasterData;
  }

  /**
   * تحسين الطباعة للطابعات الحرارية
   */
  private async printRasterImage(rasterData: Uint8Array, canvas: HTMLCanvasElement): Promise<boolean> {
    try {
      if (!this.writer) {
        throw new Error('الطابعة غير متصلة');
      }

      const widthBytes = Math.ceil(canvas.width / 8);
      const height = canvas.height;

      // رأس أمر الطباعة النقطية لطابعات ESC/POS
      const header = new Uint8Array([
        0x1D, 0x76, 0x30, 0x00, // أمر طباعة الصورة النقطية
        widthBytes & 0xFF,
        (widthBytes >> 8) & 0xFF,
        height & 0xFF,
        (height >> 8) & 0xFF
      ]);

      // تهيئة الطابعة
      await this.writer.write(new Uint8Array([
        0x1B, 0x40, // تهيئة الطابعة
        0x1B, 0x33, 0x24, // ضبط تباعد الأسطر
      ]));

      // تحديد عرض الطباعة (576 نقطة لـ 80 مم)
      await this.writer.write(new Uint8Array([0x1D, 0x57, (this.CANVAS_WIDTH / 8) & 0xFF, 0x00]));

      // إرسال رأس الصورة
      await this.writer.write(header);

      // إرسال بيانات الصورة على شكل قطع
      const CHUNK_SIZE = 1024;
      for (let i = 0; i < rasterData.length; i += CHUNK_SIZE) {
        const chunk = rasterData.slice(i, i + CHUNK_SIZE);
        await this.writer.write(chunk);
        // تأخير بسيط لضمان استقرار البيانات
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      // قص الورقة (إذا كانت الطابعة تدعم)
      await this.writer.write(new Uint8Array([0x1D, 0x56, 0x41, 0x03]));

      // تقدم الورقة لقطعها
      await this.writer.write(new Uint8Array([0x1B, 0x64, 0x05]));

      return true;

    } catch (error) {
      console.error('❌ خطأ في طباعة الصورة النقطية:', error);
      throw error;
    }
  }

  /**
   * طباعة إيصال احترافي مع الصورة النقطية
   */
  async printProfessionalReceipt(data: ReceiptData): Promise<boolean> {
    if (!this.isConnected) {
      const connected = await this.connectToThermalPrinter();
      if (!connected) {
        this.showError('فشل الاتصال بالطابعة');
        return false;
      }
    }

    try {
      this.showLoading('جاري إنشاء الإيصال...');

      // إنشاء Canvas للفاتورة
      const canvas = await this.createReceiptCanvas(data);
      
      // تحويل Canvas إلى صورة نقطية
      const rasterData = this.canvasToRaster(canvas);
      
      this.showLoading('جاري الطباعة...');
      
      // طباعة الصورة النقطية
      const success = await this.printRasterImage(rasterData, canvas);
      
      if (success) {
        this.showSuccessToast('تم طباعة الإيصال بنجاح');
        return true;
      } else {
        throw new Error('فشل الطباعة');
      }

    } catch (err: any) {
      this.handleError(err);
      return false;
    }
  }

  // ===== الدوال المساعدة للرسم =====

  /**
   * رسم خط مفرد
   */
  private drawSingleLine(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, color: string = '#000000'): void {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + width, y);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  /**
   * رسم خط مزدوج
   */
  private drawDoubleLine(ctx: CanvasRenderingContext2D, x: number, y: number, width: number): void {
    ctx.beginPath();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    
    // الخط العلوي
    ctx.moveTo(x, y);
    ctx.lineTo(x + width, y);
    
    // الخط السفلي
    ctx.moveTo(x, y + 3);
    ctx.lineTo(x + width, y + 3);
    
    ctx.stroke();
  }

  /**
   * رسم خط زخرفي
   */
  private drawDecorationLine(ctx: CanvasRenderingContext2D, x: number, y: number, width: number): void {
    const segmentWidth = 10;
    const gapWidth = 5;
    let currentX = x;
    
    ctx.beginPath();
    ctx.strokeStyle = '#2C3E50';
    ctx.lineWidth = 2;
    
    while (currentX < x + width) {
      ctx.moveTo(currentX, y);
      ctx.lineTo(currentX + segmentWidth, y);
      currentX += segmentWidth + gapWidth;
    }
    
    ctx.stroke();
  }

  /**
   * ترجمة طريقة الدفع
   */
  private translatePaymentMethod(method: string): string {
    const methods: { [key: string]: string } = {
      'cash': 'نقداً',
      'bank': 'تحويل بنكي',
      'card': 'بطاقة ائتمان',
      'check': 'شيك',
      'online': 'دفع إلكتروني',
      'mobile': 'دفع محمول'
    };
    return methods[method.toLowerCase()] || method;
  }

  // ===== دوال العرض والإخطار =====

  private showConnectionError(err: any): void {
    let errorMessage = '❌ خطأ في الاتصال بالطابعة: ';
    if (err.message.includes('permission') || err.name === 'SecurityError') {
      errorMessage += 'يجب منح الصلاحية للوصول إلى الطابعة';
    } else if (err.message.includes('supported')) {
      errorMessage += 'هذه الميزة غير مدعومة في متصفحك. الرجاء استخدام Chrome أو Edge';
    } else if (err.message.includes('No device selected')) {
      errorMessage += 'لم يتم اختيار طابعة';
    } else if (err.message.includes('baudRate')) {
      errorMessage += 'معدل الباود غير صحيح. تأكد من ضبط الطابعة على 115200 باود';
    } else {
      errorMessage += err.message;
    }

    this.ngZone.run(() => {
      Swal.fire({
        icon: 'error',
        title: 'خطأ',
        text: errorMessage,
        confirmButtonText: 'حسناً',
        footer: '<small>تأكد من أن الطابعة متصلة وتعمل بشكل صحيح</small>'
      });
    });
  }

  private showSuccessToast(message: string): void {
    this.ngZone.run(() => {
      Swal.fire({
        icon: 'success',
        title: '✅ نجاح',
        text: message,
        timer: 2000,
        showConfirmButton: false,
        position: 'top-end',
        toast: true
      });
    });
  }

  private showLoading(message: string): void {
    this.ngZone.run(() => {
      Swal.fire({
        title: message,
        allowOutsideClick: false,
        showConfirmButton: false,
        willOpen: () => {
          Swal.showLoading();
        }
      });
    });
  }

  private handleError(err: any): void {
    console.error('❌ خطأ في الطابعة:', err);
    
    this.ngZone.run(() => {
      Swal.fire({
        icon: 'error',
        title: '❌ خطأ',
        text: 'حدث خطأ أثناء الطباعة: ' + err.message,
        confirmButtonText: 'حسناً'
      });
    });
    
    this.isConnected = false;
  }

   private showError(message: string): void {
    this.ngZone.run(() => {
      Swal.fire({
        icon: 'error',
        title: 'خطأ',
        text: message,
        confirmButtonText: 'حسناً'
      });
    });
  }

  // ===== الدوال العامة =====

  /**
   * قطع الاتصال بالطابعة
   */
  async disconnect(): Promise<void> {
    try {
      if (this.writer) {
        await this.writer.releaseLock();
        this.writer = null;
      }
      
      if (this.reader) {
        await this.reader.releaseLock();
        this.reader = null;
      }
      
      if (this.port) {
        await this.port.close();
        this.port = null;
      }
      
      this.isConnected = false;
      console.log('تم قطع الاتصال بالطابعة');
      
    } catch (err) {
      console.error('خطأ في قطع الاتصال:', err);
    }
  }

  /**
   * التحقق من حالة الاتصال
   */
  checkConnectionStatus(): boolean {
    return this.isConnected;
  }

  /**
   * الحصول على حالة الطابعة
   */
  getPrinterStatus(): any {
    return {
      isConnected: this.isConnected,
      port: this.port ? 'متصل' : 'غير متصل',
      timestamp: new Date().toLocaleString('en-US'),
      width: this.PRINT_WIDTH,
      height: this.PRINT_HEIGHT,
      academy: this.COMPANY_NAME,
      developer: this.DEVELOPER_NAME
    };
  }

  /**
   * إنشاء إيصال دفع شهري
   */
  async printMonthlyPaymentReceipt(paymentData: any): Promise<boolean> {
    const receiptData: ReceiptData = {
      receiptNumber: `PAY-${Date.now().toString().slice(-8)}`,
      date: new Date().toLocaleDateString('en-US'),
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      studentName: paymentData.studentName || 'طالب',
      studentId: paymentData.studentId || 'بدون رقم',
      className: paymentData.className || 'مادة دراسية',
      month: paymentData.month || 'شهر',
      amount: paymentData.amount || 0,
      paymentMethod: paymentData.paymentMethod || 'cash',
      academicYear: paymentData.academicYear || '',
      parentPhone: paymentData.parentPhone || '',
      notes: 'تم سداد القسط الشهري بنجاح. نتمنى للطالب التوفيق والنجاح.'
    };

    return await this.printProfessionalReceipt(receiptData);
  }

  /**
   * طباعة تقرير شهري للطالب
   */
  async printStudentMonthlyReport(studentData: any, attendanceData: any, paymentData: any): Promise<boolean> {
    try {
      const currentDate = new Date();
      const receiptData: ReceiptData = {
        receiptNumber: `RPT-${currentDate.getTime().toString().slice(-8)}`,
        date: currentDate.toLocaleDateString('en-US'),
        time: currentDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        studentName: studentData.name || 'طالب',
        studentId: studentData.studentId || 'بدون رقم',
        className: 'تقرير شهري شامل',
        month: currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        amount: paymentData.totalPaid || 0,
        paymentMethod: 'تقرير',
        academicYear: studentData.academicYear || '',
        parentPhone: studentData.parentPhone || '',
        notes: `نسبة الحضور: ${attendanceData.attendanceRate || 0}%\nحضور: ${attendanceData.present || 0} | غياب: ${attendanceData.absent || 0} | تأخر: ${attendanceData.late || 0}\nالمبلغ المدفوع: ${paymentData.totalPaid || 0} د.ج | المتبقي: ${paymentData.pending || 0} د.ج`
      };

      return await this.printProfessionalReceipt(receiptData);
    } catch (error) {
      console.error('خطأ في طباعة التقرير:', error);
      return false;
    }
  }

  /**
   * طباعة صفحة اختبار متطورة
   */
  async printAdvancedTestPage(): Promise<boolean> {
    if (!this.isConnected) {
      const connected = await this.connectToThermalPrinter();
      if (!connected) return false;
    }

    try {
      const canvas = document.createElement('canvas');
      canvas.width = this.CANVAS_WIDTH;
      canvas.height = 600;
      
      const ctx = canvas.getContext('2d')!;
      
      // خلفية
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#000000';
      
      // عنوان الصفحة
      ctx.textAlign = 'center';
      ctx.font = 'bold 32px "Arial", sans-serif';
      ctx.fillText('✨ صفحة اختبار الطابعة ✨', canvas.width / 2, 30);
      
      // معلومات الاختبار
      ctx.font = '18px "Arial", sans-serif';
      ctx.fillText(`العرض: ${this.CANVAS_WIDTH}px | الارتفاع: 600px`, canvas.width / 2, 70);
      ctx.fillText('مقاس الورق: 80 مم | تصميم عربي', canvas.width / 2, 95);
      
      this.drawDoubleLine(ctx, 10, 110, canvas.width - 20);
      
      // اختبار الأرقام العربية
      ctx.textAlign = 'right';
      ctx.font = 'bold 24px "Arial", sans-serif';
      ctx.fillText('اختبار الأرقام العربية:', canvas.width - 15, 130);
      
      ctx.font = '20px "Arial", sans-serif';
      ctx.fillText(`الأرقام العادية: 1234567890`, canvas.width - 15, 160);
      ctx.fillText(`الأرقام العربية: ${this.formatArabicNumber('1234567890')}`, canvas.width - 15, 190);
      
      this.drawSingleLine(ctx, 10, 210, canvas.width - 20);
      
      // اختبار الجدول
      ctx.textAlign = 'center';
      ctx.font = 'bold 24px "Arial", sans-serif';
      ctx.fillText('اختبار الجدول', canvas.width / 2, 230);
      
      // جدول بسيط
      const tableY = 260;
      ctx.fillStyle = '#2C3E50';
      ctx.fillRect(15, tableY, canvas.width - 30, 35);
      
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'right';
      ctx.fillText('البند', canvas.width - 25, tableY + 10);
      
      ctx.textAlign = 'center';
      ctx.fillText('المبلغ', canvas.width / 2, tableY + 10);
      
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#000000';
      ctx.strokeRect(15, tableY + 35, canvas.width - 30, 35);
      
      ctx.fillStyle = '#000000';
      ctx.textAlign = 'right';
      ctx.fillText('حصة رياضيات', canvas.width - 25, tableY + 45);
      
      ctx.textAlign = 'center';
      ctx.fillText(this.formatArabicNumber('50000'), canvas.width / 2, tableY + 45);
      
      this.drawSingleLine(ctx, 10, tableY + 85, canvas.width - 20);
      
      // الإجمالي منفصل
      const totalY = tableY + 105;
      ctx.textAlign = 'center';
      ctx.font = 'bold 22px "Arial", sans-serif';
      ctx.fillText('الإجمالي:', canvas.width / 2, totalY);
      
      ctx.font = 'bold 26px "Arial", sans-serif';
      ctx.fillStyle = '#E74C3C';
      ctx.fillText(`${this.formatArabicNumber('50000')} د.ج`, canvas.width / 2, totalY + 30);
      
      // رسالة النجاح
      ctx.font = 'bold 28px "Arial", sans-serif';
      ctx.fillStyle = '#27AE60';
      ctx.fillText('✅ اختبار ناجح ✅', canvas.width / 2, 450);
      
      ctx.font = '20px "Arial", sans-serif';
      ctx.fillStyle = '#000000';
      ctx.fillText('التصميم الجديد بدون تداخل', canvas.width / 2, 490);
      ctx.fillText('الأرقام العربية صحيحة', canvas.width / 2, 515);
      
      // التذييل
      ctx.font = '16px "Arial", sans-serif';
      ctx.fillStyle = '#666666';
      ctx.fillText(this.COMPANY_NAME, canvas.width / 2, 550);
      ctx.fillText(`نظام ${this.DEVELOPER_NAME}`, canvas.width / 2, 570);
      
      // تحويل وطباعة
      const rasterData = this.canvasToRaster(canvas);
      const success = await this.printRasterImage(rasterData, canvas);
      
      if (success) {
        this.showSuccessToast('تم طباعة صفحة الاختبار بنجاح');
        return true;
      }
      
      return false;
      
    } catch (err: any) {
      this.handleError(err);
      return false;
    }
  }

  /**
   * اختبار سريع للطابعة
   */
  async quickTest(): Promise<boolean> {
    try {
      const testData: ReceiptData = {
        receiptNumber: 'TEST-001',
        date: new Date().toLocaleDateString('en-US'),
        time: new Date().toLocaleTimeString('en-US'),
        studentName: 'محمد أحمد علي',
        studentId: 'STD-2024-001',
        className: 'رياضيات - المستوى الأول',
        month: 'يناير 2024',
        amount: 50000,
        paymentMethod: 'cash',
        academicYear: '1AS',
        parentPhone: '0551234567',
        notes: 'هذا إيصال اختباري للتحقق من عمل الطابعة والأرقام العربية بشكل صحيح'
      };

      return await this.printProfessionalReceipt(testData);
    } catch (error) {
      console.error('فشل الاختبار السريع:', error);
      return false;
    }
  }

  /**
   * طباعة رسالة ترحيبية
   */
  async printWelcomeMessage(): Promise<boolean> {
    if (!this.isConnected) {
      const connected = await this.connectToThermalPrinter();
      if (!connected) return false;
    }

    try {
      const canvas = document.createElement('canvas');
      canvas.width = this.CANVAS_WIDTH;
      canvas.height = 400;
      
      const ctx = canvas.getContext('2d')!;
      
      // خلفية
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#000000';
      
      // رسالة الترحيب
      ctx.textAlign = 'center';
      ctx.font = 'bold 30px "Arial", sans-serif';
      ctx.fillText('مرحباً بكم في', canvas.width / 2, 30);
      
      ctx.font = 'bold 26px "Arial", sans-serif';
      ctx.fillText('نظام إدارة التعليم', canvas.width / 2, 70);
      
      this.drawDoubleLine(ctx, 10, 100, canvas.width - 20);
      
      // ميزات النظام
      ctx.textAlign = 'right';
      ctx.font = '20px "Arial", sans-serif';
      let yPos = 130;
      
      const features = [
        '✓ إدارة الطلاب والشعب',
        '✓ نظام الحضور والغياب',
        '✓ إدارة المدفوعات المالية',
        '✓ تقارير تفصيلية',
        '✓ طباعة إيصالات احترافية'
      ];
      
      features.forEach(feature => {
        ctx.fillText(feature, canvas.width - 15, yPos);
        yPos += 30;
      });
      
      this.drawSingleLine(ctx, 10, yPos, canvas.width - 20);
      yPos += 20;
      
      // رسالة الختام
      ctx.textAlign = 'center';
      ctx.font = 'bold 24px "Arial", sans-serif';
      ctx.fillText('تتمنى لكم', canvas.width / 2, yPos);
      
      ctx.font = '20px "Arial", sans-serif';
      ctx.fillText('تجربة تعليمية ممتعة ومفيدة', canvas.width / 2, yPos + 30);
      
      ctx.font = '18px "Arial", sans-serif';
      ctx.fillStyle = '#2C3E50';
      ctx.fillText('نحو مستقبل زاهر بالعلم والمعرفة', canvas.width / 2, yPos + 60);
      
      // الشعار
      ctx.font = '16px "Arial", sans-serif';
      ctx.fillStyle = '#666666';
      ctx.fillText(this.COMPANY_NAME, canvas.width / 2, yPos + 90);
      ctx.fillText(`مطور بواسطة: ${this.DEVELOPER_NAME}`, canvas.width / 2, yPos + 110);
      
      // تحويل وطباعة
      const rasterData = this.canvasToRaster(canvas);
      const success = await this.printRasterImage(rasterData, canvas);
      
      if (success) {
        this.showSuccessToast('تم طباعة رسالة الترحيب بنجاح');
        return true;
      }
      
      return false;
      
    } catch (err) {
      console.error('خطأ في طباعة رسالة الترحيب:', err);
      return false;
    }
  }

  /**
   * عرض معاينة الإيصال قبل الطباعة
   */
  async previewReceipt(data: ReceiptData): Promise<void> {
    try {
      const canvas = await this.createReceiptCanvas(data);
      
      // تحويل Canvas إلى صورة
      const imageUrl = canvas.toDataURL('image/png');
      
      // فتح نافذة جديدة للمعاينة
      const previewWindow = window.open('', '_blank');
      if (previewWindow) {
        previewWindow.document.write(`
          <!DOCTYPE html>
          <html dir="rtl">
          <head>
            <meta charset="UTF-8">
            <title>معاينة الإيصال</title>
            <style>
              body { 
                font-family: 'Arial', sans-serif; 
                padding: 20px; 
                background: #f5f5f5;
                text-align: center;
              }
              .preview-container {
                max-width: 576px;
                margin: 0 auto;
                background: white;
                padding: 20px;
                border-radius: 10px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              }
              img { 
                max-width: 100%; 
                height: auto;
                border: 1px solid #ddd;
              }
              .controls {
                margin-top: 20px;
                padding: 15px;
                background: #f8f9fa;
                border-radius: 5px;
              }
              button {
                padding: 10px 20px;
                margin: 0 5px;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-size: 16px;
              }
              .btn-print {
                background: #28a745;
                color: white;
              }
              .btn-close {
                background: #dc3545;
                color: white;
              }
              .features {
                text-align: right;
                margin-top: 15px;
                padding: 10px;
                background: #e9ecef;
                border-radius: 5px;
              }
            </style>
          </head>
          <body>
            <div class="preview-container">
              <h2>معاينة الإيصال - التصميم الجديد</h2>
              <img src="${imageUrl}" alt="معاينة الإيصال">
              
              <div class="features">
                <h4>مميزات التصميم الجديد:</h4>
                <ul style="text-align: right; padding-right: 20px;">
                  <li>تصميم منظم بدون تداخل</li>
                  <li>استخدام الأرقام العربية الصحيحة</li>
                  <li>فصل الإجمالي عن الجدول بوضوح</li>
                  <li>مقاس الورق: 80 مم</li>
                  <li>خطوط واضحة وقراءة سهلة</li>
                </ul>
              </div>
              
              <div class="controls">
                <button class="btn-print" onclick="window.print()">🖨️ طباعة المعاينة</button>
                <button class="btn-close" onclick="window.close()">✖ إغلاق</button>
              </div>
              
              <p style="margin-top: 15px; color: #666; font-size: 14px;">
                مقاس الورق: 80 مم × ارتفاع ديناميكي<br>
                الأرقام: عربية صحيحة (٠١٢٣٤٥٦٧٨٩)<br>
                التصميم: احترافي بدون تداخل
              </p>
            </div>
          </body>
          </html>
        `);
        previewWindow.document.close();
      }
    } catch (error) {
      console.error('خطأ في عرض المعاينة:', error);
      Swal.fire('خطأ', 'فشل في عرض معاينة الإيصال', 'error');
    }
  }

  /**
   * اختبار التصميم الجديد
   */
  async testNewReceiptDesign(): Promise<boolean> {
    try {
      const testData: ReceiptData = {
        receiptNumber: 'TEST-001',
        date: new Date().toLocaleDateString('en-US'),
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        studentName: 'محمد أحمد علي',
        studentId: 'STD-2024-001',
        className: 'رياضيات - المستوى الأول',
        month: 'يناير 2024',
        amount: 75000,
        paymentMethod: 'bank',
        academicYear: '1AS',
        parentPhone: '0551234567',
        notes: 'الدفعة الأولى من أصل 3 دفعات - نتمنى للطالب النجاح والتوفيق في مسيرته التعليمية'
      };

      return await this.printProfessionalReceipt(testData);
    } catch (error) {
      console.error('فشل اختبار التصميم الجديد:', error);
      return false;
    }
  }

  /**
   * طباعة إيصال بالبيانات المخصصة
   */
  async printCustomReceipt(
    studentName: string,
    studentId: string,
    className: string,
    month: string,
    amount: number,
    paymentMethod: string = 'cash',
    additionalNotes?: string
  ): Promise<boolean> {
    try {
      const receiptData: ReceiptData = {
        receiptNumber: `CUST-${Date.now().toString().slice(-8)}`,
        date: new Date().toLocaleDateString('en-US'),
        time: new Date().toLocaleTimeString('en-US ', { hour: '2-digit', minute: '2-digit' }),
        studentName,
        studentId,
        className,
        month,
        amount,
        paymentMethod,
        notes: additionalNotes || 'دفعة نقدية'
      };

      return await this.printProfessionalReceipt(receiptData);
    } catch (error) {
      console.error('فشل في طباعة الإيصال المخصص:', error);
      return false;
    }
  }
}