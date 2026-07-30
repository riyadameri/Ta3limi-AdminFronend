import { Component, OnInit, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment.development';

interface Transaction {
  _id: string;
  type: string;
  amount: number;
  description: string;
  category: string;
  date: string;
  paymentDate?: string;
  createdAt?: string;
  recordedBy?: any;
  student?: any;
  class?: any;
  teacher?: any;
  status?: string;
  _type?: string;
  typeLabel?: string;
  icon?: string;
  schoolId?: string;
}

interface School {
  _id: string;
  name: string;
  schoolKey: string;
  subscription?: {
    plan: string;
    planName: string;
    isActive: boolean;
    daysRemaining: number;
  };
}

@Component({
  selector: 'app-on-payments-component',
  standalone: true,
  imports: [CommonModule, FormsModule],
template: `
    <style>
      /* ==========================================
         إعدادات عامة ومنع تجاوز العرض (Overflow Fix)
         ========================================== */
      :host {
        --primary: #2563eb;
        --primary-dark: #1d4ed8;
        --primary-light: #dbeafe;
        --secondary: #059669;
        --secondary-light: #d1fae5;
        --secondary-dark: #047857;
        --danger: #ef4444;
        --danger-light: #fee2e2;
        --warning: #f59e0b;
        --warning-light: #fef3c7;
        --text-dark: #0f172a;
        --text-medium: #334155;
        --text-light: #64748b;
        --text-muted: #94a3b8;
        --bg-body: #f0f4f8;
        --bg-card: #ffffff;
        --bg-hover: #f8fafc;
        --border: #e2e8f0;
        --border-light: #f1f5f9;
        --radius: 12px;
        --radius-sm: 8px;
        --radius-xs: 6px;
        --shadow-sm: 0 1px 3px rgba(0,0,0,0.1);
        display: block;
        width: 100%;
        font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
        direction: rtl;
      }

      * {
        box-sizing: border-box;
      }

      /* الحاوية الرئيسية تم إصلاحها لمنع الخروج عن الشاشة */
      .page-wrapper {
        width: 100%;
        max-width: 100vw;
        min-height: 100vh;
        background: var(--bg-body);
        padding: 0;
        margin: 0;
        overflow-x: hidden; /* يمنع تحرك الصفحة يميناً ويساراً */
      }

      .page-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 16px;
        width: 100%;
      }

      @media (max-width: 768px) {
        .page-container {
          padding: 12px 10px;
        }
      }

      /* ==========================================
         الرأس والأزرار (Header)
         ========================================== */
      .page-header {
        display: flex;
        flex-direction: column; /* ترتيب عمودي في الهواتف لتوفير المساحة */
        gap: 12px;
        margin-bottom: 16px;
        background: var(--bg-card);
        padding: 12px;
        border-radius: var(--radius);
        box-shadow: var(--shadow-sm);
        border-right: 4px solid var(--primary);
      }

      .header-top {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
      }

      .page-title {
        display: flex;
        align-items: center;
        gap: 6px;
        color: var(--text-dark);
        font-size: 1rem;
        font-weight: 700;
        margin: 0;
      }

      .back-link {
        color: var(--text-light);
        font-size: 0.85rem;
        text-decoration: none;
        display: flex;
        align-items: center;
        gap: 4px;
        cursor: pointer;
      }

      .header-actions {
        display: flex;
        gap: 8px;
        width: 100%;
      }

      .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        padding: 10px;
        border: none;
        border-radius: var(--radius-sm);
        font-weight: 600;
        font-size: 0.85rem;
        cursor: pointer;
        transition: all 0.2s;
        flex: 1; /* الأزرار تأخذ مساحة متساوية */
      }

      .btn-primary { background: var(--primary); color: white; }
      .btn-secondary { background: var(--secondary); color: white; }
      .btn-outline { border: 1px solid var(--border); color: var(--text-medium); background: transparent; }
      
      .btn-outline-primary { border: 1px solid var(--primary); color: var(--primary); background: transparent; }
      .btn-outline-primary.active { background: var(--primary); color: white; }
      
      .btn-outline-success { border: 1px solid var(--secondary); color: var(--secondary); background: transparent; }
      .btn-outline-success.active { background: var(--secondary); color: white; }
      
      .btn-outline-danger { border: 1px solid var(--danger); color: var(--danger); background: transparent; }
      .btn-outline-danger.active { background: var(--danger); color: white; }

      .btn-outline-warning { border: 1px solid var(--warning); color: #b45309; background: transparent; }
      .btn-outline-warning.active { background: var(--warning); color: white; }

      /* ==========================================
         بطاقة المدرسة
         ========================================== */
      .school-card {
        background: var(--bg-card);
        border-radius: var(--radius);
        padding: 12px;
        margin-bottom: 16px;
        box-shadow: var(--shadow-sm);
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
        border-right: 4px solid var(--secondary);
      }
      
      .school-info-row {
        display: flex;
        justify-content: space-between;
        width: 100%;
        align-items: center;
      }

      /* ==========================================
         الإحصائيات (Stats Grid) - تم إصلاح القص
         ========================================== */
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 10px;
        margin-bottom: 16px;
        width: 100%; /* تأكيد عدم تجاوز العرض */
      }

      .stat-card {
        background: var(--bg-card);
        padding: 12px 8px;
        border-radius: var(--radius-sm);
        text-align: center;
        box-shadow: var(--shadow-sm);
        border: 1px solid var(--border-light);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
      }

      .stat-label {
        font-size: 0.65rem;
        color: var(--text-light);
        margin-bottom: 4px;
        font-weight: 600;
      }

      .stat-value {
        font-size: 1rem;
        font-weight: bold;
      }

      /* ==========================================
         شريط التصفية (Filter Bar)
         ========================================== */
      .filter-bar {
        display: flex;
        flex-wrap: nowrap;
        gap: 6px;
        margin-bottom: 16px;
        overflow-x: auto;
        padding-bottom: 8px;
        -webkit-overflow-scrolling: touch;
        width: 100%;
      }
      
      .filter-bar::-webkit-scrollbar { height: 3px; }
      .filter-bar::-webkit-scrollbar-track { background: transparent; }
      .filter-bar::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }

      .filter-bar .btn {
        flex: 0 0 auto; /* منع الانضغاط */
        font-size: 0.7rem;
        padding: 6px 10px;
      }

      /* ==========================================
         الجدول (Table) - تم إصلاح التمرير
         ========================================== */
      .table-container {
        background: var(--bg-card);
        border-radius: var(--radius);
        box-shadow: var(--shadow-sm);
        border: 1px solid var(--border-light);
        margin-bottom: 16px;
        width: 100%;
        overflow: hidden; /* يمنع الجدول من كسر الصفحة */
      }

      .table-responsive {
        width: 100%;
        overflow-x: auto; /* يسمح بالتمرير الأفقي للجدول فقط */
        -webkit-overflow-scrolling: touch;
        display: block;
      }

      .table {
        width: 100%;
        border-collapse: collapse;
        min-width: 600px; /* العرض الأدنى ليحافظ على شكله أثناء التمرير */
        text-align: right;
      }

      .table th, .table td {
        padding: 10px 12px;
        border-bottom: 1px solid var(--border-light);
        font-size: 0.75rem;
        vertical-align: middle;
      }

      .table th {
        background: var(--bg-hover);
        color: var(--text-medium);
        font-weight: 600;
        white-space: nowrap;
      }

      /* ==========================================
         النافذة المنبثقة (Modal)
         ========================================== */
      .modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: flex-end; /* يظهر من الأسفل في الهواتف */
        justify-content: center;
        z-index: 1000;
      }

      .modal-container {
        background: var(--bg-card);
        border-radius: var(--radius) var(--radius) 0 0;
        width: 100%;
        max-width: 500px;
        max-height: 85vh;
        display: flex;
        flex-direction: column;
      }

      @media (min-width: 768px) {
        .modal-overlay { align-items: center; padding: 16px; }
        .modal-container { border-radius: var(--radius); max-height: 90vh; }
      }

      .modal-header, .modal-footer {
        padding: 14px 16px;
        background: var(--bg-card);
      }
      
      .modal-header { 
        border-bottom: 1px solid var(--border-light); 
        display: flex; 
        justify-content: space-between; 
        align-items: center;
        border-radius: var(--radius) var(--radius) 0 0;
      }
      
      .modal-footer { 
        border-top: 1px solid var(--border-light); 
        display: flex; 
        gap: 8px; 
      }
      
      .modal-body {
        padding: 16px;
        overflow-y: auto;
      }

      .form-group { margin-bottom: 14px; }
      .form-group label { display: block; font-size: 0.8rem; margin-bottom: 6px; font-weight: 600; color: var(--text-medium); }
      
      .form-control {
        width: 100%;
        padding: 10px;
        border: 1px solid var(--border);
        border-radius: var(--radius-sm);
        font-size: 16px; /* يمنع الزووم في هواتف آيفون */
        font-family: inherit;
        background: #fff;
      }
      
      .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }

      /* ==========================================
         التنبيهات والشارات (Badges)
         ========================================== */
      .badge-custom {
        padding: 3px 8px;
        border-radius: 12px;
        font-size: 0.65rem;
        font-weight: 600;
        display: inline-flex;
        align-items: center;
        gap: 4px;
        white-space: nowrap;
      }
      
      .bg-success { background: var(--secondary-light); color: var(--secondary-dark); }
      .bg-danger { background: var(--danger-light); color: #991b1b; }
      .bg-primary { background: var(--primary-light); color: var(--primary-dark); }
      .bg-warning { background: var(--warning-light); color: #92400e; }
      .bg-secondary { background: var(--bg-body); color: var(--text-medium); }
      
      .action-btn {
        width: 28px;
        height: 28px;
        border: none;
        border-radius: var(--radius-sm);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 0.75rem;
      }
      
      .action-btn.view { background: var(--primary-light); color: var(--primary); }
      .action-btn.delete { background: var(--danger-light); color: var(--danger); }
      
      .notifications-container {
        position: fixed;
        top: 16px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 2000;
        width: calc(100% - 32px);
        max-width: 320px;
        pointer-events: none;
      }
      
      .notification {
        padding: 12px 16px;
        border-radius: var(--radius-sm);
        margin-bottom: 8px;
        color: white;
        font-size: 0.8rem;
        display: flex;
        align-items: center;
        gap: 8px;
        box-shadow: var(--shadow-sm);
      }
      
      .notification.success { background: var(--secondary); }
      .notification.error { background: var(--danger); }
      .notification.warning { background: var(--warning); color: #fff; }
      .notification.info { background: var(--primary); }
      
      .text-success { color: var(--secondary) !important; }
      .text-danger { color: var(--danger) !important; }
      .text-primary { color: var(--primary) !important; }
      .text-warning { color: var(--warning) !important; }
    </style>

    <div class="page-wrapper">
      <div class="page-container">
        
        <!-- الرأس -->
        <header class="page-header">
          <div class="header-top">
            <h3 class="page-title">
              <i class="fas fa-credit-card text-primary"></i> معاملات اليوم
            </h3>
            <a class="back-link" (click)="goBack()">
              <i class="fas fa-arrow-right"></i> العودة
            </a>
          </div>
          <div class="header-actions">
            <!-- الزر الأزرق (+ مصروف) -->
            <button class="btn btn-primary" (click)="openAddExpense()">
              <i class="fas fa-plus"></i> إضافة مصروف
            </button>
            <!-- الزر الأخضر (تحديث) -->
            <button class="btn btn-secondary" (click)="refreshData()">
              <i class="fas fa-sync-alt"></i> تحديث
            </button>
          </div>
        </header>

        <!-- بطاقة المدرسة -->
        <div class="school-card" *ngIf="school">
          <div class="school-info-row">
            <h5 class="page-title" style="font-size: 0.9rem;">
              <i class="fas fa-school text-secondary"></i> {{ school.name }}
            </h5>
            <span class="badge-custom bg-secondary">{{ school.schoolKey }}</span>
          </div>
          <div class="school-info-row" *ngIf="school.subscription">
            <span class="badge-custom" [class.bg-success]="school.subscription.isActive" [class.bg-danger]="!school.subscription.isActive">
              <i [class]="school.subscription.isActive ? 'fas fa-circle' : 'fas fa-times-circle'" style="font-size: 0.4rem;"></i>
              {{ school.subscription.isActive ? 'نشط' : 'منتهي' }}
            </span>
            <span class="badge-custom bg-secondary">
              <i class="fas fa-clock"></i> {{ school.subscription.daysRemaining || 0 }} يوم
            </span>
          </div>
        </div>

        <!-- الإحصائيات -->
        <div class="stats-grid" *ngIf="summary">
          <div class="stat-card">
            <span class="stat-label"><i class="fas fa-arrow-down text-primary"></i> الإيرادات</span>
            <span class="stat-value text-primary">{{ summary.totalIncome | number }} د.ج</span>
          </div>
          <div class="stat-card">
            <span class="stat-label"><i class="fas fa-arrow-up text-danger"></i> المصروفات</span>
            <span class="stat-value text-danger">{{ summary.totalExpenses | number }} د.ج</span>
          </div>
          <div class="stat-card">
            <span class="stat-label"><i class="fas fa-wallet text-success"></i> صافي المبلغ</span>
            <span class="stat-value" [class.text-success]="(summary.totalIncome - summary.totalExpenses) >= 0" [class.text-danger]="(summary.totalIncome - summary.totalExpenses) < 0">
              {{ summary.totalIncome - summary.totalExpenses | number }} د.ج
            </span>
          </div>
          <div class="stat-card">
            <span class="stat-label"><i class="fas fa-list text-warning"></i> المعاملات</span>
            <span class="stat-value text-warning">{{ summary.totalTransactions }}</span>
          </div>
        </div>

        <!-- شريط التصفية -->
        <div class="filter-bar">
          <button class="btn btn-outline-primary" [class.active]="filterType === 'all'" (click)="setFilter('all')">
            الكل ({{ transactions.length }})
          </button>
          <button class="btn btn-outline-success" [class.active]="filterType === 'income'" (click)="setFilter('income')">
             <i class="fas fa-arrow-down"></i> إيرادات ({{ getIncomeCount() }})
          </button>
          <button class="btn btn-outline-danger" [class.active]="filterType === 'expense'" (click)="setFilter('expense')">
             <i class="fas fa-arrow-up"></i> مصروفات ({{ getExpenseCount() }})
          </button>
          <button class="btn btn-outline-primary" [class.active]="filterType === 'payment'" (click)="setFilter('payment')">
             <i class="fas fa-money-bill"></i> دفعات ({{ getPaymentCount() }})
          </button>
          <button class="btn btn-outline-warning" [class.active]="filterType === 'commission'" (click)="setFilter('commission')">
             <i class="fas fa-star"></i> عمولات ({{ getCommissionCount() }})
          </button>
        </div>

        <!-- الجدول -->
        <div class="table-container">
          <div class="table-responsive">
            <table class="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>الوصف</th>
                  <th>النوع</th>
                  <th>المبلغ</th>
                  <th>التصنيف</th>
                  <th>التاريخ</th>
                  <th>الحالة</th>
                  <th>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngIf="filteredTransactions.length === 0">
                  <td colspan="8" style="text-align: center; padding: 30px; color: var(--text-light);">
                    لا توجد معاملات مدفوعة لهذا اليوم
                  </td>
                </tr>
                <tr *ngFor="let transaction of filteredTransactions; let i = index">
                  <td>{{ i + 1 }}</td>
                  <td style="max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    {{ transaction.description || 'غير محدد' }}
                  </td>
                  <td>
                    <span class="badge-custom" 
                          [class.bg-success]="transaction.type === 'income'" 
                          [class.bg-danger]="transaction.type === 'expense'"
                          [class.bg-primary]="transaction._type === 'payment'"
                          [class.bg-warning]="transaction._type === 'commission'">
                      {{ transaction.typeLabel || transaction.type || 'غير محدد' }}
                    </span>
                  </td>
                  <td style="font-weight: bold;" [class.text-success]="transaction.type === 'income'" [class.text-danger]="transaction.type === 'expense'">
                    {{ transaction.amount | number }}
                  </td>
                  <td>
                    <span class="badge-custom bg-secondary">{{ transaction.category || 'غير محدد' }}</span>
                  </td>
                  <td style="direction: ltr; text-align: right;">
                    {{ (transaction.paymentDate || transaction.date || transaction.createdAt) | date:'HH:mm' }}
                  </td>
                  <td>
                    <span class="badge-custom" 
                          [class.bg-success]="transaction.status === 'paid'"
                          [class.bg-warning]="transaction.status === 'pending'"
                          [class.bg-danger]="transaction.status === 'late'">
                      {{ transaction.status === 'paid' ? 'مدفوع' : (transaction.status === 'pending' ? 'معلق' : 'متأخر') }}
                    </span>
                  </td>
                  <td>
                    <div style="display:flex; gap:6px;">
                      <button class="action-btn view" (click)="viewTransaction(transaction)"><i class="fas fa-eye"></i></button>
                      <button class="action-btn delete" (click)="deleteTransaction(transaction)"><i class="fas fa-trash"></i></button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- نافذة إضافة مصروف -->
    <div class="modal-overlay" *ngIf="showExpenseModal" (click)="closeExpenseModal()">
      <div class="modal-container" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h5 style="margin:0; font-size: 1rem;"><i class="fas fa-plus-circle text-primary"></i> إضافة مصروف</h5>
          <button class="action-btn" style="background:transparent; color: var(--text-light);" (click)="closeExpenseModal()">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <form #expenseForm="ngForm" (ngSubmit)="submitExpense(expenseForm)">
            <div class="form-group">
              <label>وصف المصروف <span class="text-danger">*</span></label>
              <input type="text" class="form-control" name="description" [(ngModel)]="newExpense.description" required placeholder="مثال: فواتير الكهرباء">
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>المبلغ (د.ج) <span class="text-danger">*</span></label>
                <input type="number" class="form-control" name="amount" [(ngModel)]="newExpense.amount" required min="1" placeholder="0">
              </div>
              <div class="form-group">
                <label>التصنيف <span class="text-danger">*</span></label>
                <select class="form-control" name="category" [(ngModel)]="newExpense.category" required>
                  <option value="tuition">رسوم دراسية</option>
                  <option value="salary">رواتب</option>
                  <option value="rent">إيجار</option>
                  <option value="utilities">فواتير</option>
                  <option value="supplies">مستلزمات</option>
                  <option value="other">أخرى</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label>طريقة الدفع</label>
              <select class="form-control" name="paymentMethod" [(ngModel)]="newExpense.paymentMethod">
                <option value="cash">نقداً</option>
                <option value="bank_transfer">تحويل بنكي</option>
                <option value="cheque">شيك</option>
              </select>
            </div>
            <div class="form-group">
              <label>ملاحظات</label>
              <textarea class="form-control" name="notes" [(ngModel)]="newExpense.notes" rows="2"></textarea>
            </div>
            
            <div class="modal-footer" style="margin-top: 10px;">
              <button type="button" class="btn btn-outline" (click)="closeExpenseModal()">إلغاء</button>
              <button type="submit" class="btn btn-primary" [disabled]="!expenseForm.valid || isSubmitting">
                <i class="fas fa-spinner fa-spin" *ngIf="isSubmitting"></i>
                {{ isSubmitting ? 'جاري الحفظ...' : 'حفظ المصروف' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- التنبيهات -->
    <div class="notifications-container">
      <div *ngFor="let note of notifications" class="notification" [class]="note.type">
        <i [class]="note.type === 'success' ? 'fas fa-check-circle' : 'fas fa-info-circle'"></i>
        <span>{{ note.message }}</span>
      </div>
    </div>
  `
})
export class OnPaymentsComponentComponent implements OnInit {
  
  private apiUrl = environment.apiUrl;
  
  school: School | null = null;
  transactions: Transaction[] = [];
  filteredTransactions: Transaction[] = [];
  
  summary: any = {
    totalIncome: 0,
    totalExpenses: 0,
    totalTransactions: 0
  };
  
  todayDate: string = '';
  filterType: string = 'all';
  
  showExpenseModal: boolean = false;
  isSubmitting: boolean = false;
  newExpense: any = {
    description: '',
    amount: null,
    category: 'other',
    paymentMethod: 'cash',
    notes: ''
  };
  
  notifications: any[] = [];

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    const now = new Date();
    this.todayDate = now.toLocaleDateString('ar-EG', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    this.loadSchoolData();
    this.loadTransactions();
  }

  loadSchoolData(): void {
    try {
      const schoolData = localStorage.getItem('school');
      if (schoolData) {
        this.school = JSON.parse(schoolData);
      } else {
        this.showNotification('warning', 'لم يتم العثور على بيانات المدرسة');
      }
    } catch (e) {
      console.error('❌ خطأ في قراءة بيانات المدرسة:', e);
      this.showNotification('error', 'حدث خطأ في قراءة بيانات المدرسة');
    }
  }

  loadTransactions(): void {
    if (!this.school || !this.school._id) {
      this.showNotification('warning', 'بيانات المدرسة غير متوفرة');
      return;
    }

    const schoolId = this.school._id;
    
    this.http.get<any>(`${this.apiUrl}/accounting/todays-transactions/${schoolId}`)
      .subscribe({
        next: (response) => {
          if (response && response.success) {
            const allTransactions = response.transactions || [];
            
            this.transactions = allTransactions.filter(t => {
              const status = t.status || t._type || '';
              return status === 'paid' || 
                     status === 'مدفوع' ||
                     (t.type === 'expense' && t.status === 'paid') ||
                     (t.type === 'income' && t.status === 'paid') ||
                     t._type === 'payment' ||
                     t._type === 'commission' ||
                     t._type === 'registration_fee';
            });
            
            this.summary = {
              totalIncome: 0,
              totalExpenses: 0,
              totalTransactions: this.transactions.length
            };
            
            this.transactions.forEach(t => {
              if (t.type === 'income' || t._type === 'payment' || t._type === 'registration_fee') {
                this.summary.totalIncome += t.amount;
              } else if (t.type === 'expense' || t._type === 'expense' || t._type === 'commission') {
                this.summary.totalExpenses += t.amount;
              }
            });
            
            if (response.date && response.date.formatted) {
              this.todayDate = response.date.formatted;
            }
            
            this.applyFilter();
            this.showNotification('success', `✅ تم تحميل ${this.transactions.length} معاملة مدفوعة`);
          } else {
            this.showNotification('error', response?.error || 'فشل في تحميل المعاملات');
          }
        },
        error: (err) => {
          console.error('❌ خطأ في جلب المعاملات:', err);
          this.showNotification('error', err.error?.error || 'حدث خطأ أثناء تحميل المعاملات');
        }
      });
  }

  refreshData(): void {
    this.loadTransactions();
  }

  setFilter(type: string): void {
    this.filterType = type;
    this.applyFilter();
  }

  applyFilter(): void {
    if (this.filterType === 'all') {
      this.filteredTransactions = [...this.transactions];
    } else {
      this.filteredTransactions = this.transactions.filter(t => {
        if (this.filterType === 'income') {
          return t.type === 'income' || t._type === 'payment' || t._type === 'registration_fee';
        }
        if (this.filterType === 'expense') {
          return t.type === 'expense' || t._type === 'expense';
        }
        if (this.filterType === 'payment') {
          return t._type === 'payment' || t._type === 'registration_fee';
        }
        if (this.filterType === 'commission') {
          return t._type === 'commission';
        }
        return true;
      });
    }
  }

  getIncomeCount(): number {
    return this.transactions.filter(t => t.type === 'income' || t._type === 'payment' || t._type === 'registration_fee').length;
  }

  getExpenseCount(): number {
    return this.transactions.filter(t => t.type === 'expense' || t._type === 'expense').length;
  }

  getPaymentCount(): number {
    return this.transactions.filter(t => t._type === 'payment' || t._type === 'registration_fee').length;
  }

  getCommissionCount(): number {
    return this.transactions.filter(t => t._type === 'commission').length;
  }

  viewTransaction(transaction: Transaction): void {
    this.showNotification('info', `المعاملة: ${transaction.description || 'غير محدد'} - ${transaction.amount} د.ج`);
  }

  deleteTransaction(transaction: Transaction): void {
    if (!confirm(`هل أنت متأكد من حذف هذه المعاملة؟\n${transaction.description || 'غير محدد'} - ${transaction.amount} د.ج`)) {
      return;
    }

    const endpoint = this.getDeleteEndpoint(transaction);
    if (!endpoint) {
      this.showNotification('error', 'لا يمكن حذف هذا النوع من المعاملات');
      return;
    }

    this.http.delete(`${this.apiUrl}${endpoint}/${transaction._id}`)
      .subscribe({
        next: () => {
          this.showNotification('success', '✅ تم حذف المعاملة بنجاح');
          this.refreshData();
        },
        error: (err) => {
          console.error('❌ خطأ في حذف المعاملة:', err);
          this.showNotification('error', err.error?.error || 'فشل في حذف المعاملة');
        }
      });
  }

  getDeleteEndpoint(transaction: Transaction): string | null {
    if (transaction._type === 'payment' || transaction._type === 'registration_fee') {
      return '/payments';
    }
    if (transaction._type === 'expense') {
      return '/accounting/expenses';
    }
    if (transaction._type === 'commission') {
      return '/accounting/teacher-commissions';
    }
    if (transaction._type === 'financial_transaction') {
      return '/accounting/transactions';
    }
    return null;
  }

  openAddExpense(): void {
    this.newExpense = {
      description: '',
      amount: null,
      category: 'other',
      paymentMethod: 'cash',
      notes: ''
    };
    this.showExpenseModal = true;
    document.body.style.overflow = 'hidden';
  }

  closeExpenseModal(): void {
    this.showExpenseModal = false;
    document.body.style.overflow = '';
  }

  submitExpense(form: any): void {
    if (!form.valid) return;

    const schoolId = this.school?._id;
    if (!schoolId) {
      this.showNotification('error', 'بيانات المدرسة غير متوفرة');
      return;
    }

    this.isSubmitting = true;
    
    const payload = {
      schoolId: schoolId,
      description: this.newExpense.description,
      amount: this.newExpense.amount,
      category: this.newExpense.category,
      paymentMethod: this.newExpense.paymentMethod,
      notes: this.newExpense.notes,
      type: 'operational',
      status: 'paid',
      date: new Date()
    };

    this.http.post<any>(`${this.apiUrl}/accounting/expenses`, payload)
      .subscribe({
        next: (res) => {
          this.isSubmitting = false;
          if (res && res.success) {
            this.showNotification('success', '✅ تم تسجيل المصروف بنجاح');
            this.closeExpenseModal();
            this.refreshData();
          } else {
            this.showNotification('error', res?.error || 'فشل في تسجيل المصروف');
          }
        },
        error: (err) => {
          this.isSubmitting = false;
          console.error('❌ خطأ في إضافة المصروف:', err);
          this.tryAlternativeExpenseEndpoint(payload);
        }
      });
  }

  tryAlternativeExpenseEndpoint(payload: any): void {
    const altPayload = {
      schoolId: payload.schoolId,
      type: 'expense',
      amount: payload.amount,
      description: payload.description,
      category: payload.category,
      date: payload.date,
      reference: `EXP-${Date.now()}`
    };
    
    this.http.post<any>(`${this.apiUrl}/accounting/transactions`, altPayload)
      .subscribe({
        next: (res) => {
          this.isSubmitting = false;
          if (res && res.success) {
            this.showNotification('success', '✅ تم تسجيل المصروف بنجاح');
            this.closeExpenseModal();
            this.refreshData();
          } else {
            this.showNotification('error', 'فشل في تسجيل المصروف');
          }
        },
        error: (err2) => {
          this.isSubmitting = false;
          this.showNotification('error', 'حدث خطأ أثناء حفظ المصروف. يرجى المحاولة مرة أخرى.');
        }
      });
  }

  showNotification(type: 'success' | 'error' | 'warning' | 'info', message: string): void {
    const notification = { id: Date.now(), type, message };
    this.notifications.unshift(notification);
    setTimeout(() => {
      this.notifications = this.notifications.filter(n => n.id !== notification.id);
    }, 5000);
  }

  goBack(): void {
    this.router.navigate(['/home/dashboard']);
  }
}