import { Component, OnInit } from '@angular/core';
import { AccountingService } from '../../services/accounting.service';
import { FormBuilder, FormGroup, FormsModule, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { TeachersService } from '../../services/teachers.service';
import { LessonsService } from '../../services/lessons.service';
import Swal from 'sweetalert2';
import moment from 'moment';
import { CommonModule } from '@angular/common';

// Define active tab types
export type ActiveTabType = 
  | 'dashboard'
  | 'transactions'
  | 'income'
  | 'expenses'
  | 'budgets'
  | 'school-fees'
  | 'commissions'
  | 'class-commission'
  | 'class-payments'
  | 'financial-report'
  | 'registration-fees'
  | 'invoices';

@Component({
  selector: 'app-accounting',
  templateUrl: './accounting.component.html',
  styleUrls: ['./accounting.component.css'],
  imports: [FormsModule, CommonModule, ReactiveFormsModule]
})
export class AccountingComponent implements OnInit {
  // Tab management
  activeTab: ActiveTabType = 'dashboard';
  
  // Data arrays
  transactions: any[] = [];
  dailyIncome: any = {};
  weeklyIncome: any[] = [];
  monthlyIncome: any = {};
  todayStats: any = {};
  currentBalance = 0;
  schoolFees: any[] = [];
  teacherCommissions: any[] = [];
  teachersList: any[] = [];
  lessonsList: any[] = [];
  budgets: any[] = [];
  expenses: any[] = [];
  invoices: any[] = [];
  teacherPayments: any[] = [];
  staffSalaries: any[] = [];
  financialReport: any = {};
  classCommissionData: any = null;
  monthlyFinancialReport: any = null;
  registrationFeeDetails: any[] = [];
  quickFinancialStats: any = {};
  
  // New: Class Payments Management
  classPaymentsData: any[] = [];
  filteredClassPayments: any[] = [];
  selectedPaymentMonth: string = new Date().toISOString().slice(0, 7);
  
  // Forms
  transactionForm: FormGroup;
  budgetForm: FormGroup;
  expenseForm: FormGroup;
  schoolFeeForm: FormGroup;
  classCommissionForm: FormGroup;
  financialReportForm: FormGroup;
  
  // Filters
  dateFilter = {
    startDate: '',
    endDate: ''
  };

  // Search
  searchTerm = '';
  
  // Loading states
  loading = {
    transactions: false,
    income: false,
    stats: false,
    export: false,
    classCommission: false,
    financialReport: false,
    registrationFees: false,
    classPayments: false  // New loading state
  };

  // Current date for template use
  today: string;

  constructor(
    private accountingService: AccountingService,
    private authService: AuthService,
    private fb: FormBuilder,
    private teacherService: TeachersService,
    private lessonsService: LessonsService
  ) {
    // Initialize current date
    this.today = new Date().toISOString().split('T')[0];
    
    // Initialize forms
    this.transactionForm = this.fb.group({
      type: ['income', Validators.required],
      amount: ['', [Validators.required, Validators.min(1)]],
      description: ['', Validators.required],
      category: ['tuition', Validators.required],
      date: [this.today, Validators.required]
    });

    this.budgetForm = this.fb.group({
      title: ['', Validators.required],
      amount: ['', [Validators.required, Validators.min(1)]],
      category: ['operational', Validators.required],
      description: [''],
      startDate: [this.today, Validators.required],
      endDate: ['', Validators.required]
    });

    this.expenseForm = this.fb.group({
      description: ['', Validators.required],
      amount: ['', [Validators.required, Validators.min(1)]],
      category: ['salary', Validators.required],
      paymentMethod: ['cash', Validators.required],
      receiptNumber: [''],
    });

    this.schoolFeeForm = this.fb.group({
      studentId: ['', Validators.required],
      amount: [60, [Validators.required, Validators.min(1)]],
      paymentMethod: ['cash', Validators.required]
    });

    this.classCommissionForm = this.fb.group({
      teacherId: ['', Validators.required],
      classId: ['', Validators.required],
      month: [new Date().toISOString().slice(0, 7), Validators.required],
      round: [''],
      paymentMethod: ['cash', Validators.required],
      notes: ['']
    });

    this.financialReportForm = this.fb.group({
      periodType: ['monthly'],
      month: [new Date().toISOString().slice(0, 7)],
      startDate: [''],
      endDate: [''],
      year: [new Date().getFullYear()]
    });
  }

  ngOnInit(): void {
    this.loadDashboardData();
    this.setupModalListeners();
    this.loadQuickFinancialStats();
    this.loadTeachers();
    this.loadLessons();
  }

  setupModalListeners(): void {
    setTimeout(() => {
      document.addEventListener('click', (event: MouseEvent) => {
        const modals = document.querySelectorAll('[data-modal]');
        modals.forEach(modal => {
          const modalElement = modal as HTMLElement;
          if (event.target === modalElement) {
            this.closeModal(modalElement);
          }
        });
      });

      document.addEventListener('keydown', (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          const openModal = document.querySelector('[data-modal].show');
          if (openModal) {
            this.closeModal(openModal as HTMLElement);
          }
        }
      });
    }, 100);
  }

  switchTab(tab: ActiveTabType): void {
    this.activeTab = tab;
    this.loadTabData(tab);
  }

  loadDashboardData(): void {
    this.loadDailyIncome();
    this.loadTodayStats();
    this.loadCurrentBalance();
    this.loadTransactions();
  }

  loadTabData(tab: ActiveTabType): void {
    switch (tab) {
      case 'dashboard':
        this.loadDashboardData();
        break;
      case 'transactions':
        this.loadTransactions();
        break;
      case 'income':
        this.loadDailyIncome();
        break;
      case 'expenses':
        this.loadExpenses();
        break;
      case 'budgets':
        this.loadBudgets();
        break;
      case 'school-fees':
        this.loadSchoolFees();
        break;
      case 'commissions':
        this.loadTeacherCommissions();
        break;
      case 'class-commission':
        this.loadClassCommissionData();
        break;
      case 'financial-report':
        this.loadFinancialReportData();
        break;
      case 'registration-fees':
        this.loadRegistrationFeesDetails();
        break;
      case 'invoices':
        this.loadInvoices();
        break;
      case 'class-payments':
        this.loadClassPayments();
        break;
    }
  }

  // New: Load class payments
  loadClassPayments(): void {
    this.loading.classPayments = true;
    
    const monthFilter = this.selectedPaymentMonth;
    
    this.accountingService.getClassPaymentsForMonth(monthFilter).subscribe({
      next: (data) => {
        this.classPaymentsData = data;
        this.filteredClassPayments = [...data];
        this.loading.classPayments = false;
      },
      error: (error) => {
        console.error('Error loading class payments:', error);
        this.loading.classPayments = false;
        this.showError('فشل في تحميل مدفوعات الحصص');
      }
    });
  }

  // New: Filter class payments
  filterClassPayments(): void {
    const searchTerm = this.searchTerm.toLowerCase();
    
    if (!searchTerm) {
      this.filteredClassPayments = [...this.classPaymentsData];
      return;
    }
    
    this.filteredClassPayments = this.classPaymentsData.filter(item => {
      return (
        item.class?.name?.toLowerCase().includes(searchTerm) ||
        item.teacher?.name?.toLowerCase().includes(searchTerm) ||
        item.month?.includes(searchTerm)
      );
    });
  }

  // New: Change month handler
  onMonthChange(): void {
    this.loadClassPayments();
  }

  // New: Pay class payment
  payClassPayment(item: any): void {
    this.showConfirmDialog(
      'دفع عمولة الحصة',
      `هل تريد دفع عمولة الأستاذ ${item.teacher?.name} للحصة ${item.class?.name} لشهر ${item.month}؟`,
      'نعم، دفع',
      'إلغاء'
    ).then((result: any) => {
      if (result.isConfirmed) {
        this.loading.classPayments = true;
        
        const paymentData = {
          teacherId: item.teacher?._id,
          classId: item.class?._id,
          month: item.month,
          paymentMethod: 'cash'
        };
        
        this.accountingService.payClassCommission(paymentData).subscribe({
          next: (response: any) => {
            this.showSuccess('تم دفع عمولة الحصة بنجاح');
            this.loadClassPayments(); // Refresh data
            this.loading.classPayments = false;
          },
          error: (error) => {
            console.error('Error paying class commission:', error);
            this.showError('فشل في دفع عمولة الحصة');
            this.loading.classPayments = false;
          }
        });
      }
    });
  }

  // Data loading methods
  loadDailyIncome(date?: string): void {
    this.loading.income = true;
    this.accountingService.getDailyIncome(date).subscribe({
      next: (data) => {
        this.dailyIncome = data;
        this.loading.income = false;
      },
      error: (error) => {
        console.error('Error loading daily income:', error);
        this.loading.income = false;
        this.showError('فشل في تحميل بيانات الدخل اليومي');
      }
    });
  }

  loadTodayStats(): void {
    this.loading.stats = true;
    this.accountingService.getTodayStats().subscribe({
      next: (data) => {
        this.todayStats = data;
        this.loading.stats = false;
      },
      error: (error) => {
        console.error('Error loading today stats:', error);
        this.loading.stats = false;
      }
    });
  }

  loadCurrentBalance(): void {
    this.accountingService.getCurrentBalance().subscribe({
      next: (data: any) => {
        this.currentBalance = data.balance || 0;
      },
      error: (error) => {
        console.error('Error loading balance:', error);
      }
    });
  }

  loadTransactions(): void {
    this.loading.transactions = true;
    const params: any = {};
    
    if (this.dateFilter.startDate) {
      params.startDate = this.dateFilter.startDate;
    }
    if (this.dateFilter.endDate) {
      params.endDate = this.dateFilter.endDate;
    }

    this.accountingService.getTransactions(params).subscribe({
      next: (data) => {
        this.transactions = data;
        this.loading.transactions = false;
      },
      error: (error) => {
        console.error('Error loading transactions:', error);
        this.loading.transactions = false;
        this.showError('فشل في تحميل المعاملات');
      }
    });
  }

  loadWeeklyIncome(): void {
    this.accountingService.getWeeklyIncome().subscribe({
      next: (data) => {
        this.weeklyIncome = data.weeklyIncome || [];
      },
      error: (error) => {
        console.error('Error loading weekly income:', error);
      }
    });
  }

  loadMonthlyIncome(): void {
    this.accountingService.getMonthlyIncome().subscribe({
      next: (data) => {
        this.monthlyIncome = data;
      },
      error: (error) => {
        console.error('Error loading monthly income:', error);
      }
    });
  }

  loadSchoolFees(): void {
    this.accountingService.getSchoolFees().subscribe({
      next: (data) => {
        this.schoolFees = data;
      },
      error: (error) => {
        console.error('Error loading school fees:', error);
        this.showError('فشل في تحميل رسوم التسجيل');
      }
    });
  }

  loadTeacherCommissions(): void {
    this.accountingService.getTeacherCommissions().subscribe({
      next: (data) => {
        this.teacherCommissions = data;
      },
      error: (error) => {
        console.error('Error loading teacher commissions:', error);
        this.showError('فشل في تحميل عمولات الأساتذة');
      }
    });
  }

  loadBudgets(): void {
    this.accountingService.getBudgets().subscribe({
      next: (data) => {
        this.budgets = data;
      },
      error: (error) => {
        console.error('Error loading budgets:', error);
        this.showError('فشل في تحميل الميزانيات');
      }
    });
  }

  loadExpenses(): void {
    this.accountingService.getExpenses().subscribe({
      next: (data) => {
        this.expenses = data;
      },
      error: (error) => {
        console.error('Error loading expenses:', error);
        this.showError('فشل في تحميل المصروفات');
      }
    });
  }

  loadInvoices(): void {
    this.accountingService.getInvoices().subscribe({
      next: (data) => {
        this.invoices = data;
      },
      error: (error) => {
        console.error('Error loading invoices:', error);
        this.showError('فشل في تحميل الفواتير');
      }
    });
  }

  loadTeacherPayments(): void {
    this.accountingService.getTeacherPayments().subscribe({
      next: (data) => {
        this.teacherPayments = data;
      },
      error: (error) => {
        console.error('Error loading teacher payments:', error);
      }
    });
  }

  loadStaffSalaries(): void {
    this.accountingService.getStaffSalaries().subscribe({
      next: (data) => {
        this.staffSalaries = data;
      },
      error: (error) => {
        console.error('Error loading staff salaries:', error);
      }
    });
  }

  loadFinancialReport(): void {
    const params: any = {};
    if (this.dateFilter.startDate) {
      params.startDate = this.dateFilter.startDate;
    }
    if (this.dateFilter.endDate) {
      params.endDate = this.dateFilter.endDate;
    }

    this.accountingService.getFinancialReport(params).subscribe({
      next: (data) => {
        this.financialReport = data;
      },
      error: (error) => {
        console.error('Error loading financial report:', error);
        this.showError('فشل في تحميل التقرير المالي');
      }
    });
  }

  loadClassCommissionData(): void {
    this.classCommissionForm.reset({
      month: new Date().toISOString().slice(0, 7),
      paymentMethod: 'cash'
    });
    this.classCommissionData = null;
  }

  calculateClassCommission(): void {
    const formData = this.classCommissionForm.value;
    
    if (!formData.teacherId || !formData.classId || !formData.month) {
      this.showWarning('يرجى اختيار الأستاذ والحصة والشهر');
      return;
    }

    this.loading.classCommission = true;
    
    const params = {
      teacherId: formData.teacherId,
      classId: formData.classId,
      month: formData.month,
      round: formData.round || undefined
    };

    this.accountingService.calculateTeacherClassCommission(params).subscribe({
      next: (data) => {
        this.classCommissionData = data;
        this.loading.classCommission = false;
      },
      error: (error) => {
        console.error('Error calculating commission:', error);
        this.showError('فشل في حساب العمولة');
        this.loading.classCommission = false;
      }
    });
  }

  payClassCommission(): void {
    if (!this.classCommissionData) {
      return;
    }

    const formData = this.classCommissionForm.value;
    
    const paymentData = {
      teacherId: formData.teacherId,
      classId: formData.classId,
      month: formData.month,
      round: formData.round || null,
      paymentMethod: formData.paymentMethod,
      notes: formData.notes
    };

    this.showConfirmDialog('دفع عمولة الحصة', 
      `هل تريد دفع عمولة الأستاذ ${this.classCommissionData.teacher.name} للحصة ${this.classCommissionData.class.name}؟`,
      'نعم، دفع', 'إلغاء').then((result: any) => {
      if (result.isConfirmed) {
        this.loading.classCommission = true;
        
        this.accountingService.payClassCommission(paymentData).subscribe({
          next: (response: any) => {
            this.showSuccess(response.message);
            this.classCommissionData = null;
            this.classCommissionForm.reset({
              month: new Date().toISOString().slice(0, 7),
              paymentMethod: 'cash'
            });
            this.loading.classCommission = false;
          },
          error: (error) => {
            console.error('Error paying commission:', error);
            this.showError('فشل في دفع العمولة');
            this.loading.classCommission = false;
          }
        });
      }
    });
  }

  loadFinancialReportData(): void {
    this.loading.financialReport = true;
    
    const formData = this.financialReportForm.value;
    let params: any = {};

    if (formData.periodType === 'monthly') {
      params.month = formData.month.split('-')[1];
      params.year = formData.month.split('-')[0];
    } else if (formData.periodType === 'custom') {
      params.startDate = formData.startDate;
      params.endDate = formData.endDate;
    } else if (formData.periodType === 'yearly') {
      params.year = formData.year;
    }

    this.accountingService.getMonthlyFinancialReport(params).subscribe({
      next: (data) => {
        this.monthlyFinancialReport = data;
        this.loading.financialReport = false;
      },
      error: (error) => {
        console.error('Error loading financial report:', error);
        this.showError('فشل في تحميل التقرير المالي');
        this.loading.financialReport = false;
      }
    });
  }

  loadRegistrationFeesDetails(): void {
    this.loading.registrationFees = true;
    this.accountingService.getRegistrationFeeDetails().subscribe({
      next: (data) => {
        this.registrationFeeDetails = data;
        this.loading.registrationFees = false;
      },
      error: (error) => {
        console.error('Error loading registration fees:', error);
        this.showError('فشل في تحميل تفاصيل رسوم التسجيل');
        this.loading.registrationFees = false;
      }
    });
  }

  loadQuickFinancialStats(): void {
    this.accountingService.getQuickFinancialStats().subscribe({
      next: (data) => {
        this.quickFinancialStats = data;
      },
      error: (error) => {
        console.error('Error loading quick stats:', error);
      }
    });
  }

  loadTeachers(): void {
    this.teacherService.getTeachers().subscribe({
      next: (data) => {
        this.teachersList = data;
      },
      error: (error) => {
        console.error('Error loading teachers:', error);
      }
    });
  }

  loadLessons(): void {
    this.lessonsService.getClasses().subscribe({
      next: (data) => {
        this.lessonsList = data;
      },
      error: (error) => {
        console.error('Error loading lessons:', error);
      }
    });
  }

  exportFinancialReport(format: string): void {
    const params = this.financialReportForm.value;
    
    this.loading.export = true;
    this.accountingService.exportFinancialReport(format, params).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `التقرير-المالي-${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        this.loading.export = false;
        this.showSuccess('تم تصدير التقرير بنجاح');
      },
      error: (error) => {
        console.error('Error exporting report:', error);
        this.loading.export = false;
        this.showError('فشل في تصدير التقرير');
      }
    });
  }

  // Form submission methods
  addTransaction(): void {
    if (this.transactionForm.invalid) {
      this.showWarning('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    const transactionData = this.transactionForm.value;
    
    this.showConfirmDialog('هل أنت متأكد؟', 'سيتم إضافة معاملة مالية جديدة', 'نعم، أضف', 'إلغاء').then((result: any) => {
      if (result.isConfirmed) {
        this.accountingService.addTransaction(transactionData).subscribe({
          next: (response: any) => {
            this.showSuccess('تمت إضافة المعاملة بنجاح');
            this.transactionForm.reset({
              type: 'income',
              amount: '',
              description: '',
              category: 'tuition',
              date: this.today
            });
            this.closeTransactionModal();
            this.loadTransactions();
            this.loadDashboardData();
          },
          error: (error) => {
            console.error('Error adding transaction:', error);
            this.showError('فشل في إضافة المعاملة');
          }
        });
      }
    });
  }

  createBudget(): void {
    if (this.budgetForm.invalid) {
      this.showWarning('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    const budgetData = this.budgetForm.value;
    
    this.accountingService.createBudget(budgetData).subscribe({
      next: (response: any) => {
        this.showSuccess('تم إنشاء الميزانية بنجاح');
        this.budgetForm.reset({
          title: '',
          amount: '',
          category: 'operational',
          description: '',
          startDate: this.today,
          endDate: ''
        });
        this.closeBudgetModal();
        this.loadBudgets();
      },
      error: (error) => {
        console.error('Error creating budget:', error);
        this.showError('فشل في إنشاء الميزانية');
      }
    });
  }

  addExpense(): void {
    if (this.expenseForm.invalid) {
      this.showWarning('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    const expenseData = this.expenseForm.value;
    
    this.showConfirmDialog('هل أنت متأكد؟', 'سيتم إضافة مصروف جديد', 'نعم، أضف', 'إلغاء').then((result: any) => {
      if (result.isConfirmed) {
        this.accountingService.addExpense(expenseData).subscribe({
          next: (response: any) => {
            this.showSuccess('تمت إضافة المصروف بنجاح');
            this.expenseForm.reset({
              description: '',
              amount: '',
              category: 'salary',
              paymentMethod: 'cash',
              receiptNumber: ''
            });
            this.closeExpenseModal();
            this.loadExpenses();
            this.loadDashboardData();
          },
          error: (error) => {
            console.error('Error adding expense:', error);
            this.showError('فشل في إضافة المصروف');
          }
        });
      }
    });
  }

  addSchoolFee(): void {
    if (this.schoolFeeForm.invalid) {
      this.showWarning('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    const feeData = this.schoolFeeForm.value;
    
    this.showConfirmDialog('هل أنت متأكد؟', 'سيتم إضافة رسوم تسجيل جديدة', 'نعم، أضف', 'إلغاء').then((result: any) => {
      if (result.isConfirmed) {
        const transactionData = {
          type: 'registration',
          amount: feeData.amount,
          description: `رسوم تسجيل للطالب ${feeData.studentId}`,
          category: 'registration',
          date: this.today
        };
        
        this.accountingService.addTransaction(transactionData).subscribe({
          next: (response: any) => {
            this.showSuccess('تمت إضافة رسوم التسجيل بنجاح');
            this.schoolFeeForm.reset({
              studentId: '',
              amount: 60,
              paymentMethod: 'cash'
            });
            this.closeSchoolFeeModal();
            this.loadSchoolFees();
            this.loadDashboardData();
          },
          error: (error) => {
            console.error('Error adding school fee:', error);
            this.showError('فشل في إضافة رسوم التسجيل');
          }
        });
      }
    });
  }

  // Action methods
  paySchoolFee(fee: any): void {
    Swal.fire({
      title: 'دفع رسوم التسجيل',
      html: `
        <p>الطالب: ${fee.student?.name || 'غير معروف'}</p>
        <p>المبلغ: ${fee.amount} د.ج</p>
        <div class="form-group">
          <label for="paymentMethod">طريقة الدفع:</label>
          <select id="paymentMethod" class="form-control">
            <option value="cash">نقداً</option>
            <option value="bank">تحويل بنكي</option>
            <option value="online">دفع إلكتروني</option>
          </select>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'دفع',
      cancelButtonText: 'إلغاء',
      customClass: {
        confirmButton: 'btn btn-success',
        cancelButton: 'btn btn-secondary'
      },
      buttonsStyling: false,
      preConfirm: () => {
        const paymentMethod = (document.getElementById('paymentMethod') as HTMLSelectElement).value;
        return {
          paymentMethod: paymentMethod,
          paymentDate: new Date().toISOString()
        };
      }
    }).then((result: any) => {
      if (result.isConfirmed) {
        this.accountingService.paySchoolFee(fee._id, result.value).subscribe({
          next: (response: any) => {
            this.showSuccess('تم دفع رسوم التسجيل بنجاح');
            this.loadSchoolFees();
            this.loadDashboardData();
          },
          error: (error) => {
            console.error('Error paying school fee:', error);
            this.showError('فشل في دفع رسوم التسجيل');
          }
        });
      }
    });
  }

  payTeacherCommission(commission: any): void {
    Swal.fire({
      title: 'دفع عمولة الأستاذ',
      html: `
        <p>الأستاذ: ${commission.teacher?.name || 'غير معروف'}</p>
        <p>المبلغ: ${commission.amount} د.ج</p>
        <p>الشهر: ${commission.month}</p>
        <div class="form-group">
          <label for="paymentMethod">طريقة الدفع:</label>
          <select id="paymentMethod" class="form-control">
            <option value="cash">نقداً</option>
            <option value="bank">تحويل بنكي</option>
            <option value="online">دفع إلكتروني</option>
          </select>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'دفع',
      cancelButtonText: 'إلغاء',
      customClass: {
        confirmButton: 'btn btn-success',
        cancelButton: 'btn btn-secondary'
      },
      buttonsStyling: false,
      preConfirm: () => {
        const paymentMethod = (document.getElementById('paymentMethod') as HTMLSelectElement).value;
        return {
          paymentMethod: paymentMethod,
          paymentDate: new Date().toISOString()
        };
      }
    }).then((result: any) => {
      if (result.isConfirmed) {
        this.accountingService.payTeacherCommission(commission._id, result.value).subscribe({
          next: (response: any) => {
            this.showSuccess('تم دفع عمولة الأستاذ بنجاح');
            this.loadTeacherCommissions();
            this.loadDashboardData();
          },
          error: (error) => {
            console.error('Error paying teacher commission:', error);
            this.showError('فشل في دفع عمولة الأستاذ');
          }
        });
      }
    });
  }

  // Utility methods
  formatDate(dateString: string | undefined | null): string {
    if (!dateString) return 'غير محدد';
    return moment(dateString).format('YYYY-MM-DD');
  }

  formatDateTime(dateString: string | undefined | null): string {
    if (!dateString) return 'غير محدد';
    return moment(dateString).format('YYYY-MM-DD HH:mm');
  }

  formatCurrency(amount: number | undefined | null): string {
    if (!amount) return '0.00 د.ج';
    return new Intl.NumberFormat('ar-DZ', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  getTransactionTypeBadge(type: string | undefined): string {
    if (!type) return 'secondary';
    const badges: { [key: string]: string } = {
      'income': 'success',
      'expense': 'danger',
      'registration': 'info',
      'payment': 'primary',
      'commission': 'warning'
    };
    return badges[type] || 'secondary';
  }

  getTransactionTypeText(type: string | undefined): string {
    if (!type) return 'غير محدد';
    const texts: { [key: string]: string } = {
      'income': 'إيراد',
      'expense': 'مصروف',
      'registration': 'تسجيل',
      'payment': 'دفعة',
      'commission': 'عمولة'
    };
    return texts[type] || type;
  }

  getCategoryText(category: string | undefined): string {
    if (!category) return 'غير محدد';
    const categories: { [key: string]: string } = {
      'tuition': 'رسوم دراسية',
      'salary': 'رواتب',
      'rent': 'إيجار',
      'utilities': 'مرافق',
      'supplies': 'مستلزمات',
      'other': 'أخرى',
      'registration': 'رسوم تسجيل',
      'operational': 'تشغيلي',
      'development': 'تطوير',
      'marketing': 'تسويق',
      'maintenance': 'صيانة',
      'transportation': 'مواصلات',
      'insurance': 'تأمين'
    };
    return categories[category] || category;
  }

  getPaymentMethodText(method: string | undefined): string {
    if (!method) return 'غير محدد';
    const methods: { [key: string]: string } = {
      'cash': 'نقداً',
      'bank': 'تحويل بنكي',
      'online': 'دفع إلكتروني',
      'check': 'شيك'
    };
    return methods[method] || method;
  }

  getStatusText(status: string | undefined): string {
    if (!status) return 'غير محدد';
    const statuses: { [key: string]: string } = {
      'paid': 'مدفوعة',
      'pending': 'معلقة',
      'overdue': 'متأخرة',
      'cancelled': 'ملغاة',
      'active': 'نشط',
      'inactive': 'غير نشط',
      'completed': 'مكتمل'
    };
    return statuses[status] || status;
  }

  getStatusBadge(status: string | undefined): string {
    if (!status) return 'secondary';
    const badges: { [key: string]: string } = {
      'paid': 'success',
      'pending': 'warning',
      'overdue': 'danger',
      'cancelled': 'secondary',
      'active': 'success',
      'inactive': 'secondary',
      'completed': 'info'
    };
    return badges[status] || 'secondary';
  }

  // New helper methods for template fixes
  getCategoryTransactionCount(categoryName: string): number {
    if (!this.transactions || !categoryName) return 0;
    return this.transactions.filter(t => 
      t.category === categoryName && t.type === 'income'
    ).length;
  }

  getCurrentDateFormatted(): string {
    return this.formatDate(this.today);
  }

  getCategoryIncome(categoryName: string): number {
    if (!this.transactions || !categoryName) return 0;
    return this.transactions
      .filter(t => t.category === categoryName && t.type === 'income')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
  }

  getTopCategories(limit = 5): any[] {
    const categories: { [key: string]: number } = {};
    
    this.transactions.forEach(transaction => {
      if (transaction.type === 'income') {
        const category = transaction.category;
        if (!categories[category]) {
          categories[category] = 0;
        }
        categories[category] += transaction.amount || 0;
      }
    });

    return Object.entries(categories)
      .map(([name, amount]) => ({ 
        name, 
        amount,
        count: this.getCategoryTransactionCount(name),
        percentage: this.calculateTotalIncome() > 0 ? (amount / this.calculateTotalIncome()) * 100 : 0
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, limit);
  }

  // Filter methods
  applyDateFilter(): void {
    if (this.dateFilter.startDate || this.dateFilter.endDate) {
      this.loadTransactions();
      if (this.activeTab === 'financial-report') {
        this.loadFinancialReport();
      }
    }
  }

  clearDateFilter(): void {
    this.dateFilter = {
      startDate: '',
      endDate: ''
    };
    this.loadTransactions();
    if (this.activeTab === 'financial-report') {
      this.loadFinancialReport();
    }
  }

  // Export methods
  exportToExcel(): void {
    const params = {
      startDate: this.dateFilter.startDate,
      endDate: this.dateFilter.endDate
    };

    this.loading.export = true;
    this.accountingService.exportReport('excel', params).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `التقرير-المالي-${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        this.loading.export = false;
        this.showSuccess('تم تصدير التقرير بنجاح');
      },
      error: (error) => {
        console.error('Error exporting report:', error);
        this.loading.export = false;
        this.showError('فشل في تصدير التقرير');
      }
    });
  }

  exportToPDF(): void {
    const params = {
      startDate: this.dateFilter.startDate,
      endDate: this.dateFilter.endDate
    };

    this.loading.export = true;
    this.accountingService.exportReport('pdf', params).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `التقرير-المالي-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        this.loading.export = false;
        this.showSuccess('تم تصدير التقرير بنجاح');
      },
      error: (error) => {
        console.error('Error exporting report:', error);
        this.loading.export = false;
        this.showError('فشل في تصدير التقرير');
      }
    });
  }

  // Modal methods
  openModal(modalId: string): void {
    const modal = document.querySelector(`[data-modal="${modalId}"]`);
    if (modal) {
      modal.classList.add('show');
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = '15px';
      
      setTimeout(() => {
        const firstInput = modal.querySelector('input, select, textarea') as HTMLElement;
        if (firstInput) {
          firstInput.focus();
        }
      }, 100);
    }
  }

  closeModal(modalElement: HTMLElement): void {
    modalElement.classList.remove('show');
    document.body.style.overflow = 'auto';
    document.body.style.paddingRight = '';
  }

  openTransactionModal(): void {
    this.openModal('transaction-modal');
  }

  closeTransactionModal(): void {
    const modal = document.querySelector('[data-modal="transaction-modal"]') as HTMLElement;
    if (modal) {
      this.closeModal(modal);
    }
  }

  openExpenseModal(): void {
    this.openModal('expense-modal');
  }

  closeExpenseModal(): void {
    const modal = document.querySelector('[data-modal="expense-modal"]') as HTMLElement;
    if (modal) {
      this.closeModal(modal);
    }
  }

  openBudgetModal(): void {
    this.openModal('budget-modal');
  }

  closeBudgetModal(): void {
    const modal = document.querySelector('[data-modal="budget-modal"]') as HTMLElement;
    if (modal) {
      this.closeModal(modal);
    }
  }

  openSchoolFeeModal(): void {
    this.openModal('school-fee-modal');
  }

  closeSchoolFeeModal(): void {
    const modal = document.querySelector('[data-modal="school-fee-modal"]') as HTMLElement;
    if (modal) {
      this.closeModal(modal);
    }
  }

  openClassCommissionModal(): void {
    this.openModal('class-commission-modal');
  }

  closeClassCommissionModal(): void {
    const modal = document.querySelector('[data-modal="class-commission-modal"]') as HTMLElement;
    if (modal) {
      this.closeModal(modal);
    }
  }

  // Helper methods for Swal dialogs
  showSuccess(message: string): void {
    Swal.fire({
      title: 'نجاح!',
      text: message,
      icon: 'success',
      confirmButtonText: 'حسناً',
      confirmButtonColor: '#28a745',
      timer: 2000,
      timerProgressBar: true
    });
  }

  showError(message: string): void {
    Swal.fire({
      title: 'خطأ!',
      text: message,
      icon: 'error',
      confirmButtonText: 'حسناً',
      confirmButtonColor: '#dc3545'
    });
  }

  showWarning(message: string): void {
    Swal.fire({
      title: 'تنبيه!',
      text: message,
      icon: 'warning',
      confirmButtonText: 'حسناً',
      confirmButtonColor: '#ffc107'
    });
  }

  showConfirmDialog(title: string, text: string, confirmText: string, cancelText: string): Promise<any> {
    return Swal.fire({
      title: title,
      text: text,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: confirmText,
      cancelButtonText: cancelText,
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#6c757d',
      reverseButtons: true,
      focusCancel: true
    });
  }

  // Validation methods
  validateForm(form: FormGroup): boolean {
    if (form.invalid) {
      Object.keys(form.controls).forEach(key => {
        const control = form.get(key);
        if (control?.invalid) {
          control.markAsTouched();
        }
      });
      return false;
    }
    return true;
  }

  // Search and filter methods
  searchTransactions(): void {
    if (this.searchTerm.trim() === '') {
      this.loadTransactions();
      return;
    }

    this.loading.transactions = true;
    const params = {
      search: this.searchTerm,
      startDate: this.dateFilter.startDate,
      endDate: this.dateFilter.endDate
    };

    this.accountingService.getTransactions(params).subscribe({
      next: (data) => {
        this.transactions = data;
        this.loading.transactions = false;
      },
      error: (error) => {
        console.error('Error searching transactions:', error);
        this.loading.transactions = false;
        this.showError('فشل في البحث');
      }
    });
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.loadTransactions();
  }

  // Statistics calculation
  calculateTotalIncome(): number {
    return this.transactions
      .filter(t => t.type === 'income')
      .reduce((sum: number, t) => sum + (t.amount || 0), 0);
  }

  calculateTotalExpenses(): number {
    return this.transactions
      .filter(t => t.type === 'expense')
      .reduce((sum: number, t) => sum + (t.amount || 0), 0);
  }

  calculateNetProfit(): number {
    return this.calculateTotalIncome() - this.calculateTotalExpenses();
  }

  // Data refresh methods
  refreshData(): void {
    this.loadTabData(this.activeTab);
    this.showSuccess('تم تحديث البيانات بنجاح');
  }

  // Print functionality
  printReport(): void {
    window.print();
  }

  // Dashboard methods
  getMonthlyTrend(): any[] {
    const monthlyData: { [key: string]: { income: number, expense: number } } = {};
    
    this.transactions.forEach(transaction => {
      const month = moment(transaction.date).format('YYYY-MM');
      if (!monthlyData[month]) {
        monthlyData[month] = { income: 0, expense: 0 };
      }
      
      if (transaction.type === 'income') {
        monthlyData[month].income += transaction.amount || 0;
      } else if (transaction.type === 'expense') {
        monthlyData[month].expense += transaction.amount || 0;
      }
    });

    return Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        income: data.income,
        expense: data.expense,
        profit: data.income - data.expense
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  // Get transaction counts by type
  getTransactionCounts(): { income: number, expense: number } {
    return {
      income: this.transactions.filter(t => t.type === 'income').length,
      expense: this.transactions.filter(t => t.type === 'expense').length
    };
  }

  // Get current month data
  getCurrentMonthData(): { income: number, expense: number } {
    const currentMonth = moment().format('YYYY-MM');
    const monthTransactions = this.transactions.filter(t => 
      moment(t.date).format('YYYY-MM') === currentMonth
    );

    return {
      income: monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum: number, t) => sum + (t.amount || 0), 0),
      expense: monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum: number, t) => sum + (t.amount || 0), 0)
    };
  }

  // Get budget utilization percentage
  getBudgetUtilization(budget: any): number {
    if (!budget.amount || budget.amount === 0) return 0;
    return ((budget.actualSpending || 0) / budget.amount) * 100;
  }

  // Check if budget is over budget
  isOverBudget(budget: any): boolean {
    return (budget.actualSpending || 0) > budget.amount;
  }

  // Format percentage
  formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }

  // Get color based on percentage
  getPercentageColor(percentage: number): string {
    if (percentage < 70) return 'success';
    if (percentage < 90) return 'warning';
    return 'danger';
  }

  onPeriodTypeChange(): void {
    const periodType = this.financialReportForm.get('periodType')?.value;
    
    if (periodType === 'monthly') {
      this.financialReportForm.get('month')?.setValidators([Validators.required]);
      this.financialReportForm.get('startDate')?.clearValidators();
      this.financialReportForm.get('endDate')?.clearValidators();
      this.financialReportForm.get('year')?.clearValidators();
    } else if (periodType === 'custom') {
      this.financialReportForm.get('startDate')?.setValidators([Validators.required]);
      this.financialReportForm.get('endDate')?.setValidators([Validators.required]);
      this.financialReportForm.get('month')?.clearValidators();
      this.financialReportForm.get('year')?.clearValidators();
    } else if (periodType === 'yearly') {
      this.financialReportForm.get('year')?.setValidators([Validators.required]);
      this.financialReportForm.get('month')?.clearValidators();
      this.financialReportForm.get('startDate')?.clearValidators();
      this.financialReportForm.get('endDate')?.clearValidators();
    }
    
    this.financialReportForm.get('month')?.updateValueAndValidity();
    this.financialReportForm.get('startDate')?.updateValueAndValidity();
    this.financialReportForm.get('endDate')?.updateValueAndValidity();
    this.financialReportForm.get('year')?.updateValueAndValidity();
  }

  // دالة لعرض تفاصيل دفع الحصة
  viewClassPaymentDetails(payment: any): void {
    let detailsHtml = `
      <div class="text-right">
        <h5>تفاصيل الحصة: ${payment.class?.name}</h5>
        <hr>
        <p><strong>الأستاذ:</strong> ${payment.teacher?.name}</p>
        <p><strong>الشهر:</strong> ${payment.month}</p>
        <p><strong>سعر الحصة:</strong> ${this.formatCurrency(payment.class?.price)}</p>
        <p><strong>عمولة الأستاذ (70%):</strong> ${this.formatCurrency(payment.commissionAmount)}</p>
        <p><strong>عدد الطلاب:</strong> ${payment.students?.total}</p>
        <p><strong>طلاب مدفوعين:</strong> ${payment.students?.paid}</p>
        <hr>
        <h6>قائمة الطلاب:</h6>
    `;
    
    if (payment.students?.list && payment.students.list.length > 0) {
      detailsHtml += '<ul class="list-group">';
      payment.students.list.forEach((student: any) => {
        const status = student.hasPaid ? 'مدفوع' : 'غير مدفوع';
        const badgeClass = student.hasPaid ? 'badge-success' : 'badge-danger';
        detailsHtml += `
          <li class="list-group-item d-flex justify-content-between align-items-center">
            ${student.studentName}
            <span class="badge ${badgeClass}">${status}</span>
          </li>
        `;
      });
      detailsHtml += '</ul>';
    } else {
      detailsHtml += '<p class="text-muted">لا يوجد طلاب مسجلين</p>';
    }
    
    detailsHtml += '</div>';
    
    Swal.fire({
      title: 'تفاصيل دفع الحصة',
      html: detailsHtml,
      width: '600px',
      showCloseButton: true,
      confirmButtonText: 'حسناً',
      confirmButtonColor: '#28a745'
    });
  }

  // دوال إحصائية للملخص
  getTotalStudents(): number {
    return this.filteredClassPayments.reduce((sum, payment) => 
      sum + (payment.students?.total || 0), 0);
  }

  getTotalCommission(): number {
    return this.filteredClassPayments.reduce((sum, payment) => 
      sum + (payment.commissionAmount || 0), 0);
  }

  getPendingPaymentsCount(): number {
    return this.filteredClassPayments.filter(payment => 
      payment.status === 'pending' && payment.students?.paid > 0
    ).length;
  }
}