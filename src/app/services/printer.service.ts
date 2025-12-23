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
  
  // إعدادات الطابعة
  private readonly PRINT_WIDTH = 576;
  private readonly PRINT_HEIGHT = 900;
  private readonly CANVAS_WIDTH = 576;
  private readonly CANVAS_HEIGHT = 900;
  private readonly MAX_CHUNK_SIZE = 1024;
  private readonly COMPANY_NAME = 'أكاديمية الرواد للتعليم والمعارف';
  private readonly DEVELOPER_NAME = 'ريدزكس';
  private readonly FOOTER_TEXT = 'تتمنى لكم تجربة تعليمية ممتعة ومفيدة';
  private readonly COMPANY_ADDRESS = 'الجزائر، ولاية الجزائر';
  private readonly QR_CODE_TEXT = 'أكاديمية الرواد للتعليم والمعارف\nالموقع: academy-arrowad.edu.dz\nهاتف: 1234567890';

  // روابط الصور
  private readonly REDOX_LOGO_URL = 'https://redox-sm.onrender.com/favicon.ico';
  private readonly ACADEMY_LOGO_URL = 'https://via.placeholder.com/100x100/2C3E50/FFFFFF?text=AR'; // يمكن استبدالها بلوجو الأكاديمية الفعلي

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
      
      await this.writer.write(new Uint8Array([0x1B, 0x40]));
      await this.writer.write(new Uint8Array([0x1B, 0x33, 0x18]));

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
    
    // إطار QR Code
    ctx.fillStyle = '#000000';
    
    // نمط بسيط للQR (يمكن استبداله بمكتبة QR Code حقيقية)
    const qrSize = 100;
    const xPos = (qrCanvas.width - qrSize) / 2;
    const yPos = (qrCanvas.height - qrSize) / 2;
    
    // نقاط QR Code (نمط تجريبي)
    ctx.fillRect(xPos, yPos, qrSize, qrSize);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(xPos + 10, yPos + 10, qrSize - 20, qrSize - 20);
    
    // نص QR Code
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('QR Code', qrCanvas.width / 2, qrCanvas.height - 5);
    
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
   * إنشاء وإعداد Canvas للفاتورة
   */
  private async createReceiptCanvas(data: ReceiptData): Promise<HTMLCanvasElement> {
    const canvas = document.createElement('canvas');
    canvas.width = this.CANVAS_WIDTH;
    canvas.height = this.CANVAS_HEIGHT;
    
    const ctx = canvas.getContext('2d')!;
    
    // خلفية بيضاء
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // إعدادات الخط
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.lineWidth = 2;
    
    // === الشعارات ===
    try {
      // شعار ريدزكس
      const redoxLogo = await this.loadImage(this.REDOX_LOGO_URL);
      ctx.drawImage(redoxLogo, 20, 20, 80, 80);
      
      // شعار الأكاديمية (نص بديل)
      ctx.font = 'bold 20px Arial';
      ctx.fillStyle = '#2C3E50';
      ctx.textAlign = 'left';
      ctx.fillText('AR', 470, 40);
      ctx.textAlign = 'center';
    } catch (error) {
      console.warn('لم يتم تحميل الشعارات، استخدام النص البديل');
    }
    
    // === عنوان الفاتورة ===
    ctx.font = 'bold 38px "Arial", sans-serif';
    ctx.fillStyle = '#000000';
    this.wrapText(ctx, this.COMPANY_NAME, canvas.width / 2, 60, canvas.width - 40);
    
    ctx.font = 'bold 32px "Arial", sans-serif';
    ctx.fillText('إيصـــال دفـــع رمســـي', canvas.width / 2, 110);
    
    // خط فاصل مزدوج
    this.drawDoubleDivider(ctx, 20, 140, canvas.width - 40);
    
    // === QR Code ===
    const qrCanvas = this.generateQRCode(this.QR_CODE_TEXT);
    ctx.drawImage(qrCanvas, canvas.width - 140, 160, 100, 100);
    
    // === معلومات الفاتورة ===
    ctx.textAlign = 'right';
    ctx.font = 'bold 24px "Arial", sans-serif';
    
    let yPos = 180;
    
    // إطار معلومات الفاتورة
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.strokeRect(20, 160, canvas.width - 180, 110);
    
    ctx.fillText(`رقم الإيصال: ${data.receiptNumber}`, canvas.width - 180, yPos);
    yPos += 30;
    ctx.fillText(`التاريخ: ${data.date}`, canvas.width - 180, yPos);
    yPos += 30;
    ctx.fillText(`الوقت: ${data.time}`, canvas.width - 180, yPos);
    yPos += 30;
    ctx.fillText(`طريقة الدفع: ${this.translatePaymentMethod(data.paymentMethod)}`, canvas.width - 180, yPos);
    
    yPos += 50;
    
    // خط فاصل
    this.drawDivider(ctx, 20, yPos, canvas.width - 40, '#000000', 2);
    yPos += 30;
    
    // === معلومات الطالب ===
    ctx.font = 'bold 28px "Arial", sans-serif';
    ctx.fillStyle = '#2C3E50';
    ctx.fillText('معلومات الطالب', canvas.width - 20, yPos);
    yPos += 35;
    
    ctx.font = 'bold 26px "Arial", sans-serif';
    ctx.fillStyle = '#000000';
    ctx.fillText(`الاســـم: ${data.studentName}`, canvas.width - 20, yPos);
    yPos += 35;
    
    // إطار معلومات الطالب
    ctx.strokeStyle = '#2C3E50';
    ctx.lineWidth = 1.5;
    const infoBoxY = yPos - 70;
    ctx.strokeRect(20, infoBoxY, canvas.width - 40, 140);
    
    const infoX = canvas.width - 40;
    
    ctx.fillText(`رقم التسجيل: ${data.studentId}`, infoX, yPos);
    yPos += 35;
    
    if (data.academicYear) {
      ctx.fillText(`المستوى الدراسي: ${data.academicYear}`, infoX, yPos);
      yPos += 35;
    }
    
    if (data.parentPhone) {
      ctx.fillText(`هاتف ولي الأمر: ${data.parentPhone}`, infoX, yPos);
      yPos += 35;
    }
    
    yPos += 30;
    
    // خط فاصل مزدوج
    this.drawDoubleDivider(ctx, 20, yPos, canvas.width - 40);
    yPos += 40;
    
    // === تفاصيل الدفع ===
    ctx.font = 'bold 28px "Arial", sans-serif';
    ctx.fillStyle = '#2C3E50';
    ctx.fillText('تفاصيل الدفع', canvas.width - 20, yPos);
    yPos += 40;
    
    ctx.font = 'bold 26px "Arial", sans-serif';
    ctx.fillStyle = '#000000';
    
    // جدول تفاصيل الدفع
    const tableY = yPos;
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    
    // رأس الجدول
    ctx.fillStyle = '#2C3E50';
    ctx.fillRect(20, tableY, canvas.width - 40, 40);
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 22px "Arial", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('التفاصيل', canvas.width / 2, tableY + 28);
    ctx.fillText('المبلغ (دج)', 100, tableY + 28);
    
    // صف البيانات
    yPos += 40;
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeRect(20, yPos, canvas.width - 40, 40);
    
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'right';
    ctx.font = '22px "Arial", sans-serif';
    ctx.fillText(data.className, canvas.width - 100, yPos + 28);
    
    ctx.textAlign = 'center';
    ctx.font = 'bold 22px "Arial", sans-serif';
    ctx.fillText(data.amount.toLocaleString('ar-EG'), 100, yPos + 28);
    
    yPos += 40;
    
    // الفترة
    ctx.strokeRect(20, yPos, canvas.width - 40, 40);
    ctx.textAlign = 'right';
    ctx.font = '22px "Arial", sans-serif';
    ctx.fillText(`لفترة: ${data.month}`, canvas.width - 100, yPos + 28);
    
    yPos += 50;
    
    // === الإجمالي ===
    ctx.textAlign = 'center';
    ctx.font = 'bold 32px "Arial", sans-serif';
    ctx.fillStyle = '#000000';
    ctx.fillText('الإجمالي:', canvas.width / 2 - 50, yPos);
    
    ctx.font = 'bold 36px "Arial", sans-serif';
    ctx.fillStyle = '#2C3E50';
    ctx.fillText(`${data.amount.toLocaleString('ar-EG')} د.ج`, canvas.width / 2 + 60, yPos);
    
    yPos += 60;
    
    // خط فاصل زخرفي
    this.drawFancyDivider(ctx, 20, yPos, canvas.width - 40);
    yPos += 40;
    
    // === الملاحظات ===
    if (data.notes) {
      ctx.textAlign = 'right';
      ctx.font = 'bold 22px "Arial", sans-serif';
      ctx.fillStyle = '#2C3E50';
      ctx.fillText('ملاحظات:', canvas.width - 20, yPos);
      yPos += 30;
      
      ctx.font = '20px "Arial", sans-serif';
      ctx.fillStyle = '#000000';
      this.wrapTextRight(ctx, data.notes, canvas.width - 20, yPos, canvas.width - 40);
      yPos += 60;
    }
    
    // === الشعار والتذييل ===
    this.drawDoubleDivider(ctx, 20, yPos, canvas.width - 40);
    yPos += 40;
    
    ctx.textAlign = 'center';
    ctx.font = 'bold 26px "Arial", sans-serif';
    ctx.fillStyle = '#2C3E50';
    ctx.fillText('تمت الطباعة بواسطة نظام', canvas.width / 2, yPos);
    yPos += 35;
    
    ctx.font = 'bold 32px "Arial", sans-serif';
    ctx.fillStyle = '#E74C3C';
    ctx.fillText(this.DEVELOPER_NAME, canvas.width / 2, yPos);
    yPos += 40;
    
    ctx.font = 'bold 24px "Arial", sans-serif';
    ctx.fillStyle = '#000000';
    ctx.fillText(this.FOOTER_TEXT, canvas.width / 2, yPos);
    yPos += 40;
    
    ctx.font = 'bold 22px "Arial", sans-serif';
    ctx.fillStyle = '#2C3E50';
    ctx.fillText('نسخة الطالب', canvas.width / 2, yPos);
    yPos += 50;
    
    // === رسالة الشكر ===
    ctx.font = 'bold 26px "Arial", sans-serif';
    ctx.fillStyle = '#27AE60';
    ctx.fillText('شكراً لثقتكم الغالية', canvas.width / 2, yPos);
    yPos += 35;
    
    ctx.font = '20px "Arial", sans-serif';
    ctx.fillStyle = '#000000';
    ctx.fillText('هذا إيصال رسمي ويُرجى الاحتفاظ به للمراجعة', canvas.width / 2, yPos);
    yPos += 30;
    
    // === دعاء وذكر ===
    this.drawDivider(ctx, 20, yPos, canvas.width - 40, '#000000', 1);
    yPos += 40;
    
    ctx.font = 'bold 24px "Arial", sans-serif';
    ctx.fillStyle = '#2C3E50';
    ctx.fillText('ﷺ صلى الله على سيدنا محمد', canvas.width / 2, yPos);
    yPos += 35;
    
    ctx.font = '20px "Arial", sans-serif';
    ctx.fillStyle = '#000000';
    ctx.fillText('لا تنسوا الصلاة على رسول الله', canvas.width / 2, yPos);
    
    return canvas;
  }

  /**
   * تحويل Canvas إلى صورة نقطية (Raster) للطابعة الحرارية
   */
  private canvasToRaster(canvas: HTMLCanvasElement): Uint8Array {
    const ctx = canvas.getContext('2d')!;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    const widthBytes = Math.ceil(canvas.width / 8);
    const rasterData = new Uint8Array(widthBytes * canvas.height);
    
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const i = (y * canvas.width + x) * 4;
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        
        if (gray < 128) {
          const byteIndex = y * widthBytes + Math.floor(x / 8);
          const bitIndex = 7 - (x % 8);
          rasterData[byteIndex] |= (1 << bitIndex);
        }
      }
    }
    
    return rasterData;
  }

  /**
   * طباعة الصورة النقطية على الطابعة
   */
  private async printRasterImage(rasterData: Uint8Array, canvas: HTMLCanvasElement): Promise<boolean> {
    try {
      if (!this.writer) {
        throw new Error('الطابعة غير متصلة');
      }

      const widthBytes = Math.ceil(canvas.width / 8);
      const height = canvas.height;

      const header = new Uint8Array([
        0x1D, 0x76, 0x30, 0x00,
        widthBytes & 0xFF,
        (widthBytes >> 8) & 0xFF,
        height & 0xFF,
        (height >> 8) & 0xFF
      ]);

      await this.writer.write(new Uint8Array([
        0x1B, 0x40,
        0x1B, 0x33, 0x18
      ]));

      await this.writer.write(header);

      const CHUNK_SIZE = this.MAX_CHUNK_SIZE;
      for (let i = 0; i < rasterData.length; i += CHUNK_SIZE) {
        const chunk = rasterData.slice(i, i + CHUNK_SIZE);
        await this.writer.write(chunk);
        await new Promise(resolve => setTimeout(resolve, 5));
      }

      await this.writer.write(new Uint8Array([0x1B, 0x64, 0x06]));
      await this.writer.write(new Uint8Array([0x1D, 0x56, 0x41, 0x03]));

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

  // ===== الدوال المساعدة المحسنة =====

  /**
   * لف النص عند الحاجة للمحاذاة اليمنى
   */
  private wrapTextRight(context: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number): void {
    const words = text.split(' ');
    let line = '';
    let lineHeight = 30;
    
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = context.measureText(testLine);
      const testWidth = metrics.width;
      
      if (testWidth > maxWidth && n > 0) {
        context.fillText(line, x, y);
        line = words[n] + ' ';
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    context.fillText(line, x, y);
  }
  private wrapText(context: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number): void {
    const words = text.split(' ');
    let line = '';
    let lineHeight = 40;
    
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = context.measureText(testLine);
      const testWidth = metrics.width;  
      
      if (testWidth > maxWidth && n > 0) {
        context.fillText(line, x, y);
        line = words[n] + ' ';
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    context.fillText(line, x, y);
  }
  /**
   * رسم خط فاصل مزدوج
   */
  private drawDoubleDivider(ctx: CanvasRenderingContext2D, x: number, y: number, width: number): void {
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
   * رسم خط فاصل زخرفي
   */
  private drawFancyDivider(ctx: CanvasRenderingContext2D, x: number, y: number, width: number): void {
    const segment = width / 20;
    ctx.beginPath();
    ctx.strokeStyle = '#2C3E50';
    ctx.lineWidth = 2;
    
    for (let i = 0; i < 20; i++) {
      if (i % 2 === 0) {
        ctx.moveTo(x + (i * segment), y);
        ctx.lineTo(x + ((i + 1) * segment), y);
      }
    }
    
    ctx.stroke();
  }

  /**
   * رسم خط فاصل عادي
   */
  private drawDivider(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, color: string = '#000000', lineWidth: number = 1): void {
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.moveTo(x, y);
    ctx.lineTo(x + width, y);
    ctx.stroke();
  }

  /**
   * ترجمة طريقة الدفع
   */
  private translatePaymentMethod(method: string): string {
    const methods: { [key: string]: string } = {
      'cash': 'نقداً',
      'bank': 'تحويل بنكي',
      'card': 'بطاقة إئتمان',
      'check': 'شيك',
      'online': 'دفع إلكتروني',
      'mobile': 'دفع محمول'
    };
    return methods[method] || method;
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
      timestamp: new Date().toLocaleString('ar-EG'),
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
      date: new Date().toLocaleDateString('ar-EG'),
      time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
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
        date: currentDate.toLocaleDateString('ar-EG'),
        time: currentDate.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
        studentName: studentData.name || 'طالب',
        studentId: studentData.studentId || 'بدون رقم',
        className: 'تقرير شهري شامل',
        month: currentDate.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' }),
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
      canvas.height = this.CANVAS_HEIGHT;
      
      const ctx = canvas.getContext('2d')!;
      
      // خلفية
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#000000';
      
      // عنوان الصفحة
      ctx.textAlign = 'center';
      ctx.font = 'bold 40px "Arial", sans-serif';
      ctx.fillText('✨ صفحة اختبار الطابعة ✨', canvas.width / 2, 60);
      
      // QR Code للاختبار
      const testQR = this.generateQRCode('أكاديمية الرواد للتعليم والمعارف - صفحة اختبار');
      ctx.drawImage(testQR, canvas.width / 2 - 60, 90, 120, 120);
      
      // معلومات النظام
      ctx.textAlign = 'right';
      ctx.font = 'bold 24px "Arial", sans-serif';
      ctx.fillText(`التاريخ: ${new Date().toLocaleDateString('ar-EG')}`, canvas.width - 20, 250);
      ctx.fillText(`الوقت: ${new Date().toLocaleTimeString('ar-EG')}`, canvas.width - 20, 280);
      ctx.fillText(`النظام: ${this.DEVELOPER_NAME}`, canvas.width - 20, 310);
      ctx.fillText(`المؤسسة: ${this.COMPANY_NAME}`, canvas.width - 20, 340);
      
      // خطوط مختلفة
      ctx.textAlign = 'center';
      ctx.font = 'bold 32px "Arial", sans-serif';
      ctx.fillText('اختبار الخطوط العربية واللغة', canvas.width / 2, 400);
      
      ctx.font = '26px "Arial", sans-serif';
      ctx.fillText('مرحباً بكم في نظام إدارة التعليم', canvas.width / 2, 440);
      ctx.fillText('نظام متكامل لإدارة المؤسسات التعليمية', canvas.width / 2, 480);
      
      // خط فاصل زخرفي
      this.drawFancyDivider(ctx, 20, 520, canvas.width - 40);
      
      // تدرج الرمادي
      ctx.fillStyle = '#000000';
      ctx.fillRect(50, 550, 150, 30);
      ctx.fillStyle = '#666666';
      ctx.fillRect(50, 585, 150, 30);
      ctx.fillStyle = '#999999';
      ctx.fillRect(50, 620, 150, 30);
      
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 20px "Arial", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('تدرج الرمادي', 220, 610);
      
      // رسالة النجاح
      ctx.textAlign = 'center';
      ctx.font = 'bold 38px "Arial", sans-serif';
      ctx.fillStyle = '#27AE60';
      ctx.fillText('✅ اختبار ناجح ✅', canvas.width / 2, 700);
      
      ctx.font = '28px "Arial", sans-serif';
      ctx.fillStyle = '#000000';
      ctx.fillText('الطابعة تعمل بشكل ممتاز', canvas.width / 2, 750);
      
      // الشعار والدعاء
      ctx.font = 'bold 26px "Arial", sans-serif';
      ctx.fillStyle = '#2C3E50';
      ctx.fillText(this.COMPANY_NAME, canvas.width / 2, 800);
      ctx.fillText(this.DEVELOPER_NAME, canvas.width / 2, 840);
      
      ctx.font = '22px "Arial", sans-serif';
      ctx.fillText('ﷺ صلى الله على سيدنا محمد', canvas.width / 2, 880);
      
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
        date: new Date().toLocaleDateString('ar-EG'),
        time: new Date().toLocaleTimeString('ar-EG'),
        studentName: 'اختبار النظام',
        studentId: 'TEST-001',
        className: 'اختبار الطباعة',
        month: 'شهر الاختبار',
        amount: 123456,
        paymentMethod: 'cash',
        notes: 'هذا إيصال اختباري للتحقق من عمل الطابعة والأرقام العربية'
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
        canvas.height = 600;
        
        const ctx = canvas.getContext('2d')!;
        
        // خلفية
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#000000';
        
        // رسالة الترحيب
        ctx.textAlign = 'center';
        ctx.font = 'bold 40px "Arial", sans-serif';
        ctx.fillText('مرحباً بكم في', canvas.width / 2, 60);
        ctx.fillText('نظام إدارة التعليم', canvas.width / 2, 110);
        
        ctx.font = '28px "Arial", sans-serif';
        ctx.fillText('تهانينا!', canvas.width / 2, 180);
        ctx.fillText('تم إعداد النظام بنجاح', canvas.width / 2, 220);
        
        // QR Code للأكاديمية
        const qrCanvas = this.generateQRCode(this.QR_CODE_TEXT);
        ctx.drawImage(qrCanvas, canvas.width / 2 - 60, 260, 120, 120);
        
        // ميزات النظام
        ctx.textAlign = 'right';
        ctx.font = '24px "Arial", sans-serif';
        let yPos = 400;
        ctx.fillText('✓ إدارة الطلاب والشعب', canvas.width - 20, yPos);
        yPos += 30;
        ctx.fillText('✓ نظام الحضور والغياب', canvas.width - 20, yPos);
        yPos += 30;
        ctx.fillText('✓ إدارة المدفوعات المالية', canvas.width - 20, yPos);
        yPos += 30;
        ctx.fillText('✓ تقارير تفصيلية', canvas.width - 20, yPos);
        yPos += 30;
        ctx.fillText('✓ طباعة إيصالات احترافية', canvas.width - 20, yPos);
        
        // رسالة الختام
        ctx.textAlign = 'center';
        ctx.font = 'bold 30px "Arial", sans-serif';
        ctx.fillText('تتمنى لكم', canvas.width / 2, 520);
        ctx.fillText('تجربة تعليمية ممتعة ومفيدة', canvas.width / 2, 560);
        
        ctx.font = '24px "Arial", sans-serif';
        ctx.fillText('نحو مستقبل زاهر بالعلم والمعرفة', canvas.width / 2, 600);
        
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
}