import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { StudentsService, Student } from '../services/students.service';
import { PaymentsService } from '../services/payments.service';
import { ClassesService } from '../classes.service';
import { PrinterService, ReceiptData } from '../services/printer.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-student-details',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './student-details.component.html',
  styleUrls: ['./student-details.component.css']
})
export class StudentDetailsComponent implements OnInit {
  student: Student | null = null;
  loading: boolean = false;
  activeTab: string = 'info';
  studentClasses: any[] = [];
  paymentHistory: any[] = [];
  
  // Helper method to get student ID (handles both id and _id)
  private getStudentId(): string {
    if (!this.student) return '';
    
    // Check for id or _id
    if (this.student.id) return this.student.id;
    if ((this.student as any)._id) return (this.student as any)._id;
    
    // Fallback to studentId if no id/_id exists
    return this.student.studentId || '';
  }
  
  // Payment Modal Variables
  showPaymentModal: boolean = false;
  showEditPaymentModal: boolean = false;
  showDeleteConfirmModal: boolean = false;
  
  // Payment Form
  newPayment: any = {
    studentId: '',
    amount: 0,
    month: '',
    paymentMethod: 'cash',
    notes: ''
  };
  
  // Edit Payment
  editingPayment: any = null;
  
  // Delete Confirmation
  paymentToDelete: any = null;
  
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



