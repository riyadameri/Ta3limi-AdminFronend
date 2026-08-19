import { Injectable, NgZone } from '@angular/core';
import Swal from 'sweetalert2';

declare const navigator: any;

// ==================== INTERFACES ====================
export type ConnectionType = 'usb' | 'com';

export interface ConnectionSettings {
  type: ConnectionType;
  comPort?: string;
  baudRate?: number;
}

// في printer.service.ts - تحديث واجهة BulkReceiptData

export interface BulkReceiptData {
  receiptNumber: string;
  date: string;
  time: string;
  totalAmount: number;
  paymentCount: number;
  studentCount: number;
  paymentMethod: string;
  payments: {
    studentName: string;
    studentId: string;
    className: string; // 🔥 اسم الحصة مطلوب
    month: string;
    amount: number;
    notes?: string;
  }[];
  notes?: string;
}
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
  username?: string;
  password?: string;
  platformUrl?: string;
  qrCodeUrl?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PrinterService {



  private device: any = null;
  private interfaceNumber: number = 0;
  private endpointNumber: number | null = null;
  private isConnected: boolean = false;
  private connectionType: ConnectionType = 'usb';
  private comPort: string = 'COM1';
  private baudRate: number = 9600;
  private comConnection: any = null;
  
  // عرض الورق الحراري 80 مم
  private readonly CANVAS_WIDTH = 576;
  school : any = localStorage.getItem('school') 
  
  // بيانات المؤسسة
  private  COMPANY_NAME = localStorage.getItem('school.name') || 'مدرستي';
  private readonly DEVELOPER_NAME = 'Redox';
  private readonly COMPANY_ADDRESS = 'الجزائر، تقرت';
  private readonly COMPANY_PHONE = '+213 673586274';

  USER = this.initializePrintedBy();

  private initializePrintedBy(): string {
    let printedBy = 'غير معروف';
    try {
      const userDataStr = localStorage.getItem("user");
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        printedBy = userData?.fullName || 'غير معروف';
      }
    } catch (error) {
      console.error('Error parsing user data from localStorage', error);
    }
    return printedBy;
  }

  constructor(private ngZone: NgZone) {
    window.addEventListener('beforeunload', () => {
      this.disconnect();
    });
    
    // استرجاع الإعدادات المحفوظة
    this.loadConnectionSettings();
  }



  // ==================== CONNECTION SETTINGS ====================
  
  private saveConnectionSettings(): void {
    try {
      const settings: ConnectionSettings = {
        type: this.connectionType,
        comPort: this.comPort,
        baudRate: this.baudRate
      };
      localStorage.setItem('printer_connection_settings', JSON.stringify(settings));
    } catch (e) {
      console.error('Error saving printer settings:', e);
    }
  }

  private loadConnectionSettings(): void {
    try {
      const saved = localStorage.getItem('printer_connection_settings');
      if (saved) {
        const settings: ConnectionSettings = JSON.parse(saved);
        this.connectionType = settings.type || 'usb';
        this.comPort = settings.comPort || 'COM1';
        this.baudRate = settings.baudRate || 9600;
      }
    } catch (e) {
      console.error('Error loading printer settings:', e);
    }
  }

  getConnectionSettings(): ConnectionSettings | null {
    try {
      const saved = localStorage.getItem('printer_connection_settings');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error loading printer settings:', e);
    }
    return null;
  }

  getConnectionType(): ConnectionType {
    return this.connectionType;
  }

  // ==================== USB CONNECTION METHODS ====================

  async connectToThermalPrinter(): Promise<boolean> {
    try {
      this.connectionType = 'usb';
      
      if (!('usb' in navigator)) {
        throw new Error('WebUSB غير مدعوم في هذا المتصفح. يرجى استخدام Chrome أو Edge.');
      }

      let device;
      const pairedDevices = await navigator.usb.getDevices();
      
      if (pairedDevices.length > 0) {
        device = pairedDevices[0];
      } else {
        device = await navigator.usb.requestDevice({ filters: [] });
      }

      this.device = device;
      await device.open();
      
      if (device.configuration === null) {
        await device.selectConfiguration(1);
      }

      let interfaceNumber = 0;
      let endpointNumber = null;

      for (const iface of device.configuration.interfaces) {
        for (const alt of iface.alternates) {
          if (alt.interfaceClass === 7 || alt.interfaceClass === 255) {
            interfaceNumber = iface.interfaceNumber;
            for (const ep of alt.endpoints) {
              if (ep.direction === 'out') {
                endpointNumber = ep.endpointNumber;
                break;
              }
            }
          }
        }
        if (endpointNumber !== null) break;
      }

      if (endpointNumber === null) {
        interfaceNumber = 0;
        endpointNumber = device.configuration.interfaces[0].alternates[0].endpoints
          .find((e: any) => e.direction === 'out').endpointNumber;
      }

      this.interfaceNumber = interfaceNumber;
      this.endpointNumber = endpointNumber;

      await device.claimInterface(interfaceNumber);
      await this.writeToPrinter(new Uint8Array([0x1B, 0x40]));

      this.isConnected = true;
      this.saveConnectionSettings();
      this.showSuccessToast('تم الاتصال بالطابعة عبر USB بنجاح');
      return true;

    } catch (err: any) {
      this.showConnectionError(err);
      this.isConnected = false;
      return false;
    }
  }

  // ==================== COM PORT CONNECTION METHODS ====================

  async connectToComPort(portName: string = 'COM1', baudRate: number = 9600): Promise<boolean> {
    try {
      this.connectionType = 'com';
      this.comPort = portName;
      this.baudRate = baudRate;
      
      // التحقق من وجود Web Serial API
      if (!('serial' in navigator)) {
        throw new Error('Web Serial API غير مدعوم في هذا المتصفح. يرجى استخدام Chrome أو Edge.');
      }

      // طلب إذن المستخدم للاتصال بالمنفذ
      let port;
      const availablePorts = await navigator.serial.getPorts();
      
      if (availablePorts.length > 0) {
        // محاولة استخدام منفذ موجود مسبقاً
        port = availablePorts[0];
      } else {
        // طلب اختيار منفذ من المستخدم
        port = await navigator.serial.requestPort();
      }

      // فتح المنفذ مع إعدادات السرعة المحددة
      await port.open({
        baudRate: baudRate,
        dataBits: 8,
        stopBits: 1,
        parity: 'none',
        flowControl: 'none'
      });

      this.comConnection = port;
      this.isConnected = true;
      this.saveConnectionSettings();
      
      this.showSuccessToast(`تم الاتصال بالطابعة عبر ${portName} بنجاح`);
      return true;

    } catch (err: any) {
      console.error('COM connection error:', err);
      
      let errorMessage = 'فشل الاتصال بالمنفذ التسلسلي';
      if (err.message) {
        errorMessage = err.message;
      }
      
      this.showConnectionError({
        message: errorMessage,
        name: 'COM Connection Error'
      });
      
      this.isConnected = false;
      return false;
    }
  }

  // ==================== GENERIC WRITE METHODS ====================

  private async writeToPrinter(data: Uint8Array): Promise<void> {
    if (!this.isConnected) {
      throw new Error('الطابعة غير متصلة');
    }

    if (this.connectionType === 'usb' && this.device) {
      // كتابة عبر USB
      if (this.endpointNumber === null) {
        throw new Error('نقطة النهاية غير محددة');
      }
      await this.device.transferOut(this.endpointNumber, data);
    } else if (this.connectionType === 'com' && this.comConnection) {
      // كتابة عبر COM
      const writer = this.comConnection.writable.getWriter();
      try {
        await writer.write(data);
      } finally {
        writer.releaseLock();
      }
    } else {
      throw new Error('لا يوجد اتصال نشط بالطابعة');
    }
  }

  private async writeText(text: string): Promise<void> {
    const encoder = new TextEncoder();
    await this.writeToPrinter(encoder.encode(text));
  }

  // ==================== DISCONNECT ====================

  async disconnect(): Promise<void> {
    try {
      if (this.connectionType === 'usb' && this.device) {
        if (this.interfaceNumber !== undefined) {
          await this.device.releaseInterface(this.interfaceNumber);
        }
        await this.device.close();
        this.device = null;
      } else if (this.connectionType === 'com' && this.comConnection) {
        await this.comConnection.close();
        this.comConnection = null;
      }
      this.isConnected = false;
    } catch (err) {
      console.error('خطأ في فصل الطابعة:', err);
    }
  }

  checkConnectionStatus(): boolean {
    return this.isConnected;
  }

  // ==================== PRINTING METHODS ====================

  async printProfessionalReceipt(data: ReceiptData): Promise<boolean> {
    if (!this.isConnected) {
      let connected = false;
      if (this.connectionType === 'usb') {
        connected = await this.connectToThermalPrinter();
      } else if (this.connectionType === 'com') {
        connected = await this.connectToComPort(this.comPort, this.baudRate);
      }
      if (!connected) return false;
    }

    try {
      this.showLoading('جاري الطباعة...');
      await this.writeToPrinter(new Uint8Array([0x1B, 0x40])); 
      
      const canvas = await this.createReceiptCanvas(data);
      const rasterData = this.canvasToRaster(canvas);
      
      await this.printRasterImage(rasterData, canvas);
      await this.writeToPrinter(new Uint8Array([0x1D, 0x56, 0x41, 0x03])); 

      this.showSuccessToast('تمت الطباعة بنجاح');
      return true;
    } catch (err: any) {
      this.handleError(err);
      return false;
    }
  }

  async printPaymentReceipt(paymentData: any, classData?: any): Promise<boolean> {
    const studentName = typeof paymentData.student === 'object' ? paymentData.student.name : paymentData.studentName || 'طالب';
    const studentId = typeof paymentData.student === 'object' ? paymentData.student.studentId : paymentData.studentId || '';

    const receiptData: ReceiptData = {
      receiptNumber: this.convertHindiToWesternNumbers(paymentData.invoiceNumber || `REC-${Date.now().toString().slice(-6)}`),
      date: this.convertHindiToWesternNumbers(this.formatDateEn(paymentData.paymentDate || Date.now())),
      time: this.convertHindiToWesternNumbers(this.formatTimeEn(paymentData.paymentDate || Date.now())),
      studentName: studentName,
      studentId: this.convertHindiToWesternNumbers(studentId),
      className: classData?.name || paymentData.className || 'حصة',
      month: this.convertHindiToWesternNumbers(paymentData.month || this.formatMonthYearEn(Date.now())),
      amount: paymentData.amount || 0,
      paymentMethod: paymentData.paymentMethod || 'cash',
      academicYear: this.convertHindiToWesternNumbers(paymentData.academicYear || classData?.academicYear || new Date().getFullYear()),
      parentPhone: this.convertHindiToWesternNumbers(paymentData.parentPhone || ''),
      notes: paymentData.notes || '',
      username: paymentData.username || '',
      password: paymentData.password || '',
      platformUrl: paymentData.platformUrl || '',
      qrCodeUrl: paymentData.qrCodeUrl || ''
    };

    return await this.printProfessionalReceipt(receiptData);
  }

  async printReceiptSilent(paymentData: any, classData?: any): Promise<boolean> {
    try {
      if (!this.isConnected) {
        let connected = false;
        if (this.connectionType === 'usb') {
          connected = await this.connectToThermalPrinter();
        } else if (this.connectionType === 'com') {
          connected = await this.connectToComPort(this.comPort, this.baudRate);
        }
        if (!connected) return false;
      }

      const studentName = typeof paymentData.student === 'object' ? paymentData.student.name : paymentData.studentName || 'طالب';
      const studentId = typeof paymentData.student === 'object' ? paymentData.student.studentId : paymentData.studentId || '';

      const receiptData: ReceiptData = {
        receiptNumber: this.convertHindiToWesternNumbers(paymentData.invoiceNumber || `REC-${Date.now().toString().slice(-6)}`),
        date: this.convertHindiToWesternNumbers(this.formatDateEn(paymentData.paymentDate || Date.now())),
        time: this.convertHindiToWesternNumbers(this.formatTimeEn(paymentData.paymentDate || Date.now())),
        studentName: studentName,
        studentId: this.convertHindiToWesternNumbers(studentId),
        className: classData?.name || paymentData.className || 'حصة',
        month: this.convertHindiToWesternNumbers(paymentData.month || this.formatMonthYearEn(Date.now())),
        amount: paymentData.amount || 0,
        paymentMethod: paymentData.paymentMethod || 'cash',
        notes: paymentData.notes || '',
        username: paymentData.username || '',
        password: paymentData.password || '',
        platformUrl: paymentData.platformUrl || '',
        qrCodeUrl: paymentData.qrCodeUrl || ''
      };

      await this.writeToPrinter(new Uint8Array([0x1B, 0x40]));
      const canvas = await this.createReceiptCanvas(receiptData);
      const rasterData = this.canvasToRaster(canvas);
      await this.printRasterImage(rasterData, canvas);
      await this.writeToPrinter(new Uint8Array([0x1D, 0x56, 0x41, 0x03]));

      return true;
    } catch (err) {
      console.error('خطأ في الطباعة الصامتة:', err);
      return false;
    }
  }

  async printBulkReceipt(data: BulkReceiptData): Promise<boolean> {
    if (!this.isConnected) {
      let connected = false;
      if (this.connectionType === 'usb') {
        connected = await this.connectToThermalPrinter();
      } else if (this.connectionType === 'com') {
        connected = await this.connectToComPort(this.comPort, this.baudRate);
      }
      if (!connected) return false;
    }
    
    if (!data || !data.payments || data.payments.length === 0) return false;

    try {
      this.showLoading('جاري الطباعة...');
      await this.writeToPrinter(new Uint8Array([0x1B, 0x40]));
      
      const canvas = await this.createBulkReceiptCanvas(data);
      const rasterData = this.canvasToRaster(canvas);
      
      await this.printRasterImage(rasterData, canvas);
      await this.writeToPrinter(new Uint8Array([0x1D, 0x56, 0x41, 0x03]));

      this.showSuccessToast('تمت الطباعة بنجاح');
      return true;
    } catch (err: any) {
      this.handleError(err);
      return false;
    }
  }

  // ==================== CANVAS CREATION ====================

  async createReceiptCanvas(data: ReceiptData): Promise<HTMLCanvasElement> {
    const canvas = document.createElement('canvas');
    canvas.width = this.CANVAS_WIDTH;
    canvas.height = 3500; 
    
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false; 
    
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#000000';
    ctx.textBaseline = 'top';
    
    let yPos = 15;

    // --- Professional Compact Header ---
    ctx.textAlign = 'right';
    ctx.font = 'bold 26px "Cairo", sans-serif';
    // Safely read school from localStorage (may be null)
    const schoolRaw = localStorage.getItem('school');
    let schoolName = '';
    let schoolPhone = '';
    let schoolAddress = '';
    try {
      if (schoolRaw) {
        const schoolObj = JSON.parse(schoolRaw);
        schoolName = schoolObj?.name || '';
        schoolPhone = schoolObj?.phone || '';
        schoolAddress = schoolObj?.address || '';
      }
    } catch (e) {
      schoolName = schoolRaw || '';
    }
    ctx.fillText(schoolName, canvas.width - 20, yPos);
    yPos += 34;

    ctx.font = 'bold 16px "Cairo", sans-serif';
    ctx.fillText(schoolAddress, canvas.width - 20, yPos);
    
    ctx.font = 'bold 16px Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(schoolPhone, 20, yPos);
    yPos += 30;
    
    this.drawDashedLine(ctx, 15, yPos, canvas.width - 30);
    yPos += 15;

    ctx.textAlign = 'center';
    ctx.font = 'bold 20px "Cairo", sans-serif';
    ctx.fillText('إيصال الدفع', canvas.width / 2, yPos);
    yPos += 30;

    // --- Receipt Info ---
    const infoItems = [
      { label: 'رقم الإيصال:', value: data.receiptNumber },
      { label: 'التاريخ:', value: data.date },
      { label: 'الوقت:', value: data.time },
      { label: 'طريقة الدفع:', value: this.translatePaymentMethod(data.paymentMethod) },
      { label: 'طبع بواسطة:', value: this.USER }
    ];
    
    infoItems.forEach(item => {
      this.drawKeyValue(ctx, item.label, item.value, yPos);
      yPos += 26;
    });
    
    yPos += 5;

    // --- Student Info ---
    yPos = this.drawSectionBanner(ctx, 'معلومات الطالب', yPos);
    
    const studentInfo = [
      { label: 'الاسم:', value: data.studentName },
      { label: 'رقم الطالب:', value: data.studentId },
      { label: 'المستوى:', value: data.academicYear },
      { label: 'الحصة:', value: data.className },
      { label: 'هاتف الولي:', value: data.parentPhone }
    ];
    
    studentInfo.forEach(item => {
      if (item.value) {
        this.drawKeyValue(ctx, item.label, item.value, yPos);
        yPos += 26;
      }
    });
    
    yPos += 10;

    // --- QR Code pointing to alrouad.com/students/{studentId} ---
    if (data.studentId) {
      try {
        const studentUrl = `https://alrouad.com/students/${data.studentId}`;
        const qrDataUrl = await this.generateQrCodeDataUrl(studentUrl);
        const qrImage = await this.loadImage(qrDataUrl);
        const qrSize = 120;
        const qrX = (canvas.width - qrSize) / 2;
        ctx.drawImage(qrImage, qrX, yPos, qrSize, qrSize);
        yPos += qrSize + 8;

        ctx.textAlign = 'center';
        ctx.font = 'bold 14px Arial, sans-serif';
        ctx.fillText(`ID: ${data.studentId}`, canvas.width / 2, yPos);
        yPos += 22;
      } catch (err) {
        console.error('QR generation failed', err);
      }
    }

    // --- Payment Details ---
    yPos = this.drawSectionBanner(ctx, 'تفاصيل الدفع', yPos);
    
    // Table Header
    ctx.font = 'bold 18px "Cairo", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('البيان', canvas.width - 20, yPos);
    ctx.textAlign = 'center';
    ctx.fillText('العدد', canvas.width / 2, yPos);
    ctx.textAlign = 'left';
    ctx.fillText('المبلغ (دج)', 20, yPos);
    
    yPos += 28;
    this.drawSolidLine(ctx, 15, yPos, canvas.width - 30);
    yPos += 12;
    
    // Table Row
    ctx.font = 'bold 16px "Cairo", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(data.className || 'رسوم', canvas.width - 20, yPos);
    
    ctx.font = 'bold 18px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('1', canvas.width / 2, yPos);
    
    ctx.textAlign = 'left';
    ctx.fillText(this.formatAmount(data.amount), 20, yPos);
    yPos += 26;

    if (data.month) {
      ctx.textAlign = 'right';
      ctx.font = 'bold 16px "Cairo", sans-serif';
      ctx.fillText(`الشهر: ${data.month}`, canvas.width - 20, yPos);
      yPos += 26;
    }
    
    yPos += 10;
    this.drawSolidLine(ctx, 15, yPos, canvas.width - 30);
    yPos += 22;

    // --- Total ---
    ctx.textAlign = 'right';
    ctx.font = 'bold 22px "Cairo", sans-serif';
    ctx.fillText('الإجمالي الكلي:', canvas.width - 20, yPos);
    
    ctx.textAlign = 'left';
    ctx.font = 'bold 22px Arial, sans-serif';
    ctx.fillText(`${this.formatAmount(data.amount)} DZD`, 20, yPos);
    yPos += 38;
    
    this.drawDashedLine(ctx, 15, yPos, canvas.width - 30);
    yPos += 18;

    // --- Login Credentials ---
    if (data.username) {
      const boxHeight = data.platformUrl ? 110 : 80;
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.strokeRect(20, yPos, canvas.width - 40, boxHeight);
      
      let innerY = yPos + 10;
      ctx.textAlign = 'center';
      ctx.font = 'bold 16px "Cairo", sans-serif';
      ctx.fillText('بيانات تسجيل الدخول', canvas.width / 2, innerY);
      innerY += 28;
      
      this.drawKeyValue(ctx, 'المستخدم:', data.username, innerY, 40, canvas.width - 80);
      innerY += 24;
      
      this.drawKeyValue(ctx, 'المرور:', data.password || 'تواصل مع الإدارة', innerY, 40, canvas.width - 80);
      innerY += 28;
      
      if (data.platformUrl) {
        ctx.textAlign = 'center';
        ctx.font = 'bold 14px Arial, sans-serif';
        ctx.fillText(data.platformUrl, canvas.width / 2, innerY);
      }
      
      yPos += boxHeight + 12;
      
      ctx.textAlign = 'center';
      ctx.font = 'bold 13px "Cairo", sans-serif';
      ctx.fillText('يرجى حفظ بيانات تسجيل الدخول في مكان آمن', canvas.width / 2, yPos);
      yPos += 20;
      
      this.drawDashedLine(ctx, 15, yPos, canvas.width - 30);
      yPos += 15;
    }

    // --- Notes ---
    if (data.notes && data.notes.trim()) {
      ctx.textAlign = 'right';
      ctx.font = 'bold 16px "Cairo", sans-serif';
      ctx.fillText('ملاحظات:', canvas.width - 20, yPos);
      yPos += 24;
      
      const lines = this.splitTextIntoLines(ctx, data.notes, canvas.width - 40, 15);
      lines.forEach(line => {
        ctx.fillText(line.trim(), canvas.width - 20, yPos);
        yPos += 22; 
      });
      yPos += 10;
    }

    // --- Footer ---
    ctx.textAlign = 'center';
    ctx.font = 'bold 15px "Cairo", sans-serif';
    ctx.fillText('نظام إدارة التعليم - Redox', canvas.width / 2, yPos);
    yPos += 22;
    
    ctx.font = 'bold 13px Arial, sans-serif';
    ctx.fillText(`Powered By: ${this.DEVELOPER_NAME}`, canvas.width / 2, yPos);
    yPos += 22;

    ctx.font = 'bold 13px "Cairo", sans-serif';
    ctx.fillText('إيصال رسمي - يرجى الاحتفاظ به', canvas.width / 2, yPos);
    yPos += 25;
    
    ctx.font = 'bold 16px "Cairo", sans-serif';
    ctx.fillText('شكراً لثقتكم بنا', canvas.width / 2, yPos);
    yPos += 35;

    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = this.CANVAS_WIDTH;
    finalCanvas.height = yPos;
    const finalCtx = finalCanvas.getContext('2d')!;
    finalCtx.imageSmoothingEnabled = false;
    finalCtx.fillStyle = '#FFFFFF';
    finalCtx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
    finalCtx.drawImage(canvas, 0, 0);
    
    return finalCanvas;
  }

