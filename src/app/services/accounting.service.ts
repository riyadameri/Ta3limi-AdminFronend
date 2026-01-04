import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment.development';
export interface Transaction {
  _id?: string;
  type: string;
  amount: number;
  description: string;
  category: string;
  date: Date | string;
  recordedBy?: any;
  reference?: string;
  student?: any;
}

export interface DailyIncome {
  dailyIncome: number;
  date: string;
  formattedDate: string;
  breakdown: {
    payments: { amount: number; count: number; details: any[] };
    registrationFees: { amount: number; count: number; details: any[] };
    otherIncome: { amount: number; count: number };
  };
  summary: {
    totalAmount: number;
    totalTransactions: number;
  };
}

export interface TodayStats {
  date: string;
  payments: { total: number; count: number };
  expenses: { total: number; count: number };
  commissions: { total: number; count: number };
}

export interface Budget {
  _id?: string;
  title: string;
  amount: number;
  category: string;
  description: string;
  startDate: Date | string;
  endDate: Date | string;
  status: string;
  createdBy?: any;
  actualSpending?: number;
  remainingBudget?: number;
  createdAt?: Date;
}

export interface Expense {
  _id?: string;
  description: string;
  amount: number;
  category: string;
  type?: string;
  recipient?: {
    type: string;
    id: string;
    name: string;
  };
  date: Date | string;
  paymentMethod: string;
  receiptNumber?: string;
  status: string;
  recordedBy?: any;
}

export interface SchoolFee {
  _id?: string;
  student: any;
  amount: number;
  paymentDate: Date | string;
  status: string;
  paymentMethod: string;
  invoiceNumber?: string;
  recordedBy?: any;
}

export interface TeacherCommission {
  _id?: string;
  teacher: any;
  student?: any;
  class: any;
  month: string;
  amount: number;
  percentage: number;
  type: string;
  round?: string;
  status: string;
  paymentDate?: Date | string;
  paymentMethod?: string;
  receiptNumber?: string;
  recordedBy?: any;
  studentDetails?: any[];
  notes?: string;
}

export interface Invoice {
  _id?: string;
  invoiceNumber: string;
  type: string;
  recipient: {
    type: string;
    id: string;
    name: string;
  };
  items: any[];
  totalAmount: number;
  date: Date | string;
  status: string;
  paymentMethod?: string;
  recordedBy?: any;
}

export interface QuickFinancialStats {
  totalIncome: number;
  totalExpenses: number;
  pendingPayments: number;
  lastUpdated: Date;
}

export interface ClassCommissionData {
  teacher: any;
  class: any;
  period: {
    month: string;
    round?: string;
    startDate: Date;
    endDate: Date;
  };
  students: any[];
  summary: {
    totalStudents: number;
    totalClassRevenue: number;
    totalTeacherCommission: number;
    commissionStatus?: string;
    commissionId?: string;
  };
  calculation?: any;
}

