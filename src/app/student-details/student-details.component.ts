import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import Swal from 'sweetalert2';
import { environment } from '../../environments/environment.development';
import { PrinterService, ReceiptData, BulkReceiptData, ConnectionType } from '../services/printer.service';
import { SoundService, SoundType } from '../sound.service';
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
  schoolId?: string;
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
  schoolId?: string;
}

interface ClassPaymentGroup {
  classId: string;
  className: string;
  payments: Payment[];
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  expanded?: boolean;
  progressPercentage?: number;
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
  schoolId?: string;
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
  schoolId?: string;
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
  schoolId?: string;
}

@Component({
  selector: 'app-student-details',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
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
            <span class="title-avatar" [style.background]="getAvatarColor(student.name)">
              {{ getInitials(student.name) }}
            </span>
            {{ student.name }}
          </h1>
          <div class="header-actions">
            <button class="action-btn print-btn" (click)="printStudentReport()">
              <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/>
                <rect x="6" y="14" width="12" height="8" rx="1" ry="1"/>
                <line x1="9" y1="4" x2="15" y2="4"/>
                <line x1="9" y1="6" x2="13" y2="6"/>
              </svg>
              تقرير
            </button>
            
            <!-- زر اتصال الطابعة مع اختيار نوع الاتصال -->
            <div class="printer-connect-group">
              <button class="action-btn printer-connect-btn" (click)="showPrinterConnectionModal()">
                <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/>
                  <rect x="6" y="14" width="12" height="8" rx="1" ry="1"/>
                  <line x1="9" y1="4" x2="15" y2="4"/>
                  <line x1="9" y1="6" x2="13" y2="6"/>
                </svg>
                {{ printerConnected ? '🖨️ طابعة متصلة' : '🔌 اتصال طابعة' }}
                <span class="connection-badge" [class.connected]="printerConnected" [class.disconnected]="!printerConnected">
                  {{ printerConnected ? (connectionType === 'usb' ? 'USB' : 'COM') : 'غير متصل' }}
                </span>
              </button>
            </div>
            
            <button class="action-btn whatsapp-btn" (click)="sendWhatsAppMessage()" *ngIf="student?.parentPhone">
              <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21z"/>
                <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1z"/>
                <path d="M14 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1z"/>
              </svg>
              واتساب
            </button>
            <button class="action-btn refresh-btn" (click)="refreshData()">
              <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 4v6h6"/>
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
              </svg>
              تحديث
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
              <div class="profile-avatar" [style.background]="getAvatarColor(student.name)">
                <span class="avatar-text">{{ getInitials(student.name) }}</span>
              </div>
              <div class="profile-status">
                <span class="status-badge" [class.active]="student.active" [class.inactive]="!student.active">
                  <span class="status-dot"></span>
                  {{ student.active ? 'نشط' : 'غير نشط' }}
                </span>
                <span class="status-badge registration" [class.paid]="student.hasPaidRegistration">
                  <span class="status-dot"></span>
                  {{ student.hasPaidRegistration ? 'مسدد التسجيل' : 'غير مسدد' }}
                </span>
              </div>
            </div>
            <h2 class="profile-name">{{ student.name }}</h2>
            <p class="profile-id">
              <svg class="icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <line x1="3" y1="9" x2="21" y2="9"/>
                <line x1="3" y1="15" x2="21" y2="15"/>
                <line x1="9" y1="21" x2="9" y2="9"/>
              </svg>
              رقم الطالب: {{ student.studentId }}
            </p>
            
            <div class="info-details">
              <div class="info-row">
                <span class="info-label">
                  <svg class="icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                    <path d="M2 17l10 5 10-5"/>
                    <path d="M2 12l10 5 10-5"/>
                  </svg>
                  المستوى الدراسي:
                </span>
                <span class="info-value">{{ getAcademicYearName(student.academicYear) }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">
                  <svg class="icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  ولي الأمر:
                </span>
                <span class="info-value">{{ student.parentName }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">
                  <svg class="icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="5" y="2" width="14" height="20" rx="2"/>
                    <line x1="12" y1="18" x2="12.01" y2="18"/>
                  </svg>
                  رقم الهاتف:
                </span>
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
                <span class="info-label">
                  <svg class="icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="2" y="4" width="20" height="16" rx="2"/>
                    <path d="m22 7-10 7L2 7"/>
                  </svg>
                  البريد الإلكتروني:
                </span>
                <span class="info-value">{{ student.parentEmail }}</span>
                <button class="email-btn" (click)="sendEmail(student.parentEmail)" title="بريد">
                  <svg class="icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="2" y="4" width="20" height="16" rx="2"/>
                    <path d="m22 7-10 7L2 7"/>
                  </svg>
                </button>
              </div>
              <div class="info-row" *ngIf="student.birthDate">
                <span class="info-label">
                  <svg class="icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="4" width="18" height="18" rx="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  تاريخ الميلاد:
                </span>
                <span class="info-value">{{ student.birthDate | date:'dd/MM/yyyy' }} (العمر: {{ calculateAge(student.birthDate) }} سنة)</span>
              </div>
              <div class="info-row">
                <span class="info-label">
                  <svg class="icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="4" width="18" height="18" rx="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  تاريخ التسجيل:
                </span>
                <span class="info-value">{{ student.registrationDate | date:'dd/MM/yyyy' }}</span>
              </div>
            </div>
          </div>

          <div class="card financial-card">
            <h3 class="card-title">
              <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="6" width="20" height="14" rx="2"/>
                <line x1="2" y1="10" x2="22" y2="10"/>
                <circle cx="16" cy="14" r="1"/>
              </svg>
              الملخص المالي
            </h3>
            <div class="financial-stats">
              <div class="stat-item">
                <div class="stat-value paid">{{ getTotalPaid() | number:'1.0-0' }} د.ج</div>
                <div class="stat-label">المدفوع</div>
              </div>
              <div class="stat-item">
                <div class="stat-value pending">{{ getTotalPending() | number:'1.0-0' }} د.ج</div>
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
                <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
            <div class="header-actions">
              <button class="add-btn" (click)="openAddToLessonsModal()">
                <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
                إضافة حصة
              </button>
              <button class="add-btn secondary" (click)="fixStudentClasses()" *ngIf="student">
                <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 4v6h6"/>
                  <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
                </svg>
                إصلاح العلاقات
              </button>
            </div>
          </div>

          <div class="classes-grid" *ngIf="studentClasses.length > 0; else noClasses" >
            <div class="class-card" *ngFor="let classItem of studentClasses" style='cursor: pointer;' routerLink="/lesson-detail/{{ classItem._id }}">
              <div class="class-header">
                <h4 class="class-name">{{ classItem.name }}</h4>
                <span class="payment-badge" [class.monthly]="classItem.paymentSystem === 'monthly'" [class.rounds]="classItem.paymentSystem === 'rounds'">
                  {{ classItem.paymentSystem === 'monthly' ? 'شهري' : 'جولات' }}
                </span>
              </div>
              <div class="class-details">
                <p>
                  <span class="detail-label">
                    <svg class="icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                    </svg>
                    المادة:
                  </span>
                  {{ classItem.subject }}
                </p>
                <p>
                  <span class="detail-label">
                    <svg class="icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="2" y="6" width="20" height="14" rx="2"/>
                      <line x1="2" y1="10" x2="22" y2="10"/>
                      <circle cx="16" cy="14" r="1"/>
                    </svg>
                    السعر الشهري:
                  </span>
                  {{ classItem.price | number:'1.0-0' }} د.ج
                </p>
                <p *ngIf="classItem.teacher">
                  <span class="detail-label">
                    <svg class="icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                    الأستاذ:
                  </span>
                  {{ classItem.teacher.name }}
                </p>
                <p *ngIf="classItem.schedule?.length">
                  <span class="detail-label">
                    <svg class="icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12 6 12 12 16 14"/>
                    </svg>
                    المواعيد:
                  </span>
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
              <div class="empty-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                </svg>
              </div>
              <p>لا توجد حصص مسجلة</p>
              <button class="add-btn-outline" (click)="openAddToLessonsModal()">تسجيل في حصة</button>
            </div>
          </ng-template>
        </div>
      </div>

      <!-- Payments Tab - Enhanced -->
      <div *ngIf="activeTab === 'payments'" class="tab-content">
        <div class="payments-container">
          <div class="payments-header">
            <h3 class="section-title">
              <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="6" width="20" height="12" rx="2"/>
                <path d="M12 12h.01"/>
                <path d="M16 12h.01"/>
                <path d="M8 12h.01"/>
              </svg>
              سجل المدفوعات
            </h3>
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

          <!-- Stats Summary -->
          <div class="payment-stats" *ngIf="classPaymentGroups.length > 0">
            <div class="stat-card">
              <div class="stat-icon"><i class='fas fa-chalkboard-teacher' style='color:blue'></i>
</div>
              <div class="stat-info">
                <span class="stat-value">{{ classPaymentGroups.length }}</span>
                <span class="stat-label">إجمالي الحصص</span>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon"><i class='far fa-credit-card' style='color:blue'></i></div>
              <div class="stat-info">
                <span class="stat-value">{{ getTotalPaid() | number:'1.0-0' }} د.ج</span>
                <span class="stat-label">إجمالي المدفوع</span>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">⏳</div>
              <div class="stat-info">
                <span class="stat-value">{{ getTotalPending() | number:'1.0-0' }} د.ج</span>
                <span class="stat-label">المتبقي</span>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">📈</div>
              <div class="stat-info">
                <span class="stat-value">{{ getPaymentPercentage() }}%</span>
                <span class="stat-label">نسبة السداد</span>
              </div>
            </div>
          </div>

          <!-- Filter Controls -->
          <div class="filter-section">
            <div class="filter-group">
              <label>📅 الشهر</label>
              <select [(ngModel)]="selectedMonthForGroupPay" (change)="selectPaymentsByMonth(selectedMonthForGroupPay)" class="filter-select">
                <option value="">جميع الأشهر</option>
                <option *ngFor="let m of getUniqueMonths()" [value]="m">{{ m }}</option>
              </select>
            </div>
            <div class="filter-group">
              <label>📚 الحصة</label>
              <select [(ngModel)]="selectedClassForGroupPay" (change)="selectPaymentsByClass(selectedClassForGroupPay)" class="filter-select">
                <option value="all">جميع الحصص</option>
                <option *ngFor="let group of classPaymentGroups" [value]="group.classId">{{ group.className }}</option>
              </select>
            </div>
            <button class="filter-clear" (click)="selectAllPendingPayments()">
              <svg class="icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 12H4M12 4v16"/>
              </svg>
              تحديد الكل
            </button>
          </div>

          <!-- Payment Groups -->
          <div class="payment-groups">
            <div class="group-card" *ngFor="let group of classPaymentGroups" [class.expanded]="isClassGroupExpanded(group.classId)">
              <div class="group-header" (click)="toggleClassPaymentGroup(group.classId)">
                <div class="group-info">
                  <h4 class="group-name">{{ group.className }}</h4>
                  <div class="group-stats">
                    <span class="stat total">
                      <span class="stat-icon"><i class='fas fa-chalkboard-teacher' style='color:blue'></i>
S</span>
                      المجموع: {{ group.totalAmount | number:'1.0-0' }} د.ج
                    </span>
                    <span class="stat paid">
                      <span class="stat-icon">✅</span>
                      مدفوع: {{ group.paidAmount | number:'1.0-0' }} د.ج
                    </span>
                    <span class="stat pending">
                      <span class="stat-icon">⏳</span>
                      متبقي: {{ group.pendingAmount | number:'1.0-0' }} د.ج
                    </span>
                  </div>
                  <div class="group-progress">
                    <div class="progress-bar small">
                      <div class="progress-fill" [style.width.%]="(group.paidAmount / group.totalAmount * 100)"></div>
                    </div>
                    <span class="progress-text">{{ (group.paidAmount / group.totalAmount * 100) | number:'1.0-0' }}%</span>
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
                    <div class="payment-month">
                      <span class="month-icon"><i class='fas fa-calendar-alt' style='color:blue'></i>
<br></span>
                      {{ payment.monthCode }}
                      <span class="payment-amount">{{ payment.amount | number:'1.0-0' }} د.ج</span>
                    </div>
                    <div class="payment-details">
                      <span class="payment-status" [class]="getPaymentStatusClass(payment)">
                        {{ getPaymentStatusText(payment) }}
                      </span>
                      <span class="payment-method" *ngIf="payment.paymentMethod">
                        <span class="method-icon">💳</span>
                        {{ getPaymentMethodLabel(payment.paymentMethod) }}
                      </span>
                      <span class="payment-date" *ngIf="payment.paymentDate">
                        <span class="date-icon">📆</span>
                        {{ payment.paymentDate | date:'dd/MM/yyyy' }}
                      </span>
                    </div>
                    <div class="payment-notes" *ngIf="payment.notes">
                      <span class="notes-icon">📝</span>
                      {{ payment.notes }}
                    </div>
                  </div>
                  <div class="payment-actions">
                    <button class="icon-btn print" (click)="printPaymentReceipt(payment)" title="طباعة">
                      <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/>
                        <rect x="6" y="14" width="12" height="8" rx="1" ry="1"/>
                        <line x1="9" y1="4" x2="15" y2="4"/>
                        <line x1="9" y1="6" x2="13" y2="6"/>
                      </svg>
                    </button>
                    
                    <button class="icon-btn pay" *ngIf="payment.status !== 'paid'" (click)="payPayment(payment)" title="دفع">
                      <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                      </svg>
                    </button>
                    
                    <button class="icon-btn edit" *ngIf="payment.status !== 'paid'" (click)="openEditPaymentModal(payment)" title="تعديل">
                      <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
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
                        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="payments-summary" *ngIf="selectedPaymentsForBulkPay.length > 0">
            <div class="summary-info">
              <span class="summary-item">
                <span class="item-icon"><i class='fas fa-chalkboard-teacher' style='color:blue'></i>
S</span>
                المختارة: {{ selectedPaymentsForBulkPay.length }} دفعة
              </span>
              <span class="summary-item">
                <span class="item-icon"><i class='far fa-credit-card' style='color:blue'></i></span>
                المبلغ الإجمالي: {{ getSelectedPaymentsTotal() | number:'1.0-0' }} د.ج
              </span>
            </div>
            <div class="summary-actions">
              <button class="btn-success" (click)="processBulkPaySelected()">
                <svg class="icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
                دفع الجماعي
              </button>
              <button class="btn-secondary" (click)="selectedPaymentsForBulkPay = []">
                <svg class="icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
                إلغاء التحديد
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Payment Systems Tab -->
      <div *ngIf="activeTab === 'payment-systems'" class="tab-content">
        <div class="payment-systems-container">
          <!-- Monthly Payments Section -->
          <div class="system-section">
            <h3 class="section-title">
              <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="6" width="20" height="12" rx="2"/>
                <path d="M12 12h.01"/>
                <path d="M16 12h.01"/>
                <path d="M8 12h.01"/>
              </svg>
              الدفعات الشهرية
            </h3>
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
                    <td>
                      <span class="month-cell">{{ payment.month }}</span>
                    </td>
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
            <h3 class="section-title">
              <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 6v6l4 2"/>
              </svg>
              الجولات
            </h3>
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
          <h3>
            <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            إضافة دفعة جديدة
          </h3>
          <button class="close-btn" (click)="closePaymentModal()">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label><i class='far fa-credit-card' style='color:blue'></i> المبلغ</label>
            <input type="number" [(ngModel)]="newPayment.amount" class="form-control" placeholder="المبلغ بالدينار">
          </div>
          <div class="form-group">
            <label>📅 الشهر</label>
            <select [(ngModel)]="newPayment.month" class="form-control">
              <option *ngFor="let m of generateMonthOptions()" [value]="m">{{ m }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>💳 طريقة الدفع</label>
            <select [(ngModel)]="newPayment.paymentMethod" class="form-control">
              <option *ngFor="let m of paymentMethods" [value]="m.value">{{ m.label }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>📝 ملاحظات</label>
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
          <h3>
            <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
            تعديل الدفعة
          </h3>
          <button class="close-btn" (click)="closeEditPaymentModal()">✕</button>
        </div>
        <div class="modal-body" *ngIf="editingPayment">
          <div class="form-group">
            <label><i class='far fa-credit-card' style='color:blue'></i> المبلغ</label>
            <input type="number" [(ngModel)]="editingPayment.amount" class="form-control">
          </div>
          <div class="form-group">
            <label>💳 طريقة الدفع</label>
            <select [(ngModel)]="editingPayment.paymentMethod" class="form-control">
              <option *ngFor="let m of paymentMethods" [value]="m.value">{{ m.label }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>📝 ملاحظات</label>
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
          <h3>
            <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            تأكيد الدفع الجماعي
          </h3>
          <button class="close-btn" (click)="closeBulkPayConfirmation()">✕</button>
        </div>
        <div class="modal-body">
          <div class="confirmation-summary">
            <div class="summary-item">
              <span><i class='fas fa-chalkboard-teacher' style='color:blue'></i>
S عدد الدفعات:</span>
              <strong>{{ selectedPaymentsForBulkPay.length }}</strong>
            </div>
            <div class="summary-item">
              <span><i class='far fa-credit-card' style='color:blue'></i> المبلغ الإجمالي:</span>
              <strong>{{ getSelectedPaymentsTotal() | number:'1.0-0' }} د.ج</strong>
            </div>
            <div class="summary-item">
              <span>👨‍🎓 عدد الطلاب:</span>
              <strong>{{ getUniqueStudentsCount() }}</strong>
            </div>
          </div>
          <div class="form-group">
            <label>💳 طريقة الدفع</label>
            <select [(ngModel)]="bulkPayment.paymentMethod" class="form-control">
              <option *ngFor="let m of paymentMethods" [value]="m.value">{{ m.label }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>🖨️ خيار الطباعة</label>
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
            <label>📝 ملاحظات</label>
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
          <h3>
            <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            تسجيل في حصص
          </h3>
          <button class="close-btn" (click)="closeAddToLessonsModal()">✕</button>
        </div>
        <div class="modal-body">
          <div class="filters-row">
            <div class="filter-group">
              <label>📚 المادة</label>
              <select [(ngModel)]="filterSubject" (change)="filterAvailableClasses()" class="form-control">
                <option value="">الكل</option>
                <option *ngFor="let s of subjects" [value]="s">{{ s }}</option>
              </select>
            </div>
            <div class="filter-group">
              <label>🎓 المستوى</label>
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
            <div class="empty-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <p>لا توجد سجلات غياب لهذا الطالب</p>
            <p class="text-muted small">جميع الحصص مسجلة كحضور</p>
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="btn-secondary" (click)="closeAbsencesModal()">إغلاق</button>
        </div>
      </div>
    </div>

    <!-- Printer Connection Modal -->
    <div class="modal-overlay" *ngIf="showPrinterConnectionModalFlag" (click)="closePrinterConnectionModal()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>
            <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/>
              <rect x="6" y="14" width="12" height="8" rx="1" ry="1"/>
              <line x1="9" y1="4" x2="15" y2="4"/>
              <line x1="9" y1="6" x2="13" y2="6"/>
            </svg>
            اختيار طريقة الاتصال بالطابعة
          </h3>
          <button class="close-btn" (click)="closePrinterConnectionModal()">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>🔌 نوع الاتصال</label>
            <select [(ngModel)]="connectionType" class="form-control">
              <option value="usb">USB</option>
              <option value="com">COM (منفذ تسلسلي)</option>
            </select>
          </div>
          
          <div *ngIf="connectionType === 'com'" class="form-group">
            <label>📟 منفذ COM</label>
            <select [(ngModel)]="selectedComPort" class="form-control">
              <option *ngFor="let port of comPorts" [value]="port">{{ port }}</option>
            </select>
            <small class="text-muted">اختر المنفذ التسلسلي المتصل به الطابعة</small>
          </div>
          
          <div *ngIf="connectionType === 'com'" class="form-group">
            <label>⚡ سرعة الاتصال (Baud Rate)</label>
            <select [(ngModel)]="selectedBaudRate" class="form-control">
              <option *ngFor="let rate of baudRates" [value]="rate">{{ rate }}</option>
            </select>
          </div>
          
          <div class="alert alert-info mt-3">
            <small>
              <strong>📌 ملاحظة:</strong>
              <span *ngIf="connectionType === 'usb'">الطابعات المتصلة عبر USB يتم اكتشافها تلقائياً. تأكد من توصيل الطابعة.</span>
              <span *ngIf="connectionType === 'com'">للطابعات المتصلة عبر منفذ COM، يرجى اختيار المنفذ الصحيح (مثل COM1, COM2, إلخ).</span>
            </small>
          </div>
          
          <div class="printer-status mt-3" *ngIf="printerConnected">
            <div class="status-indicator connected">
              <span class="status-dot"></span>
              <span>✅ الطابعة متصلة عبر {{ connectionType === 'usb' ? 'USB' : 'COM' }}</span>
            </div>
          </div>
          <div class="printer-status mt-3" *ngIf="!printerConnected">
            <div class="status-indicator disconnected">
              <span class="status-dot"></span>
              <span>❌ الطابعة غير متصلة</span>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" (click)="closePrinterConnectionModal()">إلغاء</button>
          <button class="btn-primary" (click)="connectPrinterWithSettings()" [disabled]="isConnectingPrinter">
            <span *ngIf="!isConnectingPrinter">🔌 اتصال</span>
            <span *ngIf="isConnectingPrinter"> جاري الاتصال...</span>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Modern CSS Variables */
    :host {
      --primary: #2563eb;
      --primary-dark: #1d4ed8;
      --primary-light: #60a5fa;
      --secondary: #10b981;
      --danger: #ef4444;
      --warning: #f59e0b;
      --success: #10b981;
      --gray-50: #f8fafc;
      --gray-100: #f1f5f9;
      --gray-200: #e2e8f0;
      --gray-300: #cbd5e1;
      --gray-400: #94a3b8;
      --gray-500: #64748b;
      --gray-600: #475569;
      --gray-700: #334155;
      --gray-800: #1e293b;
      --gray-900: #0f172a;
      --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
      --shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
      --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
      --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
      --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
      --radius: 16px;
      --radius-sm: 10px;
      --radius-xs: 6px;
      --transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
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
      border-radius: var(--radius);
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
      gap: 0.75rem;
      color: var(--gray-800);
    }
    .title-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
      font-weight: 700;
      color: white;
    }
    .header-actions {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
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
    
    /* Printer Connect Button Styles */
    .printer-connect-group {
      position: relative;
    }
    .printer-connect-btn {
      background: #6366f1;
      color: white;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .printer-connect-btn:hover {
      background: #4f46e5;
    }
    .connection-badge {
      display: inline-block;
      padding: 0.15rem 0.6rem;
      border-radius: 12px;
      font-size: 0.6rem;
      font-weight: 600;
      margin-left: 0.3rem;
    }
    .connection-badge.connected {
      background: #10b981;
      color: white;
    }
    .connection-badge.disconnected {
      background: #ef4444;
      color: white;
    }
    
    .whatsapp-btn {
      background: #25D366;
      color: white;
    }
    .whatsapp-btn:hover {
      background: #20b359;
    }
    .refresh-btn {
      background: var(--primary);
      color: white;
    }
    .refresh-btn:hover {
      background: var(--primary-dark);
    }

    /* Tabs */
    .tabs-container {
      background: white;
      border-radius: var(--radius);
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
      border-radius: var(--radius-sm);
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
      border-radius: var(--radius);
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
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: var(--shadow-md);
    }
    .avatar-text {
      font-size: 2.5rem;
      font-weight: 700;
      color: white;
    }
    .profile-status {
      display: flex;
      gap: 0.5rem;
    }
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 500;
    }
    .status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      display: inline-block;
    }
    .status-badge.active {
      background: #d1fae5;
      color: #065f46;
    }
    .status-badge.active .status-dot {
      background: #065f46;
    }
    .status-badge.inactive {
      background: #fee2e2;
      color: #991b1b;
    }
    .status-badge.inactive .status-dot {
      background: #991b1b;
    }
    .status-badge.registration.paid {
      background: #dbeafe;
      color: #1e40af;
    }
    .status-badge.registration.paid .status-dot {
      background: #1e40af;
    }
    .status-badge.registration {
      background: #fef3c7;
      color: #92400e;
    }
    .status-badge.registration .status-dot {
      background: #92400e;
    }
    .profile-name {
      font-size: 1.5rem;
      font-weight: 600;
      margin: 0.5rem 0;
    }
    .profile-id {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      color: var(--gray-500);
      margin-bottom: 1.5rem;
    }
    .info-details {
      text-align: right;
    }
    .info-row {
      display: flex;
      align-items: center;
      padding: 0.75rem 0;
      border-bottom: 1px solid var(--gray-200);
      gap: 0.5rem;
    }
    .info-row .info-label {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      color: var(--gray-600);
      font-size: 0.85rem;
      min-width: 120px;
    }
    .info-row .info-value {
      font-weight: 500;
      color: var(--gray-800);
      flex: 1;
    }
    .call-btn, .msg-btn, .email-btn {
      background: none;
      border: none;
      cursor: pointer;
      padding: 0.25rem;
      border-radius: var(--radius-sm);
      transition: var(--transition);
      color: var(--gray-500);
    }
    .call-btn:hover { background: #d1fae5; color: #065f46; }
    .msg-btn:hover { background: #d1fae5; color: #25D366; }
    .email-btn:hover { background: #dbeafe; color: #1e40af; }

    /* Financial Card */
    .financial-card .card-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 1.1rem;
      margin-bottom: 1rem;
      color: var(--gray-700);
    }
    .financial-stats {
      display: flex;
      justify-content: space-around;
      margin-bottom: 1.5rem;
    }
    .stat-item {
      text-align: center;
    }
    .stat-value {
      font-size: 1.5rem;
      font-weight: 700;
    }
    .stat-value.paid {
      color: var(--success);
    }
    .stat-value.pending {
      color: var(--warning);
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
      background: var(--primary);
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
      border-radius: var(--radius-sm);
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
      background: #dbeafe;
      color: #1e40af;
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
      display: flex;
      align-items: center;
      gap: 0.5rem;
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
    .add-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .add-btn-outline {
      background: none;
      border: 2px solid var(--primary);
      color: var(--primary);
      padding: 0.5rem 1rem;
      border-radius: var(--radius-sm);
      cursor: pointer;
      font-weight: 500;
      transition: var(--transition);
    }
    .add-btn-outline:hover {
      background: var(--primary);
      color: white;
    }
    .classes-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1rem;
    }
    .class-card {
      background: white;
      border-radius: var(--radius-sm);
      padding: 1rem;
      box-shadow: var(--shadow-sm);
      transition: var(--transition);
      border: 1px solid var(--gray-200);
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
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.7rem;
      font-weight: 500;
    }
    .payment-badge.monthly {
      background: #dbeafe;
      color: #1e40af;
    }
    .payment-badge.rounds {
      background: #fef3c7;
      color: #92400e;
    }
    .class-details p {
      margin: 0.5rem 0;
      font-size: 0.85rem;
      color: var(--gray-600);
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }
    .detail-label {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      font-weight: 500;
      color: var(--gray-700);
      min-width: 80px;
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

    /* ==================== PAYMENTS STYLES ==================== */
    .payment-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .payment-stats .stat-card {
      background: white;
      border-radius: var(--radius-sm);
      padding: 1rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      box-shadow: var(--shadow-sm);
      transition: var(--transition);
      border: 1px solid var(--gray-100);
    }
    .payment-stats .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }
    .payment-stats .stat-icon {
      font-size: 1.5rem;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--gray-50);
      border-radius: var(--radius-sm);
    }
    .payment-stats .stat-info {
      display: flex;
      flex-direction: column;
    }
    .payment-stats .stat-value {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--gray-800);
    }
    .payment-stats .stat-label {
      font-size: 0.75rem;
      color: var(--gray-500);
    }

    .filter-section {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      margin-bottom: 1.5rem;
      padding: 1rem;
      background: white;
      border-radius: var(--radius-sm);
      box-shadow: var(--shadow-sm);
      border: 1px solid var(--gray-100);
    }
    .filter-group {
      flex: 1;
      min-width: 150px;
    }
    .filter-group label {
      display: block;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--gray-500);
      margin-bottom: 0.25rem;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .filter-select {
      width: 100%;
      padding: 0.6rem;
      border: 1.5px solid var(--gray-200);
      border-radius: var(--radius-sm);
      background: white;
      font-family: inherit;
      transition: var(--transition);
    }
    .filter-select:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    }
    .filter-clear {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.6rem 1.2rem;
      background: var(--gray-200);
      border: none;
      border-radius: var(--radius-sm);
      cursor: pointer;
      font-weight: 500;
      align-self: flex-end;
      transition: var(--transition);
    }
    .filter-clear:hover {
      background: var(--gray-300);
    }

    .group-card {
      background: white;
      border-radius: var(--radius-sm);
      margin-bottom: 1rem;
      overflow: hidden;
      box-shadow: var(--shadow-sm);
      border: 1px solid var(--gray-200);
      transition: var(--transition);
    }
    .group-card:hover {
      border-color: var(--primary-light);
    }
    .group-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.25rem;
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
      color: var(--gray-800);
    }
    .group-stats {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      font-size: 0.8rem;
    }
    .group-stats .stat {
      display: flex;
      align-items: center;
      gap: 0.3rem;
    }
    .group-stats .stat-icon {
      font-size: 0.85rem;
    }
    .stat.total { color: var(--gray-600); }
    .stat.paid { color: var(--success); }
    .stat.pending { color: var(--warning); }
    
    .group-progress {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-top: 0.5rem;
    }
    .group-progress .progress-bar {
      flex: 1;
      height: 6px;
      background: var(--gray-200);
      border-radius: 3px;
      overflow: hidden;
    }
    .group-progress .progress-fill {
      height: 100%;
      border-radius: 3px;
      background: var(--primary);
      transition: width 0.5s ease;
    }
    .group-progress .progress-text {
      font-size: 0.7rem;
      color: var(--gray-500);
      min-width: 40px;
      text-align: left;
    }

    .group-actions {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .expand-icon {
      width: 1.2rem;
      height: 1.2rem;
      transition: transform 0.3s ease;
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
      padding: 0.75rem 1.25rem;
      border-bottom: 1px solid var(--gray-100);
      transition: var(--transition);
      gap: 1rem;
    }
    .payment-item:last-child {
      border-bottom: none;
    }
    .payment-item:hover {
      background: var(--gray-50);
    }
    .payment-item.paid {
      background: #f8fafc;
      opacity: 0.75;
    }
    .payment-item.pending {
      border-right: 4px solid var(--warning);
    }
    .payment-item.late {
      border-right: 4px solid var(--danger);
      background: #fef2f2;
    }
    .payment-checkbox {
      flex-shrink: 0;
    }
    .payment-info {
      flex: 1;
      min-width: 0;
    }
    .payment-month {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 600;
      color: var(--gray-800);
      margin-bottom: 0.25rem;
    }
    .month-icon {
      font-size: 0.9rem;
    }
    .payment-amount {
      margin-right: auto;
      font-size: 1rem;
      color: var(--primary);
    }
    .payment-details {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      font-size: 0.8rem;
      align-items: center;
    }
    .payment-status {
      padding: 0.2rem 0.6rem;
      border-radius: 12px;
      font-size: 0.7rem;
      font-weight: 500;
    }
    .payment-status.bg-success { background: #d1fae5; color: #065f46; }
    .payment-status.bg-warning { background: #fef3c7; color: #92400e; }
    .payment-status.bg-danger { background: #fee2e2; color: #991b1b; }
    .payment-status.bg-secondary { background: var(--gray-200); color: var(--gray-600); }
    
    .payment-method, .payment-date {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      color: var(--gray-500);
    }
    .method-icon, .date-icon {
      font-size: 0.75rem;
    }
    .payment-notes {
      margin-top: 0.25rem;
      font-size: 0.75rem;
      color: var(--gray-400);
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }
    .notes-icon {
      font-size: 0.7rem;
    }

    .payment-actions {
      display: flex;
      gap: 0.25rem;
      flex-shrink: 0;
    }
    .icon-btn {
      background: none;
      border: none;
      cursor: pointer;
      padding: 0.4rem;
      border-radius: var(--radius-xs);
      transition: var(--transition);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: var(--gray-400);
    }
    .icon-btn:hover {
      background: var(--gray-100);
      color: var(--gray-700);
    }
    .icon-btn.print { color: var(--primary); }
    .icon-btn.print:hover { background: #dbeafe; color: var(--primary-dark); }
    .icon-btn.pay { color: var(--success); }
    .icon-btn.pay:hover { background: #d1fae5; color: var(--success); }
    .icon-btn.edit { color: #8b5cf6; }
    .icon-btn.edit:hover { background: #ede9fe; color: #7c3aed; }
    .icon-btn.cancel { color: var(--warning); }
    .icon-btn.cancel:hover { background: #fef3c7; color: var(--warning); }
    .icon-btn.delete { color: var(--danger); }
    .icon-btn.delete:hover { background: #fee2e2; color: var(--danger); }

    .payments-summary {
      background: var(--primary);
      color: white;
      padding: 1rem 1.5rem;
      border-radius: var(--radius-sm);
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
      margin-top: 1rem;
    }
    .summary-info {
      display: flex;
      gap: 1.5rem;
      flex-wrap: wrap;
    }
    .summary-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .item-icon {
      font-size: 0.9rem;
    }
    .summary-actions {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
    }
    .btn-success {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: var(--success);
      color: white;
      border: none;
      padding: 0.5rem 1.2rem;
      border-radius: var(--radius-sm);
      cursor: pointer;
      font-weight: 500;
      transition: var(--transition);
    }
    .btn-success:hover {
      background: #059669;
    }
    .btn-secondary {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: rgba(255,255,255,0.2);
      color: white;
      border: 1px solid rgba(255,255,255,0.3);
      padding: 0.5rem 1.2rem;
      border-radius: var(--radius-sm);
      cursor: pointer;
      font-weight: 500;
      transition: var(--transition);
    }
    .btn-secondary:hover {
      background: rgba(255,255,255,0.3);
    }

    /* Payment Systems Tab */
    .payment-systems-container {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }
    .system-section {
      background: white;
      border-radius: var(--radius);
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
      background: var(--gray-50);
      font-weight: 600;
      color: var(--gray-600);
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .modern-table tr:hover td {
      background: var(--gray-50);
    }
    .month-cell {
      font-weight: 500;
      color: var(--gray-800);
    }
    .rounds-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1rem;
    }
    .round-card {
      background: var(--gray-50);
      border-radius: var(--radius-sm);
      padding: 1rem;
      border: 1px solid var(--gray-200);
      transition: var(--transition);
    }
    .round-card:hover {
      border-color: var(--primary-light);
      box-shadow: var(--shadow-sm);
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
      color: var(--gray-800);
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
      margin-bottom: 1rem;
      color: var(--gray-300);
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
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
    }
    .modal-content {
      background: white;
      border-radius: var(--radius);
      width: 100%;
      max-width: 500px;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: var(--shadow-xl);
    }
    .modal-content.large {
      max-width: 900px;
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
      font-size: 1.1rem;
      color: var(--gray-800);
    }
    .close-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: var(--gray-500);
      padding: 0.25rem 0.5rem;
      border-radius: var(--radius-xs);
      transition: var(--transition);
    }
    .close-btn:hover {
      background: var(--gray-100);
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
      color: var(--gray-700);
    }
    .form-control {
      width: 100%;
      padding: 0.6rem 0.8rem;
      border: 1.5px solid var(--gray-200);
      border-radius: var(--radius-sm);
      font-family: inherit;
      transition: var(--transition);
    }
    .form-control:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    }
    .radio-group {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .radio-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
    }
    .btn-primary {
      background: var(--primary);
      color: white;
      border: none;
      padding: 0.6rem 1.5rem;
      border-radius: var(--radius-sm);
      cursor: pointer;
      font-weight: 500;
      transition: var(--transition);
    }
    .btn-primary:hover {
      background: var(--primary-dark);
      transform: translateY(-1px);
    }
    .btn-primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .btn-danger {
      background: var(--danger);
      color: white;
      border: none;
      padding: 0.6rem 1.5rem;
      border-radius: var(--radius-sm);
      cursor: pointer;
      font-weight: 500;
    }
    .confirmation-summary {
      background: var(--gray-50);
      padding: 1rem;
      border-radius: var(--radius-sm);
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
      flex-wrap: wrap;
    }
    .available-classes {
      max-height: 400px;
      overflow-y: auto;
    }
    .class-checkbox-item {
      padding: 0.75rem;
      border-bottom: 1px solid var(--gray-100);
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
    .payment-badge-sm.monthly {
      background: #dbeafe;
      color: #1e40af;
    }
    .payment-badge-sm.rounds {
      background: #fef3c7;
      color: #92400e;
    }
    .selected-summary {
      margin-top: 1rem;
      padding: 1rem;
      background: var(--gray-50);
      border-radius: var(--radius-sm);
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
      background: var(--gray-50);
      border-radius: var(--radius-sm);
      text-align: center;
    }
    .text-danger {
      color: var(--danger);
    }
    .text-muted {
      color: var(--gray-500);
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
      border-radius: var(--radius-sm);
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
      border-radius: var(--radius-sm);
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
      background: #d1fae5;
      color: #065f46;
    }
    .status-badge-sm.bg-warning {
      background: #fef3c7;
      color: #92400e;
    }
    .status-badge-sm.bg-danger {
      background: #fee2e2;
      color: #991b1b;
    }
    .status-badge-sm.paid {
      background: #d1fae5;
      color: #065f46;
    }
    .status-badge-sm.pending {
      background: #fef3c7;
      color: #92400e;
    }
    .auto-badge {
      display: inline-block;
      background: #dbeafe;
      color: #1e40af;
      font-size: 0.6rem;
      padding: 0.15rem 0.4rem;
      border-radius: 10px;
      margin-right: 0.5rem;
    }
    .round-status {
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.7rem;
      font-weight: 500;
    }
    .round-status.badge-success {
      background: #d1fae5;
      color: #065f46;
    }
    .round-status.badge-danger {
      background: #fee2e2;
      color: #991b1b;
    }
    .round-status.badge-warning {
      background: #fef3c7;
      color: #92400e;
    }
    .round-status.badge-info {
      background: #dbeafe;
      color: #1e40af;
    }
    .round-status.badge-secondary {
      background: var(--gray-200);
      color: var(--gray-600);
    }

    /* Printer Status Styles */
    .printer-status {
      padding: 0.5rem;
      border-radius: var(--radius-sm);
    }
    .status-indicator {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem;
      border-radius: var(--radius-sm);
    }
    .status-indicator.connected {
      background: #d1fae5;
      color: #065f46;
    }
    .status-indicator.disconnected {
      background: #fee2e2;
      color: #991b1b;
    }
    .status-indicator .status-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      display: inline-block;
    }
    .status-indicator.connected .status-dot {
      background: #10b981;
    }
    .status-indicator.disconnected .status-dot {
      background: #ef4444;
    }
    .alert-info {
      background: #dbeafe;
      color: #1e40af;
      padding: 0.75rem;
      border-radius: var(--radius-sm);
    }
    .mt-3 {
      margin-top: 1rem;
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
      accent-color: var(--primary);
    }
    .group-checkbox {
      width: 20px;
      height: 20px;
      cursor: pointer;
      accent-color: var(--primary);
    }

    /* Table Responsive */
    .table-responsive {
      overflow-x: auto;
    }
    .payments-table-responsive {
      overflow-x: auto;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .modern-container {
        padding: 0.5rem;
      }
      .header-content {
        flex-direction: column;
        align-items: flex-start;
      }
      .header-actions {
        width: 100%;
        justify-content: flex-start;
      }
      .tabs {
        flex-wrap: nowrap;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
      }
      .tab-btn {
        flex: 0 0 auto;
        font-size: 0.8rem;
        padding: 0.5rem 0.75rem;
      }
      .tab-btn span {
        display: none;
      }
      .tab-btn .tab-icon {
        width: 1.4rem;
        height: 1.4rem;
      }
      .info-grid {
        grid-template-columns: 1fr;
      }
      .classes-grid {
        grid-template-columns: 1fr;
      }
      .payment-stats {
        grid-template-columns: repeat(2, 1fr);
      }
      .group-stats {
        flex-direction: column;
        gap: 0.25rem;
      }
      .payment-item {
        flex-wrap: wrap;
        padding: 0.75rem;
        gap: 0.5rem;
      }
      .payment-actions {
        margin-top: 0.5rem;
        width: 100%;
        justify-content: flex-end;
      }
      .payment-month {
        flex-wrap: wrap;
      }
      .payment-amount {
        margin-right: 0;
        margin-left: auto;
      }
      .payment-details {
        gap: 0.5rem;
      }
      .filters-row {
        flex-direction: column;
      }
      .modal-content {
        margin: 0.5rem;
        max-height: 95vh;
      }
      .modal-content.large {
        max-width: 100%;
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
      .financial-stats {
        flex-direction: column;
        gap: 0.5rem;
      }
      .profile-header {
        flex-direction: column;
        gap: 0.5rem;
      }
      .profile-status {
        flex-wrap: wrap;
        justify-content: center;
      }
      .info-row {
        flex-wrap: wrap;
      }
      .info-row .info-label {
        min-width: 100%;
      }
      .payments-summary {
        flex-direction: column;
        align-items: stretch;
        gap: 0.5rem;
        padding: 1rem;
      }
      .summary-info {
        flex-direction: column;
        gap: 0.25rem;
      }
      .summary-actions {
        flex-direction: column;
        gap: 0.5rem;
      }
      .summary-actions button {
        width: 100%;
        justify-content: center;
      }
      .rounds-grid {
        grid-template-columns: 1fr;
      }
      .filter-section {
        flex-direction: column;
      }
      .filter-group {
        min-width: 100%;
      }
      .filter-clear {
        width: 100%;
        justify-content: center;
      }
    }

    @media (max-width: 480px) {
      .page-title {
        font-size: 1.2rem;
      }
      .title-avatar {
        width: 32px;
        height: 32px;
        font-size: 0.8rem;
      }
      .profile-avatar {
        width: 60px;
        height: 60px;
      }
      .avatar-text {
        font-size: 1.8rem;
      }
      .modal-footer {
        flex-direction: column;
      }
      .modal-footer button {
        width: 100%;
        justify-content: center;
      }
      .payment-stats {
        grid-template-columns: 1fr 1fr;
        gap: 0.5rem;
      }
      .payment-stats .stat-card {
        padding: 0.75rem;
      }
      .payment-stats .stat-value {
        font-size: 1rem;
      }
      .group-header {
        flex-wrap: wrap;
        padding: 0.75rem;
      }
      .group-actions {
        margin-top: 0.5rem;
        width: 100%;
        justify-content: space-between;
      }
      .summary-stats {
        grid-template-columns: repeat(3, 1fr);
      }
      .absence-stats-grid {
        grid-template-columns: 1fr 1fr;
        gap: 0.5rem;
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
  showPrinterConnectionModalFlag: boolean = false;
  
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
  filteredClasses: any[] = [];

  filterLevel: string = '';
  selectedReceiptOption: 'single' | 'multiple' = 'single';
  
  // Absences Data
  studentAbsences: any[] = [];
  absenceSummary: any = null;
  loadingAbsences: boolean = false;
  absenceFilterStartDate: string = '';
  absenceFilterEndDate: string = '';
  absenceLimit: number = 50;
  
  // Printer Status
  printerConnected: boolean = false;
  connectionType: ConnectionType = 'usb';
  selectedComPort: string = 'COM1';
  selectedBaudRate: number = 9600;
  comPorts: string[] = ['COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'COM10'];
  baudRates: number[] = [9600, 19200, 38400, 57600, 115200];
  isConnectingPrinter: boolean = false;
  
// ==================== Modal: Student Share Adjustment (تم التحديث) ====================
showStudentShareModal: boolean = false;
selectedCommissionStudent: any = null;

// وضع التعديل: 'auto' (تلقائي بعدد الحصص) أو 'manual' (يدوي)
studentShareMode: 'auto' | 'manual' = 'auto';

// بيانات التعديل التلقائي
studentAutoSessions: number = 4; // عدد الحصص التي حضرها
studentSessionPrice: number = 200; // سعر الحصة الافتراضي

// بيانات التعديل اليدوي (كما كانت)
studentShareAmount: number = 0;
studentShareReason: string = '';


  // Static Data
  months = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
  monthNamesArabic = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];
  
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

  private schoolId: string | null = null;
  private avatarColors: string[] = [
    '#2563eb', '#7c3aed', '#0891b2', '#059669',
    '#dc2626', '#d97706', '#9333ea', '#0d9488',
    '#e11d48', '#4f46e5', '#0284c7', '#16a34a',
    '#8b5cf6', '#0ea5e9', '#14b8a6', '#f59e0b'
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private printerService: PrinterService,
    private cdr: ChangeDetectorRef,
    private soundService: SoundService
  ) {}

  ngOnInit(): void {
    this.schoolId = localStorage.getItem('schoolId') || null;
    console.log('🏫 School ID from localStorage:', this.schoolId);
    this.loadStudentDetails();
    this.loadAllStudents();
    this.roundSelection.roundNumber = `RND-${Date.now().toString().slice(-6)}`;
    this.loadAbsenceSummary();
    this.checkPrinterConnection();
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // ==================== SCHOOL ID HELPER ====================
  
private getSchoolId(): string {
  // 1. Try from localStorage first
  let schoolId = localStorage.getItem('schoolId');
  if (schoolId && schoolId !== 'null' && schoolId !== 'undefined') {
    console.log('📌 schoolId from localStorage:', schoolId);
    return schoolId;
  }
  
  // 2. Try from user object
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      if (user?.schoolId) {
        localStorage.setItem('schoolId', user.schoolId);
        console.log('📌 schoolId from user:', user.schoolId);
        return user.schoolId;
      }
    } catch (e) {
      console.error('❌ Error reading user:', e);
    }
  }
  
  // 3. Try from school object
  const schoolStr = localStorage.getItem('school');
  if (schoolStr) {
    try {
      const school = JSON.parse(schoolStr);
      if (school?._id) {
        localStorage.setItem('schoolId', school._id);
        console.log('📌 schoolId from school:', school._id);
        return school._id;
      }
    } catch (e) {
      console.error('❌ Error reading school:', e);
    }
  }
  
  // 4. Try from student
  if (this.student?.schoolId) {
    const sid = this.student.schoolId.toString();
    localStorage.setItem('schoolId', sid);
    console.log('📌 schoolId from student:', sid);
    return sid;
  }
  
  console.warn('⚠️ No schoolId found');
  return '';
}

  // ==================== AVATAR HELPER ====================
  getAvatarColor(name: string): string {
    const index = name.length % this.avatarColors.length;
    return this.avatarColors[index];
  }

  getInitials(name: string): string {
    return name.charAt(0).toUpperCase();
  }

  // ==================== LOAD DATA METHODS ====================
  
loadStudentDetails(): void {
  this.soundService.playRefresh();
  const studentId = this.route.snapshot.paramMap.get('id');
  if (!studentId) {
    this.router.navigate(['/home/students-management']);
    return;
  }
  this.loading = true;
  
  const schoolId = this.getSchoolId();
  
  let url = `${this.apiUrl}/students/${studentId}`;
  if (schoolId) {
    url += `?schoolId=${schoolId}`;
  }
  
  console.log('📤 جلب تفاصيل الطالب مع schoolId:', schoolId);
  
  this.http.get<any>(url, { headers: this.getHeaders() }).subscribe({
    next: (student) => {
      this.student = student;
      if (student?.schoolId) {
        localStorage.setItem('schoolId', student.schoolId.toString());
      }
      this.newPayment.student = this.getStudentId();
      this.loadStudentClasses(studentId);
      this.loadPaymentHistory(studentId);
      this.loadStudentPaymentSystems(studentId);
      this.loadAbsenceSummary();
      this.loading = false;
    },
    error: (error) => {
      console.error('❌ خطأ في تحميل بيانات الطالب:', error);
      Swal.fire('خطأ', 'فشل في تحميل بيانات الطالب', 'error');
      this.router.navigate(['/home/students-management']);
      this.loading = false;
    }
  });
}

  loadAllStudents(): void {

    const schoolId = this.getSchoolId();
    
    let url = `${this.apiUrl}/students`;
    if (schoolId) {
      url += `?schoolId=${schoolId}`;
    }
    
    console.log('🔍 Fetching students from:', url);
    
    this.http.get<any>(url, { headers: this.getHeaders() }).subscribe({
      next: (response) => {
        let studentsList: Student[] = [];
        
        if (Array.isArray(response)) {
          studentsList = response;
        } else if (response.success && response.data) {
          studentsList = response.data;
        } else if (response && response.students && Array.isArray(response.students)) {
          studentsList = response.students;
        } else {
          studentsList = [];
        }
        
        this.allStudents = studentsList;
        this.filteredStudents = [...this.allStudents];
        console.log(`✅ Loaded ${this.allStudents.length} students`);
      },
      error: (error) => {
        console.error('Error loading all students:', error);
        this.allStudents = [];
        this.filteredStudents = [];
      }
    });
  }

loadStudentClasses(studentId: string): void {
  const schoolId = this.getSchoolId();
  
  let url = `${this.apiUrl}/students/${studentId}/classes`;
  if (schoolId) {
    url += `?schoolId=${schoolId}`;
  }
  
  console.log('🔍 جلب حصص الطالب من:', url);
  
  this.http.get<any>(url, { headers: this.getHeaders() }).subscribe({
    next: (response) => {
      console.log('📥 استجابة حصص الطالب:', response);
      
      let classesData: any[] = [];
      
      if (response?.success && response?.data) {
        classesData = response.data || [];
      } else if (Array.isArray(response)) {
        classesData = response;
      } else if (response?.classes && Array.isArray(response.classes)) {
        classesData = response.classes;
      }
      
      this.studentClasses = classesData;
      console.log(`✅ تم تحميل ${this.studentClasses.length} حصة للطالب`);
      this.cdr.detectChanges();
    },
    error: (error) => {
      console.error('❌ خطأ في تحميل حصص الطالب:', error);
      this.studentClasses = [];
      this.cdr.detectChanges();
    }
  });
}

  loadPaymentHistory(studentId: string): void {
    console.log('Loading payment history for student:', studentId);
    let url = `${this.apiUrl}/payments/student/${studentId}`;
    const schoolId = this.getSchoolId();
    
    if (schoolId) {
      url += `?schoolId=${schoolId}`;
    }
    
    this.http.get<any>(url, { headers: this.getHeaders() }).subscribe({
      next: (response) => {
        if (response.success && response.payments) {
          this.paymentHistory = response.payments;
          this.classPaymentGroups = this.groupPaymentsByClass(response.payments);
        } else if (Array.isArray(response)) {
          this.paymentHistory = response;
          this.classPaymentGroups = this.groupPaymentsByClass(response);
        } else {
          this.paymentHistory = [];
          this.classPaymentGroups = [];
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading payment history:', error);
        this.paymentHistory = [];
        this.classPaymentGroups = [];
        this.cdr.detectChanges();
        Swal.fire('خطأ', 'فشل في تحميل سجل المدفوعات', 'error');
      }
    });
  }

  loadStudentPaymentSystems(studentId: string): void {
    let monthlyUrl = `${this.apiUrl}/payments/student/${studentId}`;
    const schoolId = this.getSchoolId();
    
    if (schoolId) {
      monthlyUrl += `?schoolId=${schoolId}`;
    }
    
    this.http.get<any>(monthlyUrl, { headers: this.getHeaders() }).subscribe({
      next: (response) => {
        if (response.success && response.payments) {
          this.studentMonthlyPayments = response.payments.map((p: any) => ({
            id: p._id, _id: p._id, studentId: p.student?._id || studentId,
            month: p.month, amount: p.amount, status: p.status, paymentDate: p.paymentDate,
            paymentMethod: p.paymentMethod, notes: p.notes, className: p.class?.name,
            schoolId: p.schoolId || schoolId
          }));
        } else if (Array.isArray(response)) {
          this.studentMonthlyPayments = response.map((p: any) => ({
            id: p._id, _id: p._id, studentId: p.student?._id || studentId,
            month: p.month, amount: p.amount, status: p.status, paymentDate: p.paymentDate,
            paymentMethod: p.paymentMethod, notes: p.notes, className: p.class?.name,
            schoolId: p.schoolId || schoolId
          }));
        } else {
          this.studentMonthlyPayments = [];
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading monthly payments:', error);
        this.studentMonthlyPayments = [];
        this.cdr.detectChanges();
      }
    });

    let roundsUrl = `${this.apiUrl}/payment-systems/rounds/student/${studentId}`;
    if (schoolId) {
      roundsUrl += `?schoolId=${schoolId}`;
    }
    
    this.http.get<any>(roundsUrl, { headers: this.getHeaders() }).subscribe({
      next: (response) => {
        if (response.success && response.rounds) {
          this.studentRounds = response.rounds;
          this.updateRoundStatuses();
        } else if (Array.isArray(response)) {
          this.studentRounds = response;
          this.updateRoundStatuses();
        } else {
          this.studentRounds = [];
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading rounds:', error);
        this.studentRounds = [];
        this.cdr.detectChanges();
      }
    });
  }

  // ==================== REFRESH DATA ====================
  refreshData(): void {
    this.soundService.playRefresh();
    const studentId = this.route.snapshot.paramMap.get('id');
    if (!studentId) return;
    
    Swal.fire({
      title: 'جاري تحديث البيانات...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });
    
    this.loadStudentDetails();
    this.loadStudentClasses(studentId);
    this.loadPaymentHistory(studentId);
    this.loadStudentPaymentSystems(studentId);
    
    setTimeout(() => {
      Swal.close();
      Swal.fire('نجاح', 'تم تحديث البيانات بنجاح', 'success');
    }, 1500);
  }

  // ==================== FIX STUDENT CLASSES ====================
  fixStudentClasses(): void {
    const studentId = this.route.snapshot.paramMap.get('id');
    if (!studentId) return;
    
    Swal.fire({
      title: 'إصلاح علاقات الحصص',
      text: 'سيتم إعادة مزامنة الحصص مع قاعدة البيانات',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'نعم، إصلاح',
      cancelButtonText: 'إلغاء'
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: 'جاري الإصلاح...',
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading()
        });
        
        let url = `${this.apiUrl}/debug/fix-student-classes/${studentId}`;
        const schoolId = this.getSchoolId();
        if (schoolId) {
          url += `?schoolId=${schoolId}`;
        }
        
        this.http.post<any>(url, {}, { headers: this.getHeaders() }).subscribe({
          next: (response) => {
            Swal.close();
            if (response.success) {
              Swal.fire({
                icon: 'success',
                title: 'تم الإصلاح بنجاح',
                html: `
                  <p>تم تحديث الطالب بـ ${response.student.classes.length} حصة</p>
                  <div class="text-start mt-3">
                    <p><strong>الحصص:</strong></p>
                    <ul>
                      ${response.classes.map((c: any) => `<li>${c.name}</li>`).join('')}
                    </ul>
                  </div>
                `
              });
              this.loadStudentClasses(studentId);
            } else {
              Swal.fire('خطأ', response.error || 'فشل في الإصلاح', 'error');
            }
          },
          error: (error) => {
            Swal.close();
            console.error('Error fixing classes:', error);
            Swal.fire('خطأ', 'فشل في إصلاح العلاقات', 'error');
          }
        });
      }
    });
  }

  // ==================== SEARCH STUDENTS ====================
  searchStudents(event: Event): void {

    const searchTerm = (event.target as HTMLInputElement).value.toLowerCase().trim();
    this.studentSearchTerm = searchTerm;
    
    if (!searchTerm) {
      this.filteredStudents = [...this.allStudents];
      return;
    }
    
    this.filteredStudents = this.allStudents.filter(student => {
      return student.name.toLowerCase().includes(searchTerm) || 
             student.studentId.toLowerCase().includes(searchTerm);
    });
  }

  clearSearch(): void {
    this.studentSearchTerm = '';
    this.filteredStudents = [...this.allStudents];
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
    
    const schoolId = this.getSchoolId();
    if (schoolId) {
      params.append('schoolId', schoolId);
    }
    
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
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading student absences:', error);
        this.studentAbsences = [];
        this.absenceSummary = null;
        this.loadingAbsences = false;
        this.cdr.detectChanges();
        Swal.fire('خطأ', 'فشل في تحميل سجل الغيابات', 'error');
      }
    });
  }

  loadAbsenceSummary(): void {
    const studentId = this.getStudentId();
    if (!studentId) return;

    let url = `${this.apiUrl}/students/${studentId}/absences-summary`;
    const schoolId = this.getSchoolId();
    if (schoolId) {
      url += `?schoolId=${schoolId}`;
    }

    this.http.get<any>(url, { headers: this.getHeaders() }).subscribe({
      next: (response) => {
        if (response.success) {
          this.absenceSummary = response;
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading absence summary:', error);
        this.cdr.detectChanges();
      }
    });
  }

  openAbsencesModal(): void {
    this.showAbsencesModal = true;
    this.loadStudentAbsences();
  }

  closeAbsencesModal(): void {
    this.soundService.playClick();
    this.showAbsencesModal = false;
  }

  filterAbsencesByDate(): void {
    this.loadStudentAbsences();
  }

  resetAbsenceFilter(): void {

    this.soundService.playClick();
    this.soundService.playClick();
    this.absenceFilterStartDate = '';
    this.absenceFilterEndDate = '';
    this.loadStudentAbsences();
  }

  exportAbsencesToExcel(): void {
    this.soundService.playClick();
    this.soundService.playClick();
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
    link.setAttribute('download', `غيابات_${this.student?.name}_${new Date().toLocaleDateString('EG-US')}.csv`);
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
  if (!payments || !Array.isArray(payments)) return [];
  this.soundService.playRefresh();
  
  const groups: { [key: string]: ClassPaymentGroup } = {};
  
  payments.forEach(payment => {
    const classId = payment.class?._id || payment.class || 'general';
    const className = payment.className || 'عام';
    
    if (!groups[classId]) {
      groups[classId] = {
        classId, 
        className, 
        payments: [], 
        totalAmount: 0, 
        paidAmount: 0, 
        pendingAmount: 0, 
        expanded: false, 
        progressPercentage: 0
      };
    }
    
    // تأكد من أن الشهر مع السنة
    if (payment.month && !payment.month.includes(' ')) {
      const year = payment.paymentDate ? new Date(payment.paymentDate).getFullYear() : new Date().getFullYear();
      payment.month = `${payment.month} ${year}`;
    }
    
    groups[classId].payments.push(payment);
    groups[classId].totalAmount += payment.amount;
    
    if (payment.status === 'paid') {
      groups[classId].paidAmount += payment.amount;
    } else {
      groups[classId].pendingAmount += payment.amount;
    }
    
    groups[classId].progressPercentage = groups[classId].totalAmount > 0 
      ? (groups[classId].paidAmount / groups[classId].totalAmount) * 100 
      : 0;
  });
  
  // 🔥 ترتيب المدفوعات داخل كل مجموعة تصاعدياً (جانفي ← ديسمبر)
  Object.values(groups).forEach(group => {
    group.payments.sort((a, b) => {
      return this.compareMonthsAsc(a.month, b.month);
    });
  });
  
  return Object.values(groups);
}

/**
 * مقارنة بين شهرين للترتيب التصاعدي (جانفي أولاً)
 * @param monthA شهر الدفعة الأولى
 * @param monthB شهر الدفعة الثانية
 * @returns عدد سالب إذا كان A قبل B، موجب إذا كان A بعد B
 */
private compareMonthsAsc(monthA: string, monthB: string): number {
  if (!monthA && !monthB) return 0;
  if (!monthA) return -1;
  if (!monthB) return 1;
  
  const parseMonthYear = (str: string): { month: number; year: number } => {
    const parts = str.trim().split(' ');
    if (parts.length === 2) {
      const month = parseInt(parts[0]);
      const year = parseInt(parts[1]);
      return { month, year };
    }
    const month = parseInt(str);
    const year = new Date().getFullYear();
    return { month, year };
  };
  
  const a = parseMonthYear(monthA);
  const b = parseMonthYear(monthB);
  
  // ترتيب حسب السنة أولاً (السنة الأقدم أولاً)
  if (a.year !== b.year) {
    return a.year - b.year;
  }
  // ثم حسب الشهر (جانفي = 1 أولاً)
  return a.month - b.month;
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
  this.paymentHistory.forEach(payment => {
    if (payment.month) {
      // إذا كان الشهر بدون سنة، نضيف السنة الحالية
      let monthStr = payment.month;
      if (!monthStr.includes(' ')) {
        // محاولة استخراج السنة من تاريخ الدفع
        const year = payment.paymentDate ? new Date(payment.paymentDate).getFullYear() : new Date().getFullYear();
        monthStr = `${monthStr} ${year}`;
      }
      monthsSet.add(monthStr);
    }
  });
  
  // ترتيب حسب التاريخ
  return Array.from(monthsSet).sort((a, b) => {
    const getMonthYear = (str: string) => {
      const parts = str.split(' ');
      if (parts.length === 2) {
        const monthIndex = this.months.indexOf(parts[0]);
        const year = parseInt(parts[1]);
        return { monthIndex, year };
      }
      return { monthIndex: 0, year: 0 };
    };
    
    const aData = getMonthYear(a);
    const bData = getMonthYear(b);
    
    if (aData.year !== bData.year) return aData.year - bData.year;
    return aData.monthIndex - bData.monthIndex;
  });
}
formatMonthDisplay(monthStr: string): string {
  if (!monthStr) return '';
  // إذا كان الشهر يحتوي على سنة بالفعل، نعيده كما هو
  if (monthStr.includes(' ')) return monthStr;
  // وإلا نضيف السنة الحالية
  return `${monthStr} ${new Date().getFullYear()}`;
}

generateMonthOptions(): string[] {
  const options: string[] = [];
  const currentDate = new Date();
  // توليد 3 سنوات سابقة و 3 سنوات قادمة
  for (let yearOffset = -2; yearOffset <= 3; yearOffset++) {
    const year = currentDate.getFullYear() + yearOffset;
    for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
      const monthName = this.months[monthIndex];
      options.push(`${monthName} ${year}`);
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
        round.statusClass = 'badge-success';
      } else if (now > endDate && round.status !== 'paid') {
        round.statusText = 'منتهية';
        round.statusClass = 'badge-danger';
      } else if (now >= startDate && now <= endDate && round.status !== 'paid') {
        round.statusText = 'متأخرة';
        round.statusClass = 'badge-warning';
      } else if (now < startDate) {
        round.statusText = 'قادمة';
        round.statusClass = 'badge-info';
      } else {
        round.statusText = 'معلقة';
        round.statusClass = 'badge-secondary';
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
    this.soundService.playClick();
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
  
  const schoolId = this.getSchoolId();
  
  if (!schoolId) {
    console.warn('⚠️ لا يوجد schoolId، لا يمكن تحميل الحصص');
    this.loadingAvailableClasses = false;
    this.availableClasses = [];
    this.filteredAvailableClasses = [];
    Swal.fire('تنبيه', 'لم يتم تحديد المدرسة، يرجى تسجيل الدخول مرة أخرى', 'warning');
    return;
  }
  
  const url = `${this.apiUrl}/classes/available?schoolId=${schoolId}`;
  console.log('📚 جلب الحصص المتاحة من:', url);
  
  this.http.get<any>(url, { headers: this.getHeaders() }).subscribe({
    next: (response) => {
      console.log('📥 استجابة الحصص المتاحة:', response);
      
      let classes: Class[] = [];
      
      if (response?.success && response?.classes) {
        classes = response.classes;
      } else if (Array.isArray(response)) {
        classes = response;
      } else if (response?.data && Array.isArray(response.data)) {
        classes = response.data;
      } else {
        classes = [];
      }
      
      const enrolledClassIds = (this.studentClasses || []).map(c => c._id || c.id).filter(id => id);
      this.availableClasses = classes.filter(c => {
        const classId = c._id || c.id;
        return classId && !enrolledClassIds.includes(classId);
      });
      
      this.filteredAvailableClasses = [...this.availableClasses];
      console.log(`✅ ${this.availableClasses.length} حصة متاحة للتسجيل`);
      this.loadingAvailableClasses = false;
      this.cdr.detectChanges();
    },
    error: (error) => {
      console.error('❌ خطأ في تحميل الحصص المتاحة:', error);
      this.loadingAvailableClasses = false;
      this.availableClasses = [];
      this.filteredAvailableClasses = [];
      Swal.fire('خطأ', 'فشل في تحميل الحصص المتاحة للتسجيل', 'error');
      this.cdr.detectChanges();
    }
  });
}

  filterAvailableClasses(): void {
    const available = Array.isArray(this.availableClasses) ? this.availableClasses : [];
    
    this.filteredAvailableClasses = available.filter((cls: Class) => {
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
    if (!this.student || this.selectedClasses.length === 0) {
      Swal.fire('تنبيه', 'لم يتم اختيار أي حصص', 'warning');
      return;
    }

    const studentId = this.getStudentId();
    if (!studentId) {
      Swal.fire('خطأ', 'معرف الطالب غير موجود', 'error');
      return;
    }

    const classIds = this.selectedClasses
      .map(c => c._id || c.id)
      .filter((id): id is string => !!id);

    if (classIds.length === 0) {
      Swal.fire('خطأ', 'معرفات الحصص غير صالحة', 'error');
      return;
    }

    console.log('📤 Enrolling in classes:', {
      studentId,
      classIds,
      selectedClasses: this.selectedClasses.map(c => c.name)
    });

    const classesWithRounds = this.selectedClasses.filter(cls => cls.paymentSystem === 'rounds');
    
    if (classesWithRounds.length > 0) {
      this.selectedClassForRounds = classesWithRounds[0];
      this.openRoundSelectionModal();
    } else {
      this.enrollStudentMultiple(studentId, classIds);
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
    
    if (!classIds || classIds.length === 0) {
      Swal.fire('خطأ', 'لم يتم تحديد أي حصص للتسجيل', 'error');
      this.isEnrolling = false;
      return;
    }

    const validClassIds = classIds.filter(id => id && id.trim() !== '');
    
    if (validClassIds.length === 0) {
      Swal.fire('خطأ', 'معرفات الحصص غير صالحة', 'error');
      this.isEnrolling = false;
      return;
    }

    const schoolId = this.getSchoolId();
    
    const payload: any = { 
      classIds: validClassIds 
    };
    
    if (schoolId) {
      payload.schoolId = schoolId;
    }
    
    if (this.selectedClassForRounds && this.roundSelection) {
      payload.roundSettings = {
        sessionCount: this.roundSelection.sessionCount,
        sessionDuration: 2,
        breakBetweenSessions: 0
      };
    }

    console.log('📤 Sending enrollment request:', {
      studentId,
      payload,
      schoolId
    });

    this.http.post<any>(
      `${this.apiUrl}/students/${studentId}/enroll-multiple`, 
      payload, 
      { headers: this.getHeaders() }
    ).subscribe({
      next: (response) => {
        console.log('✅ Enrollment response:', response);
        Swal.fire({
          icon: 'success',
          title: 'تم التسجيل بنجاح',
          timer: 3000,
          showConfirmButton: false
        });
        
        const studentId = this.route.snapshot.paramMap.get('id') || '';
        this.loadStudentClasses(studentId);
        this.loadStudentPaymentSystems(studentId);
        this.closeAddToLessonsModal();
        this.isEnrolling = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('❌ Enrollment error:', error);
        
        let errorMessage = 'فشل في تسجيل الطالب في الحصص';
        if (error.error?.error) {
          errorMessage = error.error.error;
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        Swal.fire('خطأ', errorMessage, 'error');
        this.isEnrolling = false;
      }
    });
  }

  // ==================== MODAL CONTROLS ====================
  setActiveTab(tab: string): void {
    this.soundService.playClick();
    this.activeTab = tab;
    if (tab === 'payments' && this.student) {
      this.loadPaymentHistory(this.getStudentId());
    }
  }

  goBack(): void {
    this.router.navigate(['/home/students-management']);
  }

  openAddPaymentModal(): void {
    this.soundService.playClick();
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
    this.soundService.playClick();
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
    this.soundService.playClick();
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
    
    const schoolId = this.getSchoolId();
    
    const paymentData = { 
      ...this.newPayment,
      schoolId: schoolId || this.student?.schoolId
    };
    
    console.log('📤 Sending new payment with schoolId:', paymentData);
    
    this.http.post<any>(`${this.apiUrl}/payments`, paymentData, { headers: this.getHeaders() }).subscribe({
      next: () => {
        this.soundService.playSuccess();
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
        this.soundService.playSuccess();
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

  payPayment(payment: Payment): void {
    Swal.fire({
      title: 'تأكيد الدفع',
      html: `<div class="text-start">
        <p><strong><i class='far fa-credit-card' style='color:blue'></i> المبلغ:</strong> ${payment.amount.toLocaleString()} د.ج</p>
        <p><strong>📅 الشهر:</strong> ${payment.month}</p>
        <p><strong>📚 الحصة:</strong> ${payment.className || 'عام'}</p>
      </div>`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: '💳 دفع وطباعة',
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
    const schoolId = this.getSchoolId();
    
    const paymentData = { 
      paymentMethod: method, 
      paymentDate: new Date().toISOString(), 
      notes: 'تم الدفع من خلال النظام',
      schoolId: schoolId
    };
    
    console.log('📤 Processing payment with schoolId:', paymentData);
    
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
          this.soundService.playSuccess();
          
          this.loadPaymentHistory(this.getStudentId());
          this.loadStudentPaymentSystems(this.getStudentId());
          
          if (shouldPrint && response.payment) {
            await this.printPaymentReceipt(response.payment);
          }
        },
        error: (error) => {
          console.error('Error paying payment:', error);
          this.soundService.playError();
          Swal.fire({ 
            icon: 'error', 
            title: 'فشل في الدفع', 
            text: error.error?.error || error.message || 'حدث خطأ أثناء محاولة الدفع',
            confirmButtonText: 'حسناً'
          });
        }
      });
  }

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
        <p><strong>👨‍🎓 الطالب:</strong> ${payment.studentName || this.student?.name}</p>
        <p><strong>📅 الشهر:</strong> ${payment.month}</p>
        <p><strong><i class='far fa-credit-card' style='color:blue'></i> المبلغ:</strong> ${payment.amount.toLocaleString()} د.ج</p>
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
            this.soundService.playError();
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
              this.soundService.playSuccess();
              this.soundService.playDelete();
              Swal.fire({ icon: 'success', title: 'تم الحذف', text: 'تم حذف الدفعة بنجاح', timer: 1500, showConfirmButton: false });
              this.closeDeleteConfirmModal();
              this.loadPaymentHistory(this.getStudentId());
              this.loadStudentPaymentSystems(this.getStudentId());
            },
            error: (error) => {
              this.soundService.playError();
              console.error('Error deleting payment:', error);
              Swal.fire('خطأ', 'فشل في حذف الدفعة', 'error');
            }
          });
      }
    });
  }

async processBulkPaySelected(): Promise<void> {
  this.soundService.playClick();
  if (this.selectedPaymentsForBulkPay.length === 0) {
    Swal.fire({ icon: 'warning', title: 'لا توجد مدفوعات مختارة', text: 'يرجى اختيار مدفوعات للدفع أولاً' });
    return;
  }
  
  const hasPaidPayments = this.selectedPaymentsForBulkPay.some(p => p.status === 'paid');
  if (hasPaidPayments) {
    const unpaidPayments = this.selectedPaymentsForBulkPay.filter(p => p.status !== 'paid');
    const { value: proceed } = await Swal.fire({
      title: 'تحذير',
      html: `<div class="text-start"><p class="text-warning">⚠️ بعض المدفوعات المختارة مدفوعة مسبقاً</p>
             <p><strong>المعلقة:</strong> ${unpaidPayments.length}</p>
             <p>هل تريد المتابعة مع المدفوعات المعلقة فقط؟</p></div>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'نعم، متابعة',
      cancelButtonText: 'إلغاء'
    });
    if (!proceed) return;
    this.selectedPaymentsForBulkPay = unpaidPayments;
  }

  if (this.selectedPaymentsForBulkPay.length === 0) {
    Swal.fire({ icon: 'info', title: 'لا توجد مدفوعات معلقة للدفع' });
    return;
  }

  const totalAmount = this.getSelectedPaymentsTotal();
  
  const { value: userChoice } = await Swal.fire({
    title: 'خيارات الدفع الجماعي',
    html: `<div class="text-start">
      <div class="alert alert-info">
        <h6><i class='fas fa-chalkboard-teacher' style='color:blue'></i>
S تفاصيل الدفع الجماعي</h6>
        <p><strong>عدد المدفوعات:</strong> ${this.selectedPaymentsForBulkPay.length}</p>
        <p><strong>المبلغ الإجمالي:</strong> ${totalAmount.toLocaleString()} د.ج</p>
      </div>
      <div class="mb-3">
        <label class="form-label">💳 طريقة الدفع:</label>
        <select class="form-select" id="bulkPaymentMethod">
          <option value="cash">نقداً</option>
          <option value="bank">تحويل بنكي</option>
          <option value="card">بطاقة ائتمان</option>
          <option value="online">دفع إلكتروني</option>
          <option value="mobile">دفع محمول</option>
        </select>
      </div>
      <div class="mb-3">
        <label class="form-label">🖨️ خيار الطباعة:</label>
        <select class="form-select" id="bulkPrintOption">
          <option value="single">إيصال واحد لجميع الدفعات</option>
          <option value="multiple">إيصالات منفصلة لكل دفعة</option>
          <option value="none">لا تطبع</option>
        </select>
      </div>
      <div class="mb-3">
        <label class="form-label">📝 ملاحظات:</label>
        <textarea class="form-control" id="bulkPaymentNotes" rows="2"></textarea>
      </div>
    </div>`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: '✅ دفع',
    cancelButtonText: 'إلغاء',
    width: '600px',
    preConfirm: () => {
      const paymentMethod = (document.getElementById('bulkPaymentMethod') as HTMLSelectElement).value;
      const printOption = (document.getElementById('bulkPrintOption') as HTMLSelectElement).value;
      const paymentNotes = (document.getElementById('bulkPaymentNotes') as HTMLTextAreaElement).value;
      if (!paymentMethod) {
        Swal.showValidationMessage('يرجى اختيار طريقة الدفع');
        return false;
      }
      return { paymentMethod, printOption, paymentNotes };
    }

  });

  if (!userChoice) return;

  const { paymentMethod, printOption, paymentNotes } = userChoice;
  
  Swal.fire({
    title: 'جاري معالجة الدفعات...',
    html: `<div class="text-center">
      <div class="spinner-border text-primary mb-3"></div>
      <h5>💳 دفع جماعي</h5>
      <p>جاري معالجة ${this.selectedPaymentsForBulkPay.length} دفعة...</p>
      <div class="progress mt-4">
        <div class="progress-bar progress-bar-striped progress-bar-animated bg-success" style="width: 0%;" id="bulk-pay-progress">0%</div>
      </div>
      <div class="row mt-4">
        <div class="col-6 text-end">
          <small class="text-muted">✅ النجاح:</small>
          <h5 class="text-success" id="success-count">0</h5>
        </div>
        <div class="col-6 text-start">
          <small class="text-muted">❌ الفشل:</small>
          <h5 class="text-danger" id="fail-count">0</h5>
        </div>
      </div>
      <div class="mt-3">
        <small class="text-muted" id="current-payment">جاري بدء المعالجة...</small>
      </div>
    </div>`,
    showConfirmButton: false,
    allowOutsideClick: false,
    width: '500px'
  });

  let successfulPayments = 0;
  let failedPayments = 0;
  const results: any[] = [];
  const paidPayments: Payment[] = [];

  const schoolId = this.getSchoolId();

  for (let i = 0; i < this.selectedPaymentsForBulkPay.length; i++) {
    const payment = this.selectedPaymentsForBulkPay[i];
    const paymentId = payment._id || payment.id;
    const progress = Math.round(((i + 1) / this.selectedPaymentsForBulkPay.length) * 100);
    
    const progressBar = document.getElementById('bulk-pay-progress');
    const successCount = document.getElementById('success-count');
    const failCount = document.getElementById('fail-count');
    const currentPayment = document.getElementById('current-payment');
    
    if (progressBar) {
      progressBar.style.width = `${progress}%`;
      progressBar.textContent = `${progress}%`;
    }
    if (successCount) successCount.textContent = successfulPayments.toString();
    if (failCount) failCount.textContent = failedPayments.toString();
    if (currentPayment) {
      currentPayment.textContent = `جاري معالجة: ${i+1}/${this.selectedPaymentsForBulkPay.length} - ${payment.month} - ${payment.amount.toLocaleString()} د.ج`;
    }

    if (!paymentId) {
      failedPayments++;
      results.push({
        payment: payment.month,
        student: payment.studentName || 'طالب',
        success: false,
        message: 'رقم الدفعة غير صالح'
      });
      continue;
    }

    try {
      const paymentData = {
        paymentMethod: paymentMethod,
        paymentDate: new Date().toISOString(),
        notes: paymentNotes || `دفع جماعي - ${new Date().toLocaleDateString('EG-US')}`,
        schoolId: schoolId
      };

      const response = await this.http.put<any>(
        `${this.apiUrl}/payments/${paymentId}/pay`,
        paymentData,
        { headers: this.getHeaders() }
      ).toPromise();

      successfulPayments++;
// ✅ التعديل: استخراج اسم الحصة بشكل صحيح
const className = payment.class?.name || payment.className || 'عام';

paidPayments.push({ 
  ...payment, 
  paymentMethod, 
  paymentDate: new Date(), 
  invoiceNumber: response?.invoiceNumber || `INV-${Date.now().toString().slice(-8)}-${i}`,
  notes: paymentData.notes,
  className: className
});
      
      results.push({
        payment: payment.month,
        student: payment.studentName || 'طالب',
        amount: payment.amount,
        success: true,
        message: 'تم الدفع بنجاح'
      });

    } catch (error: any) {
      failedPayments++;
      results.push({
        payment: payment.month,
        student: payment.studentName || 'طالب',
        amount: payment.amount,
        success: false,
        message: error.error?.message || error.message || 'فشل في الدفع'
      });
      console.error('❌ Payment failed:', error);
    }

    await this.delay(200);
  }

  Swal.close();

  const resultsHtml = this.generateBulkPayResultsHTML(successfulPayments, failedPayments, results);
    this.soundService.playPayment();

  await Swal.fire({
    title: 'نتائج الدفع الجماعي',
    html: resultsHtml,
    icon: successfulPayments > 0 ? 'success' : 'error',
    confirmButtonText: 'حسناً'
  });

  if (successfulPayments > 0 && paidPayments.length > 0) {
      this.soundService.playPayment();

    try {
      if (printOption === 'single') {
        await this.printSingleReceiptForMultiplePayments(paidPayments, paymentMethod, paymentNotes);
      } else if (printOption === 'multiple') {
        await this.printMultipleReceipts(paidPayments);
      }
    } catch (printError) {
      console.error('❌ Print error:', printError);
    }
  }

  if (successfulPayments > 0 && this.student) {
    this.loadPaymentHistory(this.getStudentId());
    this.loadStudentPaymentSystems(this.getStudentId());
  }

  this.selectedPaymentsForBulkPay = [];
}

  private generateBulkPayResultsHTML(successCount: number, failCount: number, results: any[]): string {
    let html = `
      <div class="text-start">
        <div class="row mb-3">
          <div class="col-4 text-center">
            <h2 class="text-success">${successCount}</h2>
            <small>✅ نجاح</small>
          </div>
          <div class="col-4 text-center">
            <h2 class="text-danger">${failCount}</h2>
            <small>❌ فشل</small>
          </div>
          <div class="col-4 text-center">
            <h2 class="text-primary">${successCount + failCount}</h2>
            <small><i class='fas fa-chalkboard-teacher' style='color:blue'></i>
 الإجمالي</small>
          </div>
        </div>
        <hr>
        <div style="max-height: 300px; overflow-y: auto;">
    `;

    results.forEach((result, index) => {
      const icon = result.success ? '✅' : '❌';
      const color = result.success ? 'text-success' : 'text-danger';
      html += `
        <div class="d-flex justify-content-between align-items-center p-2 ${index % 2 === 0 ? 'bg-light' : ''}" style="border-bottom: 1px solid #eee;">
          <div>
            <span class="${color}">${icon}</span>
            <strong>${result.student}</strong>
            <span class="text-muted">- ${result.payment}</span>
          </div>
          <div>
            <span class="badge ${result.success ? 'bg-success' : 'bg-danger'}">${result.success ? 'تم الدفع' : 'فشل'}</span>
            ${result.amount ? `<span class="ms-2">${result.amount.toLocaleString()} د.ج</span>` : ''}
          </div>
        </div>
      `;
    });

    html += `
        </div>
      </div>
    `;

    return html;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async payLatePayment(payment: MonthlyPayment): Promise<void> {
    this.soundService.playClick();
    const { value: paymentMethod } = await Swal.fire({
      title: 'تسديد دفعة متأخرة',
      html: `<div class="text-start"><p><i class='far fa-credit-card' style='color:blue'></i> المبلغ: ${payment.amount.toLocaleString()} د.ج</p>${payment.month ? `<p>📅 الشهر: ${payment.month}</p>` : ''}</div>`,
      icon: 'warning', showCancelButton: true, confirmButtonText: 'تسديد الآن', cancelButtonText: 'إلغاء',
      input: 'select', inputOptions: { 'cash': 'نقداً', 'bank': 'تحويل بنكي', 'card': 'بطاقة ائتمان', 'online': 'دفع إلكتروني' }
    });
    
    if (paymentMethod) {
      Swal.fire({ title: 'جاري التسديد...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
      
      if (payment._id) {
        const schoolId = this.getSchoolId();
        
        this.http.put<any>(`${this.apiUrl}/payments/${payment._id}/pay`, { 
          paymentMethod, 
          paymentDate: new Date().toISOString(), 
          notes: 'تم تسديد دفعة متأخرة',
          schoolId: schoolId
        }, { headers: this.getHeaders() }).subscribe({
          next: () => {
            Swal.fire({ icon: 'success', title: 'نجاح', text: 'تم تسديد الدفعة المتأخرة بنجاح', timer: 1500, showConfirmButton: false });
            const routeId = this.route.snapshot.paramMap.get('id');
            if (routeId) this.loadStudentPaymentSystems(routeId);
          },
          error: (error) => { 
            console.error('Error paying late payment:', error); 
            Swal.fire('خطأ', 'فشل في تسديد الدفعة المتأخرة', 'error'); 
          }
        });
      }
    }
  }

  async payRound(round: RoundPayment): Promise<void> {
      this.soundService.playPayment();

    const { value: paymentMethod } = await Swal.fire({
      title: 'دفع الجولة',
      html: `<div class="text-start"><p>🔢 رقم الجولة: ${round.roundNumber}</p><p><i class='far fa-credit-card' style='color:blue'></i> المبلغ: ${round.totalAmount.toLocaleString()} د.ج</p><p><i class='fas fa-chalkboard-teacher' style='color:blue'></i>
S عدد الجلسات: ${round.sessionCount}</p></div>`,
      icon: 'question', showCancelButton: true, confirmButtonText: 'دفع', cancelButtonText: 'إلغاء',
      input: 'select', inputOptions: { 'cash': 'نقداً', 'bank': 'تحويل بنكي', 'card': 'بطاقة ائتمان', 'online': 'دفع إلكتروني' }, inputValue: 'cash'
    });
    
    if (paymentMethod) {
      Swal.fire({ title: 'جاري الدفع...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
      const roundId = round._id || round.id;
      
      if (roundId) {
        const schoolId = this.getSchoolId();
        
        this.http.put<any>(`${this.apiUrl}/payment-systems/rounds/${roundId}/pay`, {
           
          paymentMethod, 
          paymentDate: new Date().toISOString(), 
          notes: `دفع جولة ${round.roundNumber}`,
          schoolId: schoolId
        }, { headers: this.getHeaders() }).subscribe({
          next: () => {
            this.soundService.playSuccess();
            Swal.fire({ icon: 'success', title: 'تم الدفع بنجاح', timer: 3000, showConfirmButton: false });
            const studentId = this.route.snapshot.paramMap.get('id');
            if (studentId) { this.loadStudentPaymentSystems(studentId); this.loadPaymentHistory(studentId); }
          },
          error: (error) => { 
            console.error('Error paying round:', error); 
            Swal.fire('خطأ', `فشل في دفع الجولة: ${error.error?.error || error.message}`, 'error'); 
          }
        });
      }
    }
  }

  viewRoundDetails(round: RoundPayment): void {
    let sessionsHTML = '<div class="table-responsive"><table class="table table-sm"><thead><tr><th>#</th><th>التاريخ</th><th>السعر</th><th>الحالة</th></tr></thead><tbody>';
    (round.sessions || []).forEach(session => {
      sessionsHTML += `<tr><td>${session.sessionNumber}</td><td>${new Date(session.date).toLocaleDateString('EG-US')}</td><td>${session.price} د.ج</td>
        <td><span class="badge ${session.status === 'completed' ? 'bg-success' : 'bg-warning'}">${session.status === 'completed' ? 'مكتملة' : 'معلقة'}</span></td></tr>`;
    });
    sessionsHTML += '</tbody></table></div>';
    Swal.fire({ title: `تفاصيل الجولة ${round.roundNumber}`, html: `<div class="text-start"><p><strong>🔢 رقم الجولة:</strong> ${round.roundNumber}</p><p><strong><i class='fas fa-chalkboard-teacher' style='color:blue'></i>
S عدد الجلسات:</strong> ${round.sessionCount}</p>
      <p><strong><i class='far fa-credit-card' style='color:blue'></i> المجموع الكلي:</strong> ${round.totalAmount.toLocaleString()} د.ج</p><p><strong>📅 تاريخ البدء:</strong> ${new Date(round.startDate).toLocaleDateString('EG-US')}</p>
      <p><strong>📅 تاريخ الانتهاء:</strong> ${new Date(round.endDate).toLocaleDateString('EG-US')}</p><p><strong><i class='fas fa-chalkboard-teacher' style='color:blue'></i>
 الحالة:</strong> <span class="${round.statusClass}">${round.statusText}</span></p><hr><h6>تفاصيل الجلسات:</h6>${sessionsHTML}</div>`,
      icon: 'info', confirmButtonText: 'حسناً' });
  }

  // ==================== PRINTER METHODS ====================
  
  checkPrinterConnection(): void {
    this.printerConnected = this.printerService.checkConnectionStatus();
    this.connectionType = this.printerService.getConnectionType() || 'usb';
    this.cdr.detectChanges();
  }

  showPrinterConnectionModal(): void {
    this.showPrinterConnectionModalFlag = true;
    // استرجاع الإعدادات المحفوظة
    const savedSettings = this.printerService.getConnectionSettings();
    if (savedSettings) {
      this.connectionType = savedSettings.type || 'usb';
      this.selectedComPort = savedSettings.comPort || 'COM1';
      this.selectedBaudRate = savedSettings.baudRate || 9600;
    }
  }

  closePrinterConnectionModal(): void {
    this.showPrinterConnectionModalFlag = false;
    this.isConnectingPrinter = false;
  }

  async connectPrinterWithSettings(): Promise<void> {
    this.isConnectingPrinter = true;
    
    try {
      let success = false;
      
      if (this.connectionType === 'usb') {
        success = await this.printerService.connectToThermalPrinter();
      } else if (this.connectionType === 'com') {
        success = await this.printerService.connectToComPort(this.selectedComPort, this.selectedBaudRate);
      }
      
      this.isConnectingPrinter = false;
      
      if (success) {
        this.printerConnected = true;
        this.closePrinterConnectionModal();
        
        Swal.fire({
          icon: 'success',
          title: '✅ تم الاتصال بالطابعة',
          text: `تم الاتصال بالطابعة عبر ${this.connectionType === 'usb' ? 'USB' : `COM (${this.selectedComPort})`} بنجاح`,
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: '❌ فشل الاتصال',
          text: `لم يتم الاتصال بالطابعة عبر ${this.connectionType === 'usb' ? 'USB' : `COM (${this.selectedComPort})`}. تأكد من توصيل الطابعة.`,
          confirmButtonText: 'حسناً'
        });
      }
    } catch (error: any) {
      this.isConnectingPrinter = false;
      console.error('خطأ في الاتصال بالطابعة:', error);
      Swal.fire({
        icon: 'error',
        title: 'خطأ',
        text: error.message || 'حدث خطأ أثناء محاولة الاتصال بالطابعة',
        confirmButtonText: 'حسناً'
      });
    }
  }

async printPaymentReceipt(payment: Payment): Promise<void> {
  this.soundService.playPayment();
  this.soundService.playClick();

  if (!this.printerService.checkConnectionStatus()) {
    const result = await Swal.fire({
      title: '⚠️ الطابعة غير متصلة',
      html: `
        <div class="text-start">
          <p>لم يتم الاتصال بالطابعة بعد.</p>
          <p>يرجى النقر على "اتصال" لاختيار الطابعة من القائمة.</p>
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
      this.showPrinterConnectionModal();
      return;
    } else if (result.isDenied) {
      await this.printRegularReceipt(payment);
      return;
    } else {
      return;
    }
  }

  // ✅ استخراج اسم الحصة بشكل صحيح
  const className = payment.class?.name || payment.className || 'عام';
  const studentName = payment.student?.name || this.student?.name || '';
  const studentId = payment.student?.studentId || this.student?.studentId || '';
  
  // ✅ الحصول على _id الحقيقي للطالب
  const studentObjectId = payment.student?._id || this.student?._id || this.student?.id || '';

  const receiptData: ReceiptData = {
    receiptNumber: payment.invoiceNumber || `RC-${Date.now().toString().slice(-8)}`,
    date: new Date().toLocaleDateString('ar-EG'),
    time: new Date().toLocaleTimeString('en-US', { hour12: false }),
    studentName: studentName,
    studentId: studentId,
    studentObjectId: studentObjectId, // ✅ إرسال _id للـ QR Code
    className: className,
    month: payment.monthCode || payment.month || '',
    amount: payment.amount,
    paymentMethod: payment.paymentMethod || 'cash',
    academicYear: this.student?.academicYear,
    parentPhone: this.student?.parentPhone,
    notes: payment.notes || 'دفعة فردية'
  };

  try {
    Swal.fire({
      title: '🖨️ جاري الطباعة...',
      text: 'يرجى الانتظار، يتم إرسال البيانات إلى الطابعة.',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    const success = await this.printerService.printProfessionalReceipt(receiptData);
    
    Swal.close();

    if (success) {
      Swal.fire({
        icon: 'success',
        title: '✅ تمت الطباعة',
        text: 'تم طباعة الإيصال على الطابعة بنجاح',
        timer: 2000,
        showConfirmButton: false
      });
    } else {
      throw new Error('فشلت الطباعة');
    }

  } catch (error) {
    console.error('❌ خطأ في طباعة الإيصال:', error);
    Swal.close();
    
    const fallbackResult = await Swal.fire({
      title: '❌ فشل الطباعة على الطابعة',
      html: `
        <div class="text-start">
          <p>حدث خطأ أثناء محاولة الطباعة على الطابعة.</p>
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
      this.showPrinterConnectionModal();
    } else if (fallbackResult.isDenied) {
      await this.printRegularReceipt(payment);
    }
  }
}

private async printRegularReceipt(payment: Payment): Promise<void> {
  this.soundService.playPayment();

  const className = payment.class?.name || payment.className || 'عام';
  const studentName = payment.student?.name || this.student?.name || '';
  const studentId = payment.student?.studentId || this.student?.studentId || '';
  // ✅ الحصول على _id الحقيقي للطالب
  const studentObjectId = payment.student?._id || this.student?._id || this.student?.id || '';

  const receiptData = {
    receiptNumber: payment.invoiceNumber || `RC-${Date.now().toString().slice(-8)}`,
    date: new Date().toLocaleDateString('ar-EG'),
    time: new Date().toLocaleTimeString('en-US', { hour12: false }),
    studentName: studentName,
    studentId: studentObjectId, // ✅ استخدام _id بدلاً من studentId
    className: className,
    month: payment.monthCode || payment.month || '',
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
    this.soundService.playPayment();

    Swal.fire({
      icon: 'success',
      title: '✅ تم الطباعة',
      text: 'تم فتح نافذة الطباعة، يرجى اختيار الطابعة المناسبة',
      timer: 2000,
      showConfirmButton: false
    });
  } else {
    Swal.fire({
      icon: 'error',
      title: '❌ خطأ',
      text: 'لا يمكن فتح نافذة الطباعة. يرجى السماح بالنوافذ المنبثقة.',
      confirmButtonText: 'حسناً'
    });
  }
}

// في student-details.component.ts - تحديث دالة generateSimpleReceiptHTML

private generateSimpleReceiptHTML(data: any): string {
  this.soundService.playPrint();
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
            <span class="info-value">${data.className || 'غير محدد'}</span>
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
  this.soundService.playPrint();
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
      // ✅ الحصول على _id الحقيقي للطالب
      const studentObjectId = payment.student?._id || this.student?._id || this.student?.id || '';
      
      const receiptData: ReceiptData = {
        receiptNumber: payment.invoiceNumber || `RC-${Date.now().toString().slice(-8)}-${i}`,
        date: new Date().toLocaleDateString('ar-EG'),
        time: new Date().toLocaleTimeString('en-US', { hour12: false }),
        studentName: payment.studentName || this.student?.name || '',
        studentId: payment.studentId || this.student?.studentId || '',
        studentObjectId: studentObjectId, // ✅ إرسال _id للـ QR Code
        className: payment.className || 'عام',
        month: payment.monthCode || payment.month || '',
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
  Swal.fire({ title: 'نتائج الطباعة', html: `<div class="alert alert-success"><h6>✅ تمت الطباعة بنجاح</h6><p><strong>المطبوع:</strong> ${printedCount}</p><p><strong>الإجمالي:</strong> ${payments.length}</p></div>`, icon: 'success', confirmButtonText: 'حسناً' });
}

// في student-details.component.ts - تحديث دالة printSingleReceiptForMultiplePayments

private async printSingleReceiptForMultiplePayments(payments: Payment[], paymentMethod: string, notes?: string): Promise<void> {
  if (!payments?.length) return;
    this.soundService.playPayment();

  try {
    Swal.fire({ 
      title: '🖨️ جاري إنشاء الإيصال الموحد...', 
      allowOutsideClick: false, 
      didOpen: () => Swal.showLoading() 
    });
    
    const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
      this.soundService.playPayment();
    this.soundService.playPrint();
    const bulkReceiptData: BulkReceiptData = {
      receiptNumber: `BLK-${Date.now().toString().slice(-8)}`,
      date: new Date().toLocaleDateString('ar-EG'),
      time: new Date().toLocaleTimeString('en-US', { hour12: false }),
      totalAmount: totalAmount,
      paymentCount: payments.length,
      studentCount: new Set(payments.map(p => p.studentName || this.student?.name || '')).size,
      paymentMethod: paymentMethod,
      payments: payments.map(p => ({
        studentName: p.studentName || this.student?.name || 'طالب',
        // ✅ استخدام _id الحقيقي للطالب
        studentId: p.student?._id || this.student?._id || this.student?.id || p.studentId || '',
        className: p.className || p.class?.name || 'غير محدد',
        month: p.monthCode || p.month || '',
        amount: p.amount,
        notes: p.notes
      })),
      notes: notes || `دفع جماعي لـ ${payments.length} دفعة`
    };

    
    this.soundService.playPayment();
    console.log('📤 بيانات الإيصال الموحد:', bulkReceiptData);
    
    Swal.close();

    Swal.fire({
      title: '🖨️ جاري طباعة الإيصال الموحد...',
      text: 'يرجى الانتظار، يتم إرسال البيانات إلى الطابعة.',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    const success = await this.printerService.printBulkReceipt(bulkReceiptData);
    
    Swal.close();

    if (success) {
      Swal.fire({
        icon: 'success',
        title: '✅ تمت الطباعة',
        text: 'تم طباعة الإيصال الموحد بنجاح مع تفاصيل الحصص',
        timer: 2000,
        showConfirmButton: false
      });
    } else {
      throw new Error('فشل في طباعة الإيصال الموحد');
    }
  } catch (error) {
    console.error('خطأ في طباعة الإيصال الموحد:', error);
    Swal.close();
    
    const fallbackResult = await Swal.fire({
      title: '❌ فشل الطباعة على الطابعة',
      html: `
        <div class="text-start">
          <p>حدث خطأ أثناء محاولة طباعة الإيصال الموحد.</p>
          <p>هل تريد طباعة إيصالات منفصلة بدلاً من ذلك؟</p>
        </div>
      `,
      icon: 'error',
      showCancelButton: true,
      confirmButtonText: '📄 طباعة إيصالات منفصلة',
      cancelButtonText: 'إلغاء'
    });

    if (fallbackResult.isConfirmed) {
      await this.printMultipleReceipts(payments);
    }
  }
}

  printStudentReport(): void {
    this.soundService.playPrint();
    if (!this.student) return;
    try {
      Swal.fire({ title: 'جاري إنشاء التقرير...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
      const totalPaid = this.getTotalPaid();
      const reportData = { student: this.student, classes: this.studentClasses, payments: this.paymentHistory, totalPaid: totalPaid, date: new Date().toLocaleDateString('S') };
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
      this.soundService.playPrint();
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
    </style></head><body><div class="report"><div class="header"><h1><i class='fas fa-chalkboard-teacher' style='color:blue'></i>
 تقرير الطالب</h1><p>📅 التاريخ: ${data.date}</p></div>
    <div class="student-info"><div class="info-grid"><div><strong>👨‍🎓 اسم الطالب:</strong> ${data.student.name}</div><div><strong>🆔 رقم الطالب:</strong> ${data.student.studentId}</div>
    <div><strong>🎓 المستوى الدراسي:</strong> ${this.getAcademicYearName(data.student.academicYear)}</div><div><strong>👨‍👦 ولي الأمر:</strong> ${data.student.parentName}</div>
    <div><strong>📞 هاتف ولي الأمر:</strong> ${data.student.parentPhone}</div></div></div>
    <div class="section"><h2>📚 الحصص المسجلة</h2><table><thead><tr><th>اسم الحصة</th><th>المادة</th><th>المعلم</th><th>السعر الشهري</th></tr></thead><tbody>
    ${data.classes.map((cls: any) => `<tr><td>${cls.name}</td><td>${cls.subject}</td><td>${cls.teacher?.name || 'غير محدد'}</td><td>${cls.price ? cls.price.toLocaleString() + ' د.ج' : 'غير محدد'}</td></tr>`).join('')}
    </tbody></table></div><div class="section"><h2><i class='far fa-credit-card' style='color:blue'></i> سجل المدفوعات</h2><table><thead><tr><th>التاريخ</th><th>المبلغ</th><th>الشهر</th><th>طريقة الدفع</th><th>الحالة</th></tr></thead><tbody>
    ${data.payments.map((payment: any) => `<tr><td>${payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString('EG-US') : 'لم يتم الدفع'}</td>
       <td>${payment.amount.toLocaleString()} د.ج</td><td>${payment.monthCode}</td><td>${this.getPaymentMethodLabel(payment.paymentMethod)}</td>
       <td>${this.getPaymentStatusText(payment)}</td></tr>`).join('')}</tbody></table><p class="total"><i class='far fa-credit-card' style='color:blue'></i> الإجمالي المدفوع: ${data.totalPaid.toLocaleString()} د.ج</p></div>
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