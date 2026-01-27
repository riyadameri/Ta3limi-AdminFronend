import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClassesService, Class, Schedule } from '../../classes.service';
import { StudentsService, Student } from '../../services/students.service';
import { LiveClassesService, LiveClass, Attendance } from '../../services/live-classes.service';
import { PaymentsService } from '../../services/payments.service';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
@Component({
  selector: 'app-lesson-management',
  imports: [CommonModule, FormsModule],
  templateUrl: './lesson-management.component.html',
  styleUrls: ['./lesson-management.component.css']
})
export class LessonManagementComponent implements OnInit {
  // Lists
  classes: Class[] = [];
  students: Student[] = [];
  liveClasses: LiveClass[] = [];
  availableStudents: Student[] = [];
  teachers: any[] = [];
  classrooms: any[] = [];
  
  // Selected items
  selectedClass: Class | null = null;
  selectedLiveClass: LiveClass | null = null;
  selectedStudent: Student | null = null;
  
  // نظام الدفع
  paymentSystemOptions = [
    { value: 'monthly', label: 'شهري' },
    { value: 'rounds', label: 'جولاتي' }
  ];

  // Forms
  newClass: any = {
    name: '',
    subject: '',
    description: '',
    academicYear: '',
    price: 0,
    schedule: [],
    teacher: '',
    students: [],
    paymentSystem: 'monthly',
    roundSettings: {
      sessionCount: 8,
      sessionDuration: 2,
      breakBetweenSessions: 0
    }
  };
  
  newLiveClass: Partial<LiveClass> = {
    date: new Date().toISOString().split('T')[0],
    startTime: '08:00',
    status: 'scheduled'
  };
  
  // Schedule Form
  newScheduleItem: Partial<Schedule> = {
    day: '',
    time: '',
    classroom: ''
  };
  
  // Days of week
  daysOfWeek = [
    { value: 'السبت', label: 'السبت' },
    { value: 'الأحد', label: 'الأحد' },
    { value: 'الإثنين', label: 'الإثنين' },
    { value: 'الثلاثاء', label: 'الثلاثاء' },
    { value: 'الأربعاء', label: 'الأربعاء' },
    { value: 'الخميس', label: 'الخميس' },
    { value: 'الجمعة', label: 'الجمعة' }
  ];
  
  // Time slots (every 30 minutes)
  timeSlots: string[] = [];
  
  // UI states
  viewMode: 'classes' | 'liveClasses' | 'attendance' | 'students' = 'classes';
  isEditingClass = false;
  isCreatingLiveClass = false;
  isViewingAttendance = false;
  showScheduleForm = false;
  isCreatingClass = false;
  
  // Filters
  classFilter = {
    academicYear: '',
    subject: '',
    teacher: ''
  };
  
  liveClassFilter = {
    status: '',
    date: '',
    class: ''
  };
  
  // Statistics
  stats = {
    totalClasses: 0,
    totalStudents: 0,
    totalLiveClasses: 0,
    upcomingClasses: 0
  };

  constructor(
    private classesService: ClassesService,
    private studentsService: StudentsService,
    private liveClassesService: LiveClassesService,
    private paymentsService: PaymentsService,
    private http: HttpClient ,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadData();
    this.generateTimeSlots();
    this.initializeRoundSettings(); // تهيئة إعدادات الجولات
  }

  loadData(): void {
    this.loadClasses();
    this.loadStudents();
    this.loadLiveClasses();
    this.loadTeachers();
    this.loadClassrooms();
    this.calculateStats();
  }

  // تهيئة إعدادات الجولات
  initializeRoundSettings(): void {
    if (!this.newClass.roundSettings) {
      this.newClass.roundSettings = {
        sessionCount: 8,
        sessionDuration: 2,
        breakBetweenSessions: 0
      };
    }
  }

