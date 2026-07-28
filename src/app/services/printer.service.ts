// ==================== printer.service.ts - WebUSB with International Numbers ====================
import { Injectable, NgZone } from '@angular/core';
import Swal from 'sweetalert2';

declare const navigator: any;

// ==================== INTERFACES ====================
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
  private device: any = null;
  private interfaceNumber: number = 0;
  private endpointNumber: number | null = null;
  private isConnected: boolean = false;
  
  // إعدادات الطابعة للورق 80 مم
  private readonly CANVAS_WIDTH = 576;
  private readonly CANVAS_HEIGHT = 900;
  private readonly COMPANY_NAME = 'ROUAD AL-MAARIFA ACADEMY';
  private readonly DEVELOPER_NAME = 'REDOX';
  private readonly FOOTER_TEXT = 'We wish you a pleasant and useful educational experience';
  private readonly COMPANY_ADDRESS = 'Algeria, Touggourt';
  private readonly COMPANY_PHONE = '+213 673586274';

  constructor(private ngZone: NgZone) {
    window.addEventListener('beforeunload', () => {
      this.disconnect();
    });
  }

  /**
   * الاتصال بالطابعة الحرارية عبر WebUSB
   */
  async connectToThermalPrinter(): Promise<boolean> {
    try {
      if (!('usb' in navigator)) {
        throw new Error('WebUSB is not supported in this browser. Please use Chrome or Edge.');
      }

      let device;
      
      // 1. التحقق من الأجهزة المسجلة
      const pairedDevices = await navigator.usb.getDevices();
      
      if (pairedDevices.length > 0) {
        device = pairedDevices[0];
      } else {
        device = await navigator.usb.requestDevice({ 
          filters: [] 
        });
      }

      this.device = device;

      // 2. فتح الاتصال
      await device.open();
      if (device.configuration === null) {
        await device.selectConfiguration(1);
      }

      // 3. البحث عن منفذ الطباعة
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

      // كود احتياطي
      if (endpointNumber === null) {
        interfaceNumber = 0;
        endpointNumber = device.configuration.interfaces[0].alternates[0].endpoints
          .find((e: any) => e.direction === 'out').endpointNumber;
      }

      this.interfaceNumber = interfaceNumber;
      this.endpointNumber = endpointNumber;

      // 4. حجز المنفذ
      await device.claimInterface(interfaceNumber);

      // 5. تهيئة الطابعة
      await this.writeToPrinter(new Uint8Array([0x1B, 0x40]));

      this.isConnected = true;

      this.ngZone.run(() => {
        Swal.fire({
          icon: 'success',
          title: '✅ Connected',
          text: 'Thermal printer connected successfully via USB',
          timer: 1500,
          showConfirmButton: false
        });
      });

      console.log('✅ Printer connected successfully via WebUSB');
      return true;

    } catch (err: any) {
      console.error('❌ Connection error:', err);
      this.showConnectionError(err);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * كتابة بيانات إلى الطابعة
   */
  private async writeToPrinter(data: Uint8Array): Promise<void> {
    if (!this.device || this.endpointNumber === null) {
      throw new Error('Printer is not connected');
    }

    try {
      await this.device.transferOut(this.endpointNumber, data);
    } catch (error) {
      console.error('Error writing to printer:', error);
      throw error;
    }
  }

  /**
   * كتابة نص إلى الطابعة
   */
  private async writeText(text: string): Promise<void> {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    await this.writeToPrinter(data);
  }

  /**
   * قطع الاتصال
   */
  async disconnect(): Promise<void> {
    try {
      if (this.device) {
        if (this.interfaceNumber !== undefined) {
          await this.device.releaseInterface(this.interfaceNumber);
        }
        await this.device.close();
        this.device = null;
      }
      
      this.isConnected = false;
      console.log('Printer disconnected');
      
    } catch (err) {
      console.error('Disconnect error:', err);
    }
  }

  /**
   * التحقق من حالة الاتصال
   */
  checkConnectionStatus(): boolean {
    return this.isConnected && this.device !== null;
  }

  /**
   * الحصول على حالة الطابعة
   */
  getPrinterStatus(): any {
    return {
      isConnected: this.isConnected,
      device: this.device ? 'Connected' : 'Disconnected',
      interfaceNumber: this.interfaceNumber,
      endpointNumber: this.endpointNumber,
      timestamp: new Date().toLocaleString('en-US'),
      width: this.CANVAS_WIDTH,
      height: this.CANVAS_HEIGHT,
      academy: this.COMPANY_NAME,
      developer: this.DEVELOPER_NAME
    };
  }

  // ==================== PRINTING METHODS ====================

  /**
   * طباعة إيصال احترافي
   */
  async printProfessionalReceipt(data: ReceiptData): Promise<boolean> {
    if (!this.isConnected) {
      const connected = await this.connectToThermalPrinter();
      if (!connected) {
        this.showError('Failed to connect to printer');
        return false;
      }
    }

    try {
      this.showLoading('Printing...');

      await this.writeToPrinter(new Uint8Array([0x1B, 0x40]));

      const canvas = await this.createReceiptCanvas(data);
      const rasterData = this.canvasToRaster(canvas);
      
      await this.printRasterImage(rasterData, canvas);

      await this.writeToPrinter(new Uint8Array([0x1D, 0x56, 0x41, 0x03]));

      this.showSuccessToast('Receipt printed successfully');
      return true;

    } catch (err: any) {
      this.handleError(err);
      return false;
    }
  }

  /**
   * طباعة إيصال جماعي
   */
/**
 * طباعة إيصال جماعي - مع تحسين معالجة الأخطاء
 */
async printBulkReceipt(data: BulkReceiptData): Promise<boolean> {
  try {
    // ✅ التحقق من الاتصال
    if (!this.isConnected) {
      const connected = await this.connectToThermalPrinter();
      if (!connected) {
        console.warn('⚠️ فشل الاتصال بالطابعة، سيتم تخطي الطباعة');
        return false; // لا نرمي خطأ، فقط نرجع false
      }
    }

    // ✅ التحقق من وجود بيانات
    if (!data || !data.payments || data.payments.length === 0) {
      console.warn('⚠️ لا توجد بيانات للطباعة');
      return false;
    }

    this.showLoading('جاري طباعة الإيصال الجماعي...');

    await this.writeToPrinter(new Uint8Array([0x1B, 0x40]));

    const canvas = await this.createBulkReceiptCanvas(data);
    const rasterData = this.canvasToRaster(canvas);
    
    await this.printRasterImage(rasterData, canvas);

    await this.writeToPrinter(new Uint8Array([0x1D, 0x56, 0x41, 0x03]));

    this.showSuccessToast('تم طباعة الإيصال الجماعي بنجاح');
    return true;

  } catch (err: any) {
    console.error('❌ خطأ في طباعة الإيصال الجماعي:', err);
    // ✅ لا نعرض رسالة خطأ للمستخدم، فقط نسجل في الكونسول
    // هذا يمنع ظهور "فشل" في نتائج الدفع
    return false;
  }
}
  /**
   * طباعة نص بسيط (للاختبار)
   */
  async printSimpleText(text: string): Promise<boolean> {
    if (!this.isConnected) {
      const connected = await this.connectToThermalPrinter();
      if (!connected) {
        this.showError('Failed to connect to printer');
        return false;
      }
    }

    try {
      await this.writeToPrinter(new Uint8Array([0x1B, 0x40]));
      await this.writeText(text);
      await this.writeToPrinter(new Uint8Array([0x1D, 0x56, 0x41, 0x03]));
      
      this.showSuccessToast('Printed successfully');
      return true;
    } catch (err: any) {
      this.handleError(err);
      return false;
    }
  }

  // ==================== CANVAS CREATION ====================

  /**
   * إنشاء Canvas للإيصال الفردي - أرقام عالمية (0-9)
   */
  async createReceiptCanvas(data: ReceiptData): Promise<HTMLCanvasElement> {
    const canvas = document.createElement('canvas');
    canvas.width = this.CANVAS_WIDTH;
    canvas.height = this.CANVAS_HEIGHT;
    
    const ctx = canvas.getContext('2d')!;
    
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#000000';
    ctx.textBaseline = 'top';
    
    // Header
    ctx.textAlign = 'center';
    ctx.font = 'bold 28px "Arial", sans-serif';
    ctx.fillText('ROUAD AL-MAARIFA ACADEMY', canvas.width / 2, 10);
    
    ctx.font = '14px "Arial", sans-serif';
    ctx.fillText('Algeria, Touggourt', canvas.width / 2, 45);
    ctx.fillText('Phone: +213 673586274', canvas.width / 2, 65);
    
    this.drawDoubleLine(ctx, 10, 85, canvas.width - 20);
    
    let yPos = 105;
    
    ctx.textAlign = 'center';
    ctx.font = 'bold 20px "Arial", sans-serif';
    ctx.fillText('PAYMENT RECEIPT', canvas.width / 2, yPos);
    
    yPos += 30;
    this.drawSingleLine(ctx, 10, yPos, canvas.width - 20);
    yPos += 10;
    
    // Receipt Info - using international numbers (0-9)
    ctx.textAlign = 'right';
    ctx.font = '16px "Arial", sans-serif';
    
    const infoItems = [
      { label: 'Receipt No:', value: data.receiptNumber },
      { label: 'Date:', value: data.date },
      { label: 'Time:', value: data.time },
      { label: 'Payment Method:', value: this.translatePaymentMethod(data.paymentMethod) }
    ];
    
    infoItems.forEach(item => {
      ctx.fillText(`${item.label} ${item.value}`, canvas.width - 15, yPos);
      yPos += 25;
    });
    
    yPos += 10;
    this.drawSingleLine(ctx, 10, yPos, canvas.width - 20);
    yPos += 15;
    
    // Student Info
    ctx.font = 'bold 18px "Arial", sans-serif';
    ctx.fillText('Student Information', canvas.width - 15, yPos);
    yPos += 30;
    
    ctx.font = '16px "Arial", sans-serif';
    
    const studentInfo = [
      { label: 'Name:', value: data.studentName },
      { label: 'ID:', value: data.studentId },
      { label: 'Class:', value: data.className },
      { label: 'Level:', value: data.academicYear || 'N/A' },
      { label: 'Parent Phone:', value: data.parentPhone || 'N/A' }
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
    
    // Payment Details
    ctx.textAlign = 'center';
    ctx.font = 'bold 20px "Arial", sans-serif';
    ctx.fillText('Payment Details', canvas.width / 2, yPos);
    yPos += 35;
    
    // Table Header
    ctx.fillStyle = '#2C3E50';
    ctx.fillRect(15, yPos, canvas.width - 30, 35);
    
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'right';
    ctx.fillText('Item', canvas.width - 25, yPos + 10);
    ctx.textAlign = 'center';
    ctx.fillText('Amount (DZD)', canvas.width / 2, yPos + 10);
    ctx.textAlign = 'left';
    ctx.fillText('Qty', 30, yPos + 10);
    
    yPos += 35;
    
    // Data Row
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.strokeRect(15, yPos, canvas.width - 30, 35);
    
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'right';
    ctx.font = '16px "Arial", sans-serif';
    ctx.fillText(data.className, canvas.width - 25, yPos + 10);
    ctx.textAlign = 'center';
    ctx.fillText(this.formatAmount(data.amount), canvas.width / 2, yPos + 10);
    ctx.textAlign = 'left';
    ctx.fillText('1', 30, yPos + 10);
    
    yPos += 35;
    ctx.strokeRect(15, yPos, canvas.width - 30, 35);
    ctx.textAlign = 'right';
    ctx.fillText(`Period: ${data.month}`, canvas.width - 25, yPos + 10);
    
    yPos += 50;
    
    // Total
    this.drawSingleLine(ctx, 10, yPos, canvas.width - 20);
    yPos += 20;
    
    ctx.textAlign = 'center';
    ctx.font = 'bold 22px "Arial", sans-serif';
    ctx.fillStyle = '#000000';
    ctx.fillText('TOTAL AMOUNT:', canvas.width / 2, yPos);
    
    yPos += 50;
    this.drawSingleLine(ctx, 10, yPos, canvas.width - 20, '#FF0000');
    yPos += 30;
    
    ctx.font = 'bold 28px "Arial", sans-serif';
    ctx.fillStyle = '#E74C3C';
    ctx.fillText(`${this.formatAmount(data.amount)} DZD`, canvas.width / 2, yPos);
    
    yPos += 40;
    this.drawDecorationLine(ctx, 10, yPos, canvas.width - 20);
    yPos += 30;
    
    // Notes
    if (data.notes && data.notes.trim()) {
      ctx.textAlign = 'right';
      ctx.font = 'bold 16px "Arial", sans-serif';
      ctx.fillStyle = '#2C3E50';
      ctx.fillText('Notes:', canvas.width - 15, yPos);
      yPos += 25;
      
      ctx.font = '14px "Arial", sans-serif';
      ctx.fillStyle = '#000000';
      
      const lines = this.splitTextIntoLines(ctx, data.notes, canvas.width - 30, 14);
      lines.forEach((lineText: string) => {
        if (yPos < canvas.height - 150) {
          ctx.fillText(lineText.trim(), canvas.width - 15, yPos);
          yPos += 20;
        }
      });
    }
    
    // Footer
    ctx.textAlign = 'center';
    ctx.font = '14px "Arial", sans-serif';
    ctx.fillStyle = '#2C3E50';
    
    const footerItems = [
      'Education Management System',
      `Developed by: ${this.DEVELOPER_NAME}`,
      this.FOOTER_TEXT,
      'Official Receipt - Please keep for reference'
    ];
    
    let footerY = canvas.height - 110;
    footerItems.forEach(item => {
      ctx.fillText(item, canvas.width / 2, footerY);
      footerY += 22;
    });
    
    ctx.font = 'bold 16px "Arial", sans-serif';
    ctx.fillStyle = '#27AE60';
    ctx.fillText('Thank you for your trust', canvas.width / 2, canvas.height - 25);
    
    return canvas;
  }

  /**
   * إنشاء Canvas للإيصال الجماعي - أرقام عالمية (0-9)
   */
  async createBulkReceiptCanvas(data: BulkReceiptData): Promise<HTMLCanvasElement> {
    const paymentRowHeight = 35;
    const headerHeight = 380;
    const notesHeight = data.notes ? this.calculateNotesHeight(data.notes, this.CANVAS_WIDTH - 30, 14) : 0;
    const dynamicHeight = headerHeight + (data.payments.length * paymentRowHeight) + notesHeight + 150;
    
    const canvas = document.createElement('canvas');
    canvas.width = this.CANVAS_WIDTH;
    canvas.height = Math.max(dynamicHeight, 800);
    
    const ctx = canvas.getContext('2d')!;
    
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#000000';
    ctx.textBaseline = 'top';
    
    // Header
    ctx.textAlign = 'center';
    ctx.font = 'bold 28px "Arial", sans-serif';
    ctx.fillText('ROUAD AL-MAARIFA ACADEMY', canvas.width / 2, 10);
    
    ctx.font = '14px "Arial", sans-serif';
    ctx.fillText('Algeria, Touggourt', canvas.width / 2, 45);
    ctx.fillText('Phone: +213 673586274', canvas.width / 2, 65);
    
    this.drawDoubleLine(ctx, 10, 85, canvas.width - 20);
    
    let yPos = 105;
    
    ctx.textAlign = 'center';
    ctx.font = 'bold 22px "Arial", sans-serif';
    ctx.fillText('BULK PAYMENT RECEIPT', canvas.width / 2, yPos);
    
    yPos += 30;
    this.drawSingleLine(ctx, 10, yPos, canvas.width - 20);
    yPos += 10;
    
    // Info
    ctx.textAlign = 'right';
    ctx.font = '16px "Arial", sans-serif';
    
    const infoItems = [
      { label: 'Receipt No:', value: data.receiptNumber },
      { label: 'Date:', value: data.date },
      { label: 'Time:', value: data.time },
      { label: 'Payment Method:', value: this.translatePaymentMethod(data.paymentMethod) },
      { label: 'Number of Payments:', value: data.paymentCount.toString() },
      { label: 'Number of Students:', value: data.studentCount.toString() }
    ];
    
    infoItems.forEach(item => {
      ctx.fillText(`${item.label} ${item.value}`, canvas.width - 15, yPos);
      yPos += 25;
    });
    
    yPos += 10;
    this.drawDoubleLine(ctx, 10, yPos, canvas.width - 20);
    yPos += 20;
    
    // Payment Details Table
    ctx.textAlign = 'center';
    ctx.font = 'bold 20px "Arial", sans-serif';
    ctx.fillText('Payment Details', canvas.width / 2, yPos);
    yPos += 35;
    
    const columnWidths = {
      studentName: (canvas.width - 30) * 0.40,
      className: (canvas.width - 30) * 0.25,
      month: (canvas.width - 30) * 0.20,
      amount: (canvas.width - 30) * 0.15
    };
    
    // Table Header
    ctx.fillStyle = '#2C3E50';
    ctx.fillRect(15, yPos, canvas.width - 30, 35);
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 14px "Arial", sans-serif';
    
    let xPos = 20;
    ctx.textAlign = 'left';
    ctx.fillText('Month', xPos, yPos + 10);
    xPos += columnWidths.month;
    ctx.textAlign = 'center';
    ctx.fillText('Class', xPos + columnWidths.className / 2, yPos + 10);
    xPos += columnWidths.className;
    ctx.textAlign = 'center';
    ctx.fillText('Amount', xPos + columnWidths.amount / 2, yPos + 10);
    xPos += columnWidths.amount;
    ctx.textAlign = 'right';
    ctx.fillText('Student Name', canvas.width - 20, yPos + 10);
    
    yPos += 35;
    
    // Data Rows
    data.payments.forEach((payment, index) => {
      if (index % 2 === 0) {
        ctx.fillStyle = '#F8F9FA';
      } else {
        ctx.fillStyle = '#FFFFFF';
      }
      
      ctx.fillRect(15, yPos, canvas.width - 30, 35);
      
      ctx.fillStyle = '#000000';
      ctx.strokeStyle = '#DEE2E6';
      ctx.lineWidth = 1;
      ctx.strokeRect(15, yPos, canvas.width - 30, 35);
      
      let cellX = 20;
      ctx.textAlign = 'left';
      ctx.font = '14px "Arial", sans-serif';
      ctx.fillText(payment.month, cellX, yPos + 10);
      cellX += columnWidths.month;
      ctx.textAlign = 'center';
      ctx.fillText(payment.className, cellX + columnWidths.className / 2, yPos + 10);
      cellX += columnWidths.className;
      ctx.textAlign = 'center';
      ctx.fillText(this.formatAmount(payment.amount), cellX + columnWidths.amount / 2, yPos + 10);
      cellX += columnWidths.amount;
      ctx.textAlign = 'right';
      ctx.fillText(payment.studentName, canvas.width - 20, yPos + 10);
      
      yPos += 35;
    });
    
    yPos += 20;
    
    // Total
    this.drawSingleLine(ctx, 10, yPos, canvas.width - 20);
    yPos += 20;
    
    ctx.textAlign = 'center';
    ctx.font = 'bold 22px "Arial", sans-serif';
    ctx.fillStyle = '#000000';
    ctx.fillText('GRAND TOTAL:', canvas.width / 2, yPos);
    
    yPos += 50;
    this.drawSingleLine(ctx, 10, yPos, canvas.width - 20, '#FF0000');
    yPos += 30;
    
    ctx.font = 'bold 28px "Arial", sans-serif';
    ctx.fillStyle = '#E74C3C';
    ctx.fillText(`${this.formatAmount(data.totalAmount)} DZD`, canvas.width / 2, yPos);
    
    yPos += 40;
    
    // Notes
    if (data.notes && data.notes.trim()) {
      ctx.textAlign = 'right';
      ctx.font = 'bold 16px "Arial", sans-serif';
      ctx.fillStyle = '#2C3E50';
      ctx.fillText('Notes:', canvas.width - 15, yPos);
      yPos += 25;
      
      ctx.font = '14px "Arial", sans-serif';
      ctx.fillStyle = '#000000';
      const lines = this.splitTextIntoLines(ctx, data.notes, canvas.width - 30, 14);
      lines.forEach((lineText: string) => {
        if (yPos < canvas.height - 150) {
          ctx.fillText(lineText.trim(), canvas.width - 15, yPos);
          yPos += 20;
        }
      });
    }
    
    // Footer
    ctx.textAlign = 'center';
    ctx.font = '14px "Arial", sans-serif';
    ctx.fillStyle = '#2C3E50';
    
    const footerItems = [
      'Bulk Payment - Education Management System',
      `Developed by: ${this.DEVELOPER_NAME}`,
      'Official Receipt - Please keep for reference',
      `Payments: ${data.paymentCount} | Students: ${data.studentCount}`
    ];
    
    let footerY = canvas.height - 110;
    footerItems.forEach(item => {
      ctx.fillText(item, canvas.width / 2, footerY);
      footerY += 22;
    });
    
    ctx.font = 'bold 16px "Arial", sans-serif';
    ctx.fillStyle = '#27AE60';
    ctx.fillText('Thank you for your trust', canvas.width / 2, canvas.height - 25);
    
    return canvas;
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
        const red = data[i];
        const green = data[i + 1];
        const blue = data[i + 2];
        const gray = Math.floor((red * 0.3 + green * 0.59 + blue * 0.11));
        
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
   * طباعة الصورة النقطية
   */
  private async printRasterImage(rasterData: Uint8Array, canvas: HTMLCanvasElement): Promise<void> {
    if (!this.device || this.endpointNumber === null) {
      throw new Error('Printer is not connected');
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

    await this.writeToPrinter(new Uint8Array([0x1B, 0x40]));
    await this.writeToPrinter(new Uint8Array([0x1B, 0x33, 0x24]));
    await this.writeToPrinter(new Uint8Array([0x1D, 0x57, (this.CANVAS_WIDTH / 8) & 0xFF, 0x00]));
    await this.writeToPrinter(header);

    const CHUNK_SIZE = 1024;
    for (let i = 0; i < rasterData.length; i += CHUNK_SIZE) {
      const chunk = rasterData.slice(i, i + CHUNK_SIZE);
      await this.writeToPrinter(chunk);
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }

  // ==================== DRAWING HELPERS ====================

  private drawSingleLine(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, color: string = '#000000'): void {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + width, y);
    ctx.stroke();
  }
  
  private drawDoubleLine(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, color: string = '#000000'): void {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + width, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y + 2);
    ctx.lineTo(x + width, y + 2);
    ctx.stroke();
  }
  
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

  // ==================== FORMATTING HELPERS ====================

  /**
   * تنسيق المبلغ بالأرقام العالمية (0-9)
   */
  private formatAmount(amount: number): string {
    return amount.toLocaleString('en-US');
  }

  /**
   * ترجمة طريقة الدفع
   */
  private translatePaymentMethod(method: string): string {
    const methods: { [key: string]: string } = {
      'cash': 'Cash',
      'bank': 'Bank Transfer',
      'card': 'Credit Card',
      'check': 'Check',
      'online': 'Online Payment',
      'mobile': 'Mobile Payment'
    };
    return methods[method.toLowerCase()] || method;
  }

  /**
   * تقسيم النص إلى أسطر
   */
  private splitTextIntoLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, fontSize: number): string[] {
    ctx.font = `${fontSize}px "Arial", sans-serif`;
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

  /**
   * حساب ارتفاع الملاحظات
   */
  private calculateNotesHeight(notes: string, maxWidth: number, fontSize: number): number {
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d')!;
    tempCtx.font = `${fontSize}px "Arial", sans-serif`;
    const lines = this.splitTextIntoLines(tempCtx, notes, maxWidth, fontSize);
    return (lines.length * 20) + 40;
  }

  // ==================== UI HELPERS ====================

  private showConnectionError(err: any): void {
    let errorMessage = '❌ Connection error: ';
    if (err.message.includes('permission') || err.name === 'SecurityError') {
      errorMessage += 'Please grant permission to access the printer';
    } else if (err.message.includes('supported')) {
      errorMessage += 'WebUSB is not supported in this browser. Please use Chrome or Edge';
    } else if (err.message.includes('No device selected')) {
      errorMessage += 'No printer was selected';
    } else {
      errorMessage += err.message;
    }

    this.ngZone.run(() => {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: errorMessage,
        confirmButtonText: 'OK',
        footer: '<small>Make sure the printer is connected via USB and working properly</small>'
      });
    });
  }

  private showSuccessToast(message: string): void {
    this.ngZone.run(() => {
      Swal.fire({
        icon: 'success',
        title: '✅ Success',
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
    console.error('❌ Printer error:', err);
    this.ngZone.run(() => {
      Swal.fire({
        icon: 'error',
        title: '❌ Error',
        text: 'Printing error: ' + err.message,
        confirmButtonText: 'OK'
      });
    });
    this.isConnected = false;
  }

  private showError(message: string): void {
    this.ngZone.run(() => {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: message,
        confirmButtonText: 'OK'
      });
    });
  }
}