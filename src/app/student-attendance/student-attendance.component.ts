// student-attendance.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-student-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './student-attendance.component.html',
  styleUrls: ['./student-attendance.component.css']
})
export class StudentAttendanceComponent implements OnInit {
  // RFID Scanning
  isScanning: boolean = false;
  scannedRFID: string = '';
  
  // Student Data
  currentStudent: any = null;
  attendanceResult: any = null;
  
  // Statistics
  totalStudents: number = 0;
  attendanceToday: number = 0;
  attendanceRate: number = 0;
  
  // Live Classes
  todayClasses: any[] = [];
  recentAttendance: any[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadStatistics();
    this.loadTodayClasses();
    this.loadRecentAttendance();
  }

  // Start RFID Scanning
  startRFIDScan() {
    this.isScanning = true;
    this.currentStudent = null;
    this.attendanceResult = null;
    
    // Simulate RFID scan (in real app, this would be from hardware)
    setTimeout(() => {
      // Generate random RFID for demo
      const rfid = 'RFID-' + Math.random().toString(36).substr(2, 9).toUpperCase();
      this.scannedRFID = rfid;
      this.checkRFID(rfid);
    }, 1500);
  }

  // Check RFID against students
  checkRFID(rfid: string) {
    this.http.get<any[]>(`http://localhost:5000/api/students/all`).subscribe({
      next: (students) => {
        // Find student by RFID (in real app, you'd have RFID field)
        // For demo, we'll match by registration number
        const student = students.find(s => 
          s.registrationNumber === rfid || 
          s._id === rfid ||
          // Generate deterministic match for demo
          rfid.endsWith(s.registrationNumber.substring(s.registrationNumber.length - 4))
        );
        
        if (student) {
          this.currentStudent = student;
          this.recordAttendance(student);
        } else {
          this.attendanceResult = {
            success: false,
            message: 'البطاقة غير مسجلة في النظام'
          };
          this.isScanning = false;
        }
      },
      error: (error) => {
        console.error('Error fetching students:', error);
        this.attendanceResult = {
          success: false,
          message: 'خطأ في الاتصال بالنظام'
        };
        this.isScanning = false;
      }
    });
  }

  // Record Attendance
  recordAttendance(student: any) {
    const attendanceData = {
      studentId: student._id,
      studentName: student.fullName || student.registrationNumber,
      registrationNumber: student.registrationNumber,
      parentPhone: student.parentPhone || student.phone,
      timestamp: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString(),
      method: 'rfid'
    };

    // Send attendance to backend
    this.http.post('http://localhost:5000/api/attendance/record', attendanceData).subscribe({
      next: (response: any) => {
        this.isScanning = false;
        
        // Send SMS to parent
        this.sendSMSToParent(student, response);
        
        this.attendanceResult = {
          success: true,
          message: `تم تسجيل حضور ${student.fullName || student.registrationNumber}`,
          smsSent: true
        };
        
        // Update statistics
        this.attendanceToday++;
        this.attendanceRate = Math.round((this.attendanceToday / this.totalStudents) * 100);
        
        // Add to recent attendance
        this.recentAttendance.unshift({
          studentName: student.fullName || student.registrationNumber,
          className: response.className || 'حصص اليوم',
          timestamp: new Date()
        });
        
        // Keep only last 5 records
        if (this.recentAttendance.length > 5) {
          this.recentAttendance.pop();
        }
        
        // Auto reset after 5 seconds
        setTimeout(() => {
          this.currentStudent = null;
          this.attendanceResult = null;
        }, 5000);
      },
      error: (error) => {
        console.error('Error recording attendance:', error);
        this.attendanceResult = {
          success: false,
          message: 'خطأ في تسجيل الحضور'
        };
        this.isScanning = false;
      }
    });
  }

  // Send SMS to parent
  sendSMSToParent(student: any, attendanceData: any) {
    const smsData = {
      to: student.parentPhone || student.phone,
      message: `تم تسجيل حضور ${student.fullName || student.registrationNumber} في المدرسة بتاريخ ${new Date().toLocaleDateString('ar-SA')} الساعة ${new Date().toLocaleTimeString('ar-SA', {hour: '2-digit', minute:'2-digit'})}`
    };

    this.http.post('http://localhost:5000/api/sms/send', smsData).subscribe({
      next: () => console.log('SMS sent successfully'),
      error: (error) => console.error('Error sending SMS:', error)
    });
  }

  // Load Statistics
  loadStatistics() {
    this.http.get<any[]>('http://localhost:5000/api/students/all').subscribe({
      next: (students) => {
        this.totalStudents = students.length;
        
        // For demo, calculate attendance rate
        this.attendanceToday = Math.floor(Math.random() * (this.totalStudents / 2)) + 10;
        this.attendanceRate = Math.round((this.attendanceToday / this.totalStudents) * 100);
      },
      error: (error) => {
        console.error('Error loading statistics:', error);
      }
    });
  }

  // Load Today's Classes
  loadTodayClasses() {
    const today = new Date().toISOString().split('T')[0];
    
    // In real app, you'd have an endpoint for today's classes
    // For demo, we'll create mock data
    this.todayClasses = [
      {
        id: 1,
        subject: 'رياضيات',
        startTime: '08:00',
        endTime: '09:30',
        status: 'ongoing',
        teacher: 'أ. أحمد'
      },
      {
        id: 2,
        subject: 'فيزياء',
        startTime: '10:00',
        endTime: '11:30',
        status: 'scheduled',
        teacher: 'أ. محمد'
      },
      {
        id: 3,
        subject: 'لغة عربية',
        startTime: '12:00',
        endTime: '13:30',
        status: 'scheduled',
        teacher: 'أ. علي'
      }
    ];
  }

  // Load Recent Attendance
  loadRecentAttendance() {
    // Mock data for demo
    this.recentAttendance = [
      {
        studentName: 'محمد أحمد',
        className: 'رياضيات',
        timestamp: new Date(Date.now() - 300000) // 5 minutes ago
      },
      {
        studentName: 'سارة خالد',
        className: 'رياضيات',
        timestamp: new Date(Date.now() - 600000) // 10 minutes ago
      },
      {
        studentName: 'عمر سعيد',
        className: 'رياضيات',
        timestamp: new Date(Date.now() - 900000) // 15 minutes ago
      }
    ];
  }
}