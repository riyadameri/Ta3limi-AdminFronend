// ==============================================
// students-platform.component.ts
// منصة الطالب المتكاملة - تسجيل دخول، حصص، غيابات، مدفوعات
// ==============================================

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { environment } from '../../environments/environment.development';
import Swal from 'sweetalert2';

// ==============================================
// Interfaces
// ==============================================

interface Student {
  _id?: string;
  id?: string;
  name: string;
  studentId: string;
  academicYear: string;
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
  username?: string;
  hasPaidRegistration?: boolean;
  active?: boolean;
  status?: string;
}

interface ClassInfo {
  _id: string;
  name: string;
  subject: string;
  teacher: {
    _id: string;
    name: string;
    phone?: string;
    email?: string;
  };
  price: number;
  academicYear: string;
  schedule: {
    day: string;
    time: string;
    classroom: {
      _id: string;
      name: string;
      location: string;
    };
  }[];
  students: Student[];
  paymentSystem: string;
}

interface Payment {
  _id: string;
  amount: number;
  month: string;
  monthCode: string;
  status: 'paid' | 'pending' | 'late' | 'cancelled';
  paymentDate?: string;
  paymentMethod?: string;
  invoiceNumber?: string;
  class: {
    _id: string;
    name: string;
    subject: string;
  };
}

interface Attendance {
  _id: string;
  student: {
    _id: string;
    name: string;
    studentId: string;
  };
  class: {
    _id: string;
    name: string;
    subject: string;
  };
  date: string;
  status: 'present' | 'absent' | 'late';
  recordedBy?: {
    username: string;
    fullName: string;
  };
}

interface UpcomingClass {
  classId: string;
  className: string;
  subject: string;
  teacher: string;
  day: string;
  time: string;
  classroom: string;
  date: Date;
  formattedDate: string;
}

interface AttendanceSummary {
  totalClasses: number;
  present: number;
  absent: number;
  late: number;
  attendanceRate: number;
}

interface PaymentSummary {
  total: number;
  paid: number;
  pending: number;
  late: number;
  totalPaidAmount: number;
  totalPendingAmount: number;
}

interface DashboardStats {
  totalClasses: number;
  totalPayments: number;
  attendanceRate: number;
  upcomingClassesCount: number;
}

