// comprehensive-accounting.component.ts
import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// ==================== Interfaces ====================

interface User {
  id: string;
  username: string;
  role: string;
  fullName: string;
}

interface Student {
  _id: string;
  name: string;
  studentId: string;
  academicYear?: string;
  parentPhone?: string;
}

interface Class {
  _id: string;
  name: string;
  subject: string;
  price?: number;
  teacher?: any;
  students?: any[];
  paymentSystem?: string;
  roundSettings?: any;
  schedule?: any[];
}

interface Teacher {
  _id: string;
  name: string;
  phone?: string;
  email?: string;
  subjects?: string[];
  active?: boolean;
}

interface Transaction {
  _id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
  date: Date;
  student?: Student;
  class?: Class;
  teacher?: Teacher;
  recordedBy?: any;
  paymentMethod?: string;
  invoiceNumber?: string;
  status?: string;
  transactionType?: string;
}

interface PaymentTransaction extends Transaction {
  month?: string;
  monthCode?: string;
  paymentDate?: Date;
  isLate?: boolean;
}

interface TeacherCommission {
  _id: string;
  teacher: Teacher;
  student?: Student;
  class: Class;
  month: string;
  round?: string;
  amount: number;
  percentage: number;
  type: 'individual' | 'class';
  status: 'pending' | 'paid' | 'cancelled';
  paymentDate?: Date;
  paymentMethod?: string;
  receiptNumber?: string;
  recordedBy?: any;
  studentDetails?: Array<{
    student: Student;
    attendancesCount: number;
    teacherShare: number;
    includedInCommission: boolean;
  }>;
  notes?: string;
  createdAt?: Date;
}

interface RoundPayment {
  _id: string;
  student: Student;
  class?: Class;
  roundNumber: string;
  sessionCount: number;
  sessionPrice: number;
  totalAmount: number;
  startDate: Date;
  endDate: Date;
  status: 'pending' | 'paid' | 'cancelled';
  recordedBy?: any;
  notes?: string;
  sessions: Array<{
    sessionNumber: number;
    date: Date;
    status: string;
    price: number;
  }>;
}

interface DailyStats {
  date: string;
  income: number;
  expenses: number;
  profit: number;
  transactions: number;
}

interface MonthlyStats {
  month: string;
  monthName: string;
  year: number;
  income: number;
  expenses: number;
  profit: number;
  transactions: number;
  incomeBreakdown: {
    tuition: number;
    registration: number;
    other: number;
  };
  expenseBreakdown: {
    salaries: number;
    rent: number;
    utilities: number;
    supplies: number;
    other: number;
  };
}

interface YearlyStats {
  year: number;
  income: number;
  expenses: number;
  profit: number;
  transactions: number;
  months: MonthlyStats[];
}

interface FilterOptions {
  startDate: string;
  endDate: string;
  type: 'all' | 'income' | 'expense';
  category: string;
  search: string;
}

interface CategorySummary {
  category: string;
  amount: number;
  count: number;
  percentage: number;
}

interface CommissionSummary {
  totalPending: number;
  totalPaid: number;
  byTeacher: Array<{
    teacherId: string;
    teacherName: string;
    pending: number;
    paid: number;
    total: number;
  }>;
  byClass: Array<{
    classId: string;
    className: string;
    pending: number;
    paid: number;
    total: number;
  }>;
}

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  badge?: number;
}

