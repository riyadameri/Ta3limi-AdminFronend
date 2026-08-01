// comprehensive-accounting.component.ts
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

@Component({
  selector: 'app-comprehensive-accounting',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './accounting.component.html',
  styleUrls: ['./accounting.component.css']
})
export class ComprehensiveAccountingComponent implements OnInit, AfterViewInit, OnDestroy {
  private apiUrl = environment.apiUrl || 'http://localhost:5090/api';
  
  // ==================== Session Variables ====================
  schoolId: string = '';
  schoolName: string = '';
  token: string = '';
  isLoaded: boolean = false;

  // ==================== Tabs ====================
  activeTab: string = 'summary';

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

  // ==================== TAB 2: Commissions ====================
  commissions: Commission[] = [];
  commissionsStats: any = {};
  commissionMonth: string = '';
  commissionStatus: string = 'all';
  isGeneratingCommissions: boolean = false;
  hasPendingCommissions: boolean = false;

  // ==================== TAB 3: Payments ====================
  payments: Payment[] = [];
  paymentMonth: string = '';
  paymentStatus: string = 'all';
  paymentSearch: string = '';
  studentsList: any[] = [];
  classesList: any[] = [];
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

  // ==================== Modal: Student Attendance from Commission ====================
  showCommissionStudentAttendanceModal: boolean = false;

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

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.initDates();
    this.loadSessionData();
    this.startAutoRefresh();
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    if (this.refreshInterval) clearInterval(this.refreshInterval);
    if (this.ieChart) this.ieChart.destroy();
    if (this.tChart) this.tChart.destroy();
  }

  // ==================== Initialization Methods ====================
  initDates(): void {
    const today = new Date();
    this.detailsDate = today.toISOString().split('T')[0];
    this.paymentMonth = today.toISOString().slice(0, 7);
    this.commissionMonth = today.toISOString().slice(0, 7);
    this.statusMonth = today.toISOString().slice(0, 7);
    this.attendanceMonth = today.toISOString().slice(0, 7);
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    this.selectedMonth = `${today.getFullYear()}-${month}`;
    this.onMonthChange();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    this.expenseStartDate = this.formatDate(firstDay);
    this.expenseEndDate = this.formatDate(today);
  }

  onMonthChange(): void {
    if (!this.selectedMonth) return;
    const [year, month] = this.selectedMonth.split('-');
    const firstDay = new Date(parseInt(year), parseInt(month) - 1, 1);
    this.summaryStartDate = this.formatDate(firstDay);
    const lastDay = new Date(parseInt(year), parseInt(month), 0);
    this.summaryEndDate = this.formatDate(lastDay);
    if (this.isLoaded) {
      this.loadSummary();
      this.loadMonthlyNetProfit(this.selectedMonth);
      this.loadTransactionsByStatus();
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
      this.isLoaded = true;
      this.loadSummary();
      this.loadDailyDetails();
      this.loadCommissions();
      this.loadPayments();
      this.loadExpenses();
      this.loadStudentsAndClasses();
      this.loadMonthlyNetProfit(this.selectedMonth);
      this.loadTransactionsByStatus();
    } catch (error) {
      console.error('Session data error:', error);
      this.router.navigate(['/login']);
    }
  }

  startAutoRefresh(): void {
    this.refreshInterval = setInterval(() => {
      if (this.activeTab === 'summary') this.loadSummary();
      else if (this.activeTab === 'commissions') this.loadCommissions();
    }, 30000);
  }

  switchTab(tab: string): void {
    this.activeTab = tab;
    if (tab === 'summary') {
      this.loadSummary();
      this.loadMonthlyNetProfit(this.selectedMonth);
    } else if (tab === 'commissions') {
      this.loadCommissions();
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

  // ==================== TAB 2: Commission Methods ====================
  async loadCommissions(): Promise<void> {
    try {
      let url = `${this.apiUrl}/accounting/teacher-commissions?schoolId=${this.schoolId}`;
      if (this.commissionMonth) url += `&month=${this.commissionMonth}`;
      if (this.commissionStatus !== 'all') url += `&status=${this.commissionStatus}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${this.token}`, 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        this.commissions = data.data || [];
        this.commissionsStats = data.summary || {};
        this.hasPendingCommissions = this.commissions.some(c => c.status === 'pending' || c.status === 'partial');
      }
    } catch (error) {
      console.error('Error loading commissions:', error);
    }
  }

  async generateMonthlyCommissions(): Promise<void> {
    const result = await Swal.fire({
      title: 'إنشاء العمولات',
      text: 'هل أنت متأكد من إنشاء عمولات هذا الشهر؟',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'نعم، إنشاء',
      cancelButtonText: 'إلغاء'
    });
    if (!result.isConfirmed) return;
    
    this.isGeneratingCommissions = true;
    try {
      const response = await fetch(`${this.apiUrl}/accounting/teacher-commissions/generate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${this.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolId: this.schoolId,
          month: this.commissionMonth || new Date().toISOString().slice(0, 7)
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        Swal.fire('نجاح', data.message, 'success');
        this.loadCommissions();
      } else {
        throw new Error(data.error || 'فشل في إنشاء العمولات');
      }
    } catch (error: any) {
      Swal.fire('خطأ', error.message, 'error');
    } finally {
      this.isGeneratingCommissions = false;
    }
  }

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
        Swal.fire('نجاح', data.message, 'success');
        this.loadCommissions();
        this.loadSummary();
        if (this.showCommissionDetailsModal) {
          await this.viewCommissionDetails(commissionId);
        }
      } else {
        throw new Error(data.error || 'فشل في دفع العمولة');
      }
    } catch (error: any) {
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
        Swal.fire('نجاح', data.message, 'success');
        this.loadCommissions();
        this.loadSummary();
      } else {
        throw new Error(data.error || 'فشل في دفع العمولات');
      }
    } catch (error: any) {
      Swal.fire('خطأ', error.message, 'error');
    }
  }

  async cancelCommission(commissionId: string): Promise<void> {
    const result = await Swal.fire({
      title: 'إلغاء العمولة',
      text: 'هل أنت متأكد من إلغاء هذه العمولة؟',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'نعم، إلغاء',
      cancelButtonText: 'إلغاء'
    });
    if (!result.isConfirmed) return;
    
    try {
      const response = await fetch(`${this.apiUrl}/accounting/teacher-commissions/${commissionId}/cancel`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${this.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'تم الإلغاء من قبل المستخدم' })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        Swal.fire('نجاح', 'تم إلغاء العمولة بنجاح', 'success');
        this.loadCommissions();
      } else {
        throw new Error(data.error || 'فشل في إلغاء العمولة');
      }
    } catch (error: any) {
      Swal.fire('خطأ', error.message, 'error');
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
        Swal.fire('نجاح', data.message || 'تم تحديث حصة الطالب بنجاح', 'success');
        this.closeStudentShareModal();
        await this.viewCommissionDetails(this.commissionDetails?.commission._id);
      } else {
        Swal.fire('خطأ', data.error || 'فشل في تحديث حصة الطالب', 'error');
      }
    } catch (error: any) {
      console.error('Error updating student share:', error);
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
        Swal.fire('نجاح', 'تم تحديث حالة الحضور', 'success');
        await this.viewCommissionDetails(this.commissionDetails?.commission._id);
      } else {
        Swal.fire('خطأ', data.error || 'فشل في تحديث الحضور', 'error');
      }
    } catch (error: any) {
      console.error('Error updating attendance:', error);
      Swal.fire('خطأ', error.message || 'فشل في تحديث الحضور', 'error');
    }
  }

  // ==================== TAB 3: Payment Methods ====================
  async loadPayments(): Promise<void> {
    try {
      let url = `${this.apiUrl}/payments?schoolId=${this.schoolId}`;
      if (this.paymentMonth) url += `&monthCode=${this.paymentMonth}`;
      if (this.paymentStatus !== 'all') url += `&status=${this.paymentStatus}`;
      if (this.paymentSearch) url += `&search=${encodeURIComponent(this.paymentSearch)}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${this.token}`, 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      if (response.ok) {
        this.payments = data || [];
      }
    } catch (error) {
      console.error('Error loading payments:', error);
    }
  }

  async loadStudentsAndClasses(): Promise<void> {
    try {
      const [studentsRes, classesRes] = await Promise.all([
        fetch(`${this.apiUrl}/students?schoolId=${this.schoolId}`, {
          headers: { 'Authorization': `Bearer ${this.token}` }
        }),
        fetch(`${this.apiUrl}/classes?schoolId=${this.schoolId}`, {
          headers: { 'Authorization': `Bearer ${this.token}` }
        })
      ]);
      if (studentsRes.ok) this.studentsList = await studentsRes.json();
      if (classesRes.ok) this.classesList = await classesRes.json();
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
      const response = await fetch(`${this.apiUrl}/payments`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${this.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolId: this.schoolId,
          student: this.newPayment.studentId,
          class: this.newPayment.classId,
          amount: this.newPayment.amount,
          month: this.newPayment.month,
          paymentMethod: this.newPayment.paymentMethod,
          notes: this.newPayment.notes,
          status: 'pending'
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        Swal.fire('نجاح', 'تم إضافة الدفعة بنجاح', 'success');
        this.closePaymentModal();
        this.loadPayments();
        this.loadSummary();
      } else {
        throw new Error(data.error || 'فشل في إضافة الدفعة');
      }
    } catch (error: any) {
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
        Swal.fire('نجاح', 'تم تسديد الدفعة بنجاح', 'success');
        this.loadPayments();
        this.loadSummary();
      } else {
        throw new Error(data.error || 'فشل في تسديد الدفعة');
      }
    } catch (error: any) {
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
        Swal.fire('نجاح', 'تم إضافة المصروف بنجاح', 'success');
        this.closeExpenseModal();
        this.loadExpenses();
        this.loadSummary();
      } else {
        throw new Error(data.error || 'فشل في إضافة المصروف');
      }
    } catch (error: any) {
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

      Swal.fire('نجاح', `تم تعديل مبلغ ${updatedCount} دفعة بنجاح`, 'success');
      this.closePaymentAdjustModal();
      this.loadStudentsAttendance();
      this.loadSummary();

    } catch (error: any) {
      console.error('Error adjusting payment:', error);
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
        Swal.fire('نجاح', data.message || 'تم تحديث نسبة الأستاذ بنجاح', 'success');
        this.closeTeacherPercentageModal();
        this.loadStudentsAttendance();
      } else {
        Swal.fire('خطأ', data.error || 'فشل في تحديث النسبة', 'error');
      }
    } catch (error: any) {
      console.error('Error updating teacher percentage:', error);
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

  getStudentAttendanceDates(student: StudentAttendanceData): any[] {
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
        Swal.fire('نجاح', 'تم تحديث حالة الحضور', 'success');
      } else {
        Swal.fire('خطأ', data.error || 'فشل في تحديث الحضور', 'error');
      }
    } catch (error: any) {
      console.error('Error updating attendance:', error);
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
        Swal.fire('نجاح', 'تم حفظ المعاملة', 'success');
        this.closeTransactionModal();
        this.loadSummary();
        this.loadMonthlyNetProfit(this.selectedMonth);
        if (this.detailsDate === this.newTx.date) this.loadDailyDetails();
      } else {
        throw new Error(data.error || 'فشل في حفظ المعاملة');
      }
    } catch (error: any) {
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
            backgroundColor: ['#10b981', '#ef4444'],
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
                font: { family: 'Tajawal', size: 11 },
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
            backgroundColor: ['#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899'],
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
                font: { family: 'Tajawal', size: 9 }
              }
            },
            x: {
              ticks: {
                font: { family: 'Tajawal', size: 9 }
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