@Component({
  selector: 'app-students-platform',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, RouterModule],
  template: `
    <div class="platform-container" dir="rtl">
      
      <!-- ========== HEADER ========== -->
      <header class="platform-header" *ngIf="isLoggedIn">
        <div class="header-content">
          <div class="logo-section">
            <div class="logo-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <div class="logo-text">
              <span class="school-name">{{ schoolName || 'المنصة التعليمية' }}</span>
              <span class="platform-sub">منصة الطالب</span>
            </div>
          </div>
          
          <div class="student-info">
            <div class="student-avatar" [style.background]="avatarColor">
              <span>{{ studentInitials }}</span>
            </div>
            <div class="student-details">
              <span class="student-name">{{ student?.name || 'طالب' }}</span>
              <span class="student-id">📚 {{ student?.studentId || 'غير محدد' }}</span>
            </div>
          </div>
          
          <button class="logout-btn" (click)="logout()">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            تسجيل خروج
          </button>
        </div>
      </header>

      <!-- ========== LOGIN PAGE ========== -->
      <div class="login-page" *ngIf="!isLoggedIn">
        <div class="login-container">
          <div class="login-card">
            <div class="login-header">
              <div class="login-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                  <path d="M2 17l10 5 10-5"/>
                  <path d="M2 12l10 5 10-5"/>
                </svg>
              </div>
              <h1>منصة الطالب</h1>
              <p>تسجيل الدخول لمتابعة حصصك ومدفوعاتك</p>
            </div>
            
            <form (ngSubmit)="login()" #loginForm="ngForm" class="login-form">
              <div class="form-group">
                <label>👤 اسم المستخدم</label>
                <input 
                  type="text" 
                  [(ngModel)]="loginData.username" 
                  name="username"
                  required
                  placeholder="أدخل اسم المستخدم"
                  class="login-input"
                />
              </div>
              
              <div class="form-group">
                <label>🔑 كلمة المرور</label>
                <input 
                  [type]="showPassword ? 'text' : 'password'"
                  [(ngModel)]="loginData.password" 
                  name="password"
                  required
                  placeholder="أدخل كلمة المرور"
                  class="login-input"
                />
                <button 
                  type="button" 
                  class="toggle-password" 
                  (click)="showPassword = !showPassword"
                >
                  {{ showPassword ? '🙈' : '👁️' }}
                </button>
              </div>
              
              <div class="form-group">
                <label>🏫 مفتاح المدرسة</label>
                <input 
                  type="text" 
                  [(ngModel)]="loginData.schoolKey" 
                  name="schoolKey"
                  required
                  placeholder="أدخل مفتاح المدرسة"
                  class="login-input"
                />
              </div>
              
              <button 
                type="submit" 
                class="login-btn" 
                [disabled]="isLoading"
              >
                {{ isLoading ? '⏳ جاري تسجيل الدخول...' : '🚀 تسجيل الدخول' }}
              </button>
              
              <div class="login-help">
                <span>🔐 بيانات الدخول تصلك بعد تسجيل الطالب</span>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- ========== DASHBOARD ========== -->
      <div class="dashboard-content" *ngIf="isLoggedIn">
        
        <!-- Stats Cards -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon blue">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <div class="stat-info">
              <span class="stat-number">{{ dashboardStats.totalClasses }}</span>
              <span class="stat-label">إجمالي الحصص</span>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon green">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 6v6l4 2"/>
              </svg>
            </div>
            <div class="stat-info">
              <span class="stat-number">{{ dashboardStats.attendanceRate }}%</span>
              <span class="stat-label">نسبة الحضور</span>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon orange">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="6" width="20" height="14" rx="2"/>
                <line x1="2" y1="10" x2="22" y2="10"/>
                <circle cx="16" cy="14" r="1"/>
              </svg>
            </div>
            <div class="stat-info">
              <span class="stat-number">{{ paymentSummary.totalPaidAmount }} دج</span>
              <span class="stat-label">المدفوعات</span>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon purple">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <div class="stat-info">
              <span class="stat-number">{{ dashboardStats.upcomingClassesCount }}</span>
              <span class="stat-label">حصص قادمة</span>
            </div>
          </div>
        </div>

        <!-- ========== UPCOMING CLASSES ========== -->
        <section class="section-card">
          <div class="section-header">
            <h2>📅 الحصص القادمة</h2>
            <span class="section-badge">{{ upcomingClasses.length }} حصة</span>
          </div>
          
          <div *ngIf="upcomingClasses.length === 0" class="empty-state">
            <p>📭 لا توجد حصص قادمة</p>
          </div>
          
          <div class="upcoming-grid" *ngIf="upcomingClasses.length > 0">
            <div class="upcoming-card" *ngFor="let cls of upcomingClasses">
              <div class="upcoming-date">
                <span class="day">{{ cls.day }}</span>
                <span class="date">{{ cls.formattedDate }}</span>
              </div>
              <div class="upcoming-info">
                <h4>{{ cls.className }}</h4>
                <span class="subject">{{ cls.subject }}</span>
                <div class="upcoming-meta">
                  <span>👨‍🏫 {{ cls.teacher }}</span>
                  <span>⏰ {{ cls.time }}</span>
                  <span>🏫 {{ cls.classroom }}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- ========== CLASSES TAB ========== -->
        <section class="section-card">
          <div class="section-header">
            <h2>📚 الحصص المسجل فيها</h2>
            <span class="section-badge">{{ classes.length }} حصة</span>
          </div>
          
          <div *ngIf="classes.length === 0" class="empty-state">
            <p>📭 لم يتم تسجيلك في أي حصة</p>
          </div>
          
          <div class="classes-grid" *ngIf="classes.length > 0">
            <div class="class-card" *ngFor="let cls of classes">
              <div class="class-header">
                <h3>{{ cls.name }}</h3>
                <span class="subject-badge">{{ cls.subject }}</span>
              </div>
              <div class="class-body">
                <div class="class-info">
                  <span>👨‍🏫 <strong>الأستاذ:</strong> {{ cls.teacher?.name || 'غير محدد' }}</span>
                  <span>💰 <strong>السعر:</strong> {{ cls.price }} دج</span>
                  <span>📚 <strong>المستوى:</strong> {{ getAcademicYearName(cls.academicYear) }}</span>
                </div>
                <div class="schedule-info">
                  <span *ngFor="let sched of cls.schedule">
                    {{ sched.day }}: {{ sched.time }}
                    <span *ngIf="sched.classroom">({{ sched.classroom.name }})</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- ========== PAYMENTS TAB ========== -->
        <section class="section-card">
          <div class="section-header">
            <h2>💰 المدفوعات</h2>
            <div class="payment-filters">
              <select [(ngModel)]="paymentFilter" (change)="filterPayments()" class="filter-select">
                <option value="all">الكل</option>
                <option value="paid">✅ مدفوع</option>
                <option value="pending">⏳ معلق</option>
                <option value="late">⚠️ متأخر</option>
              </select>
            </div>
          </div>
          
          <div *ngIf="filteredPayments.length === 0" class="empty-state">
            <p>📭 لا توجد مدفوعات</p>
          </div>
          
          <div class="payments-table-container" *ngIf="filteredPayments.length > 0">
            <table class="payments-table">
              <thead>
                <tr>
                  <th>الشهر</th>
                  <th>الحصة</th>
                  <th>المبلغ</th>
                  <th>الحالة</th>
                  <th>تاريخ الدفع</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let payment of filteredPayments">
                  <td>{{ payment.month }}</td>
                  <td>{{ payment.class?.name || 'غير محدد' }}</td>
                  <td>{{ payment.amount }} دج</td>
                  <td>
                    <span class="payment-status" [class.status-paid]="payment.status === 'paid'"
                          [class.status-pending]="payment.status === 'pending'"
                          [class.status-late]="payment.status === 'late'">
                      {{ payment.status === 'paid' ? '✅ مدفوع' : 
                         payment.status === 'pending' ? '⏳ معلق' : 
                         payment.status === 'late' ? '⚠️ متأخر' : payment.status }}
                    </span>
                  </td>
                  <td>{{ payment.paymentDate ? (payment.paymentDate | date:'shortDate') : '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div class="payment-summary" *ngIf="payments.length > 0">
            <div class="summary-item">
              <span>إجمالي المدفوعات:</span>
              <strong>{{ paymentSummary.totalPaidAmount }} دج</strong>
            </div>
            <div class="summary-item">
              <span>المدفوع:</span>
              <strong class="text-success">{{ paymentSummary.paid }}</strong>
            </div>
            <div class="summary-item">
              <span>المعلق:</span>
              <strong class="text-warning">{{ paymentSummary.pending }}</strong>
            </div>
            <div class="summary-item">
              <span>المتأخر:</span>
              <strong class="text-danger">{{ paymentSummary.late }}</strong>
            </div>
          </div>
        </section>

        <!-- ========== ATTENDANCE TAB ========== -->
        <section class="section-card">
          <div class="section-header">
            <h2>📊 الحضور والغياب</h2>
            <span class="section-badge">{{ attendanceSummary.attendanceRate }}%</span>
          </div>
          
          <div *ngIf="attendanceRecords.length === 0" class="empty-state">
            <p>📭 لا توجد سجلات حضور</p>
          </div>
          
          <div class="attendance-stats" *ngIf="attendanceRecords.length > 0">
            <div class="attendance-chart">
              <div class="stat-circle">
                <div class="circle-value">{{ attendanceSummary.attendanceRate }}%</div>
                <div class="circle-label">نسبة الحضور</div>
              </div>
              <div class="stat-details">
                <div class="stat-detail present">
                  <span class="dot green"></span>
                  <span>حاضر: {{ attendanceSummary.present }}</span>
                </div>
                <div class="stat-detail absent">
                  <span class="dot red"></span>
                  <span>غائب: {{ attendanceSummary.absent }}</span>
                </div>
                <div class="stat-detail late">
                  <span class="dot orange"></span>
                  <span>متأخر: {{ attendanceSummary.late }}</span>
                </div>
                <div class="stat-detail total">
                  <span>إجمالي الحصص: {{ attendanceSummary.totalClasses }}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="attendance-table-container" *ngIf="attendanceRecords.length > 0">
            <table class="attendance-table">
              <thead>
                <tr>
                  <th>التاريخ</th>
                  <th>الحصة</th>
                  <th>الحالة</th>
                  <th>المعلم</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let record of attendanceRecords">
                  <td>{{ record.date | date:'dd/MM/yyyy' }}</td>
                  <td>{{ record.class?.name || 'غير محدد' }}</td>
                  <td>
                    <span class="attendance-status" [class.status-present]="record.status === 'present'"
                          [class.status-absent]="record.status === 'absent'"
                          [class.status-late]="record.status === 'late'">
                      {{ record.status === 'present' ? '✅ حاضر' : 
                         record.status === 'absent' ? '❌ غائب' : 
                         record.status === 'late' ? '⏰ متأخر' : record.status }}
                    </span>
                  </td>
                  <td>{{ record.recordedBy?.fullName || 'تلقائي' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <!-- ========== FOOTER ========== -->
      <footer class="platform-footer" *ngIf="isLoggedIn">
        <p>© {{ currentYear }} منصة الطالب - جميع الحقوق محفوظة</p>
      </footer>
    </div>
  `,
  styles: [`
    /* ===== CSS Variables ===== */
    :host {
      --primary: #6C63FF;
      --primary-dark: #5A52D5;
      --primary-light: #8B83FF;
      --success: #00C9A7;
      --warning: #FFC107;
      --danger: #FF6B6B;
      --dark: #2D3436;
      --gray: #636E72;
      --light-gray: #DFE6E9;
      --bg: #F8F9FA;
      --white: #FFFFFF;
      --radius: 16px;
      --shadow: 0 10px 40px rgba(0,0,0,0.08);
      --shadow-hover: 0 20px 60px rgba(108,99,255,0.15);
      --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    /* ===== Container ===== */
    .platform-container {
      min-height: 100vh;
      background: var(--bg);
      font-family: 'Cairo', 'Segoe UI', sans-serif;
      direction: rtl;
    }

    /* ===== Login Page ===== */
    .login-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }

    .login-container {
      width: 100%;
      max-width: 420px;
    }

    .login-card {
      background: var(--white);
      border-radius: var(--radius);
      padding: 40px 32px 32px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.25);
      animation: slideUp 0.5s ease;
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .login-header {
      text-align: center;
      margin-bottom: 32px;
    }

    .login-icon {
      width: 64px;
      height: 64px;
      background: linear-gradient(135deg, var(--primary), var(--primary-dark));
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      margin: 0 auto 16px;
      box-shadow: 0 4px 16px rgba(108,99,255,0.35);
    }

    .login-header h1 {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--dark);
      margin: 0 0 4px;
    }

    .login-header p {
      color: var(--gray);
      font-size: 0.9rem;
      margin: 0;
    }

    .login-form .form-group {
      margin-bottom: 18px;
      position: relative;
    }

    .login-form label {
      display: block;
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--dark);
      margin-bottom: 6px;
    }

    .login-input {
      width: 100%;
      padding: 12px 16px;
      border: 2px solid var(--light-gray);
      border-radius: 10px;
      font-size: 0.95rem;
      transition: var(--transition);
      font-family: inherit;
      background: var(--white);
      color: var(--dark);
    }

    .login-input:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 4px rgba(108,99,255,0.08);
    }

    .login-input::placeholder {
      color: var(--gray);
    }

    .toggle-password {
      position: absolute;
      left: 14px;
      bottom: 12px;
      background: none;
      border: none;
      font-size: 1.1rem;
      cursor: pointer;
      padding: 0;
      color: var(--gray);
    }

    .login-btn {
      width: 100%;
      padding: 14px;
      background: linear-gradient(135deg, var(--primary), var(--primary-dark));
      color: white;
      border: none;
      border-radius: 10px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: var(--transition);
      font-family: inherit;
      margin-top: 8px;
    }

    .login-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(108,99,255,0.35);
    }

    .login-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .login-help {
      text-align: center;
      margin-top: 16px;
      color: var(--gray);
      font-size: 0.8rem;
    }

    /* ===== Header ===== */
    .platform-header {
      background: var(--white);
      border-bottom: 1px solid var(--light-gray);
      padding: 12px 24px;
      position: sticky;
      top: 0;
      z-index: 100;
      box-shadow: 0 2px 12px rgba(0,0,0,0.04);
    }

    .header-content {
      max-width: 1400px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }

    .logo-section {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .logo-icon {
      width: 44px;
      height: 44px;
      background: linear-gradient(135deg, var(--primary), var(--primary-dark));
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      flex-shrink: 0;
    }

    .logo-text {
      display: flex;
      flex-direction: column;
    }

    .school-name {
      font-size: 1rem;
      font-weight: 700;
      color: var(--dark);
      line-height: 1.2;
    }

    .platform-sub {
      font-size: 0.65rem;
      color: var(--gray);
      font-weight: 500;
    }

    .student-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .student-avatar {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 1.1rem;
      color: white;
      flex-shrink: 0;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }

    .student-details {
      display: flex;
      flex-direction: column;
      line-height: 1.2;
    }

    .student-name {
      font-weight: 600;
      color: var(--dark);
      font-size: 0.95rem;
    }

    .student-id {
      font-size: 0.7rem;
      color: var(--gray);
    }

    .logout-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border: none;
      background: #FEF2F2;
      color: var(--danger);
      border-radius: 8px;
      font-size: 0.8rem;
      font-weight: 500;
      cursor: pointer;
      transition: var(--transition);
      font-family: inherit;
    }

    .logout-btn:hover {
      background: #FEE2E2;
    }

    /* ===== Dashboard ===== */
    .dashboard-content {
      max-width: 1400px;
      margin: 0 auto;
      padding: 24px 20px 40px;
    }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .stat-card {
      background: var(--white);
      border-radius: var(--radius);
      padding: 18px 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      box-shadow: var(--shadow);
      border: 1px solid var(--light-gray);
      transition: var(--transition);
    }

    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-hover);
    }

    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .stat-icon.blue { background: #DBEAFE; color: var(--primary); }
    .stat-icon.green { background: #ECFDF5; color: var(--success); }
    .stat-icon.orange { background: #FFFBEB; color: #D97706; }
    .stat-icon.purple { background: #EDE7FF; color: #7C3AED; }

    .stat-info {
      display: flex;
      flex-direction: column;
      line-height: 1.2;
    }

    .stat-number {
      font-size: 1.3rem;
      font-weight: 700;
      color: var(--dark);
    }

    .stat-label {
      font-size: 0.7rem;
      color: var(--gray);
      font-weight: 500;
    }

    /* Section Cards */
    .section-card {
      background: var(--white);
      border-radius: var(--radius);
      padding: 20px 24px;
      margin-bottom: 24px;
      box-shadow: var(--shadow);
      border: 1px solid var(--light-gray);
    }

    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
      flex-wrap: wrap;
      gap: 10px;
    }

    .section-header h2 {
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--dark);
      margin: 0;
    }

    .section-badge {
      background: var(--bg);
      padding: 4px 14px;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--gray);
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: 40px 20px;
      color: var(--gray);
    }

    .empty-state p {
      font-size: 1rem;
      margin: 0;
    }

    /* ===== Upcoming Classes ===== */
    .upcoming-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 14px;
    }

    .upcoming-card {
      display: flex;
      gap: 14px;
      padding: 14px 16px;
      background: var(--bg);
      border-radius: 12px;
      border: 1px solid var(--light-gray);
      transition: var(--transition);
    }

    .upcoming-card:hover {
      border-color: var(--primary-light);
      background: var(--white);
    }

    .upcoming-date {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-width: 60px;
      padding: 8px 12px;
      background: var(--primary);
      color: white;
      border-radius: 10px;
      flex-shrink: 0;
    }

    .upcoming-date .day {
      font-size: 0.7rem;
      font-weight: 600;
    }

    .upcoming-date .date {
      font-size: 0.6rem;
      opacity: 0.9;
    }

    .upcoming-info {
      flex: 1;
    }

    .upcoming-info h4 {
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--dark);
      margin: 0 0 2px;
    }

    .upcoming-info .subject {
      font-size: 0.8rem;
      color: var(--gray);
    }

    .upcoming-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 6px;
      font-size: 0.7rem;
      color: var(--gray);
    }

    .upcoming-meta span {
      background: var(--white);
      padding: 2px 10px;
      border-radius: 12px;
      border: 1px solid var(--light-gray);
    }

    /* ===== Classes Grid ===== */
    .classes-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 16px;
    }

    .class-card {
      border: 1px solid var(--light-gray);
      border-radius: 12px;
      overflow: hidden;
      transition: var(--transition);
    }

    .class-card:hover {
      box-shadow: var(--shadow-hover);
      border-color: var(--primary-light);
    }

    .class-header {
      background: var(--bg);
      padding: 12px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid var(--light-gray);
    }

    .class-header h3 {
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--dark);
      margin: 0;
    }

    .subject-badge {
      background: var(--primary);
      color: white;
      padding: 2px 12px;
      border-radius: 12px;
      font-size: 0.65rem;
      font-weight: 600;
    }

    .class-body {
      padding: 12px 16px;
    }

    .class-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-size: 0.8rem;
      color: var(--gray);
    }

    .class-info strong {
      color: var(--dark);
    }

    .schedule-info {
      margin-top: 8px;
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .schedule-info span {
      background: var(--bg);
      padding: 2px 10px;
      border-radius: 12px;
      font-size: 0.7rem;
      color: var(--gray);
      border: 1px solid var(--light-gray);
    }

    /* ===== Payments Table ===== */
    .payment-filters {
      display: flex;
      gap: 8px;
    }

    .filter-select {
      padding: 6px 12px;
      border: 2px solid var(--light-gray);
      border-radius: 8px;
      font-size: 0.8rem;
      font-family: inherit;
      background: var(--white);
      color: var(--dark);
      cursor: pointer;
    }

    .filter-select:focus {
      outline: none;
      border-color: var(--primary);
    }

    .payments-table-container {
      overflow-x: auto;
    }

    .payments-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.85rem;
    }

    .payments-table th {
      text-align: right;
      padding: 10px 14px;
      background: var(--bg);
      font-weight: 600;
      color: var(--gray);
      border-bottom: 2px solid var(--light-gray);
    }

    .payments-table td {
      padding: 10px 14px;
      border-bottom: 1px solid var(--light-gray);
      color: var(--dark);
    }

    .payments-table tr:hover td {
      background: var(--bg);
    }

    .payment-status {
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 0.7rem;
      font-weight: 600;
    }

    .status-paid {
      background: #ECFDF5;
      color: var(--success);
    }

    .status-pending {
      background: #FFFBEB;
      color: #D97706;
    }

    .status-late {
      background: #FEF2F2;
      color: var(--danger);
    }

    .payment-summary {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      padding: 14px 0 0;
      border-top: 2px solid var(--light-gray);
      margin-top: 14px;
    }

    .summary-item {
      display: flex;
      gap: 6px;
      font-size: 0.85rem;
      color: var(--gray);
    }

    .text-success { color: var(--success); }
    .text-warning { color: #D97706; }
    .text-danger { color: var(--danger); }

    /* ===== Attendance ===== */
    .attendance-stats {
      display: flex;
      align-items: center;
      gap: 32px;
      padding: 16px 0;
    }

    .stat-circle {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      background: conic-gradient(var(--primary) 0%, var(--primary) var(--attendance-angle, 75%), var(--light-gray) var(--attendance-angle, 75%));
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .stat-circle .circle-value {
      background: var(--white);
      width: 80px;
      height: 80px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.3rem;
      font-weight: 700;
      color: var(--dark);
    }

    .stat-circle .circle-label {
      position: absolute;
      bottom: -20px;
      font-size: 0.7rem;
      color: var(--gray);
    }

    .stat-details {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .stat-detail {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 0.85rem;
      color: var(--gray);
    }

    .dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      display: inline-block;
    }

    .dot.green { background: var(--success); }
    .dot.red { background: var(--danger); }
    .dot.orange { background: var(--warning); }

    .attendance-table-container {
      overflow-x: auto;
    }

    .attendance-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.85rem;
    }

    .attendance-table th {
      text-align: right;
      padding: 10px 14px;
      background: var(--bg);
      font-weight: 600;
      color: var(--gray);
      border-bottom: 2px solid var(--light-gray);
    }

    .attendance-table td {
      padding: 10px 14px;
      border-bottom: 1px solid var(--light-gray);
      color: var(--dark);
    }

    .attendance-status {
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 0.7rem;
      font-weight: 600;
    }

    .status-present {
      background: #ECFDF5;
      color: var(--success);
    }

    .status-absent {
      background: #FEF2F2;
      color: var(--danger);
    }

    .status-late {
      background: #FFFBEB;
      color: #D97706;
    }

    /* ===== Footer ===== */
    .platform-footer {
      text-align: center;
      padding: 20px;
      color: var(--gray);
      font-size: 0.8rem;
      border-top: 1px solid var(--light-gray);
      background: var(--white);
    }

    /* ===== Responsive ===== */
    @media (max-width: 768px) {
      .header-content {
        flex-wrap: wrap;
        gap: 8px;
      }
      
      .student-info {
        margin-right: auto;
      }
      
      .logout-btn span {
        display: none;
      }
      
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }
      
      .upcoming-grid {
        grid-template-columns: 1fr;
      }
      
      .classes-grid {
        grid-template-columns: 1fr;
      }
      
      .attendance-stats {
        flex-direction: column;
        gap: 16px;
      }
      
      .section-card {
        padding: 14px 16px;
      }
      
      .login-card {
        padding: 24px 16px;
      }
    }

    @media (max-width: 480px) {
      .stats-grid {
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }
      
      .stat-card {
        padding: 12px 14px;
      }
      
      .stat-number {
        font-size: 1rem;
      }
      
      .payments-table th,
      .payments-table td,
      .attendance-table th,
      .attendance-table td {
        padding: 6px 8px;
        font-size: 0.75rem;
      }
      
      .stat-circle {
        width: 100px;
        height: 100px;
      }
      
      .stat-circle .circle-value {
        width: 66px;
        height: 66px;
        font-size: 1rem;
      }
    }
  `]
})
export class StudentsPlatformComponent implements OnInit, OnDestroy {
  
