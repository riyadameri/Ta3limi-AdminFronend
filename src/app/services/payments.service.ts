import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class PaymentsService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  // الحصول على المدفوعات
  getPayments(params?: any): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/payments`, {
      params: params,
      headers: this.authService.getAuthHeaders()
    });
  }

  // إلغاء الدفع
  cancelPayment(paymentId: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/payments/${paymentId}/cancel`, {}, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // حذف الدفع
  deletePayment(paymentId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/payments/${paymentId}`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // تعديل المبلغ
  updatePaymentAmount(paymentId: string, amount: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/payments/${paymentId}/amount`, { amount }, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // تسجيل دفعة جديدة
  createPayment(paymentData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/payments`, paymentData, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // دفع دفعة معلقة
  payPayment(paymentId: string, paymentData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/payments/${paymentId}/pay`, paymentData, {
      headers: this.authService.getAuthHeaders()
    });
  }



  getClassPayments(classId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/payments/class/${classId}`, {
      headers: this.authService.getAuthHeaders()
    });
  }
  getStudentPayments(studentId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/payments/student/${studentId}`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  recordPayment(paymentData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/payments`, paymentData, {
      headers: this.authService.getAuthHeaders()
    });
  }

  updatePayment(paymentId: string, paymentData: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/payments/${paymentId}`, paymentData, {
      headers: this.authService.getAuthHeaders()
    });
  }

  createMonthlyPayment(paymentData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/payments/monthly`, paymentData, {
      headers: this.authService.getAuthHeaders()
    });
  }

  createRoundPayment(roundData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/payments/rounds`, roundData, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // الحصول على جولات الطالب
  getStudentRounds(studentId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/payments/rounds/student/${studentId}`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // الحصول على المدفوعات الشهرية
  getStudentMonthlyPayments(studentId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/payments/monthly/student/${studentId}`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // تسديد دفعة متأخرة
  payLatePayment(paymentId: string, paymentData: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/payments/${paymentId}/pay-late`, paymentData, {
      headers: this.authService.getAuthHeaders()
    });
  }

}