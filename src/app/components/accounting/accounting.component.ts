// accounting.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface User {
  id: string;
  username: string;
  role: string;
  fullName: string;
}

interface DailyStats {
  income: number;
  expenses: number;
  profit: number;
  totalClasses: number;
}

interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  pendingPayments: number;
}

interface Teacher {
  _id: string;
  name: string;
}

interface Student {
  _id: string;
  name: string;
  studentId: string;
}

interface Class {
  _id: string;
  name: string;
  subject: string;
}

interface TeacherCommission {
  _id: string;
  teacher: Teacher;
  student: Student;
  class: Class;
  month: string;
  amount: number;
  percentage: number;
  status: 'pending' | 'paid';
  paymentDate?: Date;
  type: 'individual' | 'class';
}

interface Expense {
  _id: string;
  description: string;
  amount: number;
  category: string;
  date: Date;
  paymentMethod: string;
  status: 'pending' | 'paid';
  recordedBy?: any;
}

interface Transaction {
  _id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
  date: Date;
  student?: Student;
  recordedBy?: any;
  transactionType?: string;
}

interface MonthlyReport {
  period?: {
    startDate: Date;
    endDate: Date;
  };
  income: {
    total: number;
    breakdown: any;
    details: any[];
  };
  expenses: {
    total: number;
    breakdown: any;
    details: any[];
  };
  profit: {
    netProfit: number;
    profitMargin: number;
  };
  summary: any;
}

interface ChartDataItem {
  month: string;
  income: number;
  expense: number;
}