  // ==============================================
  // Properties
  // ==============================================
  
  private apiUrl = environment.apiUrl;
  
  // Login
  loginData = {
    username: '',
    password: '',
    schoolKey: ''
  };
  showPassword: boolean = false;
  isLoading: boolean = false;
  isLoggedIn: boolean = false;
  
  // Student Data
  student: Student | null = null;
  schoolName: string = '';
  avatarColor: string = '#6C63FF';
  studentInitials: string = '?';
  
  // Data
  classes: ClassInfo[] = [];
  payments: Payment[] = [];
  filteredPayments: Payment[] = [];
  attendanceRecords: Attendance[] = [];
  upcomingClasses: UpcomingClass[] = [];
  
  // Filters
  paymentFilter: string = 'all';
  
  // Summaries
  dashboardStats: DashboardStats = {
    totalClasses: 0,
    totalPayments: 0,
    attendanceRate: 0,
    upcomingClassesCount: 0
  };
  paymentSummary: PaymentSummary = {
    total: 0,
    paid: 0,
    pending: 0,
    late: 0,
    totalPaidAmount: 0,
    totalPendingAmount: 0
  };
  attendanceSummary: AttendanceSummary = {
    totalClasses: 0,
    present: 0,
    absent: 0,
    late: 0,
    attendanceRate: 0
  };
  
