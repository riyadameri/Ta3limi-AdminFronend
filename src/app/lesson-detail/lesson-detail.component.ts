import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { environment } from '../../environments/environment';

// --- واجهات البيانات ---
interface Student {
  _id: string;
  name: string;
  studentId: string;
  parentPhone: string;
  parentEmail: string;
  academicYear: string;
  status: string;
}

interface Payment {
  _id: string;
  student: Student | string;
  class?: {
    _id: string;
    name: string;
    subject: string;
    price: number;
    teacher?: { _id: string; name: string; };
  };
  amount: number;
  month: string;
  monthCode?: string;
  status: 'paid' | 'pending' | 'late';
  paymentDate?: Date;
  paymentMethod?: string;
  invoiceNumber?: string;
  notes?: string;
  createdAt?: Date;
}

interface Class {
  _id: string;
  name: string;
  subject: string;
  description?: string;
  academicYear: string;
  price: number;
  paymentSystem: 'monthly' | 'rounds';
  teacher?: { _id: string; name: string; phone?: string; email?: string; };
  schedule: Array<{ day: string; time: string; classroom?: { name: string; }; }>;
  students: Student[];
  createdAt: Date;
}

interface AttendanceRecord {
  student: {
    _id: string;
    name: string;
    studentId: string;
    academicYear: string;
  };
  totalClasses: number;
  present: number;
  absent: number;
  late: number;
  attendanceRate: number;
  records: Array<{
    liveClassId: string;
    date: Date;
    startTime: string;
    endTime: string;
    status: string;
    teacher?: string;
    joinedAt?: Date;
    leftAt?: Date;
  }>;
}

interface AttendanceStats {
  totalClasses: number;
  totalStudents: number;
  totalPresent: number;
  totalAbsent: number;
  totalLate: number;
  averageAttendance: number;
}

interface LiveClassDetail {
  _id: string;
  date: Date;
  startTime: string;
  endTime: string;
  teacher?: string;
  status: string;
  presentCount: number;
  absentCount: number;
  lateCount: number;
}

