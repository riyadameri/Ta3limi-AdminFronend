import { Injectable, NgZone } from '@angular/core';
import Swal from 'sweetalert2';
import * as QRCode from 'qrcode';

declare const navigator: any;

// ==================== INTERFACES ====================
export type ConnectionType = 'usb' | 'com';

export interface ConnectionSettings {
  type: ConnectionType;
  comPort?: string;
  baudRate?: number;
}

export interface ReceiptData {
  receiptNumber: string;
  date: string;
  time: string;
  studentName: string;
  studentId: string;
  studentObjectId?: string;
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
    className: string;
    month: string;
    amount: number;
    notes?: string;
  }[];
  notes?: string;
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
  
  private readonly CANVAS_WIDTH = 576;
  private readonly DEVELOPER_NAME = 'Redox';
  private readonly PLATFORM_URL = 'https://alrouad.com/studentsPlatform';

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
    this.loadConnectionSettings();
  }

  // ==================== CONNECTION SETTINGS ====================
  
  saveConnectionSettings(settings?: ConnectionSettings): void {
    try {
      const data: ConnectionSettings = settings || {
        type: this.connectionType,
        comPort: this.comPort,
        baudRate: this.baudRate
      };
      localStorage.setItem('printer_connection_settings', JSON.stringify(data));
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

  // ==================== USB CONNECTION ====================
  
  async connectDirectXprinter(): Promise<boolean> {
    try {
      this.connectionType = 'usb';
      
      if (!('usb' in navigator)) {
        throw new Error('WebUSB غير مدعوم في هذا المتصفح. يرجى استخدام Chrome أو Edge.');
      }

      const device = await navigator.usb.requestDevice({ filters: [] });
      
      if (!device) {
        throw new Error('لم يتم اختيار أي جهاز');
      }
      
      this.device = device;
      
      await device.open();
      
      if (device.configuration === null) {
        await device.selectConfiguration(1);
      }
      
      let interfaceNumber: number | undefined;
      let endpointNumber: number | undefined;
      
      for (const iface of device.configuration.interfaces) {
        const alternate = iface.alternate;
        if (alternate.interfaceClass === 7 || alternate.interfaceClass === 255) {
          interfaceNumber = iface.interfaceNumber;
          for (const ep of alternate.endpoints) {
            if (ep.direction === 'out' && ep.type === 'bulk') {
              endpointNumber = ep.endpointNumber;
              break;
            }
          }
        }
      }
      
      if (interfaceNumber === undefined || endpointNumber === undefined) {
        for (const iface of device.configuration.interfaces) {
          const alternate = iface.alternate;
          for (const ep of alternate.endpoints) {
            if (ep.direction === 'out') {
              interfaceNumber = iface.interfaceNumber;
              endpointNumber = ep.endpointNumber;
              break;
            }
          }
          if (interfaceNumber !== undefined && endpointNumber !== undefined) break;
        }
      }
      
      if (interfaceNumber === undefined || endpointNumber === undefined) {
        throw new Error('لم يتم العثور على واجهة طابعة متوافقة في هذا الجهاز.');
      }
      
      this.interfaceNumber = interfaceNumber;
      this.endpointNumber = endpointNumber;
      
      await device.claimInterface(interfaceNumber);
      
      this.isConnected = true;
      
      try {
        await this.writeToPrinter(new Uint8Array([0x1B, 0x40]));
      } catch (writeError) {
        this.isConnected = false;
        throw writeError;
      }
      
      this.saveConnectionSettings();
      
      this.showSuccessToast('تم الاتصال بالطابعة بنجاح');
      return true;
      
    } catch (err: any) {
      console.error('خطأ في الاتصال بالطابعة:', err);
      this.isConnected = false;
      this.device = null;
      this.endpointNumber = null;
      this.showConnectionError(err);
      return false;
    }
  }

  async connectToThermalPrinter(): Promise<boolean> {
    return await this.connectDirectXprinter();
  }

  // ==================== COM PORT CONNECTION ====================

  async connectToComPort(portName: string = 'COM1', baudRate: number = 9600): Promise<boolean> {
    try {
      this.connectionType = 'com';
      this.comPort = portName;
      this.baudRate = baudRate;
      
      if (!('serial' in navigator)) {
        throw new Error('Web Serial API غير مدعوم في هذا المتصفح.');
      }

      let port;
      const availablePorts = await navigator.serial.getPorts();
      
      if (availablePorts.length > 0) {
        port = availablePorts[0];
      } else {
        port = await navigator.serial.requestPort();
      }

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
      this.isConnected = false;
      this.comConnection = null;
      this.showConnectionError(err);
      return false;
    }
  }

  // ==================== CONNECTION METHODS ====================
  
  async connectPrinterDirect(connectionType: 'usb' | 'com' = 'usb', comPort?: string, baudRate?: number): Promise<boolean> {
    try {
      try {
        await this.disconnect();
      } catch (e) {
        console.warn('خطأ في فصل الاتصال السابق (يتم تجاهله):', e);
      }
      
      this.device = null;
      this.comConnection = null;
      this.isConnected = false;
      this.interfaceNumber = 0;
      this.endpointNumber = null;
      
      if (connectionType === 'usb') {
        this.connectionType = 'usb';
        return await this.connectDirectXprinter();
      } else {
        this.connectionType = 'com';
        const port = comPort || this.comPort;
        const rate = baudRate || this.baudRate;
        return await this.connectToComPort(port, rate);
      }
    } catch (error: any) {
      console.error('فشل الاتصال المباشر:', error);
      this.isConnected = false;
      this.showConnectionError(error);
      return false;
    }
  }

  // ==================== GENERIC WRITE METHODS ====================

  private async writeToPrinter(data: Uint8Array): Promise<void> {
    if (!this.isConnected) {
      throw new Error('الطابعة غير متصلة');
    }

    if (this.connectionType === 'usb' && this.device) {
      if (this.endpointNumber === null) {
        throw new Error('نقطة النهاية غير محددة');
      }
      
      if (!this.device.opened) {
        throw new Error('الجهاز غير مفتوح');
      }
      
      await this.device.transferOut(this.endpointNumber, data);
      
    } else if (this.connectionType === 'com' && this.comConnection) {
      if (!this.comConnection.readable || !this.comConnection.writable) {
        throw new Error('المنفذ التسلسلي غير متاح');
      }
      
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

  // ==================== DISCONNECT ====================

  async disconnect(): Promise<void> {
    try {
      if (this.connectionType === 'com' && this.comConnection) {
        try {
          await this.comConnection.close();
        } catch (e) {
          console.warn('خطأ في إغلاق اتصال COM:', e);
        }
        this.comConnection = null;
      }
      
      if (this.connectionType === 'usb' && this.device) {
        try {
          if (this.device.opened) {
            if (this.interfaceNumber !== undefined && this.interfaceNumber !== null) {
              try {
                await this.device.releaseInterface(this.interfaceNumber);
              } catch (e) {
                console.warn('تعذر تحرير الواجهة:', e);
              }
            }
            try {
              await this.device.close();
            } catch (e) {
              console.warn('تعذر إغلاق الجهاز:', e);
            }
          }
        } catch (e) {
          console.warn('خطأ في التعامل مع جهاز USB:', e);
        }
        this.device = null;
      }
      
      this.isConnected = false;
      this.interfaceNumber = 0;
      this.endpointNumber = null;
      
      console.log('تم فصل الطابعة بنجاح');
      
    } catch (err) {
      console.error('خطأ في فصل الطابعة:', err);
      this.isConnected = false;
      this.device = null;
      this.comConnection = null;
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
        connected = await this.connectDirectXprinter();
      } else if (this.connectionType === 'com') {
        connected = await this.connectToComPort(this.comPort, this.baudRate);
      }
      if (!connected) return false;
    }

    try {
      this.showLoading('جاري تحضير الفاتورة للطباعة...');
      
      const canvas = await this.createProfessionalReceiptCanvas(data);
      const rasterData = this.generateRasterCommand(canvas);
      
      const initCmd = new Uint8Array([0x1B, 0x40]);
      const alignCenterCmd = new Uint8Array([0x1B, 0x61, 0x01]);
      const feedLines = new Uint8Array([0x0A, 0x0A, 0x0A, 0x0A, 0x0A]);
      const cutCmd = new Uint8Array([0x1D, 0x56, 0x00]);

      const printData = new Uint8Array(
        initCmd.length + alignCenterCmd.length + rasterData.length + feedLines.length + cutCmd.length
      );
      
      let offset = 0;
      printData.set(initCmd, offset); offset += initCmd.length;
      printData.set(alignCenterCmd, offset); offset += alignCenterCmd.length;
      printData.set(rasterData, offset); offset += rasterData.length;
      printData.set(feedLines, offset); offset += feedLines.length;
      printData.set(cutCmd, offset);

      await this.writeToPrinter(printData);

      this.showSuccessToast('تمت الطباعة بنجاح');
      return true;
    } catch (err: any) {
      this.handleError(err);
      return false;
    }
  }

  async printBulkReceipt(data: BulkReceiptData): Promise<boolean> {
    if (!this.isConnected) {
      let connected = false;
      if (this.connectionType === 'usb') {
        connected = await this.connectDirectXprinter();
      } else if (this.connectionType === 'com') {
        connected = await this.connectToComPort(this.comPort, this.baudRate);
      }
      if (!connected) return false;
    }
    
    if (!data || !data.payments || data.payments.length === 0) return false;

    try {
      this.showLoading('جاري تحضير الإيصال الجماعي...');
      
      const canvas = await this.createProfessionalBulkReceiptCanvas(data);
      const rasterData = this.generateRasterCommand(canvas);
      
      const initCmd = new Uint8Array([0x1B, 0x40]);
      const alignCenterCmd = new Uint8Array([0x1B, 0x61, 0x01]);
      const feedLines = new Uint8Array([0x0A, 0x0A, 0x0A, 0x0A, 0x0A]);
      const cutCmd = new Uint8Array([0x1D, 0x56, 0x00]);

      const printData = new Uint8Array(
        initCmd.length + alignCenterCmd.length + rasterData.length + feedLines.length + cutCmd.length
      );
      
      let offset = 0;
      printData.set(initCmd, offset); offset += initCmd.length;
      printData.set(alignCenterCmd, offset); offset += alignCenterCmd.length;
      printData.set(rasterData, offset); offset += rasterData.length;
      printData.set(feedLines, offset); offset += feedLines.length;
      printData.set(cutCmd, offset);

      await this.writeToPrinter(printData);

      this.showSuccessToast('تمت الطباعة بنجاح');
      return true;
    } catch (err: any) {
      this.handleError(err);
      return false;
    }
  }

  // ==================== PROFESSIONAL RECEIPT CANVAS ====================

  async createProfessionalReceiptCanvas(data: ReceiptData): Promise<HTMLCanvasElement> {
    const canvas = document.createElement('canvas');
    canvas.width = this.CANVAS_WIDTH;
    canvas.height = 1300;
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    
    // White background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#000000';
    ctx.direction = 'rtl';
    ctx.textBaseline = 'top';

    let yPos = 10;

    // ==================== HEADER ====================
    const schoolRaw = localStorage.getItem('school');
    let schoolName = 'مدرستي', schoolPhone = '', schoolAddress = '';
    try {
      if (schoolRaw) {
        const schoolObj = JSON.parse(schoolRaw);
        schoolName = schoolObj?.name || 'مدرستي';
        schoolPhone = schoolObj?.phone || '';
        schoolAddress = schoolObj?.address || '';
      }
    } catch (e) {
      schoolName = schoolRaw || 'مدرستي';
    }

    // Top border with slight padding
    this.drawBorder(ctx, 8, 6, this.CANVAS_WIDTH - 16, 8, '#1a1a2e', 1.5);
    yPos += 12;

    // School name
    ctx.textAlign = 'center';
    ctx.font = 'bold 26px "Tahoma", "Arial", sans-serif';
    ctx.fillStyle = '#1a1a2e';
    ctx.fillText(schoolName, canvas.width / 2, yPos);
    yPos += 34;

    // Address
    if (schoolAddress) {
      ctx.font = '13px "Tahoma", "Arial", sans-serif';
      ctx.fillStyle = '#4a4a6a';
      ctx.fillText(schoolAddress, canvas.width / 2, yPos);
      yPos += 20;
    }

    // Phone
    if (schoolPhone) {
      ctx.font = '13px "Tahoma", "Arial", sans-serif';
      ctx.fillStyle = '#4a4a6a';
      ctx.fillText(`هاتف: ${schoolPhone}`, canvas.width / 2, yPos);
      yPos += 24;
    }

    // Decorative line
    this.drawDashedLine(ctx, 15, yPos, this.CANVAS_WIDTH - 30);
    yPos += 14;

    // ==================== TITLE ====================
    ctx.textAlign = 'center';
    ctx.font = 'bold 18px "Tahoma", "Arial", sans-serif';
    ctx.fillStyle = '#1a1a2e';
    ctx.fillText('إيصال الدفع', canvas.width / 2, yPos);
    yPos += 28;

    // ==================== INFO BOX ====================
    const infoBoxY = yPos;
    ctx.fillStyle = '#f5f7fa';
    this.drawRoundRect(ctx, 10, infoBoxY, this.CANVAS_WIDTH - 20, 90, 6);
    ctx.fill();
    ctx.strokeStyle = '#d0d2d6';
    ctx.lineWidth = 0.5;
    this.drawRoundRect(ctx, 10, infoBoxY, this.CANVAS_WIDTH - 20, 90, 6);
    ctx.stroke();
    
    ctx.font = '12px "Tahoma", "Arial", sans-serif';
    ctx.textAlign = 'right';
    let infoY = infoBoxY + 6;
    
    const infoItems = [
      { label: 'رقم الإيصال:', value: data.receiptNumber || '---' },
      { label: 'التاريخ:', value: data.date || new Date().toLocaleDateString('ar-EG') },
      { label: 'الوقت:', value: data.time || new Date().toLocaleTimeString('en-US', { hour12: false }) },
      { label: 'طريقة الدفع:', value: this.translatePaymentMethod(data.paymentMethod) }
    ];
    
    infoItems.forEach(item => {
      ctx.fillStyle = '#4a4a6a';
      ctx.font = 'bold 12px "Tahoma", "Arial", sans-serif';
      ctx.fillText(item.label, this.CANVAS_WIDTH - 20, infoY);
      ctx.fillStyle = '#1a1a2e';
      ctx.font = '12px "Tahoma", "Arial", sans-serif';
      ctx.fillText(item.value, this.CANVAS_WIDTH - 155, infoY);
      infoY += 20;
    });
    
    yPos = infoBoxY + 100;

    // ==================== STUDENT INFO ====================
    this.drawSection(ctx, 'معلومات الطالب', yPos);
    yPos += 28;

    const studentInfo = [
      { label: 'الاسم:', value: data.studentName },
      { label: 'الرقم:', value: data.studentId },
      { label: 'المستوى:', value: data.academicYear },
      { label: 'الحصة:', value: data.className }
    ];
    
    ctx.textAlign = 'right';
    studentInfo.forEach(item => {
      if (item.value) {
        ctx.fillStyle = '#4a4a6a';
        ctx.font = 'bold 12px "Tahoma", "Arial", sans-serif';
        ctx.fillText(item.label, this.CANVAS_WIDTH - 20, yPos);
        ctx.fillStyle = '#1a1a2e';
        ctx.font = '12px "Tahoma", "Arial", sans-serif';
        ctx.fillText(item.value, this.CANVAS_WIDTH - 130, yPos);
        yPos += 20;
      }
    });
    yPos += 6;

    // ==================== PAYMENT DETAILS ====================
    this.drawSection(ctx, 'تفاصيل الدفع', yPos);
    yPos += 28;

    // Table
    const tableX = 10;
    const tableWidth = this.CANVAS_WIDTH - 20;
    const tableY = yPos;
    
    // Table header
    ctx.fillStyle = '#1a1a2e';
    this.drawRoundRect(ctx, tableX, tableY, tableWidth, 24, 4);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 11px "Tahoma", "Arial", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('البيان', tableX + tableWidth - 12, tableY + 5);
    ctx.textAlign = 'center';
    ctx.fillText('العدد', tableX + tableWidth / 2, tableY + 5);
    ctx.textAlign = 'left';
    ctx.fillText('المبلغ', tableX + 12, tableY + 5);
    
    yPos += 28;
    
    // Table row
    ctx.fillStyle = '#f8f9fa';
    this.drawRoundRect(ctx, tableX, yPos, tableWidth, 24, 4);
    ctx.fill();
    ctx.fillStyle = '#1a1a2e';
    ctx.font = '12px "Tahoma", "Arial", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(data.className || 'رسوم', tableX + tableWidth - 12, yPos + 5);
    ctx.textAlign = 'center';
    ctx.fillText('1', tableX + tableWidth / 2, yPos + 5);
    ctx.textAlign = 'left';
    ctx.fillText(this.formatAmount(data.amount) + ' د.ج', tableX + 12, yPos + 5);
    
    yPos += 28;
    
    if (data.month) {
      ctx.textAlign = 'right';
      ctx.font = '12px "Tahoma", "Arial", sans-serif';
      ctx.fillStyle = '#1a1a2e';
      ctx.fillText(`الشهر: ${data.month}`, this.CANVAS_WIDTH - 20, yPos);
      yPos += 20;
    }
    
    yPos += 6;

    // ==================== TOTAL ====================
    this.drawLine(ctx, 10, yPos, this.CANVAS_WIDTH - 20, 1);
    yPos += 12;
    
    ctx.textAlign = 'right';
    ctx.font = 'bold 18px "Tahoma", "Arial", sans-serif';
    ctx.fillStyle = '#1a1a2e';
    ctx.fillText('الإجمالي:', this.CANVAS_WIDTH - 20, yPos);
    ctx.textAlign = 'left';
    ctx.font = 'bold 18px "Tahoma", "Arial", sans-serif';
    ctx.fillStyle = '#1a7a3a';
    ctx.fillText(this.formatAmount(data.amount) + ' DZD', 12, yPos);
    yPos += 32;

    // ==================== NOTES ====================
    if (data.notes && data.notes.trim()) {
      ctx.textAlign = 'right';
      ctx.font = 'bold 12px "Tahoma", "Arial", sans-serif';
      ctx.fillStyle = '#4a4a6a';
      ctx.fillText('ملاحظات:', this.CANVAS_WIDTH - 20, yPos);
      yPos += 18;
      ctx.font = '11px "Tahoma", "Arial", sans-serif';
      ctx.fillStyle = '#4a4a6a';
      const lines = this.splitTextIntoLines(ctx, data.notes, this.CANVAS_WIDTH - 40, 11);
      lines.forEach(line => {
        ctx.fillText(line.trim(), this.CANVAS_WIDTH - 20, yPos);
        yPos += 16;
      });
      yPos += 6;
    }

    // ==================== CREDENTIALS (if available) ====================
    if (data.username && data.password) {
      this.drawSection(ctx, 'بيانات تسجيل الدخول', yPos);
      yPos += 28;

      const credBoxY = yPos;
      ctx.fillStyle = '#f0f4f8';
      this.drawRoundRect(ctx, 10, credBoxY, this.CANVAS_WIDTH - 20, 44, 6);
      ctx.fill();
      
      ctx.textAlign = 'right';
      ctx.font = '12px "Tahoma", "Arial", sans-serif';
      ctx.fillStyle = '#1a1a2e';
      ctx.fillText(`اسم المستخدم: ${data.username}`, this.CANVAS_WIDTH - 20, credBoxY + 6);
      ctx.fillText(`كلمة المرور: ${data.password}`, this.CANVAS_WIDTH - 20, credBoxY + 26);
      
      yPos += 52;

      // Platform URL
      if (data.platformUrl) {
        ctx.textAlign = 'center';
        ctx.font = '11px "Tahoma", "Arial", sans-serif';
        ctx.fillStyle = '#4a4a6a';
        ctx.fillText(`المنصة: ${data.platformUrl}`, canvas.width / 2, yPos);
        yPos += 20;
      }
    }

    // ==================== QR CODE - حجم أكبر ====================
    const qrSize = 130; // ✅ حجم أكبر
    const qrX = (this.CANVAS_WIDTH - qrSize) / 2;
    const qrY = yPos;
    
    try {
      // ✅ استخدام _id الحقيقي للطالب
      const studentIdForQR = data.studentObjectId || data.studentId || '';
      const qrData = `${this.PLATFORM_URL}/${studentIdForQR}`;
      const qrCanvas = document.createElement('canvas');
      await QRCode.toCanvas(qrCanvas, qrData, {
        width: qrSize,
        margin: 2,
        color: {
          dark: '#1a1a2e',
          light: '#FFFFFF'
        }
      });
      ctx.drawImage(qrCanvas, qrX, qrY);
      yPos += qrSize + 10;
      
      ctx.textAlign = 'center';
      ctx.font = '11px "Tahoma", "Arial", sans-serif';
      ctx.fillStyle = '#6a6a8a';
      ctx.fillText('امسح الكود للدخول للمنصة', canvas.width / 2, yPos);
      yPos += 22;
    } catch (error) {
      console.error('Error generating QR Code:', error);
      yPos += 10;
    }

    // ==================== FOOTER ====================
    this.drawLine(ctx, 10, yPos, this.CANVAS_WIDTH - 20, 1.5);
    yPos += 12;

    ctx.textAlign = 'center';
    ctx.font = 'bold 16px "Tahoma", "Arial", sans-serif';
    ctx.fillStyle = '#1a7a3a';
    ctx.fillText('شكراً لثقتكم بنا', canvas.width / 2, yPos);
    yPos += 26;
    
    ctx.font = '12px "Tahoma", "Arial", sans-serif';
    ctx.fillStyle = '#6a6a8a';
    ctx.fillText('نظام إدارة التعليم - Redox', canvas.width / 2, yPos);
    yPos += 18;
    
    ctx.font = '10px "Tahoma", "Arial", sans-serif';
    ctx.fillStyle = '#8a8aaa';
    ctx.fillText(`طباعة بواسطة: ${this.USER}`, canvas.width / 2, yPos);
    yPos += 16;
    
    ctx.font = '9px "Tahoma", "Arial", sans-serif';
    ctx.fillStyle = '#aaaaaa';
    ctx.fillText('إيصال رسمي - يرجى الاحتفاظ به', canvas.width / 2, yPos);
    yPos += 18;

    // Bottom border
    this.drawBorder(ctx, 8, yPos, this.CANVAS_WIDTH - 16, 6, '#1a1a2e', 1);
    yPos += 10;

    // ==================== FINAL CANVAS ====================
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = this.CANVAS_WIDTH;
    finalCanvas.height = yPos + 6;
    const finalCtx = finalCanvas.getContext('2d', { willReadFrequently: true })!;
    finalCtx.fillStyle = '#FFFFFF';
    finalCtx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
    finalCtx.drawImage(canvas, 0, 0);
    
    return finalCanvas;
  }

  // ==================== BULK RECEIPT CANVAS ====================

  async createProfessionalBulkReceiptCanvas(data: BulkReceiptData): Promise<HTMLCanvasElement> {
    const canvas = document.createElement('canvas');
    canvas.width = this.CANVAS_WIDTH;
    canvas.height = 1500;
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#000000';
    ctx.direction = 'rtl';
    ctx.textBaseline = 'top';

    let yPos = 10;

    // ==================== HEADER ====================
    const schoolRaw = localStorage.getItem('school');
    let schoolName = 'مدرستي', schoolPhone = '', schoolAddress = '';
    try {
      if (schoolRaw) {
        const schoolObj = JSON.parse(schoolRaw);
        schoolName = schoolObj?.name || 'مدرستي';
        schoolPhone = schoolObj?.phone || '';
        schoolAddress = schoolObj?.address || '';
      }
    } catch (e) {
      schoolName = schoolRaw || 'مدرستي';
    }

    this.drawBorder(ctx, 8, 6, this.CANVAS_WIDTH - 16, 6, '#1a1a2e', 1.5);
    yPos += 10;

    ctx.textAlign = 'center';
    ctx.font = 'bold 26px "Tahoma", "Arial", sans-serif';
    ctx.fillStyle = '#1a1a2e';
    ctx.fillText(schoolName, canvas.width / 2, yPos);
    yPos += 34;

    if (schoolAddress) {
      ctx.font = '13px "Tahoma", "Arial", sans-serif';
      ctx.fillStyle = '#4a4a6a';
      ctx.fillText(schoolAddress, canvas.width / 2, yPos);
      yPos += 20;
    }

    if (schoolPhone) {
      ctx.font = '13px "Tahoma", "Arial", sans-serif';
      ctx.fillStyle = '#4a4a6a';
      ctx.fillText(`هاتف: ${schoolPhone}`, canvas.width / 2, yPos);
      yPos += 24;
    }

    this.drawDashedLine(ctx, 15, yPos, this.CANVAS_WIDTH - 30);
    yPos += 14;

    ctx.textAlign = 'center';
    ctx.font = 'bold 18px "Tahoma", "Arial", sans-serif';
    ctx.fillStyle = '#1a1a2e';
    ctx.fillText('إيصال دفع جماعي', canvas.width / 2, yPos);
    yPos += 28;

    // ==================== INFO ====================
    const infoBoxY = yPos;
    ctx.fillStyle = '#f5f7fa';
    this.drawRoundRect(ctx, 10, infoBoxY, this.CANVAS_WIDTH - 20, 88, 6);
    ctx.fill();
    
    const infoItems = [
      { label: 'رقم الإيصال:', value: data.receiptNumber },
      { label: 'التاريخ:', value: data.date },
      { label: 'عدد الدفعات:', value: data.paymentCount.toString() },
      { label: 'عدد الطلاب:', value: data.studentCount.toString() },
      { label: 'طريقة الدفع:', value: this.translatePaymentMethod(data.paymentMethod) }
    ];
    
    ctx.textAlign = 'right';
    let infoY = infoBoxY + 6;
    infoItems.forEach(item => {
      ctx.fillStyle = '#4a4a6a';
      ctx.font = 'bold 11px "Tahoma", "Arial", sans-serif';
      ctx.fillText(item.label, this.CANVAS_WIDTH - 20, infoY);
      ctx.fillStyle = '#1a1a2e';
      ctx.font = '11px "Tahoma", "Arial", sans-serif';
      ctx.fillText(item.value, this.CANVAS_WIDTH - 145, infoY);
      infoY += 16;
    });
    
    yPos = infoBoxY + 98;

    // ==================== PAYMENTS LIST ====================
    this.drawSection(ctx, 'تفاصيل الدفعات', yPos);
    yPos += 28;

    const tableX = 10;
    const tableWidth = this.CANVAS_WIDTH - 20;
    const tableY = yPos;
    
    ctx.fillStyle = '#1a1a2e';
    this.drawRoundRect(ctx, tableX, tableY, tableWidth, 22, 4);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 10px "Tahoma", "Arial", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('الطالب', tableX + tableWidth - 40, tableY + 5);
    ctx.textAlign = 'center';
    ctx.fillText('الشهر', tableX + tableWidth / 2, tableY + 5);
    ctx.textAlign = 'left';
    ctx.fillText('المبلغ', tableX + 12, tableY + 5);
    
    yPos += 26;

    let rowCount = 0;
    data.payments.forEach((payment) => {
      const bgColor = rowCount % 2 === 0 ? '#f8f9fa' : '#ffffff';
      ctx.fillStyle = bgColor;
      this.drawRoundRect(ctx, tableX, yPos, tableWidth, 22, 4);
      ctx.fill();
      
      ctx.fillStyle = '#1a1a2e';
      ctx.font = '11px "Tahoma", "Arial", sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(payment.studentName, tableX + tableWidth - 40, yPos + 5);
      ctx.textAlign = 'center';
      ctx.fillText(payment.month || '---', tableX + tableWidth / 2, yPos + 5);
      ctx.textAlign = 'left';
      ctx.fillText(this.formatAmount(payment.amount) + ' د.ج', tableX + 12, yPos + 5);
      
      yPos += 24;
      rowCount++;
    });

    yPos += 6;

    // ==================== TOTAL ====================
    this.drawLine(ctx, 10, yPos, this.CANVAS_WIDTH - 20, 1);
    yPos += 12;
    
    ctx.textAlign = 'right';
    ctx.font = 'bold 18px "Tahoma", "Arial", sans-serif';
    ctx.fillStyle = '#1a1a2e';
    ctx.fillText('الإجمالي:', this.CANVAS_WIDTH - 20, yPos);
    ctx.textAlign = 'left';
    ctx.font = 'bold 18px "Tahoma", "Arial", sans-serif';
    ctx.fillStyle = '#1a7a3a';
    ctx.fillText(this.formatAmount(data.totalAmount) + ' DZD', 12, yPos);
    yPos += 32;

    // ==================== QR CODE - حجم أكبر ====================
    const qrSize = 130; // ✅ حجم أكبر
    const qrX = (this.CANVAS_WIDTH - qrSize) / 2;
    const qrY = yPos;
    
    try {
      // ✅ استخدام _id للطالب الأول
      const firstStudentId = data.payments[0]?.studentId || '';
      const qrData = `${this.PLATFORM_URL}/${firstStudentId}`;
      const qrCanvas = document.createElement('canvas');
      await QRCode.toCanvas(qrCanvas, qrData, {
        width: qrSize,
        margin: 2,
        color: {
          dark: '#1a1a2e',
          light: '#FFFFFF'
        }
      });
      ctx.drawImage(qrCanvas, qrX, qrY);
      yPos += qrSize + 10;
      
      ctx.textAlign = 'center';
      ctx.font = '11px "Tahoma", "Arial", sans-serif';
      ctx.fillStyle = '#6a6a8a';
      ctx.fillText('امسح الكود للدخول للمنصة', canvas.width / 2, yPos);
      yPos += 22;
    } catch (error) {
      console.error('Error generating QR Code:', error);
      yPos += 10;
    }

    // ==================== FOOTER ====================
    this.drawLine(ctx, 10, yPos, this.CANVAS_WIDTH - 20, 1.5);
    yPos += 12;

    ctx.textAlign = 'center';
    ctx.font = 'bold 16px "Tahoma", "Arial", sans-serif';
    ctx.fillStyle = '#1a7a3a';
    ctx.fillText('شكراً لثقتكم بنا', canvas.width / 2, yPos);
    yPos += 26;
    
    ctx.font = '12px "Tahoma", "Arial", sans-serif';
    ctx.fillStyle = '#6a6a8a';
    ctx.fillText('نظام إدارة التعليم - Redox', canvas.width / 2, yPos);
    yPos += 18;
    
    ctx.font = '10px "Tahoma", "Arial", sans-serif';
    ctx.fillStyle = '#8a8aaa';
    ctx.fillText(`طباعة بواسطة: ${this.USER}`, canvas.width / 2, yPos);
    yPos += 16;
    
    ctx.font = '9px "Tahoma", "Arial", sans-serif';
    ctx.fillStyle = '#aaaaaa';
    ctx.fillText('إيصال رسمي - يرجى الاحتفاظ به', canvas.width / 2, yPos);
    yPos += 18;

    this.drawBorder(ctx, 8, yPos, this.CANVAS_WIDTH - 16, 6, '#1a1a2e', 1);
    yPos += 10;

    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = this.CANVAS_WIDTH;
    finalCanvas.height = yPos + 6;
    const finalCtx = finalCanvas.getContext('2d', { willReadFrequently: true })!;
    finalCtx.fillStyle = '#FFFFFF';
    finalCtx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
    finalCtx.drawImage(canvas, 0, 0);
    
    return finalCanvas;
  }

  // ==================== DRAWING HELPERS ====================

  private drawBorder(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, color: string, weight: number): void {
    ctx.strokeStyle = color;
    ctx.lineWidth = weight;
    this.drawRoundRect(ctx, x, y, width, height, 3);
    ctx.stroke();
  }

  private drawRoundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number): void {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  private drawLine(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, weight: number = 1): void {
    ctx.strokeStyle = '#d0d2d6';
    ctx.lineWidth = weight;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + width, y);
    ctx.stroke();
  }
  
  private drawDashedLine(ctx: CanvasRenderingContext2D, x: number, y: number, width: number): void {
    ctx.strokeStyle = '#d0d2d6';
    ctx.lineWidth = 0.5;
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + width, y);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  private drawSection(ctx: CanvasRenderingContext2D, text: string, y: number): void {
    const boxHeight = 22;
    ctx.fillStyle = '#1a1a2e';
    this.drawRoundRect(ctx, 10, y, this.CANVAS_WIDTH - 20, boxHeight, 4);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.font = 'bold 12px "Tahoma", "Arial", sans-serif';
    ctx.fillText(text, this.CANVAS_WIDTH / 2, y + 4);
  }

  // ==================== RASTER CONVERSION ====================

  private generateRasterCommand(canvas: HTMLCanvasElement): Uint8Array {
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    
    const bytesWidth = Math.ceil(canvas.width / 8);
    const height = canvas.height;
    
    const buffer = new Uint8Array(8 + (bytesWidth * height));
    
    buffer[0] = 0x1D;
    buffer[1] = 0x76;
    buffer[2] = 0x30;
    buffer[3] = 0x00;
    buffer[4] = bytesWidth & 0xFF;
    buffer[5] = (bytesWidth >> 8) & 0xFF;
    buffer[6] = height & 0xFF;
    buffer[7] = (height >> 8) & 0xFF;
    
    let offset = 8;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < bytesWidth; x++) {
        let byte = 0;
        for (let b = 0; b < 8; b++) {
          const pixelX = (x * 8) + b;
          if (pixelX < canvas.width) {
            const i = (y * canvas.width + pixelX) * 4;
            const r = pixels[i];
            const g = pixels[i + 1];
            const b_color = pixels[i + 2];
            const alpha = pixels[i + 3];
            
            const brightness = (r * 0.299 + g * 0.587 + b_color * 0.114);
            if (brightness < 200 && alpha > 128) {
              byte |= (1 << (7 - b));
            }
          }
        }
        buffer[offset++] = byte;
      }
    }
    return buffer;
  }

  // ==================== HELPERS ====================

  private translatePaymentMethod(method: string): string {
    const methods: { [key: string]: string } = {
      'cash': 'نقدي', 'bank': 'تحويل بنكي', 'card': 'بطاقة ائتمان',
      'check': 'شيك', 'online': 'دفع إلكتروني', 'mobile': 'دفع عبر الهاتف'
    };
    return methods[method.toLowerCase()] || method;
  }

  private formatAmount(amount: number): string {
    return new Intl.NumberFormat('en-US').format(amount);
  }

  private splitTextIntoLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, fontSize: number): string[] {
    ctx.font = `${fontSize}px "Tahoma", "Arial", sans-serif`;
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

  // ==================== COM PORTS ====================

  async getAvailableComPorts(): Promise<string[]> {
    try {
      if (!('serial' in navigator)) {
        return ['COM1', 'COM2', 'COM3', 'COM4', 'COM5'];
      }
      
      const ports = await navigator.serial.getPorts();
      if (ports.length === 0) {
        return ['COM1', 'COM2', 'COM3', 'COM4', 'COM5'];
      }
      
      const portNames: string[] = [];
      for (let i = 0; i < ports.length; i++) {
        try {
          const info = ports[i].getInfo();
          portNames.push(info?.usbProductId || `COM${i + 1}`);
        } catch (e) {
          portNames.push(`COM${i + 1}`);
        }
      }
      
      return portNames.length > 0 ? portNames : ['COM1', 'COM2', 'COM3', 'COM4', 'COM5'];
    } catch (error) {
      return ['COM1', 'COM2', 'COM3', 'COM4', 'COM5'];
    }
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