@Component({
  selector: 'app-comprehensive-accounting',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="accounting-app" dir="rtl">
      <!-- Mobile Menu Toggle -->
      <div class="mobile-header" *ngIf="isMobileView">
        <button class="menu-toggle" (click)="toggleMobileMenu()">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
        <h2>النظام المحاسبي</h2>
        <div class="user-badge" (click)="toggleUserMenu()">
          <span>{{ currentUser?.fullName?.[0] || currentUser?.username?.[0] || 'U' }}</span>
        </div>
      </div>

      <!-- Sidebar Navigation -->
      <div class="sidebar" [class.mobile-open]="mobileMenuOpen">
        <div class="sidebar-header" *ngIf="!isMobileView">
          <h2>النظام المحاسبي</h2>
          <p>متكامل</p>
        </div>
        
        <div class="sidebar-menu">
          <button *ngFor="let item of menuItems" 
                  class="menu-item" 
                  [class.active]="activeTab === item.id"
                  (click)="setActiveTab(item.id)">
            <span class="menu-icon" [innerHTML]="item.icon"></span>
            <span class="menu-label">{{ item.label }}</span>
            <span class="menu-badge" *ngIf="item.badge">{{ item.badge }}</span>
          </button>
        </div>

        <div class="sidebar-footer" *ngIf="currentUser">
          <div class="user-info">
            <div class="user-avatar">{{ currentUser.fullName?.[0] || currentUser.username?.[0] || 'U' }}</div>
            <div class="user-details">
              <span class="user-name">{{ currentUser.fullName || currentUser.username }}</span>
              <span class="user-role">{{ getRoleName(currentUser.role) }}</span>
            </div>
          </div>
          <button class="refresh-btn" (click)="refreshAllData()" [disabled]="isLoading">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
              <path d="M21 3v5h-5"></path>
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
              <path d="M8 16H3v5"></path>
            </svg>
          </button>
        </div>
      </div>

      <!-- Main Content -->
      <div class="main-content" [class.sidebar-open]="!isMobileView || mobileMenuOpen">
        <!-- Loading Overlay -->
        <div class="loading-overlay" *ngIf="isLoading">
          <div class="spinner"></div>
          <p>جاري تحميل البيانات المالية...</p>
        </div>

        <!-- Content Area -->
        <div class="content-area">
          <!-- Overview Tab -->
          <div *ngIf="activeTab === 'overview'" class="tab-pane active">
            <!-- Header Stats -->
            <div class="stats-grid">
              <div class="stat-card income" (click)="filterByType('income')">
                <div class="stat-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="12" y1="1" x2="12" y2="23"></line>
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                  </svg>
                </div>
                <div class="stat-content">
                  <span class="stat-label">إجمالي الإيرادات</span>
                  <span class="stat-value">{{ formatCurrency(totalIncomeAllTime) }}</span>
                  <span class="stat-trend positive">+{{ formatCurrency(currentMonthIncome) }} هذا الشهر</span>
                </div>
              </div>

              <div class="stat-card expense" (click)="filterByType('expense')">
                <div class="stat-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="12" y1="1" x2="12" y2="23"></line>
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                  </svg>
                </div>
                <div class="stat-content">
                  <span class="stat-label">إجمالي المصروفات</span>
                  <span class="stat-value">{{ formatCurrency(totalExpensesAllTime) }}</span>
                  <span class="stat-trend negative">{{ formatCurrency(currentMonthExpenses) }} هذا الشهر</span>
                </div>
              </div>

              <div class="stat-card profit">
                <div class="stat-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="23 6 13.5 15.5 8 10 1 18"></polyline>
                    <polyline points="17 6 23 6 23 12"></polyline>
                  </svg>
                </div>
                <div class="stat-content">
                  <span class="stat-label">صافي الربح</span>
                  <span class="stat-value" [class.positive]="totalProfitAllTime >= 0" [class.negative]="totalProfitAllTime < 0">
                    {{ formatCurrency(totalProfitAllTime) }}
                  </span>
                  <span class="stat-trend">{{ formatCurrency(currentMonthProfit) }} هذا الشهر</span>
                </div>
              </div>

              <div class="stat-card transactions">
                <div class="stat-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                    <line x1="8" y1="21" x2="16" y2="21"></line>
                    <line x1="12" y1="17" x2="12" y2="21"></line>
                  </svg>
                </div>
                <div class="stat-content">
                  <span class="stat-label">المعاملات</span>
                  <span class="stat-value">{{ totalTransactionsAllTime }}</span>
                  <span class="stat-trend">{{ currentMonthTransactions }} هذا الشهر</span>
                </div>
              </div>
            </div>

            <!-- Year Selector with Same Style as Transactions -->
            <div class="filters-wrapper">
              <div class="filters-row">

                
                <div class="quick-stats-enhanced">
                  <div class="stat-badge income-badge" *ngIf="yearlyStats">
                    <span class="badge-label">إيرادات:</span>
                    <span class="badge-value positive">{{ formatCurrency(yearlyStats.income) }}</span>
                  </div>
                  <div class="stat-badge expense-badge" *ngIf="yearlyStats">
                    <span class="badge-label">مصروفات:</span>
                    <span class="badge-value negative">{{ formatCurrency(yearlyStats.expenses) }}</span>
                  </div>
                  <div class="stat-badge profit-badge" *ngIf="yearlyStats">
                    <span class="badge-label">صافي:</span>
                    <span class="badge-value" [class.positive]="yearlyStats.profit >= 0" [class.negative]="yearlyStats.profit < 0">
                      {{ formatCurrency(yearlyStats.profit) }}
                    </span>
                  </div>
                  <div class="stat-badge transactions-badge" *ngIf="yearlyStats">
                    <span class="badge-label">معاملات:</span>
                    <span class="badge-value">{{ yearlyStats.transactions }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Monthly Chart - Responsive -->
            <div class="chart-container">
              <h3>الإيرادات والمصروفات الشهرية - {{ selectedYear }}</h3>
              <div class="chart-wrapper">
                <div class="bar-chart">
                  <div *ngFor="let month of monthlyStats" class="chart-bar-group">
                    <div class="chart-bars">
                      <div class="bar income" 
                           [style.height.px]="getBarHeight(month.income)"
                           [style.backgroundColor]="'#4f46e5'">
                        <span class="bar-tooltip">{{ formatCurrency(month.income) }}</span>
                      </div>
                      <div class="bar expense" 
                           [style.height.px]="getBarHeight(month.expenses)"
                           [style.backgroundColor]="'#ef4444'">
                        <span class="bar-tooltip">{{ formatCurrency(month.expenses) }}</span>
                      </div>
                    </div>
                    <span class="bar-label">{{ month.monthName.substring(0, 3) }}</span>
                  </div>
                </div>
              </div>
              <div class="chart-legend">
                <span class="legend-item">
                  <span class="color-dot" style="background: #4f46e5;"></span>
                  الإيرادات
                </span>
                <span class="legend-item">
                  <span class="color-dot" style="background: #ef4444;"></span>
                  المصروفات
                </span>
              </div>
            </div>

            <!-- Summary Bar (Same Style as Transactions) -->
            <div class="summary-bar">
              <span>إجمالي السنة: <strong>{{ selectedYear }}</strong></span>
              <span>إيرادات: <strong class="positive">{{ formatCurrency(yearlyStats?.income || 0) }}</strong></span>
              <span>مصروفات: <strong class="negative">{{ formatCurrency(yearlyStats?.expenses || 0) }}</strong></span>
              <span>صافي: <strong [class.positive]="(yearlyStats?.profit || 0) >= 0" [class.negative]="(yearlyStats?.profit || 0) < 0">{{ formatCurrency(yearlyStats?.profit || 0) }}</strong></span>
              <span>المعاملات: <strong>{{ yearlyStats?.transactions || 0 }}</strong></span>
            </div>

            <!-- Monthly Summary - Responsive Table (Same Style as Transactions) -->
            <div class="table-container">
              <h3>تفاصيل الأشهر - {{ selectedYear }}</h3>
              <div class="table-responsive">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>الشهر</th>
                      <th>الإيرادات</th>
                      <th>المصروفات</th>
                      <th>صافي الربح</th>
                      <th>المعاملات</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let month of monthlyStats">
                      <td data-label="الشهر">{{ month.monthName }}</td>
                      <td data-label="الإيرادات" class="positive">{{ formatCurrency(month.income) }}</td>
                      <td data-label="المصروفات" class="negative">{{ formatCurrency(month.expenses) }}</td>
                      <td data-label="صافي الربح" [class.positive]="month.profit >= 0" [class.negative]="month.profit < 0">
                        {{ formatCurrency(month.profit) }}
                      </td>
                      <td data-label="المعاملات">{{ month.transactions }}</td>
                      <td>
                        <button class="btn-icon" (click)="viewMonthDetails(month)">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="3"></circle>
                            <path d="M22 12c-2.667 4.667-6 7-10 7s-7.333-2.333-10-7c2.667-4.667 6-7 10-7s7.333 2.333 10 7z"></path>
                          </svg>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr class="total-row">
                      <td data-label="المجموع">الإجمالي</td>
                      <td data-label="الإيرادات" class="positive">{{ formatCurrency(getYearlyTotal('income')) }}</td>
                      <td data-label="المصروفات" class="negative">{{ formatCurrency(getYearlyTotal('expenses')) }}</td>
                      <td data-label="صافي الربح" [class.positive]="getYearlyTotal('profit') >= 0" [class.negative]="getYearlyTotal('profit') < 0">
                        {{ formatCurrency(getYearlyTotal('profit')) }}
                      </td>
                      <td data-label="المعاملات">{{ getYearlyTotal('transactions') }}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <!-- Additional Breakdown Cards -->
            <div class="breakdown-grid" *ngIf="yearlyStats">
              <div class="breakdown-card">
                <h4>تفاصيل الإيرادات - {{ selectedYear }}</h4>
                <div class="breakdown-items">
                  <div class="breakdown-item">
                    <span class="item-label">رسوم دراسية</span>
                    <span class="item-value positive">{{ formatCurrency(getYearlyIncomeBreakdown('tuition')) }}</span>
                    <span class="item-percent">{{ getPercentage(getYearlyIncomeBreakdown('tuition'), yearlyStats.income) }}%</span>
                  </div>
                  <div class="breakdown-item">
                    <span class="item-label">رسوم تسجيل</span>
                    <span class="item-value positive">{{ formatCurrency(getYearlyIncomeBreakdown('registration')) }}</span>
                    <span class="item-percent">{{ getPercentage(getYearlyIncomeBreakdown('registration'), yearlyStats.income) }}%</span>
                  </div>
                  <div class="breakdown-item">
                    <span class="item-label">إيرادات أخرى</span>
                    <span class="item-value positive">{{ formatCurrency(getYearlyIncomeBreakdown('other')) }}</span>
                    <span class="item-percent">{{ getPercentage(getYearlyIncomeBreakdown('other'), yearlyStats.income) }}%</span>
                  </div>
                </div>
              </div>

              <div class="breakdown-card">
                <h4>تفاصيل المصروفات - {{ selectedYear }}</h4>
                <div class="breakdown-items">
                  <div class="breakdown-item">
                    <span class="item-label">رواتب</span>
                    <span class="item-value negative">{{ formatCurrency(getYearlyExpenseBreakdown('salaries')) }}</span>
                    <span class="item-percent">{{ getPercentage(getYearlyExpenseBreakdown('salaries'), yearlyStats.expenses) }}%</span>
                  </div>
                  <div class="breakdown-item">
                    <span class="item-label">إيجار</span>
                    <span class="item-value negative">{{ formatCurrency(getYearlyExpenseBreakdown('rent')) }}</span>
                    <span class="item-percent">{{ getPercentage(getYearlyExpenseBreakdown('rent'), yearlyStats.expenses) }}%</span>
                  </div>
                  <div class="breakdown-item">
                    <span class="item-label">مرافق</span>
                    <span class="item-value negative">{{ formatCurrency(getYearlyExpenseBreakdown('utilities')) }}</span>
                    <span class="item-percent">{{ getPercentage(getYearlyExpenseBreakdown('utilities'), yearlyStats.expenses) }}%</span>
                  </div>
                  <div class="breakdown-item">
                    <span class="item-label">مستلزمات</span>
                    <span class="item-value negative">{{ formatCurrency(getYearlyExpenseBreakdown('supplies')) }}</span>
                    <span class="item-percent">{{ getPercentage(getYearlyExpenseBreakdown('supplies'), yearlyStats.expenses) }}%</span>
                  </div>
                  <div class="breakdown-item">
                    <span class="item-label">أخرى</span>
                    <span class="item-value negative">{{ formatCurrency(getYearlyExpenseBreakdown('other')) }}</span>
                    <span class="item-percent">{{ getPercentage(getYearlyExpenseBreakdown('other'), yearlyStats.expenses) }}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Monthly Tab -->
          <div *ngIf="activeTab === 'monthly'" class="tab-pane active">
            <div class="section-header">
              <h2>التقرير الشهري المفصل</h2>
              <div class="month-selector">
                <select [(ngModel)]="selectedMonth" (change)="loadMonthDetails()" class="month-select">
                  <option *ngFor="let month of monthOptions" [value]="month.value">{{ month.name }}</option>
                </select>
              </div>
            </div>

            <div *ngIf="selectedMonthStats" class="month-details">
              <!-- Mini Stats -->
              <div class="mini-stats-grid">
                <div class="mini-stat">
                  <span class="mini-label">إيرادات الشهر</span>
                  <span class="mini-value positive">{{ formatCurrency(selectedMonthStats.income) }}</span>
                </div>
                <div class="mini-stat">
                  <span class="mini-label">مصروفات الشهر</span>
                  <span class="mini-value negative">{{ formatCurrency(selectedMonthStats.expenses) }}</span>
                </div>
                <div class="mini-stat">
                  <span class="mini-label">صافي الشهر</span>
                  <span class="mini-value" [class.positive]="selectedMonthStats.profit >= 0" [class.negative]="selectedMonthStats.profit < 0">
                    {{ formatCurrency(selectedMonthStats.profit) }}
                  </span>
                </div>
              </div>

              <!-- Breakdown Cards -->
              <div class="breakdown-grid">
                <div class="breakdown-card">
                  <h4>تفاصيل الإيرادات</h4>
                  <div class="breakdown-items">
                    <div class="breakdown-item">
                      <span class="item-label">رسوم دراسية</span>
                      <span class="item-value positive">{{ formatCurrency(selectedMonthStats.incomeBreakdown.tuition) }}</span>
                      <span class="item-percent">{{ getPercentage(selectedMonthStats.incomeBreakdown.tuition, selectedMonthStats.income) }}%</span>
                    </div>
                    <div class="breakdown-item">
                      <span class="item-label">رسوم تسجيل</span>
                      <span class="item-value positive">{{ formatCurrency(selectedMonthStats.incomeBreakdown.registration) }}</span>
                      <span class="item-percent">{{ getPercentage(selectedMonthStats.incomeBreakdown.registration, selectedMonthStats.income) }}%</span>
                    </div>
                    <div class="breakdown-item">
                      <span class="item-label">إيرادات أخرى</span>
                      <span class="item-value positive">{{ formatCurrency(selectedMonthStats.incomeBreakdown.other) }}</span>
                      <span class="item-percent">{{ getPercentage(selectedMonthStats.incomeBreakdown.other, selectedMonthStats.income) }}%</span>
                    </div>
                  </div>
                </div>

                <div class="breakdown-card">
                  <h4>تفاصيل المصروفات</h4>
                  <div class="breakdown-items">
                    <div class="breakdown-item">
                      <span class="item-label">رواتب</span>
                      <span class="item-value negative">{{ formatCurrency(selectedMonthStats.expenseBreakdown.salaries) }}</span>
                      <span class="item-percent">{{ getPercentage(selectedMonthStats.expenseBreakdown.salaries, selectedMonthStats.expenses) }}%</span>
                    </div>
                    <div class="breakdown-item">
                      <span class="item-label">إيجار</span>
                      <span class="item-value negative">{{ formatCurrency(selectedMonthStats.expenseBreakdown.rent) }}</span>
                      <span class="item-percent">{{ getPercentage(selectedMonthStats.expenseBreakdown.rent, selectedMonthStats.expenses) }}%</span>
                    </div>
                    <div class="breakdown-item">
                      <span class="item-label">مرافق</span>
                      <span class="item-value negative">{{ formatCurrency(selectedMonthStats.expenseBreakdown.utilities) }}</span>
                      <span class="item-percent">{{ getPercentage(selectedMonthStats.expenseBreakdown.utilities, selectedMonthStats.expenses) }}%</span>
                    </div>
                    <div class="breakdown-item">
                      <span class="item-label">مستلزمات</span>
                      <span class="item-value negative">{{ formatCurrency(selectedMonthStats.expenseBreakdown.supplies) }}</span>
                      <span class="item-percent">{{ getPercentage(selectedMonthStats.expenseBreakdown.supplies, selectedMonthStats.expenses) }}%</span>
                    </div>
                    <div class="breakdown-item">
                      <span class="item-label">أخرى</span>
                      <span class="item-value negative">{{ formatCurrency(selectedMonthStats.expenseBreakdown.other) }}</span>
                      <span class="item-percent">{{ getPercentage(selectedMonthStats.expenseBreakdown.other, selectedMonthStats.expenses) }}%</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Daily Transactions -->
              <div class="transactions-section">
                <h4>معاملات الشهر</h4>
                <div class="search-box">
                  <input type="text" placeholder="بحث..." [(ngModel)]="monthlySearchTerm" class="search-input">
                </div>
                <div class="table-responsive">
                  <table class="data-table compact">
                    <thead>
                      <tr>
                        <th>التاريخ</th>
                        <th>النوع</th>
                        <th>الوصف</th>
                        <th>التصنيف</th>
                        <th>المبلغ</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let trans of filteredMonthlyTransactions | slice:0:10">
                        <td data-label="التاريخ">{{ getFormattedDate(trans.date) }}</td>
                        <td data-label="النوع">
                          <span class="badge" [class.badge-income]="trans.type === 'income'" [class.badge-expense]="trans.type === 'expense'">
                            {{ trans.type === 'income' ? 'إيراد' : 'مصروف' }}
                          </span>
                        </td>
                        <td data-label="الوصف">{{ trans.description }}</td>
                        <td data-label="التصنيف">{{ getCategoryName(trans.category) }}</td>
                        <td data-label="المبلغ" [class.positive]="trans.type === 'income'" [class.negative]="trans.type === 'expense'">
                          {{ formatCurrency(trans.amount) }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <!-- Transactions Tab -->
          <div *ngIf="activeTab === 'transactions'" class="tab-pane active">
            <div class="section-header">
              <h2>جميع المعاملات المالية</h2>
              <button class="btn-export" (click)="exportToExcel()">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                تصدير
              </button>
            </div>

            <!-- Filters -->
            <div class="filters-wrapper">
              <div class="filters-row">
                <select [(ngModel)]="filters.type" (change)="applyFilters()" class="filter-select">
                  <option value="all">جميع المعاملات</option>
                  <option value="income">الإيرادات</option>
                  <option value="expense">المصروفات</option>
                </select>
                
                <select [(ngModel)]="filters.category" (change)="applyFilters()" class="filter-select">
                  <option value="all">جميع التصنيفات</option>
                  <option value="tuition">رسوم دراسية</option>
                  <option value="registration">رسوم تسجيل</option>
                  <option value="salary">رواتب</option>
                  <option value="rent">إيجار</option>
                  <option value="utilities">مرافق</option>
                  <option value="supplies">مستلزمات</option>
                  <option value="other">أخرى</option>
                </select>
                
                <input type="date" [(ngModel)]="filters.startDate" (change)="applyFilters()" class="filter-input">
                <span class="filter-sep">إلى</span>
                <input type="date" [(ngModel)]="filters.endDate" (change)="applyFilters()" class="filter-input">
              </div>
              
              <div class="search-wrapper">
                <input type="text" placeholder="بحث..." [(ngModel)]="filters.search" (keyup)="applyFilters()" class="search-input">
              </div>
            </div>

            <!-- Summary -->
            <div class="summary-bar">
              <span>إجمالي المعروض: <strong>{{ filteredTransactions.length }}</strong></span>
              <span>إيرادات: <strong class="positive">{{ formatCurrency(filteredIncomeTotal) }}</strong></span>
              <span>مصروفات: <strong class="negative">{{ formatCurrency(filteredExpenseTotal) }}</strong></span>
              <span>صافي: <strong [class.positive]="filteredProfit >= 0" [class.negative]="filteredProfit < 0">{{ formatCurrency(filteredProfit) }}</strong></span>
            </div>

            <!-- Transactions Table - Responsive -->
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>التاريخ</th>
                    <th>النوع</th>
                    <th>الوصف</th>
                    <th>التصنيف</th>
                    <th>المبلغ</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let trans of paginatedTransactions">
                    <td data-label="التاريخ">{{ getFormattedDate(trans.date) }}</td>
                    <td data-label="النوع">
                      <span class="badge" [class.badge-income]="trans.type === 'income'" [class.badge-expense]="trans.type === 'expense'">
                        {{ trans.type === 'income' ? 'إيراد' : 'مصروف' }}
                      </span>
                    </td>
                    <td data-label="الوصف">{{ trans.description }}</td>
                    <td data-label="التصنيف">{{ getCategoryName(trans.category) }}</td>
                    <td data-label="المبلغ" [class.positive]="trans.type === 'income'" [class.negative]="trans.type === 'expense'">
                      {{ formatCurrency(trans.amount) }}
                    </td>
                    <td>
                      <button class="btn-icon" (click)="viewTransactionDetails(trans)">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <circle cx="12" cy="12" r="3"></circle>
                          <path d="M22 12c-2.667 4.667-6 7-10 7s-7.333-2.333-10-7c2.667-4.667 6-7 10-7s7.333 2.333 10 7z"></path>
                        </svg>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Pagination -->
            <div class="pagination" *ngIf="filteredTransactions.length > pageSize">
              <button (click)="previousPage()" [disabled]="currentPage === 1">السابق</button>
              <span>صفحة {{ currentPage }} من {{ totalPages }}</span>
              <button (click)="nextPage()" [disabled]="currentPage === totalPages">التالي</button>
            </div>
          </div>

          <!-- Categories Tab -->
          <div *ngIf="activeTab === 'categories'" class="tab-pane active">
            <div class="section-header">
              <h2>تحليل الفئات</h2>
              <select [(ngModel)]="analysisYear" (change)="loadCategoryAnalysis()" class="year-select small">
                <option *ngFor="let year of availableYears" [value]="year">{{ year }}</option>
              </select>
            </div>

            <div class="categories-grid">
              <!-- Income Categories -->
              <div class="category-card">
                <h3>الإيرادات حسب الفئة</h3>
                <div class="category-list">
                  <div *ngFor="let cat of incomeCategories" class="category-item">
                    <div class="category-header">
                      <span>{{ getCategoryName(cat.category) }}</span>
                      <span class="positive">{{ formatCurrency(cat.amount) }}</span>
                    </div>
                    <div class="progress-bar">
                      <div class="progress-fill" [style.width.%]="cat.percentage" style="background: #4f46e5;"></div>
                    </div>
                    <div class="category-footer">
                      <span>{{ cat.count }} معاملة</span>
                      <span>{{ cat.percentage.toFixed(1) }}%</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Expense Categories -->
              <div class="category-card">
                <h3>المصروفات حسب الفئة</h3>
                <div class="category-list">
                  <div *ngFor="let cat of expenseCategories" class="category-item">
                    <div class="category-header">
                      <span>{{ getCategoryName(cat.category) }}</span>
                      <span class="negative">{{ formatCurrency(cat.amount) }}</span>
                    </div>
                    <div class="progress-bar">
                      <div class="progress-fill" [style.width.%]="cat.percentage" style="background: #ef4444;"></div>
                    </div>
                    <div class="category-footer">
                      <span>{{ cat.count }} معاملة</span>
                      <span>{{ cat.percentage.toFixed(1) }}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Commissions Tab -->
          <div *ngIf="activeTab === 'commissions'" class="tab-pane active">
            <div class="section-header">
              <h2>عمولات الأساتذة</h2>
              <div class="header-actions">
                <button class="btn-primary" (click)="openTeacherCommissionModal('add')">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  جديد
                </button>
                <button class="btn-success" (click)="generateMonthlyCommissions()">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                  </svg>
                  إنشاء
                </button>
              </div>
            </div>

            <!-- Commission Stats -->
            <div class="stats-mini-grid">
              <div class="stat-mini-card pending">
                <span class="stat-mini-label">معلق</span>
                <span class="stat-mini-value">{{ formatCurrency(commissionSummary.totalPending) }}</span>
              </div>
              <div class="stat-mini-card paid">
                <span class="stat-mini-label">مدفوع</span>
                <span class="stat-mini-value">{{ formatCurrency(commissionSummary.totalPaid) }}</span>
              </div>
              <div class="stat-mini-card total">
                <span class="stat-mini-label">إجمالي</span>
                <span class="stat-mini-value">{{ formatCurrency(commissionSummary.totalPending + commissionSummary.totalPaid) }}</span>
              </div>
            </div>

            <!-- Filters -->
            <div class="filters-compact">
              <select [(ngModel)]="commissionFilters.teacherId" (change)="applyCommissionFilters()" class="filter-select small">
                <option value="">جميع الأساتذة</option>
                <option *ngFor="let teacher of teachersList" [value]="teacher._id">{{ teacher.name }}</option>
              </select>

              <select [(ngModel)]="commissionFilters.month" (change)="applyCommissionFilters()" class="filter-select small">
                <option value="">جميع الأشهر</option>
                <option *ngFor="let month of monthsList" [value]="month.value">{{ month.name }}</option>
              </select>

              <select [(ngModel)]="commissionFilters.status" (change)="applyCommissionFilters()" class="filter-select small">
                <option value="">الكل</option>
                <option value="pending">معلق</option>
                <option value="paid">مدفوع</option>
              </select>
            </div>

            <!-- Commissions List - Responsive Grid -->
            <div class="commissions-list">
              <div *ngFor="let commission of filteredTeacherCommissions" class="commission-card">
                <div class="commission-header">
                  <span class="teacher-name">{{ commission.teacher?.name || 'غير محدد' }}</span>
                  <span class="commission-status" [class.status-pending]="commission.status === 'pending'"
                                                     [class.status-paid]="commission.status === 'paid'">
                    {{ commission.status === 'pending' ? 'معلق' : 'مدفوع' }}
                  </span>
                </div>
                <div class="commission-body">
                  <div class="commission-detail">
                    <span>الحصة:</span>
                    <strong>{{ commission.class?.name || 'غير محدد' }}</strong>
                  </div>
                  <div class="commission-detail">
                    <span>الشهر:</span>
                    <strong>{{ commission.month }}</strong>
                  </div>
                  <div class="commission-detail">
                    <span>المبلغ:</span>
                    <strong [class.negative]="commission.status === 'pending'" 
                            [class.positive]="commission.status === 'paid'">
                      {{ formatCurrency(commission.amount) }}
                    </strong>
                  </div>
                </div>
                <div class="commission-footer">
                  <button *ngIf="commission.status === 'pending'" 
                          class="btn-pay" 
                          (click)="payTeacherCommission(commission._id)">
                    دفع
                  </button>
                  <button class="btn-view" (click)="viewCommissionDetails(commission)">
                    عرض
                  </button>
                </div>
              </div>
            </div>

            <!-- Teacher Summary - Responsive -->
            <div class="teacher-summary">
              <h3>ملخص العمولات</h3>
              <div class="teacher-summary-list">
                <div *ngFor="let teacher of commissionSummary.byTeacher" class="teacher-summary-item">
                  <span class="teacher-name">{{ teacher.teacherName }}</span>
                  <div class="teacher-amounts">
                    <span class="pending-amount">{{ formatCurrency(teacher.pending) }}</span>
                    <span class="paid-amount">{{ formatCurrency(teacher.paid) }}</span>
                    <span class="total-amount">{{ formatCurrency(teacher.total) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Modals -->
      
      <!-- Transaction Details Modal -->
      <div class="modal-overlay" *ngIf="showTransactionModal" (click)="closeModal($event)">
        <div class="modal-content small" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>تفاصيل المعاملة</h3>
            <button class="close-btn" (click)="showTransactionModal = false">&times;</button>
          </div>
          <div class="modal-body">
            <div *ngIf="selectedTransaction" class="details-list">
              <div class="detail-item">
                <span class="detail-label">النوع:</span>
                <span class="detail-value">
                  <span class="badge" [class.badge-income]="selectedTransaction.type === 'income'" [class.badge-expense]="selectedTransaction.type === 'expense'">
                    {{ selectedTransaction.type === 'income' ? 'إيراد' : 'مصروف' }}
                  </span>
                </span>
              </div>
              <div class="detail-item">
                <span class="detail-label">التاريخ:</span>
                <span class="detail-value">{{ getFormattedDateTime(selectedTransaction.date) }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">الوصف:</span>
                <span class="detail-value">{{ selectedTransaction.description }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">التصنيف:</span>
                <span class="detail-value">{{ getCategoryName(selectedTransaction.category) }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">المبلغ:</span>
                <span class="detail-value" [class.positive]="selectedTransaction.type === 'income'" [class.negative]="selectedTransaction.type === 'expense'">
                  {{ formatCurrency(selectedTransaction.amount) }}
                </span>
              </div>
              <div class="detail-item" *ngIf="selectedTransaction.student">
                <span class="detail-label">الطالب:</span>
                <span class="detail-value">{{ selectedTransaction.student.name }}</span>
              </div>
              <div class="detail-item" *ngIf="selectedTransaction.teacher">
                <span class="detail-label">الأستاذ:</span>
                <span class="detail-value">{{ selectedTransaction.teacher.name }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Teacher Commission Modal -->
      <div class="modal-overlay" *ngIf="showTeacherCommissionModal" (click)="closeTeacherCommissionModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>{{ teacherCommissionMode === 'add' ? 'إضافة عمولة' : 'تعديل العمولة' }}</h3>
            <button class="close-btn" (click)="closeTeacherCommissionModal()">&times;</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>الأستاذ <span class="required">*</span></label>
              <select [(ngModel)]="teacherCommissionForm.teacherId" class="form-control">
                <option value="">اختر الأستاذ</option>
                <option *ngFor="let teacher of teachersList" [value]="teacher._id">{{ teacher.name }}</option>
              </select>
            </div>

            <div class="form-group">
              <label>الحصة <span class="required">*</span></label>
              <select [(ngModel)]="teacherCommissionForm.classId" (change)="onClassChange()" class="form-control">
                <option value="">اختر الحصة</option>
                <option *ngFor="let class of classesList" [value]="class._id">{{ class.name }}</option>
              </select>
            </div>

            <div class="form-group">
              <label>الشهر <span class="required">*</span></label>
              <input type="month" [(ngModel)]="teacherCommissionForm.month" class="form-control">
            </div>

            <div class="form-row">
              <div class="form-group half">
                <label>النسبة (%)</label>
                <input type="number" [(ngModel)]="teacherCommissionForm.percentage" (change)="calculateCommission()" class="form-control" min="0" max="100">
              </div>
              <div class="form-group half">
                <label>المبلغ</label>
                <input type="number" [(ngModel)]="teacherCommissionForm.amount" class="form-control" readonly>
              </div>
            </div>

            <div class="form-group">
              <label>ملاحظات</label>
              <textarea [(ngModel)]="teacherCommissionForm.notes" class="form-control" rows="2"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" (click)="closeTeacherCommissionModal()">إلغاء</button>
            <button class="btn-save" (click)="saveTeacherCommission()" [disabled]="isLoading">
              {{ isLoading ? 'جاري...' : 'حفظ' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* ==================== Global Styles ==================== */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    .accounting-app {
      display: flex;
      min-height: 100vh;
      background: #f8fafc;
      color: #1e293b;
      width: 100%;
      overflow-x: hidden;
    }

    /* ==================== Sidebar Styles ==================== */
    .sidebar {
      width: 280px;
      background: white;
      border-left: 1px solid #e2e8f0;
      display: flex;
      flex-direction: column;
      transition: all 0.3s ease;
      position: fixed;
      right: 0;
      top: 0;
      bottom: 0;
      z-index: 50;
      box-shadow: -2px 0 8px rgba(0, 0, 0, 0.02);
    }

    .sidebar-header {
      padding: 24px 20px;
      border-bottom: 1px solid #e2e8f0;
    }

    .sidebar-header h2 {
      font-size: 20px;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 4px;
    }

    .sidebar-header p {
      font-size: 13px;
      color: #64748b;
    }

    .sidebar-menu {
      flex: 1;
      padding: 20px 12px;
      overflow-y: auto;
    }

    .menu-item {
      display: flex;
      align-items: center;
      width: 100%;
      padding: 12px 16px;
      margin-bottom: 4px;
      border: none;
      background: transparent;
      border-radius: 10px;
      color: #64748b;
      font-size: 14px;
      font-weight: 500;
      text-align: right;
      cursor: pointer;
      transition: all 0.2s;
    }

    .menu-item:hover {
      background: #f1f5f9;
      color: #334155;
    }

    .menu-item.active {
      background: #4f46e5;
      color: white;
    }

    .menu-icon {
      margin-left: 12px;
      display: flex;
      align-items: center;
    }

    .menu-icon svg {
      width: 20px;
      height: 20px;
    }

    .menu-label {
      flex: 1;
    }

    .menu-badge {
      background: #ef4444;
      color: white;
      font-size: 11px;
      padding: 2px 6px;
      border-radius: 12px;
    }

    .sidebar-footer {
      padding: 20px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .user-avatar {
      width: 40px;
      height: 40px;
      background: #4f46e5;
      color: white;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 16px;
    }

    .user-details {
      display: flex;
      flex-direction: column;
    }

    .user-name {
      font-size: 14px;
      font-weight: 600;
      color: #1e293b;
    }

    .user-role {
      font-size: 12px;
      color: #64748b;
    }

    .refresh-btn {
      width: 36px;
      height: 36px;
      border: 1px solid #e2e8f0;
      background: white;
      border-radius: 8px;
      color: #64748b;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }

    .refresh-btn:hover:not(:disabled) {
      background: #f1f5f9;
      color: #334155;
    }

    .refresh-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* ==================== Mobile Header ==================== */
    .mobile-header {
      display: none;
      position: fixed;
      top: 0;
      right: 0;
      left: 0;
      height: 60px;
      background: white;
      border-bottom: 1px solid #e2e8f0;
      padding: 0 16px;
      align-items: center;
      justify-content: space-between;
      z-index: 45;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
    }

    .mobile-header h2 {
      font-size: 18px;
      font-weight: 600;
      color: #1e293b;
    }

    .menu-toggle, .user-badge {
      width: 40px;
      height: 40px;
      border: none;
      background: transparent;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: #64748b;
    }

    .user-badge span {
      width: 32px;
      height: 32px;
      background: #4f46e5;
      color: white;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
    }

    /* ==================== Main Content ==================== */
    .main-content {
      flex: 1;
      margin-right: 280px;
      padding: 24px;
      transition: margin-right 0.3s ease;
      min-height: 100vh;
      width: calc(100% - 280px);
      overflow-x: hidden;
    }

    .content-area {
      max-width: 1400px;
      margin: 0 auto;
      width: 100%;
    }

    /* ==================== Loading Overlay ==================== */
    .loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255, 255, 255, 0.9);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 100;
      backdrop-filter: blur(4px);
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #e2e8f0;
      border-top-color: #4f46e5;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin-bottom: 16px;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* ==================== Stats Grid ==================== */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      margin-bottom: 24px;
    }

    .stat-card {
      background: white;
      border-radius: 16px;
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
      cursor: pointer;
      transition: all 0.2s;
      border: 1px solid #e2e8f0;
    }

    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
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

    .stat-card.income .stat-icon {
      background: #eef2ff;
      color: #4f46e5;
    }

    .stat-card.expense .stat-icon {
      background: #fef2f2;
      color: #ef4444;
    }

    .stat-card.profit .stat-icon {
      background: #f0f9ff;
      color: #0ea5e9;
    }

    .stat-card.transactions .stat-icon {
      background: #faf5ff;
      color: #a855f7;
    }

    .stat-content {
      flex: 1;
      min-width: 0;
    }

    .stat-label {
      display: block;
      font-size: 14px;
      color: #64748b;
      margin-bottom: 4px;
    }

    .stat-value {
      display: block;
      font-size: 24px;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 4px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .stat-trend {
      font-size: 12px;
      color: #64748b;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .stat-trend.positive {
      color: #10b981;
    }

    .stat-trend.negative {
      color: #ef4444;
    }

    /* ==================== Enhanced Filters for Overview ==================== */
    .filters-wrapper {
      background: white;
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 20px;
      border: 1px solid #e2e8f0;
    }

    .filters-row {
      display: flex;
      gap: 20px;
      flex-wrap: wrap;
      align-items: center;
    }

    .filter-group {
      display: flex;
      align-items: center;
      gap: 10px;
      background: #f8fafc;
      padding: 6px 12px;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }

    .filter-label {
      font-size: 14px;
      font-weight: 500;
      color: #64748b;
    }

    .filter-select {
      padding: 8px 12px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      font-size: 14px;
      background: white;
      min-width: 140px;
    }

    .filter-select.small {
      min-width: 120px;
      padding: 6px 10px;
    }

    .filter-select.year-select-enhanced {
      min-width: 100px;
      background: white;
      font-weight: 500;
      color: #4f46e5;
      border-color: #4f46e5;
    }

    .filter-sep {
      color: #64748b;
      font-size: 14px;
    }

    .quick-stats-enhanced {
      display: flex;
      gap: 15px;
      flex-wrap: wrap;
      flex: 1;
      justify-content: flex-end;
    }

    .stat-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 12px;
      background: #f8fafc;
      border-radius: 20px;
      border: 1px solid #e2e8f0;
      font-size: 13px;
    }

    .stat-badge.income-badge {
      border-right: 3px solid #10b981;
    }

    .stat-badge.expense-badge {
      border-right: 3px solid #ef4444;
    }

    .stat-badge.profit-badge {
      border-right: 3px solid #4f46e5;
    }

    .stat-badge.transactions-badge {
      border-right: 3px solid #f59e0b;
    }

    .badge-label {
      color: #64748b;
    }

    .badge-value {
      font-weight: 600;
    }

    .badge-value.positive {
      color: #10b981;
    }

    .badge-value.negative {
      color: #ef4444;
    }

    /* ==================== Chart Container ==================== */
    .chart-container {
      background: white;
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 24px;
      border: 1px solid #e2e8f0;
    }

    .chart-container h3 {
      font-size: 16px;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 20px;
    }

    .chart-wrapper {
      width: 100%;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      padding-bottom: 8px;
    }

    .bar-chart {
      display: flex;
      align-items: flex-end;
      gap: 16px;
      height: 220px;
      min-width: 600px;
      padding: 0 8px;
    }

    .chart-bar-group {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }

    .chart-bars {
      display: flex;
      gap: 4px;
      height: 180px;
      align-items: flex-end;
    }

    .bar {
      width: 30px;
      border-radius: 6px 6px 0 0;
      position: relative;
      transition: height 0.3s;
      min-height: 4px;
    }

    .bar:hover .bar-tooltip {
      display: block;
    }

    .bar-tooltip {
      display: none;
      position: absolute;
      top: -30px;
      left: 50%;
      transform: translateX(-50%);
      background: #1e293b;
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      white-space: nowrap;
      z-index: 10;
    }

    .bar-label {
      font-size: 11px;
      color: #64748b;
    }

    .chart-legend {
      display: flex;
      justify-content: center;
      gap: 24px;
      margin-top: 16px;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: #64748b;
    }

    .color-dot {
      width: 12px;
      height: 12px;
      border-radius: 3px;
    }

    /* ==================== Summary Bar ==================== */
    .summary-bar {
      background: #f8fafc;
      border-radius: 8px;
      padding: 12px 16px;
      margin-bottom: 16px;
      display: flex;
      gap: 24px;
      font-size: 14px;
      flex-wrap: wrap;
      border: 1px solid #e2e8f0;
    }

    .summary-bar span {
      color: #64748b;
    }

    .summary-bar strong {
      margin-right: 4px;
      color: #1e293b;
    }

    /* ==================== Table Container ==================== */
    .table-container {
      background: white;
      border-radius: 16px;
      padding: 24px;
      border: 1px solid #e2e8f0;
      margin-bottom: 24px;
    }

    .table-container h3 {
      font-size: 16px;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 16px;
    }

    .table-responsive {
      width: 100%;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
      min-width: 600px;
    }

    .data-table th {
      text-align: right;
      padding: 12px;
      background: #f8fafc;
      color: #64748b;
      font-weight: 500;
      border-bottom: 1px solid #e2e8f0;
    }

    .data-table td {
      padding: 12px;
      border-bottom: 1px solid #f1f5f9;
      color: #1e293b;
    }

    .data-table tbody tr:hover {
      background: #f8fafc;
    }

    .data-table tfoot tr.total-row {
      background: #f1f5f9;
      font-weight: 600;
    }

    .data-table tfoot tr.total-row td {
      border-top: 2px solid #e2e8f0;
    }

    .data-table .clickable {
      cursor: pointer;
    }

    .data-table.compact td {
      padding: 8px 12px;
    }

    /* ==================== Badges ==================== */
    .badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 500;
    }

    .badge-income {
      background: #eef2ff;
      color: #4f46e5;
    }

    .badge-expense {
      background: #fef2f2;
      color: #ef4444;
    }

    /* ==================== Section Header ==================== */
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      flex-wrap: wrap;
      gap: 12px;
    }

    .section-header h2 {
      font-size: 20px;
      font-weight: 600;
      color: #1e293b;
    }

    .header-actions {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    .btn-primary, .btn-success {
      padding: 10px 16px;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;
    }

    .btn-primary {
      background: #4f46e5;
      color: white;
    }

    .btn-primary:hover {
      background: #4338ca;
    }

    .btn-success {
      background: #10b981;
      color: white;
    }

    .btn-success:hover {
      background: #059669;
    }

    .btn-export {
      padding: 8px 16px;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      font-size: 14px;
      color: #64748b;
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-export:hover {
      background: #f8fafc;
      color: #334155;
    }

    /* ==================== Search Input ==================== */
    .search-wrapper {
      width: 100%;
    }

    .search-input {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      font-size: 14px;
      background: white;
    }

    /* ==================== Pagination ==================== */
    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 16px;
      margin-top: 20px;
      flex-wrap: wrap;
    }

    .pagination button {
      padding: 8px 20px;
      border: 1px solid #e2e8f0;
      background: white;
      border-radius: 6px;
      font-size: 14px;
      color: #64748b;
      cursor: pointer;
      transition: all 0.2s;
    }

    .pagination button:hover:not(:disabled) {
      background: #f8fafc;
      color: #334155;
    }

    .pagination button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* ==================== Monthly Tab Styles ==================== */
    .month-selector {
      margin-bottom: 20px;
    }

    .month-select {
      padding: 10px 16px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      font-size: 14px;
      background: white;
      min-width: 200px;
    }

    .month-details {
      background: white;
      border-radius: 16px;
      padding: 24px;
      border: 1px solid #e2e8f0;
    }

    .mini-stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }

    .mini-stat {
      background: #f8fafc;
      border-radius: 10px;
      padding: 16px;
      text-align: center;
    }

    .mini-label {
      display: block;
      font-size: 13px;
      color: #64748b;
      margin-bottom: 8px;
    }

    .mini-value {
      display: block;
      font-size: 20px;
      font-weight: 600;
    }

    .breakdown-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      margin-bottom: 24px;
    }

    .breakdown-card {
      background: #f8fafc;
      border-radius: 12px;
      padding: 16px;
    }

    .breakdown-card h4 {
      font-size: 15px;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 16px;
    }

    .breakdown-items {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .breakdown-item {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .item-label {
      flex: 1;
      font-size: 14px;
      color: #64748b;
      min-width: 100px;
    }

    .item-value {
      font-weight: 600;
      min-width: 100px;
      text-align: left;
    }

    .item-percent {
      font-size: 12px;
      color: #64748b;
      min-width: 50px;
      text-align: left;
    }

    .transactions-section {
      margin-top: 20px;
    }

    .transactions-section h4 {
      font-size: 16px;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 16px;
    }

    .search-box {
      margin-bottom: 16px;
    }

    /* ==================== Categories Tab ==================== */
    .categories-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
    }

    .category-card {
      background: white;
      border-radius: 16px;
      padding: 20px;
      border: 1px solid #e2e8f0;
    }

    .category-card h3 {
      font-size: 16px;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 20px;
    }

    .category-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .category-item {
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 12px;
    }

    .category-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 14px;
      flex-wrap: wrap;
      gap: 8px;
    }

    .progress-bar {
      height: 6px;
      background: #f1f5f9;
      border-radius: 3px;
      margin-bottom: 6px;
    }

    .progress-fill {
      height: 100%;
      border-radius: 3px;
      transition: width 0.3s;
    }

    .category-footer {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: #64748b;
    }

    /* ==================== Commissions Tab ==================== */
    .stats-mini-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-bottom: 20px;
    }

    .stat-mini-card {
      background: white;
      border-radius: 12px;
      padding: 16px;
      text-align: center;
      border: 1px solid #e2e8f0;
    }

    .stat-mini-card.pending {
      border-right: 4px solid #f59e0b;
    }

    .stat-mini-card.paid {
      border-right: 4px solid #10b981;
    }

    .stat-mini-card.total {
      border-right: 4px solid #4f46e5;
    }

    .stat-mini-label {
      display: block;
      font-size: 13px;
      color: #64748b;
      margin-bottom: 6px;
    }

    .stat-mini-value {
      display: block;
      font-size: 18px;
      font-weight: 600;
      color: #1e293b;
    }

    .filters-compact {
      display: flex;
      gap: 10px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }

    .commissions-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .commission-card {
      background: white;
      border-radius: 12px;
      padding: 16px;
      border: 1px solid #e2e8f0;
      transition: all 0.2s;
    }

    .commission-card:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    }

    .commission-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      flex-wrap: wrap;
      gap: 8px;
    }

    .teacher-name {
      font-weight: 600;
      color: #1e293b;
    }

    .commission-status {
      font-size: 12px;
      padding: 4px 8px;
      border-radius: 20px;
    }

    .commission-status.status-pending {
      background: #fef3c7;
      color: #b45309;
    }

    .commission-status.status-paid {
      background: #d1fae5;
      color: #059669;
    }

    .commission-body {
      margin-bottom: 16px;
    }

    .commission-detail {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      font-size: 14px;
      border-bottom: 1px dashed #f1f5f9;
      flex-wrap: wrap;
      gap: 8px;
    }

    .commission-detail span {
      color: #64748b;
    }

    .commission-detail strong {
      color: #1e293b;
    }

    .commission-footer {
      display: flex;
      gap: 8px;
    }

    .btn-pay, .btn-view {
      flex: 1;
      padding: 8px;
      border: none;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-pay {
      background: #10b981;
      color: white;
    }

    .btn-pay:hover {
      background: #059669;
    }

    .btn-view {
      background: #f1f5f9;
      color: #64748b;
    }

    .btn-view:hover {
      background: #e2e8f0;
    }

    .teacher-summary {
      background: white;
      border-radius: 16px;
      padding: 20px;
      border: 1px solid #e2e8f0;
    }

    .teacher-summary h3 {
      font-size: 16px;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 16px;
    }

    .teacher-summary-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .teacher-summary-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 0;
      border-bottom: 1px solid #f1f5f9;
      flex-wrap: wrap;
      gap: 10px;
    }

    .teacher-amounts {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }

    .pending-amount {
      color: #f59e0b;
      font-weight: 500;
    }

    .paid-amount {
      color: #10b981;
      font-weight: 500;
    }

    .total-amount {
      color: #4f46e5;
      font-weight: 600;
    }

    /* ==================== Modal Styles ==================== */
    .modal-overlay {
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
      padding: 16px;
    }

    .modal-content {
      background: white;
      border-radius: 16px;
      width: 500px;
      max-width: 100%;
      max-height: 90vh;
      overflow-y: auto;
      animation: modalSlideIn 0.3s;
    }

    .modal-content.small {
      width: 400px;
    }

    @keyframes modalSlideIn {
      from {
        transform: translateY(-20px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    .modal-header {
      padding: 20px;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .modal-header h3 {
      font-size: 18px;
      font-weight: 600;
      color: #1e293b;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #64748b;
    }

    .modal-body {
      padding: 20px;
    }

    .modal-footer {
      padding: 16px 20px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }

    /* ==================== Form Styles ==================== */
    .form-group {
      margin-bottom: 16px;
    }

    .form-group label {
      display: block;
      margin-bottom: 6px;
      font-size: 14px;
      font-weight: 500;
      color: #334155;
    }

    .form-group .required {
      color: #ef4444;
    }

    .form-control {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      font-size: 14px;
      font-family: inherit;
      transition: all 0.2s;
    }

    .form-control:focus {
      outline: none;
      border-color: #4f46e5;
      box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
    }

    .form-row {
      display: flex;
      gap: 16px;
    }

    .form-group.half {
      flex: 1;
    }

    textarea.form-control {
      resize: vertical;
    }

    .btn-cancel, .btn-save {
      padding: 10px 24px;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-cancel {
      background: #f1f5f9;
      color: #64748b;
    }

    .btn-cancel:hover {
      background: #e2e8f0;
    }

    .btn-save {
      background: #4f46e5;
      color: white;
    }

    .btn-save:hover:not(:disabled) {
      background: #4338ca;
    }

    .btn-save:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .details-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .detail-item {
      display: flex;
      padding: 8px 0;
      border-bottom: 1px solid #f1f5f9;
      flex-wrap: wrap;
      gap: 8px;
    }

    .detail-label {
      width: 100px;
      color: #64748b;
      font-size: 14px;
    }

    .detail-value {
      flex: 1;
      color: #1e293b;
      font-weight: 500;
    }

    /* ==================== Utilities ==================== */
    .positive {
      color: #10b981 !important;
    }

    .negative {
      color: #ef4444 !important;
    }

    .btn-icon {
      width: 32px;
      height: 32px;
      border: 1px solid #e2e8f0;
      background: white;
      border-radius: 6px;
      color: #64748b;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }

    .btn-icon:hover {
      background: #f8fafc;
      color: #334155;
    }

    /* ==================== Responsive Design ==================== */

    /* Desktop Large */
    @media (min-width: 1440px) {
      .main-content {
        padding: 32px;
      }
    }

    /* Desktop Medium */
    @media (max-width: 1200px) {
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .breakdown-grid {
        grid-template-columns: 1fr;
      }
    }

    /* Tablet */
    @media (max-width: 992px) {
      .sidebar {
        width: 240px;
      }

      .main-content {
        margin-right: 240px;
        padding: 20px;
        width: calc(100% - 240px);
      }

      .stats-grid {
        gap: 16px;
      }

      .quick-stats-enhanced {
        width: 100%;
        justify-content: flex-start;
      }
    }

    /* Mobile */
    @media (max-width: 768px) {
      .sidebar {
        transform: translateX(100%);
        box-shadow: none;
        width: 280px;
      }

      .sidebar.mobile-open {
        transform: translateX(0);
        box-shadow: -2px 0 20px rgba(0, 0, 0, 0.1);
      }

      .mobile-header {
        display: flex;
      }

      .main-content {
        margin-right: 0;
        padding: 80px 16px 24px;
        width: 100%;
      }

      .stats-grid {
        grid-template-columns: 1fr;
        gap: 12px;
      }

      .stat-card {
        padding: 16px;
      }

      .stat-value {
        font-size: 20px;
      }

      .filters-row {
        flex-direction: column;
        align-items: stretch;
      }

      .filter-group {
        width: 100%;
      }

      .filter-select, .filter-input {
        width: 100%;
      }

      .quick-stats-enhanced {
        width: 100%;
        justify-content: space-between;
      }

      .stat-badge {
        flex: 1;
        justify-content: space-between;
      }

      .filter-sep {
        display: none;
      }

      .summary-bar {
        flex-direction: column;
        gap: 8px;
      }

      .categories-grid {
        grid-template-columns: 1fr;
      }

      .commissions-list {
        grid-template-columns: 1fr;
      }

      .teacher-summary-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
      }

      .teacher-amounts {
        width: 100%;
        justify-content: space-between;
      }

      .mini-stats-grid {
        grid-template-columns: 1fr;
      }

      .breakdown-item {
        flex-direction: column;
        align-items: flex-start;
      }

      .item-label {
        width: 100%;
      }

      .item-value, .item-percent {
        width: 100%;
        text-align: right;
      }

      /* Responsive Tables */
      .data-table {
        min-width: 100%;
      }

      .data-table thead {
        display: none;
      }

      .data-table tbody tr {
        display: block;
        margin-bottom: 16px;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 12px;
      }

      .data-table td {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;
        border-bottom: 1px dashed #f1f5f9;
        text-align: right;
      }

      .data-table td:last-child {
        border-bottom: none;
      }

      .data-table td::before {
        content: attr(data-label);
        font-weight: 600;
        color: #64748b;
        margin-left: 16px;
      }

      .data-table tfoot tr.total-row {
        display: block;
        margin-top: 16px;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 12px;
      }

      .data-table tfoot tr.total-row td {
        display: flex;
        justify-content: space-between;
        padding: 8px 0;
      }

      .data-table.compact tbody tr {
        padding: 8px;
      }

      /* Chart adjustments */
      .chart-container {
        padding: 16px;
      }

      .bar-chart {
        min-width: 500px;
      }

      .bar {
        width: 25px;
      }
    }

    /* Small Mobile */
    @media (max-width: 480px) {
      .stat-card {
        padding: 14px;
      }

      .stat-icon {
        width: 40px;
        height: 40px;
      }

      .stat-value {
        font-size: 18px;
      }

      .chart-container, .table-container, .month-details {
        padding: 16px;
      }

      .data-table td {
        font-size: 13px;
      }

      .modal-content {
        width: 100%;
        margin: 16px;
      }

      .form-row {
        flex-direction: column;
        gap: 0;
      }

      .section-header {
        flex-direction: column;
        align-items: flex-start;
      }

      .header-actions {
        width: 100%;
      }

      .btn-primary, .btn-success {
        flex: 1;
        justify-content: center;
      }

      .bar {
        width: 20px;
      }

      .commission-header {
        flex-direction: column;
        align-items: flex-start;
      }

      .commission-status {
        align-self: flex-start;
      }

      .quick-stats-enhanced {
        flex-direction: column;
        gap: 8px;
      }

      .stat-badge {
        width: 100%;
      }
    }

    /* Touch-friendly adjustments */
    @media (hover: none) and (pointer: coarse) {
      .menu-item, .stat-card, .btn-primary, .btn-success, .btn-export {
        min-height: 44px;
      }

      .btn-icon {
        min-width: 44px;
        min-height: 44px;
      }

      .filter-select, .filter-input, .search-input, .form-control {
        min-height: 44px;
      }
    }
  `]
})
export class ComprehensiveAccountingComponent implements OnInit, OnDestroy {
  // User Data
  currentUser: User | null = null;
  currentDate: Date = new Date();

  // UI State
  activeTab: string = 'overview';
  isLoading: boolean = false;
  isMobileView: boolean = false;
  mobileMenuOpen: boolean = false;
  showTransactionModal: boolean = false;
  showTeacherCommissionModal: boolean = false;
  teacherCommissionMode: 'add' | 'pay' | 'view' = 'add';

  // Menu Items
  menuItems: MenuItem[] = [
    {
      id: 'overview',
      label: 'نظرة عامة',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg>`
    },
    {
      id: 'monthly',
      label: 'تقرير شهري',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`
    },
    {
      id: 'transactions',
      label: 'المعاملات',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>`
    },
    {
      id: 'categories',
      label: 'الفئات',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a15 15 0 0 0 0 20 15 15 0 0 0 0-20z"></path></svg>`
    },
    {
      id: 'commissions',
      label: 'العمولات',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle><line x1="18" y1="11" x2="22" y2="11"></line><line x1="16" y1="15" x2="20" y2="15"></line></svg>`
    }
  ];

  // All Transactions
  allTransactions: Transaction[] = [];
  filteredTransactions: Transaction[] = [];
  paginatedTransactions: Transaction[] = [];

  // Summary Totals
  totalIncomeAllTime: number = 0;
  totalExpensesAllTime: number = 0;
  totalProfitAllTime: number = 0;
  totalTransactionsAllTime: number = 0;

  // Yearly/Monthly Data
  availableYears: number[] = [];
  selectedYear: number = new Date().getFullYear();
  yearlyStats: YearlyStats | null = null;
  monthlyStats: MonthlyStats[] = [];

  // Current Month
  currentYear: number = new Date().getFullYear();
  currentMonth: number = new Date().getMonth() + 1;
  currentMonthName: string = '';
  currentMonthIncome: number = 0;
  currentMonthExpenses: number = 0;
  currentMonthProfit: number = 0;
  currentMonthTransactions: number = 0;

  // Selected Month
  selectedMonth: string = new Date().toISOString().slice(0, 7);
  selectedMonthStats: MonthlyStats | null = null;
  monthOptions: { value: string; name: string }[] = [];
  monthlySearchTerm: string = '';
  filteredMonthlyTransactions: Transaction[] = [];

  // Filters
  filters: FilterOptions = {
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10),
    type: 'all',
    category: 'all',
    search: ''
  };

  // Filtered Totals
  filteredIncomeTotal: number = 0;
  filteredExpenseTotal: number = 0;
  filteredProfit: number = 0;

  // Pagination
  currentPage: number = 1;
  pageSize: number = 20;
  totalPages: number = 1;

  // Category Analysis
  analysisYear: number = new Date().getFullYear();
  incomeCategories: CategorySummary[] = [];
  expenseCategories: CategorySummary[] = [];

  // Selected Transaction
  selectedTransaction: Transaction | null = null;

  // Chart Data
  maxChartValue: number = 1;

  // Teacher Commission Properties
  teachersList: Teacher[] = [];
  classesList: Class[] = [];
  studentsList: Student[] = [];
  monthsList: { value: string; name: string }[] = [];
  teacherCommissions: TeacherCommission[] = [];
  filteredTeacherCommissions: TeacherCommission[] = [];
  
  teacherCommissionForm: any = {
    teacherId: '',
    classId: '',
    month: '',
    round: '',
    amount: 0,
    percentage: 70,
    type: 'individual',
    paymentMethod: 'cash',
    notes: ''
  };

  commissionSummary: CommissionSummary = {
    totalPending: 0,
    totalPaid: 0,
    byTeacher: [],
    byClass: []
  };

  commissionFilters: any = {
    teacherId: '',
    classId: '',
    month: '',
    status: ''
  };

  private refreshInterval: any;
  private readonly API_URL = 'http://localhost:5090/api';

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.loadUserFromStorage();
    this.generateMonthOptions();
    this.checkScreenSize();
  }

  ngOnInit(): void {
    this.loadAllFinancialData();
    this.initializeAccountingData();
    
    // Auto refresh every 5 minutes
    this.refreshInterval = setInterval(() => {
      this.refreshAllData();
    }, 300000);

    // Listen for resize events
    window.addEventListener('resize', () => this.checkScreenSize());
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    window.removeEventListener('resize', () => this.checkScreenSize());
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    // Close mobile menu when clicking outside
    if (this.isMobileView && this.mobileMenuOpen) {
      const sidebar = document.querySelector('.sidebar');
      const toggle = document.querySelector('.menu-toggle');
      
      if (sidebar && !sidebar.contains(event.target as Node) && 
          toggle && !toggle.contains(event.target as Node)) {
        this.mobileMenuOpen = false;
      }
    }
  }

  // ==================== Responsive Helpers ====================

  checkScreenSize(): void {
    this.isMobileView = window.innerWidth <= 768;
    if (!this.isMobileView) {
      this.mobileMenuOpen = false;
    }
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  toggleUserMenu(): void {
    // Implement user menu if needed
  }

  // ==================== Initialization ====================

  loadUserFromStorage(): void {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      try {
        this.currentUser = JSON.parse(userStr);
      } catch (e) {
        console.error('Error parsing user from storage', e);
      }
    }
  }

  generateMonthOptions(): void {
    this.monthOptions = [];
    const now = new Date();
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      const name = date.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long' });
      this.monthOptions.push({ value, name });
    }
  }

  async initializeAccountingData(): Promise<void> {
    await this.loadTeachersList();
    await this.loadClassesList();
    this.generateMonthsList();
    await this.loadTeacherCommissions();
  }

  // ==================== Data Loading ====================

  async loadAllFinancialData(): Promise<void> {
    this.isLoading = true;
    
    try {
      await this.loadAllTransactions();
      await this.loadTeacherCommissions();
      this.calculateAllTimeTotals();
      this.extractAvailableYears();
      await this.loadYearlyData(this.selectedYear);
      this.calculateCurrentMonthStats();
      this.applyFilters();
      this.updatePagination();
      await this.loadCategoryAnalysis();
    } catch (error) {
      console.error('Error loading financial data:', error);
    } finally {
      this.isLoading = false;
    }
  }

  loadAllTransactions(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http.get<any[]>(`${this.API_URL}/accounting/all-transactions?limit=10000`).subscribe({
        next: (transactions) => {
          this.allTransactions = (transactions || []).map(t => ({
            ...t,
            date: new Date(t.date)
          })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          
          this.filteredTransactions = [...this.allTransactions];
          resolve();
        },
        error: (err) => {
          console.error('Error loading transactions:', err);
          this.allTransactions = [];
          this.filteredTransactions = [];
          reject(err);
        }
      });
    });
  }

  calculateAllTimeTotals(): void {
    this.totalIncomeAllTime = this.allTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
      
    this.totalExpensesAllTime = this.allTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
      
    this.totalProfitAllTime = this.totalIncomeAllTime - this.totalExpensesAllTime;
    this.totalTransactionsAllTime = this.allTransactions.length;
  }

  extractAvailableYears(): void {
    const years = new Set<number>();
    
    // Add years from transactions
    this.allTransactions.forEach(t => {
      const year = new Date(t.date).getFullYear();
      years.add(year);
    });
    
    // Add years from commissions
    this.teacherCommissions.forEach(c => {
      if (c.paymentDate) {
        const year = new Date(c.paymentDate).getFullYear();
        years.add(year);
      }
    });
    
    this.availableYears = Array.from(years).sort((a, b) => b - a);
    
    if (this.availableYears.length === 0) {
      this.availableYears = [new Date().getFullYear()];
    }
  }

  async loadYearlyData(year: number): Promise<void> {
    return new Promise((resolve) => {
      // Filter transactions for the year
      const yearTransactions = this.allTransactions.filter(t => 
        new Date(t.date).getFullYear() === year
      );
      
      // Filter paid commissions for the year
      const paidCommissions = this.teacherCommissions.filter(c => 
        c.status === 'paid' && 
        c.paymentDate && 
        new Date(c.paymentDate).getFullYear() === year
      );
      
      const months: MonthlyStats[] = [];
      let maxIncome = 0;
      let maxExpense = 0;
      
      for (let month = 1; month <= 12; month++) {
        // Month transactions
        const monthTransactions = yearTransactions.filter(t => 
          new Date(t.date).getMonth() + 1 === month
        );
        
        // Month paid commissions
        const monthCommissions = paidCommissions.filter(c => 
          c.paymentDate && new Date(c.paymentDate).getMonth() + 1 === month
        );
        
        // Calculate income from transactions
        const income = monthTransactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + (t.amount || 0), 0);
          
        // Calculate expenses from regular transactions
        const expensesFromTransactions = monthTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + (t.amount || 0), 0);
        
        // Calculate expenses from teacher commissions
        const expensesFromCommissions = monthCommissions
          .reduce((sum, c) => sum + (c.amount || 0), 0);
        
        // Total expenses
        const expenses = expensesFromTransactions + expensesFromCommissions;
        
        // Income breakdown
        const tuition = monthTransactions
          .filter(t => t.type === 'income' && t.category === 'tuition')
          .reduce((sum, t) => sum + (t.amount || 0), 0);
          
        const registration = monthTransactions
          .filter(t => t.type === 'income' && t.category === 'registration')
          .reduce((sum, t) => sum + (t.amount || 0), 0);
          
        const otherIncome = monthTransactions
          .filter(t => t.type === 'income' && !['tuition', 'registration'].includes(t.category))
          .reduce((sum, t) => sum + (t.amount || 0), 0);
        
        // Expense breakdown
        const salaries = monthTransactions
          .filter(t => t.type === 'expense' && t.category === 'salary')
          .reduce((sum, t) => sum + (t.amount || 0), 0) + expensesFromCommissions;
        
        const rent = monthTransactions
          .filter(t => t.type === 'expense' && t.category === 'rent')
          .reduce((sum, t) => sum + (t.amount || 0), 0);
          
        const utilities = monthTransactions
          .filter(t => t.type === 'expense' && t.category === 'utilities')
          .reduce((sum, t) => sum + (t.amount || 0), 0);
          
        const supplies = monthTransactions
          .filter(t => t.type === 'expense' && t.category === 'supplies')
          .reduce((sum, t) => sum + (t.amount || 0), 0);
          
        const otherExpense = monthTransactions
          .filter(t => t.type === 'expense' && !['salary', 'rent', 'utilities', 'supplies'].includes(t.category))
          .reduce((sum, t) => sum + (t.amount || 0), 0);
        
        const monthName = new Date(year, month - 1, 1).toLocaleDateString('ar-EG', { month: 'long' });
        
        maxIncome = Math.max(maxIncome, income);
        maxExpense = Math.max(maxExpense, expenses);
        
        months.push({
          month: month.toString().padStart(2, '0'),
          monthName,
          year,
          income,
          expenses,
          profit: income - expenses,
          transactions: monthTransactions.length,
          incomeBreakdown: {
            tuition,
            registration,
            other: otherIncome
          },
          expenseBreakdown: {
            salaries,
            rent,
            utilities,
            supplies,
            other: otherExpense
          }
        });
      }
      
      this.monthlyStats = months;
      this.maxChartValue = Math.max(maxIncome, maxExpense) * 1.1;
      
      this.yearlyStats = {
        year,
        income: months.reduce((sum, m) => sum + m.income, 0),
        expenses: months.reduce((sum, m) => sum + m.expenses, 0),
        profit: months.reduce((sum, m) => sum + m.profit, 0),
        transactions: months.reduce((sum, m) => sum + m.transactions, 0),
        months
      };
      
      resolve();
    });
  }

  calculateCurrentMonthStats(): void {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    // Current month transactions
    const currentMonthTransactions = this.allTransactions.filter(t => {
      const date = new Date(t.date);
      return date.getFullYear() === currentYear && date.getMonth() === currentMonth;
    });
    
    const incomeFromTransactions = currentMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
      
    const expensesFromTransactions = currentMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    
    // Current month paid commissions
    const currentMonthCommissions = this.teacherCommissions.filter(c => {
      if (c.status !== 'paid' || !c.paymentDate) return false;
      const date = new Date(c.paymentDate);
      return date.getFullYear() === currentYear && date.getMonth() === currentMonth;
    });
    
    const expensesFromCommissions = currentMonthCommissions
      .reduce((sum, c) => sum + (c.amount || 0), 0);
    
    // Totals
    this.currentMonthIncome = incomeFromTransactions;
    this.currentMonthExpenses = expensesFromTransactions + expensesFromCommissions;
    this.currentMonthProfit = this.currentMonthIncome - this.currentMonthExpenses;
    this.currentMonthTransactions = currentMonthTransactions.length;
    
    this.currentMonthName = now.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' });
  }

  loadMonthDetails(): void {
    const [year, month] = this.selectedMonth.split('-').map(Number);
    const monthStats = this.monthlyStats[month - 1];
    
    if (monthStats) {
      this.selectedMonthStats = monthStats;
      
      // Load monthly transactions
      const monthTransactions = this.allTransactions.filter(t => {
        const date = new Date(t.date);
        return date.getFullYear() === year && date.getMonth() + 1 === month;
      });
      
      this.filteredMonthlyTransactions = monthTransactions.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    }
  }

  async loadCategoryAnalysis(): Promise<void> {
    return new Promise((resolve) => {
      const yearTransactions = this.allTransactions.filter(t => 
        new Date(t.date).getFullYear() === this.analysisYear
      );
      
      // Income categories
      const incomeByCategory = new Map<string, { amount: number; count: number }>();
      yearTransactions.filter(t => t.type === 'income').forEach(t => {
        const cat = t.category || 'other';
        const current = incomeByCategory.get(cat) || { amount: 0, count: 0 };
        incomeByCategory.set(cat, {
          amount: current.amount + (t.amount || 0),
          count: current.count + 1
        });
      });
      
      const totalIncome = yearTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + (t.amount || 0), 0);
      
      this.incomeCategories = Array.from(incomeByCategory.entries()).map(([category, data]) => ({
        category,
        amount: data.amount,
        count: data.count,
        percentage: totalIncome > 0 ? (data.amount / totalIncome) * 100 : 0
      })).sort((a, b) => b.amount - a.amount);
      
      // Expense categories
      const expenseByCategory = new Map<string, { amount: number; count: number }>();
      yearTransactions.filter(t => t.type === 'expense').forEach(t => {
        const cat = t.category || 'other';
        const current = expenseByCategory.get(cat) || { amount: 0, count: 0 };
        expenseByCategory.set(cat, {
          amount: current.amount + (t.amount || 0),
          count: current.count + 1
        });
      });
      
      const totalExpense = yearTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + (t.amount || 0), 0);
      
      this.expenseCategories = Array.from(expenseByCategory.entries()).map(([category, data]) => ({
        category,
        amount: data.amount,
        count: data.count,
        percentage: totalExpense > 0 ? (data.amount / totalExpense) * 100 : 0
      })).sort((a, b) => b.amount - a.amount);
      
      resolve();
    });
  }

  // ==================== Helper Methods for Template ====================
  
  getYearlyTotal(type: 'income' | 'expenses' | 'profit' | 'transactions'): number {
    if (!this.yearlyStats) return 0;
    
    switch(type) {
      case 'income':
        return this.yearlyStats.income;
      case 'expenses':
        return this.yearlyStats.expenses;
      case 'profit':
        return this.yearlyStats.profit;
      case 'transactions':
        return this.yearlyStats.transactions;
      default:
        return 0;
    }
  }

  getYearlyIncomeBreakdown(type: 'tuition' | 'registration' | 'other'): number {
    if (!this.yearlyStats || !this.yearlyStats.months) return 0;
    
    return this.yearlyStats.months.reduce((sum, month) => {
      return sum + (month.incomeBreakdown[type] || 0);
    }, 0);
  }

  getYearlyExpenseBreakdown(type: 'salaries' | 'rent' | 'utilities' | 'supplies' | 'other'): number {
    if (!this.yearlyStats || !this.yearlyStats.months) return 0;
    
    return this.yearlyStats.months.reduce((sum, month) => {
      return sum + (month.expenseBreakdown[type] || 0);
    }, 0);
  }

  // ==================== Teacher Commission Methods ====================

  loadTeachersList(): Promise<void> {
    return new Promise((resolve) => {
      this.http.get<any[]>(`${this.API_URL}/teachers`).subscribe({
        next: (teachers) => {
          this.teachersList = teachers || [];
          resolve();
        },
        error: (err) => {
          console.error('Error loading teachers:', err);
          this.teachersList = [];
          resolve();
        }
      });
    });
  }

  loadClassesList(): Promise<void> {
    return new Promise((resolve) => {
      this.http.get<any>(`${this.API_URL}/classes`).subscribe({
        next: (response) => {
          this.classesList = response.data || response || [];
          resolve();
        },
        error: (err) => {
          console.error('Error loading classes:', err);
          this.classesList = [];
          resolve();
        }
      });
    });
  }

  generateMonthsList(): void {
    this.monthsList = [];
    const now = new Date();
    
    for (let i = 0; i < 24; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      const name = date.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long' });
      this.monthsList.push({ value, name });
    }
  }

  getCurrentMonth(): string {
    return new Date().toISOString().slice(0, 7);
  }

  openTeacherCommissionModal(mode: 'add' | 'pay' | 'view', commission?: TeacherCommission): void {
    this.teacherCommissionMode = mode;
    
    if (mode === 'add') {
      this.teacherCommissionForm = {
        teacherId: '',
        classId: '',
        month: this.getCurrentMonth(),
        round: '',
        amount: 0,
        percentage: 70,
        type: 'individual',
        paymentMethod: 'cash',
        notes: ''
      };
    }
    
    this.showTeacherCommissionModal = true;
  }

  closeTeacherCommissionModal(): void {
    this.showTeacherCommissionModal = false;
  }

  onClassChange(): void {
    this.calculateCommission();
  }

  calculateCommission(): void {
    if (this.teacherCommissionForm.classId && this.teacherCommissionForm.percentage) {
      const selectedClass = this.classesList.find(c => c._id === this.teacherCommissionForm.classId);
      if (selectedClass && selectedClass.price) {
        const baseAmount = selectedClass.price || 0;
        this.teacherCommissionForm.amount = (baseAmount * this.teacherCommissionForm.percentage / 100);
      }
    }
  }

  saveTeacherCommission(): void {
    if (!this.teacherCommissionForm.teacherId || !this.teacherCommissionForm.classId || !this.teacherCommissionForm.month) {
      this.showNotification('الرجاء إكمال جميع الحقول المطلوبة', 'warning');
      return;
    }

    this.isLoading = true;
    
    const payload = {
      teacherId: this.teacherCommissionForm.teacherId,
      classId: this.teacherCommissionForm.classId,
      month: this.teacherCommissionForm.month,
      amount: this.teacherCommissionForm.amount,
      percentage: this.teacherCommissionForm.percentage,
      type: this.teacherCommissionForm.type || 'individual',
      notes: this.teacherCommissionForm.notes
    };

    this.http.post(`${this.API_URL}/accounting/teacher-commissions`, payload).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        this.showNotification('تم إضافة العمولة بنجاح', 'success');
        this.closeTeacherCommissionModal();
        this.loadTeacherCommissions();
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error saving commission:', err);
        this.showNotification(err.error?.error || 'حدث خطأ أثناء إضافة العمولة', 'error');
      }
    });
  }

  payTeacherCommission(commissionId: string): void {
    const commission = this.teacherCommissions.find(c => c._id === commissionId);
    if (!commission) return;

    if (confirm(`هل أنت متأكد من دفع عمولة ${commission.teacher?.name || ''} بقيمة ${this.formatCurrency(commission.amount)}؟`)) {
      this.isLoading = true;
      
      this.http.post(`${this.API_URL}/accounting/teacher-commissions/pay-single`, { commissionId }).subscribe({
        next: (response: any) => {
          this.isLoading = false;
          this.showNotification('تم دفع العمولة بنجاح', 'success');
          this.loadTeacherCommissions();
          this.loadAllFinancialData();
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Error paying commission:', err);
          this.showNotification(err.error?.error || 'حدث خطأ أثناء دفع العمولة', 'error');
        }
      });
    }
  }

  generateMonthlyCommissions(): void {
    const month = this.getCurrentMonth();
    
    if (confirm(`هل أنت متأكد من إنشاء عمولات شهر ${month}؟`)) {
      this.isLoading = true;
      
      this.http.post(`${this.API_URL}/accounting/teacher-commissions/generate-for-month`, { month }).subscribe({
        next: (response: any) => {
          this.isLoading = false;
          this.showNotification(response.message, 'success');
          this.loadTeacherCommissions();
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Error generating commissions:', err);
          this.showNotification(err.error?.error || 'حدث خطأ أثناء إنشاء العمولات', 'error');
        }
      });
    }
  }

  loadTeacherCommissions(): Promise<void> {
    return new Promise((resolve) => {
      const params = new URLSearchParams();
      
      if (this.commissionFilters.teacherId) params.append('teacher', this.commissionFilters.teacherId);
      if (this.commissionFilters.month) params.append('month', this.commissionFilters.month);
      if (this.commissionFilters.status) params.append('status', this.commissionFilters.status);
      
      const url = `${this.API_URL}/accounting/teacher-commissions?${params.toString()}`;
      
      this.http.get<any>(url).subscribe({
        next: (response) => {
          this.teacherCommissions = response.data || response || [];
          this.filteredTeacherCommissions = [...this.teacherCommissions];
          this.calculateCommissionSummary();
          resolve();
        },
        error: (err) => {
          console.error('Error loading teacher commissions:', err);
          this.teacherCommissions = [];
          this.filteredTeacherCommissions = [];
          resolve();
        }
      });
    });
  }

  calculateCommissionSummary(): void {
    this.commissionSummary = {
      totalPending: this.teacherCommissions
        .filter(c => c.status === 'pending')
        .reduce((sum, c) => sum + c.amount, 0),
      totalPaid: this.teacherCommissions
        .filter(c => c.status === 'paid')
        .reduce((sum, c) => sum + c.amount, 0),
      byTeacher: [],
      byClass: []
    };

    // Group by teacher
    const teacherMap = new Map();
    this.teacherCommissions.forEach(commission => {
      const teacherId = commission.teacher?._id;
      const teacherName = commission.teacher?.name;
      
      if (teacherId) {
        if (!teacherMap.has(teacherId)) {
          teacherMap.set(teacherId, {
            teacherId,
            teacherName,
            pending: 0,
            paid: 0,
            total: 0
          });
        }
        
        const data = teacherMap.get(teacherId);
        if (commission.status === 'pending') {
          data.pending += commission.amount;
        } else if (commission.status === 'paid') {
          data.paid += commission.amount;
        }
        data.total += commission.amount;
      }
    });
    
    this.commissionSummary.byTeacher = Array.from(teacherMap.values());
    
    // Group by class
    const classMap = new Map();
    this.teacherCommissions.forEach(commission => {
      const classId = commission.class?._id;
      const className = commission.class?.name;
      
      if (classId) {
        if (!classMap.has(classId)) {
          classMap.set(classId, {
            classId,
            className,
            pending: 0,
            paid: 0,
            total: 0
          });
        }
        
        const data = classMap.get(classId);
        if (commission.status === 'pending') {
          data.pending += commission.amount;
        } else if (commission.status === 'paid') {
          data.paid += commission.amount;
        }
        data.total += commission.amount;
      }
    });
    
    this.commissionSummary.byClass = Array.from(classMap.values());
  }

  applyCommissionFilters(): void {
    this.filteredTeacherCommissions = this.teacherCommissions.filter(commission => {
      let match = true;
      
      if (this.commissionFilters.teacherId && commission.teacher?._id !== this.commissionFilters.teacherId) {
        match = false;
      }
      
      if (this.commissionFilters.month && commission.month !== this.commissionFilters.month) {
        match = false;
      }
      
      if (this.commissionFilters.status && commission.status !== this.commissionFilters.status) {
        match = false;
      }
      
      return match;
    });
  }

  viewCommissionDetails(commission: TeacherCommission): void {
    this.selectedTransaction = {
      ...commission,
      type: 'expense',
      description: `عمولة ${commission.teacher?.name} - ${commission.class?.name}`,
      category: 'salary',
      date: commission.paymentDate || commission.createdAt || new Date(),
      amount: commission.amount,
      _id: commission._id,
      teacher: commission.teacher,
      class: commission.class
    };
    this.showTransactionModal = true;
  }

  showNotification(message: string, type: 'success' | 'error' | 'warning' | 'info'): void {
    // For now, use alert
    alert(message);
  }

  // ==================== Filtering ====================

  applyFilters(): void {
    let filtered = [...this.allTransactions];
    
    // Filter by date range
    if (this.filters.startDate) {
      const start = new Date(this.filters.startDate);
      start.setHours(0, 0, 0, 0);
      filtered = filtered.filter(t => new Date(t.date) >= start);
    }
    
    if (this.filters.endDate) {
      const end = new Date(this.filters.endDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter(t => new Date(t.date) <= end);
    }
    
    // Filter by type
    if (this.filters.type !== 'all') {
      filtered = filtered.filter(t => t.type === this.filters.type);
    }
    
    // Filter by category
    if (this.filters.category !== 'all') {
      filtered = filtered.filter(t => t.category === this.filters.category);
    }
    
    // Filter by search term
    if (this.filters.search) {
      const searchLower = this.filters.search.toLowerCase();
      filtered = filtered.filter(t => 
        t.description?.toLowerCase().includes(searchLower) ||
        t.student?.name?.toLowerCase().includes(searchLower) ||
        t.teacher?.name?.toLowerCase().includes(searchLower)
      );
    }
    
    this.filteredTransactions = filtered;
    
    // Calculate filtered totals
    this.filteredIncomeTotal = filtered
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
      
    this.filteredExpenseTotal = filtered
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
      
    this.filteredProfit = this.filteredIncomeTotal - this.filteredExpenseTotal;
    
    // Reset to first page
    this.currentPage = 1;
    this.updatePagination();
  }

  filterByType(type: 'income' | 'expense'): void {
    this.filters.type = type;
    this.applyFilters();
    this.setActiveTab('transactions');
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredTransactions.length / this.pageSize);
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedTransactions = this.filteredTransactions.slice(start, end);
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  // ==================== Actions ====================

  setActiveTab(tab: string): void {
    this.activeTab = tab;
    
    if (this.isMobileView) {
      this.mobileMenuOpen = false;
    }
    
    if (tab === 'monthly') {
      // التأكد من أن الشهر المحدد ينتمي للسنة المختارة
      if (this.selectedMonth) {
        const [year] = this.selectedMonth.split('-').map(Number);
        if (year !== this.selectedYear) {
          this.selectedMonth = `${this.selectedYear}-01`;
        }
      }
      this.loadMonthDetails();
    } else if (tab === 'categories') {
      this.loadCategoryAnalysis();
    } else if (tab === 'commissions') {
      this.loadTeacherCommissions();
    }
  }
  

  onYearChange(): void {
    // تحديث جميع البيانات المتعلقة بالسنة المختارة
    this.loadYearlyData(this.selectedYear).then(() => {
      // تحديث تحليل الفئات للسنة المختارة
      this.analysisYear = this.selectedYear;
      this.loadCategoryAnalysis();
      
      // تحديث إحصائيات الشهر الحالي إذا كان ينتمي للسنة المختارة
      const now = new Date();
      if (now.getFullYear() === this.selectedYear) {
        this.calculateCurrentMonthStats();
      }
      
      // تحديث التقارير الشهرية إذا كانت الشهر المحدد ينتمي للسنة المختارة
      if (this.activeTab === 'monthly' && this.selectedMonth) {
        const [year] = this.selectedMonth.split('-').map(Number);
        if (year !== this.selectedYear) {
          // إذا كانت السنة مختلفة، قم بتحديث الشهر المحدد إلى يناير من السنة الجديدة
          this.selectedMonth = `${this.selectedYear}-01`;
        }
        this.loadMonthDetails();
      }
      
      console.log(`تم تحديث البيانات للسنة: ${this.selectedYear}`);
    });
  }
  

  viewMonthDetails(month: MonthlyStats): void {
    this.selectedMonth = `${month.year}-${month.month}`;
    this.setActiveTab('monthly');
    this.loadMonthDetails();
  }
  
  viewTransactionDetails(transaction: Transaction): void {
    this.selectedTransaction = transaction;
    this.showTransactionModal = true;
  }
  
  refreshAllData(): void {
    this.loadAllFinancialData();
  }
  
  exportToExcel(): void {
    this.showNotification('سيتم قريباً إضافة خاصية تصدير Excel', 'info');
  }
  
  closeModal(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.showTransactionModal = false;
    }
  }
  
  // ==================== Utility Functions ====================

  getBarHeight(value: number): number {
    if (this.maxChartValue === 0) return 0;
    return (value / this.maxChartValue) * 180;
  }

  getFormattedDate(date: Date | string | undefined): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getFormattedDateTime(date: Date | string | undefined): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatCurrency(amount: number): string {
    if (amount === undefined || amount === null) return '0 د.ج';
    return new Intl.NumberFormat('ar-DZ', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  getRoleName(role: string): string {
    const roles: { [key: string]: string } = {
      'admin': 'مدير النظام',
      'accountant': 'محاسب',
      'secretary': 'سكرتير',
      'teacher': 'أستاذ'
    };
    return roles[role] || role;
  }

  getCategoryName(category: string): string {
    const categories: { [key: string]: string } = {
      'tuition': 'رسوم دراسية',
      'registration': 'رسوم تسجيل',
      'salary': 'راتب',
      'rent': 'إيجار',
      'utilities': 'مرافق',
      'supplies': 'مستلزمات',
      'other': 'أخرى'
    };
    return categories[category] || category;
  }

  getPercentage(part: number, total: number): string {
    if (total === 0) return '0';
    return ((part / total) * 100).toFixed(1);
  }
}