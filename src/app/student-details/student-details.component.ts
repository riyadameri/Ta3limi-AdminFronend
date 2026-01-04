import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import Swal from 'sweetalert2';

// الواجهات
interface Student {
  _id?: string;
  id?: string;
  name: string;
  studentId: string;
  academicYear: string;
  parentName: string;
  parentPhone: string;
  parentEmail?: string;
  birthDate?: string;
  registrationDate: Date;
  status: string;
  active: boolean;
  hasPaidRegistration: boolean;
  classes?: any[];
  new?: boolean;
}

interface Payment {
  _id?: string;
  id?: string;
  student: any;
  class?: any;
  amount: number;
  month: string;
  monthCode?: string;
  paymentDate?: Date;
  status: 'paid' | 'pending' | 'late';
  paymentMethod: string;
  invoiceNumber?: string;
  recordedBy?: any;
  notes?: string;
  createdAt?: Date;
  formattedDate?: string;
  createdAtFormatted?: string;
  className?: string;
  subject?: string;
  teacherName?: string;
  studentName?: string;
  studentId?: string;
  isLate?: boolean;
}

interface MonthlyPayment {
  id?: string;
  _id?: string;
  studentId: string;
  month: string;
  amount: number;
  status: string;
  paymentDate?: Date;
  dueDate?: Date;
  paymentMethod?: string;
  notes?: string;
  className?: string;
}

interface RoundPayment {
  id?: string;
  _id?: string;
  roundNumber: string;
  sessionCount: number;
  sessionPrice: number;
  totalAmount: number;
  startDate: Date;
  endDate: Date;
  status: string;
  statusText?: string;
  statusClass?: string;
  sessions: any[];
  notes?: string;
  student?: any;
  class?: any;
}

interface Class {
  _id?: string;
  id?: string;
  name: string;
  subject: string;
  price: number;
  teacher?: any;
  schedule?: any[];
  paymentSystem: 'monthly' | 'rounds';
  roundSettings?: {
    sessionCount: number;
    sessionDuration: number;
    breakBetweenSessions: number;
  };
  students?: any[];
  academicYear?: string;
  classroom?: any;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface RoundSelection {
  roundNumber: string;
  sessionCount: number;
  sessionPrice: number;
  totalAmount: number;
  startDate: Date;
  endDate: Date;
  notes?: string;
}

@Component({
  selector: 'app-student-details',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './student-details.component.html',
  styleUrls: ['./student-details.component.css']
})
export class StudentDetailsComponent implements OnInit {
  private apiUrl = 'http://localhost:3000/api';
  
  student: Student | null = null;
  loading: boolean = false;
  activeTab: string = 'info';
  studentClasses: any[] = [];
  paymentHistory: Payment[] = [];
  
  // Payment Modal Variables
  showPaymentModal: boolean = false;
  showEditPaymentModal: boolean = false;
  showDeleteConfirmModal: boolean = false;
  
  // Payment Form
  newPayment: any = {
    student: '',
    amount: 0,
    month: '',
    paymentMethod: 'cash',
    notes: ''
  };
  
  // Edit Payment
  editingPayment: Payment | null = null;
  
  // Delete Confirmation
  paymentToDelete: Payment | null = null;
  
  // Months for dropdown
  months = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];
  
  paymentMethods = [
    { value: 'cash', label: 'نقداً' },
    { value: 'bank', label: 'تحويل بنكي' },
    { value: 'card', label: 'بطاقة إئتمان' },
    { value: 'check', label: 'شيك' },
    { value: 'online', label: 'دفع إلكتروني' },
    { value: 'mobile', label: 'دفع محمول' }
  ];
  
  academicYears = [
    { value: '1AS', label: 'الأولى ثانوي' },
    { value: '2AS', label: 'الثانية ثانوي' },
    { value: '3AS', label: 'الثالثة ثانوي' },
    { value: '1MS', label: 'الأولى متوسط' },
    { value: '2MS', label: 'الثانية متوسط' },
    { value: '3MS', label: 'الثالثة متوسط' },
    { value: '4MS', label: 'الرابعة متوسط' },
    { value: '1AP', label: 'الأولى ابتدائي' },
    { value: '2AP', label: 'الثانية ابتدائي' },
    { value: '3AP', label: 'الثالثة ابتدائي' },
    { value: '4AP', label: 'الرابعة ابتدائي' },
    { value: '5AP', label: 'الخامسة ابتدائي' }
  ];

  // Add to Lessons Modal
  showAddToLessonsModal: boolean = false;
  availableClasses: Class[] = [];
  filteredAvailableClasses: Class[] = [];
  alreadyEnrolledClasses: Class[] = [];
  selectedClasses: Class[] = [];
  loadingAvailableClasses: boolean = false;
  isEnrolling: boolean = false;

