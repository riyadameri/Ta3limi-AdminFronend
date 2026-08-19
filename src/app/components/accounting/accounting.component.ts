// comprehensive-accounting.component.ts
// ================================================================
// ===== الفاتورة الاحترافية - الهيدر المحترف بالكامل =====
// ================================================================

import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment.development';
import Swal from 'sweetalert2';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

// ==================== Interfaces ====================
interface SummaryData {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  totalTransactions: number;
  counts: {
    financialTransactions: number;
    payments: number;
    fees: number;
    expenses: number;
    commissions: number;
  };
  totalCommissions?: number;
  netProfitAfterCommissions?: number;
  profitMargin?: number;
}

interface Transaction {
  _id: string;
  amount: number;
  _type: string;
  typeLabel: string;
  description?: string;
  icon?: string;
  date?: string;
  paymentDate?: string;
  createdAt?: string;
  recordedBy?: { fullName: string; username: string };
  status?: string;
}

interface Commission {
  _id: string;
  teacher: { name: string; _id: string };
  class: { name: string; _id: string };
  month: string;
  students: any[];
  totalAmount: number;
  totalPaid: number;
  remainingAmount: number;
  status: string;
  createdAt: string;
  percentage?: number;
}

interface Payment {
  _id: string;
  student: { name: string; _id: string };
  class: { name: string; _id: string };
  amount: number;
  month: string;
  monthCode: string;
  paymentDate: string;
  status: string;
  paymentMethod: string;
  createdAt: string;
}

interface Expense {
  _id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  paymentMethod: string;
  status: string;
  notes?: string;
}

interface NetProfitData {
  month: string;
  summary: {
    totalIncome: number;
    totalExpenses: number;
    totalCommissions: number;
    netProfit: number;
    profitMargin: number;
  };
  details: {
    incomeBreakdown: {
      payments: number;
      fees: number;
      transactions: number;
    };
    expensesBreakdown: {
      operating: number;
      commissions: number;
    };
  };
}

interface TransactionsByStatus {
  month: string;
  stats: {
    total: number;
    totalAmount: number;
    byStatus: {
      paid: number;
      pending: number;
      cancelled: number;
    };
    byType: {
      payments: number;
      fees: number;
      expenses: number;
      commissions: number;
    };
  };
  transactions: Transaction[];
}

interface StudentAttendanceData {
  _id: string;
  name: string;
  studentId: string;
  academicYear: string;
  parentPhone: string;
  payment: {
    totalAmount: number;
    totalPaid: number;
    totalPending: number;
    status: 'paid' | 'partial' | 'pending';
    payments: Payment[];
  };
  attendance: {
    byDate: { [date: string]: { status: string; joinedAt: string; className: string; startTime: string } };
    summary: {
      present: number;
      absent: number;
      late: number;
      total: number;
      attendanceRate: number;
    };
  };
  canEditPayment: boolean;
  canEditTeacherShare: boolean;
}

interface ClassStudentsData {
  class: {
    _id: string;
    name: string;
    subject: string;
    price: number;
    paymentSystem: string;
    teacher: {
      _id: string;
      name: string;
      salaryPercentage: number;
    };
  };
  period: {
    start: Date;
    end: Date;
    month: string;
  };
  summary: {
    totalStudents: number;
    totalPaid: number;
    totalPending: number;
    totalAmount: number;
    totalPresent: number;
    totalAbsent: number;
    totalLate: number;
    averageAttendance: number;
  };
  upcomingDays: {
    date: string;
    dayName: string;
    hasClass: boolean;
    isPast: boolean;
    isToday: boolean;
    className: string;
    schedule: any;
  }[];
  liveClasses: any[];
  students: StudentAttendanceData[];
}

interface NavTab {
  id: string;
  label: string;
  icon: string;
}

interface SchoolInfo {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  schoolKey?: string;
  logo?: string;
}

interface InvoiceData {
  invoiceNumber: string;
  date: string;
  school: SchoolInfo | null;
  teacher: { name: string };
  class: { name: string };
  month: string;
  totalSessions: number;
  students: { name: string; sessions: string; attendanceRate: number; teacherShare: number }[];
  totalAmount: number;
  totalPaid: number;
  remainingAmount: number;
  status: string;
  statusText: string;
}

interface AvailableCommission {
  classId: string;
  className: string;
  subject: string;
  teacherId: string;
  teacherName: string;
  teacherPercentage: number;
  studentsCount: number;
  students: {
    studentId: string;
    studentName: string;
    amount: number;
    teacherShare: number;
    status: string;
  }[];
  totalAmount: number;
  price: number;
  paymentSystem: string;
}

interface TeacherDuesSummary {
  summary: {
    totalAmount: number;
    totalPaid: number;
    totalRemaining: number;
    totalTeachers: number;
    unpaidTeachers: number;
    paidTeachers: number;
    pendingTeachers: number;
    partialTeachers: number;
  };
  teachers: {
    teacherId: string;
    teacherName: string;
    teacherPercentage: number;
    totalAmount: number;
    totalPaid: number;
    totalRemaining: number;
    pendingAmount: number;
    partialAmount: number;
    paidAmount: number;
    commissionCount: number;
    paidCount: number;
    pendingCount: number;
    partialCount: number;
    cancelledCount: number;
    studentsCount: number;
    monthsCount: number;
    classesCount: number;
    paidPercentage: number;
    remainingPercentage: number;
    status: 'paid' | 'unpaid' | 'partial';
  }[];
}

interface TeacherPaymentDetails {
  teacher: {
    _id: string;
    name: string;
    salaryPercentage: number;
    subjects: string[];
    phone: string;
    email: string;
  };
  summary: {
    totalCommissions: number;
    totalAmount: number;
    totalPaid: number;
    totalRemaining: number;
    pendingCount: number;
    paidCount: number;
    partialCount: number;
    cancelledCount: number;
    totalStudents: number;
    profitRate: number;
    unpaidAmount: number;
    paidPercentage: number;
  };
  byMonth: {
    month: string;
    totalAmount: number;
    totalPaid: number;
    totalRemaining: number;
    commissionCount: number;
    studentsCount: number;
  }[];
  commissions: any[];
  totalRecords: number;
}

