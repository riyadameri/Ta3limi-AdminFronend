import { Component, OnInit, OnDestroy, ViewChild, ElementRef, HostListener } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment.development';
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
  
  // الإحصائيات اليومية
  dailyStats = {
    income: 0,
    expenses: 0,
    profit: 0,
    totalClasses: 0
  };

  // الحصص المقررة اليوم
  todayClasses: any[] = [];
  
  // معلومات الطلاب المتأخرين في الدفع
  lateStudents: any[] = [];
  
  // الطلاب الحاليين (الحاضرين/الغائبين)
  currentStudents = {
    present: 0,
    absent: 0,
    late: []
  };

  // معلومات الطالب المكتشف بالـ RFID
  scannedStudent: any = null;
  isScanning = false;
  scanInterval: any;
  
  // تاريخ اليوم
  today = new Date();
  todayDateString: string;
  
  // للإشعارات
  notifications: any[] = [];

  // Reference to RFID input element
  @ViewChild('rfidInput') rfidInput!: ElementRef;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.todayDateString = this.today.toISOString().split('T')[0];
  }

  ngOnInit() {
    this.loadDashboardData();
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

  // تحميل جميع بيانات Dashboard
  loadDashboardData() {
    // Use the aggregated endpoint for dashboard stats
    this.http.get<any>(`${environment.apiUrl}/dashboard/daily-stats`).subscribe({
      next: (data) => {
        if (data.success) {
          this.dailyStats = data.dailyStats;
          this.currentStudents = data.currentStudents;
        }
      },
      error: (err) => {
        console.error('Error loading dashboard stats:', err);
      }
    });
  
    // Keep other endpoints as they are
    this.loadTodayClasses();
    this.loadLateStudents();
    this.loadNotifications();
  }
  
  sendPaymentReminder(student: any) {
    this.http.post(`${environment.apiUrl}/students/${student._id}/send-reminder`, {
      message: `عزيزي ولي أمر الطالب ${student.name}: لديك دفعات متأخرة بقيمة ${student.amountDue} دج. يرجى التواصل مع الإدارة.`
    }).subscribe({
      next: () => {
        this.showNotification('success', 'تم إرسال تذكير الدفع للطالب');
      },
      error: (err) => {
        console.error('Error sending reminder:', err);
        this.showNotification('error', 'فشل إرسال التذكير');
      }
    });
  }
  
  // 1. تحميل الإحصائيات اليومية
  loadDailyStats() {
    // إحصائيات الدخل اليومي
    this.http.get<any>(`${environment.apiUrl}/accounting/daily-income`).subscribe({
      next: (data) => {
        if (data.success) {
          this.dailyStats.income = data.dailyIncome || 0;
        }
      },
      error: (err) => {
        console.error('Error loading daily income:', err);
      }
    });

    // مصروفات اليوم
    this.http.get<any>(`${environment.apiUrl}/accounting/today-expenses`).subscribe({
      next: (data) => {
        this.dailyStats.expenses = data.total || 0;
        this.dailyStats.profit = this.dailyStats.income - this.dailyStats.expenses;
      },
      error: (err) => {
        console.error('Error loading today expenses:', err);
      }
    });

    // عدد الحصص اليوم
    this.http.get<any>(`${environment.apiUrl}/live-classes/today-count`).subscribe({
      next: (data) => {
        this.dailyStats.totalClasses = data.count || 0;
      },
      error: (err) => {
        console.error('Error loading today classes count:', err);
      }
    });
  }

  // 2. تحميل الحصص المقررة اليوم
  loadTodayClasses() {
    this.http.get<any[]>(`${environment.apiUrl}/live-classes/today`).subscribe({
      next: (classes) => {
        this.todayClasses = classes;
        
        // جدولة الحصص تلقائياً إذا لم تكن مجدولة
        classes.forEach(cls => {
          if (!cls.isScheduled) {
            this.scheduleClass(cls);
          }
        });
      },
      error: (err) => {
        console.error('Error loading today classes:', err);
      }
    });
  }

  // 3. تحميل الطلاب المتأخرين في الدفع
  loadLateStudents() {
    this.http.get<any[]>(`${environment.apiUrl}/students/late-payments`).subscribe({
      next: (students) => {
        this.lateStudents = students;
      },
      error: (err) => {
        console.error('Error loading late students:', err);
      }
    });
  }

  // 4. تحميل الطلاب الحاضرين والغائبين اليوم
  loadCurrentStudents() {
    this.http.get<any>(`${environment.apiUrl}/attendance/today-stats`).subscribe({
      next: (stats) => {
        this.currentStudents = stats;
      },
      error: (err) => {
        console.error('Error loading current students:', err);
      }
    });
  }

  // 5. تحميل الإشعارات
  loadNotifications() {
    this.http.get<any[]>(`${environment.apiUrl}/notifications`).subscribe({
      next: (notifications) => {
        this.notifications = notifications;
      },
      error: (err) => {
        console.error('Error loading notifications:', err);
      }
    });
  }

  // جدولة حصة
  scheduleClass(classInfo: any) {
    this.http.post(`${environment.apiUrl}/live-classes/schedule`, classInfo).subscribe({
      next: (response) => {
        console.log('Class scheduled:', response);
        this.showNotification('success', 'تم جدولة الحصة بنجاح');
      },
      error: (err) => {
        console.error('Error scheduling class:', err);
        this.showNotification('error', 'فشل جدولة الحصة');
      }
    });
  }

  // 6. نظام RFID - بدء المسح
  startRFIDScanning() {
    this.isScanning = true;
    this.rfidStatus = 'Waiting for card...';
    
    // تمكين الاستماع لأحداث لوحة المفاتيح
    this.isRFIDInputActive = true;
    
    // التركيز على حقل الإدخال تلقائياً
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

  // استمع لأحداث لوحة المفاتيح على مستوى المكون
  @HostListener('document:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    // تأكد من أن المسح مفعّل والمكون ليس في حالة إدخال نصية
    if (!this.isRFIDInputActive || !this.isScanning) {
      return;
    }

    // تجاهل أحداث لوحة المفاتيح إذا كان المستخدم في حقل إدخال
    if ((event.target as HTMLElement).tagName === 'INPUT' || 
        (event.target as HTMLElement).tagName === 'TEXTAREA') {
      return;
    }

    // إلغاء المؤقت القديم
    if (this.rfidTimer) {
      clearTimeout(this.rfidTimer);
    }

    // إذا كان المفتاح Enter، قم بمعالجة RFID
    if (event.key === 'Enter') {
      event.preventDefault();
      this.processRFIDInput();
      return;
    }

    // إذا كان المفتاح حرفاً واحداً، أضفه للـ buffer
    if (event.key.length === 1 && !event.ctrlKey && !event.altKey && !event.metaKey) {
      this.rfidBuffer += event.key;
      this.rfidStatus = 'Reading...';
      
      // تحديث عرض قيمة RFID
      this.rfidInputValue = this.rfidBuffer;
    }

    // ضبط مؤقت لمسح الـ buffer بعد وقت قصير
    this.rfidTimer = setTimeout(() => {
      this.resetRFIDBuffer();
    }, 100);
  }

  // معالجة إدخال RFID
  processRFIDInput() {
    if (this.rfidBuffer.length === 0) {
      return;
    }

    const uid = this.rfidBuffer;
    console.log('RFID UID:', uid);
    
    // عرض الـ UID في حقل الإدخال
    this.rfidInputValue = uid;
    this.rfidStatus = 'Card read successfully ✔';
    
    // معالجة البطاقة
    this.processRFIDCard(uid);
    
    // إعادة تعيين الـ buffer بعد المعالجة
    setTimeout(() => {
      this.resetRFIDBuffer();
    }, 2000);
  }

  // إعادة تعيين buffer RFID
  resetRFIDBuffer() {
    this.rfidBuffer = '';
    this.rfidInputValue = '';
    this.rfidStatus = 'Waiting for card...';
    
    if (this.rfidTimer) {
      clearTimeout(this.rfidTimer);
      this.rfidTimer = null;
    }
  }

  // تركيز/إلغاء تركيز حقل RFID
  focusRFIDField() {
    this.isRFIDInputActive = true;
    this.rfidStatus = 'Ready for scanning...';
  }

  blurRFIDField() {
    // لا تغير الحالة إذا كان المسح لا يزال نشطاً
    if (this.isScanning) {
      setTimeout(() => {
        if (this.rfidInput) {
          this.rfidInput.nativeElement.focus();
        }
      }, 50);
    }
  }

  // معالجة بطاقة RFID
  processRFIDCard(uid: string) {
    this.http.get<any>(`/api/cards/uid/${uid}`).subscribe({
      next: (data) => {
        if (data.student) {
          this.scannedStudent = data;
          this.showStudentCard(data);
          
          // تسجيل الحضور تلقائياً
          this.recordAttendance(data.student._id);
        } else {
          this.showUnknownCard(uid);
        }
      },
      error: (err) => {
        console.error('Error processing RFID card:', err);
        this.showNotification('error', 'خطأ في معالجة البطاقة');
        this.rfidStatus = 'Error processing card';
      }
    });
  }

  // عرض معلومات الطالب المكتشف
  showStudentCard(studentData: any) {
    this.showNotification('success', `تم اكتشاف الطالب: ${studentData.student.name}`);
    this.rfidStatus = `Student detected: ${studentData.student.name}`;
    
    // عرض معلومات الطالب لمدة 10 ثواني
    setTimeout(() => {
      if (this.scannedStudent?.student?._id === studentData.student._id) {
        this.scannedStudent = null;
      }
    }, 10000);
  }

  // عرض بطاقة غير معروفة
  showUnknownCard(uid: string) {
    this.showNotification('warning', `بطاقة غير معروفة: ${uid}`);
    this.rfidStatus = `Unknown card: ${uid}`;
  }

  // تسجيل الحضور تلقائياً
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

  // محاكاة اكتشاف طالب (لأغراض التطوير)
  simulateRFIDScan() {
    const mockUID = 'RFID-' + Math.random().toString(36).substr(2, 9);
    console.log('Simulating RFID scan:', mockUID);
    this.processRFIDCard(mockUID);
  }

  // بدء محاكاة RFID (للتجربة)
  startSimulatedScan() {
    this.stopRFIDScanning();
    this.isScanning = true;
    this.rfidStatus = 'Simulation mode active';
    
    // محاكاة قراءة بطاقة كل 5 ثواني
    this.scanInterval = setInterval(() => {
      this.simulateRFIDScan();
    }, 5000);
  }

  // الانتقال لتفاصيل الطالب
  goToStudentDetails(studentId: string) {
    this.router.navigate(['/home/students-management', studentId]);
  }

  // الدفع لحصة
  payForClass(studentId: string, classId?: string) {
    this.router.navigate(['/home/payments-management'], {
      queryParams: { studentId, classId }
    });
  }

  // إظهار الإشعارات
  showNotification(type: 'success' | 'error' | 'warning', message: string) {
    const notification = {
      id: Date.now(),
      type,
      message,
      timestamp: new Date()
    };

    this.notifications.unshift(notification);
    
    // إزالة الإشعار بعد 5 ثواني
    setTimeout(() => {
      this.notifications = this.notifications.filter(n => n.id !== notification.id);
    }, 5000);
  }

  // تحديث البيانات يدوياً
  refreshData() {
    this.loadDashboardData();
    this.showNotification('success', 'تم تحديث البيانات');
  }

  // تصدير تقرير اليوم
  exportDailyReport() {
    this.http.get(`/${environment.apiUrl}/accounting/export-daily-report`, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `daily-report-${this.todayDateString}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('Error exporting report:', err);
        this.showNotification('error', 'فشل تصدير التقرير');
      }
    });
  }

  // مسح بيانات RFID يدوياً
  clearRFIDData() {
    this.resetRFIDBuffer();
    this.scannedStudent = null;
    this.rfidStatus = 'Data cleared. Waiting for card...';
  }
}