  // Round Selection Modal
  showRoundSelectionModal: boolean = false;
  selectedClassForRounds: Class | null = null;
  roundSelection: RoundSelection = {
    roundNumber: `RND-${Date.now().toString().slice(-6)}`,
    sessionCount: 8,
    sessionPrice: 0,
    totalAmount: 0,
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    notes: ''
  };

  // Filter properties
  filterSubject: string = '';
  filterLevel: string = '';

  // Subjects list
  subjects = [
    'رياضيات', 'فيزياء', 'علوم', 'لغة عربية', 
    'لغة فرنسية', 'لغة انجليزية', 'تاريخ', 
    'جغرافيا', 'فلسفة', 'إعلام آلي'
  ];

  // Payment System
  studentMonthlyPayments: MonthlyPayment[] = [];
  studentRounds: RoundPayment[] = [];
  
  // Current date
  currentDate = new Date();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.loadStudentDetails();
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  loadStudentDetails(): void {
    const studentId = this.route.snapshot.paramMap.get('id');
    if (!studentId) {
      this.router.navigate(['/home/students-management']);
      return;
    }

    this.loading = true;
    
    this.http.get<any>(`${this.apiUrl}/students/${studentId}`, {
      headers: this.getHeaders()
    }).subscribe({
      next: (student) => {
        this.student = student;
        this.newPayment.student = this.getStudentId();
        this.loadStudentClasses(studentId);
        this.loadPaymentHistory(studentId);
        this.loadStudentPaymentSystems(studentId);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading student details:', error);
        Swal.fire('خطأ', 'فشل في تحميل بيانات الطالب', 'error');
        this.router.navigate(['/home/students-management']);
        this.loading = false;
      }
    });
  }

  loadStudentClasses(studentId: string): void {
    this.http.get<any[]>(`${this.apiUrl}/students/${studentId}/classes`, {
      headers: this.getHeaders()
    }).subscribe({
      next: (classes) => {
        this.studentClasses = classes;
      },
      error: (error) => {
        console.error('Error loading student classes:', error);
        this.studentClasses = [];
      }
    });
  }

  loadPaymentHistory(studentId: string): void {
    console.log('Loading payment history for student:', studentId);
    
    this.http.get<any>(`${this.apiUrl}/payments/student/${studentId}`, {
      headers: this.getHeaders()
    }).subscribe({
      next: (response) => {
        console.log('Payment history response:', response);
        
        if (response.success && response.payments) {
          this.paymentHistory = response.payments;
          console.log(`Loaded ${this.paymentHistory.length} payments`);
        } else {
          this.paymentHistory = [];
          console.log('No payments found or error in response');
        }
      },
      error: (error) => {
        console.error('Error loading payment history:', error);
        this.paymentHistory = [];
        Swal.fire('خطأ', 'فشل في تحميل سجل المدفوعات', 'error');
      }
    });
  }

  loadStudentPaymentSystems(studentId: string): void {
    // Load monthly payments
    this.http.get<any>(`${this.apiUrl}/payments/student/${studentId}`, {
      headers: this.getHeaders()
    }).subscribe({
      next: (response) => {
        if (response.success && response.payments) {
          this.studentMonthlyPayments = response.payments.map((p: any) => ({
            id: p._id,
            _id: p._id,
            studentId: p.student?._id || studentId,
            month: p.month,
            amount: p.amount,
            status: p.status,
            paymentDate: p.paymentDate,
            paymentMethod: p.paymentMethod,
            notes: p.notes,
            className: p.class?.name
          }));
        }
      },
      error: (error) => {
        console.error('Error loading monthly payments:', error);
        this.studentMonthlyPayments = [];
      }
    });

    // Load rounds
    this.http.get<any>(`${this.apiUrl}/payment-systems/rounds/student/${studentId}`, {
      headers: this.getHeaders()
    }).subscribe({
      next: (response) => {
        if (response.success && response.rounds) {
          this.studentRounds = response.rounds;
          this.updateRoundStatuses();
        } else {
          this.studentRounds = [];
        }
      },
      error: (error) => {
        console.error('Error loading rounds:', error);
        this.studentRounds = [];
      }
    });
  }

  // Update round statuses
  updateRoundStatuses(): void {
    const now = new Date();
    this.studentRounds.forEach(round => {
      const endDate = new Date(round.endDate);
      const startDate = new Date(round.startDate);
      
      if (round.status === 'paid') {
        round.statusText = 'مدفوعة';
        round.statusClass = 'badge bg-success';
      } else if (now > endDate && round.status !== 'paid') {
        round.statusText = 'منتهية';
        round.statusClass = 'badge bg-danger';
      } else if (now >= startDate && now <= endDate && round.status !== 'paid') {
        round.statusText = 'متأخرة';
        round.statusClass = 'badge bg-warning';
      } else if (now < startDate) {
        round.statusText = 'قادمة';
        round.statusClass = 'badge bg-info';
      } else {
        round.statusText = 'معلقة';
        round.statusClass = 'badge bg-secondary';
      }
    });
  }

