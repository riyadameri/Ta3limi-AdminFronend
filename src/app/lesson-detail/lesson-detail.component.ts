import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-lesson-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './lesson-detail.component.html',
  styleUrls: ['./lesson-detail.component.css']
})
export class LessonDetailComponent implements OnInit, OnDestroy {
  // Basic lesson info
  lessonId: string = '';
  lesson: any = null;
  
  // Students in this lesson
  students: any[] = [];
  filteredStudents: any[] = [];
  
  // Payments data
  payments: any[] = [];
  monthlyPayments: any[] = [];
  roundPayments: any[] = [];
  
  // Calculated values for template
  paidPaymentsCount: number = 0;
  pendingPaymentsCount: number = 0;
  
  // Selected month filter
  selectedMonth: string = '';
  availableMonths: string[] = [];
  
  // UI states
  isLoading: boolean = true;
  viewMode: 'details' | 'payments' | 'attendance' = 'details';
  selectedStudent: any = null;
  selectedPayment: any = null;
  
  // Payment form
  paymentForm: any = {
    amount: 0,
    paymentMethod: 'cash',
    notes: '',
    paymentDate: new Date().toISOString().split('T')[0]
  };
  
  // Search filter
  searchTerm: string = '';
  
  // Months array for dropdown
  monthOptions: { value: string; label: string }[] = [];
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.lessonId = this.route.snapshot.paramMap.get('lessonId') || '';
    
    console.log('Lesson ID:', this.lessonId); // Debug log
    
