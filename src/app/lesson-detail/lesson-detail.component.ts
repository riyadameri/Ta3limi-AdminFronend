import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient, HttpClientModule, HttpHeaders, HttpParams } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { environment } from '../../environments/environment';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { forkJoin, debounceTime, distinctUntilChanged, Subject } from 'rxjs';

// ==================== INTERFACES ====================
interface Student {
  _id: string;
  name: string;
  studentId: string;
  parentPhone: string;
  parentEmail: string;
  academicYear: string;
  status: string;
  schoolId?: string;
}

interface Payment {
  _id: string;
  student: Student | string | null;
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
  studentDetails?: Student | null;
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
  schoolId?: string;
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

// ==============================================
// المكون الرئيسي
// ==============================================

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
    <div class="lesson-detail-wrapper">
      <div class="lesson-detail-container">
        <!-- Header -->
        <div class="page-header">
          <div class="header-right">
            <button class="back-btn" (click)="goBack()">
              <i class="fas fa-arrow-right"></i>
            </button>
            <div class="title-section">
              <h1>{{ lesson?.name || 'جاري التحميل...' }}</h1>
              <span class="subject-badge">{{ lesson?.subject }}</span>
            </div>
          </div>
          <div class="header-actions">
            <button class="action-btn primary" (click)="openAddStudentPopup()">
              <i class="fas fa-user-plus"></i>
              <span>إضافة طالب</span>
            </button>
            <button class="action-btn secondary" (click)="openAddPaymentPopup()">
              <i class="fas fa-money-bill-wave"></i>
              <span>دفعة جديدة</span>
            </button>
          </div>
        </div>

        <!-- Stats Horizontal Scroll -->
        <div class="stats-scroll-container">
          <div class="stats-horizontal">
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
                <span class="stat-label">مدفوعات الشهر</span>
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
        </div>

        <!-- Tabs -->
        <div class="tabs-scroll-container">
          <div class="tabs-container">
            <button class="tab-btn" [class.active]="activeTab === 'overview'" (click)="setActiveTab('overview')">
              <i class="fas fa-info-circle"></i>
              <span>نظرة عامة</span>
            </button>
            <button class="tab-btn" [class.active]="activeTab === 'students'" (click)="setActiveTab('students')">
              <i class="fas fa-user-graduate"></i>
              <span>الطلاب</span>
            </button>
            <button class="tab-btn" [class.active]="activeTab === 'payments'" (click)="setActiveTab('payments')">
              <i class="fas fa-credit-card"></i>
              <span>المدفوعات</span>
            </button>
            <button class="tab-btn" [class.active]="activeTab === 'attendance'" (click)="loadAttendance(); setActiveTab('attendance')">
              <i class="fas fa-calendar-check"></i>
              <span>الغيابات</span>
            </button>
          </div>
        </div>

