import { Component, OnInit, OnDestroy, ViewChild, ElementRef, HostListener } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment.development';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  
  // RFID scanning variables
  rfidBuffer: string = '';
  rfidTimer: any = null;
  isRFIDInputActive: boolean = false;
  rfidInputValue: string = '';
  rfidStatus: string = 'Waiting for card...';
  private apiUrl = environment.apiUrl;
  
  // Today's transactions data from API
  todaysData: any = null;
  isLoading: boolean = false;
  
  // Dashboard stats from API
  summary = {
    totalIncome: 0,
    totalExpenses: 0,
    totalTransactions: 0,
    paymentsCount: 0,
    feesCount: 0,
    expensesCount: 0,
    commissionsCount: 0
  };
  
  // Transactions list
  transactions: any[] = [];
  
  // School info
  schoolInfo: any = null;
  
  // Date info
  today = new Date();
  todayDateString: string;
  formattedDate: string = '';
  
  // Counts from API
  counts = {
    financialTransactions: 0,
    payments: 0,
    fees: 0,
    expenses: 0,
    commissions: 0
  };
  
  // For notifications
  notifications: any[] = [];

  // Reference to RFID input element
  @ViewChild('rfidInput') rfidInput!: ElementRef;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.todayDateString = this.today.toISOString().split('T')[0];
    this.formattedDate = this.today.toLocaleDateString('ar-EG', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  ngOnInit() {
    this.loadTodaysTransactions();
    this.startRFIDScanning();
  }

  ngOnDestroy() {
    this.stopRFIDScanning();
    this.cleanupRFIDListeners();
  }

  // Cleanup RFID listeners
  cleanupRFIDListeners() {
    if (this.rfidTimer) {
      clearTimeout(this.rfidTimer);
    }
  }

  // Get school ID from localStorage
  getSchoolId(): string | null {
    try {
      const schoolData = localStorage.getItem('school');
      if (schoolData) {
        const school = JSON.parse(schoolData);
        return school._id || null;
      }
      return null;
    } catch (e) {
      console.error('Error getting school from localStorage:', e);
      return null;
    }
  }

  // Get school info from localStorage
  getSchoolInfo(): any {
    try {
      const schoolData = localStorage.getItem('school');
      if (schoolData) {
        return JSON.parse(schoolData);
      }
      return null;
    } catch (e) {
      console.error('Error getting school info:', e);
      return null;
    }
  }

  // Load today's transactions from API
  loadTodaysTransactions() {
    const schoolId = this.getSchoolId();
    
    if (!schoolId) {
      console.error('No school ID found in localStorage');
      this.showNotification('error', 'لم يتم العثور على بيانات المدرسة');
      return;
    }

    this.isLoading = true;
    this.schoolInfo = this.getSchoolInfo();

    const url = `${this.apiUrl}/accounting/todays-transactions/${schoolId}`;
    
    this.http.get<any>(url)
      .pipe(
        catchError(error => {
          console.error('Error loading today\'s transactions:', error);
          this.showNotification('error', 'فشل تحميل معاملات اليوم');
          this.isLoading = false;
          return of(null);
        })
      )
      .subscribe({
        next: (data) => {
          this.isLoading = false;
          
          if (data && data.success) {
            this.todaysData = data;
            
            // Update summary
            this.summary = data.summary || {
              totalIncome: 0,
              totalExpenses: 0,
              totalTransactions: 0,
              paymentsCount: 0,
              feesCount: 0,
              expensesCount: 0,
              commissionsCount: 0
            };
            
            // Update transactions
            this.transactions = data.transactions || [];
            
            // Update counts
            this.counts = data.counts || {
              financialTransactions: 0,
              payments: 0,
              fees: 0,
              expenses: 0,
              commissions: 0
            };
            
            // Update formatted date if available
            if (data.date && data.date.formatted) {
              this.formattedDate = data.date.formatted;
            }
            
            // Update school info if available
            if (data.school) {
              this.schoolInfo = data.school;
            }
            
            console.log(`✅ Loaded ${this.transactions.length} transactions for today`);
          } else {
            this.showNotification('warning', 'لا توجد معاملات اليوم');
          }
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Error loading transactions:', err);
          this.showNotification('error', 'حدث خطأ أثناء تحميل البيانات');
        }
      });
  }

  // Get transaction icon based on type
  getTransactionIcon(transaction: any): string {
    if (transaction.icon) return transaction.icon;
    
    switch (transaction._type) {
      case 'payment': return 'fa-money-bill-wave';
      case 'registration_fee': return 'fa-file-invoice';
      case 'expense': return 'fa-receipt';
      case 'commission': return 'fa-user-graduate';
      case 'financial_transaction': return 'fa-exchange-alt';
      default: return 'fa-circle';
    }
  }

  // Get transaction label based on type
  getTransactionLabel(transaction: any): string {
    if (transaction.typeLabel) return transaction.typeLabel;
    
    switch (transaction._type) {
      case 'payment': return 'دفعة طالب';
      case 'registration_fee': return 'رسوم تسجيل';
      case 'expense': return 'مصروف';
      case 'commission': return 'عمولة أستاذ';
      case 'financial_transaction': return 'معاملة مالية';
      default: return 'معاملة';
    }
  }

  // Get transaction status color
  getTransactionStatusColor(transaction: any): string {
    if (transaction.status === 'paid') return 'text-success';
    if (transaction.status === 'pending') return 'text-warning';
    if (transaction.status === 'late') return 'text-danger';
    return 'text-secondary';
  }

  // Get transaction type color
  getTransactionTypeColor(transaction: any): string {
    if (transaction.type === 'income' || transaction._type === 'payment' || transaction._type === 'registration_fee') {
      return 'text-success';
    }
    if (transaction.type === 'expense' || transaction._type === 'expense' || transaction._type === 'commission') {
      return 'text-danger';
    }
    return 'text-primary';
  }

  // Format date for display
  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('ar-EG', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (e) {
      return dateStr;
    }
  }

  // Get student name from transaction
  getStudentName(transaction: any): string {
    if (transaction.student) {
      if (typeof transaction.student === 'object') {
        return transaction.student.name || 'غير معروف';
      }
      return transaction.student.name || 'غير معروف';
    }
    return 'غير معروف';
  }

  // Get transaction description
  getTransactionDescription(transaction: any): string {
    if (transaction.description) return transaction.description;
    if (transaction._type === 'payment') {
      return `دفعة من الطالب ${this.getStudentName(transaction)}`;
    }
    if (transaction._type === 'registration_fee') {
      return `رسوم تسجيل الطالب ${this.getStudentName(transaction)}`;
    }
    if (transaction._type === 'commission') {
      const teacherName = transaction.teacher?.name || 'غير معروف';
      return `عمولة الأستاذ ${teacherName}`;
    }
    return 'معاملة مالية';
  }

  // Load additional data (keep for compatibility)
  loadDashboardData() {
    this.loadTodaysTransactions();
  }

  // --- RFID Methods (kept from original) ---
  
  startRFIDScanning() {
    this.isScanning = true;
    this.rfidStatus = 'Waiting for card...';
    this.isRFIDInputActive = true;
    
    setTimeout(() => {
      if (this.rfidInput) {
        this.rfidInput.nativeElement.focus();
      }
    }, 100);
  }

  stopRFIDScanning() {
    this.isScanning = false;
    this.isRFIDInputActive = false;
    this.rfidBuffer = '';
    this.rfidInputValue = '';
    this.rfidStatus = 'Scanning stopped';
    
    if (this.rfidTimer) {
      clearTimeout(this.rfidTimer);
    }
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    if (!this.isRFIDInputActive || !this.isScanning) {
      return;
    }

    if ((event.target as HTMLElement).tagName === 'INPUT' || 
        (event.target as HTMLElement).tagName === 'TEXTAREA') {
      return;
    }

    if (this.rfidTimer) {
      clearTimeout(this.rfidTimer);
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      this.processRFIDInput();
      return;
    }

    if (event.key.length === 1 && !event.ctrlKey && !event.altKey && !event.metaKey) {
      this.rfidBuffer += event.key;
      this.rfidStatus = 'Reading...';
      this.rfidInputValue = this.rfidBuffer;
    }

    this.rfidTimer = setTimeout(() => {
      this.resetRFIDBuffer();
    }, 100);
  }

  processRFIDInput() {
    if (this.rfidBuffer.length === 0) {
      return;
    }

    const uid = this.rfidBuffer;
    console.log('RFID UID:', uid);
    this.rfidInputValue = uid;
    this.rfidStatus = 'Card read successfully ✔';
    this.processRFIDCard(uid);
    
    setTimeout(() => {
      this.resetRFIDBuffer();
    }, 2000);
  }

  resetRFIDBuffer() {
    this.rfidBuffer = '';
    this.rfidInputValue = '';
    this.rfidStatus = 'Waiting for card...';
    
    if (this.rfidTimer) {
      clearTimeout(this.rfidTimer);
      this.rfidTimer = null;
    }
  }

  focusRFIDField() {
    this.isRFIDInputActive = true;
    this.rfidStatus = 'Ready for scanning...';
  }

  blurRFIDField() {
    if (this.isScanning) {
      setTimeout(() => {
        if (this.rfidInput) {
          this.rfidInput.nativeElement.focus();
        }
      }, 50);
    }
  }

  private isProcessingRFID = false;

  processRFIDCard(uid: string) {
    if (this.isProcessingRFID) {
      return;
    }
    
    this.isProcessingRFID = true;
    
    this.http.get<any>(`${this.apiUrl}/cards/uid/${uid}`).subscribe({
      next: (data) => {
        if (data.student) {
          this.scannedStudent = data;
          this.showStudentCard(data);
          this.recordAttendance(data.student._id);
        } else {
          this.showUnknownCard(uid);
        }
        this.isProcessingRFID = false;
      },
      error: (err) => {
        console.error('Error processing RFID card:', err);
        this.showNotification('error', 'خطأ في معالجة البطاقة');
        this.rfidStatus = 'Error processing card';
        this.isProcessingRFID = false;
      }
    });
  }

  // Display student info when card is scanned
  showStudentCard(studentData: any) {
    this.showNotification('success', `تم اكتشاف الطالب: ${studentData.student.name}`);
    this.rfidStatus = `Student detected: ${studentData.student.name}`;
    
    setTimeout(() => {
      if (this.scannedStudent?.student?._id === studentData.student._id) {
        this.scannedStudent = null;
      }
    }, 10000);
  }

  showUnknownCard(uid: string) {
    this.showNotification('warning', `بطاقة غير معروفة: ${uid}`);
    this.rfidStatus = `Unknown card: ${uid}`;
  }

  recordAttendance(studentId: string) {
    const attendanceData = {
      studentId: studentId,
      status: 'present',
      timestamp: new Date()
    };

    this.http.post(`${environment.apiUrl}/attendance/record`, attendanceData).subscribe({
      next: (response) => {
        console.log('Attendance recorded:', response);
      },
      error: (err) => {
        console.error('Error recording attendance:', err);
      }
    });
  }

  // Variables for scanned student (keep from original)
  scannedStudent: any = null;
  isScanning = false;
  scanInterval: any;
  lateStudents: any[] = [];

  simulateRFIDScan() {
    const mockUID = 'RFID-' + Math.random().toString(36).substr(2, 9);
    console.log('Simulating RFID scan:', mockUID);
    this.processRFIDCard(mockUID);
  }

  startSimulatedScan() {
    this.stopRFIDScanning();
    this.isScanning = true;
    this.rfidStatus = 'Simulation mode active';
    
    this.scanInterval = setInterval(() => {
      this.simulateRFIDScan();
    }, 5000);
  }

  // Navigation and action methods
  goToStudentDetails(studentId: string) {
    this.router.navigate(['/home/students-management', studentId]);
  }

  payForClass(studentId: string, classId?: string) {
    this.router.navigate(['/home/payments-management'], {
      queryParams: { studentId, classId }
    });
  }

  // Notification system
  showNotification(type: 'success' | 'error' | 'warning', message: string) {
    const notification = {
      id: Date.now(),
      type,
      message,
      timestamp: new Date()
    };

    this.notifications.unshift(notification);
    
    setTimeout(() => {
      this.notifications = this.notifications.filter(n => n.id !== notification.id);
    }, 5000);
  }

  // Refresh data
  refreshData() {
    this.loadTodaysTransactions();
    this.showNotification('success', 'تم تحديث البيانات');
  }

  // Export daily report
  exportDailyReport() {
    const schoolId = this.getSchoolId();
    if (!schoolId) {
      this.showNotification('error', 'لم يتم العثور على بيانات المدرسة');
      return;
    }
    
    // Use the school-specific export endpoint
    this.http.get(`${this.apiUrl}/accounting/todays-transactions/${schoolId}`, { 
      responseType: 'json' 
    }).subscribe({
      next: (data: any) => {
        // Create a simple text report
        this.generateAndDownloadReport(data);
      },
      error: (err) => {
        console.error('Error exporting report:', err);
        this.showNotification('error', 'فشل تصدير التقرير');
      }
    });
  }

  // Generate and download simple report
  generateAndDownloadReport(data: any) {
    if (!data) {
      this.showNotification('error', 'لا توجد بيانات للتصدير');
      return;
    }

    try {
      const schoolName = data.school?.name || 'المدرسة';
      const date = data.date?.formatted || this.formattedDate;
      
      let reportContent = `تقرير معاملات اليوم\n`;
      reportContent += `================================\n`;
      reportContent += `المدرسة: ${schoolName}\n`;
      reportContent += `التاريخ: ${date}\n`;
      reportContent += `================================\n\n`;
      
      reportContent += `إحصائيات اليوم:\n`;
      reportContent += `─────────────────\n`;
      reportContent += `إجمالي الإيرادات: ${data.summary?.totalIncome || 0} د.ج\n`;
      reportContent += `إجمالي المصروفات: ${data.summary?.totalExpenses || 0} د.ج\n`;
      reportContent += `عدد المعاملات: ${data.summary?.totalTransactions || 0}\n`;
      reportContent += `مدفوعات الطلاب: ${data.counts?.payments || 0}\n`;
      reportContent += `رسوم تسجيل: ${data.counts?.fees || 0}\n`;
      reportContent += `مصروفات: ${data.counts?.expenses || 0}\n`;
      reportContent += `عمولات: ${data.counts?.commissions || 0}\n\n`;
      
      reportContent += `المعاملات:\n`;
      reportContent += `─────────────────\n`;
      
      if (data.transactions && data.transactions.length > 0) {
        data.transactions.forEach((t: any, index: number) => {
          const label = this.getTransactionLabel(t);
          const amount = t.amount || 0;
          const desc = this.getTransactionDescription(t);
          const student = this.getStudentName(t);
          const dateStr = this.formatDate(t.paymentDate || t.date || t.createdAt);
          
          reportContent += `${index + 1}. ${label}\n`;
          reportContent += `   المبلغ: ${amount} د.ج\n`;
          reportContent += `   الوصف: ${desc}\n`;
          reportContent += `   الطالب: ${student}\n`;
          reportContent += `   التاريخ: ${dateStr}\n`;
          reportContent += `   الحالة: ${t.status || 'مكتمل'}\n`;
          reportContent += `   ─────────────────\n`;
        });
      } else {
        reportContent += `لا توجد معاملات اليوم\n`;
      }
      
      reportContent += `\n================================\n`;
      reportContent += `تم إنشاء التقرير في: ${new Date().toLocaleString('ar-EG')}`;
      
      // Download as text file
      const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `تقرير-معاملات-${this.todayDateString}.txt`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      this.showNotification('success', 'تم تصدير التقرير بنجاح');
    } catch (err) {
      console.error('Error generating report:', err);
      this.showNotification('error', 'فشل إنشاء التقرير');
    }
  }

  // Clear RFID data
  clearRFIDData() {
    this.resetRFIDBuffer();
    this.scannedStudent = null;
    this.rfidStatus = 'Data cleared. Waiting for card...';
  }

  // Helper to get student name safely
  getStudentNameFromId(studentId: string): string {
    if (!studentId) return 'غير معروف';
    const transaction = this.transactions.find(t => 
      t.student && t.student._id === studentId
    );
    if (transaction && transaction.student) {
      return transaction.student.name || 'غير معروف';
    }
    return 'غير معروف';
  }

  // Helper to get class name
  getClassName(transaction: any): string {
    if (transaction.class) {
      if (typeof transaction.class === 'object') {
        return transaction.class.name || 'غير معروف';
      }
    }
    return 'غير محدد';
  }
}