    if (this.lessonId) {
      // Test the connection first
    } else {
      alert('معرف الحصة غير صالح');
      this.router.navigate(['/home/lesson-management']);
    }
  }
  

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  
  // Generate month options for dropdown
  generateMonthOptions(): void {
    const months: { value: string; label: string }[] = [];
    const today = new Date();
    
    // Add past 12 months
    for (let i = 12; i >= 1; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthStr = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' });
      months.push({ value: monthStr, label: monthName });
    }
    
    // Add current month
    const currentMonthStr = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}`;
    const currentMonthName = today.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' });
    months.push({ value: currentMonthStr, label: currentMonthName });
    
    // Add next 3 months
    for (let i = 1; i <= 3; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() + i, 1);
      const monthStr = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' });
      months.push({ value: monthStr, label: monthName });
    }
    
    this.monthOptions = months;
    
    // Set default to current month
    this.selectedMonth = currentMonthStr;
  }

  loadLessonDetails(): void {
    this.isLoading = true;
    
    // Load lesson basic info
    this.http.get<any>(`/api/classes/${this.lessonId}`).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.lesson = response.data;
          this.loadStudents();
        } else {
          console.error('Invalid response format:', response);
          alert('فشل في تحميل تفاصيل الحصة: استجابة غير صالحة');
          this.isLoading = false;
        }
      },
      error: (error) => {
        console.error('Error loading lesson:', error);
        
        // Try to get more specific error message
        let errorMessage = 'فشل في تحميل تفاصيل الحصة';
        if (error.error && error.error.error) {
          errorMessage += `: ${error.error.error}`;
        } else if (error.message) {
          errorMessage += `: ${error.message}`;
        }
        
        alert(errorMessage);
        this.isLoading = false;
      }
    });
  }
  
  loadStudents(): void {
    this.http.get<any>(`/api/classes/${this.lessonId}/students`).subscribe({
      next: (response) => {
        if (response.success) {
          this.students = response.data || [];
          this.filteredStudents = [...this.students];
          this.loadPayments();
        } else {
          console.error('Invalid response format:', response);
          this.students = [];
          this.filteredStudents = [];
          this.loadPayments();
        }
      },
      error: (error) => {
        console.error('Error loading students:', error);
        this.students = [];
        this.filteredStudents = [];
        this.loadPayments();
      }
    });
  }
  
  loadPayments(): void {
    this.http.get<any>(`/api/payments/class/${this.lessonId}`).subscribe({
      next: (response) => {
        this.payments = response.payments || [];
        
        // Separate monthly and round payments
        this.monthlyPayments = this.payments.filter((p: any) => 
          !p.month?.includes('جولة') && !p.notes?.includes('جولة')
        );
        
        this.roundPayments = this.payments.filter((p: any) => 
          p.month?.includes('جولة') || p.notes?.includes('جولة')
        );
        
        // Calculate counts
        this.paidPaymentsCount = this.payments.filter((p: any) => p.status === 'paid').length;
        this.pendingPaymentsCount = this.payments.filter((p: any) => 
          p.status === 'pending' || p.status === 'late'
        ).length;
        
        // Extract unique months from payments
        this.extractAvailableMonths();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading payments:', error);
        this.payments = [];
        this.monthlyPayments = [];
        this.roundPayments = [];
        this.paidPaymentsCount = 0;
        this.pendingPaymentsCount = 0;
        this.isLoading = false;
      }
    });
  }

  extractAvailableMonths(): void {
    const months = new Set<string>();
    
    this.monthlyPayments.forEach((payment: any) => {
      if (payment.monthCode) {
        months.add(payment.monthCode);
      }
    });
    
    this.availableMonths = Array.from(months).sort().reverse();
  }

  // Filter students by search term
  filterStudents(): void {
    if (!this.searchTerm.trim()) {
      this.filteredStudents = [...this.students];
      return;
    }
    
    const term = this.searchTerm.toLowerCase();
    this.filteredStudents = this.students.filter((student: any) =>
      student.name?.toLowerCase().includes(term) ||
      student.studentId?.toLowerCase().includes(term) ||
      student.parentPhone?.includes(term)
    );
  }

  // Get student payments for selected month
  getStudentPayments(studentId: string): any[] {
    if (!this.selectedMonth) return [];
    
    return this.payments.filter((payment: any) =>
      payment.student?._id === studentId &&
      payment.monthCode === this.selectedMonth
    );
  }

  // Get total paid amount for student in selected month
  getStudentTotalPaid(studentId: string): number {
    const studentPayments = this.getStudentPayments(studentId);
    return studentPayments
      .filter((p: any) => p.status === 'paid')
      .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
  }

  // Get pending amount for student in selected month
  getStudentPendingAmount(studentId: string): number {
    const studentPayments = this.getStudentPayments(studentId);
    return studentPayments
      .filter((p: any) => p.status === 'pending' || p.status === 'late')
      .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
  }

  // Check if student has payment for selected month
  hasPaymentForSelectedMonth(studentId: string): boolean {
    return this.getStudentPayments(studentId).length > 0;
  }

  // Select student for payment
  selectStudentForPayment(student: any): void {
    this.selectedStudent = student;
    
    // Find pending payments for this student
    const pendingPayments = this.getStudentPayments(student._id)
      .filter((p: any) => p.status === 'pending' || p.status === 'late');
    
    if (pendingPayments.length > 0) {
      this.selectedPayment = pendingPayments[0];
      this.paymentForm.amount = this.selectedPayment.amount || this.lesson?.price || 0;
    } else {
      this.selectedPayment = null;
      this.paymentForm.amount = this.lesson?.price || 0;
    }
    
    this.paymentForm.notes = `دفعة لحصة ${this.lesson?.name} لشهر ${this.getMonthName(this.selectedMonth)}`;
  }

  // Pay for student
  payForStudent(): void {
    if (!this.selectedStudent || !this.paymentForm.amount || this.paymentForm.amount <= 0) {
      alert('الرجاء تحديد طالب ومبلغ صحيح');
      return;
    }

    const paymentData = {
      studentId: this.selectedStudent._id,
      classId: this.lessonId,
      amount: this.paymentForm.amount,
      month: this.getMonthName(this.selectedMonth),
      monthCode: this.selectedMonth,
      paymentMethod: this.paymentForm.paymentMethod,
      notes: this.paymentForm.notes,
      paymentDate: this.paymentForm.paymentDate
    };

    this.isLoading = true;

    if (this.selectedPayment) {
      // Update existing payment
      this.http.put(`/api/payments/${this.selectedPayment._id}/pay`, paymentData).subscribe({
        next: (response: any) => {
          if (response.success) {
            alert(`تم دفع ${paymentData.amount} د.ج للطالب ${this.selectedStudent.name}`);
            this.resetPaymentForm();
            this.loadPayments();
          } else {
            alert('فشل في عملية الدفع');
            this.isLoading = false;
          }
        },
        error: (error) => {
          console.error('Payment error:', error);
          alert('حدث خطأ أثناء عملية الدفع');
          this.isLoading = false;
        }
      });
    } else {
      // Create new payment
      this.http.post('/api/payments', paymentData).subscribe({
        next: (response: any) => {
          if (response.success) {
            alert(`تم إنشاء دفعة جديدة بقيمة ${paymentData.amount} د.ج للطالب ${this.selectedStudent.name}`);
            this.resetPaymentForm();
            this.loadPayments();
          } else {
            alert('فشل في إنشاء الدفعة');
            this.isLoading = false;
          }
        },
        error: (error) => {
          console.error('Create payment error:', error);
          alert('حدث خطأ أثناء إنشاء الدفعة');
          this.isLoading = false;
        }
      });
    }
  }

  // Reset payment form
  resetPaymentForm(): void {
    this.selectedStudent = null;
    this.selectedPayment = null;
    this.paymentForm = {
      amount: 0,
      paymentMethod: 'cash',
      notes: '',
      paymentDate: new Date().toISOString().split('T')[0]
    };
  }

  // Format month name
  getMonthName(monthCode: string): string {
    if (!monthCode) return '';
    
    const [year, month] = monthCode.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' });
  }

  // Get payment status text
  getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'paid': 'مدفوع',
      'pending': 'معلق',
      'late': 'متأخر'
    };
    return statusMap[status] || status;
  }

  // Get payment status class
  getStatusClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'paid': 'status-paid',
      'pending': 'status-pending',
      'late': 'status-late'
    };
    return statusMap[status] || '';
  }

  // Get teacher name
  getTeacherName(teacher: any): string {
    if (!teacher) return 'غير معروف';
    
    if (typeof teacher === 'string') {
      return teacher;
    }
    
    return teacher?.name || 'غير معروف';
  }

  // Navigate back to lessons
  goBack(): void {
    this.router.navigate(['/home/lesson-management']);
  }

  // Change view mode
  setViewMode(mode: 'details' | 'payments' | 'attendance'): void {
    this.viewMode = mode;
  }

  // View student details
  viewStudentDetails(student: any): void {
    this.router.navigate(['/home/students-management', student._id]);
  }

  // Export payments to Excel
  exportPayments(): void {
    // Implementation for exporting payments to Excel
    alert('سيتم تنفيذ تصدير المدفوعات قريباً');
  }
}