        <!-- Tab Content -->
        <div class="tab-content">
          <!-- Overview Tab -->
          <div class="tab-pane" [class.active]="activeTab === 'overview'">
            <div class="info-cards">
              <div class="info-card">
                <h3><i class="fas fa-chalkboard-teacher"></i> تفاصيل الحصة</h3>
                <div class="info-list">
                  <div class="info-item">
                    <span class="info-label">الأستاذ:</span>
                    <span class="info-value">{{ lesson?.teacher?.name || 'غير محدد' }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">السنة الدراسية:</span>
                    <span class="info-value">{{ lesson?.academicYear }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">نظام الدفع:</span>
                    <span class="info-value">{{ getPaymentSystemText(lesson?.paymentSystem || '') }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">سعر الحصة:</span>
                    <span class="info-value price">{{ formatPrice(lesson?.price || 0) }}</span>
                  </div>
                </div>
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

          <!-- Students Tab -->
          <div class="tab-pane" [class.active]="activeTab === 'students'">
            <!-- Search Bar -->
            <div class="search-section">
              <div class="search-box">
                <i class="fas fa-search search-icon"></i>
                <input 
                  type="text" 
                  [(ngModel)]="studentSearchTerm" 
                  (input)="filterStudents()"
                  placeholder="بحث عن طالب بالاسم أو الكود..."
                  class="search-input"
                />
                <button *ngIf="studentSearchTerm" class="clear-search" (click)="clearStudentSearch()">
                  <i class="fas fa-times"></i>
                </button>
              </div>
            </div>

            <!-- Desktop Table -->
            <div class="desktop-table">
              <div class="table-responsive">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>اسم الطالب</th>
                      <th>كود الطالب</th>
                      <th>السنة الدراسية</th>
                      <th>حالة الدفع</th>
                      <th>الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let student of filteredStudents">
                      <td class="student-name" (click)="openStudentDetails(student._id)">{{ student.name }}</td>
                      <td><span class="student-id">{{ student.studentId }}</span></td>
                      <td>{{ student.academicYear }}</td>
                      <td>
                        <span class="status-badge" [class]="getStatusClass(getStudentPaymentStatus(student._id))">
                          {{ getStatusText(getStudentPaymentStatus(student._id)) }}
                        </span>
                      </td>
                      <td>
                        <div class="action-buttons">
                          <button class="icon-btn blue" (click)="openAddPaymentPopup(student)" title="تسجيل دفع">
                            <i class="fas fa-cash-register"></i>
                          </button>
                          <button class="icon-btn red" (click)="removeStudent(student._id)" title="إزالة">
                            <i class="fas fa-user-minus"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                    <tr *ngIf="!filteredStudents.length">
                      <td colspan="5" class="empty-table">
                        {{ studentSearchTerm ? 'لا توجد نتائج مطابقة للبحث' : 'لا يوجد طلاب مسجلين' }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Mobile Cards -->
            <div class="mobile-cards">
              <div *ngFor="let student of filteredStudents" class="student-card">
                <div class="card-header">
                  <div class="student-avatar">{{ student.name.charAt(0) }}</div>
                  <div class="student-info">
                    <div class="student-name">{{ student.name }}</div>
                    <div class="student-id">{{ student.studentId }}</div>
                  </div>
                  <div class="card-actions">
                    <button class="icon-btn blue" (click)="openAddPaymentPopup(student)" title="تسجيل دفع">
                      <i class="fas fa-cash-register"></i>
                    </button>
                    <button class="icon-btn red" (click)="removeStudent(student._id)" title="إزالة">
                      <i class="fas fa-user-minus"></i>
                    </button>
                  </div>
                </div>
                <div class="card-body">
                  <div class="info-row">
                    <span class="info-label">السنة الدراسية:</span>
                    <span class="info-value">{{ student.academicYear }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">حالة الدفع:</span>
                    <span class="status-badge" [class]="getStatusClass(getStudentPaymentStatus(student._id))">
                      {{ getStatusText(getStudentPaymentStatus(student._id)) }}
                    </span>
                  </div>
                </div>
              </div>
              <div *ngIf="!filteredStudents.length" class="empty-state">
                <i class="fas fa-users-slash"></i>
                <p>{{ studentSearchTerm ? 'لا توجد نتائج مطابقة للبحث' : 'لا يوجد طلاب مسجلين' }}</p>
              </div>
            </div>
          </div>

          <!-- Payments Tab -->
          <div class="tab-pane" [class.active]="activeTab === 'payments'">
            <div class="filter-section">
              <select [(ngModel)]="selectedMonth" (change)="applyMonthFilter()" class="filter-select">
                <option *ngFor="let m of availableMonths" [value]="m.value">{{ m.label }}</option>
              </select>
              <div class="payments-summary" *ngIf="filteredPayments.length">
                <div class="summary-item">
                  <span class="summary-label">الإجمالي:</span>
                  <span class="summary-value">{{ formatPrice(getTotalPaymentsAmount()) }}</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">المدفوع:</span>
                  <span class="summary-value green-text">{{ formatPrice(getTotalPaidAmount()) }}</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">المعلق:</span>
                  <span class="summary-value orange-text">{{ formatPrice(getTotalPendingAmount()) }}</span>
                </div>
              </div>
            </div>

            <!-- Desktop Table -->
            <div class="desktop-table">
              <div class="table-responsive">
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
                          <button class="icon-btn whatsapp-btn" (click)="callParent(p)" title="اتصال بولي الأمر">
                            <i class="fas fa-phone-alt"></i>
                          </button>
                          <button class="icon-btn green" (click)="printReceipt(p)" title="طباعة">
                            <i class="fas fa-print"></i>
                          </button>
                          <button class="icon-btn blue" (click)="editPayment(p)" title="تعديل">
                            <i class="fas fa-edit"></i>
                          </button>
                          <button *ngIf="p.status !== 'paid'" class="icon-btn green" (click)="markPaymentAsPaid(p)" title="تسديد">
                            <i class="fas fa-check-circle"></i>
                          </button>
                          <button *ngIf="p.status === 'paid'" class="icon-btn orange" (click)="openCancelPaymentPopup(p)" title="إلغاء الدفعة">
                            <i class="fas fa-undo-alt"></i>
                          </button>
                          <button class="icon-btn red" (click)="deletePayment(p)" title="حذف">
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
            </div>

            <!-- Mobile Cards -->
            <div class="mobile-cards">
              <div *ngFor="let p of paginatedPayments" class="payment-card">
                <div class="card-header">
                  <div class="payment-amount">{{ formatPrice(p.amount) }}</div>
                  <span class="status-badge" [class]="getStatusClass(p.status)">
                    {{ getStatusText(p.status) }}
                  </span>
                </div>
                <div class="card-body">
                  <div class="info-row">
                    <span class="info-label">الطالب:</span>
                    <span class="info-value">{{ getStudentName(p.student) }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">الشهر:</span>
                    <span class="info-value">{{ p.month }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">تاريخ الدفع:</span>
                    <span class="info-value">{{ formatDate(p.paymentDate) }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">الوسيلة:</span>
                    <span class="info-value">{{ getPaymentMethodText(p.paymentMethod) }}</span>
                  </div>
                </div>
                <div class="card-footer">
                  <button class="icon-btn whatsapp-btn" (click)="callParent(p)" title="اتصال بولي الأمر">
                    <i class="fas fa-phone-alt"></i>
                  </button>
                  <button class="icon-btn green" (click)="printReceipt(p)" title="طباعة">
                    <i class="fas fa-print"></i>
                  </button>
                  <button class="icon-btn blue" (click)="editPayment(p)" title="تعديل">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button *ngIf="p.status !== 'paid'" class="icon-btn green" (click)="markPaymentAsPaid(p)" title="تسديد">
                    <i class="fas fa-check-circle"></i>
                  </button>
                  <button *ngIf="p.status === 'paid'" class="icon-btn orange" (click)="openCancelPaymentPopup(p)" title="إلغاء الدفعة">
                    <i class="fas fa-undo-alt"></i>
                  </button>
                  <button class="icon-btn red" (click)="deletePayment(p)" title="حذف">
                    <i class="fas fa-trash-alt"></i>
                  </button>
                </div>
              </div>
              <div *ngIf="!filteredPayments.length" class="empty-state">
                <i class="fas fa-credit-card"></i>
                <p>لا توجد مدفوعات مسجلة</p>
              </div>
            </div>

            <div class="pagination" *ngIf="filteredPayments.length > itemsPerPage">
              <button class="page-btn" [disabled]="currentPage === 1" (click)="changePage(currentPage - 1)">
                <i class="fas fa-chevron-right"></i>
              </button>
              <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
              <button class="page-btn" [disabled]="currentPage === totalPages" (click)="changePage(currentPage + 1)">
                <i class="fas fa-chevron-left"></i>
              </button>
            </div>
          </div>

          <!-- Attendance Tab -->
          <div class="tab-pane" [class.active]="activeTab === 'attendance'">
            <div class="filter-row">
              <div class="filter-group">
                <label>من تاريخ:</label>
                <input type="date" [(ngModel)]="attendanceFilter.startDate" class="filter-input" (change)="loadAttendance()">
              </div>
              <div class="filter-group">
                <label>إلى تاريخ:</label>
                <input type="date" [(ngModel)]="attendanceFilter.endDate" class="filter-input" (change)="loadAttendance()">
              </div>
              <button class="btn-secondary" (click)="resetAttendanceFilter()">
                <i class="fas fa-redo-alt"></i>
                <span>إعادة</span>
              </button>
            </div>

            <div class="attendance-stats-scroll" *ngIf="attendanceStats">
              <div class="attendance-stats">
                <div class="stat-mini">
                  <span class="stat-label">إجمالي الحصص</span>
                  <span class="stat-value">{{ attendanceStats.totalClasses }}</span>
                </div>
                <div class="stat-mini">
                  <span class="stat-label">نسبة الحضور</span>
                  <span class="stat-value">{{ attendanceStats.averageAttendance }}%</span>
                </div>
                <div class="stat-mini present">
                  <span class="stat-label">حضور</span>
                  <span class="stat-value">{{ attendanceStats.totalPresent }}</span>
                </div>
                <div class="stat-mini absent">
                  <span class="stat-label">غياب</span>
                  <span class="stat-value">{{ attendanceStats.totalAbsent }}</span>
                </div>
                <div class="stat-mini late">
                  <span class="stat-label">تأخير</span>
                  <span class="stat-value">{{ attendanceStats.totalLate }}</span>
                </div>
              </div>
            </div>

            <!-- Desktop Table -->
            <div class="desktop-table">
              <div class="table-responsive">
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
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let record of attendanceRecords">
                      <td class="student-name">{{ record.student.name }}</td>
                      <td><span class="student-id">{{ record.student.studentId }}</span></td>
                      <td>{{ record.totalClasses }}</td>
                      <td class="present-count">{{ record.present }}</td>
                      <td class="absent-count">{{ record.absent }}</td>
                      <td class="late-count">{{ record.late }}</td>
                      <td>
                        <div class="progress-bar-container">
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
                        <button class="icon-btn blue" (click)="showAttendanceDetails(record)" title="تفاصيل">
                          <i class="fas fa-eye"></i>
                        </button>
                      </td>
                    </tr>
                    <tr *ngIf="!attendanceRecords.length">
                      <td colspan="9" class="empty-table">لا توجد بيانات غيابات</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Mobile Cards -->
            <div class="mobile-cards">
              <div *ngFor="let record of attendanceRecords" class="attendance-card">
                <div class="card-header">
                  <div class="student-avatar">{{ record.student.name.charAt(0) }}</div>
                  <div class="student-info">
                    <div class="student-name">{{ record.student.name }}</div>
                    <div class="student-id">{{ record.student.studentId }}</div>
                  </div>
                  <button class="icon-btn blue" (click)="showAttendanceDetails(record)" title="تفاصيل">
                    <i class="fas fa-eye"></i>
                  </button>
                </div>
                <div class="card-body">
                  <div class="stats-row">
                    <div class="stat-item">
                      <span class="stat-label-small">الحصص</span>
                      <span class="stat-value-small">{{ record.totalClasses }}</span>
                    </div>
                    <div class="stat-item present">
                      <span class="stat-label-small">حضور</span>
                      <span class="stat-value-small">{{ record.present }}</span>
                    </div>
                    <div class="stat-item absent">
                      <span class="stat-label-small">غياب</span>
                      <span class="stat-value-small">{{ record.absent }}</span>
                    </div>
                    <div class="stat-item late">
                      <span class="stat-label-small">تأخير</span>
                      <span class="stat-value-small">{{ record.late }}</span>
                    </div>
                  </div>
                  <div class="progress-bar-container">
                    <div class="progress-bar" 
                         [style.width.%]="record.attendanceRate"
                         [class.good]="record.attendanceRate >= 75"
                         [class.warning]="record.attendanceRate >= 50 && record.attendanceRate < 75"
                         [class.bad]="record.attendanceRate < 50">
                      {{ record.attendanceRate }}%
                    </div>
                  </div>
                  <div class="last-attendance">
                    <span class="info-label">آخر حضور:</span>
                    <span>{{ getLastAttendanceDate(record) }}</span>
                  </div>
                </div>
              </div>
              <div *ngIf="!attendanceRecords.length" class="empty-state">
                <i class="fas fa-calendar-times"></i>
                <p>لا توجد بيانات غيابات</p>
              </div>
            </div>
          </div>
        </div>

        <!-- ==================== DIALOGS ==================== -->

        <!-- Add Student Dialog -->
        <div class="dialog-overlay" *ngIf="showAddStudentPopup" (click)="closeAddStudentPopup($event)">
          <div class="dialog" (click)="$event.stopPropagation()">
            <div class="dialog-header">
              <h3><i class="fas fa-user-plus"></i> إضافة طالب للحصة</h3>
              <button class="dialog-close" (click)="closeAddStudentPopup()">&times;</button>
            </div>
            <div class="dialog-body">
              <div class="search-box small">
                <i class="fas fa-search search-icon"></i>
                <input 
                  type="text" 
                  [(ngModel)]="availableStudentSearchTerm" 
                  (input)="filterAvailableStudents()"
                  placeholder="بحث عن طالب..."
                  class="search-input"
                />
              </div>
              <form [formGroup]="addStudentForm">
                <div class="form-group">
                  <label>اختر الطالب</label>
                  <select formControlName="studentId" class="form-control" size="8">
                    <option value="">-- اختر طالب --</option>
                    <option *ngFor="let s of filteredAvailableStudents" [value]="s._id">
                      {{ s.name }} ({{ s.studentId }}) - {{ s.academicYear }}
                    </option>
                  </select>
                </div>
              </form>
            </div>
            <div class="dialog-footer">
              <button class="btn-cancel" (click)="closeAddStudentPopup()">إلغاء</button>
              <button class="btn-save" (click)="enrollStudent()" [disabled]="addStudentForm.invalid">
                <i class="fas fa-check"></i> تأكيد
              </button>
            </div>
          </div>
        </div>

        <!-- Add Payment Dialog -->
        <div class="dialog-overlay" *ngIf="showAddPaymentPopup" (click)="closeAddPaymentPopup($event)">
          <div class="dialog" (click)="$event.stopPropagation()">
            <div class="dialog-header">
              <h3><i class="fas fa-money-bill-wave"></i> تسجيل دفعة جديدة</h3>
              <button class="dialog-close" (click)="closeAddPaymentPopup()">&times;</button>
            </div>
            <div class="dialog-body">
              <form [formGroup]="paymentForm">
                <div class="form-group">
                  <label>الطالب</label>
                  <select formControlName="studentId" class="form-control">
                    <option value="">-- اختر الطالب --</option>
                    <option *ngFor="let s of lesson?.students" [value]="s._id">
                      {{ s.name }} ({{ s.studentId }})
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
            <div class="dialog-footer">
              <button class="btn-cancel" (click)="closeAddPaymentPopup()">إلغاء</button>
              <button class="btn-save" (click)="processPayment()" [disabled]="paymentForm.invalid">
                <i class="fas fa-check"></i> تأكيد
              </button>
            </div>
          </div>
        </div>

        <!-- Edit Payment Dialog -->
        <div class="dialog-overlay" *ngIf="showEditPaymentPopup" (click)="closeEditPaymentPopup($event)">
          <div class="dialog" (click)="$event.stopPropagation()">
            <div class="dialog-header">
              <h3><i class="fas fa-edit"></i> تعديل الدفعة</h3>
              <button class="dialog-close" (click)="closeEditPaymentPopup()">&times;</button>
            </div>
            <div class="dialog-body">
              <form [formGroup]="editPaymentForm">
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
                  <textarea formControlName="notes" class="form-control" rows="2"></textarea>
                </div>
              </form>
            </div>
            <div class="dialog-footer">
              <button class="btn-cancel" (click)="closeEditPaymentPopup()">إلغاء</button>
              <button class="btn-save" (click)="updatePayment()">حفظ التغييرات</button>
            </div>
          </div>
        </div>

        <!-- Cancel Payment Dialog -->
        <div class="dialog-overlay" *ngIf="showCancelPaymentPopup" (click)="closeCancelPaymentPopup($event)">
          <div class="dialog" (click)="$event.stopPropagation()">
            <div class="dialog-header">
              <h3><i class="fas fa-undo-alt"></i> إلغاء الدفعة</h3>
              <button class="dialog-close" (click)="closeCancelPaymentPopup()">&times;</button>
            </div>
            <div class="dialog-body">
              <p>هل أنت متأكد من إلغاء هذه الدفعة؟ سيتم إعادة حالة الدفعة إلى "معلق".</p>
              <div class="form-group" style="margin-top: 15px;">
                <label>سبب الإلغاء (اختياري)</label>
                <textarea [(ngModel)]="cancelReason" class="form-control" rows="2" placeholder="أدخل سبب الإلغاء..."></textarea>
              </div>
            </div>
            <div class="dialog-footer">
              <button class="btn-cancel" (click)="closeCancelPaymentPopup()">إلغاء</button>
              <button class="btn-save" (click)="cancelPayment()">تأكيد الإلغاء</button>
            </div>
          </div>
        </div>

        <!-- Delete Confirmation Dialog -->
        <div class="dialog-overlay" *ngIf="showDeleteConfirmPopup" (click)="closeDeleteConfirmPopup($event)">
          <div class="dialog" (click)="$event.stopPropagation()">
            <div class="dialog-header">
              <h3><i class="fas fa-trash-alt"></i> حذف الدفعة</h3>
              <button class="dialog-close" (click)="closeDeleteConfirmPopup()">&times;</button>
            </div>
            <div class="dialog-body">
              <p>هل أنت متأكد من حذف هذه الدفعة؟ لا يمكن التراجع عن هذا الإجراء.</p>
            </div>
            <div class="dialog-footer">
              <button class="btn-cancel" (click)="closeDeleteConfirmPopup()">إلغاء</button>
              <button class="btn-save" style="background-color: #ef4444;" (click)="confirmDeletePayment()">تأكيد الحذف</button>
            </div>
          </div>
        </div>

        <!-- Mark as Paid Dialog -->
        <div class="dialog-overlay" *ngIf="showMarkPaidPopup" (click)="closeMarkPaidPopup($event)">
          <div class="dialog" (click)="$event.stopPropagation()">
            <div class="dialog-header">
              <h3><i class="fas fa-check-circle"></i> تسديد الدفعة</h3>
              <button class="dialog-close" (click)="closeMarkPaidPopup()">&times;</button>
            </div>
            <div class="dialog-body">
              <p>تأكيد تسديد الدفعة بقيمة <strong>{{ selectedPayment?.amount | number }} د.ج</strong> للطالب <strong>{{ getStudentName(selectedPayment?.student) }}</strong> لشهر <strong>{{ selectedPayment?.month }}</strong>؟</p>
              <div class="form-group" style="margin-top: 15px;">
                <label>طريقة الدفع</label>
                <select [(ngModel)]="markPaidPaymentMethod" class="form-control">
                  <option value="cash">نقداً</option>
                  <option value="baridimob">بريدي موب</option>
                  <option value="bank">تحويل بنكي</option>
                </select>
              </div>
            </div>
            <div class="dialog-footer">
              <button class="btn-cancel" (click)="closeMarkPaidPopup()">إلغاء</button>
              <button class="btn-save" (click)="confirmMarkAsPaid()">تأكيد التسديد</button>
            </div>
          </div>
        </div>

        <!-- Loading Overlay -->
        <div class="loading-overlay" *ngIf="loading">
          <div class="spinner"></div>
        </div>

        <!-- Toast Messages -->
        <div class="toast success" *ngIf="successMessage">
          <i class="fas fa-check-circle"></i> {{ successMessage }}
        </div>
        <div class="toast error" *ngIf="errorMessage">
          <i class="fas fa-exclamation-circle"></i> {{ errorMessage }}
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* ==================== STYLES ==================== */
    * { margin: 0; padding: 0; box-sizing: border-box; }

    :host { display: block; width: 100%; max-width: 100%; overflow-x: hidden; }
    .lesson-detail-wrapper { width: 100%; max-width: 100%; overflow-x: hidden; }

    .lesson-detail-container {
      max-width: 100%;
      overflow-x: hidden;
      background: #f8fafc;
      min-height: 100vh;
      padding: 16px;
      font-family: 'Tajawal', 'Segoe UI', sans-serif;
      direction: rtl;
    }

    :host {
      --primary: #4361ee;
      --primary-dark: #3a56d4;
      --primary-light: #eef2ff;
      --success: #10b981;
      --danger: #ef4444;
      --warning: #f59e0b;
      --whatsapp: #25D366;
      --text-dark: #1e293b;
      --text-medium: #475569;
      --text-light: #64748b;
      --bg: #f8fafc;
      --card-bg: #ffffff;
      --border: #e2e8f0;
      --radius: 12px;
      --radius-sm: 8px;
    }

    /* ==================== SEARCH SECTION ==================== */
    .search-section {
      margin-bottom: 16px;
    }

    .search-box {
      position: relative;
      display: flex;
      align-items: center;
      background: white;
      border: 1.5px solid var(--border);
      border-radius: var(--radius-sm);
      transition: all 0.3s ease;
    }

    .search-box:focus-within {
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.1);
    }

    .search-box.small {
      margin-bottom: 12px;
    }

    .search-icon {
      position: absolute;
      right: 12px;
      color: var(--text-light);
      font-size: 0.9rem;
    }

    .search-input {
      width: 100%;
      padding: 10px 40px 10px 12px;
      border: none;
      border-radius: var(--radius-sm);
      font-size: 0.9rem;
      background: transparent;
      outline: none;
      font-family: inherit;
    }

    .clear-search {
      position: absolute;
      left: 12px;
      background: none;
      border: none;
      color: var(--text-light);
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 50%;
      transition: all 0.2s;
    }

    .clear-search:hover {
      background: var(--bg);
      color: var(--danger);
    }

    /* ==================== HEADER ==================== */
    .page-header {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-bottom: 20px;
    }
    @media (min-width: 768px) {
      .page-header { flex-direction: row; justify-content: space-between; align-items: center; }
    }
    .header-right {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;
    }
    .title-section { flex: 1; }
    .back-btn {
      width: 40px; height: 40px; border-radius: 50%;
      background: white; border: 1px solid var(--border);
      color: var(--primary); cursor: pointer;
      display: flex; align-items: center; justify-content: center;
    }
    .title-section h1 { font-size: 1.25rem; font-weight: 600; margin: 0; }
    .subject-badge {
      background: var(--primary-light); color: var(--primary);
      padding: 4px 10px; border-radius: 20px; font-size: 0.75rem;
    }
    .header-actions { display: flex; gap: 8px; flex-wrap: wrap; }
    .action-btn {
      padding: 8px 16px; border-radius: var(--radius-sm);
      border: none; font-weight: 600;
      display: flex; align-items: center; gap: 6px;
      cursor: pointer; font-size: 0.8rem;
    }
    .action-btn.primary { background: var(--primary); color: white; }
    .action-btn.secondary { background: white; border: 1px solid var(--border); }

    /* ==================== STATS ==================== */
    .stats-scroll-container {
      width: 100%; overflow-x: auto; overflow-y: hidden;
      margin-bottom: 20px; -webkit-overflow-scrolling: touch;
    }
    .stats-scroll-container::-webkit-scrollbar { height: 4px; }
    .stats-scroll-container::-webkit-scrollbar-track { background: var(--border); border-radius: 10px; }
    .stats-scroll-container::-webkit-scrollbar-thumb { background: var(--primary); border-radius: 10px; }
    .stats-horizontal { display: flex; gap: 12px; padding: 4px; min-width: min-content; }
    .stat-card {
      background: white; padding: 12px; border-radius: var(--radius);
      display: flex; align-items: center; gap: 10px;
      width: 160px; flex-shrink: 0; box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    .stat-icon {
      width: 44px; height: 44px; border-radius: var(--radius-sm);
      display: flex; align-items: center; justify-content: center; font-size: 1.1rem;
    }
    .stat-icon.blue-bg { background: #e0f2fe; color: #0284c7; }
    .stat-icon.green-bg { background: #d1fae5; color: var(--success); }
    .stat-icon.orange-bg { background: #ffedd5; color: var(--warning); }
    .stat-info { flex: 1; }
    .stat-label { font-size: 0.65rem; color: var(--text-light); display: block; }
    .stat-value { font-size: 1rem; font-weight: 700; }
    .green-text { color: var(--success); }
    .orange-text { color: var(--warning); }

    /* ==================== TABS ==================== */
    .tabs-scroll-container {
      width: 100%; overflow-x: auto;
      margin: 0 -16px 0 -16px; padding: 0 16px;
      -webkit-overflow-scrolling: touch;
    }
    .tabs-container {
      display: flex; gap: 8px;
      border-bottom: 1px solid var(--border);
      min-width: max-content;
    }
    .tab-btn {
      padding: 12px 16px; background: transparent; border: none;
      font-size: 0.85rem; font-weight: 600; color: var(--text-light);
      cursor: pointer; display: flex; align-items: center; gap: 6px;
      white-space: nowrap; border-bottom: 3px solid transparent;
    }
    .tab-btn.active { color: var(--primary); border-bottom-color: var(--primary); }

    /* ==================== TAB CONTENT ==================== */
    .tab-content {
      background: white; border-radius: 0 0 var(--radius) var(--radius);
      padding: 16px; border: 1px solid var(--border); border-top: none;
      width: 100%; overflow-x: hidden;
    }
    .tab-pane { display: none; }
    .tab-pane.active { display: block; }

    /* ==================== INFO CARDS ==================== */
    .info-cards { display: flex; flex-direction: column; gap: 16px; width: 100%; }
    .info-card {
      background: white; border-radius: var(--radius);
      padding: 16px; border: 1px solid var(--border); width: 100%;
    }
    .info-card h3 {
      font-size: 1rem; margin-bottom: 16px;
      display: flex; align-items: center; gap: 8px;
      border-bottom: 1px solid var(--border); padding-bottom: 10px;
    }
    .info-list { width: 100%; }
    .info-item {
      display: flex; justify-content: space-between;
      padding: 8px 0; border-bottom: 1px dashed var(--border);
      flex-wrap: wrap; gap: 8px;
    }
    .info-item:last-child { border-bottom: none; }
    .info-label { color: var(--text-light); }
    .info-value.price { color: var(--primary); font-weight: 600; }
    .schedule-item {
      display: flex; align-items: center; gap: 12px;
      padding: 10px; background: var(--bg);
      border-radius: var(--radius-sm); margin-bottom: 8px;
      flex-wrap: wrap;
    }
    .schedule-day {
      background: var(--primary); color: white;
      padding: 4px 10px; border-radius: var(--radius-sm); font-size: 0.75rem;
    }
    .empty-message { text-align: center; color: var(--text-light); padding: 20px; }

    /* ==================== TABLES ==================== */
    .desktop-table { display: block; width: 100%; }
    .table-responsive { overflow-x: auto; width: 100%; }
    .data-table {
      width: 100%; border-collapse: collapse; font-size: 0.8rem;
      min-width: 600px;
    }
    .data-table th {
      background: #f1f5f9; padding: 10px; font-weight: 600;
      color: var(--text-medium); text-align: right;
    }
    .data-table td { padding: 10px; border-bottom: 1px solid var(--border); }
    .data-table tr:hover td { background: #f8fafc; }
    .empty-table { text-align: center; color: var(--text-light); padding: 30px !important; }
    .student-name { cursor: pointer; color: var(--primary); font-weight: 500; }
    .student-name:hover { text-decoration: underline; }

    /* ==================== MOBILE CARDS ==================== */
    .mobile-cards { display: none; width: 100%; }
    .student-card, .payment-card, .attendance-card {
      background: white; border: 1px solid var(--border);
      border-radius: var(--radius); margin-bottom: 12px; width: 100%;
    }
    .card-header {
      display: flex; align-items: center; gap: 12px;
      padding: 12px; background: #f8fafc;
      border-bottom: 1px solid var(--border); flex-wrap: wrap;
    }
    .student-avatar {
      width: 40px; height: 40px; border-radius: 50%;
      background: var(--primary); color: white;
      display: flex; align-items: center; justify-content: center;
      font-weight: 600; flex-shrink: 0;
    }
    .student-info { flex: 1; min-width: 0; }
    .student-name { font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .student-id { font-size: 0.7rem; color: var(--text-light); }
    .card-body { padding: 12px; }
    .card-footer {
      padding: 12px; border-top: 1px solid var(--border);
      display: flex; gap: 8px; justify-content: flex-end; flex-wrap: wrap;
    }
    .info-row {
      display: flex; justify-content: space-between;
      padding: 8px 0; border-bottom: 1px dashed var(--border);
      flex-wrap: wrap; gap: 8px;
    }
    .payment-amount { font-size: 1.1rem; font-weight: 700; color: var(--primary); }
    .stats-row {
      display: flex; justify-content: space-around;
      margin-bottom: 12px; flex-wrap: wrap; gap: 8px;
    }
    .stat-item { text-align: center; flex: 1; min-width: 60px; }
    .stat-label-small { font-size: 0.65rem; color: var(--text-light); display: block; }
    .stat-value-small { font-size: 1rem; font-weight: 700; }
    .stat-item.present .stat-value-small { color: var(--success); }
    .stat-item.absent .stat-value-small { color: var(--danger); }
    .stat-item.late .stat-value-small { color: var(--warning); }
    .last-attendance {
      margin-top: 8px; font-size: 0.7rem;
      display: flex; justify-content: space-between; flex-wrap: wrap; gap: 8px;
    }
    .empty-state {
      text-align: center; padding: 40px 20px; color: var(--text-light);
    }
    .empty-state i { font-size: 2rem; margin-bottom: 10px; opacity: 0.5; }

    /* ==================== STATUS BADGES ==================== */
    .status-badge {
      display: inline-block; padding: 4px 10px; border-radius: 20px;
      font-size: 0.7rem; font-weight: 600;
    }
    .status-badge.paid { background: #d1fae5; color: #065f46; }
    .status-badge.pending { background: #fed7aa; color: #92400e; }
    .status-badge.late { background: #fee2e2; color: #991b1b; }
    .status-badge.not-paid { background: #f1f5f9; color: #475569; }
    .status-badge.partial { background: #dbeafe; color: #1e40af; }

    /* ==================== ICON BUTTONS ==================== */
    .icon-btn {
      width: 32px; height: 32px; border-radius: var(--radius-sm);
      border: 1px solid var(--border); background: white;
      cursor: pointer; display: inline-flex; align-items: center;
      justify-content: center; transition: all 0.2s;
    }
    .icon-btn.whatsapp-btn { color: #25D366; border-color: #25D366; }
    .icon-btn.whatsapp-btn:hover { background: #25D366; color: white; }
    .icon-btn.blue:hover { background: var(--primary-light); color: var(--primary); }
    .icon-btn.red:hover { background: #fee2e2; color: var(--danger); }
    .icon-btn.green:hover { background: #d1fae5; color: var(--success); }
    .icon-btn.orange:hover { background: #ffedd5; color: var(--warning); }
    .action-buttons { display: flex; gap: 4px; flex-wrap: wrap; }

    /* ==================== FILTERS ==================== */
    .filter-section {
      display: flex; flex-wrap: wrap; gap: 12px;
      margin-bottom: 16px; width: 100%;
    }
    .filter-select {
      padding: 8px 12px; border: 1px solid var(--border);
      border-radius: var(--radius-sm); background: white;
      flex: 1; min-width: 150px;
    }
    .filter-row {
      display: flex; flex-wrap: wrap; gap: 12px;
      margin-bottom: 16px; width: 100%;
    }
    .filter-group {
      display: flex; flex-direction: column; gap: 4px; flex: 1;
    }
    .filter-group label { font-size: 0.7rem; color: var(--text-light); }
    .filter-input {
      padding: 8px 12px; border: 1px solid var(--border);
      border-radius: var(--radius-sm);
    }
    .btn-secondary {
      padding: 8px 16px; border-radius: var(--radius-sm);
      border: 1px solid var(--border); background: white;
      cursor: pointer; display: flex; align-items: center; gap: 6px;
    }
    .payments-summary {
      display: flex; gap: 16px;
      background: #f1f5f9; padding: 8px 16px;
      border-radius: var(--radius-sm); flex-wrap: wrap;
    }
    .summary-item { display: flex; gap: 8px; align-items: center; }
    .summary-label { font-size: 0.7rem; color: var(--text-light); }
    .summary-value { font-weight: 700; }

    /* ==================== ATTENDANCE STATS ==================== */
    .attendance-stats-scroll {
      width: 100%; overflow-x: auto; margin-bottom: 20px;
    }
    .attendance-stats {
      display: flex; gap: 12px; min-width: min-content;
    }
    .stat-mini {
      background: #f8fafc; padding: 12px; border-radius: var(--radius-sm);
      text-align: center; min-width: 80px;
    }
    .stat-mini .stat-label { font-size: 0.7rem; color: var(--text-light); display: block; }
    .stat-mini .stat-value { font-size: 1.1rem; font-weight: 700; }
    .stat-mini.present .stat-value { color: var(--success); }
    .stat-mini.absent .stat-value { color: var(--danger); }
    .stat-mini.late .stat-value { color: var(--warning); }

    /* ==================== PROGRESS BAR ==================== */
    .progress-bar-container {
      width: 100px; height: 24px;
      background: #e9ecef; border-radius: 12px; overflow: hidden;
    }
    .progress-bar {
      height: 100%; display: flex; align-items: center;
      justify-content: center; font-size: 0.7rem; font-weight: 600;
      color: white; transition: width 0.3s;
    }
    .progress-bar.good { background: var(--success); }
    .progress-bar.warning { background: var(--warning); }
    .progress-bar.bad { background: var(--danger); }
    .present-count { color: var(--success); font-weight: 600; }
    .absent-count { color: var(--danger); font-weight: 600; }
    .late-count { color: var(--warning); font-weight: 600; }

    /* ==================== PAGINATION ==================== */
    .pagination {
      display: flex; justify-content: center; align-items: center;
      gap: 12px; margin-top: 20px;
    }
    .page-btn {
      width: 36px; height: 36px; border-radius: var(--radius-sm);
      border: 1px solid var(--border); background: white; cursor: pointer;
    }
    .page-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .page-info { font-weight: 600; }

    /* ==================== DIALOGS ==================== */
    .dialog-overlay {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.5);
      display: flex; align-items: center; justify-content: center;
      z-index: 1000; padding: 16px;
    }
    .dialog {
      background: white; width: 100%; max-width: 500px;
      border-radius: var(--radius); max-height: 90vh; overflow-y: auto;
    }
    .dialog-header {
      padding: 16px; border-bottom: 1px solid var(--border);
      display: flex; justify-content: space-between; align-items: center;
    }
    .dialog-header h3 { font-size: 1rem; display: flex; align-items: center; gap: 8px; }
    .dialog-close {
      width: 32px; height: 32px; border-radius: 50%;
      border: none; background: transparent; font-size: 1.2rem; cursor: pointer;
    }
    .dialog-body { padding: 16px; max-height: 60vh; overflow-y: auto; }
    .dialog-footer {
      padding: 16px; border-top: 1px solid var(--border);
      display: flex; justify-content: flex-end; gap: 12px;
    }
    .form-group { margin-bottom: 16px; }
    .form-group label { display: block; margin-bottom: 6px; font-weight: 600; font-size: 0.8rem; }
    .form-control {
      width: 100%; padding: 10px; border: 1px solid var(--border);
      border-radius: var(--radius-sm);
    }
    .form-control[size] { min-height: 150px; }
    .form-row { display: flex; gap: 12px; flex-wrap: wrap; }
    .form-group.half { flex: 1; }
    .btn-save, .btn-cancel {
      padding: 8px 20px; border-radius: var(--radius-sm);
      border: none; font-weight: 600; cursor: pointer;
    }
    .btn-save { background: var(--primary); color: white; }
    .btn-save:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-cancel { background: transparent; border: 1px solid var(--border); }

    /* ==================== LOADING ==================== */
    .loading-overlay {
      position: fixed; inset: 0;
      background: rgba(255,255,255,0.8);
      display: flex; align-items: center; justify-content: center;
      z-index: 2000;
    }
    .spinner {
      width: 40px; height: 40px;
      border: 4px solid #f3f3f3; border-top: 4px solid var(--primary);
      border-radius: 50%; animation: spin 1s linear infinite;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    /* ==================== TOAST ==================== */
    .toast {
      position: fixed; bottom: 16px; left: 16px;
      padding: 12px 20px; border-radius: var(--radius-sm);
      color: white; z-index: 2000;
      display: flex; align-items: center; gap: 8px;
      animation: slideIn 0.3s;
    }
    .toast.success { background: var(--success); }
    .toast.error { background: var(--danger); }
    @keyframes slideIn {
      from { transform: translateX(-100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }

    /* ==================== RESPONSIVE ==================== */
    @media (max-width: 768px) {
      .desktop-table { display: none; }
      .mobile-cards { display: block; }
      .header-actions { width: 100%; }
      .action-btn { flex: 1; justify-content: center; }
      .filter-section { flex-direction: column; }
      .filter-select { width: 100%; }
      .filter-row { flex-direction: column; }
      .filter-group { width: 100%; }
      .btn-secondary { width: 100%; justify-content: center; }
      .payments-summary { justify-content: space-between; }
      .form-row { flex-direction: column; gap: 0; }
      .dialog { width: calc(100% - 24px); margin: 0 auto; }
      .info-item { flex-direction: column; align-items: flex-start; gap: 4px; }
      .stats-horizontal { gap: 8px; }
      .stat-card { width: 140px; padding: 10px; }
      .tab-btn { padding: 10px 12px; font-size: 0.75rem; }
      .tab-btn span { display: none; }
      .tab-btn i { font-size: 1.2rem; }
      .search-input { font-size: 0.8rem; padding: 8px 35px 8px 10px; }
    }
  `]
})
export class LessonDetailComponent implements OnInit {
  // ==================== INJECTIONS ====================
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);
  private sanitizer = inject(DomSanitizer);
  
  // ==================== PROPERTIES ====================
  lessonId!: string;
  lesson: Class | null = null;
  loading = false;
  activeTab = 'overview';
  selectedMonth = this.getCurrentMonth();
  payments: Payment[] = [];
  filteredPayments: Payment[] = [];
  attendanceRecords: AttendanceRecord[] = [];
  attendanceStats?: AttendanceStats;
  attendanceClassesDetails: any[] = [];
  selectedAttendanceRecord?: AttendanceRecord;
  
  // Student Search
  studentSearchTerm: string = '';
  filteredStudents: Student[] = [];
  availableStudentSearchTerm: string = '';
  filteredAvailableStudents: Student[] = [];
  
  attendanceFilter = {
    startDate: this.getDefaultStartDate(),
    endDate: this.getDefaultEndDate()
  };
  
  // Dialog Popup Flags (using Popup naming for template compatibility)
  showAddStudentPopup = false;
  showAddPaymentPopup = false;
  showEditPaymentPopup = false;
  showCancelPaymentPopup = false;
  showDeleteConfirmPopup = false;
  showMarkPaidPopup = false;
  showAttendanceDetailsPopup = false;
  
  // Data
  availableStudents: Student[] = [];
  selectedPayment?: Payment;
  cancelReason = '';
  markPaidPaymentMethod = 'cash';
  
  // Forms
  addStudentForm: FormGroup;
  paymentForm: FormGroup;
  editPaymentForm: FormGroup;
  
  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  
  // Statistics
  statistics = {
    totalStudents: 0
  };
  
  availableMonths: { value: string; label: string }[] = [];
  
  // Messages
  errorMessage = '';
  successMessage = '';

  // School ID
  private schoolId: string | null = null;
  private apiUrl = 'http://localhost:5090';

  // ==================== COMPUTED PROPERTIES ====================
  get totalPages(): number {
    return Math.ceil(this.filteredPayments.length / this.itemsPerPage);
  }
  
  get paginatedPayments(): Payment[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredPayments.slice(start, start + this.itemsPerPage);
  }

  // ==================== CONSTRUCTOR ====================
  constructor() {
    this.generateAvailableMonths();
    
    this.addStudentForm = this.fb.group({
      studentId: ['', Validators.required]
    });
    
    this.paymentForm = this.fb.group({
      studentId: ['', Validators.required],
      amount: [0, [Validators.required, Validators.min(1)]],
      month: [this.getCurrentMonth(), Validators.required],
      paymentMethod: ['cash', Validators.required],
      notes: ['']
    });
    
    this.editPaymentForm = this.fb.group({
      amount: [0, [Validators.required, Validators.min(1)]],
      paymentMethod: ['cash', Validators.required],
      status: ['pending', Validators.required],
      notes: ['']
    });
  }

  // ==================== LIFE CYCLE ====================
  ngOnInit(): void {
    this.loadSchoolData();
    
    this.route.params.subscribe(params => {
      this.lessonId = params['lessonId'];
      if (this.lessonId) {
        this.loadLessonDetails();
      }
    });
  }

  // ==================== LOAD SCHOOL DATA ====================
  private loadSchoolData(): void {
    try {
      const schoolData = localStorage.getItem('school');
      if (schoolData) {
        const school = JSON.parse(schoolData);
        this.schoolId = school._id || '';
      } else {
        const userData = localStorage.getItem('user');
        if (userData) {
          const user = JSON.parse(userData);
          if (user.schoolId) {
            this.schoolId = user.schoolId;
          }
        }
      }
    } catch (error) {
      console.error('❌ Error loading school data:', error);
    }
  }

  private getSchoolId(): string | null {
    if (this.schoolId) return this.schoolId;
    
    try {
      const schoolData = localStorage.getItem('school');
      if (schoolData) {
        const school = JSON.parse(schoolData);
        return school._id || '';
      }
    } catch (e) {}
    
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        return user.schoolId || '';
      }
    } catch (e) {}
    
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(atob(base64));
        if (payload?.schoolId) {
          return payload.schoolId;
        }
      }
    } catch (e) {}
    
    return null;
  }

  private getToken(): string | null {
    return localStorage.getItem('token');
  }

  private getHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    });
  }

  // ==================== DATA LOADING ====================
  
  loadLessonDetails(): void {
    this.loading = true;
    this.http.get<any>(`${this.apiUrl}/api/classes/${this.lessonId}`).subscribe({
      next: (res) => {
        let lessonData;
        if (res && res.data) {
          lessonData = res.data;
        } else if (res && res.class) {
          lessonData = res.class;
        } else if (res && res._id) {
          lessonData = res;
        } else {
          lessonData = res;
        }
        
        if (lessonData) {
          this.lesson = lessonData;
          this.statistics.totalStudents = lessonData.students?.length || 0;
          this.filteredStudents = [...(lessonData.students || [])];
          this.loadPayments();
          this.loadAvailableStudents();
        } else {
          this.showError('فشل في تحميل تفاصيل الحصة');
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading lesson details:', err);
        this.showError('فشل في تحميل تفاصيل الحصة');
        this.loading = false;
      }
    });
  }

  loadPayments(): void {
    this.http.get<any>(`${this.apiUrl}/api/payments/class/${this.lessonId}`).subscribe({
      next: (res) => {
        let paymentsData: Payment[] = [];
        
        if (res && res.success && Array.isArray(res.payments)) {
          paymentsData = res.payments;
        } else if (Array.isArray(res)) {
          paymentsData = res;
        } else if (res && res.data && Array.isArray(res.data)) {
          paymentsData = res.data;
        } else {
          paymentsData = [];
        }
        
        this.payments = paymentsData.filter(payment => payment && payment.student !== null);
        this.payments = this.payments.map(payment => ({
          ...payment,
          studentDetails: typeof payment.student === 'object' ? payment.student : null
        }));
        
        this.applyMonthFilter();
      },
      error: (err) => {
        console.error('Error loading payments:', err);
        this.payments = [];
        this.filteredPayments = [];
        this.applyMonthFilter();
      }
    });
  }

  loadAttendance(): void {
    if (!this.lessonId) return;
    
    this.loading = true;
    let url = `${this.apiUrl}/api/classes/${this.lessonId}/attendance`;
    const params = new HttpParams();
    
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
        if (res && res.success) {
          this.attendanceRecords = res.data?.studentsAttendance || [];
          this.attendanceStats = res.data?.statistics;
          this.attendanceClassesDetails = res.data?.classesDetails || [];
        } else if (res && res.studentsAttendance) {
          this.attendanceRecords = res.studentsAttendance;
          this.attendanceStats = res.statistics;
        } else {
          this.attendanceRecords = [];
          this.attendanceStats = undefined;
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading attendance:', err);
        this.attendanceRecords = [];
        this.attendanceStats = undefined;
        this.showError('فشل في تحميل بيانات الغيابات');
        this.loading = false;
      }
    });
  }

  loadAvailableStudents(): void {
    if (!this.lesson) return;
    
    const schoolId = this.getSchoolId();
    
    let url = `${this.apiUrl}/api/students`;
    if (schoolId) {
      url += `?schoolId=${schoolId}`;
    }
    
    this.http.get<any>(url, { headers: this.getHeaders() }).subscribe({
      next: (response) => {
        let studentsList: Student[] = [];
        
        if (Array.isArray(response)) {
          studentsList = response;
        } else if (response.data && Array.isArray(response.data)) {
          studentsList = response.data;
        } else if (response.students && Array.isArray(response.students)) {
          studentsList = response.students;
        } else {
          for (const key in response) {
            if (Array.isArray(response[key])) {
              studentsList = response[key];
              break;
            }
          }
        }
        
        const enrolledIds = new Set<string>();
        if (this.lesson && this.lesson.students && Array.isArray(this.lesson.students)) {
          this.lesson.students.forEach(s => {
            if (s && s._id) {
              enrolledIds.add(s._id);
            }
          });
        }
        
        this.availableStudents = studentsList.filter(s => s && s._id && !enrolledIds.has(s._id));
        this.filteredAvailableStudents = [...this.availableStudents];
      },
      error: (err) => {
        console.error('Error loading students:', err);
        this.availableStudents = [];
        this.filteredAvailableStudents = [];
        this.showError('فشل في تحميل قائمة الطلاب');
      }
    });
  }

  // ==================== STUDENT SEARCH ====================
  
  filterStudents(): void {
    const term = this.studentSearchTerm.toLowerCase().trim();
    if (!term) {
      this.filteredStudents = [...(this.lesson?.students || [])];
      return;
    }
    
    this.filteredStudents = (this.lesson?.students || []).filter(student => {
      return student.name.toLowerCase().includes(term) || 
             student.studentId.toLowerCase().includes(term);
    });
  }

  clearStudentSearch(): void {
    this.studentSearchTerm = '';
    this.filteredStudents = [...(this.lesson?.students || [])];
  }

  filterAvailableStudents(): void {
    const term = this.availableStudentSearchTerm.toLowerCase().trim();
    if (!term) {
      this.filteredAvailableStudents = [...this.availableStudents];
      return;
    }
    
    this.filteredAvailableStudents = this.availableStudents.filter(student => {
      return student.name.toLowerCase().includes(term) || 
             student.studentId.toLowerCase().includes(term);
    });
  }

  // ==================== FILTERS ====================
  
  applyMonthFilter(): void {
    if (this.selectedMonth === 'all') {
      this.filteredPayments = [...this.payments];
    } else {
      this.filteredPayments = this.payments.filter(p => {
        if (!p) return false;
        if (p.monthCode && p.monthCode.startsWith(this.selectedMonth)) return true;
        if (p.month && p.month.includes(this.selectedMonth)) return true;
        return false;
      });
    }
    this.currentPage = 1;
  }

  resetAttendanceFilter(): void {
    this.attendanceFilter = {
      startDate: this.getDefaultStartDate(),
      endDate: this.getDefaultEndDate()
    };
    this.loadAttendance();
  }

  // ==================== PAYMENT CALCULATIONS ====================
  
  getTotalPaymentsAmount(): number {
    return this.filteredPayments.reduce((sum, p) => sum + (p?.amount || 0), 0);
  }

  getTotalPaidAmount(): number {
    return this.filteredPayments.filter(p => p?.status === 'paid').reduce((sum, p) => sum + (p?.amount || 0), 0);
  }

  getTotalPendingAmount(): number {
    return this.filteredPayments.filter(p => p?.status !== 'paid').reduce((sum, p) => sum + (p?.amount || 0), 0);
  }

  getMonthPaidAmount(): number {
    return this.filteredPayments.filter(p => p?.status === 'paid').reduce((sum, p) => sum + (p?.amount || 0), 0);
  }

  getMonthPendingAmount(): number {
    return this.filteredPayments.filter(p => p?.status !== 'paid').reduce((sum, p) => sum + (p?.amount || 0), 0);
  }

  getStudentPaymentStatus(studentId: string): string {
    const payment = this.payments.find(p => {
      if (!p || !p.student) return false;
      const studentObj = typeof p.student === 'object' ? p.student : null;
      const studentIdFromPayment = studentObj ? studentObj._id : p.student;
      return studentIdFromPayment === studentId;
    });
    return payment ? payment.status : 'not-paid';
  }

  // ==================== STUDENT MANAGEMENT ====================
  
  enrollStudent(): void {
    const studentId = this.addStudentForm.value.studentId;
    if (!studentId) {
      this.showError('يرجى اختيار طالب');
      return;
    }
    
    this.loading = true;
    const url = `${this.apiUrl}/api/classes/${this.lessonId}/enroll/${studentId}`;
    
    this.http.post(url, {}, { headers: this.getHeaders() }).subscribe({
      next: () => {
        this.loadLessonDetails();
        this.closeAddStudentPopup();
        this.showSuccess('تم إضافة الطالب بنجاح');
        this.loading = false;
      },
      error: (err) => {
        console.error('Error:', err);
        this.showError(err.error?.error || err.error?.message || 'فشل في إضافة الطالب');
        this.loading = false;
      }
    });
  }

  removeStudent(studentId: string): void {
    if (!confirm('هل أنت متأكد من إزالة هذا الطالب من الحصة؟')) return;
    
    this.loading = true;
    this.http.delete(`${this.apiUrl}/api/classes/${this.lessonId}/unenroll/${studentId}`).subscribe({
      next: () => {
        this.loadLessonDetails();
        this.showSuccess('تم إزالة الطالب بنجاح');
        this.loading = false;
      },
      error: (err) => {
        console.error('Error removing student:', err);
        this.showError('فشل في إزالة الطالب');
        this.loading = false;
      }
    });
  }

  // ==================== PAYMENT OPERATIONS ====================
  
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
    
    this.http.post(`${this.apiUrl}/api/payments`, paymentData, { headers: this.getHeaders() }).subscribe({
      next: () => {
        this.loadPayments();
        this.closeAddPaymentPopup();
        this.showSuccess('تم تسجيل الدفع بنجاح');
        this.loading = false;
      },
      error: (err) => {
        console.error('Error processing payment:', err);
        this.showError(err.error?.error || 'فشل في تسجيل الدفع');
        this.loading = false;
      }
    });
  }

  editPayment(payment: Payment): void {
    this.selectedPayment = payment;
    this.editPaymentForm.patchValue({
      amount: payment.amount,
      paymentMethod: payment.paymentMethod || 'cash',
      status: payment.status,
      notes: payment.notes || ''
    });
    this.showEditPaymentPopup = true;
  }

  updatePayment(): void {
    if (this.editPaymentForm.invalid || !this.selectedPayment) return;
    
    this.loading = true;
    const updateData = {
      amount: this.editPaymentForm.value.amount,
      paymentMethod: this.editPaymentForm.value.paymentMethod,
      status: this.editPaymentForm.value.status,
      notes: this.editPaymentForm.value.notes
    };
    
    this.http.put(`${this.apiUrl}/api/payments/${this.selectedPayment._id}`, updateData, { headers: this.getHeaders() }).subscribe({
      next: () => {
        this.loadPayments();
        this.closeEditPaymentPopup();
        this.showSuccess('تم تحديث الدفعة بنجاح');
        this.loading = false;
      },
      error: (err) => {
        console.error('Error updating payment:', err);
        this.showError('فشل في تحديث الدفعة');
        this.loading = false;
      }
    });
  }

  markPaymentAsPaid(payment: Payment): void {
    this.selectedPayment = payment;
    this.markPaidPaymentMethod = payment.paymentMethod || 'cash';
    this.showMarkPaidPopup = true;
  }

  confirmMarkAsPaid(): void {
    if (!this.selectedPayment) return;
    
    this.loading = true;
    const updateData = {
      status: 'paid',
      paymentMethod: this.markPaidPaymentMethod,
      paymentDate: new Date()
    };
    
    this.http.put(`${this.apiUrl}/api/payments/${this.selectedPayment._id}`, updateData, { headers: this.getHeaders() }).subscribe({
      next: () => {
        this.loadPayments();
        this.closeMarkPaidPopup();
        this.showSuccess('تم تسديد الدفعة بنجاح');
        this.loading = false;
      },
      error: (err) => {
        console.error('Error marking payment as paid:', err);
        this.showError('فشل في تسديد الدفعة');
        this.loading = false;
      }
    });
  }

  cancelPayment(): void {
    if (!this.selectedPayment) return;
    
    this.loading = true;
    this.http.put(`${this.apiUrl}/api/payments/${this.selectedPayment._id}/cancel`, {
      reason: this.cancelReason
    }, { headers: this.getHeaders() }).subscribe({
      next: () => {
        this.loadPayments();
        this.closeCancelPaymentPopup();
        this.showSuccess('تم إلغاء الدفعة بنجاح');
        this.loading = false;
      },
      error: (err) => {
        console.error('Error canceling payment:', err);
        this.showError('فشل في إلغاء الدفعة');
        this.loading = false;
      }
    });
  }

  deletePayment(payment: Payment): void {
    this.selectedPayment = payment;
    this.showDeleteConfirmPopup = true;
  }

  confirmDeletePayment(): void {
    if (!this.selectedPayment) return;
    
    this.loading = true;
    this.http.delete(`${this.apiUrl}/api/payments/${this.selectedPayment._id}`, { headers: this.getHeaders() }).subscribe({
      next: () => {
        this.loadPayments();
        this.closeDeleteConfirmPopup();
        this.showSuccess('تم حذف الدفعة بنجاح');
        this.loading = false;
      },
      error: (err) => {
        console.error('Error deleting payment:', err);
        this.showError('فشل في حذف الدفعة');
        this.loading = false;
      }
    });
  }

  // ==================== UTILITY FUNCTIONS ====================
  
  getStudentName(student: string | Student | null): string {
    if (!student) return 'طالب غير محدد';
    if (typeof student === 'object' && student !== null) {
      return student.name;
    }
    if (this.lesson && this.lesson.students) {
      const found = this.lesson.students.find(s => s._id === student);
      return found ? found.name : 'طالب';
    }
    return 'طالب';
  }

  getStudentDetails(student: string | Student | null): Student | null {
    if (!student) return null;
    if (typeof student === 'object' && student !== null) {
      return student;
    }
    if (this.lesson && this.lesson.students) {
      return this.lesson.students.find(s => s._id === student) || null;
    }
    return null;
  }

  getLastAttendanceDate(record: AttendanceRecord): string {
    if (!record.records || !record.records.length) return '---';
    const lastRecord = [...record.records].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )[0];
    return this.formatDate(lastRecord.date);
  }

  getPaymentSystemText(system: string): string {
    return system === 'monthly' ? 'شهري' : 'جولات';
  }

  getStatusText(status: string): string {
    const map: { [key: string]: string } = {
      'paid': 'مدفوع',
      'pending': 'معلق',
      'late': 'متأخر',
      'not-paid': 'لم يدفع',
      'partial': 'جزئي'
    };
    return map[status] || status;
  }

  getStatusClass(status: string): string {
    return status;
  }

  getPaymentMethodText(method?: string): string {
    const map: { [key: string]: string } = {
      'cash': 'نقداً',
      'baridimob': 'بريدي موب',
      'bank': 'تحويل بنكي'
    };
    return method ? (map[method] || method) : '---';
  }

  formatPrice(price: number): string {
    return price.toLocaleString() + ' د.ج';
  }

  formatDate(date?: string | Date): string {
    if (!date) return '---';
    return new Date(date).toLocaleDateString('ar-EG');
  }

  getCurrentMonth(): string {
    return new Date().toISOString().slice(0, 7);
  }

  getDefaultStartDate(): string {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  }

  getDefaultEndDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  generateAvailableMonths(): void {
    const months: { value: string; label: string }[] = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      const label = date.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long' });
      months.push({ value, label });
    }
    
    for (let i = 1; i <= 3; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() + i, 1);
      const value = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      const label = date.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long' });
      months.push({ value, label });
    }
    
    const uniqueMonths = months.filter((month, index, self) => 
      index === self.findIndex(m => m.value === month.value)
    );
    
    this.availableMonths = [
      { value: 'all', label: 'عرض الكل' },
      ...uniqueMonths
    ];
  }

  // ==================== COMMUNICATION ====================
  
  callParent(payment: Payment): void {
    const student = this.getStudentDetails(payment.student);
    if (student && student.parentPhone) {
      const phoneNumber = student.parentPhone;
      if (phoneNumber && phoneNumber.trim()) {
        let cleanPhone = phoneNumber.toString().trim();
        if (!cleanPhone.startsWith('+') && !cleanPhone.startsWith('0')) {
          cleanPhone = `+${cleanPhone}`;
        }
        window.location.href = `tel:${cleanPhone}`;
      } else {
        this.showError('رقم الهاتف غير متوفر لهذا الطالب');
      }
    } else {
      this.showError('لا يتوفر رقم هاتف لولي أمر هذا الطالب');
    }
  }

  // ==================== NAVIGATION ====================
  
  goBack(): void {
    this.router.navigate(['/home/lesson-management']);
  }

  openStudentDetails(studentId: string): void {
    this.router.navigate(['/home/student-management', studentId]);
  }

  // ==================== DIALOG POPUP CONTROLS ====================
  
  setActiveTab(tab: string): void {
    this.activeTab = tab;
    if (tab === 'attendance' && !this.attendanceRecords.length) {
      this.loadAttendance();
    }
    if (tab === 'payments') {
      this.loadPayments();
    }
  }

  changePage(page: number): void {
    this.currentPage = page;
  }

  // Add Student Popup
  openAddStudentPopup(): void {
    this.showAddStudentPopup = true;
    this.availableStudentSearchTerm = '';
    this.loadAvailableStudents();
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

  // Add Payment Popup
  openAddPaymentPopup(student?: Student): void {
    this.showAddPaymentPopup = true;
    if (student) {
      this.paymentForm.patchValue({ 
        studentId: student._id, 
        amount: this.lesson?.price || 0 
      });
    } else {
      this.paymentForm.patchValue({ studentId: '' });
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

  // Edit Payment Popup
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

  // Cancel Payment Popup
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

  // Delete Popup
  closeDeleteConfirmPopup(event?: MouseEvent): void {
    if (event && event.target === event.currentTarget) {
      this.showDeleteConfirmPopup = false;
      this.selectedPayment = undefined;
    } else if (!event) {
      this.showDeleteConfirmPopup = false;
      this.selectedPayment = undefined;
    }
  }

  // Mark Paid Popup
  closeMarkPaidPopup(event?: MouseEvent): void {
    if (event && event.target === event.currentTarget) {
      this.showMarkPaidPopup = false;
      this.selectedPayment = undefined;
    } else if (!event) {
      this.showMarkPaidPopup = false;
      this.selectedPayment = undefined;
    }
  }

  // ==================== TOAST MESSAGES ====================
  
  private showSuccess(message: string): void {
    this.successMessage = message;
    setTimeout(() => this.successMessage = '', 3000);
  }

  private showError(message: string): void {
    this.errorMessage = message;
    setTimeout(() => this.errorMessage = '', 3000);
  }

  // ==================== ATTENDANCE DETAILS ====================
  
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

  // ==================== PRINTING ====================
  
  printReceipt(payment: Payment): void {
    this.showSuccess('سيتم فتح نافذة الطباعة قريباً');
  }
}