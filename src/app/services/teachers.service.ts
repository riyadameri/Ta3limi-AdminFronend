import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
export interface Teacher {
  _id: string;
  schoolId: string;
  name: string;
  subjects: string[];
  phone?: string;
  email?: string;
  hireDate?: string;
  active: boolean;
  salaryPercentage?: number;
}

@Injectable({
  providedIn: 'root'
})
export class TeachersService {
  private apiUrl =  'http://localhost:5090/api';

  constructor(private http: HttpClient) {}

  // ✅ جلب أساتذة مدرسة محددة فقط
  getTeachersBySchool(schoolId: string): Observable<Teacher[]> {
    return this.http.get<Teacher[]>(`${this.apiUrl}/teachers/school/${schoolId}`);
  }

  // ✅ جلب أساتذة المدرسة الحالية (من التوكن)
  getTeachers(): Observable<Teacher[]> {
    return this.http.get<Teacher[]>(`${this.apiUrl}/teachers`);
  }

  getTeacher(id: string): Observable<Teacher> {
    return this.http.get<Teacher>(`${this.apiUrl}/teachers/${id}`);
  }

  createTeacher(teacher: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/teachers`, teacher);
  }

  updateTeacher(id: string, teacher: any): Observable<Teacher> {
    return this.http.put<Teacher>(`${this.apiUrl}/teachers/${id}`, teacher);
  }

  deleteTeacher(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/teachers/${id}`);
  }

  getTeacherDetails(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/teachers/${id}/details`);
  }

  getTeacherPayments(id: string, params?: any): Observable<any> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    return this.http.get(`${this.apiUrl}/teachers/${id}/payments`, { params: httpParams });
  }
}