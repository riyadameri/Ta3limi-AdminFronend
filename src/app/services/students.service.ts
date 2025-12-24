import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface Student {
  id?: string;  // Add id as optional property
  _id: string;
  name: string;
  studentId: string;
  parentName?: string;
  parentPhone?: string;
  academicYear: string;
  birthDate?: string;
  registrationDate: string;
  status: string;
  hasPaidRegistration: boolean;
  classes?: any[];
  registrationData?: any;
}

@Injectable({
  providedIn: 'root'
})
export class StudentsService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient, private authService: AuthService) {}

  getStudents(): Observable<Student[]> {
    return this.http.get<Student[]>(`${this.apiUrl}/students`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  getStudentById(id: string): Observable<Student> {
    return this.http.get<Student>(`${this.apiUrl}/students/${id}`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  createStudent(studentData: any): Observable<Student> {
    return this.http.post<Student>(`${this.apiUrl}/students`, studentData, {
      headers: this.authService.getAuthHeaders()
    });
  }

  updateStudent(id: string, studentData: any): Observable<Student> {
    return this.http.put<Student>(`${this.apiUrl}/students/${id}`, studentData, {
      headers: this.authService.getAuthHeaders()
    });
  }

  deleteStudent(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/students/${id}`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  payRegistrationFee(studentId: string, paymentData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/students/${studentId}/pay-registration`, paymentData, {
      headers: this.authService.getAuthHeaders()
    });
  }

  getStudentClasses(studentId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/students/${studentId}/classes`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  getStudentsWithoutAccounts(): Observable<Student[]> {
    return this.http.get<Student[]>(`${this.apiUrl}/students?hasAccount=false`, {
      headers: this.authService.getAuthHeaders()
    });
  }
  enrollStudentMultiple(studentId: string, data: { classIds: string[] }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/students/${studentId}/enroll-multiple`, data, {
      headers: this.authService.getAuthHeaders()
    });
  }
  
}