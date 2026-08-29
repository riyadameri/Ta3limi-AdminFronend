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

  // ==================== DESIGN SYSTEM ====================
  // Centralized palette + typography scale so the receipt reads as one
  // cohesive, professional document instead of a patchwork of styles.
  private readonly COLORS = {
    ink: '#0B1120',        // near-black navy — primary text / dark fills
    inkSoft: '#3A4256',    // secondary text
    muted: '#6B7280',      // tertiary / helper text
    hairline: '#C7CBD4',   // borders & rules
    panel: '#F3F5F8',      // light panel background
    accent: '#0F172A',     // dark accent bands
    success: '#0F6B34',    // total / confirmation green
    white: '#FFFFFF'
  };

  private readonly FONT = 'Tahoma, "Segoe UI", Arial, sans-serif';

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
  // Redesigned for maximum on-paper clarity: bigger type scale, generous
  // whitespace, a clean masthead, a bold "amount due" panel, and a framed
  // QR block. Layout is still driven by a running yPos so the final
  // canvas is trimmed exactly to content height.

  async createProfessionalReceiptCanvas(data: ReceiptData): Promise<HTMLCanvasElement> {
    const canvas = document.createElement('canvas');
    canvas.width = this.CANVAS_WIDTH;
    canvas.height = 1600;
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;

    ctx.fillStyle = this.COLORS.white;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = this.COLORS.ink;
    ctx.direction = 'rtl';
    ctx.textBaseline = 'top';

    const W = this.CANVAS_WIDTH;
    const MARGIN = 16;
    let yPos = 16;

    // ==================== MASTHEAD (double frame) ====================
    this.drawBorder(ctx, 6, 6, W - 12, 0, this.COLORS.ink, 2);       // outer frame (height set dynamically below)
    yPos += 16;

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

    ctx.textAlign = 'center';
    this.setFont(ctx, 30, 800);
    ctx.fillStyle = this.COLORS.ink;
    ctx.fillText(schoolName, W / 2, yPos);
    yPos += 40;

    if (schoolAddress) {
      this.setFont(ctx, 15, 400);
      ctx.fillStyle = this.COLORS.inkSoft;
      ctx.fillText(schoolAddress, W / 2, yPos);
      yPos += 22;
    }

    if (schoolPhone) {
      this.setFont(ctx, 15, 600);
      ctx.fillStyle = this.COLORS.inkSoft;
      ctx.fillText(`هاتف: ${schoolPhone}`, W / 2, yPos);
      yPos += 26;
    }

    yPos += 4;
    this.drawDashedLine(ctx, MARGIN, yPos, W - MARGIN * 2);
    yPos += 18;

    // ==================== DOCUMENT TITLE ====================
    ctx.textAlign = 'center';
    this.setFont(ctx, 24, 800);
    ctx.fillStyle = this.COLORS.ink;
    ctx.fillText('إيصــــال الدفع', W / 2, yPos);
    yPos += 30;

    // short accent underline beneath the title
    const accentW = 90;
    ctx.fillStyle = this.COLORS.ink;
    ctx.fillRect((W - accentW) / 2, yPos, accentW, 4);
    yPos += 22;

    // ==================== INFO PANEL ====================
    const infoRows = [
      { label: 'رقم الإيصال', value: data.receiptNumber || '---' },
      { label: 'التاريخ', value: data.date || new Date().toLocaleDateString('ar-EG') },
      { label: 'الوقت', value: data.time || new Date().toLocaleTimeString('en-US', { hour12: false }) },
      { label: 'طريقة الدفع', value: this.translatePaymentMethod(data.paymentMethod) }
    ];
    yPos = this.drawInfoPanel(ctx, infoRows, MARGIN, yPos, W - MARGIN * 2, 30);
    yPos += 22;

    // ==================== STUDENT INFO ====================
    yPos = this.drawSection(ctx, 'معلومات الطالب', yPos);
    yPos += 12;

    const studentInfo = [
      { label: 'الاسم', value: data.studentName },
      { label: 'الرقم', value: data.studentId },
      { label: 'المستوى', value: data.academicYear },
      { label: 'الحصة', value: data.className }
    ].filter(i => !!i.value);

    yPos = this.drawKeyValueList(ctx, studentInfo, MARGIN, yPos, W - MARGIN * 2, 15, 26);
    yPos += 16;

    // ==================== PAYMENT DETAILS TABLE ====================
    yPos = this.drawSection(ctx, 'تفاصيل الدفع', yPos);
    yPos += 12;

    const tableX = MARGIN;
    const tableWidth = W - MARGIN * 2;
    const rowH = 32;

    yPos = this.drawTableHeader(ctx, ['البيان', 'العدد', 'المبلغ'], tableX, yPos, tableWidth, rowH);

    yPos = this.drawTableRow(
      ctx,
      [data.className || 'رسوم', '1', this.formatAmount(data.amount) + ' د.ج'],
      tableX, yPos, tableWidth, rowH, 0
    );

    if (data.month) {
      this.setFont(ctx, 14, 500);
      ctx.fillStyle = this.COLORS.inkSoft;
      ctx.textAlign = 'right';
      ctx.fillText(`الشهر: ${data.month}`, W - MARGIN, yPos + 8);
      yPos += 30;
    }

    yPos += 8;

    // ==================== TOTAL — HIGHLIGHTED PANEL ====================
    yPos = this.drawTotalPanel(ctx, 'الإجمالي المستحق', this.formatAmount(data.amount) + ' DZD', MARGIN, yPos, W - MARGIN * 2);
    yPos += 22;

    // ==================== NOTES ====================
    if (data.notes && data.notes.trim()) {
      this.setFont(ctx, 14, 700);
      ctx.fillStyle = this.COLORS.inkSoft;
      ctx.textAlign = 'right';
      ctx.fillText('ملاحظات:', W - MARGIN, yPos);
      yPos += 22;
      this.setFont(ctx, 13, 400);
      ctx.fillStyle = this.COLORS.inkSoft;
      const lines = this.splitTextIntoLines(ctx, data.notes, W - MARGIN * 2, 13);
      lines.forEach(line => {
        ctx.fillText(line.trim(), W - MARGIN, yPos);
        yPos += 19;
      });
      yPos += 10;
    }

    // ==================== CREDENTIALS (if available) ====================
    if (data.username && data.password) {
      yPos = this.drawSection(ctx, 'بيانات تسجيل الدخول', yPos);
      yPos += 12;

      const credBoxY = yPos;
      const credBoxH = 66;
      ctx.fillStyle = this.COLORS.panel;
      this.drawRoundRect(ctx, MARGIN, credBoxY, W - MARGIN * 2, credBoxH, 8);
      ctx.fill();
      ctx.strokeStyle = this.COLORS.hairline;
      ctx.lineWidth = 1;
      this.drawRoundRect(ctx, MARGIN, credBoxY, W - MARGIN * 2, credBoxH, 8);
      ctx.stroke();

      ctx.textAlign = 'right';
      this.setFont(ctx, 15, 600);
      ctx.fillStyle = this.COLORS.ink;
      ctx.fillText(`اسم المستخدم: ${data.username}`, W - MARGIN - 14, credBoxY + 12);
      ctx.fillText(`كلمة المرور: ${data.password}`, W - MARGIN - 14, credBoxY + 38);

      yPos += credBoxH + 14;

      if (data.platformUrl) {
        ctx.textAlign = 'center';
        this.setFont(ctx, 13, 500);
        ctx.fillStyle = this.COLORS.inkSoft;
        ctx.fillText(`المنصة: ${data.platformUrl}`, W / 2, yPos);
        yPos += 24;
      }
    }

    // ==================== QR CODE — FRAMED ====================
    yPos = await this.drawQrBlock(
      ctx,
      `${this.PLATFORM_URL}/${data.studentObjectId || data.studentId || ''}`,
      W,
      yPos,
      'امسح الكود للدخول إلى المنصة'
    );

    // ==================== FOOTER ====================
    yPos = this.drawFooter(ctx, W, yPos);

    // Close the outer masthead frame now that total height is known
    this.drawBorder(ctx, 6, 6, W - 12, yPos - 2, this.COLORS.ink, 2);

    // ==================== FINAL TRIM ====================
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = W;
    finalCanvas.height = yPos + 10;
    const finalCtx = finalCanvas.getContext('2d', { willReadFrequently: true })!;
    finalCtx.fillStyle = this.COLORS.white;
    finalCtx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
    finalCtx.drawImage(canvas, 0, 0);

    return finalCanvas;
  }

  // ==================== PROFESSIONAL BULK RECEIPT CANVAS ====================

  async createProfessionalBulkReceiptCanvas(data: BulkReceiptData): Promise<HTMLCanvasElement> {
    const canvas = document.createElement('canvas');
    canvas.width = this.CANVAS_WIDTH;
    canvas.height = 1900;
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;

    ctx.fillStyle = this.COLORS.white;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = this.COLORS.ink;
    ctx.direction = 'rtl';
    ctx.textBaseline = 'top';

    const W = this.CANVAS_WIDTH;
    const MARGIN = 16;
    let yPos = 16;

    // ==================== MASTHEAD ====================
    this.drawBorder(ctx, 6, 6, W - 12, 0, this.COLORS.ink, 2);
    yPos += 16;

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

    ctx.textAlign = 'center';
    this.setFont(ctx, 30, 800);
    ctx.fillStyle = this.COLORS.ink;
    ctx.fillText(schoolName, W / 2, yPos);
    yPos += 40;

    if (schoolAddress) {
      this.setFont(ctx, 15, 400);
      ctx.fillStyle = this.COLORS.inkSoft;
      ctx.fillText(schoolAddress, W / 2, yPos);
      yPos += 22;
    }

    if (schoolPhone) {
      this.setFont(ctx, 15, 600);
      ctx.fillStyle = this.COLORS.inkSoft;
      ctx.fillText(`هاتف: ${schoolPhone}`, W / 2, yPos);
      yPos += 26;
    }

    yPos += 4;
    this.drawDashedLine(ctx, MARGIN, yPos, W - MARGIN * 2);
    yPos += 18;

    ctx.textAlign = 'center';
    this.setFont(ctx, 24, 800);
    ctx.fillStyle = this.COLORS.ink;
    ctx.fillText('إيصال دفع جماعي', W / 2, yPos);
    yPos += 30;

    const accentW = 90;
    ctx.fillStyle = this.COLORS.ink;
    ctx.fillRect((W - accentW) / 2, yPos, accentW, 4);
    yPos += 22;

    // ==================== INFO PANEL ====================
    const infoRows = [
      { label: 'رقم الإيصال', value: data.receiptNumber },
      { label: 'التاريخ', value: data.date },
      { label: 'عدد الدفعات', value: data.paymentCount.toString() },
      { label: 'عدد الطلاب', value: data.studentCount.toString() },
      { label: 'طريقة الدفع', value: this.translatePaymentMethod(data.paymentMethod) }
    ];
    yPos = this.drawInfoPanel(ctx, infoRows, MARGIN, yPos, W - MARGIN * 2, 28);
    yPos += 22;

    // ==================== PAYMENTS TABLE ====================
    yPos = this.drawSection(ctx, 'تفاصيل الدفعات', yPos);
    yPos += 12;

    const tableX = MARGIN;
    const tableWidth = W - MARGIN * 2;
    const rowH = 30;

    yPos = this.drawTableHeader(ctx, ['الطالب', 'الحصة', 'الشهر', 'المبلغ'], tableX, yPos, tableWidth, rowH);

    data.payments.forEach((payment, idx) => {
      yPos = this.drawTableRow(
        ctx,
        [
          payment.studentName || 'طالب',
          payment.className || 'غير محدد',
          payment.month || '---',
          this.formatAmount(payment.amount) + ' د.ج'
        ],
        tableX, yPos, tableWidth, rowH, idx
      );
    });

    yPos += 10;

    // ==================== TOTAL ====================
    yPos = this.drawTotalPanel(ctx, 'الإجمالي المستحق', this.formatAmount(data.totalAmount) + ' DZD', MARGIN, yPos, W - MARGIN * 2);
    yPos += 22;

    // ==================== QR CODE ====================
    const firstStudentId = data.payments[0]?.studentId || '';
    yPos = await this.drawQrBlock(
      ctx,
      `${this.PLATFORM_URL}/${firstStudentId}`,
      W,
      yPos,
      'امسح الكود للدخول إلى المنصة'
    );

    // ==================== FOOTER ====================
    yPos = this.drawFooter(ctx, W, yPos);

    this.drawBorder(ctx, 6, 6, W - 12, yPos - 2, this.COLORS.ink, 2);

    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = W;
    finalCanvas.height = yPos + 10;
    const finalCtx = finalCanvas.getContext('2d', { willReadFrequently: true })!;
    finalCtx.fillStyle = this.COLORS.white;
    finalCtx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
    finalCtx.drawImage(canvas, 0, 0);

    return finalCanvas;
  }

  // ==================== HIGH-LEVEL LAYOUT BLOCKS ====================

  /** Sets a consistent, bold, highly legible font at the given size/weight. */
  private setFont(ctx: CanvasRenderingContext2D, sizePx: number, weight: number): void {
    const w = weight >= 700 ? 'bold' : weight >= 600 ? '600' : 'normal';
    ctx.font = `${w} ${sizePx}px ${this.FONT}`;
  }

  /** Panel of label/value rows on a soft background — used for receipt meta info. */
  private drawInfoPanel(
    ctx: CanvasRenderingContext2D,
    rows: { label: string; value: string }[],
    x: number, y: number, width: number, rowHeight: number
  ): number {
    const height = rows.length * rowHeight + 16;
    ctx.fillStyle = this.COLORS.panel;
    this.drawRoundRect(ctx, x, y, width, height, 10);
    ctx.fill();
    ctx.strokeStyle = this.COLORS.hairline;
    ctx.lineWidth = 1;
    this.drawRoundRect(ctx, x, y, width, height, 10);
    ctx.stroke();

    let rowY = y + 10;
    rows.forEach(item => {
      ctx.textAlign = 'right';
      this.setFont(ctx, 14, 700);
      ctx.fillStyle = this.COLORS.inkSoft;
      ctx.fillText(item.label, x + width - 16, rowY);

      ctx.textAlign = 'left';
      this.setFont(ctx, 14, 600);
      ctx.fillStyle = this.COLORS.ink;
      ctx.fillText(item.value, x + 16, rowY);

      rowY += rowHeight;
    });

    return y + height;
  }

  /** Simple stacked label/value list (no background) — used for student info. */
  private drawKeyValueList(
    ctx: CanvasRenderingContext2D,
    rows: { label: string; value?: string }[],
    x: number, y: number, width: number, fontSize: number, rowHeight: number
  ): number {
    let rowY = y;
    ctx.textAlign = 'right';
    rows.forEach(item => {
      if (!item.value) return;
      this.setFont(ctx, fontSize, 700);
      ctx.fillStyle = this.COLORS.inkSoft;
      ctx.fillText(item.label + '  ', x + width, rowY);
      const labelWidth = ctx.measureText(item.label + '  ').width;

      this.setFont(ctx, fontSize, 500);
      ctx.fillStyle = this.COLORS.ink;
      ctx.fillText(item.value, x + width - labelWidth, rowY);

      rowY += rowHeight;
    });
    return rowY;
  }

  /** Dark, bold section divider bar — reads clearly even at a glance. */
  private drawSection(ctx: CanvasRenderingContext2D, text: string, y: number): number {
    const width = this.CANVAS_WIDTH - 32;
    const boxHeight = 30;
    ctx.fillStyle = this.COLORS.ink;
    this.drawRoundRect(ctx, 16, y, width, boxHeight, 6);
    ctx.fill();
    ctx.fillStyle = this.COLORS.white;
    ctx.textAlign = 'center';
    this.setFont(ctx, 15, 700);
    ctx.fillText(text, this.CANVAS_WIDTH / 2, y + 7);
    return y + boxHeight;
  }

  /** Dark table header row with evenly spaced, right-to-left columns. */
  private drawTableHeader(
    ctx: CanvasRenderingContext2D,
    columns: string[], x: number, y: number, width: number, rowHeight: number
  ): number {
    ctx.fillStyle = this.COLORS.ink;
    this.drawRoundRect(ctx, x, y, width, rowHeight, 6);
    ctx.fill();
    ctx.fillStyle = this.COLORS.white;
    this.setFont(ctx, 13, 700);
    this.drawColumns(ctx, columns, x, y + rowHeight / 2 - 8, width);
    return y + rowHeight + 4;
  }

  /** Zebra-striped data row aligned to the same column grid as the header. */
  private drawTableRow(
    ctx: CanvasRenderingContext2D,
    columns: string[], x: number, y: number, width: number, rowHeight: number, index: number
  ): number {
    ctx.fillStyle = index % 2 === 0 ? this.COLORS.panel : this.COLORS.white;
    this.drawRoundRect(ctx, x, y, width, rowHeight, 6);
    ctx.fill();
    ctx.fillStyle = this.COLORS.ink;
    this.setFont(ctx, 13, 500);
    this.drawColumns(ctx, columns, x, y + rowHeight / 2 - 8, width);
    return y + rowHeight + 4;
  }

  /**
   * Lays out 3 or 4 columns evenly across the table width, right-aligned
   * first column (the "label" column, read first in RTL) and remaining
   * columns centered/left as appropriate.
   */
  private drawColumns(ctx: CanvasRenderingContext2D, columns: string[], x: number, textY: number, width: number): void {
    const n = columns.length;
    if (n === 3) {
      ctx.textAlign = 'right';
      ctx.fillText(columns[0], x + width - 14, textY);
      ctx.textAlign = 'center';
      ctx.fillText(columns[1], x + width / 2, textY);
      ctx.textAlign = 'left';
      ctx.fillText(columns[2], x + 14, textY);
    } else {
      // 4 columns: name | class | month | amount
      const colWidth = width / n;
      ctx.textAlign = 'right';
      ctx.fillText(columns[0], x + width - 14, textY);
      ctx.textAlign = 'center';
      ctx.fillText(columns[1], x + width - colWidth * 1.5, textY);
      ctx.fillText(columns[2], x + width - colWidth * 2.5, textY);
      ctx.textAlign = 'left';
      ctx.fillText(columns[3], x + 14, textY);
    }
  }

  /** Bold, high-contrast "amount due" panel — the visual focal point of the receipt. */
  private drawTotalPanel(
    ctx: CanvasRenderingContext2D,
    label: string, value: string, x: number, y: number, width: number
  ): number {
    const height = 56;
    ctx.fillStyle = this.COLORS.ink;
    this.drawRoundRect(ctx, x, y, width, height, 10);
    ctx.fill();

    ctx.textAlign = 'right';
    this.setFont(ctx, 16, 700);
    ctx.fillStyle = this.COLORS.white;
    ctx.fillText(label, x + width - 18, y + 18);

    ctx.textAlign = 'left';
    this.setFont(ctx, 22, 800);
    ctx.fillStyle = this.COLORS.white;
    ctx.fillText(value, x + 18, y + 14);

    return y + height;
  }

  /** Framed, centered QR code with a caption underneath. */
  private async drawQrBlock(
    ctx: CanvasRenderingContext2D, qrData: string, canvasWidth: number, y: number, caption: string
  ): Promise<number> {
    const qrSize = 150;
    const framePadding = 14;
    const frameSize = qrSize + framePadding * 2;
    const frameX = (canvasWidth - frameSize) / 2;

    try {
      ctx.strokeStyle = this.COLORS.hairline;
      ctx.lineWidth = 1.5;
      this.drawRoundRect(ctx, frameX, y, frameSize, frameSize, 12);
      ctx.stroke();

      const qrCanvas = document.createElement('canvas');
      await QRCode.toCanvas(qrCanvas, qrData, {
        width: qrSize,
        margin: 1,
        color: { dark: this.COLORS.ink, light: this.COLORS.white }
      });

      ctx.drawImage(qrCanvas, frameX + framePadding, y + framePadding, qrSize, qrSize);

      const newY = y + frameSize + 14;
      ctx.textAlign = 'center';
      this.setFont(ctx, 13, 600);
      ctx.fillStyle = this.COLORS.inkSoft;
      ctx.fillText(caption, canvasWidth / 2, newY);
      return newY + 26;
    } catch (error) {
      console.error('Error generating QR Code:', error);
      return y + 10;
    }
  }

  /** Consistent footer: divider, thank-you line, system credit, printed-by, and legal note. */
  private drawFooter(ctx: CanvasRenderingContext2D, canvasWidth: number, y: number): number {
    let yPos = y;
    this.drawLine(ctx, 16, yPos, canvasWidth - 32, 2);
    yPos += 18;

    ctx.textAlign = 'center';
    this.setFont(ctx, 19, 800);
    ctx.fillStyle = this.COLORS.success;
    ctx.fillText('شكراً لثقتكم بنا', canvasWidth / 2, yPos);
    yPos += 30;

    this.setFont(ctx, 14, 500);
    ctx.fillStyle = this.COLORS.inkSoft;
    ctx.fillText('نظام إدارة التعليم — Redox', canvasWidth / 2, yPos);
    yPos += 22;

    this.setFont(ctx, 12, 500);
    ctx.fillStyle = this.COLORS.muted;
    ctx.fillText(`طباعة بواسطة: ${this.USER}`, canvasWidth / 2, yPos);
    yPos += 20;

    this.setFont(ctx, 11, 500);
    ctx.fillStyle = this.COLORS.muted;
    ctx.fillText('إيصال رسمي — يرجى الاحتفاظ به', canvasWidth / 2, yPos);
    yPos += 22;

    return yPos;
  }

  // ==================== DRAWING PRIMITIVES ====================

  private drawBorder(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, color: string, weight: number): void {
    ctx.strokeStyle = color;
    ctx.lineWidth = weight;
    this.drawRoundRect(ctx, x, y, width, height, 4);
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
    ctx.strokeStyle = this.COLORS.hairline;
    ctx.lineWidth = weight;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + width, y);
    ctx.stroke();
  }

  private drawDashedLine(ctx: CanvasRenderingContext2D, x: number, y: number, width: number): void {
    ctx.strokeStyle = this.COLORS.hairline;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 5]);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + width, y);
    ctx.stroke();
    ctx.setLineDash([]);
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
    this.setFont(ctx, fontSize, 400);
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