@Component({
  selector: 'app-accounting',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="accounting-container" dir="rtl">
      <!-- Header -->
      <div class="header">
        <div class="header-content">
          <div class="header-title">
            <h1>النظام المحاسبي</h1>
            <span class="welcome-text">مرحباً بك في لوحة التحكم المالية</span>
          </div>
          <div class="header-actions">
            <div class="user-info" *ngIf="currentUser">
              <span class="user-name">{{ currentUser.fullName || currentUser.username }}</span>
              <span class="user-role">{{ getRoleName(currentUser.role) }}</span>
            </div>
            <button class="btn-refresh" (click)="refreshData()" [disabled]="isLoading">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
                <path d="M21 3v5h-5"></path>
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
                <path d="M8 16H3v5"></path>
              </svg>
              تحديث
            </button>
          </div>
        </div>
        <div class="date-display">{{ getFormattedDate(currentDate) }}</div>
      </div>

      <!-- Loading Overlay -->
      <div class="loading-overlay" *ngIf="isLoading">
        <div class="spinner"></div>
        <p>جاري التحميل...</p>
      </div>

      <!-- Tabs Navigation -->
      <div class="tabs-container">
        <button class="tab-btn" [class.active]="activeTab === 'dashboard'" (click)="setActiveTab('dashboard')">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="7" height="9"></rect>
            <rect x="14" y="3" width="7" height="5"></rect>
            <rect x="14" y="12" width="7" height="9"></rect>
            <rect x="3" y="16" width="7" height="5"></rect>
          </svg>
          لوحة التحكم
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'income'" (click)="setActiveTab('income')">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="1" x2="12" y2="23"></line>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
          </svg>
          الإيرادات
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'expenses'" (click)="setActiveTab('expenses')">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="1" x2="12" y2="23"></line>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
          </svg>
          المصروفات
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'commissions'" (click)="setActiveTab('commissions')">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
          </svg>
          عمولات الأساتذة
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'reports'" (click)="setActiveTab('reports')">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12v-2a5 5 0 0 0-5-5H8a5 5 0 0 0-5 5v2"></path>
            <circle cx="12" cy="16" r="5"></circle>
            <path d="M12 11v5"></path>
          </svg>
          التقارير
        </button>
      </div>

      <!-- Tab Content -->
      <div class="tab-content">
        <!-- Dashboard Tab -->
        <div *ngIf="activeTab === 'dashboard'" class="dashboard-tab">
          <!-- Stats Cards -->
          <div class="stats-grid">
            <div class="stat-card income-card">
              <div class="stat-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23"></line>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
              </div>
              <div class="stat-content">
                <h3>إجمالي الإيرادات</h3>
                <p class="stat-value">{{ formatCurrency(totalIncome) }}</p>
                <p class="stat-sub">آخر 30 يوم</p>
              </div>
            </div>
            
            <div class="stat-card expense-card">
              <div class="stat-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23"></line>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
              </div>
              <div class="stat-content">
                <h3>إجمالي المصروفات</h3>
                <p class="stat-value">{{ formatCurrency(totalExpenses) }}</p>
                <p class="stat-sub">آخر 30 يوم</p>
              </div>
            </div>
            
            <div class="stat-card profit-card">
              <div class="stat-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="23 6 13.5 15.5 8 10 1 18"></polyline>
                  <polyline points="17 6 23 6 23 12"></polyline>
                </svg>
              </div>
              <div class="stat-content">
                <h3>صافي الربح</h3>
                <p class="stat-value">{{ formatCurrency(netProfit) }}</p>
                <p class="stat-sub">آخر 30 يوم</p>
              </div>
            </div>
            
            <div class="stat-card pending-card">
              <div class="stat-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
              </div>
              <div class="stat-content">
                <h3>مدفوعات معلقة</h3>
                <p class="stat-value">{{ pendingPaymentsCount }}</p>
                <p class="stat-sub">دفعة غير مسددة</p>
              </div>
            </div>
          </div>

          <!-- Daily Stats -->
          <div class="daily-stats-card">
            <div class="card-header">
              <h2>إحصائيات اليوم</h2>
              <span class="date-badge">{{ getFormattedDate(today) }}</span>
            </div>
            
            <div class="daily-stats-grid">
              <div class="daily-stat-item">
                <span class="label">دخل اليوم</span>
                <span class="value positive">{{ formatCurrency(dailyIncome) }}</span>
              </div>
              <div class="daily-stat-item">
                <span class="label">مصروفات اليوم</span>
                <span class="value negative">{{ formatCurrency(dailyExpenses) }}</span>
              </div>
              <div class="daily-stat-item">
                <span class="label">صافي اليوم</span>
                <span class="value" [class.positive]="dailyProfit >= 0" [class.negative]="dailyProfit < 0">
                  {{ formatCurrency(dailyProfit) }}
                </span>
              </div>
              <div class="daily-stat-item">
                <span class="label">الحصص اليوم</span>
                <span class="value">{{ dailyClasses }}</span>
              </div>
            </div>

            <div class="chart-container" *ngIf="monthlyChartData.length > 0">
              <h3>الإيرادات والمصروفات الشهرية</h3>
              <div class="bar-chart">
                <div class="chart-bar" *ngFor="let item of monthlyChartData; let i = index" 
                     [style.height]="item.height + '%'">
                  <div class="bar-income" [style.height]="(item.income / maxChartValue) * 100 + '%'">
                    <span class="tooltip">{{ formatCurrency(item.income) }}</span>
                  </div>
                  <div class="bar-expense" [style.height]="(item.expense / maxChartValue) * 100 + '%'">
                    <span class="tooltip">{{ formatCurrency(item.expense) }}</span>
                  </div>
                  <span class="bar-label">{{ item.month }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Recent Transactions -->
          <div class="transactions-card">
            <div class="card-header">
              <h2>آخر المعاملات</h2>
              <button class="btn-view-all" (click)="setActiveTab('reports')">عرض الكل</button>
            </div>
            
            <div class="transactions-list">
              <div *ngFor="let transaction of recentTransactions" class="transaction-item">
                <div class="transaction-icon" [class.income]="transaction.type === 'income'" [class.expense]="transaction.type === 'expense'">
                  <svg *ngIf="transaction.type === 'income'" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="12" y1="19" x2="12" y2="5"></line>
                    <polyline points="5 12 12 5 19 12"></polyline>
                  </svg>
                  <svg *ngIf="transaction.type === 'expense'" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <polyline points="19 12 12 19 5 12"></polyline>
                  </svg>
                </div>
                <div class="transaction-details">
                  <p class="transaction-desc">{{ transaction.description || (transaction.type === 'income' ? 'إيراد' : 'مصروف') }}</p>
                  <p class="transaction-meta">{{ transaction.category }} • {{ getFormattedDateTime(transaction.date) }}</p>
                </div>
                <div class="transaction-amount" [class.income]="transaction.type === 'income'" [class.expense]="transaction.type === 'expense'">
                  {{ formatCurrency(transaction.amount) }}
                </div>
              </div>
              
              <div *ngIf="recentTransactions.length === 0" class="no-data">
                لا توجد معاملات لعرضها
              </div>
            </div>
          </div>
        </div>

        <!-- Income Tab -->
        <div *ngIf="activeTab === 'income'" class="income-tab">
          <div class="section-header">
            <h2>سجل الإيرادات</h2>
            <div class="filter-group">
              <select [(ngModel)]="incomeFilter.type" (change)="loadIncomeData()" class="filter-select">
                <option value="all">جميع الإيرادات</option>
                <option value="tuition">رسوم دراسية</option>
                <option value="registration">رسوم تسجيل</option>
                <option value="other">إيرادات أخرى</option>
              </select>
              <input type="month" [(ngModel)]="incomeFilter.month" (change)="loadIncomeData()" class="filter-input">
            </div>
          </div>

          <div class="summary-cards">
            <div class="summary-card">
              <span class="label">إجمالي الإيرادات</span>
              <span class="value">{{ formatCurrency(totalIncome) }}</span>
            </div>
            <div class="summary-card">
              <span class="label">عدد المعاملات</span>
              <span class="value">{{ incomeTransactions.length }}</span>
            </div>
            <div class="summary-card">
              <span class="label">متوسط المعاملة</span>
              <span class="value">{{ formatCurrency(incomeTransactions.length ? totalIncome / incomeTransactions.length : 0) }}</span>
            </div>
          </div>

          <div class="data-table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>التاريخ</th>
                  <th>الوصف</th>
                  <th>التصنيف</th>
                  <th>الطالب</th>
                  <th>المبلغ</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let item of incomeTransactions">
                  <td>{{ getFormattedDate(item.date) }}</td>
                  <td>{{ item.description }}</td>
                  <td><span class="badge" [class.badge-primary]="item.category === 'tuition'">{{ item.category }}</span></td>
                  <td>{{ item.student?.name || '-' }}</td>
                  <td class="amount positive">{{ formatCurrency(item.amount) }}</td>
                </tr>
                <tr *ngIf="incomeTransactions.length === 0">
                  <td colspan="5" class="no-data">لا توجد إيرادات لعرضها</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Expenses Tab -->
        <div *ngIf="activeTab === 'expenses'" class="expenses-tab">
          <div class="section-header">
            <h2>سجل المصروفات</h2>
            <button class="btn-primary" (click)="showAddExpenseModal = true">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              إضافة مصروف
            </button>
          </div>

          <div class="summary-cards">
            <div class="summary-card">
              <span class="label">إجمالي المصروفات</span>
              <span class="value">{{ formatCurrency(totalExpenses) }}</span>
            </div>
            <div class="summary-card">
              <span class="label">عدد المعاملات</span>
              <span class="value">{{ expenses.length }}</span>
            </div>
          </div>

          <div class="data-table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>التاريخ</th>
                  <th>الوصف</th>
                  <th>التصنيف</th>
                  <th>طريقة الدفع</th>
                  <th>المبلغ</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let expense of expenses">
                  <td>{{ getFormattedDate(expense.date) }}</td>
                  <td>{{ expense.description }}</td>
                  <td><span class="badge">{{ getCategoryName(expense.category) }}</span></td>
                  <td>{{ getPaymentMethodName(expense.paymentMethod) }}</td>
                  <td class="amount negative">{{ formatCurrency(expense.amount) }}</td>
                  <td>
                    <button class="btn-icon" (click)="viewExpenseDetails(expense)" title="عرض التفاصيل">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="3"></circle>
                        <path d="M22 12c-2.667 4.667-6 7-10 7s-7.333-2.333-10-7c2.667-4.667 6-7 10-7s7.333 2.333 10 7z"></path>
                      </svg>
                    </button>
                  </td>
                </tr>
                <tr *ngIf="expenses.length === 0">
                  <td colspan="6" class="no-data">لا توجد مصروفات لعرضها</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Commissions Tab -->
        <div *ngIf="activeTab === 'commissions'" class="commissions-tab">
          <div class="section-header">
            <h2>عمولات الأساتذة</h2>
            <div class="filter-group">
              <select [(ngModel)]="commissionFilter.status" (change)="loadCommissions()" class="filter-select">
                <option value="all">جميع العمولات</option>
                <option value="pending">معلقة</option>
                <option value="paid">مدفوعة</option>
              </select>
              <input type="month" [(ngModel)]="commissionFilter.month" (change)="loadCommissions()" class="filter-input">
            </div>
          </div>

          <div class="summary-cards">
            <div class="summary-card">
              <span class="label">إجمالي العمولات المعلقة</span>
              <span class="value">{{ formatCurrency(pendingCommissionsTotal) }}</span>
            </div>
            <div class="summary-card">
              <span class="label">إجمالي العمولات المدفوعة</span>
              <span class="value">{{ formatCurrency(paidCommissionsTotal) }}</span>
            </div>
          </div>

          <div class="data-table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>الأستاذ</th>
                  <th>الطالب</th>
                  <th>الحصة</th>
                  <th>الشهر</th>
                  <th>المبلغ</th>
                  <th>الحالة</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let commission of commissions">
                  <td>{{ commission.teacher?.name }}</td>
                  <td>{{ commission.student?.name || 'حصة شاملة' }}</td>
                  <td>{{ commission.class?.name }}</td>
                  <td>{{ commission.month }}</td>
                  <td class="amount">{{ formatCurrency(commission.amount) }}</td>
                  <td>
                    <span class="badge" [class.badge-success]="commission.status === 'paid'" [class.badge-warning]="commission.status === 'pending'">
                      {{ commission.status === 'paid' ? 'مدفوعة' : 'معلقة' }}
                    </span>
                  </td>
                  <td>
                    <button *ngIf="commission.status === 'pending'" class="btn-small btn-success" (click)="payCommission(commission)">
                      دفع
                    </button>
                  </td>
                </tr>
                <tr *ngIf="commissions.length === 0">
                  <td colspan="7" class="no-data">لا توجد عمولات لعرضها</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Reports Tab -->
        <div *ngIf="activeTab === 'reports'" class="reports-tab">
          <div class="section-header">
            <h2>التقارير المالية</h2>
            <div class="filter-group">
              <select [(ngModel)]="reportFilter.type" class="filter-select">
                <option value="monthly">تقرير شهري</option>
                <option value="yearly">تقرير سنوي</option>
                <option value="custom">فترة مخصصة</option>
              </select>
              <input *ngIf="reportFilter.type === 'custom'" type="date" [(ngModel)]="reportFilter.startDate" class="filter-input">
              <input *ngIf="reportFilter.type === 'custom'" type="date" [(ngModel)]="reportFilter.endDate" class="filter-input">
              <button class="btn-primary" (click)="generateReport()">توليد التقرير</button>
            </div>
          </div>

          <div *ngIf="monthlyReport" class="report-content">
            <div class="report-header">
              <h3>التقرير المالي الشامل</h3>
              <p>الفترة: {{ getFormattedDate(monthlyReport.period?.startDate) }} - {{ getFormattedDate(monthlyReport.period?.endDate) }}</p>
            </div>

            <div class="report-summary-cards">
              <div class="report-card income">
                <span class="label">إجمالي الإيرادات</span>
                <span class="value">{{ formatCurrency(monthlyReport.income.total) }}</span>
              </div>
              <div class="report-card expense">
                <span class="label">إجمالي المصروفات</span>
                <span class="value">{{ formatCurrency(monthlyReport.expenses.total) }}</span>
              </div>
              <div class="report-card profit" [class.positive]="monthlyReport.profit.netProfit >= 0" [class.negative]="monthlyReport.profit.netProfit < 0">
                <span class="label">صافي الربح</span>
                <span class="value">{{ formatCurrency(monthlyReport.profit.netProfit) }}</span>
              </div>
            </div>

            <div class="report-details">
              <div class="details-section">
                <h4>تفاصيل الإيرادات</h4>
                <table class="details-table">
                  <tr *ngFor="let item of monthlyReport.income.details">
                    <td>{{ item.description }}</td>
                    <td class="amount">{{ formatCurrency(item.amount) }}</td>
                    <td>{{ getFormattedDate(item.date) }}</td>
                  </tr>
                </table>
              </div>

              <div class="details-section">
                <h4>تفاصيل المصروفات</h4>
                <table class="details-table">
                  <tr *ngFor="let item of monthlyReport.expenses.details">
                    <td>{{ item.description }}</td>
                    <td class="amount">{{ formatCurrency(item.amount) }}</td>
                    <td>{{ getFormattedDate(item.date) }}</td>
                  </tr>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Add Expense Modal -->
      <div class="modal-overlay" *ngIf="showAddExpenseModal" (click)="closeModal($event)">
        <div class="modal-container" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>إضافة مصروف جديد</h3>
            <button class="close-btn" (click)="showAddExpenseModal = false">&times;</button>
          </div>
          <div class="modal-body">
            <form (ngSubmit)="addExpense()" #expenseForm="ngForm">
              <div class="form-group">
                <label>الوصف *</label>
                <input type="text" [(ngModel)]="newExpense.description" name="description" required class="form-control">
              </div>
              
              <div class="form-group">
                <label>المبلغ *</label>
                <input type="number" [(ngModel)]="newExpense.amount" name="amount" required min="0" step="0.01" class="form-control">
              </div>
              
              <div class="form-group">
                <label>التصنيف *</label>
                <select [(ngModel)]="newExpense.category" name="category" required class="form-control">
                  <option value="salary">راتب</option>
                  <option value="rent">إيجار</option>
                  <option value="utilities">مرافق</option>
                  <option value="supplies">مستلزمات</option>
                  <option value="maintenance">صيانة</option>
                  <option value="marketing">تسويق</option>
                  <option value="other">أخرى</option>
                </select>
              </div>
              
              <div class="form-group">
                <label>طريقة الدفع</label>
                <select [(ngModel)]="newExpense.paymentMethod" name="paymentMethod" class="form-control">
                  <option value="cash">نقدي</option>
                  <option value="bank">بنكي</option>
                  <option value="online">إلكتروني</option>
                </select>
              </div>
              
              <div class="form-group">
                <label>التاريخ</label>
                <input type="date" [(ngModel)]="newExpense.date" name="date" class="form-control">
              </div>
              
              <div class="modal-actions">
                <button type="button" class="btn-secondary" (click)="showAddExpenseModal = false">إلغاء</button>
                <button type="submit" class="btn-primary" [disabled]="expenseForm.invalid">حفظ المصروف</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Pay Commission Modal -->
      <div class="modal-overlay" *ngIf="showPayCommissionModal" (click)="closeModal($event)">
        <div class="modal-container" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>دفع عمولة الأستاذ</h3>
            <button class="close-btn" (click)="showPayCommissionModal = false">&times;</button>
          </div>
          <div class="modal-body">
            <div class="commission-details">
              <p><strong>الأستاذ:</strong> {{ selectedCommission?.teacher?.name }}</p>
              <p><strong>المبلغ:</strong> {{ formatCurrency(selectedCommission?.amount || 0) }}</p>
              <p><strong>الشهر:</strong> {{ selectedCommission?.month }}</p>
            </div>
            
            <form (ngSubmit)="confirmPayCommission()" #payForm="ngForm">
              <div class="form-group">
                <label>طريقة الدفع</label>
                <select [(ngModel)]="paymentData.paymentMethod" name="paymentMethod" class="form-control">
                  <option value="cash">نقدي</option>
                  <option value="bank">بنكي</option>
                  <option value="online">إلكتروني</option>
                </select>
              </div>
              
              <div class="form-group">
                <label>تاريخ الدفع</label>
                <input type="date" [(ngModel)]="paymentData.paymentDate" name="paymentDate" class="form-control">
              </div>
              
              <div class="modal-actions">
                <button type="button" class="btn-secondary" (click)="showPayCommissionModal = false">إلغاء</button>
                <button type="submit" class="btn-success" [disabled]="payForm.invalid">تأكيد الدفع</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    .accounting-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f8f9fa;
      min-height: 100vh;
    }

    /* Header Styles */
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 15px;
      padding: 25px;
      color: white;
      margin-bottom: 20px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }

    .header-title h1 {
      font-size: 28px;
      font-weight: 600;
      margin-bottom: 5px;
    }

    .welcome-text {
      font-size: 14px;
      opacity: 0.9;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .user-info {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    }

    .user-name {
      font-weight: 600;
      font-size: 16px;
    }

    .user-role {
      font-size: 12px;
      opacity: 0.9;
    }

    .btn-refresh {
      background: rgba(255, 255, 255, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.3);
      color: white;
      padding: 10px 20px;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.3s;
    }

    .btn-refresh:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.3);
    }

    .btn-refresh:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .date-display {
      font-size: 14px;
      opacity: 0.9;
      margin-top: 5px;
    }

    /* Loading Overlay */
    .loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(255, 255, 255, 0.9);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }

    .spinner {
      width: 50px;
      height: 50px;
      border: 5px solid #f3f3f3;
      border-top: 5px solid #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 15px;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    /* Tabs */
    .tabs-container {
      display: flex;
      gap: 10px;
      margin-bottom: 20px;
      background: white;
      padding: 10px;
      border-radius: 12px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
    }

    .tab-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 20px;
      border: none;
      background: transparent;
      color: #666;
      font-size: 14px;
      font-weight: 500;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s;
    }

    .tab-btn svg {
      width: 18px;
      height: 18px;
    }

    .tab-btn:hover {
      background: #f0f0f0;
      color: #333;
    }

    .tab-btn.active {
      background: #667eea;
      color: white;
    }

    /* Cards */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      margin-bottom: 20px;
    }

    .stat-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 15px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
      transition: transform 0.3s;
    }

    .stat-card:hover {
      transform: translateY(-5px);
    }

    .stat-icon {
      width: 50px;
      height: 50px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .income-card .stat-icon {
      background: rgba(72, 187, 120, 0.1);
      color: #48bb78;
    }

    .expense-card .stat-icon {
      background: rgba(245, 101, 101, 0.1);
      color: #f56565;
    }

    .profit-card .stat-icon {
      background: rgba(66, 153, 225, 0.1);
      color: #4299e1;
    }

    .pending-card .stat-icon {
      background: rgba(237, 137, 54, 0.1);
      color: #ed8936;
    }

    .stat-content h3 {
      font-size: 14px;
      color: #666;
      margin-bottom: 5px;
    }

    .stat-value {
      font-size: 24px;
      font-weight: 600;
      color: #333;
    }

    .stat-sub {
      font-size: 12px;
      color: #999;
    }

    /* Daily Stats */
    .daily-stats-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 20px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .card-header h2 {
      font-size: 18px;
      color: #333;
    }

    .date-badge {
      background: #f0f0f0;
      padding: 5px 10px;
      border-radius: 5px;
      font-size: 12px;
      color: #666;
    }

    .daily-stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 15px;
      margin-bottom: 20px;
    }

    .daily-stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 15px;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .daily-stat-item .label {
      font-size: 12px;
      color: #666;
      margin-bottom: 5px;
    }

    .daily-stat-item .value {
      font-size: 20px;
      font-weight: 600;
    }

    .positive {
      color: #48bb78;
    }

    .negative {
      color: #f56565;
    }

    /* Chart */
    .chart-container {
      margin-top: 20px;
    }

    .chart-container h3 {
      font-size: 16px;
      color: #333;
      margin-bottom: 15px;
    }

    .bar-chart {
      display: flex;
      justify-content: space-around;
      align-items: flex-end;
      height: 200px;
      padding: 20px 0;
    }

    .chart-bar {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      height: 100%;
      position: relative;
    }

    .bar-income, .bar-expense {
      width: 30px;
      background: #48bb78;
      border-radius: 5px 5px 0 0;
      position: relative;
      transition: height 0.3s;
    }

    .bar-expense {
      background: #f56565;
    }

    .bar-income:hover .tooltip,
    .bar-expense:hover .tooltip {
      display: block;
    }

    .tooltip {
      display: none;
      position: absolute;
      top: -25px;
      left: 50%;
      transform: translateX(-50%);
      background: #333;
      color: white;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 11px;
      white-space: nowrap;
    }

    .bar-label {
      margin-top: 10px;
      font-size: 11px;
      color: #666;
    }

    /* Transactions */
    .transactions-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
    }

    .btn-view-all {
      background: none;
      border: none;
      color: #667eea;
      cursor: pointer;
      font-size: 14px;
    }

    .transactions-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .transaction-item {
      display: flex;
      align-items: center;
      gap: 15px;
      padding: 15px;
      background: #f8f9fa;
      border-radius: 8px;
      transition: background 0.3s;
    }

    .transaction-item:hover {
      background: #f0f0f0;
    }

    .transaction-icon {
      width: 40px;
      height: 40px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .transaction-icon.income {
      background: rgba(72, 187, 120, 0.1);
      color: #48bb78;
    }

    .transaction-icon.expense {
      background: rgba(245, 101, 101, 0.1);
      color: #f56565;
    }

    .transaction-details {
      flex: 1;
    }

    .transaction-desc {
      font-size: 14px;
      font-weight: 500;
      color: #333;
      margin-bottom: 3px;
    }

    .transaction-meta {
      font-size: 11px;
      color: #999;
    }

    .transaction-amount {
      font-size: 16px;
      font-weight: 600;
    }

    .transaction-amount.income {
      color: #48bb78;
    }

    .transaction-amount.expense {
      color: #f56565;
    }

    /* Section Header */
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .section-header h2 {
      font-size: 20px;
      color: #333;
    }

    .filter-group {
      display: flex;
      gap: 10px;
    }

    .filter-select, .filter-input {
      padding: 8px 12px;
      border: 1px solid #ddd;
      border-radius: 8px;
      font-size: 14px;
      background: white;
    }

    .btn-primary {
      background: #667eea;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      transition: background 0.3s;
    }

    .btn-primary:hover:not(:disabled) {
      background: #5a67d8;
    }

    .btn-primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-success {
      background: #48bb78;
      color: white;
      border: none;
      padding: 8px 15px;
      border-radius: 5px;
      cursor: pointer;
      font-size: 12px;
    }

    .btn-success:hover {
      background: #38a169;
    }

    .btn-secondary {
      background: #e2e8f0;
      color: #4a5568;
      border: none;
      padding: 10px 20px;
      border-radius: 8px;
      cursor: pointer;
    }

    .btn-icon {
      background: none;
      border: none;
      color: #667eea;
      cursor: pointer;
      padding: 5px;
    }

    .btn-small {
      padding: 5px 10px;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-size: 12px;
    }

    /* Summary Cards */
    .summary-cards {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin-bottom: 20px;
    }

    .summary-card {
      background: white;
      border-radius: 10px;
      padding: 20px;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
      display: flex;
      flex-direction: column;
    }

    .summary-card .label {
      font-size: 14px;
      color: #666;
      margin-bottom: 10px;
    }

    .summary-card .value {
      font-size: 28px;
      font-weight: 600;
      color: #333;
    }

    /* Data Table */
    .data-table-container {
      background: white;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
      overflow-x: auto;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
    }

    .data-table th {
      text-align: right;
      padding: 15px;
      background: #f8f9fa;
      color: #333;
      font-size: 14px;
      font-weight: 600;
      border-bottom: 2px solid #ddd;
    }

    .data-table td {
      padding: 15px;
      border-bottom: 1px solid #eee;
      font-size: 14px;
      color: #666;
    }

    .data-table tbody tr:hover {
      background: #f8f9fa;
    }

    .badge {
      padding: 5px 10px;
      border-radius: 5px;
      font-size: 12px;
      background: #e2e8f0;
      color: #4a5568;
    }

    .badge-primary {
      background: #667eea;
      color: white;
    }

    .badge-success {
      background: #48bb78;
      color: white;
    }

    .badge-warning {
      background: #ed8936;
      color: white;
    }

    .amount {
      font-weight: 600;
    }

    .no-data {
      text-align: center;
      color: #999;
      padding: 30px;
    }

    /* Report Styles */
    .report-content {
      background: white;
      border-radius: 12px;
      padding: 30px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
    }

    .report-header {
      margin-bottom: 30px;
    }

    .report-header h3 {
      font-size: 24px;
      color: #333;
      margin-bottom: 10px;
    }

    .report-header p {
      color: #666;
    }

    .report-summary-cards {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin-bottom: 30px;
    }

    .report-card {
      background: #f8f9fa;
      border-radius: 10px;
      padding: 20px;
    }

    .report-card .label {
      font-size: 14px;
      color: #666;
      margin-bottom: 10px;
    }

    .report-card .value {
      font-size: 28px;
      font-weight: 600;
    }

    .report-card.income .value {
      color: #48bb78;
    }

    .report-card.expense .value {
      color: #f56565;
    }

    .report-card.profit.positive .value {
      color: #48bb78;
    }

    .report-card.profit.negative .value {
      color: #f56565;
    }

    .report-details {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
    }

    .details-section h4 {
      font-size: 18px;
      color: #333;
      margin-bottom: 15px;
    }

    .details-table {
      width: 100%;
      border-collapse: collapse;
    }

    .details-table tr {
      border-bottom: 1px solid #eee;
    }

    .details-table td {
      padding: 10px 0;
      font-size: 14px;
    }

    .details-table td:last-child {
      text-align: left;
    }

    /* Modal */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-container {
      background: white;
      border-radius: 15px;
      width: 500px;
      max-width: 90%;
      max-height: 90vh;
      overflow-y: auto;
      animation: slideIn 0.3s;
    }

    @keyframes slideIn {
      from {
        transform: translateY(-50px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    .modal-header {
      padding: 20px;
      border-bottom: 1px solid #eee;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .modal-header h3 {
      font-size: 18px;
      color: #333;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #999;
    }

    .modal-body {
      padding: 20px;
    }

    .form-group {
      margin-bottom: 15px;
    }

    .form-group label {
      display: block;
      margin-bottom: 5px;
      font-size: 14px;
      color: #333;
    }

    .form-control {
      width: 100%;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 8px;
      font-size: 14px;
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 20px;
    }

    .commission-details {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 20px;
    }

    .commission-details p {
      margin: 5px 0;
      font-size: 14px;
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .daily-stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 768px) {
      .header-content {
        flex-direction: column;
        gap: 15px;
      }

      .tabs-container {
        flex-wrap: wrap;
      }

      .tab-btn {
        flex: 1 1 auto;
      }

      .stats-grid {
        grid-template-columns: 1fr;
      }

      .daily-stats-grid {
        grid-template-columns: 1fr;
      }

      .filter-group {
        flex-direction: column;
      }

      .summary-cards {
        grid-template-columns: 1fr;
      }

      .report-details {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class AccountingComponent implements OnInit, OnDestroy {
  // User Data
  currentUser: User | null = null;
  currentDate: Date = new Date();
  today: Date = new Date();

  // UI State
  activeTab: string = 'dashboard';
  isLoading: boolean = false;
  showAddExpenseModal: boolean = false;
  showPayCommissionModal: boolean = false;

  // Financial Data
  totalIncome: number = 0;
  totalExpenses: number = 0;
  netProfit: number = 0;
  pendingPaymentsCount: number = 0;

  // Daily Stats
  dailyIncome: number = 0;
  dailyExpenses: number = 0;
  dailyProfit: number = 0;
  dailyClasses: number = 0;

  // Chart Data
  monthlyChartData: ChartDataItem[] = [];
  maxChartValue: number = 1;

  // Transactions
  recentTransactions: Transaction[] = [];
  incomeTransactions: Transaction[] = [];
  expenses: Expense[] = [];

  // Commissions
  commissions: TeacherCommission[] = [];
  pendingCommissionsTotal: number = 0;
  paidCommissionsTotal: number = 0;
  selectedCommission: TeacherCommission | null = null;

  // Monthly Report
  monthlyReport: MonthlyReport | null = null;

  // Filters
  incomeFilter = {
    type: 'all',
    month: new Date().toISOString().slice(0, 7)
  };

  commissionFilter = {
    status: 'all',
    month: new Date().toISOString().slice(0, 7)
  };

  reportFilter = {
    type: 'monthly',
    startDate: new Date(new Date().setDate(1)).toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10)
  };

  // New Expense Form
  newExpense = {
    description: '',
    amount: 0,
    category: 'other',
    paymentMethod: 'cash',
    date: new Date().toISOString().slice(0, 10)
  };

  // Payment Data
  paymentData = {
    paymentMethod: 'cash',
    paymentDate: new Date().toISOString().slice(0, 10)
  };

  private refreshInterval: any;
  private readonly API_URL = 'http://localhost:4200/api';

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.loadUserFromStorage();
  }

  ngOnInit(): void {
    this.loadAllData();
    
    // Auto refresh every 5 minutes
    this.refreshInterval = setInterval(() => {
      this.refreshData();
    }, 300000);
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  // ==================== Utility Functions ====================

  getFormattedDate(date: Date | string | undefined): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
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
      'salary': 'راتب',
      'rent': 'إيجار',
      'utilities': 'مرافق',
      'supplies': 'مستلزمات',
      'maintenance': 'صيانة',
      'marketing': 'تسويق',
      'other': 'أخرى'
    };
    return categories[category] || category;
  }

  getPaymentMethodName(method: string): string {
    const methods: { [key: string]: string } = {
      'cash': 'نقدي',
      'bank': 'بنكي',
      'online': 'إلكتروني'
    };
    return methods[method] || method;
  }

  // ==================== Data Loading ====================

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

  async loadAllData(): Promise<void> {
    this.isLoading = true;
    
    try {
      await Promise.all([
        this.loadDashboardStats(),
        this.loadRecentTransactions(),
        this.loadExpenses(),
        this.loadCommissions(),
        this.loadMonthlyReport()
      ]);
      
      this.calculateChartData();
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      this.isLoading = false;
    }
  }

  loadDashboardStats(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Get daily stats
      this.http.get<any>(`${this.API_URL}/accounting/daily-income`).subscribe({
        next: (response) => {
          this.dailyIncome = response.dailyIncome || 0;
          
          // Get today's expenses
          this.http.get<any>(`${this.API_URL}/accounting/today-expenses`).subscribe({
            next: (expenseResponse) => {
              this.dailyExpenses = expenseResponse.total || 0;
              this.dailyProfit = this.dailyIncome - this.dailyExpenses;
            },
            error: (err) => console.error('Error loading today expenses:', err)
          });

          // Get today's classes
          this.http.get<any[]>(`${this.API_URL}/live-classes/today`).subscribe({
            next: (classes) => {
              this.dailyClasses = classes.length;
            },
            error: (err) => console.error('Error loading today classes:', err)
          });

          // Get financial summary
          this.http.get<any>(`${this.API_URL}/accounting/summary`).subscribe({
            next: (summary) => {
              this.totalIncome = summary.totalIncome || 0;
              this.totalExpenses = summary.totalExpenses || 0;
              this.pendingPaymentsCount = summary.pendingPayments || 0;
              this.netProfit = this.totalIncome - this.totalExpenses;
            },
            error: (err) => console.error('Error loading summary:', err)
          });

          resolve();
        },
        error: (err) => {
          console.error('Error loading daily income:', err);
          reject(err);
        }
      });
    });
  }

  loadRecentTransactions(): Promise<void> {
    return new Promise((resolve) => {
      this.http.get<any[]>(`${this.API_URL}/accounting/all-transactions?limit=20`).subscribe({
        next: (transactions) => {
          this.recentTransactions = transactions || [];
          resolve();
        },
        error: (err) => {
          console.error('Error loading transactions:', err);
          this.recentTransactions = [];
          resolve();
        }
      });
    });
  }

  loadIncomeData(): Promise<void> {
    return new Promise((resolve) => {
      let url = `${this.API_URL}/accounting/all-transactions?type=income`;
      
      if (this.incomeFilter.type !== 'all') {
        url += `&category=${this.incomeFilter.type}`;
      }
      
      this.http.get<any[]>(url).subscribe({
        next: (transactions) => {
          this.incomeTransactions = transactions || [];
          this.totalIncome = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
          resolve();
        },
        error: (err) => {
          console.error('Error loading income:', err);
          this.incomeTransactions = [];
          this.totalIncome = 0;
          resolve();
        }
      });
    });
  }

  loadExpenses(): Promise<void> {
    return new Promise((resolve) => {
      this.http.get<any[]>(`${this.API_URL}/accounting/expenses`).subscribe({
        next: (expenses) => {
          this.expenses = expenses || [];
          this.totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
          resolve();
        },
        error: (err) => {
          console.error('Error loading expenses:', err);
          this.expenses = [];
          this.totalExpenses = 0;
          resolve();
        }
      });
    });
  }

  loadCommissions(): Promise<void> {
    return new Promise((resolve) => {
      let url = `${this.API_URL}/accounting/teacher-commissions`;
      const params: string[] = [];
      
      if (this.commissionFilter.status !== 'all') {
        params.push(`status=${this.commissionFilter.status}`);
      }
      
      if (this.commissionFilter.month) {
        params.push(`month=${this.commissionFilter.month}`);
      }
      
      if (params.length > 0) {
        url += '?' + params.join('&');
      }
      
      this.http.get<TeacherCommission[]>(url).subscribe({
        next: (commissions) => {
          this.commissions = commissions || [];
          this.calculateCommissionTotals();
          resolve();
        },
        error: (err) => {
          console.error('Error loading commissions:', err);
          this.commissions = [];
          this.calculateCommissionTotals();
          resolve();
        }
      });
    });
  }

  loadMonthlyReport(): Promise<void> {
    return new Promise((resolve) => {
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
      const endDate = now.toISOString().slice(0, 10);
      
      this.http.get<any>(`${this.API_URL}/accounting/monthly-financial-report?startDate=${startDate}&endDate=${endDate}`).subscribe({
        next: (report) => {
          this.monthlyReport = report;
          resolve();
        },
        error: (err) => {
          console.error('Error loading monthly report:', err);
          this.monthlyReport = null;
          resolve();
        }
      });
    });
  }

  calculateChartData(): void {
    // Simple chart data for the last 6 months
    const months: ChartDataItem[] = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        month: date.toLocaleDateString('ar-EG', { month: 'short' }),
        income: Math.random() * 100000 + 50000, // Demo data - replace with real data
        expense: Math.random() * 80000 + 30000   // Demo data - replace with real data
      });
    }
    
    this.monthlyChartData = months;
    this.maxChartValue = Math.max(
      ...months.map(m => Math.max(m.income, m.expense))
    );
  }

  calculateCommissionTotals(): void {
    this.pendingCommissionsTotal = this.commissions
      .filter(c => c.status === 'pending')
      .reduce((sum, c) => sum + (c.amount || 0), 0);
      
    this.paidCommissionsTotal = this.commissions
      .filter(c => c.status === 'paid')
      .reduce((sum, c) => sum + (c.amount || 0), 0);
  }

  // ==================== Actions ====================

  setActiveTab(tab: string): void {
    this.activeTab = tab;
    
    // Load tab-specific data
    if (tab === 'income') {
      this.loadIncomeData();
    } else if (tab === 'expenses') {
      this.loadExpenses();
    } else if (tab === 'commissions') {
      this.loadCommissions();
    } else if (tab === 'reports') {
      this.loadMonthlyReport();
    }
  }

  refreshData(): void {
    this.loadAllData();
  }

  addExpense(): void {
    if (!this.newExpense.description || !this.newExpense.amount) {
      alert('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    this.isLoading = true;
    
    const token = localStorage.getItem('access_token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    const expenseData = {
      ...this.newExpense,
      amount: Number(this.newExpense.amount)
    };

    this.http.post(`${this.API_URL}/accounting/expenses`, expenseData, { headers }).subscribe({
      next: () => {
        this.showAddExpenseModal = false;
        this.newExpense = {
          description: '',
          amount: 0,
          category: 'other',
          paymentMethod: 'cash',
          date: new Date().toISOString().slice(0, 10)
        };
        this.loadAllData();
      },
      error: (err) => {
        console.error('Error adding expense:', err);
        alert('حدث خطأ أثناء إضافة المصروف');
        this.isLoading = false;
      }
    });
  }

  payCommission(commission: TeacherCommission): void {
    this.selectedCommission = commission;
    this.showPayCommissionModal = true;
  }

  confirmPayCommission(): void {
    if (!this.selectedCommission) return;

    this.isLoading = true;
    
    const token = localStorage.getItem('access_token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    const paymentData = {
      paymentMethod: this.paymentData.paymentMethod,
      paymentDate: this.paymentData.paymentDate || new Date().toISOString().slice(0, 10)
    };

    this.http.post(`${this.API_URL}/accounting/teacher-commissions/${this.selectedCommission._id}/pay`, paymentData, { headers }).subscribe({
      next: () => {
        this.showPayCommissionModal = false;
        this.selectedCommission = null;
        this.paymentData = {
          paymentMethod: 'cash',
          paymentDate: new Date().toISOString().slice(0, 10)
        };
        this.loadCommissions();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error paying commission:', err);
        alert('حدث خطأ أثناء دفع العمولة');
        this.isLoading = false;
      }
    });
  }

  viewExpenseDetails(expense: Expense): void {
    // Implement view details functionality
    console.log('View expense:', expense);
  }

  generateReport(): void {
    this.isLoading = true;
    
    let startDate: string;
    let endDate: string;
    
    if (this.reportFilter.type === 'monthly') {
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
      endDate = now.toISOString().slice(0, 10);
    } else if (this.reportFilter.type === 'yearly') {
      const now = new Date();
      startDate = new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10);
      endDate = now.toISOString().slice(0, 10);
    } else {
      startDate = this.reportFilter.startDate;
      endDate = this.reportFilter.endDate;
    }
    
    this.http.get<any>(`${this.API_URL}/accounting/monthly-financial-report?startDate=${startDate}&endDate=${endDate}`).subscribe({
      next: (report) => {
        this.monthlyReport = report;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error generating report:', err);
        alert('حدث خطأ أثناء توليد التقرير');
        this.isLoading = false;
      }
    });
  }

  closeModal(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.showAddExpenseModal = false;
      this.showPayCommissionModal = false;
    }
  }
}