  // Helper methods
  private getStudentId(): string {
    if (!this.student) return '';
    if (this.student.id) return this.student.id;
    if ((this.student as any)._id) return (this.student as any)._id;
    return this.student.studentId || '';
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
    
    // Refresh data when switching to payments tab
    if (tab === 'payments' && this.student) {
      this.loadPaymentHistory(this.getStudentId());
    }
  }

  goBack(): void {
    this.router.navigate(['/home/students-management']);
  }

  // ===== Payment Management =====
  openAddPaymentModal(): void {
    if (!this.student) return;
    
    const currentDate = new Date();
    const currentMonth = this.months[currentDate.getMonth()];
    const currentYear = currentDate.getFullYear();
    
    this.newPayment = {
      student: this.getStudentId(),
      amount: 0,
      month: `${currentMonth} ${currentYear}`,
      paymentMethod: 'cash',
      notes: ''
    };
    
    this.showPaymentModal = true;
  }

  closePaymentModal(): void {
    this.showPaymentModal = false;
    this.newPayment = {
      student: '',
      amount: 0,
      month: '',
      paymentMethod: 'cash',
      notes: ''
    };
  }

  openEditPaymentModal(payment: Payment): void {
    this.editingPayment = { ...payment };
    this.showEditPaymentModal = true;
  }

  closeEditPaymentModal(): void {
    this.showEditPaymentModal = false;
    this.editingPayment = null;
  }

  openDeleteConfirmModal(payment: Payment): void {
    this.paymentToDelete = payment;
    this.showDeleteConfirmModal = true;
  }

  closeDeleteConfirmModal(): void {
    this.showDeleteConfirmModal = false;
    this.paymentToDelete = null;
  }

  addPayment(): void {
    if (!this.student || !this.newPayment.amount || this.newPayment.amount <= 0) {
      Swal.fire('خطأ', 'يرجى إدخال مبلغ صحيح', 'error');
      return;
    }

    if (!this.newPayment.month) {
      Swal.fire('خطأ', 'يرجى اختيار الشهر', 'error');
      return;
    }

    Swal.fire({
      title: 'جاري تسجيل الدفعة...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    this.http.post<any>(`${this.apiUrl}/payments`, this.newPayment, {
      headers: this.getHeaders()
    }).subscribe({
      next: (response) => {
        Swal.fire({
          icon: 'success',
          title: 'نجاح',
          text: 'تم تسجيل الدفعة بنجاح',
          timer: 1500,
          showConfirmButton: false
        });

        this.closePaymentModal();
        this.loadPaymentHistory(this.getStudentId());
      },
      error: (error) => {
        console.error('Error adding payment:', error);
        Swal.fire('خطأ', 'فشل في تسجيل الدفعة', 'error');
      }
    });
  }