export interface MonthlyFinancialReport {
  period: any;
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
  summary: {
    incomeTransactions: number;
    expenseTransactions: number;
    averageDailyIncome: number;
    averageDailyExpense: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AccountingService {
  private apiUrl = `${environment.apiUrl}/accounting` || '/api/accounting';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  // Dashboard Data
  getDailyIncome(date?: string): Observable<DailyIncome> {
    let params = new HttpParams();
    if (date) {
      params = params.set('date', date);
    }
    return this.http.get<DailyIncome>(`${this.apiUrl}/daily-income`, {
      params,
      headers: this.authService.getAuthHeaders()
    });
  }

  getTodayStats(): Observable<TodayStats> {
    return this.http.get<TodayStats>(`${this.apiUrl}/today-stats`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  getCurrentBalance(): Observable<any> {
    return this.http.get(`${this.apiUrl}/balance`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  getQuickFinancialStats(): Observable<QuickFinancialStats> {
    return this.http.get<QuickFinancialStats>(`${this.apiUrl}/quick-financial-stats`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // Transactions
  getTransactions(params?: any): Observable<Transaction[]> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key]) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    return this.http.get<Transaction[]>(`${this.apiUrl}/transactions`, {
      params: httpParams,
      headers: this.authService.getAuthHeaders()
    });
  }

  addTransaction(transactionData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/transactions`, transactionData, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // Income Reports
  getWeeklyIncome(): Observable<any> {
    return this.http.get(`${this.apiUrl}/weekly-income`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  getMonthlyIncome(): Observable<any> {
    return this.http.get(`${this.apiUrl}/monthly-income`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // Budgets
  getBudgets(params?: any): Observable<Budget[]> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key]) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    return this.http.get<Budget[]>(`${this.apiUrl}/budgets`, {
      params: httpParams,
      headers: this.authService.getAuthHeaders()
    });
  }

  createBudget(budgetData: any): Observable<Budget> {
    return this.http.post<Budget>(`${this.apiUrl}/budgets`, budgetData, {
      headers: this.authService.getAuthHeaders()
    });
  }

  updateBudget(id: string, budgetData: any): Observable<Budget> {
    return this.http.put<Budget>(`${this.apiUrl}/budgets/${id}`, budgetData, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // Expenses
  getExpenses(params?: any): Observable<Expense[]> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key]) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    return this.http.get<Expense[]>(`${this.apiUrl}/expenses`, {
      params: httpParams,
      headers: this.authService.getAuthHeaders()
    });
  }

  addExpense(expenseData: any): Observable<Expense> {
    return this.http.post<Expense>(`${this.apiUrl}/expenses`, expenseData, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // School Fees
  getSchoolFees(params?: any): Observable<SchoolFee[]> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key]) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    return this.http.get<SchoolFee[]>(`${this.apiUrl}/school-fees`, {
      params: httpParams,
      headers: this.authService.getAuthHeaders()
    });
  }

  paySchoolFee(feeId: string, paymentData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/school-fees/${feeId}/pay`, paymentData, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // Teacher Commissions
  getTeacherCommissions(params?: any): Observable<TeacherCommission[]> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key]) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    return this.http.get<TeacherCommission[]>(`${this.apiUrl}/teacher-commissions`, {
      params: httpParams,
      headers: this.authService.getAuthHeaders()
    });
  }

  payTeacherCommission(commissionId: string, paymentData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/teacher-commissions/${commissionId}/pay`, paymentData, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // Class Commission System
  calculateTeacherClassCommission(params: any): Observable<ClassCommissionData> {
    let httpParams = new HttpParams();
    Object.keys(params).forEach(key => {
      if (params[key]) {
        httpParams = httpParams.set(key, params[key]);
      }
    });
    return this.http.get<ClassCommissionData>(`${this.apiUrl}/teacher-class-commission`, {
      params: httpParams,
      headers: this.authService.getAuthHeaders()
    });
  }

  payClassCommission(paymentData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/pay-class-commission`, paymentData, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // Financial Reports
  getFinancialReport(params?: any): Observable<any> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key]) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    return this.http.get(`${this.apiUrl}/reports/financial`, {
      params: httpParams,
      headers: this.authService.getAuthHeaders()
    });
  }

  getMonthlyFinancialReport(params?: any): Observable<MonthlyFinancialReport> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key]) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    return this.http.get<MonthlyFinancialReport>(`${this.apiUrl}/monthly-financial-report`, {
      params: httpParams,
      headers: this.authService.getAuthHeaders()
    });
  }

  // Invoices
  getInvoices(params?: any): Observable<Invoice[]> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key]) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    return this.http.get<Invoice[]>(`${this.apiUrl}/invoices`, {
      params: httpParams,
      headers: this.authService.getAuthHeaders()
    });
  }

  getInvoice(id: string): Observable<Invoice> {
    return this.http.get<Invoice>(`${this.apiUrl}/invoices/${id}`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  generateInvoice(type: string, id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/invoices/generate/${type}/${id}`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // Teacher Payments
  getTeacherPayments(params?: any): Observable<any[]> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key]) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    return this.http.get<any[]>(`${this.apiUrl}/teacher-payments`, {
      params: httpParams,
      headers: this.authService.getAuthHeaders()
    });
  }

  // Staff Salaries
  getStaffSalaries(params?: any): Observable<any[]> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key]) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    return this.http.get<any[]>(`${this.apiUrl}/staff-salaries`, {
      params: httpParams,
      headers: this.authService.getAuthHeaders()
    });
  }

  // Registration Fees
  getRegistrationFeeDetails(params?: any): Observable<any[]> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key]) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    return this.http.get<any[]>(`${this.apiUrl}/registration-fee-details`, {
      params: httpParams,
      headers: this.authService.getAuthHeaders()
    });
  }

  // Export Reports
  exportReport(format: string, params?: any): Observable<Blob> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key]) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    httpParams = httpParams.set('format', format);
    
    return this.http.get(`${this.apiUrl}/export-financial-report`, {
      params: httpParams,
      headers: this.authService.getAuthHeaders(),
      responseType: 'blob'
    });
  }

  exportFinancialReport(format: string, params?: any): Observable<Blob> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key]) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    httpParams = httpParams.set('format', format);
    
    return this.http.get(`${this.apiUrl}/export-financial-report`, {
      params: httpParams,
      headers: this.authService.getAuthHeaders(),
      responseType: 'blob'
    });
  }
// خدمة جديدة للحصول على مدفوعات الحصص حسب الشهر
getClassPaymentsForMonth(month: string): Observable<any> {
  return this.http.get(`${this.apiUrl}/class-payments/month/${month}`, {
    headers: this.authService.getAuthHeaders()
  });
}

}