  currentYear: number = new Date().getFullYear();
  
  // Avatar Colors
  private avatarColors: string[] = [
    '#6C63FF', '#00C9A7', '#FF6B6B', '#FFC107',
    '#4A9EFF', '#FF6584', '#00B894', '#6C5CE7',
    '#FD79A8', '#0984E3', '#00CEC9', '#FDCB6E'
  ];
  
  // Academic Years
  academicYears = [
    { value: '1AS', label: 'السنة الأولى ثانوي' },
    { value: '2AS', label: 'السنة الثانية ثانوي' },
    { value: '3AS', label: 'السنة الثالثة ثانوي' },
    { value: '1MS', label: 'السنة الأولى متوسط' },
    { value: '2MS', label: 'السنة الثانية متوسط' },
    { value: '3MS', label: 'السنة الثالثة متوسط' },
    { value: '4MS', label: 'السنة الرابعة متوسط' },
    { value: '1AP', label: 'السنة الأولى ابتدائي' },
    { value: '2AP', label: 'السنة الثانية ابتدائي' },
    { value: '3AP', label: 'السنة الثالثة ابتدائي' },
    { value: '4AP', label: 'السنة الرابعة ابتدائي' },
    { value: '5AP', label: 'السنة الخامسة ابتدائي' }
  ];
  
