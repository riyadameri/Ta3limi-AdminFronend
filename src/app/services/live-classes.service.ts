import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface LiveClass {
  _id: string;
  class: any;
  date: string;
  startTime: string;
  endTime?: string;
  teacher: any;
  classroom: any;
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  attendance: Attendance[];
  notes?: string;
}

export interface Attendance {
  student: any;
  status: 'present' | 'absent' | 'late';
  timestamp: string;
  method: 'rfid' | 'manual';
  notes?: string;
}

@Injectable({
  providedIn: 'root'
})
export class LiveClassesService {
  private apiUrl = 'https://redox-sm.onrender.com/api';

  constructor(private http: HttpClient, private authService: AuthService) {}

  getLiveClasses(filters?: any): Observable<LiveClass[]> {
    let url = `${this.apiUrl}/live-classes`;
    if (filters) {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.date) params.append('date', filters.date);
      url += `?${params.toString()}`;
    }
    
    return this.http.get<LiveClass[]>(url, {
      headers: this.authService.getAuthHeaders()
    });
  }

  getLiveClassById(id: string): Observable<LiveClass> {
    return this.http.get<LiveClass>(`${this.apiUrl}/live-classes/${id}`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  createLiveClass(liveClassData: any): Observable<LiveClass> {
    return this.http.post<LiveClass>(`${this.apiUrl}/live-classes`, liveClassData, {
      headers: this.authService.getAuthHeaders()
    });
  }

  updateLiveClass(id: string, liveClassData: any): Observable<LiveClass> {
    return this.http.put<LiveClass>(`${this.apiUrl}/live-classes/${id}`, liveClassData, {
      headers: this.authService.getAuthHeaders()
    });
  }

  recordAttendance(liveClassId: string, attendanceData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/live-classes/${liveClassId}/attendance`, attendanceData, {
      headers: this.authService.getAuthHeaders()
    });
  }

  startLiveClass(id: string): Observable<LiveClass> {
    return this.http.put<LiveClass>(`${this.apiUrl}/live-classes/${id}`, { status: 'ongoing' }, {
      headers: this.authService.getAuthHeaders()
    });
  }

  endLiveClass(id: string, endTime?: string): Observable<LiveClass> {
    const data: any = { status: 'completed' };
    if (endTime) data.endTime = endTime;
    
    return this.http.put<LiveClass>(`${this.apiUrl}/live-classes/${id}`, data, {
      headers: this.authService.getAuthHeaders()
    });
  }

  cancelLiveClass(id: string): Observable<LiveClass> {
    return this.http.put<LiveClass>(`${this.apiUrl}/live-classes/${id}`, { status: 'cancelled' }, {
      headers: this.authService.getAuthHeaders()
    });
  }

  getClassAttendance(classId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/live-classes/class/${classId}/attendance`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  autoMarkAbsent(liveClassId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/live-classes/${liveClassId}/auto-mark-absent`, {}, {
      headers: this.authService.getAuthHeaders()
    });
  }
}