  // توليد قائمة الأوقات
  generateTimeSlots(): void {
    this.timeSlots = [];
    for (let hour = 8; hour <= 20; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        this.timeSlots.push(time);
      }
    }
  }

  loadClasses(): void {
    this.classesService.getClasses().subscribe({
      next: (classes) => {
        this.classes = classes;
        this.stats.totalClasses = classes.length;
      },
      error: (error) => {
        console.error('Error loading classes:', error);
      }
    });
  }

  loadStudents(): void {
    this.studentsService.getStudents().subscribe({
      next: (students) => {
        this.students = students;
        this.stats.totalStudents = students.length;
      },
      error: (error) => {
        console.error('Error loading students:', error);
      }
    });
  }

  loadTeachers(): void {
    this.http.get<any[]>('/api/teachers').subscribe({
      next: (teachers) => {
        this.teachers = teachers;
      },
      error: (error) => {
        console.error('Error loading teachers:', error);
      }
    });
  }

  loadClassrooms(): void {
    this.http.get<any[]>('/api/classrooms').subscribe({
      next: (classrooms) => {
        this.classrooms = classrooms;
      },
      error: (error) => {
        console.error('Error loading classrooms:', error);
      }
    });
  }

  loadLiveClasses(): void {
    this.liveClassesService.getLiveClasses(this.liveClassFilter).subscribe({
      next: (liveClasses) => {
        this.liveClasses = liveClasses;
        console.log('Live classes loaded:', liveClasses);
        
        liveClasses.forEach((liveClass, index) => {
          console.log(`Live class ${index + 1}:`, {
            id: liveClass._id,
            name: liveClass.class?.name,
            hasClass: !!liveClass.class,
            hasStudents: !!liveClass.class?.students,
            studentCount: liveClass.class?.students?.length || 0,
            students: liveClass.class?.students
          });
        });
        
        this.stats.totalLiveClasses = liveClasses.length;
        this.stats.upcomingClasses = liveClasses.filter(lc => 
          lc.status === 'scheduled' || lc.status === 'ongoing'
        ).length;
      },
      error: (error) => {
        console.error('Error loading live classes:', error);
        alert('فشل في تحميل الحصص الحية');
      }
    });
  }
  
  hasValidLiveClassData(): boolean {
    if (!this.selectedLiveClass) return false;
    
    console.log('Selected live class:', {
      liveClass: this.selectedLiveClass,
      hasClass: !!this.selectedLiveClass.class,
      hasStudents: !!this.selectedLiveClass.class?.students,
      students: this.selectedLiveClass.class?.students
    });
    
    return !!this.selectedLiveClass.class?.students;
  }
  
  // Helper Methods for Template
  getPresentCount(liveClass: LiveClass): number {
    if (!liveClass.attendance) return 0;
    return liveClass.attendance.filter((a: Attendance) => a.status === 'present').length;
  }

  getStudentName(student: any): string {
    if (typeof student === 'string') {
      const foundStudent = this.students.find(s => s._id === student || s.id === student);
      return foundStudent?.name || `طالب (${student.substring(0, 8)}...)`;
    }
    return student?.name || 'غير معروف';
  }

  getStudentId(student: any): string {
    if (typeof student === 'string') {
      const foundStudent = this.students.find(s => s._id === student || s.id === student);
      return foundStudent?.studentId || student;
    }
    return student?.studentId || 'غير معروف';
  }

  getStudentAcademicYear(student: any): string {
    if (typeof student === 'string') {
      const foundStudent = this.students.find(s => s._id === student || s.id === student);
      return foundStudent?.academicYear || 'غير معروف';
    }
    return student?.academicYear || 'غير معروف';
  }

  getStudentParentName(student: any): string {
    if (typeof student === 'string') {
      const foundStudent = this.students.find(s => s._id === student || s.id === student);
      return foundStudent?.parentName || 'غير معروف';
    }
    return student?.parentName || 'غير معروف';
  }

  getStudentParentPhone(student: any): string {
    if (typeof student === 'string') {
      const foundStudent = this.students.find(s => s._id === student || s.id === student);
      return foundStudent?.parentPhone || 'غير معروف';
    }
    return student?.parentPhone || 'غير معروف';
  }

  getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'scheduled': 'مجدولة',
      'ongoing': 'جارية',
      'completed': 'منتهية',
      'cancelled': 'ملغاة'
    };
    return statusMap[status] || status;
  }

  getStudentStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'active': 'نشط',
      'pending': 'قيد الانتظار',
      'inactive': 'غير نشط',
      'banned': 'محظور'
    };
    return statusMap[status] || status;
  }

  getAttendanceStatus(studentId: string | any): string {
    console.log('Getting attendance status for student:', studentId);
    
    if (!this.selectedLiveClass || !this.selectedLiveClass.attendance) {
      console.log('No live class or attendance data');
      return 'غير مسجل';
    }
    
    const actualStudentId = typeof studentId === 'string' ? studentId : studentId?._id;
    
    if (!actualStudentId) {
      console.log('No student ID found');
      return 'غائب';
    }
    
    if (!Array.isArray(this.selectedLiveClass.attendance)) {
      console.log('Attendance is not an array:', this.selectedLiveClass.attendance);
      return 'غائب';
    }
    
    const attendance = this.selectedLiveClass.attendance.find(
      (a: Attendance) => {
        if (!a || !a.student) return false;
        
        const attStudent = a.student;
        if (typeof attStudent === 'string') {
          return attStudent === actualStudentId;
        } else {
          return attStudent?._id === actualStudentId;
        }
      }
    );
    
    console.log('Found attendance:', attendance);
    
    if (!attendance) return 'غائب';
    
    const statusMap: { [key: string]: string } = {
      'present': 'حاضر',
      'absent': 'غائب',
      'late': 'متأخر'
    };
    
    return statusMap[attendance.status] || attendance.status;
  }
  
  getAttendanceStatusClass(student: any): string {
    if (!this.selectedLiveClass) return '';
    
    const studentId = typeof student === 'string' ? student : student?._id;
    if (!studentId) return 'status-absent';
    
    const attendance = this.selectedLiveClass.attendance?.find(
      (a: Attendance) => {
        const attStudent = a.student;
        if (typeof attStudent === 'string') {
          return attStudent === studentId;
        } else {
          return attStudent?._id === studentId;
        }
      }
    );
    
    if (!attendance) return 'status-absent';
    
    return `status-${attendance.status}`;
  }

  getStudentFullObject(student: any): Student | null {
    if (typeof student === 'string') {
      return this.students.find(s => s._id === student) || null;
    }
    return student || null;
  }

  selectClass(cls: Class): void {
    this.selectedClass = cls;
    // Add null check
    if (cls._id) {
      this.loadAvailableStudents(cls._id);
    }
    // تأكد من وجود إعدادات الجولات
    if (cls.paymentSystem === 'rounds' && !cls.roundSettings) {
      cls.roundSettings = {
        sessionCount: 8,
        sessionDuration: 2,
        breakBetweenSessions: 0
      };
    }
  }

  // إضافة عنصر للجدول
  addScheduleItem(): void {
    if (this.newScheduleItem.day && this.newScheduleItem.time && this.newScheduleItem.classroom) {
      if (!this.newClass.schedule) {
        this.newClass.schedule = [];
      }
      
      this.newClass.schedule.push({
        day: this.newScheduleItem.day,
        time: this.newScheduleItem.time,
        classroom: this.newScheduleItem.classroom
      } as any);
      
      this.resetScheduleForm();
    } else {
      alert('الرجاء ملء جميع الحقول');
    }
  }

  // حذف عنصر من الجدول
  removeScheduleItem(index: number): void {
    if (this.newClass.schedule) {
      this.newClass.schedule.splice(index, 1);
    }
  }

  // إعادة تعيين نموذج الجدول
  resetScheduleForm(): void {
    this.newScheduleItem = {
      day: '',
      time: '',
      classroom: ''
    };
  }

  // إظهار/إخفاء قسم إعدادات الجولات
  showRoundSettings(): boolean {
    return this.newClass.paymentSystem === 'rounds';
  }

  // تحديث إجمالي السعر للجولات
  updateRoundTotal(): void {
    if (this.newClass.paymentSystem === 'rounds' && 
        this.newClass.roundSettings && 
        this.newClass.price > 0) {
      const total = this.newClass.price * (this.newClass.roundSettings.sessionCount || 1);
      console.log('إجمالي سعر الجولة:', total);
    }
  }

  // تأكد من وجود إعدادات الجولات
  ensureRoundSettingsExist(): void {
    if (!this.newClass.roundSettings) {
      this.newClass.roundSettings = {
        sessionCount: 8,
        sessionDuration: 2,
        breakBetweenSessions: 0
      };
    }
  }

  // عند تغيير نظام الدفع
  onPaymentSystemChange(): void {
    if (this.newClass.paymentSystem === 'rounds') {
      this.ensureRoundSettingsExist();
    }
  }

  createClass(): void {
    if (!this.validateClass()) return;

    // التحقق من إعدادات الجولات
    if (this.newClass.paymentSystem === 'rounds') {
      this.ensureRoundSettingsExist();
      if (this.newClass.roundSettings.sessionCount < 1) {
        alert('يجب تحديد عدد جلسات صحيح للنظام الجولاتي');
        return;
      }
    }

    this.classesService.createClass(this.newClass as any).subscribe({
      next: (createdClass) => {
        this.classes.push(createdClass);
        this.resetNewClassForm();
        this.isCreatingClass = false;
        alert('تم إنشاء الحصة بنجاح');
      },
      error: (error) => {
        console.error('Error creating class:', error);
        alert('فشل في إنشاء الحصة');
      }
    });
  }

  updateClass(): void {
    if (!this.selectedClass || !this.selectedClass._id || !this.validateClass()) return;

    this.classesService.updateClass(this.selectedClass._id, this.selectedClass).subscribe({
      next: (updatedClass) => {
        const index = this.classes.findIndex(c => c._id === updatedClass._id);
        if (index !== -1) {
          this.classes[index] = updatedClass;
        }
        this.isEditingClass = false;
        alert('تم تحديث الحصة بنجاح');
      },
      error: (error) => {
        console.error('Error updating class:', error);
        alert('فشل في تحديث الحصة');
      }
    });
  }

  deleteClass(classId: string): void {
    if (!confirm('هل أنت متأكد من حذف هذه الحصة؟')) return;

    this.classesService.deleteClass(classId).subscribe({
      next: () => {
        this.classes = this.classes.filter(c => c._id !== classId);
        if (this.selectedClass?._id === classId) {
          this.selectedClass = null;
        }
        alert('تم حذف الحصة بنجاح');
      },
      error: (error) => {
        console.error('Error deleting class:', error);
        alert('فشل في حذف الحصة');
      }
    });
  }

  loadAvailableStudents(classId: string): void {
    this.classesService.getAvailableClasses('', '').subscribe({
      next: (classes) => {
        const currentClass = classes.find(c => c._id === classId);
        if (currentClass) {
          const enrolledIds = currentClass.students?.map(s => 
            typeof s === 'string' ? s : s._id
          ) || [];
          
          this.availableStudents = this.students.filter(student => 
            !enrolledIds.includes(student._id)
          );
        }
      },
      error: (error) => {
        console.error('Error loading available students:', error);
      }
    });
  }

  enrollStudent(student: Student): void {
    if (!this.selectedClass || !this.selectedClass._id) return;

    if (confirm(`هل تريد تسجيل الطالب ${student.name} في الحصة ${this.selectedClass.name}؟`)) {
      this.classesService.enrollStudent(this.selectedClass._id, student._id).subscribe({
        next: (response) => {
          if (this.selectedClass) {
            if (!this.selectedClass.students) {
              this.selectedClass.students = [];
            }
            this.selectedClass.students.push(student);
            this.availableStudents = this.availableStudents.filter(s => s._id !== student._id);
          }
          alert('تم تسجيل الطالب بنجاح');
        },
        error: (error) => {
          console.error('Error enrolling student:', error);
          alert('فشل في تسجيل الطالب');
        }
      });
    }
  }

  unenrollStudent(studentId: string): void {
    if (!this.selectedClass || !this.selectedClass._id) return;

    if (confirm('هل تريد إزالة الطالب من هذه الحصة؟')) {
      this.classesService.unenrollStudent(this.selectedClass._id, studentId).subscribe({
        next: () => {
          if (this.selectedClass && this.selectedClass.students) {
            this.selectedClass.students = this.selectedClass.students.filter(s => {
              const sId = typeof s === 'string' ? s : s._id;
              return sId !== studentId;
            });
            // Add null check
            if (this.selectedClass._id) {
              this.loadAvailableStudents(this.selectedClass._id);
            }
          }
          alert('تم إزالة الطالب بنجاح');
        },
        error: (error) => {
          console.error('Error unenrolling student:', error);
          alert('فشل في إزالة الطالب');
        }
      });
    }
  }

  selectLiveClass(liveClass: LiveClass): void {
    this.selectedLiveClass = liveClass;
  }

  createLiveClass(): void {
    if (!this.selectedClass || !this.validateLiveClass()) return;

    const liveClassData = {
      ...this.newLiveClass,
      class: this.selectedClass._id,
      teacher: this.selectedClass.teacher?._id || this.selectedClass.teacher
    };

    this.liveClassesService.createLiveClass(liveClassData).subscribe({
      next: (createdLiveClass) => {
        this.liveClasses.push(createdLiveClass);
        this.isCreatingLiveClass = false;
        this.resetNewLiveClassForm();
        alert('تم إنشاء الحصة الحية بنجاح');
      },
      error: (error) => {
        console.error('Error creating live class:', error);
        alert('فشل في إنشاء الحصة الحية');
      }
    });
  }

  startLiveClass(liveClassId: string): void {
    this.liveClassesService.startLiveClass(liveClassId).subscribe({
      next: (updatedLiveClass) => {
        this.updateLiveClassInList(updatedLiveClass);
        alert('تم بدء الحصة بنجاح');
      },
      error: (error) => {
        console.error('Error starting live class:', error);
        alert('فشل في بدء الحصة');
      }
    });
  }

  endLiveClass(liveClassId: string): void {
    this.liveClassesService.endLiveClass(liveClassId).subscribe({
      next: (updatedLiveClass) => {
        this.updateLiveClassInList(updatedLiveClass);
        alert('تم إنهاء الحصة بنجاح');
      },
      error: (error) => {
        console.error('Error ending live class:', error);
        alert('فشل في إنهاء الحصة');
      }
    });
  }

  cancelLiveClass(liveClassId: string): void {
    if (!confirm('هل تريد إلغاء هذه الحصة؟')) return;

    this.liveClassesService.cancelLiveClass(liveClassId).subscribe({
      next: (updatedLiveClass) => {
        this.updateLiveClassInList(updatedLiveClass);
        alert('تم إلغاء الحصة بنجاح');
      },
      error: (error) => {
        console.error('Error canceling live class:', error);
        alert('فشل في إلغاء الحصة');
      }
    });
  }

  viewAttendance(liveClass: LiveClass): void {
    this.selectedLiveClass = liveClass;
    this.viewMode = 'attendance';
  }

  recordAttendance(student: any, status: 'present' | 'absent' | 'late'): void {
    if (!this.selectedLiveClass) return;

    let studentId: string;
    
    if (typeof student === 'string') {
      studentId = student;
    } else if (student?._id) {
      studentId = student._id;
    } else {
      console.error('Invalid student format:', student);
      alert('خطأ في بيانات الطالب');
      return;
    }

    const attendanceData = {
      studentId: studentId,
      status: status,
      method: 'manual'
    };

    this.liveClassesService.recordAttendance(this.selectedLiveClass._id, attendanceData).subscribe({
      next: (response) => {
        if (this.selectedLiveClass) {
          if (!this.selectedLiveClass.attendance) {
            this.selectedLiveClass.attendance = [];
          }
          
          const existingIndex = this.selectedLiveClass.attendance.findIndex(
            (a: Attendance) => {
              const attStudent = a.student;
              if (typeof attStudent === 'string') {
                return attStudent === studentId;
              } else {
                return attStudent?._id === studentId;
              }
            }
          );
          
          if (existingIndex >= 0) {
            this.selectedLiveClass.attendance[existingIndex].status = status;
          } else {
            const fullStudent = this.getStudentFullObject(studentId);
            this.selectedLiveClass.attendance.push({
              student: fullStudent || studentId,
              status: status,
              timestamp: new Date().toISOString(),
              method: 'manual'
            } as any);
          }
        }
        alert('تم تسجيل الحضور بنجاح');
      },
      error: (error) => {
        console.error('Error recording attendance:', error);
        alert('فشل في تسجيل الحضور');
      }
    });
  }

  autoMarkAbsent(): void {
    if (!this.selectedLiveClass) return;

    if (confirm('هل تريد تسجيل الغياب التلقائي للطلاب غير الحاضرين؟')) {
      this.liveClassesService.autoMarkAbsent(this.selectedLiveClass._id).subscribe({
        next: (response) => {
          alert(`تم تسجيل ${response.absentStudents?.length || 0} طالب كغائبين`);
          this.loadLiveClasses();
        },
        error: (error) => {
          console.error('Error auto-marking absent:', error);
          alert('فشل في تسجيل الغياب التلقائي');
        }
      });
    }
  }

  viewStudentPayments(student: Student): void {
    this.selectedStudent = student;
    this.viewMode = 'students';
  }

  viewAttendanceForStudent(student: Student): void {
    this.selectedStudent = student;
    this.viewMode = 'attendance';
    console.log('Viewing attendance for student:', student.name);
  }

  // Utility Methods
  private validateClass(): boolean {
    if (!this.newClass.name || 
        !this.newClass.subject || 
        !this.newClass.academicYear || 
        !this.newClass.price ||
        !this.newClass.teacher ||
        (this.newClass.schedule && this.newClass.schedule.length === 0)) {
      alert('الرجاء ملء جميع الحقول المطلوبة وإضافة جدول الحصص');
      return false;
    }
    
    // التحقق من إعدادات الجولات
    if (this.newClass.paymentSystem === 'rounds') {
      this.ensureRoundSettingsExist();
      if (!this.newClass.roundSettings.sessionCount || 
          this.newClass.roundSettings.sessionCount < 1) {
        alert('يجب تحديد عدد جلسات صحيح للنظام الجولاتي');
        return false;
      }
    }
    
    return true;
  }

  private validateLiveClass(): boolean {
    if (!this.newLiveClass.date || !this.newLiveClass.startTime) {
      alert('الرجاء ملء جميع الحقول المطلوبة');
      return false;
    }
    return true;
  }

  public resetNewClassForm(): void {
    this.newClass = {
      name: '',
      subject: '',
      description: '',
      academicYear: '',
      price: 0,
      schedule: [],
      teacher: '',
      students: [],
      paymentSystem: 'monthly',
      roundSettings: {
        sessionCount: 8,
        sessionDuration: 2,
        breakBetweenSessions: 0
      }
    };
    this.resetScheduleForm();
  }

  public resetNewLiveClassForm(): void {
    this.newLiveClass = {
      date: new Date().toISOString().split('T')[0],
      startTime: '08:00',
      status: 'scheduled'
    };
  }

  public updateLiveClassInList(updatedLiveClass: LiveClass): void {
    const index = this.liveClasses.findIndex(lc => lc._id === updatedLiveClass._id);
    if (index !== -1) {
      this.liveClasses[index] = updatedLiveClass;
    }
    if (this.selectedLiveClass?._id === updatedLiveClass._id) {
      this.selectedLiveClass = updatedLiveClass;
    }
  }

  // Filter Methods
  applyClassFilter(): void {
    this.loadClasses();
  }

  applyLiveClassFilter(): void {
    this.loadLiveClasses();
  }

  resetClassFilter(): void {
    this.classFilter = {
      academicYear: '',
      subject: '',
      teacher: ''
    };
    this.loadClasses();
  }

  resetLiveClassFilter(): void {
    this.liveClassFilter = {
      status: '',
      date: '',
      class: ''
    };
    this.loadLiveClasses();
  }

  // Navigation
  setViewMode(mode: 'classes' | 'liveClasses' | 'attendance' | 'students'): void {
    this.viewMode = mode;
    this.isEditingClass = false;
    this.isCreatingLiveClass = false;
    this.isViewingAttendance = false;
    this.isCreatingClass = false;
  }

  // Export/Print
  exportClassData(): void {
    console.log('Exporting class data...');
  }

  printAttendanceReport(): void {
    console.log('Printing attendance report...');
  }

  calculateStats(): void {
    // Already calculated in load methods
  }

  goToClassDetails(): void {
    if (this.selectedLiveClass?.class?._id) {
      const foundClass = this.classes.find(c => c._id === this.selectedLiveClass?.class?._id);
      if (foundClass) {
        this.selectClass(foundClass);
        this.setViewMode('classes');
      }
    }
  }

  debugAttendance(): void {
    console.log('=== Attendance Debug ===');
    console.log('Selected live class:', this.selectedLiveClass);
    
    if (this.selectedLiveClass?.class?.students) {
      console.log('Students in class:', this.selectedLiveClass.class.students);
      
      this.selectedLiveClass.class.students.forEach((studentId: string, index: number) => {
        console.log(`Student ${index + 1}:`, {
          id: studentId,
          name: this.getStudentName(studentId),
          attendanceStatus: this.getAttendanceStatus(studentId)
        });
      });
    }
    
    console.log('All students loaded:', this.students);
  }

  getTeacherName(teacherId: any): string {
    if (!teacherId) return 'غير معروف';
    
    if (typeof teacherId === 'string') {
      const teacher = this.teachers.find(t => t._id === teacherId);
      return teacher?.name || 'غير معروف';
    }
    
    return teacherId?.name || 'غير معروف';
  }

  getClassroomName(classroomId: any): string {
    if (!classroomId) return 'غير معروف';
    
    if (typeof classroomId === 'string') {
      const classroom = this.classrooms.find(c => c._id === classroomId);
      return classroom?.name || 'غير معروف';
    }
    
    return classroomId?.name || 'غير معروف';
  }

  // الحصول على جلسات الجولة
  getRoundSessionsCount(): number {
    if (this.selectedClass?.paymentSystem === 'rounds' && this.selectedClass?.roundSettings) {
      return this.selectedClass.roundSettings.sessionCount || 0;
    }
    return 0;
  }

  // الحصول على إجمالي سعر الجولة
  getRoundTotalPrice(): number {
    if (this.selectedClass?.paymentSystem === 'rounds' && this.selectedClass?.price && this.selectedClass?.roundSettings) {
      return this.selectedClass.price * (this.selectedClass.roundSettings.sessionCount || 1);
    }
    return 0;
  }

// Navigate to lesson details
viewLessonDetails(lessonId: string): void {
  this.router.navigate(['/home/lesson-detail', lessonId]);
}
  
}