  updatePayment(): void {
    if (!this.editingPayment || !this.editingPayment._id) return;

    if (!this.editingPayment.amount || this.editingPayment.amount <= 0) {
      Swal.fire('خطأ', 'يرجى إدخال مبلغ صحيح', 'error');
      return;
    }

    Swal.fire({
      title: 'جاري تحديث الدفعة...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    const paymentId = this.editingPayment._id;
    
    this.http.put<any>(`${this.apiUrl}/payments/${paymentId}`, this.editingPayment, {
      headers: this.getHeaders()
    }).subscribe({
      next: (response) => {
        Swal.fire({
          icon: 'success',
          title: 'نجاح',
          text: 'تم تحديث الدفعة بنجاح',
          timer: 1500,
          showConfirmButton: false
        });

        this.closeEditPaymentModal();
        this.loadPaymentHistory(this.getStudentId());
      },
      error: (error) => {
        console.error('Error updating payment:', error);
        Swal.fire('خطأ', 'فشل في تحديث الدفعة', 'error');
      }
    });
  }

  deletePayment(): void {
    if (!this.paymentToDelete) return;

    Swal.fire({
      title: 'جاري حذف الدفعة...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    const paymentId = this.paymentToDelete._id || this.paymentToDelete.id;
    
    this.http.delete<any>(`${this.apiUrl}/payments/${paymentId}`, {
      headers: this.getHeaders()
    }).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'نجاح',
          text: 'تم حذف الدفعة بنجاح',
          timer: 1500,
          showConfirmButton: false
        });

        this.closeDeleteConfirmModal();
        this.loadPaymentHistory(this.getStudentId());
      },
      error: (error) => {
        console.error('Error deleting payment:', error);
        Swal.fire('خطأ', 'فشل في حذف الدفعة', 'error');
      }
    });
  }

  payPayment(payment: Payment): void {
    Swal.fire({
      title: 'تأكيد الدفع',
      html: `
        <div class="text-start">
          <p><strong>المبلغ:</strong> ${payment.amount.toLocaleString()} د.ج</p>
          <p><strong>الشهر:</strong> ${payment.month}</p>
          ${payment.className ? `<p><strong>الحصة:</strong> ${payment.className}</p>` : ''}
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'دفع',
      cancelButtonText: 'إلغاء',
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      input: 'select',
      inputOptions: {
        'cash': 'نقداً',
        'bank': 'تحويل بنكي',
        'card': 'بطاقة ائتمان',
        'online': 'دفع إلكتروني'
      },
      inputPlaceholder: 'اختر طريقة الدفع',
      inputValue: 'cash'
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        const paymentData = {
          paymentMethod: result.value,
          paymentDate: new Date().toISOString(),
          notes: 'تم الدفع من خلال النظام'
        };

        Swal.fire({
          title: 'جاري الدفع...',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        const paymentId = payment._id || payment.id;
        
        this.http.put<any>(`${this.apiUrl}/payments/${paymentId}/pay`, paymentData, {
          headers: this.getHeaders()
        }).subscribe({
          next: (response) => {
            Swal.fire({
              icon: 'success',
              title: 'نجاح',
              text: 'تم دفع الدفعة بنجاح',
              timer: 1500,
              showConfirmButton: false
            });

            this.loadPaymentHistory(this.getStudentId());
          },
          error: (error) => {
            console.error('Error paying payment:', error);
            Swal.fire('خطأ', 'فشل في دفع الدفعة', 'error');
          }
        });
      }
    });
  }

  // ===== Class Enrollment =====
  openAddToLessonsModal(): void {
    if (!this.student) return;
    
    this.showAddToLessonsModal = true;
    this.selectedClasses = [];
    this.filterSubject = '';
    this.filterLevel = '';
    
    this.loadAvailableClasses();
  }
  
  closeAddToLessonsModal(): void {
    this.showAddToLessonsModal = false;
    this.availableClasses = [];
    this.filteredAvailableClasses = [];
    this.alreadyEnrolledClasses = [];
    this.selectedClasses = [];
    this.selectedClassForRounds = null;
    this.showRoundSelectionModal = false;
  }
  
  loadAvailableClasses(): void {
    if (!this.student) return;
    
    this.loadingAvailableClasses = true;
    
    this.http.get<Class[]>(`${this.apiUrl}/classes/available`, {
      headers: this.getHeaders()
    }).subscribe({
      next: (classes) => {
        this.availableClasses = classes;
        
        // Get already enrolled classes
        const enrolledClassIds = this.studentClasses.map(c => c._id || c.id);
        this.alreadyEnrolledClasses = classes.filter(c => 
          enrolledClassIds.includes(c._id || c.id)
        );
        
        // Filter out already enrolled classes
        this.availableClasses = classes.filter(c => 
          !enrolledClassIds.includes(c._id || c.id)
        );
        
        this.filterAvailableClasses();
        this.loadingAvailableClasses = false;
      },
      error: (error) => {
        console.error('Error loading available classes:', error);
        Swal.fire('خطأ', 'فشل في تحميل الحصص المتاحة', 'error');
        this.loadingAvailableClasses = false;
      }
    });
  }
  
  filterAvailableClasses(): void {
    this.filteredAvailableClasses = this.availableClasses.filter((cls: Class) => {
      if (this.filterSubject && cls.subject !== this.filterSubject) {
        return false;
      }
      
      if (this.filterLevel && cls.academicYear !== this.filterLevel) {
        return false;
      }
      
      return true;
    });
  }
  
  isLevelCompatible(classObj: Class): boolean {
    if (!this.student || !classObj.academicYear) return true;
    
    if (!classObj.academicYear || classObj.academicYear === 'NS' || 
        classObj.academicYear === 'غير محدد') {
      return true;
    }
    
    return classObj.academicYear === this.student.academicYear;
  }
  
  toggleClassSelection(classObj: Class): void {
    const index = this.selectedClasses.findIndex(c => {
      const cId = c._id || c.id;
      const classObjId = classObj._id || classObj.id;
      return cId === classObjId;
    });
    
    if (index > -1) {
      this.selectedClasses.splice(index, 1);
    } else {
      this.selectedClasses.push(classObj);
    }
  }
  
  isClassSelected(classId: string): boolean {
    return this.selectedClasses.some(c => {
      const cId = c._id || c.id;
      return cId === classId;
    });
  }
  
  calculateMonthlyTotal(): number {
    return this.selectedClasses.reduce((total, cls) => total + (cls.price || 0), 0);
  }
  
  // Check payment type and proceed accordingly
  checkAndEnrollStudentToSelectedClasses(): void {
    if (!this.student || this.selectedClasses.length === 0) return;
    
    // Check if there are any classes with rounds system
    const classesWithRounds = this.selectedClasses.filter(cls => 
      cls.paymentSystem === 'rounds'
    );
    
    if (classesWithRounds.length > 0) {
      // If there are classes with rounds, open round selection modal
      this.selectedClassForRounds = classesWithRounds[0];
      this.openRoundSelectionModal();
    } else {
      // If all classes are monthly, proceed with enrollment
      this.enrollStudentToSelectedClasses();
    }
  }
  
  // Open round selection modal
  openRoundSelectionModal(): void {
    if (!this.selectedClassForRounds) return;
    
    // Set default values
    this.roundSelection = {
      roundNumber: `RND-${Date.now().toString().slice(-6)}`,
      sessionCount: this.selectedClassForRounds.roundSettings?.sessionCount || 8,
      sessionPrice: this.selectedClassForRounds.price / (this.selectedClassForRounds.roundSettings?.sessionCount || 8),
      totalAmount: this.selectedClassForRounds.price,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      notes: `نظام جولات تلقائي للحصة ${this.selectedClassForRounds.name}`
    };
    
    this.showRoundSelectionModal = true;
  }
  
  // Close round selection modal
  closeRoundSelectionModal(): void {
    this.showRoundSelectionModal = false;
    this.selectedClassForRounds = null;
  }
  
  // Update total amount when session count changes
  updateRoundTotalAmount(): void {
    if (this.selectedClassForRounds) {
      this.roundSelection.totalAmount = this.roundSelection.sessionCount * this.roundSelection.sessionPrice;
    }
  }
  
  // Confirm round selection and proceed
  confirmRoundSelection(): void {
    if (!this.selectedClassForRounds || !this.roundSelection.sessionCount || this.roundSelection.sessionCount <= 0) {
      Swal.fire('خطأ', 'يرجى تحديد عدد جلسات صحيح', 'error');
      return;
    }
    
    this.closeRoundSelectionModal();
    this.enrollStudentToSelectedClasses();
  }
  
  enrollStudentToSelectedClasses(): void {
    if (!this.student || this.selectedClasses.length === 0) return;
    
    const classIds = this.selectedClasses.map(c => c._id || c.id);
    const studentId = this.getStudentId();
    
    Swal.fire({
      title: 'تأكيد التسجيل',
      html: `
        <p>هل تريد تسجيل الطالب في ${this.selectedClasses.length} حصة؟</p>
        <p><strong>الإجمالي:</strong> ${this.calculateMonthlyTotal().toLocaleString()} د.ج</p>
        <div class="text-start">
          ${this.selectedClasses.map(cls => 
            `<div class="mb-1">• ${cls.name} - ${cls.price.toLocaleString()} د.ج - 
              <span class="badge ${cls.paymentSystem === 'monthly' ? 'bg-info' : 'bg-warning'}">
                ${cls.paymentSystem === 'monthly' ? 'شهري' : 'جولات'}
              </span>
            </div>`
          ).join('')}
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'نعم، سجل الآن',
      cancelButtonText: 'إلغاء',
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33'
    }).then((result) => {
      if (result.isConfirmed) {
        const validClassIds = classIds.filter(id => id !== undefined && id !== null) as string[];
        this.enrollStudentMultiple(studentId, validClassIds);
      }
    });
  }
  
  enrollStudentMultiple(studentId: string, classIds: string[]): void {
    this.isEnrolling = true;
    
    // Prepare round settings if there's a class with rounds
    const roundSettings = this.selectedClassForRounds ? {
      sessionCount: this.roundSelection.sessionCount,
      sessionDuration: 2,
      breakBetweenSessions: 0
    } : undefined;
    
    this.http.post<any>(`${this.apiUrl}/students/${studentId}/enroll-multiple`, 
      { classIds, roundSettings }, 
      { headers: this.getHeaders() }
    ).subscribe({
      next: (response) => {
        Swal.fire({
          icon: 'success',
          title: 'تم التسجيل بنجاح',
          html: `
            <p>تم تسجيل الطالب في ${response.results?.successful?.length || response.successful?.length || 0} حصة بنجاح</p>
            ${response.summary?.paymentSystemsCreated ? 
              `<p class="text-success">تم إنشاء ${response.summary.paymentSystemsCreated} نظام دفع تلقائياً</p>` : 
              ''}
          `,
          timer: 3000,
          showConfirmButton: false
        });
        
        // Update data
        this.loadStudentClasses(this.route.snapshot.paramMap.get('id') || '');
        this.loadStudentPaymentSystems(this.route.snapshot.paramMap.get('id') || '');
        this.closeAddToLessonsModal();
        this.isEnrolling = false;
      },
      error: (error) => {
        console.error('Error enrolling student:', error);
        Swal.fire('خطأ', 'فشل في تسجيل الطالب في الحصص', 'error');
        this.isEnrolling = false;
      }
    });
  }

  // ===== Payment System Management =====
  payLatePayment(payment: MonthlyPayment): void {
    Swal.fire({
      title: 'تسديد دفعة متأخرة',
      html: `
        <div class="text-start">
          <p>المبلغ: ${payment.amount.toLocaleString()} د.ج</p>
          ${payment.month ? `<p>الشهر: ${payment.month}</p>` : ''}
          ${payment.dueDate ? `<p>تاريخ الاستحقاق: ${new Date(payment.dueDate).toLocaleDateString('ar-EG')}</p>` : ''}
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'تسديد الآن',
      cancelButtonText: 'إلغاء',
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      input: 'select',
      inputOptions: {
        'cash': 'نقداً',
        'bank': 'تحويل بنكي',
        'card': 'بطاقة ائتمان',
        'online': 'دفع إلكتروني'
      },
      inputPlaceholder: 'اختر طريقة الدفع'
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        const paymentData = {
          paymentMethod: result.value,
          paymentDate: new Date().toISOString(),
          notes: 'تم تسديد دفعة متأخرة'
        };

        Swal.fire({
          title: 'جاري التسديد...',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        if (payment._id) {
          this.http.put<any>(`${this.apiUrl}/payments/${payment._id}/pay`, paymentData, {
            headers: this.getHeaders()
          }).subscribe({
            next: (response) => {
              Swal.fire({
                icon: 'success',
                title: 'نجاح',
                text: 'تم تسديد الدفعة المتأخرة بنجاح',
                timer: 1500,
                showConfirmButton: false
              });

              const routeId = this.route.snapshot.paramMap.get('id');
              if (routeId) {
                this.loadStudentPaymentSystems(routeId);
              }
            },
            error: (error) => {
              console.error('Error paying late payment:', error);
              Swal.fire('خطأ', 'فشل في تسديد الدفعة المتأخرة', 'error');
            }
          });
        }
      }
    });
  }

  // Pay round
  payRound(round: RoundPayment): void {
    Swal.fire({
      title: 'دفع الجولة',
      html: `
        <div class="text-start">
          <p>رقم الجولة: ${round.roundNumber}</p>
          <p>المبلغ: ${round.totalAmount.toLocaleString()} د.ج</p>
          <p>عدد الجلسات: ${round.sessionCount}</p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'دفع',
      cancelButtonText: 'إلغاء',
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      input: 'select',
      inputOptions: {
        'cash': 'نقداً',
        'bank': 'تحويل بنكي',
        'card': 'بطاقة ائتمان',
        'online': 'دفع إلكتروني'
      },
      inputPlaceholder: 'اختر طريقة الدفع'
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        const paymentData = {
          paymentMethod: result.value,
          paymentDate: new Date().toISOString(),
          notes: `دفع جولة ${round.roundNumber}`
        };

        Swal.fire({
          title: 'جاري الدفع...',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        const roundId = round._id || round.id;
        if (roundId) {
          this.http.put<any>(`${this.apiUrl}/payment-systems/rounds/${roundId}/pay`, paymentData, {
            headers: this.getHeaders()
          }).subscribe({
            next: (response) => {
              Swal.fire({
                icon: 'success',
                title: 'تم الدفع بنجاح',
                text: `تم دفع الجولة ${round.roundNumber} بقيمة ${round.totalAmount.toLocaleString()} د.ج`,
                timer: 1500,
                showConfirmButton: false
              });
              
              // Update data
              const routeId = this.route.snapshot.paramMap.get('id');
              if (routeId) {
                this.loadStudentPaymentSystems(routeId);
              }
            },
            error: (error) => {
              console.error('Error paying round:', error);
              Swal.fire('خطأ', 'فشل في دفع الجولة', 'error');
            }
          });
        }
      }
    });
  }

  // View round details
  viewRoundDetails(round: RoundPayment): void {
    let sessionsHTML = '<div class="table-responsive"><table class="table table-sm">';
    sessionsHTML += '<thead><tr><th>#</th><th>التاريخ</th><th>السعر</th><th>الحالة</th></tr></thead><tbody>';
    
    (round.sessions || []).forEach(session => {
      sessionsHTML += `
        <tr>
          <td>${session.sessionNumber}</td>
          <td>${new Date(session.date).toLocaleDateString('ar-EG')}</td>
          <td>${session.price} د.ج</td>
          <td><span class="badge ${session.status === 'completed' ? 'bg-success' : 'bg-warning'}">
            ${session.status === 'completed' ? 'مكتملة' : 'معلقة'}
          </span></td>
        </tr>
      `;
    });
    
    sessionsHTML += '</tbody></table></div>';

    Swal.fire({
      title: `تفاصيل الجولة ${round.roundNumber}`,
      html: `
        <div class="text-start">
          <p><strong>رقم الجولة:</strong> ${round.roundNumber}</p>
          <p><strong>عدد الجلسات:</strong> ${round.sessionCount}</p>
          <p><strong>سعر الجلسة:</strong> ${round.sessionPrice.toLocaleString()} د.ج</p>
          <p><strong>المجموع الكلي:</strong> ${round.totalAmount.toLocaleString()} د.ج</p>
          <p><strong>تاريخ البدء:</strong> ${new Date(round.startDate).toLocaleDateString('ar-EG')}</p>
          <p><strong>تاريخ الانتهاء:</strong> ${new Date(round.endDate).toLocaleDateString('ar-EG')}</p>
          <p><strong>الحالة:</strong> <span class="${round.statusClass}">${round.statusText}</span></p>
          <hr>
          <h6>تفاصيل الجلسات:</h6>
          ${sessionsHTML}
        </div>
      `,
      icon: 'info',
      showCancelButton: false,
      confirmButtonText: 'حسناً'
    });
  }

  // ===== Helper Methods =====
  getPaymentMethodLabel(value: string): string {
    const method = this.paymentMethods.find(m => m.value === value);
    return method ? method.label : value;
  }

  getAcademicYearName(code: string): string {
    const year = this.academicYears.find(y => y.value === code);
    return year ? year.label : code;
  }

  calculateAge(birthDate: string | undefined): number {
    if (!birthDate) return 0;
    
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }

  getStudentClassesNames(): string {
    if (this.studentClasses.length === 0) return 'لا توجد حصص مسجلة';
    
    const classNames = this.studentClasses.map(c => c.name);
    return classNames.join('، ');
  }

  getTotalPaid(): number {
    return this.paymentHistory
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + p.amount, 0);
  }

  getTotalPending(): number {
    return this.paymentHistory
      .filter(p => p.status === 'pending' || p.status === 'late')
      .reduce((sum, p) => sum + p.amount, 0);
  }

  getCurrentMonth(): string {
    const currentDate = new Date();
    const monthIndex = currentDate.getMonth();
    const year = currentDate.getFullYear();
    return `${this.months[monthIndex]} ${year}`;
  }

  // Check if there are rounds classes
  hasRoundsClasses(): boolean {
    return this.selectedClasses.some(c => c.paymentSystem === 'rounds');
  }

  // Generate month options for 3 years
  generateMonthOptions(): string[] {
    const options: string[] = [];
    const currentDate = new Date();
    
    for (let yearOffset = 0; yearOffset < 3; yearOffset++) {
      const year = currentDate.getFullYear() + yearOffset;
      
      for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
        const monthName = this.months[monthIndex];
        options.push(`${monthName} ${year}`);
      }
    }
    
    return options;
  }

  // Get payment status class
  getPaymentStatusClass(payment: Payment): string {
    if (payment.isLate) {
      return 'badge bg-danger';
    }
    
    switch(payment.status) {
      case 'paid': return 'badge bg-success';
      case 'pending': return 'badge bg-warning';
      case 'late': return 'badge bg-danger';
      default: return 'badge bg-secondary';
    }
  }

  // Get payment status text
  getPaymentStatusText(payment: Payment): string {
    if (payment.isLate) {
      return 'متأخر';
    }
    
    switch(payment.status) {
      case 'paid': return 'مدفوع';
      case 'pending': return 'معلق';
      case 'late': return 'متأخر';
      default: return 'غير محدد';
    }
  }

  // Print receipt
  printPaymentReceipt(payment: Payment): void {
    const receiptContent = `
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>إيصال الدفع</title>
        <style>
          body { font-family: 'Arial', sans-serif; padding: 20px; }
          .receipt { max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
          .details { margin-bottom: 20px; }
          .detail-row { display: flex; justify-content: space-between; margin-bottom: 10px; padding: 5px 0; border-bottom: 1px solid #eee; }
          .total { font-size: 24px; font-weight: bold; text-align: center; margin: 20px 0; padding: 20px; background: #f8f9fa; }
          .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
          .signature { margin-top: 50px; display: flex; justify-content: space-between; }
          .signature-line { width: 200px; border-top: 1px solid #333; text-align: center; padding-top: 10px; }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <h2>إيصال دفع</h2>
            <p>رقم الإيصال: ${payment.invoiceNumber || 'غير محدد'}</p>
            <p>التاريخ: ${payment.formattedDate || new Date().toLocaleDateString('ar-EG')}</p>
          </div>
          
          <div class="details">
            <div class="detail-row">
              <span>اسم الطالب:</span>
              <span>${payment.studentName || this.student?.name}</span>
            </div>
            <div class="detail-row">
              <span>رقم الطالب:</span>
              <span>${payment.studentId || this.student?.studentId}</span>
            </div>
            ${payment.className ? `
            <div class="detail-row">
              <span>الحصة:</span>
              <span>${payment.className}</span>
            </div>
            ` : ''}
            <div class="detail-row">
              <span>الشهر:</span>
              <span>${payment.month}</span>
            </div>
            <div class="detail-row">
              <span>طريقة الدفع:</span>
              <span>${this.getPaymentMethodLabel(payment.paymentMethod)}</span>
            </div>
          </div>
          
          <div class="total">
            المبلغ: ${payment.amount.toLocaleString()} د.ج
          </div>
          
          <div class="signature">
            <div class="signature-line">توقيع المسؤول</div>
            <div class="signature-line">توقيع ولي الأمر</div>
          </div>
          
          <div class="footer">
            <p>شكراً لثقتكم بنا</p>
            <p>هذا الإيصال وثيقة رسمية</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(receiptContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }
  }

  // Print student report
  printStudentReport(): void {
    if (!this.student) return;

    try {
      Swal.fire({
        title: 'جاري إنشاء التقرير...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const totalPaid = this.getTotalPaid();

      const reportData = {
        student: this.student,
        classes: this.studentClasses,
        payments: this.paymentHistory,
        totalPaid: totalPaid,
        date: new Date().toLocaleDateString('ar-EG')
      };

      const printContent = this.generateReportHTML(reportData);
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      }

      Swal.fire('نجاح', 'تم إنشاء التقرير بنجاح', 'success');
    } catch (error) {
      console.error('Error printing report:', error);
      Swal.fire('خطأ', 'حدث خطأ أثناء إنشاء التقرير', 'error');
    }
  }

  // Generate report HTML
  private generateReportHTML(data: any): string {
    return `
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>تقرير الطالب</title>
        <style>
          body { font-family: 'Arial', sans-serif; padding: 20px; }
          .report { max-width: 800px; margin: 0 auto; }
          .header { text-align: center; margin-bottom: 30px; }
          .header h1 { color: #333; margin-bottom: 10px; }
          .student-info { background: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
          .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
          .section { margin-bottom: 30px; }
          .section h2 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 5px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { padding: 10px; text-align: right; border: 1px solid #ddd; }
          th { background-color: #3498db; color: white; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          .total { font-weight: bold; color: #2ecc71; font-size: 18px; }
          .footer { margin-top: 30px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="report">
          <div class="header">
            <h1>تقرير الطالب</h1>
            <p>التاريخ: ${data.date}</p>
          </div>
          
          <div class="student-info">
            <div class="info-grid">
              <div><strong>اسم الطالب:</strong> ${data.student.name}</div>
              <div><strong>رقم الطالب:</strong> ${data.student.studentId}</div>
              <div><strong>المستوى الدراسي:</strong> ${this.getAcademicYearName(data.student.academicYear)}</div>
              <div><strong>تاريخ التسجيل:</strong> ${new Date(data.student.registrationDate).toLocaleDateString('ar-EG')}</div>
              <div><strong>ولي الأمر:</strong> ${data.student.parentName}</div>
              <div><strong>هاتف ولي الأمر:</strong> ${data.student.parentPhone}</div>
            </div>
          </div>
          
          <div class="section">
            <h2>الحصص المسجلة</h2>
            <table>
              <thead>
                <tr>
                  <th>اسم الحصة</th>
                  <th>المادة</th>
                  <th>المعلم</th>
                  <th>السعر الشهري</th>
                </tr>
              </thead>
              <tbody>
                ${data.classes.map((cls: any) => `
                  <tr>
                    <td>${cls.name}</td>
                    <td>${cls.subject}</td>
                    <td>${cls.teacher?.name || 'غير محدد'}</td>
                    <td>${cls.price ? cls.price.toLocaleString() + ' د.ج' : 'غير محدد'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          
          <div class="section">
            <h2>سجل المدفوعات</h2>
            <table>
              <thead>
                <tr>
                  <th>التاريخ</th>
                  <th>المبلغ</th>
                  <th>الشهر</th>
                  <th>طريقة الدفع</th>
                  <th>الحالة</th>
                </tr>
              </thead>
              <tbody>
                ${data.payments.map((payment: any) => `
                  <tr>
                    <td>${payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString('ar-EG') : 'لم يتم الدفع'}</td>
                    <td>${payment.amount.toLocaleString()} د.ج</td>
                    <td>${payment.month}</td>
                    <td>${this.getPaymentMethodLabel(payment.paymentMethod)}</td>
                    <td>${this.getPaymentStatusText(payment)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <p class="total">الإجمالي المدفوع: ${data.totalPaid.toLocaleString()} د.ج</p>
          </div>
          
          <div class="footer">
            <p>تم إنشاء التقرير تلقائياً من نظام إدارة المدرسة</p>
            <p>© ${new Date().getFullYear()} جميع الحقوق محفوظة</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}