  // ==============================================
  // Constructor
  // ==============================================
  
  constructor(private router: Router, private http: HttpClient) {}
  
  // ==============================================
  // Lifecycle
  // ==============================================
  
  ngOnInit(): void {
    this.checkLoginStatus();
  }
  
  ngOnDestroy(): void {
    // Cleanup
  }
  
  // ==============================================
  // Login Methods
  // ==============================================
  
  private checkLoginStatus(): void {
    const token = localStorage.getItem('studentToken');
    if (token) {
      this.isLoggedIn = true;
      this.loadStudentData();
    }
  }
  
  login(): void {
    if (!this.loginData.username || !this.loginData.password || !this.loginData.schoolKey) {
      Swal.fire('خطأ', 'يرجى ملء جميع الحقول', 'error');
      return;
    }
    
    this.isLoading = true;
    
    // For student login, we use the student-accounts endpoint
    this.http.post(`${this.apiUrl}/student/login`, {
      username: this.loginData.username,
      password: this.loginData.password,
      schoolKey: this.loginData.schoolKey
    }).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        
        if (response.token) {
          localStorage.setItem('studentToken', response.token);
          localStorage.setItem('studentUser', JSON.stringify(response.user));
          
          this.isLoggedIn = true;
          this.student = response.user;
          this.studentInitials = this.getInitials(this.student?.name || '');
          this.avatarColor = this.getAvatarColor(this.student?.name || '');
          
          Swal.fire('✅ مرحباً', `مرحباً ${this.student?.name || 'طالب'}`, 'success');
          
          this.loadStudentData();
        } else {
          Swal.fire('خطأ', 'بيانات الدخول غير صحيحة', 'error');
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Login error:', err);
        Swal.fire('خطأ', err.error?.error || 'فشل تسجيل الدخول', 'error');
      }
    });
  }
  
  logout(): void {
    Swal.fire({
      title: 'تسجيل الخروج',
      text: 'هل أنت متأكد من تسجيل الخروج؟',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'نعم، تسجيل خروج',
      cancelButtonText: 'إلغاء'
    }).then(result => {
      if (result.isConfirmed) {
        localStorage.removeItem('studentToken');
        localStorage.removeItem('studentUser');
        this.isLoggedIn = false;
        this.student = null;
        this.classes = [];
        this.payments = [];
        this.attendanceRecords = [];
        this.upcomingClasses = [];
        this.router.navigate(['/students-platform']);
      }
    });
  }
  
  // ==============================================
  // Load Student Data
  // ==============================================
  
  loadStudentData(): void {
    const token = localStorage.getItem('studentToken');
    if (!token) return;
    
    // Get student info from stored data
    const userStr = localStorage.getItem('studentUser');
    if (userStr) {
      try {
        this.student = JSON.parse(userStr);
        this.studentInitials = this.getInitials(this.student?.name || '');
        this.avatarColor = this.getAvatarColor(this.student?.name || '');
      } catch (e) {
        console.error('Error parsing student user:', e);
      }
    }
    
    // Load all data
    this.loadStudentClasses();
    this.loadStudentPayments();
    this.loadStudentAttendance();
    this.loadUpcomingClasses();
  }
  
  // ==============================================
  // Load Student Classes
  // ==============================================
  
  loadStudentClasses(): void {
    if (!this.student?._id) return;
    
    const token = localStorage.getItem('studentToken');
    if (!token) return;
    
    this.http.get(`${this.apiUrl}/students/${this.student._id}/classes`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.classes = response.data || [];
          this.dashboardStats.totalClasses = this.classes.length;
        }
      },
      error: (err) => {
        console.error('Error loading classes:', err);
      }
    });
  }
  
  // ==============================================
  // Load Student Payments
  // ==============================================
  
  loadStudentPayments(): void {
    if (!this.student?._id) return;
    
    const token = localStorage.getItem('studentToken');
    if (!token) return;
    
    this.http.get(`${this.apiUrl}/payments/student/${this.student._id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.payments = response.payments || [];
          this.filteredPayments = [...this.payments];
          
          // Update summary
          this.updatePaymentSummary();
        }
      },
      error: (err) => {
        console.error('Error loading payments:', err);
      }
    });
  }
  
  // ==============================================
  // Load Student Attendance
  // ==============================================
  
  loadStudentAttendance(): void {
    if (!this.student?._id) return;
    
    const token = localStorage.getItem('studentToken');
    if (!token) return;
    
    this.http.get(`${this.apiUrl}/students/${this.student._id}/absences`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.attendanceRecords = response.allAbsences || [];
          this.updateAttendanceSummary();
        }
      },
      error: (err) => {
        console.error('Error loading attendance:', err);
      }
    });
  }
  
  // ==============================================
  // Load Upcoming Classes
  // ==============================================
  
  loadUpcomingClasses(): void {
    if (!this.student?._id) return;
    
    const token = localStorage.getItem('studentToken');
    if (!token) return;
    
    this.http.get(`${this.apiUrl}/students/${this.student._id}/classes`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).subscribe({
      next: (response: any) => {
        if (response.success) {
          const classes = response.data || [];
          this.upcomingClasses = this.calculateUpcomingClasses(classes);
          this.dashboardStats.upcomingClassesCount = this.upcomingClasses.length;
        }
      },
      error: (err) => {
        console.error('Error loading upcoming classes:', err);
      }
    });
  }
  
  // ==============================================
  // Calculate Upcoming Classes
  // ==============================================
  
  private calculateUpcomingClasses(classes: ClassInfo[]): UpcomingClass[] {
    const today = new Date();
    const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const upcoming: UpcomingClass[] = [];
    
    for (const cls of classes) {
      for (const schedule of cls.schedule || []) {
        const dayIndex = days.indexOf(schedule.day);
        if (dayIndex >= 0) {
          const classDate = new Date(today);
          let daysToAdd = dayIndex - today.getDay();
          if (daysToAdd < 0) daysToAdd += 7;
          if (daysToAdd === 0) {
            // Same day, check if time has passed
            const [hours, minutes] = schedule.time.split(':').map(Number);
            const now = new Date();
            if (now.getHours() > hours || (now.getHours() === hours && now.getMinutes() > minutes)) {
              daysToAdd = 7;
            }
          }
          classDate.setDate(today.getDate() + daysToAdd);
          
          if (classDate >= today) {
            upcoming.push({
              classId: cls._id,
              className: cls.name,
              subject: cls.subject,
              teacher: cls.teacher?.name || 'غير محدد',
              day: schedule.day,
              time: schedule.time,
              classroom: schedule.classroom?.name || 'غير محدد',
              date: classDate,
              formattedDate: classDate.toLocaleDateString('ar-EG', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })
            });
          }
        }
      }
    }
    
    // Sort by date
    upcoming.sort((a, b) => a.date.getTime() - b.date.getTime());
    
    return upcoming.slice(0, 10);
  }
  
  // ==============================================
  // Update Summaries
  // ==============================================
  
  private updatePaymentSummary(): void {
    this.paymentSummary = {
      total: this.payments.length,
      paid: this.payments.filter(p => p.status === 'paid').length,
      pending: this.payments.filter(p => p.status === 'pending').length,
      late: this.payments.filter(p => p.status === 'late').length,
      totalPaidAmount: this.payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0),
      totalPendingAmount: this.payments.filter(p => p.status !== 'paid').reduce((sum, p) => sum + p.amount, 0)
    };
    
    this.dashboardStats.totalPayments = this.paymentSummary.paid;
  }
  
  private updateAttendanceSummary(): void {
    const present = this.attendanceRecords.filter(r => r.status === 'present').length;
    const absent = this.attendanceRecords.filter(r => r.status === 'absent').length;
    const late = this.attendanceRecords.filter(r => r.status === 'late').length;
    const total = this.attendanceRecords.length;
    
    this.attendanceSummary = {
      totalClasses: total,
      present: present,
      absent: absent,
      late: late,
      attendanceRate: total > 0 ? Math.round(((present + late) / total) * 100) : 0
    };
    
    this.dashboardStats.attendanceRate = this.attendanceSummary.attendanceRate;
  }
  
  // ==============================================
  // Filter Methods
  // ==============================================
  
  filterPayments(): void {
    if (this.paymentFilter === 'all') {
      this.filteredPayments = [...this.payments];
    } else {
      this.filteredPayments = this.payments.filter(p => p.status === this.paymentFilter);
    }
  }
  
  // ==============================================
  // Helper Methods
  // ==============================================
  
  getAcademicYearName(code: string | undefined): string {
    if (!code) return 'غير محدد';
    const year = this.academicYears.find(y => y.value === code);
    return year ? year.label : code;
  }
  
  private getInitials(name: string): string {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  }
  
  private getAvatarColor(name: string): string {
    const index = (name?.length || 0) % this.avatarColors.length;
    return this.avatarColors[index];
  }
  
  // ==============================================
  // Dashboard Refresh
  // ==============================================
  
  refreshDashboard(): void {
    this.loadStudentData();
  }
}