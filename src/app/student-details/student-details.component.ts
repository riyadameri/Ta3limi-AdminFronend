// student-details.component.ts
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import Swal from 'sweetalert2';
import { environment } from '../../environments/environment.development';
import { PrinterService, ReceiptData, BulkReceiptData } from '../services/printer.service';

// ==================== INTERFACES ====================
interface Student {
  _id?: string;
  id?: string;
  name: string;
  studentId: string;
  academicYear: string;
  parentName: string;
  parentPhone: string;
  parentEmail?: string;
  birthDate?: string;
  registrationDate: Date;
  status: string;
  active: boolean;
  hasPaidRegistration: boolean;
  classes?: any[];
  new?: boolean;
}

interface Payment {
  _id?: string;
  id?: string;
  student: any;
  class?: any;
  amount: number;
  month: string;
  monthCode?: string;
  paymentDate?: Date;
  status: 'paid' | 'pending' | 'late';
  paymentMethod: string;
  invoiceNumber?: string;
  recordedBy?: any;
  notes?: string;
  createdAt?: Date;
  formattedDate?: string;
  createdAtFormatted?: string;
  className?: string;
  subject?: string;
  teacherName?: string;
  studentName?: string;
  studentId?: string;
  isLate?: boolean;
}

interface ClassPaymentGroup {
  classId: string;
  className: string;
  payments: Payment[];
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  expanded?: boolean;
}