  // lessons
  showAddToLessonsModal: boolean = false;
availableClasses: any[] = [];
filteredAvailableClasses: any[] = [];
alreadyEnrolledClasses: any[] = [];
selectedClasses: any[] = [];
loadingAvailableClasses: boolean = false;
isEnrolling: boolean = false;

// Filter properties
filterSubject: string = '';
filterLevel: string = '';

// Subjects list
subjects = [
  'رياضيات', 'فيزياء', 'علوم', 'لغة عربية', 
  'لغة فرنسية', 'لغة انجليزية', 'تاريخ', 
  'جغرافيا', 'فلسفة', 'إعلام آلي'
];



  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private studentsService: StudentsService,
    private paymentsService: PaymentsService,
    private classesService: ClassesService,
    private printerService: PrinterService
  ) {}

  ngOnInit(): void {
    this.loadStudentDetails();
  }

  loadStudentDetails(): void {
    const studentId = this.route.snapshot.paramMap.get('id');
    if (!studentId) {
      this.router.navigate(['/home/students-management']);
      return;
    }

    this.loading = true;
    this.studentsService.getStudentById(studentId).subscribe({
      next: (student) => {
        this.student = student;
        // Use the helper method to get the correct ID
        this.newPayment.studentId = this.getStudentId();
        this.loadStudentClasses(studentId);
        this.loadPaymentHistory(studentId);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading student details:', error);
        Swal.fire('خطأ', 'فشل في تحميل بيانات الطالب', 'error');
        this.router.navigate(['/home/students-management']);
      }
    });
  }

  loadStudentClasses(studentId: string): void {
    this.studentsService.getStudentClasses(studentId).subscribe({
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
    this.paymentsService.getStudentPayments(studentId).subscribe({
      next: (payments) => {
        this.paymentHistory = payments;
      },
      error: (error) => {
        console.error('Error loading payment history:', error);
        this.paymentHistory = [];
      }
    });
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  goBack(): void {
    this.router.navigate(['/home/students-management']);
  }

  // ===== Payment Management Methods =====

  openAddPaymentModal(): void {
    if (!this.student) return;
    
    this.newPayment = {
      studentId: this.getStudentId(),
      amount: 0,
      month: this.getCurrentMonth(),
      paymentMethod: 'cash',
      notes: ''
    };
    this.showPaymentModal = true;
  }

  closePaymentModal(): void {
    this.showPaymentModal = false;
    this.newPayment = {
      studentId: '',
      amount: 0,
      month: '',
      paymentMethod: 'cash',
      notes: ''
    };
  }

  openEditPaymentModal(payment: any): void {
    this.editingPayment = { ...payment };
    this.showEditPaymentModal = true;
  }

  closeEditPaymentModal(): void {
    this.showEditPaymentModal = false;
    this.editingPayment = null;
  }

  openDeleteConfirmModal(payment: any): void {
    this.paymentToDelete = payment;
    this.showDeleteConfirmModal = true;
  }

  closeDeleteConfirmModal(): void {
    this.showDeleteConfirmModal = false;
    this.paymentToDelete = null;
  }

  addPayment(): void {
    if (!this.student) return;

    if (!this.newPayment.amount || this.newPayment.amount <= 0) {
      Swal.fire('خطأ', 'يرجى إدخال مبلغ صحيح', 'error');
      return;
    }

    if (!this.newPayment.month) {
      Swal.fire('خطأ', 'يرجى اختيار الشهر', 'error');
      return;
    }

    const paymentData = {
      ...this.newPayment,
      studentName: this.student.name,
      studentId: this.getStudentId(),
      status: 'paid',
      paymentDate: new Date().toISOString()
    };

    Swal.fire({
      title: 'جاري تسجيل الدفعة...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    this.paymentsService.recordPayment(paymentData).subscribe({
      next: (response) => {
        Swal.fire({
          icon: 'success',
          title: 'نجاح',
          text: 'تم تسجيل الدفعة بنجاح',
          timer: 1500,
          showConfirmButton: false
        });

        this.closePaymentModal();
        // Use the route ID to reload payment history
        const routeId = this.route.snapshot.paramMap.get('id');
        if (routeId) {
          this.loadPaymentHistory(routeId);
        }
        
        // Update student's payment status
        if (this.student) {
          this.student.hasPaidRegistration = true;
        }
      },
      error: (error) => {
        console.error('Error recording payment:', error);
        Swal.fire('خطأ', 'فشل في تسجيل الدفعة', 'error');
      }
    });
  }

  updatePayment(): void {
    if (!this.editingPayment || !this.student) return;

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

    this.paymentsService.updatePayment(this.editingPayment.id, this.editingPayment).subscribe({
      next: (response) => {
        Swal.fire({
          icon: 'success',
          title: 'نجاح',
          text: 'تم تحديث الدفعة بنجاح',
          timer: 1500,
          showConfirmButton: false
        });

        this.closeEditPaymentModal();
        // Use the route ID to reload payment history
        const routeId = this.route.snapshot.paramMap.get('id');
        if (routeId) {
          this.loadPaymentHistory(routeId);
        }
      },
      error: (error) => {
        console.error('Error updating payment:', error);
        Swal.fire('خطأ', 'فشل في تحديث الدفعة', 'error');
      }
    });
  }

  deletePayment(): void {
    if (!this.paymentToDelete || !this.student) return;

    Swal.fire({
      title: 'جاري حذف الدفعة...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    this.paymentsService.deletePayment(this.paymentToDelete.id).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'نجاح',
          text: 'تم حذف الدفعة بنجاح',
          timer: 1500,
          showConfirmButton: false
        });

        this.closeDeleteConfirmModal();
        // Use the route ID to reload payment history
        const routeId = this.route.snapshot.paramMap.get('id');
        if (routeId) {
          this.loadPaymentHistory(routeId);
        }
      },
      error: (error) => {
        console.error('Error deleting payment:', error);
        Swal.fire('خطأ', 'فشل في حذف الدفعة', 'error');
      }
    });
  }

  // ===== Print Receipt Methods =====

  async printPaymentReceipt(payment: any): Promise<void> {
    if (!this.student) return;

    try {
      Swal.fire({
        title: 'جاري التحضير للطباعة...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const receiptData: ReceiptData = {
        receiptNumber: `PAY-${payment.id || Date.now().toString().slice(-8)}`,
        date: new Date(payment.paymentDate).toLocaleDateString('ar-EG'),
        time: new Date(payment.paymentDate).toLocaleTimeString('ar-EG', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        studentName: this.student.name,
        studentId: this.student.studentId, // Use studentId (university ID)
        className: this.getStudentClassesNames(),
        month: payment.month,
        amount: payment.amount,
        paymentMethod: payment.paymentMethod,
        academicYear: this.getAcademicYearName(this.student.academicYear),
        parentPhone: this.student.parentPhone || '',
        notes: payment.notes || 'تم سداد القسط الشهري بنجاح. نتمنى للطالب التوفيق والنجاح.'
      };

      const success = await this.printerService.printMonthlyPaymentReceipt(receiptData);
      
      if (!success) {
        Swal.fire('تحذير', 'فشل في الاتصال بالطابعة', 'warning');
      }
    } catch (error) {
      console.error('Error printing receipt:', error);
      Swal.fire('خطأ', 'حدث خطأ أثناء الطباعة', 'error');
    }
  }

  async printStudentReport(): Promise<void> {
    if (!this.student) return;

    try {
      Swal.fire({
        title: 'جاري إنشاء التقرير...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      // Calculate total payments
      const totalPaid = this.paymentHistory
        .filter(p => p.status === 'paid')
        .reduce((sum, p) => sum + p.amount, 0);

      // Mock attendance data (you should replace this with actual data)
      const attendanceData = {
        attendanceRate: 85,
        present: 17,
        absent: 3,
        late: 2
      };

      const paymentData = {
        totalPaid: totalPaid,
        pending: this.calculatePendingAmount(totalPaid)
      };

      const studentData = {
        name: this.student.name,
        studentId: this.student.studentId, // Use studentId (university ID)
        academicYear: this.student.academicYear,
        parentPhone: this.student.parentPhone
      };

      const success = await this.printerService.printStudentMonthlyReport(
        studentData,
        attendanceData,
        paymentData
      );

      if (!success) {
        Swal.fire('تحذير', 'فشل في الاتصال بالطابعة', 'warning');
      }
    } catch (error) {
      console.error('Error printing report:', error);
      Swal.fire('خطأ', 'حدث خطأ أثناء إنشاء التقرير', 'error');
    }
  }

  // ===== Helper Methods =====

  getCurrentMonth(): string {
    const currentDate = new Date();
    const monthIndex = currentDate.getMonth();
    return this.months[monthIndex];
  }

  getPaymentMethodLabel(value: string): string {
    const method = this.paymentMethods.find(m => m.value === value);
    return method ? method.label : value;
  }

  getAcademicYearName(code: string): string {
    const year = this.academicYears.find(y => y.value === code);
    return year ? year.label : code;
  }

  getPaymentStatus(student: Student): string {
    return student.hasPaidRegistration ? 'مدفوع' : 'غير مدفوع';
  }

  getPaymentStatusClass(student: Student): string {
    return student.hasPaidRegistration ? 'status-paid' : 'status-unpaid';
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

  calculatePendingAmount(totalPaid: number): number {
    // You should implement your own logic here based on your pricing system
    const monthlyFee = 5000; // Example monthly fee
    const monthsCount = this.paymentHistory.length;
    const expectedTotal = monthsCount * monthlyFee;
    
    return Math.max(0, expectedTotal - totalPaid);
  }

  // Action buttons
  editStudent(): void {
    if (this.student) {
      // Use the helper method to get the correct ID for editing
      const studentId = this.getStudentId();
      if (studentId) {
        this.router.navigate([`/home/students-management/edit/${studentId}`]);
      } else {
        // Fallback to route ID
        const routeId = this.route.snapshot.paramMap.get('id');
        if (routeId) {
          this.router.navigate([`/home/students-management/edit/${routeId}`]);
        }
      }
    }
  }

  // Payment summary
  getTotalPaid(): number {
    return this.paymentHistory
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + p.amount, 0);
  }

  getTotalPending(): number {
    return this.paymentHistory
      .filter(p => p.status !== 'paid')
      .reduce((sum, p) => sum + p.amount, 0);
  }

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
  }
  
  // Add this method to load available classes
  loadAvailableClasses(): void {
    if (!this.student) return;
    
    this.loadingAvailableClasses = true;
    
    this.classesService.getAvailableClasses().subscribe({
      next: (classes) => {
        this.availableClasses = classes;
        
        // Get already enrolled classes
        this.alreadyEnrolledClasses = this.studentClasses;
        
        // Filter out already enrolled classes
        const enrolledClassIds = this.alreadyEnrolledClasses.map(c => c._id);
        this.availableClasses = classes.filter(c => 
          !enrolledClassIds.includes(c._id)
        );
        
        // Apply initial filter
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
  
  // Filter classes based on selected criteria
  filterAvailableClasses(): void {
    this.filteredAvailableClasses = this.availableClasses.filter(cls => {
      // Filter by subject
      if (this.filterSubject && cls.subject !== this.filterSubject) {
        return false;
      }
      
      // Filter by level
      if (this.filterLevel && cls.academicYear !== this.filterLevel) {
        return false;
      }
      
      return true;
    });
  }
  
  // Check if class level is compatible with student level
  isLevelCompatible(classObj: any): boolean {
    if (!this.student || !classObj.academicYear) return true;
    
    // If class has no level specified or is "NS" (Not Specified), it's compatible
    if (!classObj.academicYear || classObj.academicYear === 'NS' || 
        classObj.academicYear === 'غير محدد') {
      return true;
    }
    
    return classObj.academicYear === this.student.academicYear;
  }
  
  // Toggle class selection
  toggleClassSelection(classObj: any): void {
    const index = this.selectedClasses.findIndex(c => c._id === classObj._id);
    
    if (index > -1) {
      // Remove from selected
      this.selectedClasses.splice(index, 1);
    } else {
      // Add to selected
      this.selectedClasses.push(classObj);
    }
  }
  
  // Check if class is selected
  isClassSelected(classId: string): boolean {
    return this.selectedClasses.some(c => c._id === classId);
  }
  
  // Calculate monthly total for selected classes
  calculateMonthlyTotal(): number {
    return this.selectedClasses.reduce((total, cls) => total + (cls.price || 0), 0);
  }
  
  // Enroll student to selected classes
  enrollStudentToSelectedClasses(): void {
    if (!this.student || this.selectedClasses.length === 0) return;
    
    const classIds = this.selectedClasses.map(c => c._id);
    const studentId = this.getStudentId();
    
    Swal.fire({
      title: 'تأكيد التسجيل',
      html: `
        <p>هل تريد تسجيل الطالب في ${this.selectedClasses.length} حصة؟</p>
        <p><strong>الإجمالي الشهري:</strong> ${this.calculateMonthlyTotal().toLocaleString()} د.ج</p>
        <div class="text-start">
          ${this.selectedClasses.map(cls => 
            `<div class="mb-1">• ${cls.name} - ${cls.price.toLocaleString()} د.ج/شهر</div>`
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
        this.enrollStudent(studentId, classIds);
      }
    });
  }
  
  // Enroll student to multiple classes
  enrollStudent(studentId: string, classIds: string[]): void {
    this.isEnrolling = true;
    
    this.studentsService.enrollStudentMultiple(studentId, { classIds }).subscribe({
      next: (response) => {
        Swal.fire({
          icon: 'success',
          title: 'تم التسجيل بنجاح',
          html: `
            <p>تم تسجيل الطالب في ${response.results.successful.length} حصة بنجاح</p>
            ${response.results.failed.length > 0 ? 
              `<p class="text-warning">فشل التسجيل في ${response.results.failed.length} حصة</p>` : 
              ''}
          `,
          timer: 3000,
          showConfirmButton: false
        });
        
        // Refresh data
        this.loadStudentClasses(this.route.snapshot.paramMap.get('id') || '');
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
  
  // Update the existing loadStudentClasses method to use the correct ID
  // (This should already exist in your code)
// Helper method to get academic year name

  
}