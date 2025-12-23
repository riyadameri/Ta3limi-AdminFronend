import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
export interface Transaction {
  _id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
  date: string;
  recordedBy: any;
  reference?: string;
  studentId?: string;
}

export interface Budget {
  _id: string;
  type: string;
  amount: number;
  description: string;
  createdAt: string;
}

export interface Expense {
  _id: string;
  description: string;
  amount: number;
  category: string;
  type: string;
  recipient: {
    type: string;
    id?: string;
    name: string;
  };
  paymentMethod: string;
  date: string;
}

@Injectable({
  providedIn: 'root'
})
export class AccountingService {
  private apiUrl = 'https://redox-sm.onrender.com/api';

  constructor(private http: HttpClient, private authService: AuthService) {}

  getTransactions(filters?: any): Observable<Transaction[]> {
    let url = `${this.apiUrl}/accounting/transactions`;
    if (filters) {
      const params = new URLSearchParams();
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.type) params.append('type', filters.type);
      if (filters.category) params.append('category', filters.category);
      url += `?${params.toString()}`;
    }
    
    return this.http.get<Transaction[]>(url, {
      headers: this.authService.getAuthHeaders()
    });
  }

  getTransactionById(id: string): Observable<Transaction> {
    return this.http.get<Transaction>(`${this.apiUrl}/accounting/transactions/${id}`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  createTransaction(transactionData: any): Observable<Transaction> {
    return this.http.post<Transaction>(`${this.apiUrl}/accounting/transactions`, transactionData, {
      headers: this.authService.getAuthHeaders()
    });
  }

  addBudget(budgetData: any): Observable<Budget> {
    return this.http.post<Budget>(`${this.apiUrl}/accounting/budget`, budgetData, {
      headers: this.authService.getAuthHeaders()
    });
  }

  addExpense(expenseData: any): Observable<Expense> {
    return this.http.post<Expense>(`${this.apiUrl}/accounting/expenses`, expenseData, {
      headers: this.authService.getAuthHeaders()
    });
  }

  getDailyIncome(): Observable<any> {
    return this.http.get(`${this.apiUrl}/accounting/daily-income`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  getFinancialReport(startDate: string, endDate: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/accounting/reports/financial?startDate=${startDate}&endDate=${endDate}`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  getStatistics(date?: string): Observable<any> {
    let url = `${this.apiUrl}/accounting/statistics`;
    if (date) url += `?date=${date}`;
    
    return this.http.get(url, {
      headers: this.authService.getAuthHeaders()
    });
  }
}