@Component({
  selector: 'app-lesson-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule
  ],
  template: `
    <div class="lesson-detail-container" dir="rtl">
      <!-- رأس الصفحة -->
      <div class="page-header">
        <div class="header-right">
          <button class="icon-btn back-btn" (click)="goBack()">
            <i class="fas fa-arrow-right"></i>
          </button>
          <div class="title-section">
            <h1>{{ lesson?.name || 'جاري التحميل...' }}</h1>
            <span class="subject-badge">{{ lesson?.subject }}</span>
          </div>
        </div>
        <div class="header-actions">
          <button class="action-btn secondary" (click)="openAddStudentPopup()">
            <i class="fas fa-user-plus"></i> إضافة طالب
          </button>
          <button class="action-btn primary" (click)="openAddPaymentPopup()">
            <i class="fas fa-money-bill-wave"></i> تسجيل دفع
          </button>
        </div>
      </div>

      <!-- بطاقات الإحصائيات -->
      <div class="stats-cards">
        <div class="stat-card">
          <div class="stat-icon blue-bg">
            <i class="fas fa-users"></i>
          </div>
          <div class="stat-info">
            <span class="stat-label">إجمالي الطلاب</span>
            <span class="stat-value">{{ statistics.totalStudents }}</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon green-bg">
            <i class="fas fa-check-circle"></i>
          </div>
          <div class="stat-info">
            <span class="stat-label">مدفوعات هذا الشهر</span>
            <span class="stat-value green-text">{{ formatPrice(getMonthPaidAmount()) }}</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon orange-bg">
            <i class="fas fa-clock"></i>
          </div>
          <div class="stat-info">
            <span class="stat-label">دفعات معلقة</span>
            <span class="stat-value orange-text">{{ formatPrice(getMonthPendingAmount()) }}</span>
          </div>
        </div>
      </div>

      <!-- تبويبات التنقل -->
      <div class="tabs-container">
        <button class="tab-btn" [class.active]="activeTab === 'overview'" (click)="setActiveTab('overview')">
          <i class="fas fa-info-circle"></i> نظرة عامة
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'students'" (click)="setActiveTab('students')">
          <i class="fas fa-user-graduate"></i> قائمة الطلاب
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'payments'" (click)="setActiveTab('payments')">
          <i class="fas fa-credit-card"></i> سجل المدفوعات
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'attendance'" (click)="loadAttendance(); setActiveTab('attendance')">
          <i class="fas fa-calendar-check"></i> سجل الغيابات
        </button>
      </div>

      <!-- محتوى التبويبات -->
      <div class="tab-content">
        <!-- تبويب نظرة عامة -->
        <div class="tab-pane" [class.active]="activeTab === 'overview'">
          <div class="info-grid">
            <div class="info-card">
              <h3><i class="fas fa-chalkboard-teacher"></i> تفاصيل الحصة</h3>
              <ul class="details-list">
                <li><span class="detail-label">الأستاذ:</span> <span class="detail-value">{{ lesson?.teacher?.name || 'غير محدد' }}</span></li>
                <li><span class="detail-label">السنة الدراسية:</span> <span class="detail-value">{{ lesson?.academicYear }}</span></li>
                <li><span class="detail-label">نظام الدفع:</span> <span class="detail-value">{{ getPaymentSystemText(lesson?.paymentSystem || '') }}</span></li>
                <li><span class="detail-label">سعر الحصة:</span> <span class="detail-value price">{{ formatPrice(lesson?.price || 0) }}</span></li>
              </ul>
            </div>
            <div class="info-card">
              <h3><i class="fas fa-calendar-alt"></i> الجدول الزمني</h3>
              <div class="schedule-list">
                <div *ngFor="let s of lesson?.schedule" class="schedule-item">
                  <span class="schedule-day">{{ s.day }}</span>
                  <span class="schedule-time">{{ s.time }}</span>
                  <span class="schedule-classroom">{{ s.classroom?.name || 'بدون قاعة' }}</span>
                </div>
                <div *ngIf="!lesson?.schedule?.length" class="empty-message">لا يوجد جدول زمني</div>
              </div>
            </div>
          </div>
        </div>

        <!-- تبويب قائمة الطلاب -->
        <div class="tab-pane" [class.active]="activeTab === 'students'">
          <div class="table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>اسم الطالب</th>
                  <th>كود الطالب</th>
                  <th>السنة الدراسية</th>
                  <th>حالة الدفع ({{ formatMonth(selectedMonth) }})</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let student of lesson?.students">
                  <td class="student-name">{{ student.name }}</td>
                  <td><span class="student-id">{{ student.studentId }}</span></td>
                  <td>{{ student.academicYear }}</td>
                  <td>
                    <span class="status-badge" [class]="getStatusClass(getStudentPaymentStatus(student._id))">
                      {{ getStatusText(getStudentPaymentStatus(student._id)) }}
                    </span>
                  </td>
                  <td>
                    <div class="action-buttons">
                      <button class="icon-btn small blue" (click)="openAddPaymentPopup(student)" title="تسجيل دفع">
                        <i class="fas fa-cash-register"></i>
                      </button>
                      <button class="icon-btn small red" (click)="removeStudent(student._id)" title="إزالة من الحصة">
                        <i class="fas fa-user-minus"></i>
                      </button>
                    </div>
              </td>
                </tr>
                <tr *ngIf="!lesson?.students?.length">
                  <td colspan="5" class="empty-table">لا يوجد طلاب مسجلين في هذه الحصة</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- تبويب سجل المدفوعات -->
        <div class="tab-pane" [class.active]="activeTab === 'payments'">
          <div class="filter-bar">
            <select [(ngModel)]="selectedMonth" (change)="applyMonthFilter()" class="filter-select">
              <option *ngFor="let m of quickMonths" [value]="m.value">{{ m.label }}</option>
            </select>
            
            <!-- ملخص المدفوعات -->
            <div class="payments-summary" *ngIf="filteredPayments.length">
              <span class="summary-item">
                <span class="summary-label">الإجمالي:</span>
                <span class="summary-value">{{ formatPrice(getTotalPaymentsAmount()) }}</span>
              </span>
              <span class="summary-item">
                <span class="summary-label">المدفوع:</span>
                <span class="summary-value green-text">{{ formatPrice(getTotalPaidAmount()) }}</span>
              </span>
              <span class="summary-item">
                <span class="summary-label">المعلق:</span>
                <span class="summary-value orange-text">{{ formatPrice(getTotalPendingAmount()) }}</span>
              </span>
            </div>
          </div>
          
          <div class="table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>الطالب</th>
                  <th>المبلغ</th>
                  <th>الشهر</th>
                  <th>تاريخ الدفع</th>
                  <th>الوسيلة</th>
                  <th>الحالة</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let p of paginatedPayments">
                  <td>{{ getStudentName(p.student) }}</td>
                  <td class="amount">{{ formatPrice(p.amount) }}</td>
                  <td>{{ p.month }}</td>
                  <td>{{ formatDate(p.paymentDate) }}</td>
                  <td>{{ getPaymentMethodText(p.paymentMethod) }}</td>
                  <td>
                    <span class="status-badge" [class]="getStatusClass(p.status)">
                      {{ getStatusText(p.status) }}
                    </span>
                  </td>
                  <td>
                    <div class="action-buttons">
                      <button class="icon-btn small green" (click)="printReceipt(p)" title="طباعة الإيصال">
                        <i class="fas fa-print"></i>
                      </button>
                      <button class="icon-btn small blue" (click)="editPayment(p)" title="تعديل المبلغ">
                        <i class="fas fa-edit"></i>
                      </button>
                      <button *ngIf="p.status === 'paid'" class="icon-btn small orange" (click)="openCancelPaymentPopup(p)" title="إلغاء الدفع">
                        <i class="fas fa-undo-alt"></i>
                      </button>
                      <button class="icon-btn small red" (click)="deletePayment(p)" title="حذف الدفعة">
                        <i class="fas fa-trash-alt"></i>
                      </button>
                    </div>
                  </td>
                </tr>
                <tr *ngIf="!filteredPayments.length">
                  <td colspan="7" class="empty-table">لا توجد مدفوعات مسجلة</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <!-- أزرار التنقل بين الصفحات للمدفوعات -->
          <div class="pagination" *ngIf="filteredPayments.length > itemsPerPage">
            <button class="page-btn" [disabled]="currentPage === 1" (click)="changePage(currentPage - 1)">
              <i class="fas fa-chevron-right"></i>
            </button>
            <span class="page-info">الصفحة {{ currentPage }} من {{ totalPages }}</span>
            <button class="page-btn" [disabled]="currentPage === totalPages" (click)="changePage(currentPage + 1)">
              <i class="fas fa-chevron-left"></i>
            </button>
          </div>
        </div>

        <!-- تبويب سجل الغيابات -->
        <div class="tab-pane" [class.active]="activeTab === 'attendance'">
          <!-- فلترة التاريخ -->
          <div class="filter-row">
            <div class="filter-group">
              <label>من تاريخ:</label>
              <input type="date" [(ngModel)]="attendanceFilter.startDate" class="filter-input" (change)="loadAttendance()">
            </div>
            <div class="filter-group">
              <label>إلى تاريخ:</label>
              <input type="date" [(ngModel)]="attendanceFilter.endDate" class="filter-input" (change)="loadAttendance()">
            </div>
            <button class="btn-secondary small" (click)="resetAttendanceFilter()">
              <i class="fas fa-redo-alt"></i> إعادة تعيين
            </button>
          </div>

          <!-- إحصائيات الغيابات -->
          <div class="attendance-stats" *ngIf="attendanceStats">
            <div class="stat-mini-card">
              <span class="stat-label">إجمالي الحصص</span>
              <span class="stat-value">{{ attendanceStats.totalClasses }}</span>
            </div>
            <div class="stat-mini-card">
              <span class="stat-label">نسبة الحضور</span>
              <span class="stat-value">{{ attendanceStats.averageAttendance }}%</span>
            </div>
            <div class="stat-mini-card present">
              <span class="stat-label">حضور</span>
              <span class="stat-value">{{ attendanceStats.totalPresent }}</span>
            </div>
            <div class="stat-mini-card absent">
              <span class="stat-label">غياب</span>
              <span class="stat-value">{{ attendanceStats.totalAbsent }}</span>
            </div>
            <div class="stat-mini-card late">
              <span class="stat-label">تأخير</span>
              <span class="stat-value">{{ attendanceStats.totalLate }}</span>
            </div>
          </div>

          <!-- جدول الغيابات -->
          <div class="table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>الطالب</th>
                  <th>كود الطالب</th>
                  <th>إجمالي الحصص</th>
                  <th>حضور</th>
                  <th>غياب</th>
                  <th>تأخير</th>
                  <th>نسبة الحضور</th>
                  <th>آخر حضور</th>
                  <th>التفاصيل</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let record of paginatedAttendance" [class.high-absent]="record.absent > record.totalClasses / 2">
                  <td class="student-name">{{ record.student.name }}</td>
                  <td><span class="student-id">{{ record.student.studentId }}</span></td>
                  <td>{{ record.totalClasses }}</td>
                  <td class="present-count">{{ record.present }}</td>
                  <td class="absent-count">{{ record.absent }}</td>
                  <td class="late-count">{{ record.late }}</td>
                  <td>
                    <div class="progress-container">
                      <div class="progress-bar" 
                           [style.width.%]="record.attendanceRate"
                           [class.good]="record.attendanceRate >= 75"
                           [class.warning]="record.attendanceRate >= 50 && record.attendanceRate < 75"
                           [class.bad]="record.attendanceRate < 50">
                        {{ record.attendanceRate }}%
                      </div>
                    </div>
                  </td>
                  <td>{{ getLastAttendanceDate(record) }}</td>
                  <td>
                    <button class="icon-btn small blue" (click)="showAttendanceDetails(record)" title="عرض التفاصيل">
                      <i class="fas fa-eye"></i>
                    </button>
                  </td>
                </tr>
                <tr *ngIf="!attendanceRecords.length">
                  <td colspan="9" class="empty-table">لا توجد بيانات غيابات متاحة</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- تفاصيل الحصص -->
          <div class="classes-timeline" *ngIf="attendanceClassesDetails?.length">
            <h4><i class="fas fa-history"></i> تفاصيل الحصص</h4>
            <div class="timeline-grid">
              <div *ngFor="let cls of attendanceClassesDetails" class="timeline-card">
                <div class="timeline-header">
                  <span class="timeline-date">{{ formatDate(cls.date) }}</span>
                  <span class="timeline-time">{{ cls.startTime }} - {{ cls.endTime }}</span>
                </div>
                <div class="timeline-body">
                  <div class="timeline-stat present">
                    <i class="fas fa-user-check"></i> {{ cls.presentCount }}
                  </div>
                  <div class="timeline-stat absent">
                    <i class="fas fa-user-times"></i> {{ cls.absentCount }}
                  </div>
                  <div class="timeline-stat late">
                    <i class="fas fa-user-clock"></i> {{ cls.lateCount }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- نافذة إضافة طالب -->
      <div class="popup-overlay" *ngIf="showAddStudentPopup" (click)="closeAddStudentPopup($event)">
        <div class="popup-container" (click)="$event.stopPropagation()">
          <div class="popup-header">
            <h3><i class="fas fa-user-plus"></i> إضافة طالب للحصة</h3>
            <button class="close-btn" (click)="closeAddStudentPopup()">&times;</button>
          </div>
          <div class="popup-body">
            <form [formGroup]="addStudentForm">
              <div class="form-group">
                <label>اختر الطالب</label>
                <select formControlName="studentId" class="form-control">
                  <option value="">-- اختر طالب من القائمة --</option>
                  <option *ngFor="let s of availableStudents" [value]="s._id">
                    {{ s.name }} ({{ s.studentId }}) - {{ s.academicYear }}
                  </option>
                </select>
              </div>
            </form>
          </div>
          <div class="popup-footer">
            <button class="btn-cancel" (click)="closeAddStudentPopup()">إلغاء</button>
            <button class="btn-save" (click)="enrollStudent()" [disabled]="addStudentForm.invalid">
              <i class="fas fa-check"></i> تأكيد الإضافة
            </button>
          </div>
        </div>
      </div>

      <!-- نافذة تسجيل دفع جديدة -->
      <div class="popup-overlay" *ngIf="showAddPaymentPopup" (click)="closeAddPaymentPopup($event)">
        <div class="popup-container" (click)="$event.stopPropagation()">
          <div class="popup-header">
            <h3><i class="fas fa-money-bill-wave"></i> تسجيل دفعة جديدة</h3>
            <button class="close-btn" (click)="closeAddPaymentPopup()">&times;</button>
          </div>
          <div class="popup-body">
            <form [formGroup]="paymentForm">
              <div class="form-group">
                <label>الطالب</label>
                <select formControlName="studentId" class="form-control">
                  <option value="">-- اختر الطالب --</option>
                  <option *ngFor="let s of lesson?.students" [value]="s._id">
                    {{ s.name }}
                  </option>
                </select>
              </div>
              <div class="form-row">
                <div class="form-group half">
                  <label>المبلغ (د.ج)</label>
                  <input type="number" formControlName="amount" class="form-control">
                </div>
                <div class="form-group half">
                  <label>الشهر</label>
                  <input type="month" formControlName="month" class="form-control">
                </div>
              </div>
              <div class="form-group">
                <label>طريقة الدفع</label>
                <select formControlName="paymentMethod" class="form-control">
                  <option value="cash">نقداً</option>
                  <option value="baridimob">بريدي موب</option>
                  <option value="bank">تحويل بنكي</option>
                </select>
              </div>
              <div class="form-group">
                <label>ملاحظات</label>
                <textarea formControlName="notes" class="form-control" rows="3"></textarea>
              </div>
            </form>
          </div>
          <div class="popup-footer">
            <button class="btn-cancel" (click)="closeAddPaymentPopup()">إلغاء</button>
            <button class="btn-save" (click)="processPayment()" [disabled]="paymentForm.invalid">
              <i class="fas fa-check"></i> تأكيد الدفع
            </button>
          </div>
        </div>
      </div>

      <!-- نافذة تعديل الدفعة -->
      <div class="popup-overlay" *ngIf="showEditPaymentPopup" (click)="closeEditPaymentPopup($event)">
        <div class="popup-container" (click)="$event.stopPropagation()">
          <div class="popup-header">
            <h3><i class="fas fa-edit"></i> تعديل الدفعة</h3>
            <button class="close-btn" (click)="closeEditPaymentPopup()">&times;</button>
          </div>
          <div class="popup-body">
            <form [formGroup]="editPaymentForm" *ngIf="selectedPayment">
              <div class="form-group">
                <label>الطالب</label>
                <input type="text" class="form-control" [value]="getStudentName(selectedPayment.student)" readonly disabled>
              </div>
              <div class="form-group">
                <label>الشهر</label>
                <input type="text" class="form-control" [value]="selectedPayment.month" readonly disabled>
              </div>
              <div class="form-group">
                <label>المبلغ (د.ج)</label>
                <input type="number" formControlName="amount" class="form-control">
              </div>
              <div class="form-group">
                <label>طريقة الدفع</label>
                <select formControlName="paymentMethod" class="form-control">
                  <option value="cash">نقداً</option>
                  <option value="baridimob">بريدي موب</option>
                  <option value="bank">تحويل بنكي</option>
                </select>
              </div>
              <div class="form-group">
                <label>الحالة</label>
                <select formControlName="status" class="form-control">
                  <option value="paid">مدفوع</option>
                  <option value="pending">معلق</option>
                  <option value="late">متأخر</option>
                </select>
              </div>
              <div class="form-group">
                <label>ملاحظات</label>
                <textarea formControlName="notes" class="form-control" rows="3"></textarea>
              </div>
            </form>
          </div>
          <div class="popup-footer">
            <button class="btn-cancel" (click)="closeEditPaymentPopup()">إلغاء</button>
            <button class="btn-save" (click)="updatePayment()" [disabled]="editPaymentForm.invalid">
              <i class="fas fa-save"></i> حفظ التعديلات
            </button>
          </div>
        </div>
      </div>

      <!-- نافذة إلغاء الدفع -->
      <div class="popup-overlay" *ngIf="showCancelPaymentPopup" (click)="closeCancelPaymentPopup($event)">
        <div class="popup-container" (click)="$event.stopPropagation()">
          <div class="popup-header warning">
            <h3><i class="fas fa-exclamation-triangle"></i> إلغاء الدفعة</h3>
            <button class="close-btn" (click)="closeCancelPaymentPopup()">&times;</button>
          </div>
          <div class="popup-body">
            <div class="warning-message">
              <i class="fas fa-info-circle"></i>
              <p>هل أنت متأكد من إلغاء هذه الدفعة؟ سيتم تغيير حالتها إلى "معلق" وإلغاء أي عمولات مرتبطة بها.</p>
            </div>
            <div class="payment-details" *ngIf="selectedPayment">
              <div class="detail-row">
                <span class="detail-label">الطالب:</span>
                <span class="detail-value">{{ getStudentName(selectedPayment.student) }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">المبلغ:</span>
                <span class="detail-value">{{ formatPrice(selectedPayment.amount) }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">الشهر:</span>
                <span class="detail-value">{{ selectedPayment.month }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">تاريخ الدفع:</span>
                <span class="detail-value">{{ formatDate(selectedPayment.paymentDate) }}</span>
              </div>
            </div>
            <div class="form-group">
              <label>سبب الإلغاء</label>
              <textarea [(ngModel)]="cancelReason" class="form-control" rows="3" placeholder="أدخل سبب الإلغاء..."></textarea>
            </div>
          </div>
          <div class="popup-footer">
            <button class="btn-cancel" (click)="closeCancelPaymentPopup()">تراجع</button>
            <button class="btn-danger" (click)="cancelPayment()">
              <i class="fas fa-undo-alt"></i> تأكيد الإلغاء
            </button>
          </div>
        </div>
      </div>

      <!-- نافذة تأكيد حذف الدفعة -->
      <div class="popup-overlay" *ngIf="showDeleteConfirmPopup" (click)="closeDeleteConfirmPopup($event)">
        <div class="popup-container" (click)="$event.stopPropagation()">
          <div class="popup-header danger">
            <h3><i class="fas fa-trash-alt"></i> حذف الدفعة</h3>
            <button class="close-btn" (click)="closeDeleteConfirmPopup()">&times;</button>
          </div>
          <div class="popup-body">
            <div class="warning-message">
              <i class="fas fa-exclamation-circle"></i>
              <p>هل أنت متأكد من حذف هذه الدفعة نهائياً؟ هذا الإجراء لا يمكن التراجع عنه.</p>
            </div>
            <div class="payment-details" *ngIf="selectedPayment">
              <div class="detail-row">
                <span class="detail-label">الطالب:</span>
                <span class="detail-value">{{ getStudentName(selectedPayment.student) }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">المبلغ:</span>
                <span class="detail-value">{{ formatPrice(selectedPayment.amount) }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">الشهر:</span>
                <span class="detail-value">{{ selectedPayment.month }}</span>
              </div>
            </div>
          </div>
          <div class="popup-footer">
            <button class="btn-cancel" (click)="closeDeleteConfirmPopup()">إلغاء</button>
            <button class="btn-danger" (click)="confirmDeletePayment()">
              <i class="fas fa-trash-alt"></i> تأكيد الحذف
            </button>
          </div>
        </div>
      </div>

      <!-- نافذة تفاصيل الغياب -->
      <div class="popup-overlay" *ngIf="showAttendanceDetailsPopup" (click)="closeAttendanceDetailsPopup($event)">
        <div class="popup-container large" (click)="$event.stopPropagation()">
          <div class="popup-header">
            <h3><i class="fas fa-calendar-alt"></i> تفاصيل الغيابات</h3>
            <button class="close-btn" (click)="closeAttendanceDetailsPopup()">&times;</button>
          </div>
          <div class="popup-body">
            <div class="student-info" *ngIf="selectedAttendanceRecord">
              <div class="student-avatar">
                {{ selectedAttendanceRecord.student.name.charAt(0) }}
              </div>
              <div class="student-details">
                <h4>{{ selectedAttendanceRecord.student.name }}</h4>
                <p>كود الطالب: {{ selectedAttendanceRecord.student.studentId }}</p>
                <p>السنة الدراسية: {{ selectedAttendanceRecord.student.academicYear }}</p>
              </div>
            </div>

            <div class="attendance-summary" *ngIf="selectedAttendanceRecord">
              <div class="summary-item">
                <span class="label">إجمالي الحصص</span>
                <span class="value">{{ selectedAttendanceRecord.totalClasses }}</span>
              </div>
              <div class="summary-item present">
                <span class="label">حضور</span>
                <span class="value">{{ selectedAttendanceRecord.present }}</span>
              </div>
              <div class="summary-item absent">
                <span class="label">غياب</span>
                <span class="value">{{ selectedAttendanceRecord.absent }}</span>
              </div>
              <div class="summary-item late">
                <span class="label">تأخير</span>
                <span class="value">{{ selectedAttendanceRecord.late }}</span>
              </div>
            </div>

            <div class="table-wrapper">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>التاريخ</th>
                    <th>الوقت</th>
                    <th>الحالة</th>
                    <th>الأستاذ</th>
                    <th>وقت التسجيل</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let rec of selectedAttendanceRecord?.records">
                    <td>{{ formatDate(rec.date) }}</td>
                    <td>{{ rec.startTime }} - {{ rec.endTime }}</td>
                    <td>
                      <span class="status-badge" [class]="'attendance-' + rec.status">
                        {{ getAttendanceStatusText(rec.status) }}
                      </span>
                    </td>
                    <td>{{ rec.teacher || 'غير محدد' }}</td>
                    <td>{{ rec.joinedAt ? formatDateTime(rec.joinedAt) : '---' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div class="popup-footer">
            <button class="btn-cancel" (click)="closeAttendanceDetailsPopup()">إغلاق</button>
          </div>
        </div>
      </div>

      <!-- نافذة التحميل -->
      <div class="loading-overlay" *ngIf="loading">
        <div class="spinner"></div>
      </div>

      <!-- إشعارات -->
      <div class="toast success" *ngIf="successMessage">
        <i class="fas fa-check-circle"></i> {{ successMessage }}
      </div>
      <div class="toast error" *ngIf="errorMessage">
        <i class="fas fa-exclamation-circle"></i> {{ errorMessage }}
      </div>
    </div>
  `,
  styles: [`
    /* ========== المتغيرات الأساسية ========== */
    :host {
      --primary-color: #4361ee;
      --primary-dark: #3a56d4;
      --primary-light: #eef2ff;
      --secondary-color: #7209b7;
      --success-color: #10b981;
      --danger-color: #ef4444;
      --warning-color: #f59e0b;
      --info-color: #3b82f6;
      --text-dark: #1e293b;
      --text-medium: #475569;
      --text-light: #64748b;
      --bg-color: #f8fafc;
      --card-bg: #ffffff;
      --border-color: #e2e8f0;
      --shadow-sm: 0 1px 3px rgba(0,0,0,0.1);
      --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.1);
      --shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.1);
      --radius-sm: 6px;
      --radius-md: 10px;
      --radius-lg: 16px;
      --transition: all 0.2s ease;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    /* ========== الحاوية الرئيسية ========== */
    .lesson-detail-container {
      background: var(--bg-color);
      min-height: 100vh;
      padding: 24px;
      font-family: 'Tajawal', 'Segoe UI', sans-serif;
      color: var(--text-dark);
      direction: rtl;
    }

    /* ========== رأس الصفحة ========== */
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 16px;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .back-btn {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      color: var(--primary-color);
      font-size: 1.2rem;
      box-shadow: var(--shadow-sm);
      cursor: pointer;
      transition: var(--transition);
    }

    .back-btn:hover {
      background: var(--primary-light);
      transform: translateX(-3px);
    }

    .title-section {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .title-section h1 {
      font-size: 1.8rem;
      font-weight: 600;
      margin: 0;
      color: var(--text-dark);
    }

    .subject-badge {
      background: var(--primary-light);
      color: var(--primary-color);
      padding: 6px 14px;
      border-radius: 30px;
      font-size: 0.9rem;
      font-weight: 600;
      border: 1px solid rgba(67, 97, 238, 0.2);
    }

    .header-actions {
      display: flex;
      gap: 10px;
    }

    .action-btn {
      padding: 10px 20px;
      border-radius: var(--radius-md);
      border: none;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      transition: var(--transition);
      font-size: 0.95rem;
    }

    .action-btn.primary {
      background: var(--primary-color);
      color: white;
    }

    .action-btn.primary:hover {
      background: var(--primary-dark);
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }

    .action-btn.secondary {
      background: var(--card-bg);
      color: var(--text-dark);
      border: 1px solid var(--border-color);
    }

    .action-btn.secondary:hover {
      background: #f1f5f9;
      transform: translateY(-2px);
      box-shadow: var(--shadow-sm);
    }

    .icon-btn {
      width: 36px;
      height: 36px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-color);
      background: var(--card-bg);
      color: var(--text-medium);
      cursor: pointer;
      transition: var(--transition);
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .icon-btn.small {
      width: 32px;
      height: 32px;
    }

    .icon-btn:hover {
      background: var(--primary-light);
      color: var(--primary-color);
      border-color: var(--primary-color);
    }

    .icon-btn.blue:hover {
      background: var(--primary-light);
      color: var(--primary-color);
      border-color: var(--primary-color);
    }

    .icon-btn.red:hover {
      background: #fee2e2;
      color: var(--danger-color);
      border-color: var(--danger-color);
    }

    .icon-btn.green:hover {
      background: #d1fae5;
      color: var(--success-color);
      border-color: var(--success-color);
    }

    .icon-btn.orange:hover {
      background: #ffedd5;
      color: var(--warning-color);
      border-color: var(--warning-color);
    }

    /* ========== بطاقات الإحصائيات ========== */
    .stats-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }

    .stat-card {
      background: var(--card-bg);
      border-radius: var(--radius-lg);
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      box-shadow: var(--shadow-sm);
      border: 1px solid var(--border-color);
      transition: var(--transition);
    }

    .stat-card:hover {
      box-shadow: var(--shadow-md);
      transform: translateY(-2px);
    }

    .stat-icon {
      width: 54px;
      height: 54px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
    }

    .stat-icon.blue-bg {
      background: #e0f2fe;
      color: #0284c7;
    }

    .stat-icon.green-bg {
      background: #d1fae5;
      color: var(--success-color);
    }

    .stat-icon.orange-bg {
      background: #ffedd5;
      color: var(--warning-color);
    }

    .stat-info {
      flex: 1;
    }

    .stat-label {
      display: block;
      font-size: 0.9rem;
      color: var(--text-light);
      margin-bottom: 4px;
    }

    .stat-value {
      display: block;
      font-size: 1.6rem;
      font-weight: 700;
      color: var(--text-dark);
      line-height: 1.2;
    }

    .green-text {
      color: var(--success-color) !important;
    }

    .orange-text {
      color: var(--warning-color) !important;
    }

    /* ========== التبويبات ========== */
    .tabs-container {
      display: flex;
      gap: 5px;
      margin-bottom: 0;
      background: var(--card-bg);
      padding: 0 20px;
      border-radius: var(--radius-lg) var(--radius-lg) 0 0;
      border-bottom: 1px solid var(--border-color);
      flex-wrap: wrap;
    }

    .tab-btn {
      padding: 14px 24px;
      background: transparent;
      border: none;
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-light);
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      border-bottom: 3px solid transparent;
      transition: var(--transition);
    }

    .tab-btn:hover {
      color: var(--primary-color);
      background: var(--primary-light);
    }

    .tab-btn.active {
      color: var(--primary-color);
      border-bottom-color: var(--primary-color);
      background: linear-gradient(to bottom, var(--primary-light), transparent);
    }

    .tab-content {
      background: var(--card-bg);
      border-radius: 0 0 var(--radius-lg) var(--radius-lg);
      padding: 24px;
      box-shadow: var(--shadow-sm);
      border: 1px solid var(--border-color);
      border-top: none;
      min-height: 500px;
    }

    .tab-pane {
      display: none;
    }

    .tab-pane.active {
      display: block;
      animation: fadeIn 0.3s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* ========== بطاقات المعلومات ========== */
    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
    }

    .info-card {
      background: var(--card-bg);
      border-radius: var(--radius-lg);
      padding: 20px;
      border: 1px solid var(--border-color);
    }

    .info-card h3 {
      font-size: 1.2rem;
      margin-bottom: 20px;
      color: var(--text-dark);
      display: flex;
      align-items: center;
      gap: 10px;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 12px;
    }

    .details-list {
      list-style: none;
    }

    .details-list li {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px dashed var(--border-color);
    }

    .details-list li:last-child {
      border-bottom: none;
    }

    .detail-label {
      color: var(--text-light);
      font-weight: 500;
    }

    .detail-value {
      font-weight: 600;
      color: var(--text-dark);
    }

    .detail-value.price {
      color: var(--primary-color);
      font-size: 1.1rem;
    }

    .schedule-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .schedule-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px;
      background: var(--bg-color);
      border-radius: var(--radius-sm);
    }

    .schedule-day {
      background: var(--primary-color);
      color: white;
      padding: 4px 10px;
      border-radius: var(--radius-sm);
      font-size: 0.85rem;
      font-weight: 600;
    }

    .schedule-time {
      font-weight: 600;
      color: var(--text-dark);
    }

    .schedule-classroom {
      color: var(--text-light);
      font-size: 0.9rem;
    }

    .empty-message {
      text-align: center;
      color: var(--text-light);
      padding: 20px;
    }

    /* ========== الجداول ========== */
    .table-wrapper {
      overflow-x: auto;
      margin: 20px 0;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      text-align: right;
      font-size: 0.95rem;
    }

    .data-table th {
      background: #f1f5f9;
      padding: 14px 12px;
      font-weight: 600;
      color: var(--text-medium);
      border-bottom: 2px solid var(--border-color);
    }

    .data-table td {
      padding: 12px;
      border-bottom: 1px solid var(--border-color);
      color: var(--text-dark);
    }

    .data-table tbody tr:hover {
      background: var(--primary-light);
    }

    .student-name {
      font-weight: 600;
    }

    .student-id {
      font-family: monospace;
      background: #f1f5f9;
      padding: 4px 8px;
      border-radius: var(--radius-sm);
      font-size: 0.9rem;
    }

    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 30px;
      font-size: 0.85rem;
      font-weight: 600;
    }

    .status-badge.paid {
      background: #d1fae5;
      color: #065f46;
    }

    .status-badge.pending {
      background: #fed7aa;
      color: #92400e;
    }

    .status-badge.late {
      background: #fee2e2;
      color: #991b1b;
    }

    .status-badge.not-paid {
      background: #f1f5f9;
      color: #475569;
    }

    .status-badge.attendance-present {
      background: #d1fae5;
      color: #065f46;
    }

    .status-badge.attendance-absent {
      background: #fee2e2;
      color: #991b1b;
    }

    .status-badge.attendance-late {
      background: #fed7aa;
      color: #92400e;
    }

    .amount {
      font-weight: 600;
      color: var(--primary-color);
    }

    .empty-table {
      text-align: center;
      color: var(--text-light);
      padding: 30px !important;
    }

    .action-buttons {
      display: flex;
      gap: 5px;
    }

    /* ========== شريط الفلترة ========== */
    .filter-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      flex-wrap: wrap;
      gap: 15px;
    }

    .filter-select {
      padding: 10px 16px;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-color);
      background: var(--card-bg);
      font-size: 0.95rem;
      min-width: 200px;
      outline: none;
    }

    .filter-select:focus {
      border-color: var(--primary-color);
    }

    .payments-summary {
      display: flex;
      gap: 20px;
      background: #f1f5f9;
      padding: 10px 20px;
      border-radius: var(--radius-md);
    }

    .summary-item {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .summary-label {
      color: var(--text-light);
      font-size: 0.9rem;
    }

    .summary-value {
      font-weight: 700;
      font-size: 1.1rem;
    }

    /* ========== الترقيم الصفحات ========== */
    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 16px;
      margin-top: 20px;
    }

    .page-btn {
      width: 40px;
      height: 40px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-color);
      background: var(--card-bg);
      color: var(--text-medium);
      cursor: pointer;
      transition: var(--transition);
    }

    .page-btn:hover:not(:disabled) {
      background: var(--primary-color);
      color: white;
      border-color: var(--primary-color);
    }

    .page-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .page-info {
      font-weight: 600;
      color: var(--text-medium);
    }

    /* ========== إحصائيات الغيابات ========== */
    .filter-row {
      display: flex;
      gap: 16px;
      align-items: flex-end;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }

    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .filter-group label {
      font-size: 0.9rem;
      color: var(--text-light);
    }

    .filter-input {
      padding: 8px 12px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-color);
      outline: none;
    }

    .filter-input:focus {
      border-color: var(--primary-color);
    }

    .btn-secondary {
      padding: 8px 16px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-color);
      background: var(--card-bg);
      color: var(--text-medium);
      cursor: pointer;
      transition: var(--transition);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .btn-secondary.small {
      padding: 8px 16px;
      font-size: 0.9rem;
    }

    .btn-secondary:hover {
      background: #f1f5f9;
    }

    .attendance-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 15px;
      margin-bottom: 25px;
    }

    .stat-mini-card {
      background: #f8fafc;
      padding: 15px;
      border-radius: var(--radius-md);
      text-align: center;
      border: 1px solid var(--border-color);
    }

    .stat-mini-card .stat-label {
      display: block;
      font-size: 0.85rem;
      color: var(--text-light);
      margin-bottom: 5px;
    }

    .stat-mini-card .stat-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-dark);
    }

    .stat-mini-card.present .stat-value {
      color: var(--success-color);
    }

    .stat-mini-card.absent .stat-value {
      color: var(--danger-color);
    }

    .stat-mini-card.late .stat-value {
      color: var(--warning-color);
    }

    .progress-container {
      width: 100px;
      height: 25px;
      background: #e9ecef;
      border-radius: 12px;
      overflow: hidden;
      position: relative;
    }

    .progress-bar {
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 600;
      color: white;
      transition: width 0.3s;
    }

    .progress-bar.good {
      background: var(--success-color);
    }

    .progress-bar.warning {
      background: var(--warning-color);
    }

    .progress-bar.bad {
      background: var(--danger-color);
    }

    .high-absent {
      background: rgba(239, 68, 68, 0.05);
    }

    .present-count {
      color: var(--success-color);
      font-weight: 600;
    }

    .absent-count {
      color: var(--danger-color);
      font-weight: 600;
    }

    .late-count {
      color: var(--warning-color);
      font-weight: 600;
    }

    .classes-timeline {
      margin-top: 30px;
    }

    .classes-timeline h4 {
      margin-bottom: 15px;
      color: var(--text-dark);
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .timeline-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 15px;
    }

    .timeline-card {
      background: #f8fafc;
      padding: 15px;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-color);
    }

    .timeline-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
      font-size: 0.9rem;
    }

    .timeline-date {
      color: var(--primary-color);
      font-weight: 600;
    }

    .timeline-time {
      color: var(--text-light);
    }

    .timeline-body {
      display: flex;
      justify-content: space-around;
    }

    .timeline-stat {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 0.85rem;
    }

    .timeline-stat.present {
      color: var(--success-color);
    }

    .timeline-stat.absent {
      color: var(--danger-color);
    }

    .timeline-stat.late {
      color: var(--warning-color);
    }

    /* ========== النوافذ المنبثقة ========== */
    .popup-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      backdrop-filter: blur(4px);
    }

    .popup-container {
      background: var(--card-bg);
      width: 90%;
      max-width: 500px;
      border-radius: var(--radius-lg);
      overflow: hidden;
      animation: slideUp 0.3s ease-out;
    }

    .popup-container.large {
      max-width: 800px;
    }

    @keyframes slideUp {
      from {
        transform: translateY(20px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    .popup-header {
      padding: 20px;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .popup-header.warning {
      background: #ffedd5;
      color: #92400e;
    }

    .popup-header.danger {
      background: #fee2e2;
      color: #991b1b;
    }

    .popup-header h3 {
      margin: 0;
      font-size: 1.2rem;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: var(--text-light);
      transition: var(--transition);
    }

    .close-btn:hover {
      color: var(--danger-color);
    }

    .popup-body {
      padding: 20px;
      max-height: 60vh;
      overflow-y: auto;
    }

    .popup-footer {
      padding: 20px;
      background: #f8fafc;
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      border-top: 1px solid var(--border-color);
    }

    /* ========== عناصر النماذج ========== */
    .form-group {
      margin-bottom: 20px;
    }

    .form-group label {
      display: block;
      margin-bottom: 8px;
      font-weight: 600;
      color: var(--text-dark);
    }

    .form-control {
      width: 100%;
      padding: 12px;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      font-size: 0.95rem;
      transition: var(--transition);
      outline: none;
    }

    .form-control:focus {
      border-color: var(--primary-color);
      box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.1);
    }

    .form-control:disabled {
      background: #f1f5f9;
      cursor: not-allowed;
    }

    .form-row {
      display: flex;
      gap: 15px;
    }

    .form-group.half {
      flex: 1;
    }

    .btn-save, .btn-danger {
      padding: 10px 24px;
      border-radius: var(--radius-sm);
      border: none;
      font-weight: 600;
      cursor: pointer;
      transition: var(--transition);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .btn-save {
      background: var(--primary-color);
      color: white;
    }

    .btn-save:hover:not(:disabled) {
      background: var(--primary-dark);
    }

    .btn-save:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-danger {
      background: var(--danger-color);
      color: white;
    }

    .btn-danger:hover {
      background: #dc2626;
    }

    .btn-cancel {
      padding: 10px 24px;
      background: transparent;
      border: none;
      font-weight: 600;
      color: var(--text-light);
      cursor: pointer;
      transition: var(--transition);
    }

    .btn-cancel:hover {
      color: var(--danger-color);
    }

    .warning-message {
      background: #ffedd5;
      border-right: 4px solid var(--warning-color);
      padding: 16px;
      border-radius: var(--radius-sm);
      margin-bottom: 20px;
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .warning-message i {
      color: var(--warning-color);
      font-size: 1.5rem;
    }

    .warning-message p {
      color: #92400e;
      margin: 0;
    }

    .payment-details {
      background: #f8fafc;
      padding: 16px;
      border-radius: var(--radius-sm);
      margin-bottom: 20px;
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px dashed var(--border-color);
    }

    .detail-row:last-child {
      border-bottom: none;
    }

    /* ========== معلومات الطالب في نافذة الغيابات ========== */
    .student-info {
      display: flex;
      align-items: center;
      gap: 15px;
      padding: 15px;
      background: #f8fafc;
      border-radius: var(--radius-md);
      margin-bottom: 20px;
    }

    .student-avatar {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: var(--primary-color);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      font-weight: 600;
    }

    .student-details h4 {
      margin: 0 0 5px;
      color: var(--text-dark);
    }

    .student-details p {
      margin: 0;
      color: var(--text-light);
      font-size: 0.9rem;
    }

    .attendance-summary {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-bottom: 20px;
    }

    .summary-item {
      background: #f8fafc;
      padding: 10px;
      border-radius: var(--radius-sm);
      text-align: center;
    }

    .summary-item .label {
      display: block;
      font-size: 0.8rem;
      color: var(--text-light);
      margin-bottom: 5px;
    }

    .summary-item .value {
      display: block;
      font-size: 1.2rem;
      font-weight: 700;
    }

    .summary-item.present .value {
      color: var(--success-color);
    }

    .summary-item.absent .value {
      color: var(--danger-color);
    }

    .summary-item.late .value {
      color: var(--warning-color);
    }

    /* ========== التحميل ========== */
    .loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255, 255, 255, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2000;
    }

    .spinner {
      width: 50px;
      height: 50px;
      border: 5px solid #f3f3f3;
      border-top: 5px solid var(--primary-color);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    /* ========== الإشعارات ========== */
    .toast {
      position: fixed;
      bottom: 20px;
      right: 20px;
      padding: 15px 30px;
      border-radius: var(--radius-md);
      color: white;
      font-weight: 600;
      z-index: 3000;
      animation: slideIn 0.3s forwards;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .toast.success {
      background: var(--success-color);
    }

    .toast.error {
      background: var(--danger-color);
    }

    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    /* ========== تصاميم متجاوبة ========== */
    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
        align-items: flex-start;
      }

      .header-actions {
        width: 100%;
      }

      .action-btn {
        flex: 1;
        justify-content: center;
      }

      .tabs-container {
        overflow-x: auto;
        padding: 0 10px;
      }

      .tab-btn {
        padding: 10px 16px;
        white-space: nowrap;
      }

      .filter-bar {
        flex-direction: column;
        align-items: flex-start;
      }

      .filter-select {
        width: 100%;
      }

      .payments-summary {
        width: 100%;
        justify-content: space-between;
      }

      .form-row {
        flex-direction: column;
        gap: 0;
      }

      .attendance-stats {
        grid-template-columns: repeat(2, 1fr);
      }

      .popup-container {
        width: 95%;
        margin: 10px;
      }

      .attendance-summary {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  `]
})
export class LessonDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);
  
  // معرف الحصة
  lessonId!: string;
  
  // بيانات الحصة
  lesson: Class | null = null;
  
  // حالة التحميل
  loading = false;
  
  // التبويب النشط
  activeTab = 'overview';
  
  // الشهر المحدد
  selectedMonth = this.getCurrentMonth();
  
  // المدفوعات
  payments: Payment[] = [];
  filteredPayments: Payment[] = [];
  
  // بيانات الغيابات
  attendanceRecords: AttendanceRecord[] = [];
  attendanceStats?: AttendanceStats;
  attendanceClassesDetails: LiveClassDetail[] = [];
  selectedAttendanceRecord?: AttendanceRecord;
  
  // فلترة الغيابات
  attendanceFilter = {
    startDate: this.getDefaultStartDate(),
    endDate: this.getDefaultEndDate()
  };
  
  // النوافذ المنبثقة
  showAddStudentPopup = false;
  showAddPaymentPopup = false;
  showEditPaymentPopup = false;
  showCancelPaymentPopup = false;
  showDeleteConfirmPopup = false;
  showAttendanceDetailsPopup = false;
  
  // البيانات المساعدة
  availableStudents: Student[] = [];
  selectedPayment?: Payment;
  cancelReason = '';
  
  // النماذج
  addStudentForm: FormGroup;
  paymentForm: FormGroup;
  editPaymentForm: FormGroup;
  
  // الترقيم
  currentPage = 1;
  itemsPerPage = 10;
  
  // الإحصائيات
  statistics = {
    totalStudents: 0
  };
  
  // خيارات الأشهر
  quickMonths = [
    { value: 'all', label: 'عرض الكل' },
    { value: this.getCurrentMonth(), label: 'الشهر الحالي' },
    { value: this.getPreviousMonth(), label: 'الشهر الماضي' }
  ];
  
  // رسائل الخطأ والنجاح
  errorMessage = '';
  successMessage = '';
  
  // إجمالي عدد الصفحات
  get totalPages(): number {
    return Math.ceil(this.filteredPayments.length / this.itemsPerPage);
  }
  
  // المدفوعات حسب الصفحة الحالية
  get paginatedPayments(): Payment[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredPayments.slice(start, end);
  }
  
  // سجل الغيابات حسب الصفحة الحالية
  get paginatedAttendance(): AttendanceRecord[] {
    return this.attendanceRecords;
  }

  constructor() {
    // نموذج إضافة طالب
    this.addStudentForm = this.fb.group({
      studentId: ['', Validators.required]
    });
    
    // نموذج تسجيل دفعة
    this.paymentForm = this.fb.group({
      studentId: ['', Validators.required],
      amount: [0, [Validators.required, Validators.min(1)]],
      month: [this.getCurrentMonth(), Validators.required],
      paymentMethod: ['cash', Validators.required],
      notes: ['']
    });
    
    // نموذج تعديل دفعة
    this.editPaymentForm = this.fb.group({
      amount: [0, [Validators.required, Validators.min(1)]],
      paymentMethod: ['cash', Validators.required],
      status: ['pending', Validators.required],
      notes: ['']
    });
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.lessonId = params['lessonId'];
      if (this.lessonId) {
        this.loadLessonDetails();
      }
    });
  }

  // ========== تحميل البيانات ==========
  loadLessonDetails(): void {
    this.loading = true;
    this.http.get<any>(`${environment.apiUrl}/classes/${this.lessonId}`).subscribe({
      next: (res) => {
        const data = res.data || res;
        this.lesson = data;
        this.statistics.totalStudents = data.students?.length || 0;
        this.loadPayments();
      },
      error: (err) => {
        console.error('خطأ في تحميل تفاصيل الحصة:', err);
        this.showError('فشل في تحميل تفاصيل الحصة');
        this.loading = false;
      }
    });
  }

  loadPayments(): void {
    this.http.get<any>(`${environment.apiUrl}/payments/class/${this.lessonId}`).subscribe({
      next: (res) => {
        this.payments = res.payments || res || [];
        this.applyMonthFilter();
        this.loadAvailableStudents();
        this.loading = false;
      },
      error: (err) => {
        console.error('خطأ في تحميل المدفوعات:', err);
        this.showError('فشل في تحميل المدفوعات');
        this.loading = false;
      }
    });
  }

  loadAttendance(): void {
    this.loading = true;
    
    let url = `${environment.apiUrl}/classes/${this.lessonId}/attendance`;
    const params = new URLSearchParams();
    
    if (this.attendanceFilter.startDate) {
      params.append('startDate', this.attendanceFilter.startDate);
    }
    if (this.attendanceFilter.endDate) {
      params.append('endDate', this.attendanceFilter.endDate);
    }
    
    if (params.toString()) {
      url += '?' + params.toString();
    }
    
    this.http.get<any>(url).subscribe({
      next: (res) => {
        if (res.success) {
          this.attendanceRecords = res.data.studentsAttendance || [];
          this.attendanceStats = res.data.statistics;
          this.attendanceClassesDetails = res.data.classesDetails || [];
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('خطأ في تحميل بيانات الغيابات:', err);
        this.showError('فشل في تحميل بيانات الغيابات');
        this.loading = false;
      }
    });
  }

  loadAvailableStudents(): void {
    this.http.get<any>(`${environment.apiUrl}/students`).subscribe({
      next: (students) => {
        const enrolledIds = new Set(this.lesson?.students.map(s => s._id));
        this.availableStudents = students.filter((s: Student) => !enrolledIds.has(s._id));
      },
      error: (err) => {
        console.error('خطأ في تحميل قائمة الطلاب:', err);
      }
    });
  }

  // ========== عمليات المدفوعات ==========
  applyMonthFilter(): void {
    if (this.selectedMonth === 'all') {
      this.filteredPayments = [...this.payments];
    } else {
      this.filteredPayments = this.payments.filter(p => p.month.startsWith(this.selectedMonth));
    }
    this.currentPage = 1;
  }

  getTotalPaymentsAmount(): number {
    return this.filteredPayments.reduce((sum, p) => sum + p.amount, 0);
  }

  getTotalPaidAmount(): number {
    return this.filteredPayments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
  }

  getTotalPendingAmount(): number {
    return this.filteredPayments.filter(p => p.status !== 'paid').reduce((sum, p) => sum + p.amount, 0);
  }

  getMonthPaidAmount(): number {
    return this.filteredPayments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
  }

  getMonthPendingAmount(): number {
    return this.filteredPayments.filter(p => p.status !== 'paid').reduce((sum, p) => sum + p.amount, 0);
  }

  getStudentPaymentStatus(studentId: string): string {
    const payment = this.payments.find(p => 
      (typeof p.student === 'object' ? p.student._id === studentId : p.student === studentId) && 
      p.month.startsWith(this.selectedMonth !== 'all' ? this.selectedMonth : '')
    );
    return payment ? payment.status : 'not-paid';
  }

  processPayment(): void {
    if (this.paymentForm.invalid) {
      this.showError('يرجى تعبئة جميع الحقول المطلوبة');
      return;
    }
    
    this.loading = true;
    
    const paymentData = {
      student: this.paymentForm.value.studentId,
      class: this.lessonId,
      amount: this.paymentForm.value.amount,
      month: this.paymentForm.value.month,
      monthCode: this.paymentForm.value.month,
      paymentMethod: this.paymentForm.value.paymentMethod,
      status: 'paid',
      notes: this.paymentForm.value.notes,
      paymentDate: new Date()
    };
    
    this.http.post(`${environment.apiUrl}/payments`, paymentData).subscribe({
      next: (res: any) => {
        this.loadPayments();
        this.closeAddPaymentPopup();
        this.showSuccess('تم تسجيل الدفع بنجاح');
        this.loading = false;
      },
      error: (err) => {
        console.error('خطأ في تسجيل الدفع:', err);
        this.showError('فشل في تسجيل الدفع');
        this.loading = false;
      }
    });
  }

  editPayment(payment: Payment): void {
    this.selectedPayment = payment;
    
    // تعبئة النموذج ببيانات الدفعة
    this.editPaymentForm.patchValue({
      amount: payment.amount,
      paymentMethod: payment.paymentMethod || 'cash',
      status: payment.status,
      notes: payment.notes || ''
    });
    
    this.showEditPaymentPopup = true;
  }

  updatePayment(): void {
    if (this.editPaymentForm.invalid || !this.selectedPayment) {
      return;
    }
    
    this.loading = true;
    
    const updateData = {
      amount: this.editPaymentForm.value.amount,
      paymentMethod: this.editPaymentForm.value.paymentMethod,
      status: this.editPaymentForm.value.status,
      notes: this.editPaymentForm.value.notes
    };
    
    this.http.put(`${environment.apiUrl}/payments/${this.selectedPayment._id}`, updateData).subscribe({
      next: (res: any) => {
        this.loadPayments();
        this.closeEditPaymentPopup();
        this.showSuccess('تم تحديث الدفعة بنجاح');
        this.loading = false;
      },
      error: (err) => {
        console.error('خطأ في تحديث الدفعة:', err);
        this.showError('فشل في تحديث الدفعة');
        this.loading = false;
      }
    });
  }

  openCancelPaymentPopup(payment: Payment): void {
    this.selectedPayment = payment;
    this.cancelReason = '';
    this.showCancelPaymentPopup = true;
  }

  closeCancelPaymentPopup(event?: MouseEvent): void {
    if (event && event.target === event.currentTarget) {
      this.showCancelPaymentPopup = false;
      this.selectedPayment = undefined;
      this.cancelReason = '';
    } else if (!event) {
      this.showCancelPaymentPopup = false;
      this.selectedPayment = undefined;
      this.cancelReason = '';
    }
  }

  cancelPayment(): void {
    if (!this.selectedPayment) return;
    
    this.loading = true;
    
    // إرسال طلب إلغاء الدفعة إلى الخادم
    this.http.put(`${environment.apiUrl}/payments/${this.selectedPayment._id}/cancel`, {
      reason: this.cancelReason
    }).subscribe({
      next: (res: any) => {
        this.loadPayments();
        this.closeCancelPaymentPopup();
        this.showSuccess('تم إلغاء الدفعة بنجاح');
        this.loading = false;
      },
      error: (err) => {
        console.error('خطأ في إلغاء الدفعة:', err);
        this.showError('فشل في إلغاء الدفعة');
        this.loading = false;
      }
    });
  }

  deletePayment(payment: Payment): void {
    this.selectedPayment = payment;
    this.showDeleteConfirmPopup = true;
  }

  closeDeleteConfirmPopup(event?: MouseEvent): void {
    if (event && event.target === event.currentTarget) {
      this.showDeleteConfirmPopup = false;
      this.selectedPayment = undefined;
    } else if (!event) {
      this.showDeleteConfirmPopup = false;
      this.selectedPayment = undefined;
    }
  }

  confirmDeletePayment(): void {
    if (!this.selectedPayment) return;
    
    this.loading = true;
    
    this.http.delete(`${environment.apiUrl}/payments/${this.selectedPayment._id}`).subscribe({
      next: (res: any) => {
        this.loadPayments();
        this.closeDeleteConfirmPopup();
        this.showSuccess('تم حذف الدفعة بنجاح');
        this.loading = false;
      },
      error: (err) => {
        console.error('خطأ في حذف الدفعة:', err);
        this.showError('فشل في حذف الدفعة');
        this.loading = false;
      }
    });
  }

  // ========== عمليات الطلاب ==========
  enrollStudent(): void {
    const studentId = this.addStudentForm.value.studentId;
    if (!studentId) return;
    
    this.loading = true;
    
    this.http.post(`${environment.apiUrl}/classes/${this.lessonId}/enroll/${studentId}`, {}).subscribe({
      next: () => {
        this.loadLessonDetails();
        this.closeAddStudentPopup();
        this.showSuccess('تم إضافة الطالب بنجاح');
        this.loading = false;
      },
      error: (err) => {
        console.error('خطأ في إضافة الطالب:', err);
        this.showError('فشل في إضافة الطالب');
        this.loading = false;
      }
    });
  }

  removeStudent(studentId: string): void {
    if (!confirm('هل أنت متأكد من إزالة هذا الطالب من الحصة؟')) return;
    
    this.loading = true;
    
    this.http.delete(`${environment.apiUrl}/classes/${this.lessonId}/unenroll/${studentId}`).subscribe({
      next: () => {
        this.loadLessonDetails();
        this.showSuccess('تم إزالة الطالب بنجاح');
        this.loading = false;
      },
      error: (err) => {
        console.error('خطأ في إزالة الطالب:', err);
        this.showError('فشل في إزالة الطالب');
        this.loading = false;
      }
    });
  }

  // ========== عمليات الغيابات ==========
  showAttendanceDetails(record: AttendanceRecord): void {
    this.selectedAttendanceRecord = record;
    this.showAttendanceDetailsPopup = true;
  }

  closeAttendanceDetailsPopup(event?: MouseEvent): void {
    if (event && event.target === event.currentTarget) {
      this.showAttendanceDetailsPopup = false;
      this.selectedAttendanceRecord = undefined;
    } else if (!event) {
      this.showAttendanceDetailsPopup = false;
      this.selectedAttendanceRecord = undefined;
    }
  }

  resetAttendanceFilter(): void {
    this.attendanceFilter = {
      startDate: this.getDefaultStartDate(),
      endDate: this.getDefaultEndDate()
    };
    this.loadAttendance();
  }

  getLastAttendanceDate(record: AttendanceRecord): string {
    if (!record.records.length) return '---';
    const lastRecord = [...record.records].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )[0];
    return this.formatDate(lastRecord.date);
  }

  // ========== التنقل ==========
  setActiveTab(tab: string): void {
    this.activeTab = tab;
    if (tab === 'attendance' && !this.attendanceRecords.length) {
      this.loadAttendance();
    }
  }

  goBack(): void {
    this.router.navigate(['/home/lesson-management']);
  }

  changePage(page: number): void {
    this.currentPage = page;
  }

  // ========== فتح وإغلاق النوافذ ==========
  openAddStudentPopup(): void {
    this.showAddStudentPopup = true;
  }

  closeAddStudentPopup(event?: MouseEvent): void {
    if (event && event.target === event.currentTarget) {
      this.showAddStudentPopup = false;
      this.addStudentForm.reset();
    } else if (!event) {
      this.showAddStudentPopup = false;
      this.addStudentForm.reset();
    }
  }

  openAddPaymentPopup(student?: Student): void {
    this.showAddPaymentPopup = true;
    if (student) {
      this.paymentForm.patchValue({ 
        studentId: student._id, 
        amount: this.lesson?.price || 0 
      });
    }
  }

  closeAddPaymentPopup(event?: MouseEvent): void {
    if (event && event.target === event.currentTarget) {
      this.showAddPaymentPopup = false;
      this.paymentForm.reset({
        amount: 0,
        month: this.getCurrentMonth(),
        paymentMethod: 'cash',
        notes: ''
      });
    } else if (!event) {
      this.showAddPaymentPopup = false;
      this.paymentForm.reset({
        amount: 0,
        month: this.getCurrentMonth(),
        paymentMethod: 'cash',
        notes: ''
      });
    }
  }

  closeEditPaymentPopup(event?: MouseEvent): void {
    if (event && event.target === event.currentTarget) {
      this.showEditPaymentPopup = false;
      this.selectedPayment = undefined;
      this.editPaymentForm.reset();
    } else if (!event) {
      this.showEditPaymentPopup = false;
      this.selectedPayment = undefined;
      this.editPaymentForm.reset();
    }
  }

  // ========== دوال مساعدة ==========
  getCurrentMonth(): string {
    return new Date().toISOString().slice(0, 7);
  }

  getPreviousMonth(): string {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 7);
  }

  getDefaultStartDate(): string {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  }

  getDefaultEndDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  getStudentName(student: string | Student): string {
    if (typeof student === 'object') {
      return student.name;
    }
    return 'طالب';
  }

  formatPrice(price: number): string {
    return price.toLocaleString() + ' د.ج';
  }

  formatDate(date?: string | Date): string {
    if (!date) return '---';
    return new Date(date).toLocaleDateString('ar-EG');
  }

  formatDateTime(date: string | Date): string {
    return new Date(date).toLocaleString('ar-EG');
  }

  formatMonth(month: string): string {
    if (month === 'all') return 'الكل';
    const [year, m] = month.split('-');
    const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 
                    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    return `${months[parseInt(m) - 1]} ${year}`;
  }

  getPaymentSystemText(system: string): string {
    return system === 'monthly' ? 'شهري' : 'جولات';
  }

  getStatusText(status: string): string {
    const map: { [key: string]: string } = {
      'paid': 'مدفوع',
      'pending': 'معلق',
      'late': 'متأخر',
      'not-paid': 'لم يدفع'
    };
    return map[status] || status;
  }

  getAttendanceStatusText(status: string): string {
    const map: { [key: string]: string } = {
      'present': 'حاضر',
      'absent': 'غائب',
      'late': 'متأخر'
    };
    return map[status] || status;
  }

  getPaymentMethodText(method?: string): string {
    const map: { [key: string]: string } = {
      'cash': 'نقداً',
      'baridimob': 'بريدي موب',
      'bank': 'تحويل بنكي'
    };
    return method ? (map[method] || method) : '---';
  }

  getStatusClass(status: string): string {
    return status;
  }

  printReceipt(payment: Payment): void {
    // يمكن تنفيذ وظيفة الطباعة هنا
    console.log('طباعة إيصال:', payment);
    alert('سيتم فتح نافذة الطباعة');
  }

  private showSuccess(message: string): void {
    this.successMessage = message;
    setTimeout(() => this.successMessage = '', 3000);
  }

  private showError(message: string): void {
    this.errorMessage = message;
    setTimeout(() => this.errorMessage = '', 3000);
  }
}