interface Class {
  _id?: string;
  id?: string;
  name: string;
  subject: string;
  price: number;
  teacher?: any;
  schedule?: any[];
  paymentSystem: 'monthly' | 'rounds';
  roundSettings?: {
    sessionCount: number;
    sessionDuration: number;
    breakBetweenSessions: number;
  };
  students?: any[];
  academicYear?: string;
  classroom?: any;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface MonthlyPayment {
  id?: string;
  _id?: string;
  studentId: string;
  month: string;
  amount: number;
  status: string;
  paymentDate?: Date;
  dueDate?: Date;
  paymentMethod?: string;
  notes?: string;
  className?: string;
}

interface RoundPayment {
  id?: string;
  _id?: string;
  roundNumber: string;
  sessionCount: number;
  sessionPrice: number;
  totalAmount: number;
  startDate: Date;
  endDate: Date;
  status: string;
  statusText?: string;
  statusClass?: string;
  sessions: any[];
  notes?: string;
  student?: any;
  class?: any;
}

@Component({
  selector: 'app-student-details',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Modern Container -->
    <div class="modern-container">
      <!-- Loading Overlay -->
      <div class="loading-overlay" *ngIf="loading">
        <div class="spinner"></div>
        <p class="loading-text">جاري تحميل البيانات...</p>
      </div>

      <!-- Header Section -->
      <div class="header-section">
        <div class="header-content">
          <button class="back-btn" (click)="goBack()">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            <span class="back-text">رجوع</span>
          </button>
          <h1 class="page-title" *ngIf="student">
            <span class="title-icon">👨‍🎓</span>
            {{ student.name }}
          </h1>
          <div class="header-actions">
            <button class="action-btn print-btn" (click)="printStudentReport()">
              <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M6 18L18 18M6 14L18 14M6 10L18 10M6 6L18 6"/>
                <rect x="6" y="2" width="12" height="20" rx="1" ry="1"/>
              </svg>
              تقرير
            </button>
            <button class="action-btn whatsapp-btn" (click)="sendWhatsAppMessage()" *ngIf="student?.parentPhone">
              <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21z"/>
                <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1z"/>
                <path d="M14 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1z"/>
              </svg>
              واتساب
            </button>
          </div>
        </div>
      </div>

      <!-- Responsive Tabs -->
      <div class="tabs-container">
        <div class="tabs">
          <button [class.active]="activeTab === 'info'" (click)="setActiveTab('info')" class="tab-btn">
            <svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            <span>معلومات الطالب</span>
          </button>
          <button [class.active]="activeTab === 'classes'" (click)="setActiveTab('classes')" class="tab-btn">
            <svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
            </svg>
            <span>الحصص ({{ studentClasses.length }})</span>
          </button>
          <button [class.active]="activeTab === 'payments'" (click)="setActiveTab('payments')" class="tab-btn">
            <svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="6" width="20" height="12" rx="2"/>
              <path d="M12 12h.01"/>
              <path d="M16 12h.01"/>
              <path d="M8 12h.01"/>
            </svg>
            <span>المدفوعات</span>
          </button>
          <button [class.active]="activeTab === 'payment-systems'" (click)="setActiveTab('payment-systems')" class="tab-btn">
            <svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 6v6l4 2"/>
            </svg>
            <span>أنظمة الدفع</span>
          </button>
        </div>
      </div>

      <!-- Student Info Tab -->
      <div *ngIf="activeTab === 'info'" class="tab-content">
        <div class="info-grid" *ngIf="student">
          <div class="card profile-card">
            <div class="profile-header">
              <div class="profile-avatar">
                <span class="avatar-text">{{ student.name.charAt(0) }}</span>
              </div>
              <div class="profile-status">
                <span class="status-badge" [class.active]="student.active" [class.inactive]="!student.active">
                  {{ student.active ? 'نشط' : 'غير نشط' }}
                </span>
                <span class="status-badge registration" [class.paid]="student.hasPaidRegistration">
                  {{ student.hasPaidRegistration ? 'مسدد التسجيل' : 'غير مسدد' }}
                </span>
              </div>
            </div>
            <h2 class="profile-name">{{ student.name }}</h2>
            <p class="profile-id">رقم الطالب: {{ student.studentId }}</p>
            
            <div class="info-details">
              <div class="info-row">
                <span class="info-label">المستوى الدراسي:</span>
                <span class="info-value">{{ getAcademicYearName(student.academicYear) }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">ولي الأمر:</span>
                <span class="info-value">{{ student.parentName }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">رقم الهاتف:</span>
                <span class="info-value">{{ student.parentPhone }}</span>
                <button class="call-btn" (click)="makeCall(student.parentPhone)" title="اتصال">
                  <svg class="icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                </button>
                <button class="msg-btn" (click)="sendWhatsAppMessage()" title="واتساب">
                  <svg class="icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21z"/>
                  </svg>
                </button>
              </div>
              <div class="info-row" *ngIf="student.parentEmail">
                <span class="info-label">البريد الإلكتروني:</span>
                <span class="info-value">{{ student.parentEmail }}</span>
                <button class="email-btn" (click)="sendEmail(student.parentEmail)" title="بريد">
                  <svg class="icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="2" y="4" width="20" height="16" rx="2"/>
                    <path d="m22 7-10 7L2 7"/>
                  </svg>
                </button>
              </div>
              <div class="info-row" *ngIf="student.birthDate">
                <span class="info-label">تاريخ الميلاد:</span>
                <span class="info-value">{{ student.birthDate | date:'dd/MM/yyyy' }} (العمر: {{ calculateAge(student.birthDate) }} سنة)</span>
              </div>
              <div class="info-row">
                <span class="info-label">تاريخ التسجيل:</span>
                <span class="info-value">{{ student.registrationDate | date:'dd/MM/yyyy' }}</span>
              </div>
            </div>
          </div>

          <div class="card financial-card">
            <h3 class="card-title">الملخص المالي</h3>
            <div class="financial-stats">
              <div class="stat-item">
                <div class="stat-value">{{ getTotalPaid() | number:'1.0-0' }} د.ج</div>
                <div class="stat-label">المدفوع</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">{{ getTotalPending() | number:'1.0-0' }} د.ج</div>
                <div class="stat-label">المتبقي</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">{{ paymentHistory.length }}</div>
                <div class="stat-label">عدد الدفعات</div>
              </div>
            </div>
            <div class="progress-section">
              <div class="progress-label">
                <span>نسبة السداد</span>
                <span>{{ getPaymentPercentage() }}%</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill" [style.width.%]="getPaymentPercentage()"></div>
              </div>
            </div>
          </div>

          <div class="card absence-summary-card" *ngIf="absenceSummary?.monthly">
            <div class="card-header">
              <h3 class="card-title">
                <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                سجل الغيابات
              </h3>
              <button class="action-btn-sm info" (click)="openAbsencesModal()">
                عرض التفاصيل
              </button>
            </div>
            
            <div class="absence-stats-grid">
              <div class="absence-stat">
                <div class="stat-value text-success">{{ absenceSummary?.monthly?.present || 0 }}</div>
                <div class="stat-label">حاضر</div>
              </div>
              <div class="absence-stat">
                <div class="stat-value text-warning">{{ absenceSummary?.monthly?.late || 0 }}</div>
                <div class="stat-label">متأخر</div>
              </div>
              <div class="absence-stat">
                <div class="stat-value text-danger">{{ absenceSummary?.monthly?.absent || 0 }}</div>
                <div class="stat-label">غائب</div>
              </div>
              <div class="absence-stat">
                <div class="stat-value">{{ absenceSummary?.monthly?.attendanceRate || 100 }}%</div>
                <div class="stat-label">نسبة الحضور</div>
              </div>
            </div>
            
            <div class="progress-section">
              <div class="progress-label">
                <span>نسبة الحضور الشهرية</span>
                <span>{{ absenceSummary?.monthly?.attendanceRate || 100 }}%</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill" 
                     [style.width.%]="absenceSummary?.monthly?.attendanceRate || 100"
                     [ngClass]="{
                        'bg-success': (absenceSummary?.monthly?.attendanceRate || 100) >= 80,
                        'bg-warning': (absenceSummary?.monthly?.attendanceRate || 100) >= 60 && (absenceSummary?.monthly?.attendanceRate || 100) < 80,
                        'bg-danger': (absenceSummary?.monthly?.attendanceRate || 100) < 60
                     }">
                </div>
              </div>
            </div>
            
            <div class="absence-period">
              <small class="text-muted">{{ absenceSummary?.monthly?.monthName }}</small>
            </div>
          </div>
        </div>
      </div>

      <!-- Classes Tab -->
      <div *ngIf="activeTab === 'classes'" class="tab-content">
        <div class="classes-container">
          <div class="classes-header">
            <h3 class="section-title">الحصص المسجلة</h3>
            <button class="add-btn" (click)="openAddToLessonsModal()">
              <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              إضافة حصة
            </button>
          </div>

          <div class="classes-grid" *ngIf="studentClasses.length > 0; else noClasses">
            <div class="class-card" *ngFor="let classItem of studentClasses">
              <div class="class-header">
                <h4 class="class-name">{{ classItem.name }}</h4>
                <span class="payment-badge" [class.monthly]="classItem.paymentSystem === 'monthly'" [class.rounds]="classItem.paymentSystem === 'rounds'">
                  {{ classItem.paymentSystem === 'monthly' ? 'شهري' : 'جولات' }}
                </span>
              </div>
              <div class="class-details">
                <p><span class="detail-label">المادة:</span> {{ classItem.subject }}</p>
                <p><span class="detail-label">السعر الشهري:</span> {{ classItem.price | number:'1.0-0' }} د.ج</p>
                <p *ngIf="classItem.teacher"><span class="detail-label">الأستاذ:</span> {{ classItem.teacher.name }}</p>
                <p *ngIf="classItem.schedule?.length">
                  <span class="detail-label">المواعيد:</span>
                  <span class="schedule-list">
                    <span *ngFor="let s of classItem.schedule" class="schedule-badge">
                      {{ s.day }} {{ s.time }}
                    </span>
                  </span>
                </p>
              </div>
            </div>
          </div>
          <ng-template #noClasses>
            <div class="empty-state">
              <div class="empty-icon">📚</div>
              <p>لا توجد حصص مسجلة</p>
              <button class="add-btn-outline" (click)="openAddToLessonsModal()">تسجيل في حصة</button>
            </div>
          </ng-template>
        </div>
      </div>

      <!-- Payments Tab -->
      <div *ngIf="activeTab === 'payments'" class="tab-content">
        <div class="payments-container">
          <div class="payments-header">
            <h3 class="section-title">سجل المدفوعات</h3>
            <div class="header-actions">
              <button class="add-btn primary" (click)="openAddPaymentModal()">
                <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
                دفعة جديدة
              </button>
              <button class="add-btn secondary" (click)="openBulkPayConfirmation()" [disabled]="selectedPaymentsForBulkPay.length === 0">
                <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                دفع مختارة ({{ selectedPaymentsForBulkPay.length }})
              </button>
            </div>
          </div>

          <!-- Filter Controls -->
          <div class="filter-section">
            <div class="filter-group">
              <select [(ngModel)]="selectedMonthForGroupPay" (change)="selectPaymentsByMonth(selectedMonthForGroupPay)" class="filter-select">
                <option value="">جميع الأشهر</option>
                <option *ngFor="let m of getUniqueMonths()" [value]="m">{{ m }}</option>
              </select>
            </div>
            <div class="filter-group">
              <select [(ngModel)]="selectedClassForGroupPay" (change)="selectPaymentsByClass(selectedClassForGroupPay)" class="filter-select">
                <option value="all">جميع الحصص</option>
                <option *ngFor="let group of classPaymentGroups" [value]="group.classId">{{ group.className }}</option>
              </select>
            </div>
            <button class="filter-clear" (click)="selectAllPendingPayments()">تحديد الكل</button>
          </div>

          <!-- Payment Groups -->
          <div class="payment-groups">
            <div class="group-card" *ngFor="let group of classPaymentGroups" [class.expanded]="isClassGroupExpanded(group.classId)">
              <div class="group-header" (click)="toggleClassPaymentGroup(group.classId)">
                <div class="group-info">
                  <h4 class="group-name">{{ group.className }}</h4>
                  <div class="group-stats">
                    <span class="stat">المجموع: {{ group.totalAmount | number:'1.0-0' }} د.ج</span>
                    <span class="stat paid">مدفوع: {{ group.paidAmount | number:'1.0-0' }} د.ج</span>
                    <span class="stat pending">متبقي: {{ group.pendingAmount | number:'1.0-0' }} د.ج</span>
                  </div>
                </div>
                <div class="group-actions">
                  <div class="checkbox-wrapper" (click)="$event.stopPropagation()">
                    <input type="checkbox" 
                           [checked]="isGroupAllSelected(group)" 
                           (change)="toggleGroupSelection(group)"
                           class="group-checkbox">
                  </div>
                  <svg class="expand-icon" [class.rotated]="isClassGroupExpanded(group.classId)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M6 9l6 6 6-6"/>
                  </svg>
                </div>
              </div>
              <div class="group-payments" *ngIf="isClassGroupExpanded(group.classId)">
                <div class="payment-item" *ngFor="let payment of group.payments" 
                     [class.paid]="payment.status === 'paid'"
                     [class.pending]="payment.status === 'pending'"
                     [class.late]="payment.status === 'late'">
                  <div class="payment-checkbox">
                    <input type="checkbox" 
                           [checked]="isPaymentSelected(payment)" 
                           (change)="togglePaymentSelection(payment)"
                           [disabled]="payment.status === 'paid'"
                           class="payment-checkbox-input">
                  </div>
                  <div class="payment-info">
                    <div class="payment-month">{{ payment.month }}</div>
                    <div class="payment-details">
                      <span class="payment-amount">{{ payment.amount | number:'1.0-0' }} د.ج</span>
                      <span class="payment-status" [class]="getPaymentStatusClass(payment)">
                        {{ getPaymentStatusText(payment) }}
                      </span>
                    </div>
                    <div class="payment-meta" *ngIf="payment.paymentDate">
                      <span class="payment-date">{{ payment.paymentDate | date:'dd/MM/yyyy' }}</span>
                      <span class="payment-method">{{ getPaymentMethodLabel(payment.paymentMethod) }}</span>
                    </div>
                  </div>
                  <div class="payment-actions">
                    <button class="icon-btn print" (click)="printPaymentReceipt(payment)" title="طباعة">
                      <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M6 18L18 18M6 14L18 14M6 10L18 10M6 6L18 6"/>
                        <rect x="6" y="2" width="12" height="20" rx="1" ry="1"/>
                      </svg>
                    </button>
                    
                    <button class="icon-btn pay" *ngIf="payment.status !== 'paid'" (click)="payPayment(payment)" title="دفع">
                      <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                      </svg>
                    </button>
                    
                    <button class="icon-btn cancel" *ngIf="payment.status === 'paid'" (click)="cancelPayment(payment)" title="إلغاء الدفعة">
                      <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>

                    <button class="icon-btn delete" *ngIf="payment.status !== 'paid'" (click)="openDeleteConfirmModal(payment)" title="حذف">
                      <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="payments-summary" *ngIf="selectedPaymentsForBulkPay.length > 0">
            <div class="summary-info">
              <span>المختارة: {{ selectedPaymentsForBulkPay.length }} دفعة</span>
              <span>المبلغ الإجمالي: {{ getSelectedPaymentsTotal() | number:'1.0-0' }} د.ج</span>
            </div>
            <div class="summary-actions">
              <button class="btn-success" (click)="processBulkPaySelected()">دفع الجماعي</button>
              <button class="btn-secondary" (click)="selectedPaymentsForBulkPay = []">إلغاء التحديد</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Payment Systems Tab -->
      <div *ngIf="activeTab === 'payment-systems'" class="tab-content">
        <div class="payment-systems-container">
          <!-- Monthly Payments Section -->
          <div class="system-section">
            <h3 class="section-title">الدفعات الشهرية</h3>
            <div class="payments-table-responsive" *ngIf="studentMonthlyPayments.length > 0; else noMonthly">
              <table class="modern-table">
                <thead>
                  <tr>
                    <th>الشهر</th>
                    <th>المبلغ</th>
                    <th>الحالة</th>
                    <th>تاريخ الدفع</th>
                    <th>الإجراءات</th>
                   </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let payment of studentMonthlyPayments">
                    <td>{{ payment.month }}</td>
                    <td>{{ payment.amount | number:'1.0-0' }} د.ج</td>
                    <td>
                      <span class="status-badge-sm" [class.paid]="payment.status === 'paid'" [class.pending]="payment.status === 'pending'">
                        {{ payment.status === 'paid' ? 'مدفوع' : 'معلق' }}
                      </span>
                    </td>
                    <td>{{ payment.paymentDate ? (payment.paymentDate | date:'dd/MM/yyyy') : '—' }}</td>
                    <td>
                      <button class="icon-btn pay" *ngIf="payment.status !== 'paid'" (click)="payLatePayment(payment)" title="دفع">
                        <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M5 12h14M12 5l7 7-7 7"/>
                        </svg>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <ng-template #noMonthly>
              <div class="empty-state small">
                <p>لا توجد دفعات شهرية</p>
              </div>
            </ng-template>
          </div>

          <!-- Rounds Section -->
          <div class="system-section">
            <h3 class="section-title">الجولات</h3>
            <div class="rounds-grid" *ngIf="studentRounds.length > 0; else noRounds">
              <div class="round-card" *ngFor="let round of studentRounds">
                <div class="round-header">
                  <h4 class="round-number">جولة {{ round.roundNumber }}</h4>
                  <span class="round-status" [class]="round.statusClass">{{ round.statusText }}</span>
                </div>
                <div class="round-details">
                  <p><span class="detail-label">عدد الجلسات:</span> {{ round.sessionCount }}</p>
                  <p><span class="detail-label">سعر الجلسة:</span> {{ round.sessionPrice | number:'1.0-0' }} د.ج</p>
                  <p><span class="detail-label">المجموع:</span> {{ round.totalAmount | number:'1.0-0' }} د.ج</p>
                  <p><span class="detail-label">المدة:</span> {{ round.startDate | date:'dd/MM/yyyy' }} - {{ round.endDate | date:'dd/MM/yyyy' }}</p>
                </div>
                <div class="round-actions">
                  <button class="action-btn-sm" (click)="viewRoundDetails(round)">تفاصيل</button>
                  <button class="action-btn-sm success" *ngIf="round.status !== 'paid'" (click)="payRound(round)">دفع</button>
                </div>
              </div>
            </div>
            <ng-template #noRounds>
              <div class="empty-state small">
                <p>لا توجد جولات</p>
              </div>
            </ng-template>
          </div>
        </div>
      </div>
    </div>

    <!-- ==================== MODALS ==================== -->
    
    <!-- Add Payment Modal -->
    <div class="modal-overlay" *ngIf="showPaymentModal" (click)="closePaymentModal()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>إضافة دفعة جديدة</h3>
          <button class="close-btn" (click)="closePaymentModal()">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>المبلغ</label>
            <input type="number" [(ngModel)]="newPayment.amount" class="form-control" placeholder="المبلغ بالدينار">
          </div>
          <div class="form-group">
            <label>الشهر</label>
            <select [(ngModel)]="newPayment.month" class="form-control">
              <option *ngFor="let m of generateMonthOptions()" [value]="m">{{ m }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>طريقة الدفع</label>
            <select [(ngModel)]="newPayment.paymentMethod" class="form-control">
              <option *ngFor="let m of paymentMethods" [value]="m.value">{{ m.label }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>ملاحظات</label>
            <textarea [(ngModel)]="newPayment.notes" class="form-control" rows="2"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" (click)="closePaymentModal()">إلغاء</button>
          <button class="btn-primary" (click)="addPayment()">حفظ</button>
        </div>
      </div>
    </div>

    <!-- Edit Payment Modal -->
    <div class="modal-overlay" *ngIf="showEditPaymentModal" (click)="closeEditPaymentModal()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>تعديل الدفعة</h3>
          <button class="close-btn" (click)="closeEditPaymentModal()">✕</button>
        </div>
        <div class="modal-body" *ngIf="editingPayment">
          <div class="form-group">
            <label>المبلغ</label>
            <input type="number" [(ngModel)]="editingPayment.amount" class="form-control">
          </div>
          <div class="form-group">
            <label>طريقة الدفع</label>
            <select [(ngModel)]="editingPayment.paymentMethod" class="form-control">
              <option *ngFor="let m of paymentMethods" [value]="m.value">{{ m.label }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>ملاحظات</label>
            <textarea [(ngModel)]="editingPayment.notes" class="form-control" rows="2"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" (click)="closeEditPaymentModal()">إلغاء</button>
          <button class="btn-primary" (click)="updatePayment()">تحديث</button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div class="modal-overlay" *ngIf="showDeleteConfirmModal" (click)="closeDeleteConfirmModal()">
      <div class="modal-content confirm-modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>تأكيد الحذف</h3>
        </div>
        <div class="modal-body">
          <p>هل أنت متأكد من حذف هذه الدفعة؟</p>
          <p class="text-danger">لا يمكن التراجع عن هذا الإجراء.</p>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" (click)="closeDeleteConfirmModal()">إلغاء</button>
          <button class="btn-danger" (click)="deletePayment()">حذف</button>
        </div>
      </div>
    </div>

    <!-- Bulk Pay Confirmation Modal -->
    <div class="modal-overlay" *ngIf="showBulkPayConfirmation" (click)="closeBulkPayConfirmation()">
      <div class="modal-content large" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>تأكيد الدفع الجماعي</h3>
          <button class="close-btn" (click)="closeBulkPayConfirmation()">✕</button>
        </div>
        <div class="modal-body">
          <div class="confirmation-summary">
            <div class="summary-item">
              <span>عدد الدفعات:</span>
              <strong>{{ selectedPaymentsForBulkPay.length }}</strong>
            </div>
            <div class="summary-item">
              <span>المبلغ الإجمالي:</span>
              <strong>{{ getSelectedPaymentsTotal() | number:'1.0-0' }} د.ج</strong>
            </div>
            <div class="summary-item">
              <span>عدد الطلاب:</span>
              <strong>{{ getUniqueStudentsCount() }}</strong>
            </div>
          </div>
          <div class="form-group">
            <label>طريقة الدفع</label>
            <select [(ngModel)]="bulkPayment.paymentMethod" class="form-control">
              <option *ngFor="let m of paymentMethods" [value]="m.value">{{ m.label }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>خيار الطباعة</label>
            <div class="radio-group">
              <label class="radio-label">
                <input type="radio" [(ngModel)]="selectedReceiptOption" value="single">
                إيصال واحد لجميع الدفعات
              </label>
              <label class="radio-label">
                <input type="radio" [(ngModel)]="selectedReceiptOption" value="multiple">
                إيصالات منفصلة لكل دفعة
              </label>
            </div>
          </div>
          <div class="form-group">
            <label>ملاحظات</label>
            <textarea [(ngModel)]="bulkPayment.notes" class="form-control" rows="2"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" (click)="closeBulkPayConfirmation()">إلغاء</button>
          <button class="btn-primary" (click)="processBulkPaySelected()">تأكيد الدفع</button>
        </div>
      </div>
    </div>

    <!-- Add to Lessons Modal -->
    <div class="modal-overlay" *ngIf="showAddToLessonsModal" (click)="closeAddToLessonsModal()">
      <div class="modal-content large" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>تسجيل في حصص</h3>
          <button class="close-btn" (click)="closeAddToLessonsModal()">✕</button>
        </div>
        <div class="modal-body">
          <div class="filters-row">
            <div class="filter-group">
              <label>المادة</label>
              <select [(ngModel)]="filterSubject" (change)="filterAvailableClasses()" class="form-control">
                <option value="">الكل</option>
                <option *ngFor="let s of subjects" [value]="s">{{ s }}</option>
              </select>
            </div>
            <div class="filter-group">
              <label>المستوى</label>
              <select [(ngModel)]="filterLevel" (change)="filterAvailableClasses()" class="form-control">
                <option value="">الكل</option>
                <option *ngFor="let y of academicYears" [value]="y.value">{{ y.label }}</option>
              </select>
            </div>
          </div>

          <div class="available-classes" *ngIf="filteredAvailableClasses.length > 0; else noClassesAvailable">
            <div class="class-checkbox-item" *ngFor="let cls of filteredAvailableClasses">
              <div class="item-content">
                <div class="item-info">
                  <h4>{{ cls.name }}</h4>
                  <p>{{ cls.subject }} - {{ cls.price | number:'1.0-0' }} د.ج/شهر</p>
                  <p *ngIf="cls.teacher">الأستاذ: {{ cls.teacher.name }}</p>
                  <span class="payment-badge-sm" [class.monthly]="cls.paymentSystem === 'monthly'" [class.rounds]="cls.paymentSystem === 'rounds'">
                    {{ cls.paymentSystem === 'monthly' ? 'نظام شهري' : 'نظام جولات' }}
                  </span>
                </div>
                <div class="item-select">
                  <input type="checkbox" [checked]="isClassSelected(cls._id)" (change)="toggleClassSelection(cls)">
                </div>
              </div>
            </div>
          </div>
          <ng-template #noClassesAvailable>
            <div class="empty-state">
              <p>لا توجد حصص متاحة للتسجيل</p>
            </div>
          </ng-template>

          <div class="selected-summary" *ngIf="selectedClasses.length > 0">
            <h4>الحصص المختارة ({{ selectedClasses.length }})</h4>
            <div class="selected-list">
              <span class="selected-badge" *ngFor="let cls of selectedClasses">{{ cls.name }}</span>
            </div>
            <div class="total-amount">
              الإجمالي الشهري: {{ calculateMonthlyTotal() | number:'1.0-0' }} د.ج
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" (click)="closeAddToLessonsModal()">إلغاء</button>
          <button class="btn-primary" (click)="checkAndEnrollStudentToSelectedClasses()" [disabled]="selectedClasses.length === 0">تسجيل</button>
        </div>
      </div>
    </div>

    <!-- Round Selection Modal -->
    <div class="modal-overlay" *ngIf="showRoundSelectionModal" (click)="closeRoundSelectionModal()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>إعدادات الجولة</h3>
          <button class="close-btn" (click)="closeRoundSelectionModal()">✕</button>
        </div>
        <div class="modal-body" *ngIf="selectedClassForRounds">
          <p class="class-info">الحصة: <strong>{{ selectedClassForRounds.name }}</strong></p>
          <div class="form-group">
            <label>عدد الجلسات</label>
            <input type="number" [(ngModel)]="roundSelection.sessionCount" (change)="updateRoundTotalAmount()" class="form-control" min="1">
          </div>
          <div class="form-group">
            <label>سعر الجلسة</label>
            <input type="number" [(ngModel)]="roundSelection.sessionPrice" (change)="updateRoundTotalAmount()" class="form-control">
          </div>
          <div class="form-group">
            <label>تاريخ البداية</label>
            <input type="date" [(ngModel)]="roundSelection.startDate" class="form-control">
          </div>
          <div class="form-group">
            <label>تاريخ النهاية</label>
            <input type="date" [(ngModel)]="roundSelection.endDate" class="form-control">
          </div>
          <div class="total-info">
            <span>المبلغ الإجمالي:</span>
            <strong>{{ roundSelection.totalAmount | number:'1.0-0' }} د.ج</strong>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" (click)="closeRoundSelectionModal()">إلغاء</button>
          <button class="btn-primary" (click)="confirmRoundSelection()">تأكيد</button>
        </div>
      </div>
    </div>

    <!-- Absences Modal -->
    <div class="modal-overlay" *ngIf="showAbsencesModal" (click)="closeAbsencesModal()">
      <div class="modal-content large" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            سجل غيابات الطالب: {{ student?.name }}
          </h3>
          <button class="close-btn" (click)="closeAbsencesModal()">✕</button>
        </div>
        
        <div class="modal-body">
          <!-- Summary Stats -->
          <div class="summary-stats" *ngIf="absenceSummary">
            <div class="stat-card">
              <div class="stat-value">{{ absenceSummary.totalClasses || 0 }}</div>
              <div class="stat-label">إجمالي الحصص</div>
            </div>
            <div class="stat-card">
              <div class="stat-value text-success">{{ absenceSummary.present || 0 }}</div>
              <div class="stat-label">حاضر</div>
            </div>
            <div class="stat-card">
              <div class="stat-value text-warning">{{ absenceSummary.late || 0 }}</div>
              <div class="stat-label">متأخر</div>
            </div>
            <div class="stat-card">
              <div class="stat-value text-danger">{{ absenceSummary.absent || 0 }}</div>
              <div class="stat-label">غائب</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ absenceSummary.attendanceRate || 100 }}%</div>
              <div class="stat-label">نسبة الحضور</div>
            </div>
          </div>
          
          <!-- Filter Controls -->
          <div class="filter-row">
            <div class="filter-group">
              <label>من تاريخ</label>
              <input type="date" [(ngModel)]="absenceFilterStartDate" class="form-control" (change)="filterAbsencesByDate()">
            </div>
            <div class="filter-group">
              <label>إلى تاريخ</label>
              <input type="date" [(ngModel)]="absenceFilterEndDate" class="form-control" (change)="filterAbsencesByDate()">
            </div>
            <div class="filter-group">
              <label>&nbsp;</label>
              <button class="btn-secondary" (click)="resetAbsenceFilter()">إعادة تعيين</button>
            </div>
            <div class="filter-group">
              <label>&nbsp;</label>
              <button class="btn-success" (click)="exportAbsencesToExcel()" [disabled]="studentAbsences.length === 0">
                <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                تصدير Excel
              </button>
            </div>
          </div>
          
          <!-- Loading State -->
          <div *ngIf="loadingAbsences" class="loading-state">
            <div class="spinner-sm"></div>
            <p>جاري تحميل سجل الغيابات...</p>
          </div>
          
          <!-- Absences Table -->
          <div *ngIf="!loadingAbsences && studentAbsences.length > 0" class="table-responsive">
            <table class="modern-table">
              <thead>
                <tr>
                  <th>التاريخ</th>
                  <th>اليوم</th>
                  <th>الحصة</th>
                  <th>المادة</th>
                  <th>الأستاذ</th>
                  <th>الوقت</th>
                  <th>الحالة</th>
                  <th>ملاحظات</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let absence of studentAbsences">
                  <td>{{ absence.dateFormatted }}</td>
                  <td>{{ absence.dayName }}</td>
                  <td>{{ absence.className }}</td>
                  <td>{{ absence.subject }}</td>
                  <td>{{ absence.teacherName }}</td>
                  <td>{{ absence.startTime }} - {{ absence.endTime }}</td>
                  <td>
                    <span class="status-badge-sm" [class]="getAbsenceStatusClass(absence.status)">
                      {{ getAbsenceStatusText(absence.status) }}
                    </span>
                    <span *ngIf="absence.autoMarked" class="auto-badge" title="تم التسجيل تلقائياً">آلي</span>
                   </td>
                  <td>{{ absence.notes || '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <!-- Empty State -->
          <div *ngIf="!loadingAbsences && studentAbsences.length === 0" class="empty-state">
            <div class="empty-icon">📋</div>
            <p>لا توجد سجلات غياب لهذا الطالب</p>
            <p class="text-muted small">جميع الحصص مسجلة كحضور</p>
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="btn-secondary" (click)="closeAbsencesModal()">إغلاق</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Modern CSS Variables */
    :host {
      --primary: #4361ee;
      --primary-dark: #3a56d4;
      --secondary: #2a9d8f;
      --danger: #e63946;
      --warning: #f4a261;
      --success: #2a9d8f;
      --gray-100: #f8f9fa;
      --gray-200: #e9ecef;
      --gray-300: #dee2e6;
      --gray-400: #ced4da;
      --gray-500: #adb5bd;
      --gray-600: #6c757d;
      --gray-700: #495057;
      --gray-800: #343a40;
      --gray-900: #212529;
      --shadow-sm: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08);
      --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);
      --shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05);
      --radius-sm: 8px;
      --radius-md: 12px;
      --radius-lg: 16px;
      --transition: all 0.2s ease;
    }

    /* Base Styles */
    .modern-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 1rem;
      background: var(--gray-100);
      min-height: 100vh;
    }

    /* Loading Overlay */
    .loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.7);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }
    .spinner {
      width: 50px;
      height: 50px;
      border: 4px solid rgba(255,255,255,0.3);
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .loading-text {
      color: white;
      margin-top: 1rem;
    }

    /* Header */
    .header-section {
      background: white;
      border-radius: var(--radius-lg);
      padding: 1rem 1.5rem;
      margin-bottom: 1.5rem;
      box-shadow: var(--shadow-sm);
    }
    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .back-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: none;
      border: none;
      color: var(--gray-600);
      cursor: pointer;
      font-size: 0.9rem;
      padding: 0.5rem;
      border-radius: var(--radius-sm);
      transition: var(--transition);
    }
    .back-btn:hover {
      background: var(--gray-100);
      color: var(--gray-800);
    }
    .page-title {
      font-size: 1.5rem;
      font-weight: 600;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--gray-800);
    }
    .title-icon {
      font-size: 1.8rem;
    }
    .header-actions {
      display: flex;
      gap: 0.75rem;
    }
    .action-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border: none;
      border-radius: var(--radius-sm);
      cursor: pointer;
      font-size: 0.85rem;
      font-weight: 500;
      transition: var(--transition);
    }
    .print-btn {
      background: var(--gray-200);
      color: var(--gray-700);
    }
    .print-btn:hover {
      background: var(--gray-300);
    }
    .whatsapp-btn {
      background: #25D366;
      color: white;
    }
    .whatsapp-btn:hover {
      background: #20b359;
    }

    /* Tabs */
    .tabs-container {
      background: white;
      border-radius: var(--radius-lg);
      margin-bottom: 1.5rem;
      box-shadow: var(--shadow-sm);
      overflow-x: auto;
    }
    .tabs {
      display: flex;
      gap: 0.25rem;
      padding: 0.5rem;
    }
    .tab-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.25rem;
      background: none;
      border: none;
      border-radius: var(--radius-md);
      cursor: pointer;
      font-size: 0.9rem;
      font-weight: 500;
      color: var(--gray-600);
      transition: var(--transition);
      white-space: nowrap;
    }
    .tab-btn.active {
      background: var(--primary);
      color: white;
    }
    .tab-btn:hover:not(.active) {
      background: var(--gray-100);
    }
    .tab-icon {
      width: 1.2rem;
      height: 1.2rem;
    }

    /* Tab Content */
    .tab-content {
      animation: fadeIn 0.3s ease;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Info Grid */
    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 1.5rem;
    }
    .card {
      background: white;
      border-radius: var(--radius-lg);
      padding: 1.5rem;
      box-shadow: var(--shadow-sm);
    }
    .profile-card {
      text-align: center;
    }
    .profile-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }
    .profile-avatar {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, var(--primary), var(--primary-dark));
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .avatar-text {
      font-size: 2.5rem;
      font-weight: 600;
      color: white;
    }
    .profile-status {
      display: flex;
      gap: 0.5rem;
    }
    .status-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 500;
    }
    .status-badge.active {
      background: #d4edda;
      color: #155724;
    }
    .status-badge.inactive {
      background: #f8d7da;
      color: #721c24;
    }
    .status-badge.registration.paid {
      background: #d1ecf1;
      color: #0c5460;
    }
    .profile-name {
      font-size: 1.5rem;
      font-weight: 600;
      margin: 0.5rem 0;
    }
    .profile-id {
      color: var(--gray-500);
      margin-bottom: 1.5rem;
    }
    .info-details {
      text-align: right;
    }
    .info-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 0;
      border-bottom: 1px solid var(--gray-200);
    }
    .info-label {
      color: var(--gray-600);
      font-size: 0.85rem;
    }
    .info-value {
      font-weight: 500;
      color: var(--gray-800);
    }
    .call-btn, .msg-btn, .email-btn {
      background: none;
      border: none;
      cursor: pointer;
      padding: 0.25rem;
      border-radius: var(--radius-sm);
      transition: var(--transition);
    }
    .call-btn:hover { background: #d4edda; color: #155724; }
    .msg-btn:hover { background: #d4edda; color: #25D366; }
    .email-btn:hover { background: #d1ecf1; color: #0c5460; }

    /* Financial Card */
    .financial-card .card-title {
      font-size: 1.1rem;
      margin-bottom: 1rem;
      color: var(--gray-700);
    }
    .financial-stats {
      display: flex;
      justify-content: space-between;
      margin-bottom: 1.5rem;
    }
    .stat-item {
      text-align: center;
    }
    .stat-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--primary);
    }
    .stat-label {
      font-size: 0.75rem;
      color: var(--gray-500);
    }
    .progress-section {
      margin-top: 1rem;
    }
    .progress-label {
      display: flex;
      justify-content: space-between;
      font-size: 0.8rem;
      margin-bottom: 0.5rem;
    }
    .progress-bar {
      height: 8px;
      background: var(--gray-200);
      border-radius: 4px;
      overflow: hidden;
    }
    .progress-fill {
      height: 100%;
      border-radius: 4px;
      transition: width 0.3s ease;
    }
    .progress-fill.bg-success { background: var(--success); }
    .progress-fill.bg-warning { background: var(--warning); }
    .progress-fill.bg-danger { background: var(--danger); }

    /* Absences Styles */
    .absence-summary-card {
      margin-top: 0;
    }
    .absence-summary-card .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .card-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 1.1rem;
      margin: 0;
    }
    .absence-stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .absence-stat {
      text-align: center;
      padding: 0.75rem;
      background: var(--gray-50);
      border-radius: var(--radius-md);
    }
    .absence-stat .stat-value {
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: 0.25rem;
    }
    .absence-stat .stat-label {
      font-size: 0.75rem;
      color: var(--gray-500);
    }
    .text-success { color: var(--success); }
    .text-warning { color: var(--warning); }
    .text-danger { color: var(--danger); }
    .absence-period {
      margin-top: 1rem;
      text-align: center;
    }
    .action-btn-sm {
      padding: 0.4rem 0.8rem;
      border: none;
      border-radius: var(--radius-sm);
      cursor: pointer;
      font-size: 0.75rem;
    }
    .action-btn-sm.info {
      background: #e3f2fd;
      color: #1976d2;
    }
    .action-btn-sm.success {
      background: var(--success);
      color: white;
    }

    /* Classes Grid */
    .classes-header, .payments-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .section-title {
      font-size: 1.2rem;
      font-weight: 600;
      color: var(--gray-800);
      margin: 0;
    }
    .add-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.6rem 1.2rem;
      background: var(--primary);
      color: white;
      border: none;
      border-radius: var(--radius-sm);
      cursor: pointer;
      font-size: 0.85rem;
      font-weight: 500;
      transition: var(--transition);
    }
    .add-btn.primary { background: var(--primary); }
    .add-btn.secondary { background: var(--secondary); }
    .add-btn:hover { opacity: 0.9; transform: translateY(-1px); }
    .add-btn-outline {
      background: none;
      border: 1px solid var(--primary);
      color: var(--primary);
      padding: 0.5rem 1rem;
      border-radius: var(--radius-sm);
      cursor: pointer;
    }
    .classes-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1rem;
    }
    .class-card {
      background: white;
      border-radius: var(--radius-md);
      padding: 1rem;
      box-shadow: var(--shadow-sm);
      transition: var(--transition);
    }
    .class-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }
    .class-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
    }
    .class-name {
      font-size: 1rem;
      font-weight: 600;
      margin: 0;
    }
    .payment-badge {
      padding: 0.25rem 0.5rem;
      border-radius: 20px;
      font-size: 0.7rem;
      font-weight: 500;
    }
    .payment-badge.monthly {
      background: #e3f2fd;
      color: #1976d2;
    }
    .payment-badge.rounds {
      background: #fff3e0;
      color: #e65100;
    }
    .class-details p {
      margin: 0.5rem 0;
      font-size: 0.85rem;
      color: var(--gray-600);
    }
    .detail-label {
      font-weight: 500;
      color: var(--gray-700);
    }
    .schedule-list {
      display: inline-flex;
      flex-wrap: wrap;
      gap: 0.25rem;
    }
    .schedule-badge {
      background: var(--gray-100);
      padding: 0.2rem 0.5rem;
      border-radius: 12px;
      font-size: 0.7rem;
    }

    /* Payments */
    .filter-section {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      margin-bottom: 1.5rem;
      padding: 1rem;
      background: white;
      border-radius: var(--radius-md);
    }
    .filter-group {
      flex: 1;
      min-width: 150px;
    }
    .filter-select {
      width: 100%;
      padding: 0.6rem;
      border: 1px solid var(--gray-300);
      border-radius: var(--radius-sm);
      background: white;
    }
    .filter-clear {
      padding: 0.6rem 1rem;
      background: var(--gray-200);
      border: none;
      border-radius: var(--radius-sm);
      cursor: pointer;
    }
    .group-card {
      background: white;
      border-radius: var(--radius-md);
      margin-bottom: 1rem;
      overflow: hidden;
      box-shadow: var(--shadow-sm);
    }
    .group-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      cursor: pointer;
      transition: var(--transition);
    }
    .group-header:hover {
      background: var(--gray-50);
    }
    .group-info {
      flex: 1;
    }
    .group-name {
      font-size: 1rem;
      font-weight: 600;
      margin: 0 0 0.5rem 0;
    }
    .group-stats {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      font-size: 0.8rem;
    }
    .stat.paid { color: var(--success); }
    .stat.pending { color: var(--warning); }
    .group-actions {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .expand-icon {
      width: 1.2rem;
      height: 1.2rem;
      transition: transform 0.3s;
    }
    .expand-icon.rotated {
      transform: rotate(180deg);
    }
    .group-payments {
      border-top: 1px solid var(--gray-200);
    }
    .payment-item {
      display: flex;
      align-items: center;
      padding: 1rem;
      border-bottom: 1px solid var(--gray-100);
      transition: var(--transition);
    }
    .payment-item:hover {
      background: var(--gray-50);
    }
    .payment-item.paid {
      background: #f8f9fa;
      opacity: 0.8;
    }
    .payment-checkbox {
      margin-left: 1rem;
    }
    .payment-info {
      flex: 1;
    }
    .payment-month {
      font-weight: 500;
      margin-bottom: 0.25rem;
    }
    .payment-details {
      display: flex;
      gap: 1rem;
      font-size: 0.85rem;
    }
    .payment-status {
      padding: 0.2rem 0.5rem;
      border-radius: 12px;
      font-size: 0.7rem;
    }
    .payment-status.bg-success { background: #d4edda; color: #155724; }
    .payment-status.bg-warning { background: #fff3cd; color: #856404; }
    .payment-status.bg-danger { background: #f8d7da; color: #721c24; }
    .payment-meta {
      font-size: 0.7rem;
      color: var(--gray-500);
      margin-top: 0.25rem;
    }
    .payment-actions {
      display: flex;
      gap: 0.5rem;
    }
    .icon-btn {
      background: none;
      border: none;
      cursor: pointer;
      padding: 0.5rem;
      border-radius: var(--radius-sm);
      transition: var(--transition);
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .icon-btn.print {
      color: var(--primary);
    }
    .icon-btn.print:hover {
      background: #e3f2fd;
      color: #1976d2;
    }
    .icon-btn.pay {
      color: var(--success);
    }
    .icon-btn.pay:hover {
      background: #d4edda;
      color: #155724;
    }
    .icon-btn.cancel {
      color: var(--warning);
    }
    .icon-btn.cancel:hover {
      background: #fff3cd;
      color: #856404;
    }
    .icon-btn.delete {
      color: var(--danger);
    }
    .icon-btn.delete:hover {
      background: #f8d7da;
      color: #721c24;
    }
    .payments-summary {
      background: var(--primary);
      color: white;
      padding: 1rem;
      border-radius: var(--radius-md);
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
      margin-top: 1rem;
    }
    .summary-info {
      display: flex;
      gap: 1rem;
    }
    .btn-success {
      background: var(--success);
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: var(--radius-sm);
      cursor: pointer;
    }
    .btn-secondary {
      background: rgba(255,255,255,0.2);
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: var(--radius-sm);
      cursor: pointer;
    }

    /* Payment Systems Tab */
    .payment-systems-container {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }
    .system-section {
      background: white;
      border-radius: var(--radius-lg);
      padding: 1.5rem;
      box-shadow: var(--shadow-sm);
    }
    .modern-table {
      width: 100%;
      border-collapse: collapse;
    }
    .modern-table th,
    .modern-table td {
      padding: 0.75rem;
      text-align: right;
      border-bottom: 1px solid var(--gray-200);
    }
    .modern-table th {
      background: var(--gray-100);
      font-weight: 600;
    }
    .rounds-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1rem;
    }
    .round-card {
      background: var(--gray-50);
      border-radius: var(--radius-md);
      padding: 1rem;
    }
    .round-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }
    .round-number {
      font-weight: 600;
      margin: 0;
    }
    .round-details p {
      margin: 0.5rem 0;
      font-size: 0.85rem;
    }
    .round-actions {
      display: flex;
      gap: 0.5rem;
      margin-top: 1rem;
    }

    /* Empty States */
    .empty-state {
      text-align: center;
      padding: 3rem;
      color: var(--gray-500);
    }
    .empty-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }
    .empty-state.small {
      padding: 1.5rem;
    }

    /* Modals */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
    }
    .modal-content {
      background: white;
      border-radius: var(--radius-lg);
      width: 100%;
      max-width: 500px;
      max-height: 90vh;
      overflow-y: auto;
    }
    .modal-content.large {
      max-width: 1000px;
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      border-bottom: 1px solid var(--gray-200);
    }
    .modal-header h3 {
      margin: 0;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .close-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: var(--gray-500);
    }
    .modal-body {
      padding: 1.5rem;
    }
    .modal-footer {
      padding: 1rem 1.5rem;
      border-top: 1px solid var(--gray-200);
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
    }
    .form-group {
      margin-bottom: 1rem;
    }
    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
    }
    .form-control {
      width: 100%;
      padding: 0.6rem;
      border: 1px solid var(--gray-300);
      border-radius: var(--radius-sm);
    }
    .radio-group {
      display: flex;
      gap: 1rem;
    }
    .radio-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .btn-primary {
      background: var(--primary);
      color: white;
      border: none;
      padding: 0.6rem 1.2rem;
      border-radius: var(--radius-sm);
      cursor: pointer;
    }
    .btn-danger {
      background: var(--danger);
      color: white;
      border: none;
      padding: 0.6rem 1.2rem;
      border-radius: var(--radius-sm);
      cursor: pointer;
    }
    .confirmation-summary {
      background: var(--gray-100);
      padding: 1rem;
      border-radius: var(--radius-md);
      margin-bottom: 1rem;
    }
    .summary-item {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.5rem;
    }
    .filters-row {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
    }
    .available-classes {
      max-height: 400px;
      overflow-y: auto;
    }
    .class-checkbox-item {
      padding: 0.75rem;
      border-bottom: 1px solid var(--gray-200);
    }
    .item-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .item-info h4 {
      margin: 0 0 0.25rem 0;
    }
    .item-info p {
      margin: 0.25rem 0;
      font-size: 0.85rem;
      color: var(--gray-600);
    }
    .payment-badge-sm {
      display: inline-block;
      padding: 0.2rem 0.5rem;
      border-radius: 12px;
      font-size: 0.7rem;
    }
    .selected-summary {
      margin-top: 1rem;
      padding: 1rem;
      background: var(--gray-100);
      border-radius: var(--radius-md);
    }
    .selected-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin: 0.5rem 0;
    }
    .selected-badge {
      background: var(--primary);
      color: white;
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.8rem;
    }
    .total-amount {
      font-weight: 600;
      margin-top: 0.5rem;
    }
    .class-info {
      margin-bottom: 1rem;
    }
    .total-info {
      margin-top: 1rem;
      padding: 0.75rem;
      background: var(--gray-100);
      border-radius: var(--radius-md);
      text-align: center;
    }
    .text-danger {
      color: var(--danger);
    }

    /* Absences Modal Styles */
    .summary-stats {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 0.75rem;
      margin-bottom: 1.5rem;
    }
    .summary-stats .stat-card {
      text-align: center;
      padding: 0.75rem;
      background: var(--gray-50);
      border-radius: var(--radius-md);
    }
    .summary-stats .stat-card .stat-value {
      font-size: 1.25rem;
      font-weight: 700;
    }
    .filter-row {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      margin-bottom: 1.5rem;
      padding: 1rem;
      background: var(--gray-50);
      border-radius: var(--radius-md);
    }
    .filter-row .filter-group {
      flex: 1;
      min-width: 150px;
    }
    .filter-row label {
      display: block;
      margin-bottom: 0.25rem;
      font-size: 0.8rem;
      color: var(--gray-600);
    }
    .loading-state {
      text-align: center;
      padding: 2rem;
    }
    .spinner-sm {
      width: 30px;
      height: 30px;
      border: 3px solid var(--gray-200);
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }
    .status-badge-sm {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      border-radius: 12px;
      font-size: 0.7rem;
      font-weight: 500;
    }
    .status-badge-sm.bg-success {
      background: #d4edda;
      color: #155724;
    }
    .status-badge-sm.bg-warning {
      background: #fff3cd;
      color: #856404;
    }
    .status-badge-sm.bg-danger {
      background: #f8d7da;
      color: #721c24;
    }
    .auto-badge {
      display: inline-block;
      background: #e3f2fd;
      color: #1976d2;
      font-size: 0.65rem;
      padding: 0.15rem 0.4rem;
      border-radius: 10px;
      margin-right: 0.5rem;
    }

    /* Icons */
    .icon, .icon-sm, .icon-xs {
      stroke-width: 2;
      stroke: currentColor;
      fill: none;
    }
    .icon { width: 1.2rem; height: 1.2rem; }
    .icon-sm { width: 1rem; height: 1rem; }
    .icon-xs { width: 0.9rem; height: 0.9rem; }

    /* Checkbox Styles */
    .checkbox-wrapper input,
    .payment-checkbox-input,
    .item-select input {
      width: 18px;
      height: 18px;
      cursor: pointer;
    }
    .group-checkbox {
      width: 20px;
      height: 20px;
      cursor: pointer;
    }

    /* Table Responsive */
    .table-responsive {
      overflow-x: auto;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .modern-container {
        padding: 0.75rem;
      }
      .header-content {
        flex-direction: column;
        align-items: flex-start;
      }
      .tabs {
        flex-wrap: wrap;
      }
      .tab-btn {
        flex: 1;
        justify-content: center;
      }
      .info-grid {
        grid-template-columns: 1fr;
      }
      .classes-grid {
        grid-template-columns: 1fr;
      }
      .group-stats {
        flex-direction: column;
        gap: 0.25rem;
      }
      .payment-item {
        flex-wrap: wrap;
      }
      .payment-actions {
        margin-top: 0.5rem;
        width: 100%;
        justify-content: flex-end;
      }
      .filters-row {
        flex-direction: column;
      }
      .modal-content {
        margin: 1rem;
      }
      .summary-stats {
        grid-template-columns: repeat(2, 1fr);
      }
      .absence-stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }
      .filter-row {
        flex-direction: column;
      }
    }
  `]
})
export class StudentDetailsComponent implements OnInit {
  private apiUrl = environment.apiUrl;
  
  // Core Data
  student: Student | null = null;
  loading: boolean = false;
  activeTab: string = 'info';
  studentClasses: any[] = [];
  paymentHistory: Payment[] = [];
  
  // Modal Flags
  showPaymentModal: boolean = false;
  showEditPaymentModal: boolean = false;
  showDeleteConfirmModal: boolean = false;
  showBulkPaymentModal: boolean = false;
  showClassPaymentsModal: boolean = false;
  showBulkPayConfirmation: boolean = false;
  showAddToLessonsModal: boolean = false;
  showRoundSelectionModal: boolean = false;
  showAbsencesModal: boolean = false;
  
  // Payment Data
  classPaymentGroups: ClassPaymentGroup[] = [];
  selectedPaymentsForBulkPay: Payment[] = [];
  selectedMonthForGroupPay: string = '';
  selectedClassForGroupPay: string = 'all';
  
  newPayment: any = {
    student: '',
    amount: 0,
    month: '',
    paymentMethod: 'cash',
    notes: ''
  };
  
  bulkPayment: any = {
    studentIds: [],
    classId: '',
    amount: 0,
    month: '',
    paymentMethod: 'cash',
    notes: 'دفعة جماعية'
  };
  
  editingPayment: Payment | null = null;
  paymentToDelete: Payment | null = null;
  selectedClassForPayments: any = null;
  classPayments: Payment[] = [];
  
  // Class Enrollment
  availableClasses: Class[] = [];
  filteredAvailableClasses: Class[] = [];
  alreadyEnrolledClasses: Class[] = [];
  selectedClasses: Class[] = [];
  loadingAvailableClasses: boolean = false;
  isEnrolling: boolean = false;
  selectedClassForRounds: Class | null = null;
  
  roundSelection: any = {
    roundNumber: '',
    sessionCount: 8,
    sessionPrice: 0,
    totalAmount: 0,
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    notes: ''
  };
  
  // Payment Systems
  studentMonthlyPayments: MonthlyPayment[] = [];
  studentRounds: RoundPayment[] = [];
  
  // Filters
  filterSubject: string = '';
  filterLevel: string = '';
  selectedReceiptOption: 'single' | 'multiple' = 'single';
  
  // Absences Data
  studentAbsences: any[] = [];
  absenceSummary: any = null;
  loadingAbsences: boolean = false;
  absenceFilterStartDate: string = '';
  absenceFilterEndDate: string = '';
  absenceLimit: number = 50;
  
  // Static Data
  months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  
  paymentMethods = [
    { value: 'cash', label: 'نقداً' },
    { value: 'bank', label: 'تحويل بنكي' },
    { value: 'card', label: 'بطاقة إئتمان' },
    { value: 'check', label: 'شيك' },
    { value: 'online', label: 'دفع إلكتروني' },
    { value: 'mobile', label: 'دفع محمول' }
  ];
  
  academicYears = [
    { value: '1AS', label: 'الأولى ثانوي' }, { value: '2AS', label: 'الثانية ثانوي' }, { value: '3AS', label: 'الثالثة ثانوي' },
    { value: '1MS', label: 'الأولى متوسط' }, { value: '2MS', label: 'الثانية متوسط' }, { value: '3MS', label: 'الثالثة متوسط' },
    { value: '4MS', label: 'الرابعة متوسط' }, { value: '1AP', label: 'الأولى ابتدائي' }, { value: '2AP', label: 'الثانية ابتدائي' },
    { value: '3AP', label: 'الثالثة ابتدائي' }, { value: '4AP', label: 'الرابعة ابتدائي' }, { value: '5AP', label: 'الخامسة ابتدائي' }
  ];
  
  subjects = ['رياضيات', 'فيزياء', 'علوم', 'لغة عربية', 'لغة فرنسية', 'لغة انجليزية', 'تاريخ', 'جغرافيا', 'فلسفة', 'إعلام آلي'];
  allStudents: Student[] = [];
  selectedStudents: Student[] = [];
  filteredStudents: Student[] = [];
  studentSearchTerm: string = '';
  classForBulkPayment: Class | null = null;
  isProcessingBulkPayment: boolean = false;
  bulkPaymentProgress: number = 0;
  bulkPaymentResults: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private printerService: PrinterService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadStudentDetails();
    this.loadAllStudents();
    this.roundSelection.roundNumber = `RND-${Date.now().toString().slice(-6)}`;
    this.loadAbsenceSummary();
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // ==================== LOAD DATA METHODS ====================
  loadStudentDetails(): void {
    const studentId = this.route.snapshot.paramMap.get('id');
    if (!studentId) {
      this.router.navigate(['/home/students-management']);
      return;
    }
    this.loading = true;
    this.http.get<any>(`${this.apiUrl}/students/${studentId}`, { headers: this.getHeaders() }).subscribe({
      next: (student) => {
        this.student = student;
        this.newPayment.student = this.getStudentId();
        this.loadStudentClasses(studentId);
        this.loadPaymentHistory(studentId);
        this.loadStudentPaymentSystems(studentId);
        this.loadAbsenceSummary();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading student details:', error);
        Swal.fire('خطأ', 'فشل في تحميل بيانات الطالب', 'error');
        this.router.navigate(['/home/students-management']);
        this.loading = false;
      }
    });
  }

  loadAllStudents(): void {
    this.http.get<any>(`${this.apiUrl}/students`, { headers: this.getHeaders() }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.allStudents = response.data;
          this.filteredStudents = [...this.allStudents];
        } else {
          this.allStudents = [];
          this.filteredStudents = [];
        }
      },
      error: (error) => {
        console.error('Error loading all students:', error);
        this.allStudents = [];
        this.filteredStudents = [];
      }
    });
  }

  loadStudentClasses(studentId: string): void {
    this.http.get<any>(`${this.apiUrl}/students/${studentId}`, { headers: this.getHeaders() }).subscribe({
      next: (student) => {
        this.studentClasses = student.classes || [];
      },
      error: (error) => {
        console.error('Error loading student classes:', error);
        this.studentClasses = [];
      }
    });
  }

  loadPaymentHistory(studentId: string): void {
    console.log('Loading payment history for student:', studentId);
    this.http.get<any>(`${this.apiUrl}/payments/student/${studentId}`, { headers: this.getHeaders() }).subscribe({
      next: (response) => {
        if (response.success && response.payments) {
          this.paymentHistory = response.payments;
          this.classPaymentGroups = this.groupPaymentsByClass(response.payments);
        } else {
          this.paymentHistory = [];
          this.classPaymentGroups = [];
        }
      },
      error: (error) => {
        console.error('Error loading payment history:', error);
        this.paymentHistory = [];
        this.classPaymentGroups = [];
        Swal.fire('خطأ', 'فشل في تحميل سجل المدفوعات', 'error');
      }
    });
  }

  loadStudentPaymentSystems(studentId: string): void {
    this.http.get<any>(`${this.apiUrl}/payments/student/${studentId}`, { headers: this.getHeaders() }).subscribe({
      next: (response) => {
        if (response.success && response.payments) {
          this.studentMonthlyPayments = response.payments.map((p: any) => ({
            id: p._id, _id: p._id, studentId: p.student?._id || studentId,
            month: p.month, amount: p.amount, status: p.status, paymentDate: p.paymentDate,
            paymentMethod: p.paymentMethod, notes: p.notes, className: p.class?.name
          }));
        } else {
          this.studentMonthlyPayments = [];
        }
      },
      error: (error) => {
        console.error('Error loading monthly payments:', error);
        this.studentMonthlyPayments = [];
      }
    });

    this.http.get<any>(`${this.apiUrl}/payment-systems/rounds/student/${studentId}`, { headers: this.getHeaders() }).subscribe({
      next: (response) => {
        if (response.success && response.rounds) {
          this.studentRounds = response.rounds;
          this.updateRoundStatuses();
        } else {
          this.studentRounds = [];
        }
      },
      error: (error) => {
        console.error('Error loading rounds:', error);
        this.studentRounds = [];
      }
    });
  }

  // ==================== ABSENCE METHODS ====================
  loadStudentAbsences(): void {
    const studentId = this.getStudentId();
    if (!studentId) return;

    this.loadingAbsences = true;
    let url = `${this.apiUrl}/students/${studentId}/absences`;
    const params = new URLSearchParams();
    
    if (this.absenceFilterStartDate) params.append('startDate', this.absenceFilterStartDate);
    if (this.absenceFilterEndDate) params.append('endDate', this.absenceFilterEndDate);
    params.append('limit', this.absenceLimit.toString());
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    this.http.get<any>(url, { headers: this.getHeaders() }).subscribe({
      next: (response) => {
        if (response.success) {
          this.studentAbsences = response.allAbsences || [];
          this.absenceSummary = response.statistics;
          console.log(`تم تحميل ${this.studentAbsences.length} سجل غياب`);
        } else {
          this.studentAbsences = [];
          this.absenceSummary = null;
        }
        this.loadingAbsences = false;
      },
      error: (error) => {
        console.error('Error loading student absences:', error);
        this.studentAbsences = [];
        this.absenceSummary = null;
        this.loadingAbsences = false;
        Swal.fire('خطأ', 'فشل في تحميل سجل الغيابات', 'error');
      }
    });
  }

  loadAbsenceSummary(): void {
    const studentId = this.getStudentId();
    if (!studentId) return;

    this.http.get<any>(`${this.apiUrl}/students/${studentId}/absences-summary`, { headers: this.getHeaders() }).subscribe({
      next: (response) => {
        if (response.success) {
          this.absenceSummary = response;
        }
      },
      error: (error) => {
        console.error('Error loading absence summary:', error);
      }
    });
  }

  openAbsencesModal(): void {
    this.showAbsencesModal = true;
    this.loadStudentAbsences();
  }

  closeAbsencesModal(): void {
    this.showAbsencesModal = false;
  }

  filterAbsencesByDate(): void {
    this.loadStudentAbsences();
  }

  resetAbsenceFilter(): void {
    this.absenceFilterStartDate = '';
    this.absenceFilterEndDate = '';
    this.loadStudentAbsences();
  }

  exportAbsencesToExcel(): void {
    if (!this.studentAbsences.length) {
      Swal.fire('تنبيه', 'لا توجد بيانات للتصدير', 'warning');
      return;
    }

    const exportData = this.studentAbsences.map(absence => ({
      'التاريخ': absence.dateFormatted,
      'اليوم': absence.dayName,
      'الوقت': `${absence.startTime} - ${absence.endTime || ''}`,
      'الحصة': absence.className,
      'المادة': absence.subject,
      'الأستاذ': absence.teacherName,
      'الحالة': absence.statusText,
      'القاعة': absence.classroom,
      'ملاحظات': absence.notes || ''
    }));

    const headers = Object.keys(exportData[0]);
    const csvRows: string[] = [];
    csvRows.push(headers.join(','));
    
    for (const row of exportData) {
      const values = headers.map(header => {
        const value = row[header as keyof typeof row] || '';
        return `"${value.toString().replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(','));
    }

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `غيابات_${this.student?.name}_${new Date().toLocaleDateString('ar-EG')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    Swal.fire('نجاح', 'تم تصدير البيانات بنجاح', 'success');
  }

  getAbsenceStatusClass(status: string): string {
    switch(status) {
      case 'present': return 'bg-success';
      case 'late': return 'bg-warning';
      case 'absent': return 'bg-danger';
      default: return 'bg-secondary';
    }
  }

  getAbsenceStatusText(status: string): string {
    switch(status) {
      case 'present': return 'حاضر';
      case 'late': return 'متأخر';
      case 'absent': return 'غائب';
      default: return 'غير محدد';
    }
  }

  // ==================== HELPER METHODS ====================
  private groupPaymentsByClass(payments: Payment[]): ClassPaymentGroup[] {
    const groups: { [key: string]: ClassPaymentGroup } = {};
    payments.forEach(payment => {
      const classId = payment.class?._id || payment.class || 'general';
      const className = payment.className || 'عام';
      if (!groups[classId]) {
        groups[classId] = {
          classId, className, payments: [], totalAmount: 0, paidAmount: 0, pendingAmount: 0, expanded: false
        };
      }
      groups[classId].payments.push(payment);
      groups[classId].totalAmount += payment.amount;
      if (payment.status === 'paid') {
        groups[classId].paidAmount += payment.amount;
      } else {
        groups[classId].pendingAmount += payment.amount;
      }
    });
    return Object.values(groups);
  }

  private getStudentId(): string {
    if (!this.student) return '';
    if (this.student.id) return this.student.id;
    if ((this.student as any)._id) return (this.student as any)._id;
    return this.student.studentId || '';
  }

  getPaymentMethodLabel(value: string): string {
    const method = this.paymentMethods.find(m => m.value === value);
    return method ? method.label : value;
  }

  getAcademicYearName(code: string): string {
    const year = this.academicYears.find(y => y.value === code);
    return year ? year.label : code;
  }

  calculateAge(birthDate: string | undefined): number {
    if (!birthDate) return 0;
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  }

  getTotalPaid(): number {
    return this.paymentHistory.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
  }

  getTotalPending(): number {
    return this.paymentHistory.filter(p => p.status === 'pending' || p.status === 'late').reduce((sum, p) => sum + p.amount, 0);
  }

  getPaymentPercentage(): number {
    const total = this.getTotalPaid() + this.getTotalPending();
    return total > 0 ? Math.round((this.getTotalPaid() / total) * 100) : 0;
  }

  getUniqueMonths(): string[] {
    const monthsSet = new Set<string>();
    this.paymentHistory.forEach(payment => { if (payment.month) monthsSet.add(payment.month); });
    return Array.from(monthsSet).sort((a, b) => {
      const monthNames = this.months;
      const getMonthIndex = (monthStr: string) => monthNames.indexOf(monthStr.split(' ')[0]);
      return getMonthIndex(a) - getMonthIndex(b);
    });
  }

  generateMonthOptions(): string[] {
    const options: string[] = [];
    const currentDate = new Date();
    for (let yearOffset = 0; yearOffset < 3; yearOffset++) {
      const year = currentDate.getFullYear() + yearOffset;
      for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
        options.push(`${this.months[monthIndex]} ${year}`);
      }
    }
    return options;
  }

  getPaymentStatusClass(payment: Payment): string {
    if (payment.isLate) return 'bg-danger';
    switch(payment.status) {
      case 'paid': return 'bg-success';
      case 'pending': return 'bg-warning';
      case 'late': return 'bg-danger';
      default: return 'bg-secondary';
    }
  }

  getPaymentStatusText(payment: Payment): string {
    if (payment.isLate) return 'متأخر';
    switch(payment.status) {
      case 'paid': return 'مدفوع';
      case 'pending': return 'معلق';
      case 'late': return 'متأخر';
      default: return 'غير محدد';
    }
  }

  updateRoundStatuses(): void {
    const now = new Date();
    this.studentRounds.forEach(round => {
      const endDate = new Date(round.endDate);
      const startDate = new Date(round.startDate);
      if (round.status === 'paid') {
        round.statusText = 'مدفوعة';
        round.statusClass = 'badge bg-success';
      } else if (now > endDate && round.status !== 'paid') {
        round.statusText = 'منتهية';
        round.statusClass = 'badge bg-danger';
      } else if (now >= startDate && now <= endDate && round.status !== 'paid') {
        round.statusText = 'متأخرة';
        round.statusClass = 'badge bg-warning';
      } else if (now < startDate) {
        round.statusText = 'قادمة';
        round.statusClass = 'badge bg-info';
      } else {
        round.statusText = 'معلقة';
        round.statusClass = 'badge bg-secondary';
      }
    });
  }

  // ==================== PAYMENT SELECTION METHODS ====================
  isPaymentSelected(payment: Payment): boolean {
    return this.selectedPaymentsForBulkPay.some(p => (p._id || p.id) === (payment._id || payment.id));
  }

  togglePaymentSelection(payment: Payment): void {
    const index = this.selectedPaymentsForBulkPay.findIndex(p => (p._id || p.id) === (payment._id || payment.id));
    if (index > -1) {
      this.selectedPaymentsForBulkPay.splice(index, 1);
    } else {
      this.selectedPaymentsForBulkPay.push(payment);
    }
  }

  isGroupAllSelected(group: ClassPaymentGroup): boolean {
    if (!group.payments?.length) return false;
    return group.payments.every(p => this.isPaymentSelected(p));
  }

  toggleGroupSelection(group: ClassPaymentGroup): void {
    const allSelected = this.isGroupAllSelected(group);
    if (allSelected) {
      group.payments.forEach(p => {
        const index = this.selectedPaymentsForBulkPay.findIndex(sp => (sp._id || sp.id) === (p._id || p.id));
        if (index > -1) this.selectedPaymentsForBulkPay.splice(index, 1);
      });
    } else {
      group.payments.forEach(p => {
        if (p.status !== 'paid' && !this.isPaymentSelected(p)) {
          this.selectedPaymentsForBulkPay.push(p);
        }
      });
    }
  }

  selectAllPendingPayments(): void {
    this.selectedPaymentsForBulkPay = this.paymentHistory.filter(p => p.status !== 'paid');
  }

  selectPaymentsByMonth(month: string): void {
    if (!month) {
      this.selectedPaymentsForBulkPay = [];
      return;
    }
    this.selectedPaymentsForBulkPay = this.paymentHistory.filter(p => p.month === month && p.status !== 'paid');
  }

  selectPaymentsByClass(classId: string): void {
    if (classId === 'all') {
      this.selectAllPendingPayments();
      return;
    }
    this.selectedPaymentsForBulkPay = this.paymentHistory.filter(p => (p.class?._id === classId || p.class === classId) && p.status !== 'paid');
  }

  getSelectedPaymentsTotal(): number {
    return this.selectedPaymentsForBulkPay.reduce((total, p) => total + p.amount, 0);
  }

  getUniqueStudentsCount(): number {
    const studentIds = new Set<string>();
    this.selectedPaymentsForBulkPay.forEach(payment => {
      if (payment.student?._id) studentIds.add(payment.student._id);
      else if (payment.student) studentIds.add(payment.student);
    });
    return studentIds.size;
  }

  // ==================== CLASS ENROLLMENT METHODS ====================
  openAddToLessonsModal(): void {
    if (!this.student) return;
    this.showAddToLessonsModal = true;
    this.selectedClasses = [];
    this.filterSubject = '';
    this.filterLevel = '';
    this.loadAvailableClasses();
  }

  closeAddToLessonsModal(): void {
    this.showAddToLessonsModal = false;
    this.availableClasses = [];
    this.filteredAvailableClasses = [];
    this.alreadyEnrolledClasses = [];
    this.selectedClasses = [];
    this.selectedClassForRounds = null;
    this.showRoundSelectionModal = false;
  }

  loadAvailableClasses(): void {
    if (!this.student) return;
    this.loadingAvailableClasses = true;
    this.http.get<Class[]>(`${this.apiUrl}/classes/available`, { headers: this.getHeaders() }).subscribe({
      next: (classes) => {
        this.availableClasses = classes;
        const enrolledClassIds = this.studentClasses.map(c => c._id || c.id);
        this.alreadyEnrolledClasses = classes.filter(c => enrolledClassIds.includes(c._id || c.id));
        this.availableClasses = classes.filter(c => !enrolledClassIds.includes(c._id || c.id));
        this.filterAvailableClasses();
        this.loadingAvailableClasses = false;
      },
      error: (error) => {
        console.error('Error loading available classes:', error);
        Swal.fire('خطأ', 'فشل في تحميل الحصص المتاحة', 'error');
        this.loadingAvailableClasses = false;
      }
    });
  }

  filterAvailableClasses(): void {
    this.filteredAvailableClasses = this.availableClasses.filter((cls: Class) => {
      if (this.filterSubject && cls.subject !== this.filterSubject) return false;
      if (this.filterLevel && cls.academicYear !== this.filterLevel) return false;
      return true;
    });
  }

  isClassSelected(classId: string): boolean {
    return this.selectedClasses.some(c => (c._id || c.id) === classId);
  }

  toggleClassSelection(classObj: Class): void {
    const index = this.selectedClasses.findIndex(c => (c._id || c.id) === (classObj._id || classObj.id));
    if (index > -1) {
      this.selectedClasses.splice(index, 1);
    } else {
      this.selectedClasses.push(classObj);
    }
  }

  calculateMonthlyTotal(): number {
    return this.selectedClasses.reduce((total, cls) => total + (cls.price || 0), 0);
  }

  checkAndEnrollStudentToSelectedClasses(): void {
    if (!this.student || this.selectedClasses.length === 0) return;
    const classesWithRounds = this.selectedClasses.filter(cls => cls.paymentSystem === 'rounds');
    if (classesWithRounds.length > 0) {
      this.selectedClassForRounds = classesWithRounds[0];
      this.openRoundSelectionModal();
    } else {
      this.enrollStudentToSelectedClasses();
    }
  }

  openRoundSelectionModal(): void {
    if (!this.selectedClassForRounds) return;
    this.roundSelection = {
      roundNumber: `RND-${Date.now().toString().slice(-6)}`,
      sessionCount: this.selectedClassForRounds.roundSettings?.sessionCount || 8,
      sessionPrice: this.selectedClassForRounds.price / (this.selectedClassForRounds.roundSettings?.sessionCount || 8),
      totalAmount: this.selectedClassForRounds.price,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      notes: `نظام جولات تلقائي للحصة ${this.selectedClassForRounds.name}`
    };
    this.showRoundSelectionModal = true;
  }

  closeRoundSelectionModal(): void {
    this.showRoundSelectionModal = false;
    this.selectedClassForRounds = null;
  }

  updateRoundTotalAmount(): void {
    if (this.selectedClassForRounds) {
      this.roundSelection.totalAmount = this.roundSelection.sessionCount * this.roundSelection.sessionPrice;
    }
  }

  confirmRoundSelection(): void {
    if (!this.selectedClassForRounds || !this.roundSelection.sessionCount || this.roundSelection.sessionCount <= 0) {
      Swal.fire('خطأ', 'يرجى تحديد عدد جلسات صحيح', 'error');
      return;
    }
    this.closeRoundSelectionModal();
    this.enrollStudentToSelectedClasses();
  }

  enrollStudentToSelectedClasses(): void {
    if (!this.student || this.selectedClasses.length === 0) return;
    const classIds = this.selectedClasses.map(c => c._id || c.id);
    const studentId = this.getStudentId();
    Swal.fire({
      title: 'تأكيد التسجيل',
      html: `<p>هل تريد تسجيل الطالب في ${this.selectedClasses.length} حصة؟</p><p><strong>الإجمالي:</strong> ${this.calculateMonthlyTotal().toLocaleString()} د.ج</p>`,
      icon: 'question', showCancelButton: true, confirmButtonText: 'نعم، سجل الآن', cancelButtonText: 'إلغاء'
    }).then((result) => {
      if (result.isConfirmed) {
        const validClassIds = classIds.filter(id => id !== undefined && id !== null) as string[];
        this.enrollStudentMultiple(studentId, validClassIds);
      }
    });
  }

  enrollStudentMultiple(studentId: string, classIds: string[]): void {
    this.isEnrolling = true;
    const roundSettings = this.selectedClassForRounds ? {
      sessionCount: this.roundSelection.sessionCount,
      sessionDuration: 2,
      breakBetweenSessions: 0
    } : undefined;
    this.http.post<any>(`${this.apiUrl}/students/${studentId}/enroll-multiple`, { classIds, roundSettings }, { headers: this.getHeaders() }).subscribe({
      next: (response) => {
        Swal.fire({ icon: 'success', title: 'تم التسجيل بنجاح', timer: 3000, showConfirmButton: false });
        this.loadStudentClasses(this.route.snapshot.paramMap.get('id') || '');
        this.loadStudentPaymentSystems(this.route.snapshot.paramMap.get('id') || '');
        this.closeAddToLessonsModal();
        this.isEnrolling = false;
      },
      error: (error) => {
        console.error('Error enrolling student:', error);
        Swal.fire('خطأ', 'فشل في تسجيل الطالب في الحصص', 'error');
        this.isEnrolling = false;
      }
    });
  }

  // ==================== MODAL CONTROLS ====================
  setActiveTab(tab: string): void {
    this.activeTab = tab;
    if (tab === 'payments' && this.student) {
      this.loadPaymentHistory(this.getStudentId());
    }
  }

  goBack(): void {
    this.router.navigate(['/home/students-management']);
  }

  openAddPaymentModal(): void {
    if (!this.student) return;
    const currentDate = new Date();
    const currentMonth = `${this.months[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    this.newPayment = { student: this.getStudentId(), amount: 0, month: currentMonth, paymentMethod: 'cash', notes: '' };
    this.showPaymentModal = true;
  }

  closePaymentModal(): void {
    this.showPaymentModal = false;
    this.newPayment = { student: '', amount: 0, month: '', paymentMethod: 'cash', notes: '' };
  }

  openEditPaymentModal(payment: Payment): void {
    this.editingPayment = { ...payment };
    this.showEditPaymentModal = true;
  }

  closeEditPaymentModal(): void {
    this.showEditPaymentModal = false;
    this.editingPayment = null;
  }

  openDeleteConfirmModal(payment: Payment): void {
    this.paymentToDelete = payment;
    this.showDeleteConfirmModal = true;
  }

  closeDeleteConfirmModal(): void {
    this.showDeleteConfirmModal = false;
    this.paymentToDelete = null;
  }

  openBulkPayConfirmation(): void {
    if (this.selectedPaymentsForBulkPay.length === 0) {
      Swal.fire('تنبيه', 'يرجى اختيار مدفوعات للدفع', 'warning');
      return;
    }
    this.showBulkPayConfirmation = true;
  }

  closeBulkPayConfirmation(): void {
    this.showBulkPayConfirmation = false;
  }

  toggleClassPaymentGroup(classId: string): void {
    const group = this.classPaymentGroups.find(g => g.classId === classId);
    if (group) group.expanded = !group.expanded;
  }

  isClassGroupExpanded(classId: string): boolean {
    const group = this.classPaymentGroups.find(g => g.classId === classId);
    return group ? group.expanded || false : false;
  }

  // ==================== PAYMENT ACTIONS ====================
  addPayment(): void {
    if (!this.student || !this.newPayment.amount || this.newPayment.amount <= 0) {
      Swal.fire('خطأ', 'يرجى إدخال مبلغ صحيح', 'error');
      return;
    }
    if (!this.newPayment.month) {
      Swal.fire('خطأ', 'يرجى اختيار الشهر', 'error');
      return;
    }
    Swal.fire({ title: 'جاري تسجيل الدفعة...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    this.http.post<any>(`${this.apiUrl}/payments`, this.newPayment, { headers: this.getHeaders() }).subscribe({
      next: () => {
        Swal.fire({ icon: 'success', title: 'نجاح', text: 'تم تسجيل الدفعة بنجاح', timer: 1500, showConfirmButton: false });
        this.closePaymentModal();
        this.loadPaymentHistory(this.getStudentId());
        this.loadStudentPaymentSystems(this.getStudentId());
      },
      error: (error) => {
        console.error('Error adding payment:', error);
        Swal.fire('خطأ', 'فشل في تسجيل الدفعة', 'error');
      }
    });
  }

  updatePayment(): void {
    if (!this.editingPayment || !this.editingPayment._id) return;
    if (!this.editingPayment.amount || this.editingPayment.amount <= 0) {
      Swal.fire('خطأ', 'يرجى إدخال مبلغ صحيح', 'error');
      return;
    }
    Swal.fire({ title: 'جاري تحديث الدفعة...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    this.http.put<any>(`${this.apiUrl}/payments/${this.editingPayment._id}`, this.editingPayment, { headers: this.getHeaders() }).subscribe({
      next: () => {
        Swal.fire({ icon: 'success', title: 'نجاح', text: 'تم تحديث الدفعة بنجاح', timer: 1500, showConfirmButton: false });
        this.closeEditPaymentModal();
        this.loadPaymentHistory(this.getStudentId());
        this.loadStudentPaymentSystems(this.getStudentId());
      },
      error: (error) => {
        console.error('Error updating payment:', error);
        Swal.fire('خطأ', 'فشل في تحديث الدفعة', 'error');
      }
    });
  }

  // دالة دفع الدفعة المحسنة
  payPayment(payment: Payment): void {
    Swal.fire({
      title: 'تأكيد الدفع',
      html: `<div class="text-start">
        <p><strong>المبلغ:</strong> ${payment.amount.toLocaleString()} د.ج</p>
        <p><strong>الشهر:</strong> ${payment.month}</p>
        <p><strong>الحصة:</strong> ${payment.className || 'عام'}</p>
      </div>`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'دفع وطباعة',
      cancelButtonText: 'دفع فقط',
      showDenyButton: true,
      denyButtonText: 'إلغاء',
      input: 'select',
      inputOptions: { 
        'cash': 'نقداً', 
        'bank': 'تحويل بنكي', 
        'card': 'بطاقة ائتمان', 
        'online': 'دفع إلكتروني',
        'mobile': 'دفع محمول'
      },
      inputPlaceholder: 'اختر طريقة الدفع',
      inputValue: 'cash'
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        this.processPaymentWithPrint(payment, result.value, true);
      } else if (result.dismiss === Swal.DismissReason.cancel && result.value) {
        this.processPaymentWithPrint(payment, result.value, false);
      }
    });
  }

  private processPaymentWithPrint(payment: Payment, method: string, shouldPrint: boolean): void {
    const paymentData = { 
      paymentMethod: method, 
      paymentDate: new Date().toISOString(), 
      notes: 'تم الدفع من خلال النظام' 
    };
    
    Swal.fire({ 
      title: 'جاري الدفع...', 
      allowOutsideClick: false, 
      didOpen: () => Swal.showLoading() 
    });
    
    const paymentId = payment._id || payment.id;
    this.http.put<any>(`${this.apiUrl}/payments/${paymentId}/pay`, paymentData, { headers: this.getHeaders() })
      .subscribe({
        next: async (response) => {
          Swal.fire({ 
            icon: 'success', 
            title: 'تم الدفع بنجاح', 
            text: `تم دفع مبلغ ${payment.amount.toLocaleString()} د.ج`,
            timer: 2000,
            showConfirmButton: false 
          });
          
          this.loadPaymentHistory(this.getStudentId());
          this.loadStudentPaymentSystems(this.getStudentId());
          
          if (shouldPrint && response.payment) {
            await this.printPaymentReceipt(response.payment);
          }
        },
        error: (error) => {
          console.error('Error paying payment:', error);
          Swal.fire({ 
            icon: 'error', 
            title: 'فشل في الدفع', 
            text: error.error?.error || error.message || 'حدث خطأ أثناء محاولة الدفع',
            confirmButtonText: 'حسناً'
          });
        }
      });
  }

  // دالة إلغاء الدفعة
  async cancelPayment(payment: Payment): Promise<void> {
    if (payment.status !== 'paid') {
      Swal.fire({
        icon: 'warning',
        title: 'لا يمكن الإلغاء',
        text: 'لا يمكن إلغاء دفعة غير مدفوعة. يمكنك فقط حذفها.',
        confirmButtonText: 'حسناً'
      });
      return;
    }

    const result = await Swal.fire({
      title: 'تأكيد إلغاء الدفعة',
      html: `<div class="text-start">
        <p>هل أنت متأكد من إلغاء هذه الدفعة؟</p>
        <p><strong>الطالب:</strong> ${payment.studentName || this.student?.name}</p>
        <p><strong>الشهر:</strong> ${payment.month}</p>
        <p><strong>المبلغ:</strong> ${payment.amount.toLocaleString()} د.ج</p>
        <p class="text-danger mt-3">⚠️ سيتم إلغاء الدفعة وإعادتها كـ "معلقة".</p>
      </div>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'نعم، قم بالإلغاء',
      cancelButtonText: 'إلغاء'
    });

    if (result.isConfirmed) {
      Swal.fire({
        title: 'جاري الإلغاء...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      const paymentId = payment._id || payment.id;
      this.http.put<any>(`${this.apiUrl}/payments/${paymentId}/cancel`, {}, { headers: this.getHeaders() })
        .subscribe({
          next: (response) => {
            Swal.fire({
              icon: 'success',
              title: 'تم الإلغاء',
              text: 'تم إلغاء الدفعة بنجاح وإعادتها كمعلقة.',
              timer: 2000,
              showConfirmButton: false
            });
            this.loadPaymentHistory(this.getStudentId());
            this.loadStudentPaymentSystems(this.getStudentId());
          },
          error: (error) => {
            console.error('Error canceling payment:', error);
            Swal.fire({
              icon: 'error',
              title: 'فشل الإلغاء',
              text: error.error?.error || error.message || 'حدث خطأ أثناء محاولة إلغاء الدفعة.',
              confirmButtonText: 'حسناً'
            });
          }
        });
    }
  }

  deletePayment(): void {
    if (!this.paymentToDelete) return;
    
    if (this.paymentToDelete.status === 'paid') {
      Swal.fire({
        icon: 'warning',
        title: 'لا يمكن الحذف المباشر',
        text: 'هذه الدفعة مدفوعة. لاسترجاعها، يرجى استخدام زر "إلغاء الدفعة" بدلاً من الحذف.',
        confirmButtonText: 'حسناً'
      });
      this.closeDeleteConfirmModal();
      return;
    }

    Swal.fire({
      title: 'تأكيد الحذف النهائي',
      text: `هل أنت متأكد من حذف دفعة ${this.paymentToDelete.month} بقيمة ${this.paymentToDelete.amount} د.ج؟ هذا الإجراء نهائي ولا يمكن التراجع عنه.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'نعم، احذف نهائياً',
      cancelButtonText: 'إلغاء'
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({ title: 'جاري الحذف...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
        const paymentId = this.paymentToDelete!._id || this.paymentToDelete!.id;
        this.http.delete<any>(`${this.apiUrl}/payments/${paymentId}`, { headers: this.getHeaders() })
          .subscribe({
            next: () => {
              Swal.fire({ icon: 'success', title: 'تم الحذف', text: 'تم حذف الدفعة بنجاح', timer: 1500, showConfirmButton: false });
              this.closeDeleteConfirmModal();
              this.loadPaymentHistory(this.getStudentId());
              this.loadStudentPaymentSystems(this.getStudentId());
            },
            error: (error) => {
              console.error('Error deleting payment:', error);
              Swal.fire('خطأ', 'فشل في حذف الدفعة', 'error');
            }
          });
      }
    });
  }

  async processBulkPaySelected(): Promise<void> {
    if (this.selectedPaymentsForBulkPay.length === 0) {
      Swal.fire({ icon: 'warning', title: 'لا توجد مدفوعات مختارة', text: 'يرجى اختيار مدفوعات للدفع أولاً' });
      return;
    }
    
    const hasPaidPayments = this.selectedPaymentsForBulkPay.some(p => p.status === 'paid');
    if (hasPaidPayments) {
      const unpaidPayments = this.selectedPaymentsForBulkPay.filter(p => p.status !== 'paid');
      const { value: proceed } = await Swal.fire({
        title: 'تحذير', html: `<div class="text-start"><p class="text-warning">بعض المدفوعات المختارة مدفوعة مسبقاً</p><p><strong>المعلقة:</strong> ${unpaidPayments.length}</p><p>هل تريد المتابعة مع المدفوعات المعلقة فقط؟</p></div>`,
        icon: 'warning', showCancelButton: true, confirmButtonText: 'نعم، متابعة', cancelButtonText: 'إلغاء'
      });
      if (!proceed) return;
      this.selectedPaymentsForBulkPay = unpaidPayments;
    }

    const totalAmount = this.getSelectedPaymentsTotal();
    
    const { value: userChoice } = await Swal.fire({
      title: 'خيارات الدفع الجماعي',
      html: `<div class="text-start"><div class="alert alert-info"><h6>تفاصيل الدفع الجماعي</h6><p><strong>عدد المدفوعات:</strong> ${this.selectedPaymentsForBulkPay.length}</p><p><strong>المبلغ الإجمالي:</strong> ${totalAmount.toLocaleString('ar-SA')} د.ج</p></div>
              <div class="mb-3"><label class="form-label">طريقة الدفع:</label><select class="form-select" id="paymentMethod"><option value="cash">نقداً</option><option value="bank">تحويل بنكي</option><option value="card">بطاقة ائتمان</option><option value="online">دفع إلكتروني</option></select></div>
              <div class="mb-3"><label class="form-label">خيار الطباعة:</label><select class="form-select" id="printOption"><option value="single">إيصال واحد لجميع الدفعات</option><option value="multiple">إيصالات منفصلة لكل دفعة</option></select></div>
              <div class="mb-3"><label class="form-label">ملاحظات:</label><textarea class="form-control" id="paymentNotes" rows="2"></textarea></div></div>`,
      icon: 'question', showCancelButton: true, confirmButtonText: 'دفع', cancelButtonText: 'إلغاء', width: '600px',
      preConfirm: () => {
        const paymentMethod = (document.getElementById('paymentMethod') as HTMLSelectElement).value;
        const printOption = (document.getElementById('printOption') as HTMLSelectElement).value;
        const paymentNotes = (document.getElementById('paymentNotes') as HTMLTextAreaElement).value;
        if (!paymentMethod) { Swal.showValidationMessage('يرجى اختيار طريقة الدفع'); return false; }
        return { paymentMethod, printOption, paymentNotes };
      }
    });
    if (!userChoice) return;

    const { paymentMethod, printOption, paymentNotes } = userChoice;
    
    Swal.fire({
      title: 'جاري معالجة الدفعات...',
      html: `<div class="text-center"><div class="spinner-border text-primary mb-3"></div><h5>دفع جماعي</h5><p>جاري معالجة ${this.selectedPaymentsForBulkPay.length} دفعة...</p>
              <div class="progress mt-4"><div class="progress-bar progress-bar-striped progress-bar-animated bg-success" style="width: 0%;" id="bulk-pay-progress">0%</div></div>
              <div class="row mt-4"><div class="col-6 text-end"><small class="text-muted">النجاح:</small><h5 class="text-success" id="success-count">0</h5></div>
              <div class="col-6 text-start"><small class="text-muted">الفشل:</small><h5 class="text-danger" id="fail-count">0</h5></div></div>
              <div class="mt-3"><small class="text-muted" id="current-payment">جاري بدء المعالجة...</small></div></div>`,
      showConfirmButton: false, allowOutsideClick: false, width: '500px'
    });

    let successfulPayments = 0, failedPayments = 0;
    const results: any[] = [];
    const paidPayments: Payment[] = [];

    for (let i = 0; i < this.selectedPaymentsForBulkPay.length; i++) {
      const payment = this.selectedPaymentsForBulkPay[i];
      const paymentId = payment._id || payment.id;
      const progress = Math.round(((i + 1) / this.selectedPaymentsForBulkPay.length) * 100);
      
      const progressBar = document.getElementById('bulk-pay-progress');
      const successCount = document.getElementById('success-count');
      const failCount = document.getElementById('fail-count');
      const currentPayment = document.getElementById('current-payment');
      if (progressBar) { progressBar.style.width = `${progress}%`; progressBar.textContent = `${progress}%`; }
      if (successCount) successCount.textContent = successfulPayments.toString();
      if (failCount) failCount.textContent = failedPayments.toString();
      if (currentPayment) currentPayment.textContent = `جاري معالجة: ${i+1}/${this.selectedPaymentsForBulkPay.length} - ${payment.month} - ${payment.amount.toLocaleString()} د.ج`;

      if (!paymentId) {
        failedPayments++;
        results.push({ payment: payment.month, student: payment.studentName, success: false, message: 'رقم الدفعة غير صالح' });
        continue;
      }

      try {
        const paymentData = { paymentMethod, paymentDate: new Date().toISOString(), notes: paymentNotes || `دفع جماعي - ${new Date().toLocaleDateString('ar-SA')}` };
        const response = await this.http.put<any>(`${this.apiUrl}/payments/${paymentId}/pay`, paymentData, { headers: this.getHeaders() }).toPromise();
        successfulPayments++;
        paidPayments.push({ ...payment, paymentMethod, paymentDate: new Date(), invoiceNumber: response.invoiceNumber, notes: paymentData.notes });
        results.push({ payment: payment.month, student: payment.studentName, success: true, message: 'تم الدفع بنجاح' });
      } catch (error: any) {
        failedPayments++;
        results.push({ payment: payment.month, student: payment.studentName, success: false, message: error.error?.message || error.message || 'فشل في الدفع' });
      }
      await this.delay(100);
    }

    Swal.close();
    if (printOption === 'single' && successfulPayments > 0) {
      await this.printSingleReceiptForMultiplePayments(paidPayments, paymentMethod, paymentNotes);
    } else if (printOption === 'multiple' && successfulPayments > 0) {
      await this.printMultipleReceipts(paidPayments);
    }
    
    const resultsHtml = `<div class="text-start"><div class="alert alert-success"><h5>تمت الدفعات بنجاح</h5><div class="row mt-3"><div class="col-4 text-center"><h2 class="text-success">${successfulPayments}</h2><small>النجاحات</small></div>
      <div class="col-4 text-center"><h2 class="text-danger">${failedPayments}</h2><small>الفشل</small></div><div class="col-4 text-center"><h2 class="text-primary">${successfulPayments + failedPayments}</h2><small>الإجمالي</small></div></div></div></div>`;
    await Swal.fire({ title: 'نتائج الدفع الجماعي', html: resultsHtml, icon: successfulPayments > 0 ? 'success' : 'error', confirmButtonText: 'حسناً' });
    
    if (successfulPayments > 0 && this.student) {
      this.loadPaymentHistory(this.getStudentId());
      this.loadStudentPaymentSystems(this.getStudentId());
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async payLatePayment(payment: MonthlyPayment): Promise<void> {
    const { value: paymentMethod } = await Swal.fire({
      title: 'تسديد دفعة متأخرة',
      html: `<div class="text-start"><p>المبلغ: ${payment.amount.toLocaleString()} د.ج</p>${payment.month ? `<p>الشهر: ${payment.month}</p>` : ''}</div>`,
      icon: 'warning', showCancelButton: true, confirmButtonText: 'تسديد الآن', cancelButtonText: 'إلغاء',
      input: 'select', inputOptions: { 'cash': 'نقداً', 'bank': 'تحويل بنكي', 'card': 'بطاقة ائتمان', 'online': 'دفع إلكتروني' }
    });
    if (paymentMethod) {
      Swal.fire({ title: 'جاري التسديد...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
      if (payment._id) {
        this.http.put<any>(`${this.apiUrl}/payments/${payment._id}/pay`, { paymentMethod, paymentDate: new Date().toISOString(), notes: 'تم تسديد دفعة متأخرة' }, { headers: this.getHeaders() }).subscribe({
          next: () => {
            Swal.fire({ icon: 'success', title: 'نجاح', text: 'تم تسديد الدفعة المتأخرة بنجاح', timer: 1500, showConfirmButton: false });
            const routeId = this.route.snapshot.paramMap.get('id');
            if (routeId) this.loadStudentPaymentSystems(routeId);
          },
          error: (error) => { console.error('Error paying late payment:', error); Swal.fire('خطأ', 'فشل في تسديد الدفعة المتأخرة', 'error'); }
        });
      }
    }
  }

  async payRound(round: RoundPayment): Promise<void> {
    const { value: paymentMethod } = await Swal.fire({
      title: 'دفع الجولة',
      html: `<div class="text-start"><p>رقم الجولة: ${round.roundNumber}</p><p>المبلغ: ${round.totalAmount.toLocaleString()} د.ج</p><p>عدد الجلسات: ${round.sessionCount}</p></div>`,
      icon: 'question', showCancelButton: true, confirmButtonText: 'دفع', cancelButtonText: 'إلغاء',
      input: 'select', inputOptions: { 'cash': 'نقداً', 'bank': 'تحويل بنكي', 'card': 'بطاقة ائتمان', 'online': 'دفع إلكتروني' }, inputValue: 'cash'
    });
    if (paymentMethod) {
      Swal.fire({ title: 'جاري الدفع...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
      const roundId = round._id || round.id;
      if (roundId) {
        this.http.put<any>(`${this.apiUrl}/payment-systems/rounds/${roundId}/pay`, { paymentMethod, paymentDate: new Date().toISOString(), notes: `دفع جولة ${round.roundNumber}` }, { headers: this.getHeaders() }).subscribe({
          next: () => {
            Swal.fire({ icon: 'success', title: 'تم الدفع بنجاح', timer: 3000, showConfirmButton: false });
            const studentId = this.route.snapshot.paramMap.get('id');
            if (studentId) { this.loadStudentPaymentSystems(studentId); this.loadPaymentHistory(studentId); }
          },
          error: (error) => { console.error('Error paying round:', error); Swal.fire('خطأ', `فشل في دفع الجولة: ${error.error?.error || error.message}`, 'error'); }
        });
      }
    }
  }

  viewRoundDetails(round: RoundPayment): void {
    let sessionsHTML = '<div class="table-responsive"><table class="table table-sm"><thead><tr><th>#</th><th>التاريخ</th><th>السعر</th><th>الحالة</th></tr></thead><tbody>';
    (round.sessions || []).forEach(session => {
      sessionsHTML += `<tr><td>${session.sessionNumber}</td><td>${new Date(session.date).toLocaleDateString('ar-EG')}</td><td>${session.price} د.ج</td>
        <td><span class="badge ${session.status === 'completed' ? 'bg-success' : 'bg-warning'}">${session.status === 'completed' ? 'مكتملة' : 'معلقة'}</span></td></tr>`;
    });
    sessionsHTML += '</tbody></table></div>';
    Swal.fire({ title: `تفاصيل الجولة ${round.roundNumber}`, html: `<div class="text-start"><p><strong>رقم الجولة:</strong> ${round.roundNumber}</p><p><strong>عدد الجلسات:</strong> ${round.sessionCount}</p>
      <p><strong>المجموع الكلي:</strong> ${round.totalAmount.toLocaleString()} د.ج</p><p><strong>تاريخ البدء:</strong> ${new Date(round.startDate).toLocaleDateString('ar-EG')}</p>
      <p><strong>تاريخ الانتهاء:</strong> ${new Date(round.endDate).toLocaleDateString('ar-EG')}</p><p><strong>الحالة:</strong> <span class="${round.statusClass}">${round.statusText}</span></p><hr><h6>تفاصيل الجلسات:</h6>${sessionsHTML}</div>`,
      icon: 'info', confirmButtonText: 'حسناً' });
  }

  // ==================== PRINTING METHODS ====================
// استبدل دالة printPaymentReceipt بهذا الكود

async printPaymentReceipt(payment: Payment): Promise<void> {
  // التحقق أولاً من الاتصال بالطابعة
  if (!this.printerService.checkConnectionStatus()) {
    // عرض خيار للمستخدم للاتصال بالطابعة
    const result = await Swal.fire({
      title: 'الاتصال بالطابعة',
      html: `
        <div class="text-start">
          <p>⚠️ لم يتم الاتصال بالطابعة الحرارية بعد.</p>
          <p>يرجى النقر على "اتصال" واختيار الطابعة من القائمة.</p>
          <div class="alert alert-info mt-3">
            <small>📌 ملاحظة: تأكد من أن الطابعة متصلة بالجهاز ومشغلة.</small>
          </div>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '🖨️ اتصال بالطابعة',
      cancelButtonText: 'إلغاء',
      showDenyButton: true,
      denyButtonText: '📄 طباعة عادية (بدون طابعة)'
    });

    if (result.isConfirmed) {
      // محاولة الاتصال بالطابعة
      Swal.fire({
        title: 'جاري الاتصال...',
        text: 'الرجاء اختيار الطابعة من النافذة المنبثقة',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      const connected = await this.printerService.connectToThermalPrinter();
      Swal.close();

      if (!connected) {
        Swal.fire({
          icon: 'error',
          title: 'فشل الاتصال',
          text: 'لم يتم الاتصال بالطابعة. تأكد من أن الطابعة متصلة ومشغلة.',
          confirmButtonText: 'حسناً'
        });
        return;
      }
    } else if (result.isDenied) {
      // طباعة عادية بدون طابعة حرارية
      await this.printRegularReceipt(payment);
      return;
    } else {
      return;
    }
  }

  // إعداد بيانات الإيصال
  const receiptData: ReceiptData = {
    receiptNumber: payment.invoiceNumber || `RC-${Date.now().toString().slice(-8)}`,
    date: new Date().toLocaleDateString('en-US'),
    time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    studentName: payment.studentName || this.student?.name || '',
    studentId: payment.studentId || this.student?.studentId || '',
    className: payment.className || 'عام',
    month: payment.month,
    amount: payment.amount,
    paymentMethod: payment.paymentMethod || 'cash',
    academicYear: this.student?.academicYear,
    parentPhone: this.student?.parentPhone,
    notes: payment.notes || 'دفعة فردية'
  };

  try {
    Swal.fire({
      title: 'جاري الطباعة...',
      text: 'يرجى الانتظار، يتم إرسال البيانات إلى الطابعة الحرارية.',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    // محاولة الطباعة على الطابعة الحرارية
    const success = await this.printerService.printProfessionalReceipt(receiptData);
    
    Swal.close();

    if (success) {
      Swal.fire({
        icon: 'success',
        title: 'تمت الطباعة',
        text: 'تم طباعة الإيصال على الطابعة الحرارية بنجاح',
        timer: 2000,
        showConfirmButton: false
      });
    } else {
      throw new Error('فشلت الطباعة');
    }

  } catch (error) {
    console.error('خطأ في طباعة الإيصال:', error);
    Swal.close();
    
    // عرض خيار بديل للمستخدم
    const fallbackResult = await Swal.fire({
      title: 'فشل الطباعة على الطابعة الحرارية',
      html: `
        <div class="text-start">
          <p>❌ حدث خطأ أثناء محاولة الطباعة على الطابعة الحرارية.</p>
          <p>الأسباب المحتملة:</p>
          <ul>
            <li>الطابعة غير متصلة</li>
            <li>الطابعة غير مشغلة</li>
            <li>مشكلة في الاتصال</li>
          </ul>
        </div>
      `,
      icon: 'error',
      showCancelButton: true,
      confirmButtonText: '🔄 محاولة إعادة الاتصال',
      cancelButtonText: '📄 طباعة عادية',
      denyButtonText: 'إلغاء'
    });

    if (fallbackResult.isConfirmed) {
      // محاولة إعادة الاتصال
      await this.printerService.connectToThermalPrinter();
      // إعادة محاولة الطباعة
      await this.printPaymentReceipt(payment);
    } else if (fallbackResult.isDenied) {
      // طباعة عادية
      await this.printRegularReceipt(payment);
    }
  }
}
// أضف هذه الدالة في الـ Component

/**
 * محاولة الاتصال بالطابعة عند تحميل الصفحة (اختياري)
 */
async connectToPrinter(): Promise<void> {
  // يمكنك استدعاء هذه الدالة عند الحاجة، أو ترك المستخدم يختار وقت الاتصال
  const shouldConnect = await Swal.fire({
    title: 'الاتصال بالطابعة الحرارية',
    text: 'هل تريد الاتصال بالطابعة الحرارية الآن؟',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'نعم، اتصال',
    cancelButtonText: 'لاحقاً'
  });

  if (shouldConnect.isConfirmed) {
    Swal.fire({
      title: 'جاري الاتصال...',
      text: 'الرجاء اختيار الطابعة من النافذة المنبثقة',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    const connected = await this.printerService.connectToThermalPrinter();
    Swal.close();

    if (connected) {
      Swal.fire({
        icon: 'success',
        title: 'تم الاتصال',
        text: 'الطابعة الحرارية جاهزة للطباعة',
        timer: 2000,
        showConfirmButton: false
      });
    }
  }
}

/**
 * طباعة إيصال عادي (بدون طابعة حرارية)
 * هذه دالة احتياطية في حالة فشل الطابعة الحرارية
 */
private async printRegularReceipt(payment: Payment): Promise<void> {
  const receiptData = {
    receiptNumber: payment.invoiceNumber || `RC-${Date.now().toString().slice(-8)}`,
    date: new Date().toLocaleDateString('ar-EG'),
    time: new Date().toLocaleTimeString('ar-EG'),
    studentName: payment.studentName || this.student?.name || '',
    studentId: payment.studentId || this.student?.studentId || '',
    className: payment.className || 'عام',
    month: payment.month,
    amount: payment.amount,
    paymentMethod: payment.paymentMethod || 'cash',
    notes: payment.notes || 'دفعة فردية'
  };

  const htmlContent = this.generateSimpleReceiptHTML(receiptData);
  
  const printWindow = window.open('', '_blank', 'width=400,height=600');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    
    Swal.fire({
      icon: 'success',
      title: 'تم الطباعة',
      text: 'تم فتح نافذة الطباعة، يرجى اختيار الطابعة المناسبة',
      timer: 2000,
      showConfirmButton: false
    });
  } else {
    Swal.fire({
      icon: 'error',
      title: 'خطأ',
      text: 'لا يمكن فتح نافذة الطباعة. يرجى السماح بالنوافذ المنبثقة.',
      confirmButtonText: 'حسناً'
    });
  }
}

/**
 * إنشاء HTML بسيط للإيصال (للطباعة العادية)
 */
private generateSimpleReceiptHTML(data: any): string {
  return `
    <!DOCTYPE html>
    <html dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>إيصال دفع - ${data.receiptNumber}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Cairo', 'Tahoma', 'Arial', sans-serif;
          background: #f5f5f5;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          padding: 20px;
        }
        .receipt {
          max-width: 350px;
          width: 100%;
          background: white;
          border-radius: 16px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.1);
          overflow: hidden;
          direction: rtl;
        }
        .receipt-header {
          background: linear-gradient(135deg, #1e3c72, #2a5298);
          color: white;
          text-align: center;
          padding: 20px;
        }
        .receipt-header h1 { font-size: 20px; margin-bottom: 5px; }
        .receipt-header p { font-size: 12px; opacity: 0.9; }
        .receipt-body { padding: 20px; }
        .info-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px dashed #e0e0e0;
        }
        .info-label { font-weight: bold; color: #555; font-size: 13px; }
        .info-value { color: #333; font-size: 13px; }
        .amount-row {
          background: #e8f5e9;
          margin: 15px -20px -20px -20px;
          padding: 15px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .amount-label { font-weight: bold; font-size: 16px; color: #2e7d32; }
        .amount-value { font-size: 22px; font-weight: bold; color: #2e7d32; }
        .receipt-footer {
          background: #f9f9f9;
          padding: 15px 20px;
          text-align: center;
          font-size: 11px;
          color: #888;
          border-top: 1px solid #e0e0e0;
        }
        @media print {
          body { background: white; padding: 0; }
          .receipt { box-shadow: none; border: 1px solid #ddd; }
          .receipt-header { background: #1e3c72; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .amount-row { background: #e8f5e9; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      </style>
    </head>
    <body>
      <div class="receipt">
        <div class="receipt-header">
          <h1>أكاديمية الرواد للتعليم والمعارف</h1>
          <p>إيصال دفع رسمي</p>
        </div>
        <div class="receipt-body">
          <div class="info-row">
            <span class="info-label">رقم الإيصال:</span>
            <span class="info-value">${data.receiptNumber}</span>
          </div>
          <div class="info-row">
            <span class="info-label">التاريخ:</span>
            <span class="info-value">${data.date}</span>
          </div>
          <div class="info-row">
            <span class="info-label">الوقت:</span>
            <span class="info-value">${data.time}</span>
          </div>
          <div class="info-row">
            <span class="info-label">الطالب:</span>
            <span class="info-value">${data.studentName} (${data.studentId})</span>
          </div>
          <div class="info-row">
            <span class="info-label">الحصة:</span>
            <span class="info-value">${data.className}</span>
          </div>
          <div class="info-row">
            <span class="info-label">الشهر:</span>
            <span class="info-value">${data.month}</span>
          </div>
          <div class="info-row">
            <span class="info-label">طريقة الدفع:</span>
            <span class="info-value">${this.getPaymentMethodLabel(data.paymentMethod)}</span>
          </div>
          ${data.notes ? `
          <div class="info-row">
            <span class="info-label">ملاحظات:</span>
            <span class="info-value">${data.notes}</span>
          </div>
          ` : ''}
          <div class="amount-row">
            <span class="amount-label">المبلغ المدفوع:</span>
            <span class="amount-value">${data.amount.toLocaleString()} د.ج</span>
          </div>
        </div>
        <div class="receipt-footer">
          <p>شكراً لثقتكم</p>
          <p>نظام إدارة التعليم - ريدوكس</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

  private async printMultipleReceipts(payments: Payment[]): Promise<void> {
    if (!payments?.length) {
      Swal.fire({ icon: 'warning', title: 'لا توجد إيصالات للطباعة', confirmButtonText: 'حسناً' });
      return;
    }
    Swal.fire({ title: 'جاري الطباعة...', html: `<div class="text-center"><div class="spinner-border text-primary mb-3"></div><p>جاري طباعة ${payments.length} إيصال...</p>
      <div class="progress"><div class="progress-bar progress-bar-striped progress-bar-animated" style="width: 0%" id="print-progress">0%</div></div></div>`, showConfirmButton: false });
    let printedCount = 0;
    for (let i = 0; i < payments.length; i++) {
      const payment = payments[i];
      try {
        const receiptData: ReceiptData = {
          receiptNumber: payment.invoiceNumber || `RC-${Date.now().toString().slice(-8)}-${i}`,
          date: new Date().toLocaleDateString('en-US'),
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          studentName: payment.studentName || this.student?.name || '',
          studentId: payment.studentId || this.student?.studentId || '',
          className: payment.className || 'عام',
          month: payment.month,
          amount: payment.amount,
          paymentMethod: payment.paymentMethod || 'cash',
          academicYear: this.student?.academicYear,
          parentPhone: this.student?.parentPhone,
          notes: `دفعة جماعية - ${payment.notes || ''}`
        };
        await this.printerService.printProfessionalReceipt(receiptData);
        printedCount++;
        const progress = Math.round(((i + 1) / payments.length) * 100);
        const progressBar = document.getElementById('print-progress');
        if (progressBar) { progressBar.style.width = `${progress}%`; progressBar.textContent = `${progress}%`; }
        await this.delay(500);
      } catch (error) { console.error(`فشل طباعة إيصال ${i + 1}:`, error); }
    }
    Swal.close();
    Swal.fire({ title: 'نتائج الطباعة', html: `<div class="alert alert-success"><h6>تمت الطباعة بنجاح</h6><p><strong>المطبوع:</strong> ${printedCount}</p><p><strong>الإجمالي:</strong> ${payments.length}</p></div>`, icon: 'success', confirmButtonText: 'حسناً' });
  }

  private async printSingleReceiptForMultiplePayments(payments: Payment[], paymentMethod: string, notes?: string): Promise<void> {
    if (!payments?.length) return;
    try {
      Swal.fire({ title: 'جاري إنشاء الإيصال الموحد...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
      const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
      const bulkReceiptData: BulkReceiptData = {
        receiptNumber: `BLK-${Date.now().toString().slice(-8)}`,
        date: new Date().toLocaleDateString('ar-SA'),
        time: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
        totalAmount: totalAmount,
        paymentCount: payments.length,
        studentCount: new Set(payments.map(p => p.studentName || this.student?.name || '')).size,
        paymentMethod: paymentMethod,
        payments: payments.map(p => ({
          studentName: p.studentName || this.student?.name || 'طالب',
          studentId: p.studentId || this.student?.studentId || '',
          className: p.className || 'عام',
          month: p.month,
          amount: p.amount,
          notes: p.notes
        })),
        notes: notes || `دفع جماعي لـ ${payments.length} دفعة`
      };
      const success = await this.printerService.printBulkReceipt(bulkReceiptData);
      if (success) {
        Swal.fire({ icon: 'success', title: 'تم الطباعة', text: 'تم طباعة الإيصال الموحد بنجاح', timer: 1500, showConfirmButton: false });
      } else {
        throw new Error('فشل في طباعة الإيصال');
      }
    } catch (error) {
      console.error('خطأ في طباعة الإيصال الموحد:', error);
      Swal.fire({ icon: 'error', title: 'خطأ في الطباعة', text: 'فشل في طباعة الإيصال الموحد', confirmButtonText: 'حسناً' });
    }
  }

  printStudentReport(): void {
    if (!this.student) return;
    try {
      Swal.fire({ title: 'جاري إنشاء التقرير...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
      const totalPaid = this.getTotalPaid();
      const reportData = { student: this.student, classes: this.studentClasses, payments: this.paymentHistory, totalPaid: totalPaid, date: new Date().toLocaleDateString('ar-EG') };
      const printContent = this.generateReportHTML(reportData);
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      }
      Swal.fire('نجاح', 'تم إنشاء التقرير بنجاح', 'success');
    } catch (error) {
      console.error('Error printing report:', error);
      Swal.fire('خطأ', 'حدث خطأ أثناء إنشاء التقرير', 'error');
    }
  }

  private generateReportHTML(data: any): string {
    return `<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><title>تقرير الطالب</title><style>
      body { font-family: 'Arial', sans-serif; padding: 20px; } .report { max-width: 800px; margin: 0 auto; }
      .header { text-align: center; margin-bottom: 30px; } .student-info { background: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
      .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; } .section { margin-bottom: 30px; }
      table { width: 100%; border-collapse: collapse; margin-top: 10px; } th, td { padding: 10px; text-align: right; border: 1px solid #ddd; }
      th { background-color: #3498db; color: white; } .total { font-weight: bold; color: #2ecc71; font-size: 18px; }
    </style></head><body><div class="report"><div class="header"><h1>تقرير الطالب</h1><p>التاريخ: ${data.date}</p></div>
    <div class="student-info"><div class="info-grid"><div><strong>اسم الطالب:</strong> ${data.student.name}</div><div><strong>رقم الطالب:</strong> ${data.student.studentId}</div>
    <div><strong>المستوى الدراسي:</strong> ${this.getAcademicYearName(data.student.academicYear)}</div><div><strong>ولي الأمر:</strong> ${data.student.parentName}</div>
    <div><strong>هاتف ولي الأمر:</strong> ${data.student.parentPhone}</div></div></div>
    <div class="section"><h2>الحصص المسجلة</h2><tr><thead><tr><th>اسم الحصة</th><th>المادة</th><th>المعلم</th><th>السعر الشهري</th></tr></thead><tbody>
    ${data.classes.map((cls: any) => `<tr><td>${cls.name}</td><td>${cls.subject}</td><td>${cls.teacher?.name || 'غير محدد'}</td><td>${cls.price ? cls.price.toLocaleString() + ' د.ج' : 'غير محدد'}</td></tr>`).join('')}
    </tbody></table></div><div class="section"><h2>سجل المدفوعات</h2><table><thead><tr><th>التاريخ</th><th>المبلغ</th><th>الشهر</th><th>طريقة الدفع</th><th>الحالة</th></tr></thead><tbody>
    ${data.payments.map((payment: any) => `<tr><td>${payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString('ar-EG') : 'لم يتم الدفع'}</td>
       <td>${payment.amount.toLocaleString()} د.ج</td><td>${payment.month}</td><td>${this.getPaymentMethodLabel(payment.paymentMethod)}</td>
       <td>${this.getPaymentStatusText(payment)}</td></tr>`).join('')}</tbody></table><p class="total">الإجمالي المدفوع: ${data.totalPaid.toLocaleString()} د.ج</p></div>
    <div class="footer"><p>تم إنشاء التقرير تلقائياً من نظام إدارة المدرسة</p><p>© ${new Date().getFullYear()} جميع الحقوق محفوظة</p></div></div></body></html>`;
  }

  // ==================== COMMUNICATION METHODS ====================
  makeCall(phone: string): void {
    window.location.href = `tel:${phone}`;
  }

  sendEmail(email: string): void {
    window.location.href = `mailto:${email}`;
  }

  sendWhatsAppMessage(): void {
    if (this.student?.parentPhone) {
      const message = `عزيزي ولي أمر الطالب ${this.student.name}، هذا تذكير من نظام إدارة المدرسة.`;
      window.open(`https://wa.me/${this.student.parentPhone}?text=${encodeURIComponent(message)}`, '_blank');
    }
  }
}