@Component({
  selector: 'app-comprehensive-accounting',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<!-- ==================== مكتبة الأيقونات (SVG Sprite) ==================== -->
<svg xmlns="http://www.w3.org/2000/svg" style="display:none">
  <defs>
    <symbol id="icon-lock" viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></symbol>
    <symbol id="icon-ledger" viewBox="0 0 24 24"><path d="M4 5.5C4 4.7 4.7 4 5.5 4H12v16H5.5A1.5 1.5 0 0 1 4 18.5v-13Z"/><path d="M20 5.5c0-.8-.7-1.5-1.5-1.5H12v16h6.5a1.5 1.5 0 0 0 1.5-1.5v-13Z"/></symbol>
    <symbol id="icon-plus" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></symbol>
    <symbol id="icon-back" viewBox="0 0 24 24"><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></symbol>
    <symbol id="icon-chart-bar" viewBox="0 0 24 24"><path d="M4 20V10M10 20V4M16 20v-7M21 20H3"/></symbol>
    <symbol id="icon-trend-up" viewBox="0 0 24 24"><path d="M4 17l5-5 4 4 7-8"/><path d="M15 8h5v5"/></symbol>
    <symbol id="icon-trend-down" viewBox="0 0 24 24"><path d="M4 7l5 5 4-4 7 8"/><path d="M15 16h5v-5"/></symbol>
    <symbol id="icon-coins" viewBox="0 0 24 24"><ellipse cx="9" cy="9" rx="6" ry="3.2"/><path d="M3 9v4c0 1.8 2.7 3.2 6 3.2s6-1.4 6-3.2V9"/><ellipse cx="17" cy="15.2" rx="4.3" ry="2.3"/></symbol>
    <symbol id="icon-target" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4.2"/><circle cx="12" cy="12" r="0.6" fill="currentColor"/></symbol>
    <symbol id="icon-user-tie" viewBox="0 0 24 24"><circle cx="12" cy="7.8" r="3.4"/><path d="M12 11.2c-4 0-6.5 2.6-6.5 6.6v1h13v-1c0-4-2.5-6.6-6.5-6.6Z"/><path d="M12 11.2l-1.1 2.8 1.1 1.4 1.1-1.4-1.1-2.8Z" fill="currentColor" stroke="none"/></symbol>
    <symbol id="icon-users" viewBox="0 0 24 24"><circle cx="9" cy="8" r="3"/><path d="M3.3 19c0-3 2.6-5.2 5.7-5.2s5.7 2.2 5.7 5.2"/><circle cx="17.2" cy="9" r="2.3"/><path d="M15.2 19c.3-2.1 1.7-3.6 3.8-4.1"/></symbol>
    <symbol id="icon-briefcase" viewBox="0 0 24 24"><rect x="3" y="8" width="18" height="11" rx="2"/><path d="M8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M3 13h18"/></symbol>
    <symbol id="icon-card" viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18"/><path d="M7 15h4"/></symbol>
    <symbol id="icon-receipt" viewBox="0 0 24 24"><path d="M6 3h12v18l-2.5-1.5L13 21l-2.5-1.5L8 21l-2-1.5V3Z"/><path d="M8.5 8h7M8.5 12h7M8.5 16h4"/></symbol>
    <symbol id="icon-clipboard" viewBox="0 0 24 24"><rect x="5" y="4" width="14" height="17" rx="2"/><rect x="9" y="2.4" width="6" height="3.4" rx="1"/><path d="M8.5 11h7M8.5 15h7"/></symbol>
    <symbol id="icon-gear" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 3v2.2M12 18.8V21M21 12h-2.2M5.2 12H3M18.2 5.8l-1.6 1.6M7.4 16.6l-1.6 1.6M18.2 18.2l-1.6-1.6M7.4 7.4 5.8 5.8"/></symbol>
    <symbol id="icon-cash" viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="10" rx="2"/><circle cx="12" cy="12" r="2.4"/><path d="M6 9v6M18 9v6" opacity=".55"/></symbol>
    <symbol id="icon-bolt" viewBox="0 0 24 24"><path d="M13 3 6 13h5l-1 8 8-11h-5l1-7Z"/></symbol>
    <symbol id="icon-trash" viewBox="0 0 24 24"><path d="M4 7h16"/><path d="M9 7V4.8c0-.4.4-.8.9-.8h4.2c.5 0 .9.4.9.8V7"/><path d="M6 7l1 12.2c0 .9.8 1.6 1.7 1.6h6.6c.9 0 1.7-.7 1.7-1.6L18 7"/></symbol>
    <symbol id="icon-eye" viewBox="0 0 24 24"><path d="M2.3 12S5.9 5.3 12 5.3 21.7 12 21.7 12 18.1 18.7 12 18.7 2.3 12 2.3 12Z"/><circle cx="12" cy="12" r="3"/></symbol>
    <symbol id="icon-check-circle" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M8.5 12.3l2.3 2.3 4.7-5.2"/></symbol>
    <symbol id="icon-clock" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3.2 2"/></symbol>
    <symbol id="icon-x-circle" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M9 9l6 6M15 9l-6 6"/></symbol>
    <symbol id="icon-pencil" viewBox="0 0 24 24"><path d="M4 20l.9-3.8L15.6 5.6a1.8 1.8 0 0 1 2.6 0l1.2 1.2a1.8 1.8 0 0 1 0 2.6L8.8 20.1 4 20Z"/><path d="M14 7.5l2.5 2.5"/></symbol>
    <symbol id="icon-calendar" viewBox="0 0 24 24"><rect x="4" y="5.5" width="16" height="15" rx="2"/><path d="M4 10h16M8 3.5V7M16 3.5V7"/></symbol>
    <symbol id="icon-printer" viewBox="0 0 24 24"><rect x="5" y="8" width="14" height="8" rx="1.5"/><path d="M7 8V4.5h10V8"/><path d="M7 16v3.5h10V16"/></symbol>
    <symbol id="icon-search" viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M20 20l-4.5-4.5"/></symbol>
    <symbol id="icon-close" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></symbol>
    <symbol id="icon-shield" viewBox="0 0 24 24"><path d="M12 3l7 3v6c0 5-3 8.5-7 9-4-.5-7-4-7-9V6l7-3Z"/><path d="M9 12l2 2 4-4.5"/></symbol>
    <symbol id="icon-cap" viewBox="0 0 24 24"><path d="M12 5 2.5 9.5 12 14l9.5-4.5L12 5Z"/><path d="M6.5 11.5V16c0 1.3 2.5 2.5 5.5 2.5s5.5-1.2 5.5-2.5v-4.5"/><path d="M21 10v5.5"/></symbol>
  </defs>
</svg>

<!-- ==================== شاشة الرمز السري ==================== -->
<div class="gate-screen" *ngIf="!isAuthenticated">
  <div class="gate-ledger-lines"></div>
  <div class="gate-glow"></div>
  <div class="gate-card" [class.gate-card-unlocking]="isUnlocking">
    <div class="gate-seal" [class.gate-seal-spin]="isUnlocking">
      <div class="gate-seal-ring"></div>
      <div class="gate-seal-ring gate-seal-ring-2"></div>
      <svg class="icon gate-seal-icon"><use href="#icon-lock"></use></svg>
    </div>
    <p class="gate-eyebrow">دخول موثّق</p>
    <h1 class="gate-title">الوصول محمي</h1>
    <p class="gate-subtitle">أدخل الرمز السري للدخول إلى لوحة المحاسبة</p>
    <div class="gate-input-wrap">
      <input
        type="password"
        class="gate-input"
        [(ngModel)]="passcodeInput"
        placeholder="••••••"
        autofocus
        (keydown.enter)="checkPasscode()"
        [class.gate-input-error]="passcodeError"
        [disabled]="isUnlocking"
      />
    </div>
    <p class="gate-error" *ngIf="passcodeError">{{ passcodeError }}</p>
    <button class="gate-btn" (click)="checkPasscode()" [disabled]="isUnlocking">
      <span *ngIf="!isUnlocking">فتح اللوحة</span>
      <span *ngIf="isUnlocking">جارٍ التحقق...</span>
    </button>
    <button class="gate-back" (click)="goBack()" [disabled]="isUnlocking">العودة للرئيسية</button>
  </div>
</div>

<!-- ==================== الواجهة الرئيسية ==================== -->
<div class="app-shell" *ngIf="isAuthenticated">

  <!-- الهيدر -->
  <header class="app-header">
    <div class="header-left">
      <button class="icon-btn hamburger" (click)="toggleMobileNav()" aria-label="القائمة">
        <span></span><span></span><span></span>
      </button>
      <div class="brand">
        <div class="brand-mark"><svg class="icon"><use href="#icon-ledger"></use></svg></div>
        <div class="brand-text">
          <span class="brand-title">{{ schoolName || 'لوحة المحاسبة' }}</span>
          <span class="brand-sub">Redox Accounting MR-AC 1</span>
        </div>
      </div>
    </div>
    <div class="header-right">
      <button class="icon-btn icon-btn-accent" (click)="openTransactionModal()" title="إضافة معاملة سريعة">
        <svg class="icon"><use href="#icon-plus"></use></svg>
      </button>
      <button class="icon-btn back-btn" (click)="goBack()" title="عودة">
        <svg class="icon"><use href="#icon-back"></use></svg>
      </button>
    </div>
  </header>

  <div class="app-body">

    <!-- التنقل الجانبي -->
    <nav class="side-nav" [class.side-nav-open]="showMobileNav">
      <div class="side-nav-head">
        <span>الأقسام</span>
        <button class="icon-btn nav-close" (click)="toggleMobileNav()"><svg class="icon"><use href="#icon-close"></use></svg></button>
      </div>
      <button
        *ngFor="let tab of tabsList"
        class="nav-item"
        [class.nav-item-active]="activeTab === tab.id"
        (click)="switchTab(tab.id)"
      >
        <span class="nav-icon"><svg class="icon"><use [attr.href]="'#icon-' + tab.icon"></use></svg></span>
        <span class="nav-label">{{ tab.label }}</span>
      </button>
    </nav>
    <div class="nav-overlay" *ngIf="showMobileNav" (click)="toggleMobileNav()"></div>

    <!-- المحتوى -->
    <main class="app-content">

      <!-- ===== تبويب 1: الملخص المالي ===== -->
      <section *ngIf="activeTab === 'summary'" class="tab-panel">
        <div class="panel-toolbar">
          <h2 class="panel-title">الملخص المالي</h2>
          <input type="month" class="input-field" [(ngModel)]="selectedMonth" (change)="onMonthChange()" />
        </div>

        <!-- بطاقات الإحصائيات الرئيسية -->
        <div class="cards-grid" *ngIf="summary">
          <div class="stat-card stat-income">
            <span class="stat-icon"><svg class="icon"><use href="#icon-trend-up"></use></svg></span>
            <div class="stat-body">
              <span class="stat-label">إجمالي الإيرادات</span>
              <span class="stat-value">{{ summary.totalIncome | number:'1.0-0' }}</span>
            </div>
          </div>
          <div class="stat-card stat-expense">
            <span class="stat-icon"><svg class="icon"><use href="#icon-trend-down"></use></svg></span>
            <div class="stat-body">
              <span class="stat-label">إجمالي المصروفات</span>
              <span class="stat-value">{{ summary.totalExpenses | number:'1.0-0' }}</span>
            </div>
          </div>
          <div class="stat-card stat-profit">
            <span class="stat-icon"><svg class="icon"><use href="#icon-coins"></use></svg></span>
            <div class="stat-body">
              <span class="stat-label">صافي الربح</span>
              <span class="stat-value">{{ summary.netProfitAfterCommissions ?? summary.netProfit | number:'1.0-0' }}</span>
            </div>
          </div>
          <div class="stat-card stat-margin">
            <span class="stat-icon"><svg class="icon"><use href="#icon-target"></use></svg></span>
            <div class="stat-body">
              <span class="stat-label">هامش الربح</span>
              <span class="stat-value">{{ (summary.profitMargin ?? 0) | number:'1.0-1' }}%</span>
            </div>
          </div>
        </div>

        <div class="loading-row" *ngIf="isLoadingSummary">جارٍ تحميل الملخص...</div>

        <!-- مستحقات الأساتذة غير المدفوعة -->
        <div class="teacher-dues-section" *ngIf="teacherDuesSummary">
          <div class="section-header">
            <h3 class="section-title"><svg class="icon"><use href="#icon-user-tie"></use></svg> مستحقات الأساتذة غير المدفوعة</h3>
            <span class="section-badge" [class.has-dues]="teacherDuesSummary.summary.totalRemaining > 0">
              {{ teacherDuesSummary.summary.totalRemaining | number:'1.0-0' }}
            </span>
          </div>
          <div class="dues-cards-grid">
            <div class="dues-stat-card">
              <span class="dues-stat-label">إجمالي المستحقات</span>
              <span class="dues-stat-value">{{ teacherDuesSummary.summary.totalAmount | number:'1.0-0' }}</span>
            </div>
            <div class="dues-stat-card">
              <span class="dues-stat-label">المدفوع</span>
              <span class="dues-stat-value paid">{{ teacherDuesSummary.summary.totalPaid | number:'1.0-0' }}</span>
            </div>
            <div class="dues-stat-card">
              <span class="dues-stat-label">المتبقي</span>
              <span class="dues-stat-value unpaid">{{ teacherDuesSummary.summary.totalRemaining | number:'1.0-0' }}</span>
            </div>
            <div class="dues-stat-card">
              <span class="dues-stat-label">عدد الأساتذة</span>
              <span class="dues-stat-value">{{ teacherDuesSummary.summary.totalTeachers }}</span>
            </div>
          </div>
          <div class="teacher-dues-list" *ngIf="teacherDuesSummary.teachers.length > 0">
            <div class="teacher-dues-item" *ngFor="let t of teacherDuesSummary.teachers.slice(0, 5)">
              <div class="teacher-dues-info">
                <span class="teacher-name">{{ t.teacherName }}</span>
                <span class="teacher-status" [class]="'status-' + t.status">
                  {{ t.status === 'paid' ? 'مدفوع' : t.status === 'partial' ? 'مدفوع جزئياً' : 'غير مدفوع' }}
                </span>
              </div>
              <div class="teacher-dues-amounts">
                <span class="dues-amount">{{ t.totalRemaining | number:'1.0-0' }}</span>
                <span class="dues-total">{{ t.totalAmount | number:'1.0-0' }}</span>
              </div>
            </div>
            <button class="btn btn-sm btn-outline" (click)="switchTab('commissions')" *ngIf="teacherDuesSummary.teachers.length > 5">
              عرض جميع المستحقات ({{ teacherDuesSummary.teachers.length }})
            </button>
          </div>
        </div>

        <div class="charts-grid" *ngIf="summary">
          <div class="chart-card">
            <h3 class="chart-title">الإيرادات مقابل المصروفات</h3>
            <div class="chart-canvas-wrap">
              <canvas #incomeExpenseChart></canvas>
            </div>
          </div>
          <div class="chart-card">
            <h3 class="chart-title">توزيع العمليات</h3>
            <div class="chart-canvas-wrap">
              <canvas #transactionsChart></canvas>
            </div>
          </div>
        </div>

        <div class="sub-panel">
          <div class="panel-toolbar">
            <h3 class="panel-subtitle">تفاصيل يوم محدد</h3>
            <input type="date" class="input-field" [(ngModel)]="detailsDate" (change)="loadDailyDetails()" />
          </div>
          <div class="loading-row" *ngIf="isLoadingDetails">جارٍ التحميل...</div>
          <div class="list-card" *ngFor="let tx of transactions">
            <div class="list-card-icon" [class.income-tint]="isIncome(tx)" [class.expense-tint]="!isIncome(tx)">
              <svg class="icon"><use [attr.href]="isIncome(tx) ? '#icon-trend-up' : '#icon-trend-down'"></use></svg>
            </div>
            <div class="list-card-body">
              <span class="list-card-title">{{ tx.description || tx.typeLabel }}</span>
              <span class="list-card-sub">{{ tx.typeLabel }} &middot; {{ tx.recordedBy?.fullName }}</span>
            </div>
            <span class="list-card-amount" [class.income-icon]="isIncome(tx)" [class.expense-icon]="!isIncome(tx)">
              {{ tx.amount | number:'1.0-0' }}
            </span>
          </div>
          <p class="empty-hint" *ngIf="!isLoadingDetails && transactions.length === 0">لا توجد معاملات في هذا اليوم</p>
        </div>
      </section>

      <!-- ===== تبويب 2: عمولات الأساتذة ===== -->
      <section *ngIf="activeTab === 'commissions'" class="tab-panel">
        <div class="panel-toolbar wrap">
          <h2 class="panel-title">عمولات الأساتذة</h2>
          <div class="toolbar-actions">
            <input type="month" class="input-field" [(ngModel)]="commissionMonth" (change)="loadCommissionsEnhanced()" />
            <select class="input-field" [(ngModel)]="commissionStatus" (change)="loadCommissionsEnhanced()">
              <option value="all">كل الحالات</option>
              <option value="pending">معلقة</option>
              <option value="partial">مدفوعة جزئيا</option>
              <option value="paid">مدفوعة</option>
              <option value="cancelled">ملغاة</option>
            </select>
            <button class="btn btn-primary" (click)="openBulkCommissionModal()" [disabled]="isLoadingAvailableCommissions">
              <svg class="icon"><use href="#icon-gear"></use></svg> إنشاء عمولات الشهر
            </button>
            <button class="btn btn-success" (click)="payAllCommissions()" *ngIf="hasPendingCommissions">
              <svg class="icon"><use href="#icon-cash"></use></svg> دفع جميع العمولات
            </button>
            <button class="btn btn-accent" (click)="autoCalculateDues()" [disabled]="isAutoCalculating">
              <svg class="icon"><use href="#icon-bolt"></use></svg> حساب تلقائي
            </button>
          </div>
        </div>

        <!-- إحصائيات العمولات -->
        <div class="cards-grid four" *ngIf="commissionsStatsEnhanced">
          <div class="stat-card stat-neutral">
            <span class="stat-label">إجمالي العمولات</span>
            <span class="stat-value">{{ commissionsStatsEnhanced.totalAmount || 0 | number:'1.0-0' }}</span>
          </div>
          <div class="stat-card stat-neutral">
            <span class="stat-label">المدفوع</span>
            <span class="stat-value">{{ commissionsStatsEnhanced.totalPaid || 0 | number:'1.0-0' }}</span>
          </div>
          <div class="stat-card stat-neutral">
            <span class="stat-label">المتبقي</span>
            <span class="stat-value">{{ commissionsStatsEnhanced.totalRemaining || 0 | number:'1.0-0' }}</span>
          </div>
          <div class="stat-card stat-neutral">
            <span class="stat-label">عدد العمولات</span>
            <span class="stat-value">{{ commissions.length }}</span>
          </div>
        </div>

        <!-- قائمة العمولات -->
        <div class="list-card commission-card" *ngFor="let c of commissions">
          <div class="list-card-body">
            <span class="list-card-title">{{ c.teacher?.name }} &middot; {{ c.class?.name }}</span>
            <span class="list-card-sub">{{ c.month }} &middot; حالة: <span class="badge" [ngClass]="'badge-' + c.status">{{ c.status }}</span></span>
            <span class="list-card-sub" *ngIf="c.percentage">نسبة العمولة: {{ c.percentage }}%</span>
          </div>
          <div class="commission-amounts">
            <span class="list-card-amount">{{ c.totalAmount | number:'1.0-0' }}</span>
            <span class="list-card-sub">متبقي: {{ c.remainingAmount | number:'1.0-0' }}</span>
          </div>
          <div class="commission-actions">
            <button class="btn btn-sm btn-outline" (click)="viewCommissionDetails(c._id)"><svg class="icon"><use href="#icon-eye"></use></svg> التفاصيل</button>
            <button class="btn btn-sm btn-success" (click)="payCommission(c._id)" *ngIf="c.status !== 'paid' && c.status !== 'cancelled'"><svg class="icon"><use href="#icon-cash"></use></svg> دفع</button>
            <button class="btn btn-sm btn-danger" (click)="cancelCommission(c._id)" *ngIf="c.status !== 'cancelled' && c.status !== 'paid'"><svg class="icon"><use href="#icon-trash"></use></svg> إلغاء</button>
          </div>
        </div>
        <p class="empty-hint" *ngIf="commissions.length === 0">لا توجد عمولات لهذا الشهر</p>
      </section>

      <!-- ===== تبويب 3: المدفوعات ===== -->
      <section *ngIf="activeTab === 'payments'" class="tab-panel">
        <div class="panel-toolbar wrap">
          <h2 class="panel-title">المدفوعات</h2>
          <div class="toolbar-actions">
            <div class="search-field">
              <svg class="icon"><use href="#icon-search"></use></svg>
              <input type="text" class="input-field" placeholder="بحث..." [(ngModel)]="paymentSearch" (change)="loadPayments()" />
            </div>
            <input type="month" class="input-field" [(ngModel)]="paymentMonth" (change)="loadPayments()" />
            <select class="input-field" [(ngModel)]="paymentStatus" (change)="loadPayments()">
              <option value="all">كل الحالات</option>
              <option value="pending">معلقة</option>
              <option value="paid">مدفوعة</option>
              <option value="cancelled">ملغاة</option>
            </select>
            <button class="btn btn-primary" (click)="openPaymentModal()"><svg class="icon"><use href="#icon-plus"></use></svg> إضافة دفعة</button>
          </div>
        </div>

        <div class="list-card" *ngFor="let p of payments">
          <div class="list-card-body">
            <span class="list-card-title">{{ p.student?.name }} &middot; {{ p.class?.name }}</span>
            <span class="list-card-sub">{{ p.month }} &middot; {{ p.paymentMethod }} &middot; <span class="badge" [ngClass]="'badge-' + p.status">{{ p.status }}</span></span>
          </div>
          <span class="list-card-amount">{{ p.amount | number:'1.0-0' }}</span>
          <div class="commission-actions">
            <button class="btn btn-sm btn-success" (click)="payPayment(p._id)" *ngIf="p.status === 'pending'"><svg class="icon"><use href="#icon-cash"></use></svg> تسديد</button>
            <button class="btn btn-sm btn-danger" (click)="cancelPayment(p._id)" *ngIf="p.status !== 'cancelled'"><svg class="icon"><use href="#icon-trash"></use></svg> إلغاء</button>
          </div>
        </div>
        <p class="empty-hint" *ngIf="payments.length === 0">لا توجد دفعات مطابقة</p>
      </section>

      <!-- ===== تبويب 4: المصروفات ===== -->
      <section *ngIf="activeTab === 'expenses'" class="tab-panel">
        <div class="panel-toolbar wrap">
          <h2 class="panel-title">المصروفات</h2>
          <div class="toolbar-actions">
            <input type="date" class="input-field" [(ngModel)]="expenseStartDate" (change)="loadExpenses()" />
            <input type="date" class="input-field" [(ngModel)]="expenseEndDate" (change)="loadExpenses()" />
            <select class="input-field" [(ngModel)]="expenseCategory" (change)="loadExpenses()">
              <option value="all">كل الفئات</option>
              <option value="rent">إيجار</option>
              <option value="utilities">مرافق</option>
              <option value="supplies">مستلزمات</option>
              <option value="salary">رواتب</option>
              <option value="other">أخرى</option>
            </select>
            <button class="btn btn-primary" (click)="openExpenseModal()"><svg class="icon"><use href="#icon-plus"></use></svg> إضافة مصروف</button>
          </div>
        </div>

        <div class="stat-card stat-expense total-expense-card">
          <span class="stat-icon"><svg class="icon"><use href="#icon-receipt"></use></svg></span>
          <div class="stat-body">
            <span class="stat-label">إجمالي المصروفات في الفترة</span>
            <span class="stat-value">{{ totalExpenses | number:'1.0-0' }}</span>
          </div>
        </div>

        <div class="list-card" *ngFor="let e of expenses">
          <div class="list-card-body">
            <span class="list-card-title">{{ e.description }}</span>
            <span class="list-card-sub">{{ e.category }} &middot; {{ e.date | date:'yyyy-MM-dd' }} &middot; {{ e.paymentMethod }}</span>
          </div>
          <span class="list-card-amount expense-icon">{{ e.amount | number:'1.0-0' }}</span>
          <button class="btn btn-sm btn-danger" (click)="deleteExpense(e._id)"><svg class="icon"><use href="#icon-trash"></use></svg></button>
        </div>
        <p class="empty-hint" *ngIf="expenses.length === 0">لا توجد مصروفات في هذه الفترة</p>
      </section>

      <!-- ===== تبويب 5: حالة المعاملات ===== -->
      <section *ngIf="activeTab === 'transactions-status'" class="tab-panel">
        <div class="panel-toolbar wrap">
          <h2 class="panel-title">حالة المعاملات</h2>
          <div class="toolbar-actions">
            <input type="month" class="input-field" [(ngModel)]="statusMonth" (change)="loadTransactionsByStatus()" />
            <select class="input-field" [(ngModel)]="statusFilter" (change)="loadTransactionsByStatus()">
              <option value="all">الكل</option>
              <option value="paid">مدفوعة</option>
              <option value="pending">معلقة</option>
              <option value="cancelled">ملغاة</option>
            </select>
          </div>
        </div>

        <div class="loading-row" *ngIf="isLoadingStatus">جارٍ التحميل...</div>

        <div class="cards-grid four" *ngIf="transactionsByStatus">
          <div class="stat-card stat-neutral">
            <span class="stat-label">إجمالي المعاملات</span>
            <span class="stat-value">{{ transactionsByStatus.stats.total }}</span>
          </div>
          <div class="stat-card stat-neutral">
            <span class="stat-label">مدفوعة</span>
            <span class="stat-value">{{ transactionsByStatus.stats.byStatus.paid }}</span>
          </div>
          <div class="stat-card stat-neutral">
            <span class="stat-label">معلقة</span>
            <span class="stat-value">{{ transactionsByStatus.stats.byStatus.pending }}</span>
          </div>
          <div class="stat-card stat-neutral">
            <span class="stat-label">ملغاة</span>
            <span class="stat-value">{{ transactionsByStatus.stats.byStatus.cancelled }}</span>
          </div>
        </div>

        <div class="list-card" *ngFor="let tx of statusTransactions">
          <div class="list-card-body">
            <span class="list-card-title">{{ tx.description || tx.typeLabel }}</span>
            <span class="list-card-sub">{{ tx.typeLabel }} &middot; <span class="badge" [ngClass]="'badge-' + tx.status">{{ tx.status }}</span></span>
          </div>
          <span class="list-card-amount">{{ tx.amount | number:'1.0-0' }}</span>
        </div>
        <p class="empty-hint" *ngIf="!isLoadingStatus && statusTransactions.length === 0">لا توجد معاملات مطابقة</p>
      </section>

      <!-- ===== تبويب 6: الطلاب والحضور ===== -->
      <section *ngIf="activeTab === 'students-attendance'" class="tab-panel">
        <div class="panel-toolbar wrap">
          <h2 class="panel-title">الطلاب والحضور</h2>
          <div class="toolbar-actions">
            <select class="input-field" [(ngModel)]="selectedClassId">
              <option value="">اختر الحصة</option>
              <option *ngFor="let cls of classesList" [value]="cls._id">{{ cls.name }}</option>
            </select>
            <input type="month" class="input-field" [(ngModel)]="attendanceMonth" />
            <button class="btn btn-primary" (click)="loadStudentsAttendance()" [disabled]="isLoadingAttendance">
              <svg class="icon"><use href="#icon-eye"></use></svg>
              {{ isLoadingAttendance ? 'جارٍ التحميل...' : 'عرض' }}
            </button>
          </div>
        </div>

        <ng-container *ngIf="studentsAttendanceData as data">
          <div class="panel-toolbar">
            <h3 class="panel-subtitle">{{ data.class.name }} &middot; الأستاذ: {{ data.class.teacher?.name }}</h3>
            <button class="btn btn-outline btn-sm" (click)="openTeacherPercentageModal()"><svg class="icon"><use href="#icon-pencil"></use></svg> تعديل نسبة الأستاذ</button>
          </div>
          <div class="cards-grid four">
            <div class="stat-card stat-neutral">
              <span class="stat-label">عدد الطلاب</span>
              <span class="stat-value">{{ data.summary.totalStudents }}</span>
            </div>
            <div class="stat-card stat-income">
              <span class="stat-label">المدفوع</span>
              <span class="stat-value">{{ data.summary.totalPaid | number:'1.0-0' }}</span>
            </div>
            <div class="stat-card stat-expense">
              <span class="stat-label">المعلق</span>
              <span class="stat-value">{{ data.summary.totalPending | number:'1.0-0' }}</span>
            </div>
            <div class="stat-card stat-margin">
              <span class="stat-label">متوسط الحضور</span>
              <span class="stat-value">{{ data.summary.averageAttendance | number:'1.0-0' }}%</span>
            </div>
          </div>

          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>الطالب</th>
                  <th>الدفع</th>
                  <th>نسبة الحضور</th>
                  <th>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let st of data.students">
                  <td data-label="الطالب">{{ st.name }}</td>
                  <td data-label="الدفع">
                    <span class="badge" [ngClass]="'badge-' + st.payment.status">{{ st.payment.status }}</span>
                    {{ st.payment.totalPaid | number:'1.0-0' }} / {{ st.payment.totalAmount | number:'1.0-0' }}
                  </td>
                  <td data-label="الحضور">{{ st.attendance.summary.attendanceRate }}%</td>
                  <td data-label="إجراءات" class="table-actions">
                    <button class="btn btn-xs btn-outline" (click)="openStudentAttendanceModal(st)" *ngIf="st.canEditPayment !== false"><svg class="icon"><use href="#icon-calendar"></use></svg> حضور</button>
                    <button class="btn btn-xs btn-outline" (click)="openPaymentAdjustModal(st)" *ngIf="st.canEditPayment"><svg class="icon"><use href="#icon-pencil"></use></svg> تعديل دفع</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </ng-container>
        <p class="empty-hint" *ngIf="!studentsAttendanceData && !isLoadingAttendance">اختر حصة وشهرا ثم اضغط عرض</p>
      </section>

      <!-- ===== تبويب 7: تفاصيل الأستاذ ===== -->
      <section *ngIf="activeTab === 'teacher-details'" class="tab-panel">
        <div class="panel-toolbar wrap">
          <h2 class="panel-title">تفاصيل الأستاذ</h2>
          <div class="toolbar-actions">
            <select class="input-field" [(ngModel)]="selectedTeacherId" (change)="loadTeacherDetails()">
              <option value="">اختر الأستاذ</option>
              <option *ngFor="let t of teachersList" [value]="t._id">{{ t.name }}</option>
            </select>
            <input type="month" class="input-field" [(ngModel)]="teacherDetailsMonth" (change)="loadTeacherDetails()" />
          </div>
        </div>

        <ng-container *ngIf="teacherPaymentDetails">
          <div class="teacher-profile-header">
            <div class="teacher-avatar"><svg class="icon"><use href="#icon-user-tie"></use></svg></div>
            <div class="teacher-info">
              <h3>{{ teacherPaymentDetails.teacher.name }}</h3>
              <p>{{ teacherPaymentDetails.teacher.subjects?.join(' • ') }}</p>
              <p>نسبة العمولة: {{ teacherPaymentDetails.teacher.salaryPercentage || 70 }}%</p>
            </div>
          </div>

          <div class="cards-grid four">
            <div class="stat-card stat-neutral">
              <span class="stat-label">إجمالي العمولات</span>
              <span class="stat-value">{{ teacherPaymentDetails.summary.totalAmount | number:'1.0-0' }}</span>
            </div>
            <div class="stat-card stat-income">
              <span class="stat-label">المدفوع</span>
              <span class="stat-value">{{ teacherPaymentDetails.summary.totalPaid | number:'1.0-0' }}</span>
            </div>
            <div class="stat-card stat-expense">
              <span class="stat-label">المتبقي</span>
              <span class="stat-value">{{ teacherPaymentDetails.summary.totalRemaining | number:'1.0-0' }}</span>
            </div>
            <div class="stat-card stat-margin">
              <span class="stat-label">نسبة الربح</span>
              <span class="stat-value">{{ teacherPaymentDetails.summary.profitRate }}%</span>
            </div>
          </div>

          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>الشهر</th>
                  <th>عدد العمولات</th>
                  <th>الإجمالي</th>
                  <th>المدفوع</th>
                  <th>المتبقي</th>
                  <th>عدد الطلاب</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let month of teacherPaymentDetails.byMonth">
                  <td data-label="الشهر">{{ month.month }}</td>
                  <td data-label="عدد العمولات">{{ month.commissionCount }}</td>
                  <td data-label="الإجمالي">{{ month.totalAmount | number:'1.0-0' }}</td>
                  <td data-label="المدفوع">{{ month.totalPaid | number:'1.0-0' }}</td>
                  <td data-label="المتبقي">{{ month.totalRemaining | number:'1.0-0' }}</td>
                  <td data-label="عدد الطلاب">{{ month.studentsCount }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="teacher-commissions-list">
            <h4>سجل العمولات</h4>
            <div class="list-card" *ngFor="let c of teacherPaymentDetails.commissions">
              <div class="list-card-body">
                <span class="list-card-title">{{ c.class?.name }}</span>
                <span class="list-card-sub">الشهر: {{ c.month }} &middot; الحالة: <span class="badge" [ngClass]="'badge-' + c.status">{{ c.status }}</span></span>
              </div>
              <span class="list-card-amount">{{ c.totalAmount | number:'1.0-0' }}</span>
            </div>
          </div>
        </ng-container>
        <p class="empty-hint" *ngIf="!teacherPaymentDetails && !isLoadingTeacherDetails">اختر أستاذا لعرض تفاصيله</p>
      </section>

    </main>
  </div>

  <!-- ==================== المودالات ==================== -->

  <!-- مودال معاملة سريعة -->
  <div class="modal-overlay" *ngIf="showTransactionModal" (click)="closeTransactionModal()">
    <div class="modal-box" (click)="$event.stopPropagation()">
      <h3 class="modal-title">إضافة معاملة</h3>
      <label class="field-label">النوع</label>
      <select class="input-field" [(ngModel)]="newTx.type">
        <option value="income">إيراد</option>
        <option value="expense">مصروف</option>
      </select>
      <label class="field-label">المبلغ</label>
      <input type="number" class="input-field" [(ngModel)]="newTx.amount" />
      <label class="field-label">الوصف</label>
      <input type="text" class="input-field" [(ngModel)]="newTx.description" />
      <label class="field-label">التاريخ</label>
      <input type="date" class="input-field" [(ngModel)]="newTx.date" />
      <div class="modal-actions">
        <button class="btn btn-primary" (click)="submitTransaction()" [disabled]="isSubmittingTx">
          {{ isSubmittingTx ? 'جارٍ الحفظ...' : 'حفظ' }}
        </button>
        <button class="btn btn-outline" (click)="closeTransactionModal()">إلغاء</button>
      </div>
    </div>
  </div>

  <!-- مودال إضافة دفعة -->
  <div class="modal-overlay" *ngIf="showPaymentModal" (click)="closePaymentModal()">
    <div class="modal-box" (click)="$event.stopPropagation()">
      <h3 class="modal-title">إضافة دفعة</h3>
      <label class="field-label">الطالب</label>
      <select class="input-field" [(ngModel)]="newPayment.studentId">
        <option value="">اختر الطالب</option>
        <option *ngFor="let s of studentsList" [value]="s._id">{{ s.name }}</option>
      </select>
      <label class="field-label">الحصة</label>
      <select class="input-field" [(ngModel)]="newPayment.classId">
        <option value="">اختر الحصة</option>
        <option *ngFor="let c of classesList" [value]="c._id">{{ c.name }}</option>
      </select>
      <label class="field-label">المبلغ</label>
      <input type="number" class="input-field" [(ngModel)]="newPayment.amount" />
      <label class="field-label">الشهر</label>
      <input type="month" class="input-field" [(ngModel)]="newPayment.month" />
      <label class="field-label">طريقة الدفع</label>
      <select class="input-field" [(ngModel)]="newPayment.paymentMethod">
        <option value="cash">نقدا</option>
        <option value="bank_transfer">تحويل بنكي</option>
        <option value="other">أخرى</option>
      </select>
      <div class="modal-actions">
        <button class="btn btn-primary" (click)="submitPayment()" [disabled]="isSubmittingPayment">
          {{ isSubmittingPayment ? 'جارٍ الحفظ...' : 'حفظ' }}
        </button>
        <button class="btn btn-outline" (click)="closePaymentModal()">إلغاء</button>
      </div>
    </div>
  </div>

  <!-- مودال إضافة مصروف -->
  <div class="modal-overlay" *ngIf="showExpenseModal" (click)="closeExpenseModal()">
    <div class="modal-box" (click)="$event.stopPropagation()">
      <h3 class="modal-title">إضافة مصروف</h3>
      <label class="field-label">الوصف</label>
      <input type="text" class="input-field" [(ngModel)]="newExpense.description" />
      <label class="field-label">المبلغ</label>
      <input type="number" class="input-field" [(ngModel)]="newExpense.amount" />
      <label class="field-label">الفئة</label>
      <select class="input-field" [(ngModel)]="newExpense.category">
        <option value="rent">إيجار</option>
        <option value="utilities">مرافق</option>
        <option value="supplies">مستلزمات</option>
        <option value="salary">رواتب</option>
        <option value="other">أخرى</option>
      </select>
      <label class="field-label">التاريخ</label>
      <input type="date" class="input-field" [(ngModel)]="newExpense.date" />
      <div class="modal-actions">
        <button class="btn btn-primary" (click)="submitExpense()" [disabled]="isSubmittingExpense">
          {{ isSubmittingExpense ? 'جارٍ الحفظ...' : 'حفظ' }}
        </button>
        <button class="btn btn-outline" (click)="closeExpenseModal()">إلغاء</button>
      </div>
    </div>
  </div>

  <!-- مودال إنشاء العمولات المتعددة (Bulk) -->
  <div class="modal-overlay" *ngIf="showBulkCommissionModal" (click)="closeBulkCommissionModal()">
    <div class="modal-box modal-box-lg" (click)="$event.stopPropagation()">
      <h3 class="modal-title">إنشاء عمولات الشهر</h3>
      <p class="modal-hint">اختر الحصص التي تريد إنشاء عمولات لها. يمكنك تعديل نسبة كل أستاذ قبل الإنشاء.</p>

      <div class="loading-row" *ngIf="isLoadingAvailableCommissions">جارٍ تحميل الحصص المتاحة...</div>

      <div *ngIf="!isLoadingAvailableCommissions">
        <div class="bulk-commission-controls">
          <button class="btn btn-sm btn-outline" (click)="selectAllAvailableCommissions()">تحديد الكل</button>
          <button class="btn btn-sm btn-outline" (click)="deselectAllAvailableCommissions()">إلغاء التحديد</button>
          <span class="selected-count">المحدد: {{ selectedAvailableCommissions.length }}</span>
        </div>

        <div class="available-commission-item" *ngFor="let item of availableCommissions; let i = index">
          <div class="commission-select">
            <input type="checkbox" [(ngModel)]="item.selected" (change)="updateSelectedCommissions()" />
          </div>
          <div class="commission-info">
            <span class="commission-class">{{ item.className }}</span>
            <span class="commission-teacher">{{ item.teacherName }}</span>
            <span class="commission-students">{{ item.studentsCount }} طالب</span>
          </div>
          <div class="commission-percentage">
            <label>نسبة العمولة:</label>
            <input type="number" class="input-field input-sm" [(ngModel)]="item.teacherPercentage" min="0" max="100" (change)="updateCommissionTotal(item)" />
            <span>%</span>
          </div>
          <div class="commission-total">
            <span>{{ item.totalAmount | number:'1.0-0' }}</span>
          </div>
        </div>
      </div>

      <div class="modal-actions">
        <button class="btn btn-primary" (click)="submitBulkCommissions()" [disabled]="isSubmittingBulk || selectedAvailableCommissions.length === 0">
          {{ isSubmittingBulk ? 'جارٍ الإنشاء...' : 'إنشاء العمولات' }}
        </button>
        <button class="btn btn-outline" (click)="closeBulkCommissionModal()">إلغاء</button>
      </div>
    </div>
  </div>

  <!-- مودال تفاصيل العمولة -->
  <div class="modal-overlay" *ngIf="showCommissionDetailsModal" (click)="closeCommissionDetailsModal()">
    <div class="modal-box modal-box-lg" (click)="$event.stopPropagation()">
      <h3 class="modal-title">تفاصيل العمولة</h3>
      <div class="loading-row" *ngIf="commissionDetailsLoading">جارٍ التحميل...</div>

      <ng-container *ngIf="commissionDetails && !commissionDetailsLoading">
        <div class="commission-summary-strip">
          <span>الأستاذ: {{ commissionDetails.commission?.teacher?.name }}</span>
          <span>الحصة: {{ commissionDetails.commission?.class?.name }}</span>
          <span>الإجمالي: {{ commissionDetails.commission?.totalAmount | number:'1.0-0' }}</span>
          <span>الحالة: <span class="badge" [ngClass]="'badge-' + commissionDetails.commission?.status">{{ commissionDetails.commission?.status }}</span></span>
        </div>

        <div class="bulk-percentage-bar">
          <span class="bulk-percentage-label">تطبيق نسبة موحدة على كل الطلاب:</span>
          <button class="btn btn-sm btn-primary" (click)="openBulkPercentageModal()"><svg class="icon"><use href="#icon-target"></use></svg> تحديد النسبة تلقائيا</button>
          <button class="btn btn-sm btn-danger" (click)="cancelCommission(commissionDetails.commission?._id)" *ngIf="commissionDetails.commission?.status !== 'cancelled' && commissionDetails.commission?.status !== 'paid'">
            <svg class="icon"><use href="#icon-trash"></use></svg> إلغاء العمولة
          </button>
        </div>

        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>الطالب</th>
                <th>المبلغ الأساسي</th>
                <th>حصة الأستاذ</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let st of commissionDetails.students">
                <td data-label="الطالب">{{ st.name || st.student?.name }}</td>
                <td data-label="المبلغ الأساسي">{{ (st.amount ?? st.totalAmount ?? 0) | number:'1.0-0' }}</td>
                <td data-label="حصة الأستاذ">{{ st.teacherShare | number:'1.0-0' }}</td>
                <td data-label="إجراءات" class="table-actions">
                  <button class="btn btn-xs btn-outline" (click)="openStudentShareModal(st)"><svg class="icon"><use href="#icon-pencil"></use></svg> تعديل يدوي</button>
                  <button class="btn btn-xs btn-outline" (click)="openStudentAttendanceFromCommission(st)"><svg class="icon"><use href="#icon-calendar"></use></svg> الحضور</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="modal-actions">
          <button class="btn btn-success" (click)="payCommission(commissionDetails.commission?._id)" *ngIf="commissionDetails.commission?.status !== 'paid' && commissionDetails.commission?.status !== 'cancelled'">
            <svg class="icon"><use href="#icon-cash"></use></svg> دفع العمولة
          </button>
          <button class="btn btn-accent" (click)="generateInvoice(commissionDetails)"><svg class="icon"><use href="#icon-receipt"></use></svg> إنشاء فاتورة احترافية</button>
          <button class="btn btn-outline" (click)="closeCommissionDetailsModal()">إغلاق</button>
        </div>
      </ng-container>
    </div>
  </div>

  <!-- مودال تحديد النسبة تلقائيا لكل الطلاب -->
  <div class="modal-overlay" *ngIf="showBulkPercentageModal" (click)="closeBulkPercentageModal()">
    <div class="modal-box" (click)="$event.stopPropagation()">
      <h3 class="modal-title">تحديد نسبة الأستاذ لكل الطلاب</h3>
      <p class="modal-hint">سيتم احتساب حصة الأستاذ لكل طالب في هذه العمولة بنفس النسبة تلقائيا، مع إمكانية التعديل اليدوي لاحقا لأي طالب. <strong>لن يتم دفع العمولة تلقائياً.</strong></p>
      <label class="field-label">النسبة (%)</label>
      <input type="number" min="0" max="100" class="input-field" [(ngModel)]="bulkPercentage" />
      <div class="modal-actions">
        <button class="btn btn-primary" (click)="applyBulkPercentage()" [disabled]="isApplyingBulkPercentage">
          {{ isApplyingBulkPercentage ? 'جارٍ التطبيق...' : 'تطبيق على الجميع' }}
        </button>
        <button class="btn btn-outline" (click)="closeBulkPercentageModal()">إلغاء</button>
      </div>
    </div>
  </div>

  <!-- مودال تعديل حصة طالب يدويا -->
  <div class="modal-overlay" *ngIf="showStudentShareModal" (click)="closeStudentShareModal()">
    <div class="modal-box" (click)="$event.stopPropagation()">
      <h3 class="modal-title">تعديل حصة الأستاذ لطالب</h3>
      <label class="field-label">الطالب</label>
      <input type="text" class="input-field" [value]="selectedCommissionStudent?.name || selectedCommissionStudent?.student?.name" disabled />
      <label class="field-label">المبلغ</label>
      <input type="number" class="input-field" [(ngModel)]="studentShareAmount" />
      <label class="field-label">السبب (اختياري)</label>
      <input type="text" class="input-field" [(ngModel)]="studentShareReason" />
      <div class="modal-actions">
        <button class="btn btn-primary" (click)="submitStudentShare()">حفظ</button>
        <button class="btn btn-outline" (click)="closeStudentShareModal()">إلغاء</button>
      </div>
    </div>
  </div>

  <!-- مودال حضور طالب من العمولة -->
  <div class="modal-overlay" *ngIf="showCommissionStudentAttendanceModal" (click)="closeCommissionStudentAttendanceModal()">
    <div class="modal-box modal-box-lg" (click)="$event.stopPropagation()">
      <h3 class="modal-title">حضور {{ selectedCommissionStudent?.name || selectedCommissionStudent?.student?.name }}</h3>
      <div class="attendance-grid">
        <div class="attendance-day" *ngFor="let d of getCommissionStudentAttendanceDates(selectedCommissionStudent)">
          <span class="attendance-date">{{ d.date }} ({{ d.dayName }})</span>
          <div class="attendance-status-buttons">
            <button class="btn btn-xs" [class.btn-success]="d.status === 'present'" [class.btn-outline]="d.status !== 'present'"
              (click)="updateCommissionAttendance(selectedCommissionStudent._id, d.date, 'present')"><svg class="icon"><use href="#icon-check-circle"></use></svg> حاضر</button>
            <button class="btn btn-xs" [class.btn-warning]="d.status === 'late'" [class.btn-outline]="d.status !== 'late'"
              (click)="updateCommissionAttendance(selectedCommissionStudent._id, d.date, 'late')"><svg class="icon"><use href="#icon-clock"></use></svg> متأخر</button>
            <button class="btn btn-xs" [class.btn-danger]="d.status === 'absent'" [class.btn-outline]="d.status !== 'absent'"
              (click)="updateCommissionAttendance(selectedCommissionStudent._id, d.date, 'absent')"><svg class="icon"><use href="#icon-x-circle"></use></svg> غائب</button>
          </div>
        </div>
      </div>
      <div class="modal-actions">
        <button class="btn btn-outline" (click)="closeCommissionStudentAttendanceModal()">إغلاق</button>
      </div>
    </div>
  </div>

  <!-- مودال تعديل الدفع لطالب -->
  <div class="modal-overlay" *ngIf="showPaymentAdjustModal" (click)="closePaymentAdjustModal()">
    <div class="modal-box" (click)="$event.stopPropagation()">
      <h3 class="modal-title">تعديل دفع {{ selectedStudent?.name }}</h3>
      <label class="field-label">المبلغ الإجمالي الجديد</label>
      <input type="number" class="input-field" [(ngModel)]="adjustedAmount" />
      <label class="field-label">السبب (اختياري)</label>
      <input type="text" class="input-field" [(ngModel)]="adjustReason" />
      <div class="modal-actions">
        <button class="btn btn-primary" (click)="submitPaymentAdjust()">حفظ</button>
        <button class="btn btn-outline" (click)="closePaymentAdjustModal()">إلغاء</button>
      </div>
    </div>
  </div>

  <!-- مودال نسبة الأستاذ للحصة -->
  <div class="modal-overlay" *ngIf="showTeacherPercentageModal" (click)="closeTeacherPercentageModal()">
    <div class="modal-box" (click)="$event.stopPropagation()">
      <h3 class="modal-title">تعديل نسبة الأستاذ</h3>
      <label class="field-label">النسبة (%)</label>
      <input type="number" min="0" max="100" class="input-field" [(ngModel)]="newTeacherPercentage" />
      <div class="modal-actions">
        <button class="btn btn-primary" (click)="submitTeacherPercentage()">حفظ</button>
        <button class="btn btn-outline" (click)="closeTeacherPercentageModal()">إلغاء</button>
      </div>
    </div>
  </div>

  <!-- مودال حضور طالب -->
  <div class="modal-overlay" *ngIf="showStudentAttendanceModal" (click)="closeStudentAttendanceModal()">
    <div class="modal-box modal-box-lg" (click)="$event.stopPropagation()">
      <h3 class="modal-title">حضور {{ selectedStudent?.name }}</h3>
      <div class="attendance-grid">
        <div class="attendance-day" *ngFor="let d of getStudentAttendanceDates(selectedStudent)">
          <span class="attendance-date">{{ d.date }} ({{ d.dayName }})</span>
          <div class="attendance-status-buttons">
            <button class="btn btn-xs" [class.btn-success]="d.status === 'present'" [class.btn-outline]="d.status !== 'present'"
              (click)="updateAttendance(selectedStudent!._id, d.date, 'present')"><svg class="icon"><use href="#icon-check-circle"></use></svg> حاضر</button>
            <button class="btn btn-xs" [class.btn-warning]="d.status === 'late'" [class.btn-outline]="d.status !== 'late'"
              (click)="updateAttendance(selectedStudent!._id, d.date, 'late')"><svg class="icon"><use href="#icon-clock"></use></svg> متأخر</button>
            <button class="btn btn-xs" [class.btn-danger]="d.status === 'absent'" [class.btn-outline]="d.status !== 'absent'"
              (click)="updateAttendance(selectedStudent!._id, d.date, 'absent')"><svg class="icon"><use href="#icon-x-circle"></use></svg> غائب</button>
          </div>
        </div>
      </div>
      <div class="modal-actions">
        <button class="btn btn-outline" (click)="closeStudentAttendanceModal()">إغلاق</button>
      </div>
    </div>
  </div>

  <!-- ================================================================ -->
  <!-- ===== مودال الفاتورة الاحترافية (مستقلة للطباعة) ===== -->
  <!-- ================================================================ -->
  <div class="modal-overlay" *ngIf="showInvoiceModal" (click)="closeInvoiceModal()">
    <div class="modal-box modal-box-lg invoice-modal" (click)="$event.stopPropagation()">
      
      <!-- ===== محتوى الفاتورة القابل للطباعة ===== -->
      <div class="invoice-print-area" id="invoicePrintArea" *ngIf="invoiceData as inv">
        
        <!-- ===== هيدر الفاتورة المحترف ===== -->
        <div class="invoice-header">
          <!-- الصف العلوي: المدرسة + رقم الفاتورة -->
          <div class="invoice-header-row">
            <div class="school-brand">
              <div class="school-brand-icon">
                  <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="3" y="5" width="26" height="22" rx="4" stroke="currentColor" stroke-width="1.6"/>
                    <path d="M10 12L16 7L22 12V21H10V12Z" stroke="currentColor" stroke-width="1.4"/>
                    <circle cx="16" cy="17" r="2" stroke="currentColor" stroke-width="1.2"/>
                    <path d="M13 21L16 24L19 21" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
                  </svg>
              </div>
              <div class="school-brand-text">
                <h2>{{ inv.school?.name || 'المؤسسة التعليمية' }}</h2>
                <span class="school-brand-sub">Redox Accounting MR-AC 1</span>
              </div>
            </div>
            <div class="invoice-id">
              <div class="invoice-id-label">فاتورة عمولة</div>
              <div class="invoice-id-number">
                <span class="id-prefix">#</span>
                <span>{{ inv.invoiceNumber }}</span>
              </div>
              <div class="invoice-id-date">{{ inv.date }}</div>
            </div>
          </div>

          <!-- الفاصل الأنعم -->
          <div class="invoice-divider-clean"></div>

          <!-- الصف السفلي: معلومات أساسية -->
          <div class="invoice-info-grid">
            <div class="info-item">
              <svg class="info-icon" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="10" cy="6" r="3.5" stroke="currentColor" stroke-width="1.4"/>
                <path d="M3 16.5C3 13.5 6 11.5 10 11.5C14 11.5 17 13.5 17 16.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
              </svg>
              <div>
                <span class="info-label">الأستاذ</span>
                <span class="info-value">{{ inv.teacher?.name }}</span>
              </div>
            </div>
            <div class="info-item">
              <svg class="info-icon" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="4" width="14" height="12" rx="1.5" stroke="currentColor" stroke-width="1.4"/>
                <path d="M3 8H17" stroke="currentColor" stroke-width="1.2"/>
                <path d="M7 11H11" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
              </svg>
              <div>
                <span class="info-label">الحصة</span>
                <span class="info-value">{{ inv.class?.name }}</span>
              </div>
            </div>
            <div class="info-item">
              <svg class="info-icon" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="4.5" width="14" height="12" rx="1.5" stroke="currentColor" stroke-width="1.4"/>
                <path d="M3 8H17" stroke="currentColor" stroke-width="1.2"/>
                <path d="M6 3V6" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
                <path d="M14 3V6" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
              </svg>
              <div>
                <span class="info-label">الشهر</span>
                <span class="info-value">{{ inv.month }}</span>
              </div>
            </div>
            <div class="info-item">
              <svg class="info-icon" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="10" cy="10" r="7" stroke="currentColor" stroke-width="1.4"/>
                <path d="M10 6V10L12.5 12" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
              </svg>
              <div>
                <span class="info-label">الحالة</span>
                <span class="info-status" [class.status-paid]="inv.status === 'paid'" [class.status-pending]="inv.status !== 'paid'">
                  <span class="status-dot"></span>
                  {{ inv.statusText }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- عدد الحصص -->
        <div class="sessions-banner">
          📚 عدد الحصص في الشهر: <strong>{{ inv.totalSessions }}</strong>
        </div>

        <!-- جدول الطلاب -->
        <table class="invoice-table">
          <thead>
            <tr>
              <th>#</th>
              <th>الطالب</th>
              <th>عدد الحصص</th>
              <th>نسبة الحضور</th>
              <th>حصة الأستاذ</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let s of inv.students; let i = index">
              <td>{{ i + 1 }}</td>
              <td class="student-name">{{ s.name }}</td>
              <td class="sessions-cell">{{ s.sessions }}</td>
              <td class="attendance-cell">
                <span class="attendance-rate" [class.high]="s.attendanceRate >= 80" [class.medium]="s.attendanceRate >= 50 && s.attendanceRate < 80" [class.low]="s.attendanceRate < 50">
                  {{ s.attendanceRate }}%
                </span>
              </td>
              <td class="amount-cell">{{ s.teacherShare | number:'1.0-0' }}</td>
            </tr>
          </tbody>
        </table>

        <!-- الإجماليات -->
        <div class="invoice-totals">
          <div class="total-row"><span>الإجمالي المستحق</span><span>{{ inv.totalAmount | number:'1.0-0' }}</span></div>
          <div class="total-row"><span>المدفوع</span><span>{{ inv.totalPaid | number:'1.0-0' }}</span></div>
          <div class="total-row final"><span>المتبقي</span><span>{{ inv.remainingAmount | number:'1.0-0' }}</span></div>
        </div>

        <!-- تذييل -->
        <div class="invoice-footer">
          <p>تم إصدار هذه الفاتورة إلكترونياً عبر النظام المحاسبي لـ {{ inv.school?.name || 'المؤسسة التعليمية' }}</p>
          <div class="signature-line">
            <span>توقيع الإدارة</span>
            <span>توقيع الأستاذ</span>
          </div>
        </div>
      </div>

      <!-- أزرار التحكم (تظهر فقط في الواجهة، وتختفي عند الطباعة) -->
      <div class="modal-actions no-print">
        <button class="btn btn-primary" (click)="printInvoice()">
          <svg class="icon"><use href="#icon-printer"></use></svg> طباعة الفاتورة
        </button>
        <button class="btn btn-outline" (click)="closeInvoiceModal()">إغلاق</button>
      </div>
    </div>
  </div>

</div>
  `,
  styles: [`
    /* ================================================================ */
    /* ===== الأنماط الأساسية ===== */
    /* ================================================================ */

    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@700;800;900&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap');

    :host {
      --ink: #10192b;
      --ink-2: #1c2942;
      --paper: #f6f3ea;
      --surface: #ffffff;
      --surface-alt: #f2ede0;
      --text: #1b2436;
      --text-muted: #6b6357;
      --border: #e5ddc9;
      --brass: #a97a3c;
      --brass-deep: #86602c;
      --brass-light: #cf9f5e;
      --brass-tint: #f5ead6;
      --emerald: #1f6f56;
      --emerald-tint: #e2efe8;
      --rose: #a8434a;
      --rose-tint: #f5e5e4;
      --amber: #b1802b;
      --amber-tint: #f6ecd8;
      --success: var(--emerald);
      --danger: var(--rose);
      --warning: var(--amber);
      --radius: 14px;
      --radius-lg: 20px;
      --shadow: 0 3px 14px rgba(16, 25, 43, 0.06);
      --shadow-lg: 0 24px 60px rgba(16, 25, 43, 0.22);
      display: block;
      direction: rtl;
      font-family: 'IBM Plex Sans Arabic', -apple-system, BlinkMacSystemFont, sans-serif;
      color: var(--text);
      background: var(--paper);
      min-height: 100vh;
    }

    * { box-sizing: border-box; }
    .icon { width: 17px; height: 17px; stroke: currentColor; fill: none; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; flex-shrink: 0; vertical-align: -3px; }

    /* ================================================================ */
    /* ===== شاشة الرمز السري ===== */
    /* ================================================================ */

    .gate-screen {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: hidden;
      background: radial-gradient(circle at 20% 0%, #223252 0%, var(--ink) 55%, #0a1120 100%);
      padding: 24px;
    }
    .gate-ledger-lines {
      position: absolute; inset: 0; pointer-events: none;
      background-image: repeating-linear-gradient(180deg, rgba(207,159,94,0.05) 0px, rgba(207,159,94,0.05) 1px, transparent 1px, transparent 42px);
    }
    .gate-glow {
      position: absolute; width: 520px; height: 520px; border-radius: 50%;
      background: radial-gradient(circle, rgba(207,159,94,0.20) 0%, transparent 70%);
      top: 50%; left: 50%; transform: translate(-50%, -50%);
      pointer-events: none;
    }
    .gate-card {
      position: relative;
      background: var(--surface);
      border-radius: var(--radius-lg);
      padding: 44px 34px 36px;
      max-width: 400px;
      width: 100%;
      text-align: center;
      box-shadow: var(--shadow-lg);
      border: 1px solid rgba(207,159,94,0.25);
      animation: gate-in .5s cubic-bezier(.2,.8,.2,1);
      transition: transform .4s ease, opacity .4s ease;
    }
    .gate-card-unlocking { transform: scale(0.98); opacity: 0.85; }
    @keyframes gate-in { from { opacity: 0; transform: translateY(18px) scale(.98); } to { opacity: 1; transform: translateY(0) scale(1); } }

    .gate-seal { position: relative; width: 74px; height: 74px; margin: 0 auto 18px; display: flex; align-items: center; justify-content: center; }
    .gate-seal-ring { position: absolute; inset: 0; border-radius: 50%; border: 1.5px solid var(--brass-light); opacity: .55; }
    .gate-seal-ring-2 { inset: 9px; border-style: dashed; opacity: .4; }
    .gate-seal-icon { width: 26px; height: 26px; color: var(--brass-deep); position: relative; z-index: 1; }
    .gate-seal::before {
      content: ''; position: absolute; inset: -2px; border-radius: 50%;
      background: linear-gradient(135deg, var(--brass-tint), var(--surface));
    }
    .gate-seal-spin .gate-seal-ring { animation: seal-spin 1.1s linear infinite; }
    .gate-seal-spin .gate-seal-ring-2 { animation: seal-spin-rev .9s linear infinite; }
    @keyframes seal-spin { to { transform: rotate(360deg); } }
    @keyframes seal-spin-rev { to { transform: rotate(-360deg); } }

    .gate-eyebrow { font-size: 11px; letter-spacing: 2px; color: var(--brass-deep); font-weight: 700; margin: 0 0 6px; text-transform: uppercase; }
    .gate-title { font-family: 'Cairo', sans-serif; font-size: 24px; font-weight: 900; margin: 0 0 6px; color: var(--ink); }
    .gate-subtitle { font-size: 13.5px; color: var(--text-muted); margin: 0 0 26px; }
    .gate-input-wrap { margin-bottom: 8px; }
    .gate-input {
      width: 100%;
      padding: 15px 16px;
      font-size: 22px;
      letter-spacing: 8px;
      text-align: center;
      border: 1.5px solid var(--border);
      border-radius: 12px;
      outline: none;
      transition: border-color .2s, box-shadow .2s;
      font-family: inherit;
      background: var(--surface-alt);
      color: var(--ink);
    }
    .gate-input:focus { border-color: var(--brass); box-shadow: 0 0 0 4px var(--brass-tint); }
    .gate-input-error { border-color: var(--rose); animation: shake .3s; }
    @keyframes shake { 0%,100%{transform:translateX(0);} 25%{transform:translateX(-6px);} 75%{transform:translateX(6px);} }
    .gate-error { color: var(--rose); font-size: 12.5px; margin: 8px 0 4px; font-weight: 600; }
    .gate-btn {
      width: 100%;
      padding: 15px;
      background: linear-gradient(135deg, var(--brass), var(--brass-deep));
      color: #fff;
      border: none;
      border-radius: 12px;
      font-size: 15px;
      font-weight: 700;
      font-family: inherit;
      cursor: pointer;
      transition: filter .2s, transform .1s;
      margin-top: 18px;
      box-shadow: 0 10px 24px rgba(169,122,60,0.35);
    }
    .gate-btn:hover:not(:disabled) { filter: brightness(1.06); }
    .gate-btn:active:not(:disabled) { transform: scale(0.98); }
    .gate-btn:disabled { opacity: .75; cursor: default; }
    .gate-back {
      width: 100%;
      background: none;
      border: none;
      color: var(--text-muted);
      font-family: inherit;
      font-size: 12.5px;
      margin-top: 16px;
      cursor: pointer;
      text-decoration: underline;
    }

    /* ================================================================ */
    /* ===== الهيكل العام ===== */
    /* ================================================================ */

    .app-shell { min-height: 100vh; display: flex; flex-direction: column; }

    .app-header {
      background: var(--surface);
      border-bottom: 1px solid var(--border);
      padding: 13px 22px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: sticky;
      top: 0;
      z-index: 30;
      box-shadow: var(--shadow);
    }
    .header-left, .header-right { display: flex; align-items: center; gap: 10px; }
    .brand { display: flex; align-items: center; gap: 11px; }
    .brand-mark {
      width: 40px; height: 40px; border-radius: 11px;
      background: linear-gradient(135deg, var(--ink), var(--ink-2));
      display: flex; align-items: center; justify-content: center;
      color: var(--brass-light);
    }
    .brand-mark .icon { width: 19px; height: 19px; }
    .brand-text { display: flex; flex-direction: column; line-height: 1.3; }
    .brand-title { font-family: 'Cairo', sans-serif; font-weight: 800; font-size: 15.5px; color: var(--ink); }
    .brand-sub { font-size: 10.5px; color: var(--text-muted); letter-spacing: .3px; }
    .icon-btn {
      width: 38px; height: 38px; border-radius: 10px; border: 1px solid var(--border);
      background: var(--surface-alt); cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: background .15s, border-color .15s; color: var(--ink);
    }
    .icon-btn:hover { background: var(--border); }
    .icon-btn-accent { background: var(--ink); color: var(--brass-light); border-color: var(--ink); }
    .icon-btn-accent:hover { background: var(--ink-2); }
    .back-btn { color: var(--brass-deep); }
    .hamburger { display: none; flex-direction: column; gap: 4px; }
    .hamburger span { width: 17px; height: 2px; background: var(--ink); border-radius: 2px; }

    .app-body { display: flex; flex: 1; min-height: 0; }

    /* ================================================================ */
    /* ===== التنقل الجانبي ===== */
    /* ================================================================ */

    .side-nav {
      width: 226px;
      flex-shrink: 0;
      background: var(--surface);
      border-inline-end: 1px solid var(--border);
      padding: 16px 10px;
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    .side-nav-head { display: none; }
    .nav-item {
      display: flex; align-items: center; gap: 11px;
      padding: 11px 14px; border-radius: 10px; border: none;
      background: transparent; cursor: pointer; font-family: inherit;
      font-size: 13.5px; font-weight: 600; color: var(--text-muted); text-align: right;
      transition: background .15s, color .15s;
    }
    .nav-item:hover { background: var(--surface-alt); color: var(--ink); }
    .nav-item-active { background: var(--ink); color: #fff; }
    .nav-item-active .nav-icon { color: var(--brass-light); }
    .nav-icon { display: flex; color: var(--brass-deep); }
    .nav-overlay { display: none; }

    .app-content { flex: 1; padding: 22px; min-width: 0; }

    .tab-panel { animation: fade-in .25s ease; }
    @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }

    .panel-toolbar {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 18px; gap: 12px; flex-wrap: wrap;
    }
    .panel-toolbar.wrap { align-items: flex-start; }
    .panel-title { font-family: 'Cairo', sans-serif; font-size: 21px; font-weight: 800; margin: 0; color: var(--ink); }
    .panel-subtitle { font-size: 15.5px; font-weight: 700; margin: 0; color: var(--ink); }
    .toolbar-actions { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }

    .search-field { position: relative; display: flex; align-items: center; }
    .search-field .icon { position: absolute; right: 11px; color: var(--text-muted); }
    .search-field .input-field { padding-right: 34px; }

    .input-field {
      padding: 9px 13px; border: 1px solid var(--border); border-radius: 9px;
      font-family: inherit; font-size: 13px; background: var(--surface);
      color: var(--text); outline: none; transition: border-color .15s, box-shadow .15s;
    }
    .input-field:focus { border-color: var(--brass); box-shadow: 0 0 0 3px var(--brass-tint); }
    .input-sm { padding: 4px 8px; font-size: 12px; width: 62px; }
    .field-label { display: block; font-size: 12px; color: var(--text-muted); margin: 12px 0 5px; font-weight: 600; }

    /* ================================================================ */
    /* ===== الأزرار ===== */
    /* ================================================================ */

    .btn {
      padding: 9px 16px; border-radius: 9px; border: none; font-family: inherit;
      font-weight: 700; font-size: 13px; cursor: pointer; transition: filter .15s, transform .1s, opacity .15s;
      display: inline-flex; align-items: center; gap: 6px;
    }
    .btn:active { transform: scale(0.97); }
    .btn:disabled { opacity: 0.55; cursor: not-allowed; }
    .btn-primary { background: var(--ink); color: #fff; }
    .btn-primary:hover:not(:disabled) { background: var(--ink-2); }
    .btn-accent { background: linear-gradient(135deg, var(--brass), var(--brass-deep)); color: #fff; }
    .btn-accent:hover:not(:disabled) { filter: brightness(1.06); }
    .btn-success { background: var(--emerald); color: #fff; }
    .btn-success:hover:not(:disabled) { filter: brightness(1.08); }
    .btn-danger { background: var(--rose); color: #fff; }
    .btn-danger:hover:not(:disabled) { filter: brightness(1.08); }
    .btn-warning { background: var(--amber); color: #fff; }
    .btn-outline { background: var(--surface); color: var(--text); border: 1px solid var(--border); }
    .btn-outline:hover { background: var(--surface-alt); }
    .btn-sm { padding: 6px 12px; font-size: 12px; }
    .btn-xs { padding: 5px 10px; font-size: 11px; border-radius: 7px; }

    /* ================================================================ */
    /* ===== البطاقات والإحصائيات ===== */
    /* ================================================================ */

    .cards-grid {
      display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 22px;
    }
    .cards-grid.four { grid-template-columns: repeat(4, 1fr); }
    .stat-card {
      background: var(--surface); border-radius: var(--radius); padding: 17px;
      display: flex; align-items: center; gap: 13px; box-shadow: var(--shadow);
      border: 1px solid var(--border);
    }
    .stat-icon {
      width: 42px; height: 42px; border-radius: 11px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      background: var(--surface-alt); color: var(--ink);
    }
    .stat-icon .icon { width: 19px; height: 19px; }
    .stat-body { display: flex; flex-direction: column; gap: 3px; }
    .stat-label { font-size: 11.5px; color: var(--text-muted); font-weight: 600; }
    .stat-value { font-family: 'Cairo', sans-serif; font-size: 20px; font-weight: 800; font-variant-numeric: tabular-nums; color: var(--ink); }
    .stat-income .stat-icon { background: var(--emerald-tint); color: var(--emerald); }
    .stat-income .stat-value, .income-icon { color: var(--emerald); }
    .stat-expense .stat-icon { background: var(--rose-tint); color: var(--rose); }
    .stat-expense .stat-value, .expense-icon { color: var(--rose); }
    .stat-profit .stat-icon { background: var(--brass-tint); color: var(--brass-deep); }
    .stat-profit .stat-value { color: var(--brass-deep); }
    .stat-margin .stat-icon { background: #eef1f6; color: var(--ink-2); }
    .stat-margin .stat-value { color: var(--ink-2); }
    .stat-neutral { flex-direction: column; align-items: flex-start; gap: 6px; }
    .total-expense-card { margin-bottom: 16px; flex-direction: row; }

    /* ================================================================ */
    /* ===== مستحقات الأساتذة ===== */
    /* ================================================================ */

    .teacher-dues-section {
      background: var(--surface);
      border-radius: var(--radius);
      padding: 18px;
      margin-bottom: 22px;
      border: 1px solid var(--border);
      box-shadow: var(--shadow);
    }
    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 14px;
    }
    .section-title {
      font-family: 'Cairo', sans-serif;
      font-size: 15.5px;
      font-weight: 800;
      margin: 0;
      display: flex; align-items: center; gap: 8px;
      color: var(--ink);
    }
    .section-title .icon { color: var(--brass-deep); }
    .section-badge {
      background: var(--surface-alt);
      padding: 5px 15px;
      border-radius: 20px;
      font-weight: 800;
      font-size: 13.5px;
      color: var(--text-muted);
      font-variant-numeric: tabular-nums;
    }
    .section-badge.has-dues {
      background: var(--amber-tint);
      color: var(--amber);
    }
    .dues-cards-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-bottom: 14px;
    }
    .dues-stat-card {
      background: var(--surface-alt);
      border-radius: 10px;
      padding: 12px;
      text-align: center;
    }
    .dues-stat-label {
      font-size: 11px;
      color: var(--text-muted);
      display: block;
      margin-bottom: 4px;
    }
    .dues-stat-value {
      font-size: 17px;
      font-weight: 800;
      font-variant-numeric: tabular-nums;
      color: var(--ink);
    }
    .dues-stat-value.paid { color: var(--emerald); }
    .dues-stat-value.unpaid { color: var(--rose); }

    .teacher-dues-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .teacher-dues-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 9px 12px;
      background: var(--surface-alt);
      border-radius: 8px;
    }
    .teacher-dues-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .teacher-name {
      font-weight: 700;
      font-size: 13px;
      color: var(--ink);
    }
    .teacher-status {
      font-size: 11px;
      padding: 3px 10px;
      border-radius: 12px;
      font-weight: 700;
    }
    .status-paid { background: var(--emerald-tint); color: var(--emerald); }
    .status-unpaid { background: var(--rose-tint); color: var(--rose); }
    .status-partial { background: var(--amber-tint); color: var(--amber); }
    .teacher-dues-amounts {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .dues-amount {
      font-weight: 800;
      font-size: 14px;
      color: var(--rose);
      font-variant-numeric: tabular-nums;
    }
    .dues-total {
      font-size: 12px;
      color: var(--text-muted);
      font-variant-numeric: tabular-nums;
    }

    /* ================================================================ */
    /* ===== قوائم العناصر ===== */
    /* ================================================================ */

    .list-card {
      display: flex; align-items: center; gap: 12px; background: var(--surface);
      border: 1px solid var(--border); border-radius: 12px; padding: 13px 15px; margin-bottom: 8px;
      box-shadow: var(--shadow);
    }
    .list-card-icon {
      width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center;
      justify-content: center; background: var(--surface-alt); flex-shrink: 0; color: var(--ink);
    }
    .list-card-icon.income-tint { background: var(--emerald-tint); color: var(--emerald); }
    .list-card-icon.expense-tint { background: var(--rose-tint); color: var(--rose); }
    .list-card-body { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; }
    .list-card-title { font-weight: 700; font-size: 13.5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--ink); }
    .list-card-sub { font-size: 11.5px; color: var(--text-muted); }
    .list-card-amount { font-weight: 800; font-size: 15px; white-space: nowrap; font-variant-numeric: tabular-nums; color: var(--ink); }
    .commission-card { flex-wrap: wrap; }
    .commission-amounts { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; }
    .commission-actions { display: flex; gap: 6px; flex-wrap: wrap; }

    .empty-hint { text-align: center; color: var(--text-muted); font-size: 13px; padding: 26px 0; }
    .loading-row { text-align: center; color: var(--text-muted); font-size: 13px; padding: 16px 0; }

    /* ================================================================ */
    /* ===== الشارات ===== */
    /* ================================================================ */

    .badge {
      display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 10.5px; font-weight: 700;
      background: var(--surface-alt); color: var(--text-muted);
    }
    .badge-paid { background: var(--emerald-tint); color: var(--emerald); }
    .badge-pending { background: var(--amber-tint); color: var(--amber); }
    .badge-partial { background: var(--amber-tint); color: var(--amber); }
    .badge-cancelled { background: var(--rose-tint); color: var(--rose); }

    /* ================================================================ */
    /* ===== الجداول ===== */
    /* ================================================================ */

    .table-wrap { overflow-x: auto; background: var(--surface); border-radius: var(--radius); border: 1px solid var(--border); box-shadow: var(--shadow); }
    .data-table { width: 100%; border-collapse: collapse; font-size: 13px; min-width: 480px; }
    .data-table th { text-align: right; padding: 12px 14px; background: var(--surface-alt); font-weight: 700; color: var(--text-muted); font-size: 11.5px; }
    .data-table td { padding: 11px 14px; border-top: 1px solid var(--border); font-variant-numeric: tabular-nums; }
    .table-actions { display: flex; gap: 6px; flex-wrap: wrap; }

    /* ================================================================ */
    /* ===== مودال إنشاء العمولات المتعددة ===== */
    /* ================================================================ */

    .bulk-commission-controls {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 12px;
      flex-wrap: wrap;
    }
    .selected-count {
      font-size: 13px;
      color: var(--text-muted);
      margin-right: auto;
      font-weight: 600;
    }
    .available-commission-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 11px 12px;
      background: var(--surface-alt);
      border-radius: 8px;
      margin-bottom: 6px;
      border: 1px solid var(--border);
    }
    .commission-select { flex-shrink: 0; }
    .commission-select input[type="checkbox"] { width: 18px; height: 18px; cursor: pointer; accent-color: var(--brass); }
    .commission-info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
    .commission-class { font-weight: 700; font-size: 14px; color: var(--ink); }
    .commission-teacher { font-size: 12px; color: var(--text-muted); }
    .commission-students { font-size: 11px; color: var(--text-muted); }
    .commission-percentage { display: flex; align-items: center; gap: 6px; }
    .commission-percentage label { font-size: 12px; color: var(--text-muted); }
    .commission-total { font-weight: 800; font-size: 15px; min-width: 80px; text-align: left; font-variant-numeric: tabular-nums; color: var(--ink); }

    /* ================================================================ */
    /* ===== تفاصيل الأستاذ ===== */
    /* ================================================================ */

    .teacher-profile-header {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 18px;
      background: var(--surface);
      border-radius: var(--radius);
      border: 1px solid var(--border);
      margin-bottom: 18px;
    }
    .teacher-avatar {
      width: 60px; height: 60px;
      display: flex; align-items: center; justify-content: center;
      background: linear-gradient(135deg, var(--ink), var(--ink-2));
      color: var(--brass-light);
      border-radius: 50%;
    }
    .teacher-avatar .icon { width: 26px; height: 26px; }
    .teacher-info h3 { margin: 0 0 4px; font-size: 17px; font-family: 'Cairo', sans-serif; color: var(--ink); }
    .teacher-info p { margin: 2px 0; font-size: 12.5px; color: var(--text-muted); }
    .teacher-commissions-list { margin-top: 18px; }
    .teacher-commissions-list h4 { font-size: 14px; font-weight: 700; margin-bottom: 10px; color: var(--ink); }

    /* ================================================================ */
    /* ===== الرسوم البيانية ===== */
    /* ================================================================ */

    .charts-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 22px; }
    .chart-card { background: var(--surface); border-radius: var(--radius); padding: 17px; box-shadow: var(--shadow); border: 1px solid var(--border); }
    .chart-title { font-size: 13.5px; font-weight: 700; margin: 0 0 10px; color: var(--ink); }
    .chart-canvas-wrap { height: 220px; position: relative; }

    .sub-panel { background: var(--surface); border-radius: var(--radius); padding: 17px; border: 1px solid var(--border); }

    /* ================================================================ */
    /* ===== تفاصيل العمولة ===== */
    /* ================================================================ */

    .commission-summary-strip {
      display: flex; gap: 16px; flex-wrap: wrap; font-size: 13px; color: var(--text-muted);
      margin-bottom: 14px; font-weight: 600;
    }
    .bulk-percentage-bar {
      display: flex; align-items: center; justify-content: space-between; gap: 10px;
      background: var(--brass-tint); border: 1px dashed var(--brass-light);
      border-radius: 10px; padding: 12px 14px; margin-bottom: 14px; flex-wrap: wrap;
    }
    .bulk-percentage-label { font-size: 13px; font-weight: 700; color: var(--brass-deep); }

    /* ================================================================ */
    /* ===== الحضور ===== */
    /* ================================================================ */

    .attendance-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; max-height: 340px; overflow-y: auto; margin: 10px 0; }
    .attendance-day { background: var(--surface-alt); border-radius: 10px; padding: 10px; display: flex; flex-direction: column; gap: 6px; }
    .attendance-date { font-size: 12px; font-weight: 700; color: var(--ink); }
    .attendance-status-buttons { display: flex; gap: 5px; }

    /* ================================================================ */
    /* ===== المودالات ===== */
    /* ================================================================ */

    .modal-overlay {
      position: fixed; inset: 0; background: rgba(16, 25, 43, 0.6);
      display: flex; align-items: center; justify-content: center; z-index: 100; padding: 16px;
      backdrop-filter: blur(3px);
    }
    .modal-box {
      background: var(--surface); border-radius: 18px; padding: 26px; width: 100%; max-width: 420px;
      max-height: 90vh; overflow-y: auto; box-shadow: var(--shadow-lg); animation: gate-in .25s ease;
    }
    .modal-box-lg { max-width: 720px; }
    .modal-title { font-family: 'Cairo', sans-serif; font-size: 17.5px; font-weight: 800; margin: 0 0 6px; color: var(--ink); }
    .modal-hint { font-size: 12px; color: var(--text-muted); margin: 0 0 6px; line-height: 1.6; }
    .modal-actions { display: flex; gap: 10px; margin-top: 18px; flex-wrap: wrap; }

    /* ================================================================ */
    /* ===== الفاتورة الاحترافية ===== */
    /* ================================================================ */

    .invoice-modal .modal-box {
      max-width: 820px;
      padding: 12px 16px;
    }

    .invoice-print-area {
      background: #ffffff;
      padding: 2mm 3mm;
      border-radius: 6px;
      font-family: 'IBM Plex Sans Arabic', 'Cairo', sans-serif;
      color: #1b2436;
      direction: rtl;
    }

    /* ===== هيدر الفاتورة المحترف ===== */
    .invoice-header {
      background: #ffffff;
      border-radius: 8px;
      padding: 18px 20px 14px;
      margin-bottom: 14px;
      border: 1px solid #e8e3d8;
      box-shadow: 0 2px 8px rgba(16, 25, 43, 0.04);
    }

    .invoice-header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 12px;
    }

    .school-brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .school-brand-icon {
      width: 40px;
      height: 40px;
      flex-shrink: 0;
      color: #a97a3c;
      background: #f6f3ea;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .school-brand-icon svg {
      width: 22px;
      height: 22px;
    }

    .school-brand-text h2 {
      font-size: 15px;
      font-weight: 800;
      color: #1b2436;
      margin: 0 0 1px;
      font-family: 'Cairo', sans-serif;
      letter-spacing: -0.2px;
    }

    .school-brand-sub {
      font-size: 9.5px;
      color: #8a8276;
      font-weight: 500;
      letter-spacing: 0.3px;
    }

    .invoice-id {
      text-align: left;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 1px;
    }

    .invoice-id-label {
      font-size: 9px;
      font-weight: 700;
      color: #a97a3c;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      background: #f6f3ea;
      padding: 2px 12px;
      border-radius: 10px;
    }

    .invoice-id-number {
      font-size: 16px;
      font-weight: 800;
      color: #1b2436;
      font-family: 'Cairo', sans-serif;
      letter-spacing: -0.5px;
    }

    .invoice-id-number .id-prefix {
      color: #a97a3c;
      font-weight: 700;
    }

    .invoice-id-date {
      font-size: 10px;
      color: #8a8276;
      font-weight: 500;
    }

    .invoice-divider-clean {
      height: 1px;
      background: linear-gradient(to right, transparent, #e8e3d8 20%, #e8e3d8 80%, transparent);
      margin: 10px 0 12px;
    }

    .invoice-info-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 4px;
    }

    .info-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 6px 10px;
      border-radius: 6px;
      background: #faf9f6;
      border: 1px solid #f0ebe2;
    }

    .info-icon {
      width: 18px;
      height: 18px;
      flex-shrink: 0;
      color: #8a8276;
      stroke: currentColor;
      fill: none;
      stroke-width: 1.6;
    }

    .info-item div {
      display: flex;
      flex-direction: column;
      line-height: 1.2;
      min-width: 0;
    }

    .info-label {
      font-size: 8.5px;
      font-weight: 600;
      color: #8a8276;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }

    .info-value {
      font-size: 11px;
      font-weight: 700;
      color: #1b2436;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .info-status {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      font-weight: 700;
      padding: 1px 0;
    }

    .status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      display: inline-block;
      flex-shrink: 0;
    }

    .status-paid {
      color: #1f6f56;
    }

    .status-paid .status-dot {
      background: #1f6f56;
    }

    .status-pending {
      color: #b1802b;
    }

    .status-pending .status-dot {
      background: #b1802b;
    }

    /* ===== عدد الحصص ===== */
    .sessions-banner {
      text-align: center;
      background: linear-gradient(135deg, #f5ead6, #f6f3ea);
      border: 1.5px solid #a97a3c;
      border-radius: 6px;
      padding: 3px 0;
      margin-bottom: 5px;
      font-size: 12px;
      font-weight: 700;
      color: #86602c;
    }

    .sessions-banner strong {
      font-size: 18px;
      color: #1b2436;
      background: #ffffff;
      padding: 0 10px;
      border-radius: 4px;
      margin: 0 4px;
    }

    /* ===== جدول الفاتورة ===== */
    .invoice-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10.5px;
      margin-bottom: 5px;
    }

    .invoice-table thead th {
      background: #1b2436;
      color: #ffffff;
      padding: 4px 6px;
      text-align: center;
      font-weight: 700;
      font-size: 9.5px;
      letter-spacing: 0.3px;
    }

    .invoice-table tbody td {
      padding: 3px 6px;
      border-bottom: 1px solid #e5ddc9;
      text-align: center;
      vertical-align: middle;
    }

    .invoice-table tbody tr:last-child td {
      border-bottom: none;
    }

    .invoice-table tbody tr:hover {
      background: #faf8f4;
    }

    .student-name {
      text-align: right;
      font-weight: 600;
      padding-right: 8px !important;
    }

    .sessions-cell {
      font-weight: 700;
      color: #1b2436;
    }

    .attendance-cell {
      font-weight: 600;
    }

    .attendance-rate {
      display: inline-block;
      padding: 1px 8px;
      border-radius: 12px;
      font-size: 9.5px;
      font-weight: 700;
    }

    .attendance-rate.high {
      background: #e2efe8;
      color: #1f6f56;
    }

    .attendance-rate.medium {
      background: #f6ecd8;
      color: #b1802b;
    }

    .attendance-rate.low {
      background: #f5e5e4;
      color: #a8434a;
    }

    .amount-cell {
      font-weight: 800;
      font-variant-numeric: tabular-nums;
      color: #1b2436;
    }

    /* ===== الإجماليات ===== */
    .invoice-totals {
      max-width: 260px;
      margin-right: auto;
      margin-top: 4px;
      margin-bottom: 4px;
      border-top: 1.5px solid #e5ddc9;
      padding-top: 4px;
    }

    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 1.5px 0;
      font-size: 10.5px;
      font-weight: 600;
      color: #1b2436;
    }

    .total-row.final {
      font-size: 13px;
      font-weight: 900;
      color: #86602c;
      border-top: 2px solid #a97a3c;
      margin-top: 2px;
      padding-top: 4px;
    }

    /* ===== تذييل الفاتورة ===== */
    .invoice-footer {
      text-align: center;
      border-top: 1.5px solid #e5ddc9;
      padding-top: 4px;
      margin-top: 4px;
    }

    .invoice-footer p {
      font-size: 8.5px;
      color: #6b6357;
      margin: 2px 0;
    }

    .signature-line {
      display: flex;
      justify-content: space-between;
      margin-top: 10px;
      font-size: 10px;
      font-weight: 700;
      color: #6b6357;
      padding: 0 20px;
    }

    .signature-line span {
      border-top: 1.5px solid #a97a3c;
      padding-top: 4px;
      min-width: 120px;
      text-align: center;
    }

    /* ===== أزرار التحكم (تظهر فقط في الواجهة) ===== */
    .no-print {
      margin-top: 12px;
      display: flex;
      gap: 10px;
      justify-content: center;
    }

    /* ================================================================ */
    /* ===== أنماط الطباعة - إخفاء الأزرار والحواف ===== */
    /* ================================================================ */

    /* ================================================================ */
    /* ===== إصلاح الفاتورة المطبوعة - إخفاء الأزرار نهائياً ===== */
    /* ================================================================ */

    @media print {
      body * {
        visibility: hidden !important;
      }
      
      .invoice-print-area,
      .invoice-print-area * {
        visibility: visible !important;
      }
      
      .invoice-print-area {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        width: 100% !important;
        height: 100% !important;
        padding: 4mm 5mm !important;
        margin: 0 !important;
        background: #ffffff !important;
        box-shadow: none !important;
        border-radius: 0 !important;
        z-index: 999999 !important;
        overflow: visible !important;
      }

      .modal-actions,
      .modal-actions *,
      .no-print,
      .no-print *,
      button,
      .btn,
      .btn-primary,
      .btn-outline,
      .btn-success,
      .btn-danger,
      .btn-accent,
      .icon-btn,
      .modal-overlay .modal-box .modal-actions,
      .modal-overlay .modal-box .no-print {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        pointer-events: none !important;
        width: 0 !important;
        height: 0 !important;
        padding: 0 !important;
        margin: 0 !important;
        border: none !important;
        overflow: hidden !important;
        position: absolute !important;
        top: -9999px !important;
        left: -9999px !important;
      }

      .modal-overlay {
        background: transparent !important;
        backdrop-filter: none !important;
        padding: 0 !important;
        margin: 0 !important;
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        z-index: 999998 !important;
        display: block !important;
      }

      .modal-box {
        box-shadow: none !important;
        padding: 0 !important;
        margin: 0 !important;
        background: transparent !important;
        max-width: 100% !important;
        width: 100% !important;
        max-height: none !important;
        overflow: visible !important;
        border-radius: 0 !important;
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
      }

      .invoice-header {
        background: #faf8f4 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        border-color: #d4c9b8 !important;
      }

      .school-brand-icon {
        background: #f6f3ea !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }

      .invoice-id-label {
        background: #f6f3ea !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }

      .info-item {
        background: #faf9f6 !important;
        border-color: #f0ebe2 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }

      .status-paid {
        color: #1f6f56 !important;
      }

      .status-paid .status-dot {
        background: #1f6f56 !important;
      }

      .status-pending {
        color: #b1802b !important;
      }

      .status-pending .status-dot {
        background: #b1802b !important;
      }

      .invoice-divider-clean {
        background: linear-gradient(to right, transparent, #d4c9b8 20%, #d4c9b8 80%, transparent) !important;
      }

      .attendance-rate.high {
        background: #e2efe8 !important;
        color: #1f6f56 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }

      .attendance-rate.medium {
        background: #f6ecd8 !important;
        color: #b1802b !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }

      .attendance-rate.low {
        background: #f5e5e4 !important;
        color: #a8434a !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }

      .invoice-print-area {
        page-break-after: avoid !important;
        page-break-inside: avoid !important;
      }

      @page {
        margin: 2mm 3mm 2mm 3mm !important;
        size: A4 portrait !important;
      }
    }

    @media print and (display-mode: browser) {
      .no-print,
      .modal-actions,
      button,
      .btn {
        display: none !important;
        visibility: hidden !important;
      }
    }

    /* ================================================================ */
    /* ===== الاستجابة للهواتف ===== */
    /* ================================================================ */

    @media (max-width: 1024px) {
      .cards-grid, .cards-grid.four { grid-template-columns: repeat(2, 1fr); }
      .dues-cards-grid { grid-template-columns: repeat(2, 1fr); }
      .charts-grid { grid-template-columns: 1fr; }
      .side-nav { width: 194px; }
    }

    @media (max-width: 768px) {
      .hamburger { display: flex; }
      .brand-sub { display: none; }

      .app-body { position: relative; }
      .side-nav {
        position: fixed; top: 0; right: 0; height: 100%; width: 80%; max-width: 300px;
        z-index: 60; transform: translateX(100%); transition: transform .28s cubic-bezier(.2,.8,.2,1);
        box-shadow: var(--shadow-lg); padding: 0 12px 16px;
        background: var(--surface);
      }
      .side-nav-open { transform: translateX(0); }
      .side-nav-head {
        display: flex; align-items: center; justify-content: space-between;
        padding: 18px 6px 14px; font-family: 'Cairo', sans-serif; font-weight: 800; color: var(--ink); font-size: 14px;
        border-bottom: 1px solid var(--border); margin-bottom: 8px;
      }
      .nav-close { width: 32px; height: 32px; }
      .nav-overlay { display: block; position: fixed; inset: 0; background: rgba(16,25,43,0.55); z-index: 50; backdrop-filter: blur(2px); }
      .nav-item { font-size: 14.5px; padding: 13px 14px; }

      .app-content { padding: 14px; }
      .cards-grid, .cards-grid.four { grid-template-columns: repeat(2, 1fr); gap: 10px; }
      .dues-cards-grid { grid-template-columns: repeat(2, 1fr); }
      .stat-card { padding: 13px; gap: 10px; }
      .stat-icon { width: 36px; height: 36px; }
      .stat-value { font-size: 16px; }

      .panel-toolbar { flex-direction: column; align-items: stretch; }
      .toolbar-actions { flex-direction: column; align-items: stretch; }
      .toolbar-actions .input-field, .toolbar-actions .btn, .toolbar-actions .search-field { width: 100%; }

      .list-card { flex-wrap: wrap; }
      .commission-actions, .commission-amounts { width: 100%; justify-content: space-between; }

      .data-table thead { display: none; }
      .data-table, .data-table tbody, .data-table tr, .data-table td { display: block; width: 100%; }
      .data-table tr { border-top: 1px solid var(--border); padding: 8px 0; }
      .data-table td { border: none; padding: 6px 4px; display: flex; justify-content: space-between; font-size: 13px; }
      .data-table td::before { content: attr(data-label); font-weight: 700; color: var(--text-muted); margin-inline-end: 10px; }
      .table-actions { justify-content: flex-end; }

      .attendance-grid { grid-template-columns: 1fr; }
      .modal-box { padding: 20px; border-radius: 16px; }

      /* استجابة الهيدر المحترف */
      .invoice-header {
        padding: 14px 14px 12px;
      }

      .invoice-header-row {
        flex-direction: column;
        align-items: stretch;
        gap: 10px;
        padding-bottom: 8px;
      }

      .school-brand {
        gap: 10px;
      }

      .school-brand-icon {
        width: 34px;
        height: 34px;
      }

      .school-brand-icon svg {
        width: 18px;
        height: 18px;
      }

      .school-brand-text h2 {
        font-size: 13px;
      }

      .school-brand-sub {
        font-size: 8.5px;
      }

      .invoice-id {
        align-items: flex-start;
        flex-direction: row;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 4px;
      }

      .invoice-id-label {
        font-size: 8px;
        padding: 1px 10px;
      }

      .invoice-id-number {
        font-size: 14px;
      }

      .invoice-id-date {
        font-size: 9px;
      }

      .invoice-divider-clean {
        margin: 6px 0 8px;
      }

      .invoice-info-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 4px;
      }

      .info-item {
        padding: 4px 8px;
        gap: 8px;
      }

      .info-icon {
        width: 15px;
        height: 15px;
      }

      .info-label {
        font-size: 7.5px;
      }

      .info-value {
        font-size: 10px;
      }

      .info-status {
        font-size: 10px;
      }

      .gate-card { padding: 34px 24px; }

      .teacher-profile-header { flex-direction: column; text-align: center; }
      .available-commission-item { flex-wrap: wrap; }
      .commission-percentage { width: 100%; justify-content: center; }
      .commission-total { width: 100%; text-align: center; }
    }

    @media (max-width: 400px) {
      .invoice-info-grid {
        grid-template-columns: 1fr 1fr;
        gap: 3px;
      }

      .info-item {
        padding: 3px 6px;
      }
    }

    @media (min-width: 769px) {
      .nav-overlay { display: none !important; }
    }
  `]
})
export class ComprehensiveAccountingComponent implements OnInit, AfterViewInit, OnDestroy {
  private apiUrl = environment.apiUrl || 'http://localhost:5090/api';

  // ==================== الوصول بالرمز السري ====================
  private readonly ACCESS_CODE = 'acc26';
  isAuthenticated: boolean = false;
  isUnlocking: boolean = false;
  passcodeInput: string = '';
  passcodeError: string = '';

  // ==================== Session Variables ====================
  schoolId: string = '';
  schoolName: string = '';
  schoolInfo: any = null;
  token: string = '';
  isLoaded: boolean = false;

  // ==================== Tabs ====================
  activeTab: string = 'summary';
  showMobileNav: boolean = false;
  tabsList: NavTab[] = [
    { id: 'summary', label: 'الملخص المالي', icon: 'chart-bar' },
    { id: 'commissions', label: 'عمولات الأساتذة', icon: 'briefcase' },
    { id: 'payments', label: 'المدفوعات', icon: 'card' },
    { id: 'expenses', label: 'المصروفات', icon: 'receipt' },
    { id: 'transactions-status', label: 'حالة المعاملات', icon: 'clipboard' },
    { id: 'students-attendance', label: 'الطلاب والحضور', icon: 'users' },
    { id: 'teacher-details', label: 'تفاصيل الأستاذ', icon: 'user-tie' }
  ];

  // ==================== Dates ====================
  selectedMonth: string = '';
  summaryStartDate: string = '';
  summaryEndDate: string = '';
  detailsDate: string = '';

  // ==================== TAB 1: Summary ====================
  summary: SummaryData | null = null;
  transactions: Transaction[] = [];
  isLoadingSummary: boolean = false;
  isLoadingDetails: boolean = false;
  teacherDuesSummary: TeacherDuesSummary | null = null;

  // ==================== TAB 2: Commissions ====================
  commissions: Commission[] = [];
  commissionsStatsEnhanced: any = {};
  commissionMonth: string = '';
  commissionStatus: string = 'all';
  isGeneratingCommissions: boolean = false;
  hasPendingCommissions: boolean = false;

  // ==================== Bulk Commission ====================
  showBulkCommissionModal: boolean = false;
  isLoadingAvailableCommissions: boolean = false;
  availableCommissions: (AvailableCommission & { selected?: boolean })[] = [];
  selectedAvailableCommissions: AvailableCommission[] = [];
  isSubmittingBulk: boolean = false;

  // ==================== TAB 3: Payments ====================
  payments: Payment[] = [];
  paymentMonth: string = '';
  paymentStatus: string = 'all';
  paymentSearch: string = '';
  studentsList: any[] = [];
  classesList: any[] = [];
  teachersList: any[] = [];
  showPaymentModal: boolean = false;
  isSubmittingPayment: boolean = false;
  newPayment: any = {};

  // ==================== TAB 4: Expenses ====================
  expenses: Expense[] = [];
  expenseStartDate: string = '';
  expenseEndDate: string = '';
  expenseCategory: string = 'all';
  totalExpenses: number = 0;
  showExpenseModal: boolean = false;
  isSubmittingExpense: boolean = false;
  newExpense: any = {};

  // ==================== TAB 5: Transactions by Status ====================
  statusMonth: string = '';
  statusFilter: string = 'all';
  isLoadingStatus: boolean = false;
  transactionsByStatus: TransactionsByStatus | null = null;
  statusTransactions: Transaction[] = [];

  // ==================== TAB 6: Students & Attendance ====================
  selectedClassId: string = '';
  attendanceMonth: string = '';
  isLoadingAttendance: boolean = false;
  studentsAttendanceData: ClassStudentsData | null = null;
  selectedStudent: StudentAttendanceData | null = null;

  // ==================== TAB 7: Teacher Details ====================
  selectedTeacherId: string = '';
  teacherDetailsMonth: string = '';
  isLoadingTeacherDetails: boolean = false;
  teacherPaymentDetails: TeacherPaymentDetails | null = null;

  // ==================== Auto Calculate ====================
  isAutoCalculating: boolean = false;

  // Modal: Payment Adjustment
  showPaymentAdjustModal: boolean = false;
  adjustedAmount: number = 0;
  adjustReason: string = '';

  // Modal: Teacher Percentage
  showTeacherPercentageModal: boolean = false;
  newTeacherPercentage: number = 70;

  // Modal: Student Attendance
  showStudentAttendanceModal: boolean = false;

  // ==================== Modal: Commission Details ====================
  showCommissionDetailsModal: boolean = false;
  commissionDetails: any = null;
  commissionDetailsLoading: boolean = false;

  // ==================== Modal: Student Share Adjustment ====================
  showStudentShareModal: boolean = false;
  selectedCommissionStudent: any = null;
  studentShareAmount: number = 0;
  studentShareReason: string = '';

  // ==================== Modal: Bulk Percentage ====================
  showBulkPercentageModal: boolean = false;
  bulkPercentage: number = 70;
  isApplyingBulkPercentage: boolean = false;

  // ==================== Modal: Student Attendance from Commission ====================
  showCommissionStudentAttendanceModal: boolean = false;

  // ==================== Modal: الفاتورة الاحترافية ====================
  showInvoiceModal: boolean = false;
  invoiceData: InvoiceData | null = null;

  // ==================== Net Profit Data ====================
  netProfitData: NetProfitData | null = null;

  // ==================== General Modal Variables ====================
  showTransactionModal: boolean = false;
  isSubmittingTx: boolean = false;
  newTx = {
    type: 'income',
    amount: null as number | null,
    description: '',
    category: 'other',
    date: new Date().toISOString().split('T')[0]
  };

  // ==================== Charts ====================
  @ViewChild('incomeExpenseChart') incomeExpenseChartRef!: ElementRef;
  @ViewChild('transactionsChart') transactionsChartRef!: ElementRef;
  private ieChart: any;
  private tChart: any;
  private refreshInterval: any;

  // ==================== الصوتيات ====================
  private audioCtx: AudioContext | null = null;

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.initDates();
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    if (this.refreshInterval) clearInterval(this.refreshInterval);
    if (this.ieChart) this.ieChart.destroy();
    if (this.tChart) this.tChart.destroy();
  }

  // ==================== الأصوات الاحترافية ====================
  private getAudioContext(): AudioContext | null {
    try {
      if (!this.audioCtx) {
        const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
        if (!Ctx) return null;
        this.audioCtx = new Ctx();
      }
      const ctx = this.audioCtx;
      if (ctx?.state === 'suspended') ctx.resume();
      return ctx;
    } catch {
      return null;
    }
  }

  private playSuccessChime(): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [659.25, 830.61, 987.77];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const start = now + i * 0.075;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.15, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.55);
    });
  }

  private playUnlockChime(): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      const start = now + i * 0.1;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.14, start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.65);
    });
  }

  private playErrorTone(): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 220;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.16, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.38);
  }

  // ==================== الرمز السري ====================
  checkPasscode(): void {
    if (this.passcodeInput.trim() === this.ACCESS_CODE) {
      this.passcodeError = '';
      this.isUnlocking = true;
      this.playUnlockChime();
      setTimeout(() => {
        this.isAuthenticated = true;
        this.isUnlocking = false;
        this.passcodeInput = '';
        this.loadSessionData();
        this.startAutoRefresh();
      }, 650);
    } else {
      this.passcodeError = 'الرمز السري غير صحيح، حاول مجددا';
      this.passcodeInput = '';
      this.playErrorTone();
    }
  }

  toggleMobileNav(): void {
    this.showMobileNav = !this.showMobileNav;
  }

  // ==================== Initialization Methods ====================
  initDates(): void {
    const today = new Date();
    this.detailsDate = today.toISOString().split('T')[0];
    this.paymentMonth = today.toISOString().slice(0, 7);
    this.commissionMonth = today.toISOString().slice(0, 7);
    this.statusMonth = today.toISOString().slice(0, 7);
    this.attendanceMonth = today.toISOString().slice(0, 7);
    this.teacherDetailsMonth = today.toISOString().slice(0, 7);
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    this.selectedMonth = `${today.getFullYear()}-${month}`;
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    this.expenseStartDate = this.formatDate(firstDay);
    this.expenseEndDate = this.formatDate(today);
    this.onMonthChangeDatesOnly();
  }

  private onMonthChangeDatesOnly(): void {
    if (!this.selectedMonth) return;
    const [year, month] = this.selectedMonth.split('-');
    const firstDay = new Date(parseInt(year), parseInt(month) - 1, 1);
    this.summaryStartDate = this.formatDate(firstDay);
    const lastDay = new Date(parseInt(year), parseInt(month), 0);
    this.summaryEndDate = this.formatDate(lastDay);
  }

  onMonthChange(): void {
    if (!this.selectedMonth) return;
    this.onMonthChangeDatesOnly();
    if (this.isLoaded) {
      this.loadSummary();
      this.loadMonthlyNetProfit(this.selectedMonth);
      this.loadTransactionsByStatus();
      this.loadTeacherDuesSummary();
    }
  }

  private formatDate(date: Date): string {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();
    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;
    return [year, month, day].join('-');
  }

  loadSessionData(): void {
    try {
      this.token = localStorage.getItem('token') || '';
      const schoolStr = localStorage.getItem('school');
      
      if (!this.token || !schoolStr) {
        Swal.fire('خطأ', 'الرجاء تسجيل الدخول أولاً', 'error');
        this.router.navigate(['/login']);
        return;
      }
      
      const schoolObj = JSON.parse(schoolStr);
      this.schoolId = schoolObj._id;
      this.schoolName = schoolObj.name || 'المدرسة الحالية';
      this.schoolInfo = schoolObj;
      
      console.log('🏫 School ID:', this.schoolId);
      
      this.isLoaded = true;
      this.loadSummary();
      this.loadDailyDetails();
      this.loadCommissionsEnhanced();
      this.loadPayments();
      this.loadExpenses();
      this.loadStudentsAndClasses();
      this.loadMonthlyNetProfit(this.selectedMonth);
      this.loadTransactionsByStatus();
      this.loadTeacherDuesSummary();
      this.loadTeachersList();
    } catch (error) {
      console.error('Session data error:', error);
      this.router.navigate(['/login']);
    }
  }

  startAutoRefresh(): void {
    this.refreshInterval = setInterval(() => {
      if (this.activeTab === 'summary') {
        this.loadSummary();
        this.loadTeacherDuesSummary();
      } else if (this.activeTab === 'commissions') {
        this.loadCommissionsEnhanced();
      }
    }, 30000);
  }

  switchTab(tab: string): void {
    this.activeTab = tab;
    this.showMobileNav = false;
    if (tab === 'summary') {
      this.loadSummary();
      this.loadMonthlyNetProfit(this.selectedMonth);
      this.loadTeacherDuesSummary();
    } else if (tab === 'commissions') {
      this.loadCommissionsEnhanced();
    } else if (tab === 'payments') {
      this.loadPayments();
    } else if (tab === 'expenses') {
      this.loadExpenses();
    } else if (tab === 'transactions-status') {
      this.loadTransactionsByStatus();
    } else if (tab === 'students-attendance') {
      this.loadStudentsAndClasses();
      if (this.selectedClassId) {
        this.loadStudentsAttendance();
      }
    } else if (tab === 'teacher-details') {
      this.loadTeachersList();
      if (this.selectedTeacherId) {
        this.loadTeacherDetails();
      }
    }
  }

  // ==================== TAB 1: Summary Methods ====================
  async loadSummary(): Promise<void> {
    if (!this.summaryStartDate || !this.summaryEndDate) return;
    this.isLoadingSummary = true;
    try {
      const response = await fetch(
        `${this.apiUrl}/accounting/transactions-summary/${this.schoolId}?startDate=${this.summaryStartDate}&endDate=${this.summaryEndDate}`,
        { method: 'GET', headers: { 'Authorization': `Bearer ${this.token}`, 'Content-Type': 'application/json' } }
      );
      const data = await response.json();
      if (response.ok && data.success) {
        this.summary = data.summary;
        this.updateCharts();
      }
    } catch (error: any) {
      console.error('Error loading summary:', error);
    } finally {
      this.isLoadingSummary = false;
    }
  }

  async loadDailyDetails(): Promise<void> {
    if (!this.detailsDate) return;
    this.isLoadingDetails = true;
    try {
      const response = await fetch(
        `${this.apiUrl}/accounting/todays-transactions/${this.schoolId}?date=${this.detailsDate}`,
        { method: 'GET', headers: { 'Authorization': `Bearer ${this.token}`, 'Content-Type': 'application/json' } }
      );
      const data = await response.json();
      if (response.ok && data.success) {
        this.transactions = data.transactions || [];
      }
    } catch (error) {
      console.error('Error loading daily details:', error);
    } finally {
      this.isLoadingDetails = false;
    }
  }

  isIncome(transaction: Transaction): boolean {
    const incomeTypes = ['payment', 'registration_fee'];
    if (incomeTypes.includes(transaction._type)) return true;
    if (transaction._type === 'financial_transaction') {
      return (transaction as any).type === 'income';
    }
    return false;
  }

  // ==================== TAB 1: Teacher Dues Summary ====================
  async loadTeacherDuesSummary(): Promise<void> {
    try {
      const url = `${this.apiUrl}/accounting/teacher-dues-summary?schoolId=${this.schoolId}&month=${this.selectedMonth}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${this.token}`, 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        this.teacherDuesSummary = data;
      }
    } catch (error) {
      console.error('Error loading teacher dues summary:', error);
    }
  }

  // ==================== TAB 2: Commission Enhanced Methods ====================
  async loadCommissionsEnhanced(): Promise<void> {
    try {
      let url = `${this.apiUrl}/accounting/teacher-commissions-enhanced?schoolId=${this.schoolId}`;
      if (this.commissionMonth) url += `&month=${this.commissionMonth}`;
      if (this.commissionStatus !== 'all') url += `&status=${this.commissionStatus}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${this.token}`, 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        this.commissions = data.data || [];
        this.commissionsStatsEnhanced = data.stats || {};
        this.hasPendingCommissions = this.commissions.some(c => c.status === 'pending' || c.status === 'partial');
      }
    } catch (error) {
      console.error('Error loading commissions enhanced:', error);
    }
  }

  // ==================== Bulk Commission Methods ====================
  async openBulkCommissionModal(): Promise<void> {
    this.showBulkCommissionModal = true;
    await this.loadAvailableCommissions();
  }

  closeBulkCommissionModal(): void {
    this.showBulkCommissionModal = false;
    this.availableCommissions = [];
    this.selectedAvailableCommissions = [];
  }

  async loadAvailableCommissions(): Promise<void> {
    this.isLoadingAvailableCommissions = true;
    try {
      const url = `${this.apiUrl}/accounting/available-commissions?schoolId=${this.schoolId}&month=${this.commissionMonth}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${this.token}`, 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        this.availableCommissions = data.data.map((item: AvailableCommission) => ({
          ...item,
          selected: true
        }));
        this.updateSelectedCommissions();
      }
    } catch (error) {
      console.error('Error loading available commissions:', error);
      Swal.fire('خطأ', 'فشل في تحميل الحصص المتاحة', 'error');
      this.playErrorTone();
    } finally {
      this.isLoadingAvailableCommissions = false;
    }
  }

  updateSelectedCommissions(): void {
    this.selectedAvailableCommissions = this.availableCommissions.filter(item => item.selected);
  }

  selectAllAvailableCommissions(): void {
    this.availableCommissions.forEach(item => item.selected = true);
    this.updateSelectedCommissions();
  }

  deselectAllAvailableCommissions(): void {
    this.availableCommissions.forEach(item => item.selected = false);
    this.updateSelectedCommissions();
  }

  updateCommissionTotal(item: AvailableCommission): void {
    const percentage = item.teacherPercentage / 100;
    item.students.forEach(s => {
      s.teacherShare = s.amount * percentage;
    });
    item.totalAmount = item.students.reduce((sum, s) => sum + s.teacherShare, 0);
  }

  async submitBulkCommissions(): Promise<void> {
    if (this.selectedAvailableCommissions.length === 0) {
      Swal.fire('تنبيه', 'الرجاء اختيار حصة واحدة على الأقل', 'warning');
      return;
    }

    const result = await Swal.fire({
      title: 'إنشاء العمولات',
      text: `سيتم إنشاء ${this.selectedAvailableCommissions.length} عمولة للشهر ${this.commissionMonth}`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'نعم، إنشاء',
      cancelButtonText: 'إلغاء'
    });

    if (!result.isConfirmed) return;

    this.isSubmittingBulk = true;
    try {
      const payload = {
        schoolId: this.schoolId,
        month: this.commissionMonth,
        commissions: this.selectedAvailableCommissions.map(item => ({
          teacherId: item.teacherId,
          classId: item.classId,
          percentage: item.teacherPercentage,
          students: item.students,
          totalAmount: item.totalAmount
        })),
        autoCreatePayments: true
      };

      const response = await fetch(`${this.apiUrl}/accounting/teacher-commissions/bulk-generate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${this.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (response.ok && data.success) {
        this.playSuccessChime();
        Swal.fire('نجاح', data.message || 'تم إنشاء العمولات بنجاح', 'success');
        this.closeBulkCommissionModal();
        this.loadCommissionsEnhanced();
        this.loadTeacherDuesSummary();
      } else {
        throw new Error(data.error || 'فشل في إنشاء العمولات');
      }
    } catch (error: any) {
      this.playErrorTone();
      Swal.fire('خطأ', error.message, 'error');
    } finally {
      this.isSubmittingBulk = false;
    }
  }

  // ==================== Auto Calculate Dues ====================
  async autoCalculateDues(): Promise<void> {
    const result = await Swal.fire({
      title: 'حساب تلقائي للمستحقات',
      text: `سيتم حساب مستحقات الأساتذة تلقائياً للشهر ${this.commissionMonth}`,
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'نعم، حساب',
      cancelButtonText: 'إلغاء'
    });

    if (!result.isConfirmed) return;

    this.isAutoCalculating = true;
    try {
      const response = await fetch(`${this.apiUrl}/accounting/auto-calculate-teacher-dues`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${this.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolId: this.schoolId,
          month: this.commissionMonth
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        this.playSuccessChime();
        Swal.fire('نجاح', data.message || 'تم الحساب التلقائي بنجاح', 'success');
        this.loadCommissionsEnhanced();
        this.loadTeacherDuesSummary();
      } else {
        throw new Error(data.error || 'فشل في الحساب التلقائي');
      }
    } catch (error: any) {
      this.playErrorTone();
      Swal.fire('خطأ', error.message, 'error');
    } finally {
      this.isAutoCalculating = false;
    }
  }

  // ==================== TAB 7: Teacher Details ====================
  async loadTeachersList(): Promise<void> {
    try {
      const response = await fetch(`${this.apiUrl}/teachers?schoolId=${this.schoolId}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${this.token}`, 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      if (response.ok) {
        this.teachersList = data || [];
      }
    } catch (error) {
      console.error('Error loading teachers list:', error);
    }
  }

  async loadTeacherDetails(): Promise<void> {
    if (!this.selectedTeacherId) {
      this.teacherPaymentDetails = null;
      return;
    }

    this.isLoadingTeacherDetails = true;
    try {
      let url = `${this.apiUrl}/accounting/teacher-payment-details?schoolId=${this.schoolId}&teacherId=${this.selectedTeacherId}`;
      if (this.teacherDetailsMonth) url += `&month=${this.teacherDetailsMonth}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${this.token}`, 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        this.teacherPaymentDetails = data;
      } else {
        this.teacherPaymentDetails = null;
      }
    } catch (error) {
      console.error('Error loading teacher details:', error);
      this.teacherPaymentDetails = null;
    } finally {
      this.isLoadingTeacherDetails = false;
    }
  }

  // ==================== Commission Methods ====================
  async payCommission(commissionId: string): Promise<void> {
    const result = await Swal.fire({
      title: 'دفع العمولة',
      text: 'هل أنت متأكد من دفع هذه العمولة؟',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'نعم، دفع',
      cancelButtonText: 'إلغاء'
    });
    if (!result.isConfirmed) return;

    try {
      const response = await fetch(`${this.apiUrl}/accounting/teacher-commissions/pay`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${this.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ commissionId, paymentMethod: 'cash' })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        this.playSuccessChime();
        Swal.fire('نجاح', data.message, 'success');
        this.loadCommissionsEnhanced();
        this.loadSummary();
        this.loadTeacherDuesSummary();
        if (this.showCommissionDetailsModal) {
          await this.viewCommissionDetails(commissionId);
        }
      } else {
        throw new Error(data.error || 'فشل في دفع العمولة');
      }
    } catch (error: any) {
      this.playErrorTone();
      Swal.fire('خطأ', error.message, 'error');
    }
  }

  async payAllCommissions(): Promise<void> {
    const result = await Swal.fire({
      title: 'دفع جميع العمولات',
      text: 'هل أنت متأكد من دفع جميع العمولات المعلقة؟',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'نعم، دفع الكل',
      cancelButtonText: 'إلغاء'
    });
    if (!result.isConfirmed) return;

    try {
      const response = await fetch(`${this.apiUrl}/accounting/teacher-commissions/pay-all`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${this.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolId: this.schoolId,
          month: this.commissionMonth || new Date().toISOString().slice(0, 7),
          paymentMethod: 'cash'
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        this.playSuccessChime();
        Swal.fire('نجاح', data.message, 'success');
        this.loadCommissionsEnhanced();
        this.loadSummary();
        this.loadTeacherDuesSummary();
      } else {
        throw new Error(data.error || 'فشل في دفع العمولات');
      }
    } catch (error: any) {
      this.playErrorTone();
      Swal.fire('خطأ', error.message, 'error');
    }
  }

  async cancelCommission(commissionId: string): Promise<void> {
    if (!commissionId) {
      Swal.fire('خطأ', 'معرف العمولة غير صالح', 'error');
      return;
    }

    const result = await Swal.fire({
      title: 'هل أنت متأكد من إلغاء العمولة؟',
      text: 'سيتم إلغاء هذه العمولة ولن يتمكن الأستاذ من استلامها. هل أنت متأكد؟',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'نعم، إلغاء العمولة',
      cancelButtonText: 'إلغاء',
      confirmButtonColor: '#d33'
    });

    if (!result.isConfirmed) return;

    try {
      const response = await fetch(
        `${this.apiUrl}/accounting/teacher-commissions/${commissionId}/cancel-enhanced`,
        {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${this.token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: 'تم إلغاء العمولة من قبل المستخدم', updatePayments: true })
        }
      );
      const data = await response.json();
      if (response.ok && data.success) {
        Swal.fire('نجاح', 'تم إلغاء العمولة بنجاح', 'success');
        this.closeCommissionDetailsModal();
        this.loadCommissionsEnhanced();
        this.loadSummary();
        this.loadTeacherDuesSummary();
      } else {
        throw new Error(data.error || 'فشل في إلغاء العمولة');
      }
    } catch (error: any) {
      this.playErrorTone();
      Swal.fire('خطأ', error.message || 'فشل في إلغاء العمولة', 'error');
    }
  }

  // ==================== Commission Details Methods ====================
  async viewCommissionDetails(commissionId: string): Promise<void> {
    this.commissionDetailsLoading = true;
    try {
      const response = await fetch(`${this.apiUrl}/accounting/teacher-commissions/${commissionId}/details`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        this.commissionDetails = data.data;
        this.showCommissionDetailsModal = true;
      } else {
        Swal.fire('خطأ', data.error || 'فشل في تحميل تفاصيل العمولة', 'error');
      }
    } catch (error) {
      console.error('Error loading commission details:', error);
      Swal.fire('خطأ', 'حدث خطأ أثناء تحميل البيانات', 'error');
    } finally {
      this.commissionDetailsLoading = false;
    }
  }

  closeCommissionDetailsModal(): void {
    this.showCommissionDetailsModal = false;
    this.commissionDetails = null;
  }

  // ==================== Bulk Percentage Methods ====================
  openBulkPercentageModal(): void {
    this.bulkPercentage = this.commissionDetails?.commission?.class?.teacher?.salaryPercentage
      || this.commissionDetails?.class?.teacher?.salaryPercentage
      || 70;
    this.showBulkPercentageModal = true;
  }

  closeBulkPercentageModal(): void {
    this.showBulkPercentageModal = false;
  }

  async applyBulkPercentage(): Promise<void> {
    if (!this.commissionDetails?.commission?._id) {
      Swal.fire('خطأ', 'لا توجد عمولة محددة', 'error');
      return;
    }
    if (this.bulkPercentage === null || this.bulkPercentage === undefined || this.bulkPercentage < 0 || this.bulkPercentage > 100) {
      Swal.fire('تنبيه', 'النسبة يجب أن تكون بين 0 و 100', 'warning');
      return;
    }

    const students = this.commissionDetails?.students || [];
    if (students.length === 0) {
      Swal.fire('تنبيه', 'لا يوجد طلاب في هذه العمولة', 'warning');
      return;
    }

    const result = await Swal.fire({
      title: 'تطبيق النسبة على الجميع',
      text: `سيتم احتساب حصة الأستاذ لكل الطلاب (${students.length}) تلقائيا بنسبة ${this.bulkPercentage}% من مبلغ كل طالب. يمكنك لاحقا تعديل أي طالب يدويا.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'نعم، تطبيق على الجميع',
      cancelButtonText: 'إلغاء'
    });
    if (!result.isConfirmed) return;

    this.isApplyingBulkPercentage = true;
    let successCount = 0;
    try {
      for (const student of students) {
        const baseAmount = student.amount ?? student.totalAmount ?? 0;
        const teacherShare = Math.round((baseAmount * this.bulkPercentage) / 100);
        const studentId = student._id || student.student?._id;
        try {
          const response = await fetch(
            `${this.apiUrl}/accounting/teacher-commissions/${this.commissionDetails.commission._id}/student-share`,
            {
              method: 'PUT',
              headers: { 'Authorization': `Bearer ${this.token}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                studentId,
                teacherShare,
                reason: `تطبيق نسبة موحدة ${this.bulkPercentage}% تلقائيا لكل الطلاب`
              })
            }
          );
          const data = await response.json();
          if (response.ok && data.success) successCount++;
        } catch (innerErr) {
          console.error('Error applying share for student:', studentId, innerErr);
        }
      }

      this.closeBulkPercentageModal();
      this.playSuccessChime();
      Swal.fire('نجاح', `تم تطبيق النسبة (${this.bulkPercentage}%) على ${successCount} من أصل ${students.length} طالب`, 'success');
      await this.viewCommissionDetails(this.commissionDetails.commission._id);
      this.loadCommissionsEnhanced();
    } catch (error: any) {
      this.playErrorTone();
      Swal.fire('خطأ', error.message || 'فشل في تطبيق النسبة على الطلاب', 'error');
    } finally {
      this.isApplyingBulkPercentage = false;
    }
  }

  // ==================== Student Share Adjustment Methods ====================
  openStudentShareModal(student: any): void {
    this.selectedCommissionStudent = student;
    this.studentShareAmount = student.teacherShare || 0;
    this.studentShareReason = '';
    this.showStudentShareModal = true;
  }

  closeStudentShareModal(): void {
    this.showStudentShareModal = false;
    this.selectedCommissionStudent = null;
  }

  async submitStudentShare(): Promise<void> {
    if (!this.selectedCommissionStudent || this.studentShareAmount < 0) {
      Swal.fire('تنبيه', 'يرجى إدخال مبلغ صحيح', 'warning');
      return;
    }

    try {
      const response = await fetch(
        `${this.apiUrl}/accounting/teacher-commissions/${this.commissionDetails?.commission._id}/student-share`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            studentId: this.selectedCommissionStudent._id,
            teacherShare: this.studentShareAmount,
            reason: this.studentShareReason || 'تعديل يدوي'
          })
        }
      );
      const data = await response.json();
      if (response.ok && data.success) {
        this.playSuccessChime();
        Swal.fire('نجاح', data.message || 'تم تحديث حصة الطالب بنجاح', 'success');
        this.closeStudentShareModal();
        await this.viewCommissionDetails(this.commissionDetails?.commission._id);
      } else {
        this.playErrorTone();
        Swal.fire('خطأ', data.error || 'فشل في تحديث حصة الطالب', 'error');
      }
    } catch (error: any) {
      console.error('Error updating student share:', error);
      this.playErrorTone();
      Swal.fire('خطأ', error.message || 'فشل في تحديث حصة الطالب', 'error');
    }
  }

  // ==================== Student Attendance from Commission Methods ====================
  openStudentAttendanceFromCommission(student: any): void {
    this.selectedCommissionStudent = student;
    this.showCommissionStudentAttendanceModal = true;
  }

  closeCommissionStudentAttendanceModal(): void {
    this.showCommissionStudentAttendanceModal = false;
    this.selectedCommissionStudent = null;
  }

  getCommissionStudentAttendanceDates(student: any): any[] {
    if (!student || !student.attendance || !student.attendance.byDate) {
      return [];
    }

    const dates = Object.keys(student.attendance.byDate).sort();
    const daysOfWeek = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

    return dates.map(date => {
      const d = new Date(date);
      const record = student.attendance.byDate[date] || { status: 'absent', joinedAt: null };
      return {
        date: date,
        dayName: daysOfWeek[d.getDay()],
        status: record.status || 'absent',
        joinedAt: record.joinedAt
          ? new Date(record.joinedAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
          : null
      };
    });
  }

  async updateCommissionAttendance(studentId: string, date: string, status: string): Promise<void> {
    try {
      const response = await fetch(
        `${this.apiUrl}/accounting/teacher-commissions/${this.commissionDetails?.commission._id}/attendance`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            studentId,
            date,
            status
          })
        }
      );
      const data = await response.json();
      if (response.ok && data.success) {
        this.playSuccessChime();
        Swal.fire('نجاح', 'تم تحديث حالة الحضور', 'success');
        await this.viewCommissionDetails(this.commissionDetails?.commission._id);
      } else {
        this.playErrorTone();
        Swal.fire('خطأ', data.error || 'فشل في تحديث الحضور', 'error');
      }
    } catch (error: any) {
      console.error('Error updating attendance:', error);
      this.playErrorTone();
      Swal.fire('خطأ', error.message || 'فشل في تحديث الحضور', 'error');
    }
  }

  // ==================== Invoice Methods ====================
  generateInvoice(details: any): void {
    if (!details || !details.commission) {
      Swal.fire('تنبيه', 'لا توجد بيانات كافية لإنشاء الفاتورة، يرجى فتح تفاصيل العمولة أولا', 'warning');
      return;
    }

    const commission = details.commission;
    const students = details.students || [];

    const totalSessions = details.summary?.totalSessions || details.liveClasses?.length || 0;

    let statusText = '';
    if (commission.status === 'paid') {
      statusText = 'مدفوعة';
    } else if (commission.status === 'cancelled') {
      statusText = 'ملغاة';
    } else {
      statusText = 'معلقة';
    }

    this.invoiceData = {
      invoiceNumber: `INV-${(commission._id || '').toString().slice(-6).toUpperCase() || Date.now()}`,
      date: this.formatDate(new Date()),
      school: this.schoolInfo,
      teacher: commission.teacher,
      class: commission.class,
      month: commission.month,
      totalSessions: totalSessions,
      students: students.map((s: any) => {
        const presentCount = s.attendanceCount || s.attendance?.summary?.present || 0;
        const attendanceRate = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 0;
        return {
          name: s.name || s.student?.name || '-',
          sessions: `${presentCount}/${totalSessions}`,
          attendanceRate: attendanceRate,
          teacherShare: s.teacherShare || 0
        };
      }),
      totalAmount: commission.totalAmount || 0,
      totalPaid: commission.totalPaid || 0,
      remainingAmount: commission.remainingAmount || 0,
      status: commission.status,
      statusText: statusText
    };

    this.showInvoiceModal = true;
  }

  closeInvoiceModal(): void {
    this.showInvoiceModal = false;
    this.invoiceData = null;
  }

  printInvoice(): void {
    setTimeout(() => {
      window.print();
    }, 300);
  }

  // ==================== TAB 3: Payment Methods ====================
  async loadPayments(): Promise<void> {
    try {
      const schoolId = this.schoolId;
      
      if (!schoolId) {
        console.warn('⚠️ No schoolId available for payments');
        this.payments = [];
        return;
      }

      let url = `${this.apiUrl}/payments?schoolId=${schoolId}`;
      if (this.paymentMonth) url += `&monthCode=${this.paymentMonth}`;
      if (this.paymentStatus !== 'all') url += `&status=${this.paymentStatus}`;
      if (this.paymentSearch) url += `&search=${encodeURIComponent(this.paymentSearch)}`;
      
      console.log('📊 Fetching payments with URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${this.token}`, 
          'Content-Type': 'application/json' 
        }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        this.payments = Array.isArray(data) ? data : (data.payments || data.data || []);
        console.log(`✅ Loaded ${this.payments.length} payments for school ${schoolId}`);
      } else {
        console.error('❌ Error loading payments:', data);
        this.payments = [];
      }
    } catch (error) {
      console.error('❌ Error loading payments:', error);
      this.payments = [];
    }
  }

  async loadStudentsAndClasses(): Promise<void> {
    try {
      const schoolId = this.schoolId;
      
      if (!schoolId) {
        console.warn('⚠️ No schoolId available');
        return;
      }

      const [studentsRes, classesRes] = await Promise.all([
        fetch(`${this.apiUrl}/students?schoolId=${schoolId}`, {
          headers: { 'Authorization': `Bearer ${this.token}` }
        }),
        fetch(`${this.apiUrl}/classes?schoolId=${schoolId}`, {
          headers: { 'Authorization': `Bearer ${this.token}` }
        })
      ]);
      
      if (studentsRes.ok) {
        const data = await studentsRes.json();
        this.studentsList = Array.isArray(data) ? data : (data.data || data.students || []);
      }
      
      if (classesRes.ok) {
        const data = await classesRes.json();
        this.classesList = Array.isArray(data) ? data : (data.data || data.classes || []);
      }
      
      console.log(`✅ Loaded ${this.studentsList.length} students and ${this.classesList.length} classes`);
    } catch (error) {
      console.error('Error loading students and classes:', error);
    }
  }

  openPaymentModal(): void {
    this.newPayment = {
      studentId: '',
      classId: '',
      amount: null,
      month: new Date().toISOString().slice(0, 7),
      paymentMethod: 'cash',
      notes: ''
    };
    this.showPaymentModal = true;
  }

  closePaymentModal(): void {
    this.showPaymentModal = false;
  }

  async submitPayment(): Promise<void> {
    if (!this.newPayment.studentId || !this.newPayment.classId || !this.newPayment.amount) {
      Swal.fire('تنبيه', 'يرجى ملء جميع الحقول المطلوبة', 'warning');
      return;
    }

    this.isSubmittingPayment = true;
    try {
      const payload = {
        schoolId: this.schoolId,
        student: this.newPayment.studentId,
        class: this.newPayment.classId,
        amount: this.newPayment.amount,
        month: this.newPayment.month,
        monthCode: this.newPayment.month,
        paymentMethod: this.newPayment.paymentMethod,
        notes: this.newPayment.notes,
        status: 'pending'
      };

      console.log('📤 Submitting payment payload:', payload);

      const response = await fetch(`${this.apiUrl}/payments`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${this.token}`, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        this.playSuccessChime();
        Swal.fire('نجاح', 'تم إضافة الدفعة بنجاح', 'success');
        this.closePaymentModal();
        this.loadPayments();
        this.loadSummary();
      } else {
        throw new Error(data.error || 'فشل في إضافة الدفعة');
      }
    } catch (error: any) {
      this.playErrorTone();
      Swal.fire('خطأ', error.message, 'error');
    } finally {
      this.isSubmittingPayment = false;
    }
  }

  async payPayment(paymentId: string): Promise<void> {
    const result = await Swal.fire({
      title: 'تسديد الدفعة',
      text: 'هل أنت متأكد من تسديد هذه الدفعة؟',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'نعم، تسديد',
      cancelButtonText: 'إلغاء'
    });
    if (!result.isConfirmed) return;

    try {
      const response = await fetch(`${this.apiUrl}/payments/${paymentId}/pay`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${this.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethod: 'cash' })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        this.playSuccessChime();
        Swal.fire('نجاح', 'تم تسديد الدفعة بنجاح', 'success');
        this.loadPayments();
        this.loadSummary();
        this.loadTeacherDuesSummary();
      } else {
        throw new Error(data.error || 'فشل في تسديد الدفعة');
      }
    } catch (error: any) {
      this.playErrorTone();
      Swal.fire('خطأ', error.message, 'error');
    }
  }

  async cancelPayment(paymentId: string): Promise<void> {
    const result = await Swal.fire({
      title: 'إلغاء الدفعة',
      text: 'هل أنت متأكد من إلغاء هذه الدفعة؟',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'نعم، إلغاء',
      cancelButtonText: 'إلغاء'
    });
    if (!result.isConfirmed) return;

    try {
      const response = await fetch(`${this.apiUrl}/payments/${paymentId}/cancel`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${this.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'تم الإلغاء من قبل المستخدم' })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        Swal.fire('نجاح', 'تم إلغاء الدفعة بنجاح', 'success');
        this.loadPayments();
      } else {
        throw new Error(data.error || 'فشل في إلغاء الدفعة');
      }
    } catch (error: any) {
      this.playErrorTone();
      Swal.fire('خطأ', error.message, 'error');
    }
  }

  // ==================== TAB 4: Expense Methods ====================
  async loadExpenses(): Promise<void> {
    try {
      let url = `${this.apiUrl}/accounting/expenses?schoolId=${this.schoolId}`;
      if (this.expenseStartDate) url += `&startDate=${this.expenseStartDate}`;
      if (this.expenseEndDate) url += `&endDate=${this.expenseEndDate}`;
      if (this.expenseCategory !== 'all') url += `&category=${this.expenseCategory}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${this.token}`, 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        this.expenses = data.expenses || [];
        this.totalExpenses = this.expenses.reduce((sum, e) => sum + e.amount, 0);
      }
    } catch (error) {
      console.error('Error loading expenses:', error);
    }
  }

  openExpenseModal(): void {
    this.newExpense = {
      description: '',
      amount: null,
      category: 'other',
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'cash',
      notes: ''
    };
    this.showExpenseModal = true;
  }

  closeExpenseModal(): void {
    this.showExpenseModal = false;
  }

  async submitExpense(): Promise<void> {
    if (!this.newExpense.description || !this.newExpense.amount) {
      Swal.fire('تنبيه', 'يرجى ملء جميع الحقول المطلوبة', 'warning');
      return;
    }

    this.isSubmittingExpense = true;
    try {
      const response = await fetch(`${this.apiUrl}/accounting/expenses`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${this.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolId: this.schoolId,
          description: this.newExpense.description,
          amount: this.newExpense.amount,
          category: this.newExpense.category,
          date: this.newExpense.date,
          paymentMethod: this.newExpense.paymentMethod,
          notes: this.newExpense.notes,
          status: 'paid'
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        this.playSuccessChime();
        Swal.fire('نجاح', 'تم إضافة المصروف بنجاح', 'success');
        this.closeExpenseModal();
        this.loadExpenses();
        this.loadSummary();
      } else {
        throw new Error(data.error || 'فشل في إضافة المصروف');
      }
    } catch (error: any) {
      this.playErrorTone();
      Swal.fire('خطأ', error.message, 'error');
    } finally {
      this.isSubmittingExpense = false;
    }
  }

  async deleteExpense(expenseId: string): Promise<void> {
    const result = await Swal.fire({
      title: 'حذف المصروف',
      text: 'هل أنت متأكد من حذف هذا المصروف؟',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'نعم، حذف',
      cancelButtonText: 'إلغاء'
    });
    if (!result.isConfirmed) return;

    try {
      const response = await fetch(`${this.apiUrl}/accounting/expenses/${expenseId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${this.token}` }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        Swal.fire('نجاح', 'تم حذف المصروف بنجاح', 'success');
        this.loadExpenses();
        this.loadSummary();
      } else {
        throw new Error(data.error || 'فشل في حذف المصروف');
      }
    } catch (error: any) {
      this.playErrorTone();
      Swal.fire('خطأ', error.message, 'error');
    }
  }

  // ==================== TAB 5: Transactions by Status Methods ====================
  async loadTransactionsByStatus(): Promise<void> {
    if (!this.statusMonth) return;
    this.isLoadingStatus = true;
    try {
      const url = `${this.apiUrl}/accounting/transactions-status?schoolId=${this.schoolId}&month=${this.statusMonth}&status=${this.statusFilter}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${this.token}`, 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        this.transactionsByStatus = data;
        this.statusTransactions = data.transactions || [];
      } else {
        console.error('Error loading transactions by status:', data.error);
      }
    } catch (error) {
      console.error('Error loading transactions by status:', error);
    } finally {
      this.isLoadingStatus = false;
    }
  }

  // ==================== Net Profit Calculation ====================
  async loadMonthlyNetProfit(month: string): Promise<void> {
    if (!month) return;
    try {
      const response = await fetch(
        `${this.apiUrl}/accounting/net-profit?schoolId=${this.schoolId}&month=${month}`,
        { method: 'GET', headers: { 'Authorization': `Bearer ${this.token}`, 'Content-Type': 'application/json' } }
      );
      const data = await response.json();
      if (response.ok && data.success) {
        this.netProfitData = data;
        if (this.summary) {
          this.summary = {
            ...this.summary,
            totalCommissions: data.summary.totalCommissions || 0,
            netProfitAfterCommissions: data.summary.netProfit || 0,
            profitMargin: data.summary.profitMargin || 0
          };
        }
      }
    } catch (error) {
      console.error('Error loading net profit:', error);
    }
  }

  // ==================== TAB 6: Students & Attendance Methods ====================
  async loadStudentsAttendance(): Promise<void> {
    if (!this.selectedClassId) {
      Swal.fire('تنبيه', 'يرجى اختيار حصة أولاً', 'warning');
      return;
    }

    this.isLoadingAttendance = true;
    try {
      const url = `${this.apiUrl}/classes/${this.selectedClassId}/students-with-attendance?month=${this.attendanceMonth}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();

      if (response.ok && data.success) {
        this.studentsAttendanceData = data.data;
        this.newTeacherPercentage = data.data.class.teacher?.salaryPercentage || 70;
      } else {
        Swal.fire('خطأ', data.error || 'فشل في تحميل بيانات الطلاب', 'error');
      }
    } catch (error) {
      console.error('Error loading students attendance:', error);
      Swal.fire('خطأ', 'حدث خطأ أثناء تحميل البيانات', 'error');
    } finally {
      this.isLoadingAttendance = false;
    }
  }

  // ==================== Payment Adjustment Methods ====================
  openPaymentAdjustModal(student: StudentAttendanceData): void {
    this.selectedStudent = student;
    this.adjustedAmount = student.payment.totalAmount;
    this.adjustReason = '';
    this.showPaymentAdjustModal = true;
  }

  closePaymentAdjustModal(): void {
    this.showPaymentAdjustModal = false;
    this.selectedStudent = null;
  }

  async submitPaymentAdjust(): Promise<void> {
    if (!this.selectedStudent || !this.adjustedAmount || this.adjustedAmount < 0) {
      Swal.fire('تنبيه', 'يرجى إدخال مبلغ صحيح', 'warning');
      return;
    }

    try {
      const studentPayments = this.studentsAttendanceData?.students
        .find(s => s._id === this.selectedStudent?._id)
        ?.payment.payments || [];

      if (studentPayments.length === 0) {
        Swal.fire('تنبيه', 'لا توجد دفعات مسجلة لهذا الطالب', 'warning');
        return;
      }

      let updatedCount = 0;
      for (const payment of studentPayments) {
        const response = await fetch(`${this.apiUrl}/payments/${payment._id}/adjust-amount`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${this.token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: this.adjustedAmount / studentPayments.length,
            reason: this.adjustReason || 'تعديل يدوي'
          })
        });
        const data = await response.json();
        if (response.ok && data.success) {
          updatedCount++;
        }
      }

      this.playSuccessChime();
      Swal.fire('نجاح', `تم تعديل مبلغ ${updatedCount} دفعة بنجاح`, 'success');
      this.closePaymentAdjustModal();
      this.loadStudentsAttendance();
      this.loadSummary();

    } catch (error: any) {
      console.error('Error adjusting payment:', error);
      this.playErrorTone();
      Swal.fire('خطأ', error.message || 'فشل في تعديل المبلغ', 'error');
    }
  }

  // ==================== Teacher Percentage Methods ====================
  openTeacherPercentageModal(): void {
    this.newTeacherPercentage = this.studentsAttendanceData?.class?.teacher?.salaryPercentage || 70;
    this.showTeacherPercentageModal = true;
  }

  closeTeacherPercentageModal(): void {
    this.showTeacherPercentageModal = false;
  }

  async submitTeacherPercentage(): Promise<void> {
    if (!this.selectedClassId || this.newTeacherPercentage < 0 || this.newTeacherPercentage > 100) {
      Swal.fire('تنبيه', 'النسبة يجب أن تكون بين 0 و 100', 'warning');
      return;
    }

    try {
      const response = await fetch(`${this.apiUrl}/classes/${this.selectedClassId}/teacher-percentage`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${this.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ percentage: this.newTeacherPercentage })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        this.playSuccessChime();
        Swal.fire('نجاح', data.message || 'تم تحديث نسبة الأستاذ بنجاح', 'success');
        this.closeTeacherPercentageModal();
        this.loadStudentsAttendance();
      } else {
        this.playErrorTone();
        Swal.fire('خطأ', data.error || 'فشل في تحديث النسبة', 'error');
      }
    } catch (error: any) {
      console.error('Error updating teacher percentage:', error);
      this.playErrorTone();
      Swal.fire('خطأ', error.message || 'فشل في تحديث النسبة', 'error');
    }
  }

  // ==================== Student Attendance Display Methods ====================
  openStudentAttendanceModal(student: StudentAttendanceData): void {
    this.selectedStudent = student;
    this.showStudentAttendanceModal = true;
  }

  closeStudentAttendanceModal(): void {
    this.showStudentAttendanceModal = false;
    this.selectedStudent = null;
  }

  getStudentAttendanceDates(student: StudentAttendanceData | null): any[] {
    if (!student || !student.attendance || !student.attendance.byDate) {
      return [];
    }

    const dates = Object.keys(student.attendance.byDate).sort();
    const daysOfWeek = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

    return dates.map(date => {
      const d = new Date(date);
      const record = student.attendance.byDate[date] || { status: 'absent', joinedAt: null };
      return {
        date: date,
        dayName: daysOfWeek[d.getDay()],
        status: record.status || 'absent',
        joinedAt: record.joinedAt
          ? new Date(record.joinedAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
          : null
      };
    });
  }

  async updateAttendance(studentId: string, date: string, status: string): Promise<void> {
    try {
      const response = await fetch(`${this.apiUrl}/attendance/update`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${this.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          classId: this.selectedClassId,
          date,
          status
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        if (this.selectedStudent) {
          if (!this.selectedStudent.attendance.byDate[date]) {
            this.selectedStudent.attendance.byDate[date] = {
              status: status,
              joinedAt: new Date().toISOString(),
              className: this.studentsAttendanceData?.class?.name || '',
              startTime: '08:00'
            };
          } else {
            this.selectedStudent.attendance.byDate[date].status = status;
          }
          this.recalculateStudentStats(this.selectedStudent);
        }
        this.playSuccessChime();
        Swal.fire('نجاح', 'تم تحديث حالة الحضور', 'success');
      } else {
        this.playErrorTone();
        Swal.fire('خطأ', data.error || 'فشل في تحديث الحضور', 'error');
      }
    } catch (error: any) {
      console.error('Error updating attendance:', error);
      this.playErrorTone();
      Swal.fire('خطأ', error.message || 'فشل في تحديث الحضور', 'error');
    }
  }

  recalculateStudentStats(student: StudentAttendanceData): void {
    const dates = Object.keys(student.attendance.byDate);
    let present = 0, absent = 0, late = 0;

    dates.forEach(date => {
      const status = student.attendance.byDate[date]?.status || 'absent';
      if (status === 'present') present++;
      else if (status === 'late') late++;
      else absent++;
    });

    const total = dates.length;
    student.attendance.summary = {
      present,
      absent,
      late,
      total,
      attendanceRate: total > 0 ? Math.round((present / total) * 100) : 0
    };
  }

  // ==================== General Modal Methods ====================
  openTransactionModal(): void {
    this.newTx = {
      type: 'income',
      amount: null,
      description: '',
      category: 'other',
      date: new Date().toISOString().split('T')[0]
    };
    this.showTransactionModal = true;
  }

  closeTransactionModal(): void {
    this.showTransactionModal = false;
  }

  async submitTransaction(): Promise<void> {
    if (!this.newTx.amount || this.newTx.amount <= 0) {
      Swal.fire('تنبيه', 'يرجى إدخال مبلغ صحيح', 'warning');
      return;
    }
    if (!this.newTx.description.trim()) {
      Swal.fire('تنبيه', 'يرجى كتابة وصف للمعاملة', 'warning');
      return;
    }

    this.isSubmittingTx = true;
    try {
      const payload = {
        schoolId: this.schoolId,
        type: this.newTx.type,
        amount: this.newTx.amount,
        description: this.newTx.description,
        category: this.newTx.category,
        date: this.newTx.date,
        student: null
      };
      const response = await fetch(`${this.apiUrl}/accounting/transactions`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${this.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (response.ok && data.success) {
        this.playSuccessChime();
        Swal.fire('نجاح', 'تم حفظ المعاملة', 'success');
        this.closeTransactionModal();
        this.loadSummary();
        this.loadMonthlyNetProfit(this.selectedMonth);
        if (this.detailsDate === this.newTx.date) this.loadDailyDetails();
      } else {
        throw new Error(data.error || 'فشل في حفظ المعاملة');
      }
    } catch (error: any) {
      this.playErrorTone();
      Swal.fire('خطأ', error.message, 'error');
    } finally {
      this.isSubmittingTx = false;
    }
  }

  // ==================== Chart Methods ====================
  updateCharts(): void {
    if (!this.summary) return;
    setTimeout(() => {
      this.renderIncomeExpenseChart();
      this.renderTransactionsChart();
    }, 100);
  }

  renderIncomeExpenseChart(): void {
    if (this.ieChart) this.ieChart.destroy();
    if (this.incomeExpenseChartRef && this.incomeExpenseChartRef.nativeElement) {
      const ctx = this.incomeExpenseChartRef.nativeElement.getContext('2d');
      this.ieChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['الإيرادات', 'المصروفات'],
          datasets: [{
            data: [this.summary!.totalIncome, this.summary!.totalExpenses],
            backgroundColor: ['#1f6f56', '#a8434a'],
            hoverOffset: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                font: { family: 'IBM Plex Sans Arabic', size: 11 },
                padding: 15
              }
            }
          }
        }
      });
    }
  }

  renderTransactionsChart(): void {
    if (this.tChart) this.tChart.destroy();
    if (this.transactionsChartRef && this.transactionsChartRef.nativeElement) {
      const ctx = this.transactionsChartRef.nativeElement.getContext('2d');
      this.tChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['دفعات', 'رسوم', 'مصروفات', 'عمولات'],
          datasets: [{
            label: 'عدد العمليات',
            data: [
              this.summary!.counts.payments || 0,
              this.summary!.counts.fees || 0,
              this.summary!.counts.expenses || 0,
              this.summary!.counts.commissions || 0
            ],
            backgroundColor: ['#a97a3c', '#1f6f56', '#a8434a', '#86602c'],
            borderRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                stepSize: 1,
                font: { family: 'IBM Plex Sans Arabic', size: 9 }
              }
            },
            x: {
              ticks: {
                font: { family: 'IBM Plex Sans Arabic', size: 9 }
              }
            }
          }
        }
      });
    }
  }

  // ==================== Navigation ====================
  goBack(): void {
    this.router.navigate(['/home']);
  }
}