// في printer.service.ts - تحديث دالة createBulkReceiptCanvas

async createBulkReceiptCanvas(data: BulkReceiptData): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  canvas.width = this.CANVAS_WIDTH;
  canvas.height = 3500;
  
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#000000';
  ctx.textBaseline = 'top';
  
  let yPos = 15;

  // --- Fix: Safely parse school data from localStorage ---
  let school = { name: '', phone: '', address: '' };
  try {
    const schoolDataStr = localStorage.getItem("school");
    if (schoolDataStr) {
      school = JSON.parse(schoolDataStr);
    }
  } catch (error) {
    console.error("Error parsing school data from localStorage", error);
  }

  // --- Professional Compact Header ---
  ctx.textAlign = 'right';
  ctx.font = 'bold 26px "Cairo", sans-serif';
  ctx.fillText(school.name || 'اسم المدرسة', canvas.width - 20, yPos);
  yPos += 34;

  ctx.font = 'bold 16px "Cairo", sans-serif';
  ctx.fillText(school.address || 'العنوان', canvas.width - 20, yPos);
  
  ctx.font = 'bold 16px Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(school.phone || 'رقم الهاتف', 20, yPos);
  yPos += 30;
  
  this.drawDashedLine(ctx, 15, yPos, canvas.width - 30);
  yPos += 15;

  ctx.textAlign = 'center';
  ctx.font = 'bold 20px "Cairo", sans-serif';
  ctx.fillText('إيصال دفع جماعي', canvas.width / 2, yPos);
  yPos += 30;

  // --- Info ---
  let printedBy = 'غير معروف';
  try {
    const userDataStr = localStorage.getItem("user");
    if (userDataStr) {
      const userData = JSON.parse(userDataStr);
      printedBy = userData?.fullName || 'غير معروف';
    }
  } catch (error) {
    console.error('Error parsing user data from localStorage', error);
  }

  const infoItems = [
    { label: 'رقم الإيصال:', value: data.receiptNumber },
    { label: 'التاريخ:', value: data.date },
    { label: 'عدد الدفعات:', value: data.paymentCount.toString() },
    { label: 'إجمالي الطلاب:', value: data.studentCount.toString() },
    { label: 'طريقة الدفع:', value: this.translatePaymentMethod(data.paymentMethod) },
    { label: 'طبع بواسطة:', value: printedBy }
  ];
  
  infoItems.forEach(item => {
    this.drawKeyValue(ctx, item.label, item.value, yPos);
    yPos += 26;
  });
  
  yPos += 10;

  // --- Payments Table with Class Name ---
  yPos = this.drawSectionBanner(ctx, '📚 تفاصيل الدفعات', yPos);
  
  // Table Header - Fix: Adjusted spacing to prevent overlapping
  ctx.font = 'bold 15px "Cairo", sans-serif';
  
  ctx.textAlign = 'right';
  ctx.fillText('الطالب', canvas.width - 60, yPos);
  
  ctx.textAlign = 'right';
  ctx.fillText('الحصة', canvas.width - 280, yPos); 
  
  ctx.textAlign = 'center';
  ctx.fillText('الشهر', 100, yPos);
  
  ctx.textAlign = 'left';
  ctx.fillText('المبلغ', 20, yPos);
  
  yPos += 28;
  this.drawSolidLine(ctx, 15, yPos, canvas.width - 30);
  yPos += 12;

  // Table Rows with Class Name
  data.payments.forEach(payment => {
    ctx.font = 'bold 15px "Cairo", sans-serif';
    
    // اسم الطالب
    ctx.textAlign = 'right';
    const shortName = payment.studentName.length > 50 ? payment.studentName.substring(0, 10) + '..' : payment.studentName;
    ctx.fillText(shortName, canvas.width - 60, yPos);
    
    // اسم الحصة
    ctx.textAlign = 'right';
    const shortClass = payment.className.length > 50 ? payment.className.substring(0, 8) + '..' : payment.className;
    ctx.fillText(shortClass, canvas.width - 280, yPos);
    
    // الشهر
    ctx.textAlign = 'center';
    ctx.fillText(payment.month || '---', 100, yPos);
    
    // المبلغ
    ctx.font = 'bold 15px Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(this.formatAmount(payment.amount), 20, yPos);
    
    yPos += 32;
  });

  this.drawSolidLine(ctx, 15, yPos, canvas.width - 30);
  yPos += 22;

  // --- Total ---
  ctx.textAlign = 'right';
  ctx.font = 'bold 22px "Cairo", sans-serif';
  ctx.fillText('الإجمالي الكلي:', canvas.width - 20, yPos);
  
  ctx.textAlign = 'left';
  ctx.font = 'bold 22px Arial, sans-serif';
  ctx.fillText(`${this.formatAmount(data.totalAmount)} DZD`, 20, yPos);
  yPos += 38;
  
  this.drawDashedLine(ctx, 15, yPos, canvas.width - 30);
  yPos += 20;

  // --- Notes ---
  if (data.notes && data.notes.trim()) {
    ctx.textAlign = 'right';
    ctx.font = 'bold 16px "Cairo", sans-serif';
    ctx.fillText('📝 ملاحظات:', canvas.width - 20, yPos);
    yPos += 24;
    
    const lines = this.splitTextIntoLines(ctx, data.notes, canvas.width - 40, 15);
    lines.forEach(line => {
      ctx.fillText(line.trim(), canvas.width - 20, yPos);
      yPos += 22;
    });
    yPos += 10;
  }

  // --- Footer ---
  ctx.textAlign = 'center';
  ctx.font = 'bold 15px "Cairo", sans-serif';
  ctx.fillText('نظام إدارة المتعليم ريدوكس', canvas.width / 2, yPos);
  yPos += 22;
  
  ctx.font = 'bold 13px Arial, sans-serif';
  ctx.fillText(`Powered By: ${this.DEVELOPER_NAME}`, canvas.width / 2, yPos);
  yPos += 22;
  
  ctx.font = 'bold 13px "Cairo", sans-serif';
  ctx.fillText('إيصال رسمي - يرجى الاحتفاظ به', canvas.width / 2, yPos);
  yPos += 25;
  
  ctx.font = 'bold 16px "Cairo", sans-serif';
  ctx.fillText('شكراً لثقتكم بنا', canvas.width / 2, yPos);
  yPos += 35;

  const finalCanvas = document.createElement('canvas');
  finalCanvas.width = this.CANVAS_WIDTH;
  finalCanvas.height = yPos;
  const finalCtx = finalCanvas.getContext('2d')!;
  finalCtx.imageSmoothingEnabled = false;
  finalCtx.fillStyle = '#FFFFFF';
  finalCtx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
  finalCtx.drawImage(canvas, 0, 0);
  
  return finalCanvas;
}

  // ==================== IMAGE PROCESSING ====================

  private canvasToRaster(canvas: HTMLCanvasElement): Uint8Array {
    const ctx = canvas.getContext('2d')!;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    const widthBytes = Math.ceil(canvas.width / 8);
    const rasterData = new Uint8Array(widthBytes * canvas.height);
    rasterData.fill(0);
    
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const i = (y * canvas.width + x) * 4;
        const gray = Math.floor((data[i] * 0.3 + data[i + 1] * 0.59 + data[i + 2] * 0.11));
        
        if (gray < 230 && data[i + 3] > 128) {
          const byteIndex = Math.floor(y * widthBytes + x / 8);
          const bitIndex = 7 - (x % 8);
          rasterData[byteIndex] |= (1 << bitIndex);
        }
      }
    }
    return rasterData;
  }

  private async printRasterImage(rasterData: Uint8Array, canvas: HTMLCanvasElement): Promise<void> {
    const widthBytes = Math.ceil(canvas.width / 8);
    const height = canvas.height;

    const header = new Uint8Array([
      0x1D, 0x76, 0x30, 0x00,
      widthBytes & 0xFF, (widthBytes >> 8) & 0xFF,
      height & 0xFF, (height >> 8) & 0xFF
    ]);

    await this.writeToPrinter(new Uint8Array([0x1B, 0x40]));
    await this.writeToPrinter(new Uint8Array([0x1B, 0x33, 0x24])); 
    await this.writeToPrinter(new Uint8Array([0x1D, 0x57, (this.CANVAS_WIDTH / 8) & 0xFF, 0x00])); 
    await this.writeToPrinter(header);

    const CHUNK_SIZE = 1024;
    for (let i = 0; i < rasterData.length; i += CHUNK_SIZE) {
      await this.writeToPrinter(rasterData.slice(i, i + CHUNK_SIZE));
      await new Promise(resolve => setTimeout(resolve, 5)); 
    }
  }

  // ==================== DESIGN HELPERS ====================

  private drawSolidLine(ctx: CanvasRenderingContext2D, x: number, y: number, width: number): void {
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + width, y);
    ctx.stroke();
  }
  
  private drawDashedLine(ctx: CanvasRenderingContext2D, x: number, y: number, width: number): void {
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]); 
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + width, y);
    ctx.stroke();
    ctx.setLineDash([]); 
  }

  private drawSectionBanner(ctx: CanvasRenderingContext2D, text: string, y: number): number {
    const boxHeight = 30;
    ctx.fillStyle = '#000000';
    ctx.fillRect(15, y, this.CANVAS_WIDTH - 30, boxHeight);
    
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.font = 'bold 16px "Cairo", sans-serif';
    ctx.fillText(text, this.CANVAS_WIDTH / 2, y + 5);
    
    ctx.fillStyle = '#000000';
    return y + boxHeight + 12;
  }

  private drawKeyValue(ctx: CanvasRenderingContext2D, key: string, value: string, y: number, xOffset: number = 20, width: number = this.CANVAS_WIDTH): void {
    ctx.font = 'bold 16px "Cairo", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(key, width - xOffset, y);
    
    ctx.font = 'bold 16px Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(this.normalizeDigitsToLatin(value), xOffset, y);
  }

  private normalizeDigitsToLatin(value: string | number): string {
    if (value === null || value === undefined) {
      return '';
    }

    return value.toString()
      .replace(/[٠١٢٣٤٥٦٧٨٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString())
      .replace(/[۰۱۲۳۴۵۶۷۸۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString());
  }

  private areLatinDigits(value: string | number): boolean {
    if (value === null || value === undefined) {
      return false;
    }
    const str = value.toString();
    return /^[0-9]+$/.test(str);
  }

  private async generateQrCodeDataUrl(text: string): Promise<string> {
    const encodedText = encodeURIComponent(text);
    const apiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodedText}`;
    return apiUrl;
  }

  private async loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Image load failed'));
      img.src = url;
    });
  }

  // ==================== FORMATTING & UTILS ====================

  private formatDateEn(dateInput: any): string {
    const d = new Date(dateInput);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear().toString();
    return `${year}-${month}-${day}`;
  }

  private formatTimeEn(dateInput: any): string {
    const d = new Date(dateInput);
    let hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; 
    return `${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
  }

  private formatMonthYearEn(dateInput: any): string {
    const d = new Date(dateInput);
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear().toString();
    return `${year}-${month}`;
  }

  private formatAmount(amount: number): string {
    return new Intl.NumberFormat('en-US').format(amount);
  }

  private convertHindiToWesternNumbers(text: string): string {
    if (!text) return text;
    return text.replace(/[\u0660-\u0669]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0x0660 + 0x0030));
  }

  private translatePaymentMethod(method: string): string {
    const methods: { [key: string]: string } = {
      'cash': 'نقدي', 'bank': 'تحويل بنكي', 'card': 'بطاقة ائتمان',
      'check': 'شيك', 'online': 'دفع إلكتروني', 'mobile': 'دفع عبر الهاتف'
    };
    return methods[method.toLowerCase()] || method;
  }

  private splitTextIntoLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, fontSize: number): string[] {
    ctx.font = `bold ${fontSize}px "Cairo", sans-serif`;
    const words = text.split(' ');
    let line = '';
    const lines: string[] = [];
    
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
    if (line) lines.push(line);
    return lines;
  }

  // ==================== UI ALERTS ====================

  private showConnectionError(err: any): void {
    this.ngZone.run(() => {
      Swal.fire({
        icon: 'error',
        title: 'خطأ في الاتصال',
        text: err.message || 'يرجى التأكد من توصيل الطابعة وتوفر الصلاحيات',
        confirmButtonText: 'موافق'
      });
    });
  }

  private showSuccessToast(message: string): void {
    this.ngZone.run(() => {
      Swal.fire({
        icon: 'success', title: message,
        timer: 2000, showConfirmButton: false,
        position: 'top-end', toast: true
      });
    });
  }

  private showLoading(message: string): void {
    this.ngZone.run(() => {
      Swal.fire({
        title: message,
        allowOutsideClick: false,
        showConfirmButton: false,
        willOpen: () => Swal.showLoading()
      });
    });
  }

  private handleError(err: any): void {
    this.ngZone.run(() => {
      Swal.fire({
        icon: 'error', title: 'خطأ',
        text: 'حدث خطأ أثناء الطباعة: ' + err.message,
        confirmButtonText: 'موافق'
      });
    });
    this.isConnected = false;
  }
}