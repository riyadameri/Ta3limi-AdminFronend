import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import Swal from 'sweetalert2';
import { environment } from '../../environments/environment.development';
import { PrinterService, ReceiptData, BulkReceiptData } from '../services/printer.service';

interface ClassPaymentGroup {
  classId: string;
  className: string;
  payments: Payment[];
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
}

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

interface BulkPaymentData {
  studentIds: string[];
  classId: string;
  amount: number;
  month: string;
  paymentMethod: string;
  notes?: string;
}

interface PaymentReceiptOption {
  label: string;
  value: 'single' | 'multiple';
  description: string;
  icon: string;
}

@Component({
  selector: 'app-student-details',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './student-details.component.html',
  styleUrls: ['./student-details.component.css']
})
export class StudentDetailsComponent implements OnInit {
  private apiUrl = environment.apiUrl;
  
  student: Student | null = null;
  loading: boolean = false;
  activeTab: string = 'info';
  studentClasses: any[] = [];
  paymentHistory: Payment[] = [];
  
  // Payment Modal Variables
  showPaymentModal: boolean = false;
  showEditPaymentModal: boolean = false;
  showDeleteConfirmModal: boolean = false;
  showBulkPaymentModal: boolean = false;
  showClassPaymentsModal: boolean = false;
  classPaymentGroups: ClassPaymentGroup[] = [];
  selectedPaymentsForBulkPay: Payment[] = [];
  showBulkPayConfirmation: boolean = false;
  
  // Payment group selection
  selectedMonthForGroupPay: string = '';
  selectedClassForGroupPay: string = 'all';

  // Payment Form
  newPayment: any = {
    student: '',
    amount: 0,
    month: '',
    paymentMethod: 'cash',
    notes: ''
  };
  
  // Bulk Payment Form
  bulkPayment: BulkPaymentData = {
    studentIds: [],
    classId: '',
    amount: 0,
    month: '',
    paymentMethod: 'cash',
    notes: 'دفعة جماعية'
  };
  
  // Edit Payment
  editingPayment: Payment | null = null;
  
  // Delete Confirmation
  paymentToDelete: Payment | null = null;
  
  // Class Payments View
  selectedClassForPayments: any = null;
  classPayments: Payment[] = [];
  
  // Multiple Students Selection
  allStudents: Student[] = [];
  selectedStudents: Student[] = [];
  filteredStudents: Student[] = [];
  studentSearchTerm: string = '';
  classForBulkPayment: Class | null = null;
  
  // Bulk Payment Processing
  isProcessingBulkPayment: boolean = false;
  bulkPaymentProgress: number = 0;
  bulkPaymentResults: any[] = [];
  
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

  // Payment receipt options
  receiptOptions: PaymentReceiptOption[] = [
    {
      label: 'إيصال واحد لجميع الدفعات',
      value: 'single',
      description: 'طباعة جميع الدفعات في إيصال واحد مع تفاصيل كل دفعة',
      icon: 'fas fa-receipt'
    },
    {
      label: 'إيصالات منفصلة لكل دفعة',
      value: 'multiple',
      description: 'طباعة إيصال منفصل لكل دفعة',
      icon: 'fas fa-copy'
    }
  ];

  selectedReceiptOption: 'single' | 'multiple' = 'single';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private printerService: PrinterService
  ) {}

  ngOnInit(): void {
    this.loadStudentDetails();
    this.loadAllStudents();
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

  loadAllStudents(): void {
    this.http.get<any>(`${this.apiUrl}/students`, {
      headers: this.getHeaders()
    }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.allStudents = response.data;
          this.filteredStudents = [...this.allStudents];
        } else {
          this.allStudents = [];
          this.filteredStudents = [];
        }
      },
      error: (error) => {
        console.error('Error loading all students:', error);
        this.allStudents = [];
        this.filteredStudents = [];
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
          this.classPaymentGroups = this.groupPaymentsByClass(response.payments);
          console.log(`Loaded ${this.paymentHistory.length} payments`);
        } else {
          this.paymentHistory = [];
          this.classPaymentGroups = [];
          console.log('No payments found or error in response');
        }
      },
      error: (error) => {
        console.error('Error loading payment history:', error);
        this.paymentHistory = [];
        this.classPaymentGroups = [];
        Swal.fire('خطأ', 'فشل في تحميل سجل المدفوعات', 'error');
      }
    });
  }

  private groupPaymentsByClass(payments: Payment[]): ClassPaymentGroup[] {
    const groups: { [key: string]: ClassPaymentGroup } = {};
    
    payments.forEach(payment => {
      const classId = payment.class?._id || payment.class || 'general';
      const className = payment.className || 'عام';
      
      if (!groups[classId]) {
        groups[classId] = {
          classId: classId,
          className: className,
          payments: [],
          totalAmount: 0,
          paidAmount: 0,
          pendingAmount: 0
        };
      }
      
      groups[classId].payments.push(payment);
      groups[classId].totalAmount += payment.amount;
      
      if (payment.status === 'paid') {
        groups[classId].paidAmount += payment.amount;
      } else {
        groups[classId].pendingAmount += payment.amount;
      }
    });
    
    return Object.values(groups);
  }

  toggleClassPaymentGroup(classId: string): void {
    const group = this.classPaymentGroups.find(g => g.classId === classId);
    if (group) {
      group['expanded'] = !group['expanded'];
    }
  }

  isClassGroupExpanded(classId: string): boolean {
    const group = this.classPaymentGroups.find(g => g.classId === classId);
    return group ? group['expanded'] || false : false;
  }

  async processBulkPaySelected(): Promise<void> {
    if (this.selectedPaymentsForBulkPay.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'لا توجد مدفوعات مختارة',
        text: 'يرجى اختيار مدفوعات للدفع أولاً',
        confirmButtonText: 'حسناً'
      });
      return;
    }

    // التحقق من أن جميع المدفوعات المختارة معلقة
    const hasPaidPayments = this.selectedPaymentsForBulkPay.some(p => p.status === 'paid');
    if (hasPaidPayments) {
      const unpaidPayments = this.selectedPaymentsForBulkPay.filter(p => p.status !== 'paid');
      const { value: proceed } = await Swal.fire({
        title: 'تحذير',
        html: `
          <div class="text-start">
            <p class="text-warning"><i class="fas fa-exclamation-triangle me-2"></i>بعض المدفوعات المختارة مدفوعة مسبقاً</p>
            <p><strong>المدفوعة:</strong> ${this.selectedPaymentsForBulkPay.length - unpaidPayments.length}</p>
            <p><strong>المعلقة:</strong> ${unpaidPayments.length}</p>
            <p>هل تريد المتابعة مع المدفوعات المعلقة فقط؟</p>
          </div>
        `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'نعم، متابعة',
        cancelButtonText: 'إلغاء',
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33'
      });

      if (!proceed) return;
      
      // تحديث القائمة لتشمل المدفوعات المعلقة فقط
      this.selectedPaymentsForBulkPay = unpaidPayments;
    }

    const totalAmount = this.getSelectedPaymentsTotal();
    const uniqueStudents = new Set(this.selectedPaymentsForBulkPay.map(p => 
      p.student?._id || p.student
    ));

    // عرض خيارات الدفع والطباعة
    const { value: userChoice } = await Swal.fire({
      title: 'خيارات الدفع الجماعي',
      html: `
        <div class="text-start">
          <div class="alert alert-info">
            <h6><i class="fas fa-info-circle me-2"></i>تفاصيل الدفع الجماعي</h6>
            <p class="mb-1"><strong>عدد المدفوعات:</strong> ${this.selectedPaymentsForBulkPay.length}</p>
            <p class="mb-1"><strong>عدد الطلاب:</strong> ${uniqueStudents.size}</p>
            <p class="mb-1"><strong>المبلغ الإجمالي:</strong> ${totalAmount.toLocaleString('ar-SA')} د.ج</p>
          </div>
          
          <div class="mb-3">
            <label class="form-label"><strong>طريقة الدفع:</strong></label>
            <select class="form-select" id="paymentMethod">
              <option value="cash">نقداً</option>
              <option value="bank">تحويل بنكي</option>
              <option value="card">بطاقة ائتمان</option>
              <option value="online">دفع إلكتروني</option>
              <option value="mobile">دفع محمول</option>
            </select>
          </div>
          
          <div class="mb-3">
            <label class="form-label"><strong>خيار الطباعة:</strong></label>
            <select class="form-select" id="printOption">
              <option value="single">إيصال واحد لجميع الدفعات</option>
              <option value="multiple">إيصالات منفصلة لكل دفعة</option>
            </select>
          </div>
          
          <div class="mb-3">
            <label class="form-label"><strong>ملاحظات:</strong></label>
            <textarea class="form-control" id="paymentNotes" rows="2" placeholder="ملاحظات حول الدفع..."></textarea>
          </div>
          
          <div class="alert alert-warning">
            <i class="fas fa-exclamation-circle me-2"></i>
            <small>سيتم دفع ${this.selectedPaymentsForBulkPay.length} دفعة بقيمة إجمالية ${totalAmount.toLocaleString('ar-SA')} د.ج</small>
          </div>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'دفع',
      cancelButtonText: 'إلغاء',
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      width: '600px',
      preConfirm: () => {
        const paymentMethod = (document.getElementById('paymentMethod') as HTMLSelectElement).value;
        const printOption = (document.getElementById('printOption') as HTMLSelectElement).value;
        const paymentNotes = (document.getElementById('paymentNotes') as HTMLTextAreaElement).value;
        
        if (!paymentMethod) {
          Swal.showValidationMessage('يرجى اختيار طريقة الدفع');
          return false;
        }
        
        return { paymentMethod, printOption, paymentNotes };
      }
    });

    if (!userChoice) return;

    const { paymentMethod, printOption, paymentNotes } = userChoice;

    // عرض نافذة التقدم
    Swal.fire({
      title: 'جاري معالجة الدفعات...',
      html: `
        <div class="text-center">
          <div class="spinner-border text-primary mb-3" style="width: 3rem; height: 3rem;" role="status">
            <span class="visually-hidden">جاري المعالجة...</span>
          </div>
          <h5 class="mb-2">دفع جماعي</h5>
          <p>جاري معالجة ${this.selectedPaymentsForBulkPay.length} دفعة...</p>
          
          <div class="progress mt-4" style="height: 25px; border-radius: 12px;">
            <div class="progress-bar progress-bar-striped progress-bar-animated bg-success" 
                 style="width: 0%; font-weight: bold; font-size: 14px;" 
                 id="bulk-pay-progress">0%</div>
          </div>
          
          <div class="row mt-4">
            <div class="col-6 text-end">
              <small class="text-muted">النجاح:</small>
              <h5 class="text-success" id="success-count">0</h5>
            </div>
            <div class="col-6 text-start">
              <small class="text-muted">الفشل:</small>
              <h5 class="text-danger" id="fail-count">0</h5>
            </div>
          </div>
          
          <div class="mt-3">
            <small class="text-muted" id="current-payment">جاري بدء المعالجة...</small>
          </div>
        </div>
      `,
      showConfirmButton: false,
      allowOutsideClick: false,
      allowEscapeKey: false,
      width: '500px'
    });

    let successfulPayments = 0;
    let failedPayments = 0;
    const results: any[] = [];
    const paidPayments: Payment[] = [];

    try {
      for (let i = 0; i < this.selectedPaymentsForBulkPay.length; i++) {
        const payment = this.selectedPaymentsForBulkPay[i];
        const paymentId = payment._id || payment.id;
        
        const progress = Math.round(((i + 1) / this.selectedPaymentsForBulkPay.length) * 100);
        this.updateProgress(progress, i + 1, successfulPayments, failedPayments, payment);

        if (!paymentId) {
          failedPayments++;
          results.push({
            payment: payment.month,
            student: payment.studentName,
            success: false,
            message: 'رقم الدفعة غير صالح',
            error: 'ID_NOT_FOUND'
          });
          continue;
        }

        try {
          const paymentData = {
            paymentMethod: paymentMethod,
            paymentDate: new Date().toISOString(),
            notes: paymentNotes || `دفع جماعي - ${new Date().toLocaleDateString('ar-SA')}`
          };

          const response = await this.http.put<any>(
            `${this.apiUrl}/payments/${paymentId}/pay`,
            paymentData,
            { headers: this.getHeaders() }
          ).toPromise();

          successfulPayments++;
          
          const paidPayment: Payment = {
            ...payment,
            paymentMethod: paymentMethod,
            paymentDate: new Date(),
            invoiceNumber: response.invoiceNumber || `INV-${Date.now().toString().slice(-8)}-${i}`,
            notes: paymentData.notes
          };
          paidPayments.push(paidPayment);
          
          results.push({
            payment: payment.month,
            student: payment.studentName,
            success: true,
            message: 'تم الدفع بنجاح',
            receiptNumber: response.invoiceNumber
          });

        } catch (error: any) {
          failedPayments++;
          
          let errorMessage = 'فشل في الدفع';
          if (error.error?.message) {
            errorMessage = error.error.message;
          } else if (error.message) {
            errorMessage = error.message;
          }
          
          results.push({
            payment: payment.month,
            student: payment.studentName,
            success: false,
            message: errorMessage,
            error: error.error?.code || 'UNKNOWN_ERROR'
          });
        }

        await this.delay(100);
      }

      Swal.close();

      // العرض التلقائي للنتائج
      if (printOption === 'single' && successfulPayments > 0) {
        // طباعة إيصال واحد لجميع الدفعات
        await this.printSingleReceiptForMultiplePayments(paidPayments, paymentMethod, paymentNotes);      } else if (printOption === 'multiple' && successfulPayments > 0) {
        // طباعة إيصالات منفصلة
        await this.printMultipleReceipts(paidPayments);
      }

      // عرض النتائج النهائية
      await this.showBulkPayResults(successfulPayments, failedPayments, results, paidPayments);

      if (successfulPayments > 0 && this.student) {
        await this.refreshData();
      }

    } catch (error) {
      console.error('خطأ في المعالجة الجماعية:', error);
      Swal.fire({
        icon: 'error',
        title: 'خطأ في المعالجة',
        text: 'حدث خطأ غير متوقع أثناء معالجة الدفعات',
        confirmButtonText: 'حسناً'
      });
    } finally {
      if (successfulPayments > 0) {
        this.selectedPaymentsForBulkPay = [];
      }
      this.closeBulkPayConfirmation();
    }
  }

  // دالة مساعدة لتحديث شريط التقدم
  private updateProgress(
    progress: number, 
    current: number, 
    success: number, 
    fail: number, 
    payment: Payment
  ): void {
    const progressBar = document.getElementById('bulk-pay-progress');
    const successCount = document.getElementById('success-count');
    const failCount = document.getElementById('fail-count');
    const currentPayment = document.getElementById('current-payment');

    if (progressBar) {
      progressBar.style.width = `${progress}%`;
      progressBar.textContent = `${progress}%`;
    }
    
    if (successCount) {
      successCount.textContent = success.toString();
    }
    
    if (failCount) {
      failCount.textContent = fail.toString();
    }
    
    if (currentPayment) {
      currentPayment.textContent = 
        `جاري معالجة: ${current}/${this.selectedPaymentsForBulkPay.length} - ${payment.month} - ${payment.amount.toLocaleString('ar-SA')} د.ج`;
    }
  }

  // دالة مساعدة للتأخير
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // دالة لعرض نتائج الدفع الجماعي
  private async showBulkPayResults(
    successCount: number,
    failCount: number,
    results: any[],
    paidPayments: Payment[]
  ): Promise<void> {
    const failedResults = results.filter(r => !r.success);
    
    const resultsHtml = `
      <div class="text-start">
        <div class="alert ${successCount > 0 ? 'alert-success' : 'alert-danger'}">
          <h5><i class="fas ${successCount > 0 ? 'fa-check-circle' : 'fa-exclamation-triangle'} me-2"></i>
            ${successCount > 0 ? 'تمت الدفعات بنجاح' : 'فشل في الدفعات'}
          </h5>
          <div class="row mt-3">
            <div class="col-4 text-center">
              <h2 class="text-success">${successCount}</h2>
              <small>النجاحات</small>
            </div>
            <div class="col-4 text-center">
              <h2 class="text-danger">${failCount}</h2>
              <small>الفشل</small>
            </div>
            <div class="col-4 text-center">
              <h2 class="text-primary">${successCount + failCount}</h2>
              <small>الإجمالي</small>
            </div>
          </div>
        </div>
        
        ${failedResults.length > 0 ? `
          <div class="alert alert-warning mt-3">
            <h6><i class="fas fa-exclamation-circle me-2"></i>تفاصيل الدفعات الفاشلة:</h6>
            <div class="mt-2" style="max-height: 200px; overflow-y: auto;">
              ${failedResults.map(r => `
                <div class="mb-2 p-2 border-start border-warning border-3 bg-light">
                  <div class="d-flex justify-content-between">
                    <strong>${r.student || 'طالب'}</strong>
                    <small class="text-danger">${r.error || 'خطأ'}</small>
                  </div>
                  <div class="small text-muted">${r.payment}: ${r.message}</div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
        
        <div class="alert alert-info mt-3">
          <h6><i class="fas fa-info-circle me-2"></i>خيارات الطباعة الإضافية:</h6>
          <div class="d-flex flex-wrap gap-2 mt-2">
            ${successCount > 0 ? `
              <button class="btn btn-success btn-sm" onclick="window.printResultsAction('single')">
                <i class="fas fa-receipt me-1"></i>طباعة إيصال واحد
              </button>
              <button class="btn btn-info btn-sm" onclick="window.printResultsAction('multiple')">
                <i class="fas fa-copy me-1"></i>طباعة إيصالات منفصلة
              </button>
              <button class="btn btn-secondary btn-sm" onclick="window.printResultsAction('close')">
                <i class="fas fa-times me-1"></i>إغلاق
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    `;

    await Swal.fire({
      title: 'نتائج الدفع الجماعي',
      html: resultsHtml,
      icon: successCount > 0 ? 'success' : 'error',
      showConfirmButton: false,
      width: '700px',
      didOpen: () => {
        // إضافة الدوال للسياق العالمي
        (window as any).printResultsAction = async (action: string) => {
          Swal.close();
          if (action === 'single' && successCount > 0) {
            await this.printSingleReceiptForMultiplePayments(paidPayments, 
              paidPayments[0]?.paymentMethod || 'cash', 
              'دفع جماعي إضافي');
          } else if (action === 'multiple' && successCount > 0) {
            await this.printMultipleReceipts(paidPayments);
          }
        };
      },
      didClose: () => {
        // تنظيف الدوال من السياق العالمي
        delete (window as any).printResultsAction;
      }
    });
  }

  // دالة طباعة إيصالات متعددة منفصلة
  private async printMultipleReceipts(payments: Payment[]): Promise<void> {
    if (!payments || payments.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'لا توجد إيصالات للطباعة',
        text: 'لا توجد مدفوعات مدفوعة للطباعة',
        confirmButtonText: 'حسناً'
      });
      return;
    }

    Swal.fire({
      title: 'جاري الطباعة...',
      html: `
        <div class="text-center">
          <div class="spinner-border text-primary mb-3" role="status">
            <span class="visually-hidden">جاري الطباعة...</span>
          </div>
          <p>جاري طباعة ${payments.length} إيصال...</p>
          <div class="progress" style="height: 20px;">
            <div class="progress-bar progress-bar-striped progress-bar-animated" 
                 style="width: 0%" id="print-progress">0%</div>
          </div>
        </div>
      `,
      showConfirmButton: false,
      allowOutsideClick: false
    });

    let printedCount = 0;
    let failedCount = 0;

    for (let i = 0; i < payments.length; i++) {
      const payment = payments[i];
      
      try {
        const receiptData: ReceiptData = {
          receiptNumber: payment.invoiceNumber || `RC-${Date.now().toString().slice(-8)}-${i}`,
          date: new Date().toLocaleDateString('en-US'),
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          studentName: payment.studentName || this.student?.name || '',
          studentId: payment.studentId || this.student?.studentId || '',
          className: payment.className || 'عام',
          month: payment.month,
          amount: payment.amount,
          paymentMethod: payment.paymentMethod || 'cash',
          academicYear: this.student?.academicYear,
          parentPhone: this.student?.parentPhone,
          notes: `دفعة جماعية - ${payment.notes || ''}`
        };

        await this.printerService.printProfessionalReceipt(receiptData);
        printedCount++;

        // تحديث شريط التقدم
        const progress = Math.round(((i + 1) / payments.length) * 100);
        const progressBar = document.getElementById('print-progress');
        if (progressBar) {
          progressBar.style.width = `${progress}%`;
          progressBar.textContent = `${progress}%`;
        }

        // تأخير بين كل طباعة
        await this.delay(500);

      } catch (error) {
        console.error(`فشل طباعة إيصال ${i + 1}:`, error);
        failedCount++;
      }
    }

    Swal.close();

    // عرض نتائج الطباعة
    Swal.fire({
      title: 'نتائج الطباعة',
      html: `
        <div class="text-start">
          <div class="alert ${printedCount > 0 ? 'alert-success' : 'alert-danger'}">
            <h6><i class="fas ${printedCount > 0 ? 'fa-check-circle' : 'fa-exclamation-triangle'} me-2"></i>
              ${printedCount > 0 ? 'تمت الطباعة بنجاح' : 'فشل في الطباعة'}
            </h6>
            <p class="mb-1"><strong>المطبوع:</strong> ${printedCount}</p>
            <p class="mb-1"><strong>الفشل:</strong> ${failedCount}</p>
            <p class="mb-0"><strong>الإجمالي:</strong> ${payments.length}</p>
          </div>
        </div>
      `,
      icon: printedCount > 0 ? 'success' : 'error',
      showConfirmButton: true,
      confirmButtonText: 'حسناً'
    });
  }

  /**
   * طباعة إيصال واحد لدفعات متعددة
   */
  private async printSingleReceiptForMultiplePayments(
    payments: Payment[], 
    paymentMethod: string,
    notes?: string
  ): Promise<void> {
    if (!payments || payments.length === 0) return;
  
    try {
      Swal.fire({
        title: 'جاري إنشاء الإيصال الموحد...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });
  
      // تجميع بيانات الدفعات
      const uniqueStudents = new Set(payments.map(p => p.studentName || this.student?.name || ''));
      const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
      
      // إنشاء بيانات الإيصال الموحد
      const bulkReceiptData: BulkReceiptData = {
        receiptNumber: `BLK-${Date.now().toString().slice(-8)}`,
        date: new Date().toLocaleDateString('ar-SA'),
        time: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
        totalAmount: totalAmount,
        paymentCount: payments.length,
        studentCount: uniqueStudents.size,
        paymentMethod: paymentMethod,
        payments: payments.map(p => ({
          studentName: p.studentName || this.student?.name || 'طالب',
          studentId: p.studentId || this.student?.studentId || '',
          className: p.className || 'عام',
          month: p.month,
          amount: p.amount,
          notes: p.notes
        })),
        notes: notes || `دفع جماعي لـ ${payments.length} دفعة`
      };
  
      // طباعة الإيصال الموحد
      const success = await this.printBulkReceipt(bulkReceiptData);
  
      if (success) {
        Swal.fire({
          icon: 'success',
          title: 'تم الطباعة',
          text: 'تم طباعة الإيصال الموحد بنجاح',
          timer: 1500,
          showConfirmButton: false
        });
      } else {
        throw new Error('فشل في طباعة الإيصال');
      }
  
    } catch (error) {
      console.error('خطأ في طباعة الإيصال الموحد:', error);
      Swal.fire({
        icon: 'error',
        title: 'خطأ في الطباعة',
        text: 'فشل في طباعة الإيصال الموحد',
        confirmButtonText: 'حسناً'
      });
    }
  }

  /**
   * طباعة إيصال موحد للدفعات المتعددة
   */
/**
 * طباعة إيصال موحد للدفعات المتعددة
 */
/**
 * طباعة إيصال موحد للدفعات المتعددة
 */

/**
 * ضمان استخدام الأرقام العربية في التاريخ والوقت
 */
private ensureArabicNumbers(text: string): string {
  if (!text) return text;
  
  const hindiToArabic: { [key: string]: string } = {
    '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
    '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9'
  };
  
  return text.split('').map(char => hindiToArabic[char] || char).join('');
}

private async printBulkReceipt(data: BulkReceiptData): Promise<boolean> {
  try {
    // تأكد من أن الطابعة متصلة
    if (!this.printerService.checkConnectionStatus()) {
      const connected = await this.printerService.connectToThermalPrinter();
      if (!connected) {
        throw new Error('فشل الاتصال بالطابعة');
      }
    }

    // إنشاء Canvas للإيصال الموحد
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    // إعدادات Canvas (80mm)
    const width = 576;
    const lineHeight = 25;
    const headerHeight = 100;
    const footerHeight = 40;
    const paymentRowHeight = 50; // زيادة ارتفاع الصف ليتسع للشهر والمبلغ
    const tableHeight = (data.payments.length * paymentRowHeight) + 30;
    
    const height = headerHeight + 200 + tableHeight + footerHeight;
    
    canvas.width = width;
    canvas.height = height;
    
    // خلفية بيضاء
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);
    
    // === رأس الإيصال ===
    ctx.textAlign = 'center';
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 24px Arial';
    ctx.fillText('أكاديمية الرواد للتعليم والمعارف', width / 2, 20);
    
    ctx.font = '16px Arial';
    ctx.fillText('الجزائر ، ولاية تقرت', width / 2, 45);
    ctx.fillText('الهاتف : 0673586274', width / 2, 65);
    
    // خط فاصل
    this.drawLine(ctx, 20, 85, width - 20, 85);
    
    // === معلومات الإيصال ===
    let yPos = 105;
    
    ctx.textAlign = 'center';
    ctx.font = 'bold 20px Arial';
    ctx.fillText('ِِA إيصـــال دفـــع جماعي', width / 2, yPos);
    
    yPos += 25;
    this.drawLine(ctx, 20, yPos, width - 20, yPos);
    yPos += 15;
    
    // معلومات أساسية
    ctx.textAlign = 'right';
    ctx.font = '16px Arial';
    
    const infoItems = [
      { label: 'رقم الإيصال:', value: data.receiptNumber },
      { label: 'التاريخ:', value: data.date },
      { label: 'الوقت:', value: data.time },
      { label: 'طريقة الدفع:', value: this.translatePaymentMethod(data.paymentMethod) },
      { label: 'عدد الدفعات:', value: data.paymentCount.toString() },
      { label: 'عدد الطلاب:', value: data.studentCount.toString() }
    ];
    
    infoItems.forEach(item => {
      ctx.fillText(`${item.label} ${item.value}`, width - 25, yPos);
      yPos += 22;
    });
    
    yPos += 10;
    this.drawLine(ctx, 20, yPos, width - 20, yPos);
    yPos += 20;
    
    // === تفاصيل الدفعات ===
    ctx.textAlign = 'center';
    ctx.font = 'bold 18px Arial';
    ctx.fillText('تفاصيل الدفعات', width / 2, yPos);
    yPos += 30;
    
    // جدول الدفعات - تعديل الأعمدة لمنع التداخل
    ctx.fillStyle = '#2C3E50';
    ctx.fillRect(20, yPos, width - 40, 30);
    
    // تقسيم الأعمدة بوضوح
    const columnWidth = (width - 40) / 4;
    
    // رؤوس الأعمدة
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.font = 'bold 16px Arial';
    
    // العمود الأول: اسم الطالب
    ctx.fillText('الطالب', 20 + (columnWidth * 0.5), yPos + 20);
    
    // العمود الثاني: الحصة
    ctx.fillText('الحصة', 20 + (columnWidth * 1.5), yPos + 20);
    
    // العمود الثالث: الشهر
    ctx.fillText('الشهر', 20 + (columnWidth * 2.5), yPos + 20);
    
    // العمود الرابع: المبلغ
    ctx.fillText('المبلغ', 20 + (columnWidth * 3.5), yPos + 20);
    
    yPos += 30;
    
    // صفوف البيانات مع مساحات واضحة
    data.payments.forEach((payment, index) => {
      if (index % 2 === 0) {
        ctx.fillStyle = '#F8F9FA';
      } else {
        ctx.fillStyle = '#FFFFFF';
      }
      
      ctx.fillRect(20, yPos, width - 40, paymentRowHeight);
      
      ctx.fillStyle = '#000000';
      ctx.strokeStyle = '#DEE2E6';
      ctx.lineWidth = 1;
      ctx.strokeRect(20, yPos, width - 40, paymentRowHeight);
      
      // اسم الطالب (يسار)
      ctx.textAlign = 'right';
      ctx.font = '14px Arial';
      const studentName = payment.studentName.length > 12 ? 
        payment.studentName.substring(0, 12) + '...' : payment.studentName;
      ctx.fillText(studentName, 20 + columnWidth - 10, yPos + 25);
      
      // الحصة (وسط)
      ctx.textAlign = 'center';
      const className = payment.className.length > 8 ? 
        payment.className.substring(0, 8) + '...' : payment.className;
      ctx.fillText(className, 20 + (columnWidth * 2), yPos + 25);
      
      // الشهر (وسط-يمين)
      ctx.textAlign = 'center';
      const month = payment.month.length > 10 ? 
        payment.month.substring(0, 10) + '...' : payment.month;
      ctx.fillText(month, 20 + (columnWidth * 3), yPos + 25);
      
      // المبلغ (يمين) - في نفس الصف لكن منفصل
      ctx.textAlign = 'left';
      ctx.font = 'bold 14px Arial';
      ctx.fillStyle = '#E74C3C';
      ctx.fillText(`${payment.amount.toLocaleString()} د.ج`, 20 + (columnWidth * 3.7), yPos + 25);
      
      // معلومات إضافية تحت كل دفعة (ID الطالب)
      ctx.textAlign = 'left';
      ctx.font = '12px Arial';
      ctx.fillStyle = '#666666';
      ctx.fillText(`ID: ${payment.studentId || ''}`, 20 + columnWidth - 10, yPos + 45);
      
      // ملاحظات صغيرة
      if (payment.notes) {
        const shortNotes = payment.notes.length > 15 ? 
          payment.notes.substring(0, 15) + '...' : payment.notes;
        ctx.textAlign = 'center';
        ctx.fillText(shortNotes, 20 + (columnWidth * 2), yPos + 45);
      }
      
      yPos += paymentRowHeight;
    });
    
    yPos += 20;
    
    // === الإجمالي ===
    this.drawDoubleLine(ctx, 20, yPos, width - 40);
    yPos += 25;
    
    ctx.textAlign = 'center';
    ctx.font = 'bold 20px Arial';
    ctx.fillStyle = '#000000';
    ctx.fillText('المجموع الإجمالي:', width / 2, yPos);
    
    yPos += 25;
    
    ctx.font = 'bold 22px Arial';
    ctx.fillStyle = '#E74C3C';
    ctx.fillText(`${data.totalAmount.toLocaleString()} دينار جزائري`, width / 2, yPos);
    
    yPos += 30;
    
    // === الملاحظات ===
    if (data.notes && data.notes.trim()) {
      ctx.textAlign = 'right';
      ctx.font = 'bold 16px Arial';
      ctx.fillStyle = '#2C3E50';
      ctx.fillText('ملاحظات:', width - 25, yPos);
      yPos += 20;
      
      ctx.font = '14px Arial';
      ctx.fillStyle = '#000000';
      
      // تقسيم النص
      const words = data.notes.split(' ');
      let line = '';
      const maxWidth = width - 40;
      
      for (const word of words) {
        const testLine = line + word + ' ';
        const metrics = ctx.measureText(testLine);
        
        if (metrics.width > maxWidth && line !== '') {
          ctx.fillText(line.trim(), width - 25, yPos);
          yPos += 20;
          line = word + ' ';
        } else {
          line = testLine;
        }
      }
      
      if (line) {
        ctx.fillText(line.trim(), width - 25, yPos);
      }
    }
    
    // === التذييل ===
    yPos = height - 25;
    ctx.textAlign = 'center';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#666666';
    ctx.fillText('دفع جماعي - نظام إدارة التعليم', width / 2, yPos);
    yPos += 18;
    ctx.fillText('مطور بواسطة: ريـــــــــــــــــدوكس', width / 2, yPos);
    
    // استخدام PrinterService للطباعة
    return await this.printerService.printBulkReceipt(data);
    
  } catch (error) {
    console.error('خطأ في طباعة الإيصال الموحد:', error);
    return false;
  }
}


// إضافة دالة الخط المفقودة
private drawSingleLine(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, color: string = '#000000'): void {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y1);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.stroke();
}
  // ===== دوال مساعدة للرسم =====
  
// دالة مساعدة للرسم
private drawLine(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number): void {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1;
  ctx.stroke();
}
  
private drawDoubleLine(ctx: CanvasRenderingContext2D, x: number, y: number, width: number): void {
  ctx.beginPath();
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1;
  
  // الخط العلوي
  ctx.moveTo(x, y);
  ctx.lineTo(x + width, y);
  
  // الخط السفلي
  ctx.moveTo(x, y + 3);
  ctx.lineTo(x + width, y + 3);
  
  ctx.stroke();
}

  
  private formatArabicDate(dateStr: string): string {
    try {
      const date = new Date(dateStr);
      const options: Intl.DateTimeFormatOptions = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      };
      return date.toLocaleDateString('ar-SA', options);
    } catch {
      return dateStr;
    }
  }
  
  private formatArabicTime(timeStr: string): string {
    try {
      const time = new Date(`2000-01-01T${timeStr}`);
      return time.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return timeStr;
    }
  }
  
  private translatePaymentMethod(method: string): string {
    const methods: { [key: string]: string } = {
      'cash': 'نقداً',
      'bank': 'تحويل بنكي',
      'card': 'بطاقة ائتمان',
      'check': 'شيك',
      'online': 'دفع إلكتروني',
      'mobile': 'دفع محمول'
    };
    return methods[method.toLowerCase()] || method;
  }
  
  private async printCanvasImage(canvas: HTMLCanvasElement): Promise<boolean> {
    try {
      // يمكنك هنا تنفيذ منطق الطباعة الخاص بك
      // هذا مثال باستخدام نافذة الطباعة
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        const imageUrl = canvas.toDataURL('image/png');
        
        printWindow.document.write(`
          <!DOCTYPE html>
          <html dir="rtl">
          <head>
            <title>طباعة الإيصال الموحد</title>
            <style>
              body { margin: 0; padding: 10px; }
              img { width: 576px; max-width: 100%; }
              @media print {
                body { margin: 0; }
                img { width: 576px; }
              }
            </style>
          </head>
          <body>
            <img src="${imageUrl}" alt="إيصال الدفع الموحد">
            <script>
              window.onload = function() {
                window.print();
                setTimeout(function() {
                  window.close();
                }, 1000);
              };
            </script>
          </body>
          </html>
        `);
        
        printWindow.document.close();
        return true;
      }
      return false;
    } catch (error) {
      console.error('خطأ في طباعة Canvas:', error);
      return false;
    }
  }

  getSelectedPaymentsTotal(): number {
    return this.selectedPaymentsForBulkPay.reduce((total, p) => total + p.amount, 0);
  }

  loadClassPayments(classId: string): void {
    if (!classId) return;
    
    this.http.get<any>(`${this.apiUrl}/payments/class/${classId}`, {
      headers: this.getHeaders()
    }).subscribe({
      next: (response) => {
        if (response.success && response.payments) {
          this.classPayments = response.payments;
        } else {
          this.classPayments = [];
        }
      },
      error: (error) => {
        console.error('Error loading class payments:', error);
        this.classPayments = [];
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  isGroupAllSelected(group: ClassPaymentGroup): boolean {
    if (!group.payments || group.payments.length === 0) return false;
    return group.payments.every(p => this.isPaymentSelected(p));
  }

  toggleGroupSelection(group: ClassPaymentGroup): void {
    const allSelected = this.isGroupAllSelected(group);
    
    if (allSelected) {
      // Deselect all
      group.payments.forEach(p => {
        const index = this.selectedPaymentsForBulkPay.findIndex(sp => 
          sp._id === p._id || sp.id === p.id
        );
        if (index > -1) {
          this.selectedPaymentsForBulkPay.splice(index, 1);
        }
      });
    } else {
      // Select all (only pending payments)
      group.payments.forEach(p => {
        if (p.status !== 'paid' && !this.isPaymentSelected(p)) {
          this.selectedPaymentsForBulkPay.push(p);
        }
      });
    }
  }

  isAnyPaymentInGroupSelected(group: ClassPaymentGroup): boolean {
    return group.payments.some(payment => this.isPaymentSelected(payment));
  }

  // Get unique months from payments
  getUniqueMonths(): string[] {
    const months = new Set<string>();
    this.paymentHistory.forEach(payment => {
      if (payment.month) {
        months.add(payment.month);
      }
    });
    return Array.from(months).sort((a, b) => {
      const monthNames = this.months;
      const getMonthIndex = (monthStr: string) => {
        const monthPart = monthStr.split(' ')[0];
        return monthNames.indexOf(monthPart);
      };
      return getMonthIndex(a) - getMonthIndex(b);
    });
  }

  // Check if all payments in a group are selected
  isAllPaymentsInGroupSelected(group: ClassPaymentGroup): boolean {
    return group.payments.every(payment => this.isPaymentSelected(payment));
  }

  // Toggle all payments in a group
  toggleAllPaymentsInGroup(group: ClassPaymentGroup): void {
    const allSelected = this.isAllPaymentsInGroupSelected(group);
    
    group.payments.forEach(payment => {
      if (allSelected) {
        // Remove from selection
        const index = this.selectedPaymentsForBulkPay.findIndex(p => 
          (p._id || p.id) === (payment._id || payment.id)
        );
        if (index > -1) {
          this.selectedPaymentsForBulkPay.splice(index, 1);
        }
      } else {
        // Add to selection if not already added and not paid
        if (!this.isPaymentSelected(payment) && payment.status !== 'paid') {
          this.selectedPaymentsForBulkPay.push(payment);
        }
      }
    });
  }

  togglePaymentSelection(payment: Payment): void {
    const index = this.selectedPaymentsForBulkPay.findIndex(p => 
      (p._id || p.id) === (payment._id || payment.id)
    );
    
    if (index > -1) {
      this.selectedPaymentsForBulkPay.splice(index, 1);
    } else {
      this.selectedPaymentsForBulkPay.push(payment);
    }
  }

  isPaymentSelected(payment: Payment): boolean {
    return this.selectedPaymentsForBulkPay.some(p => 
      (p._id || p.id) === (payment._id || payment.id)
    );
  }

  selectAllPendingPayments(): void {
    this.selectedPaymentsForBulkPay = this.paymentHistory.filter(p => 
      p.status !== 'paid'
    );
  }

  selectPaymentsByMonth(month: string): void {
    if (!month) {
      this.selectedPaymentsForBulkPay = [];
      return;
    }
    
    this.selectedPaymentsForBulkPay = this.paymentHistory.filter(p => 
      p.month === month && p.status !== 'paid'
    );
  }

  selectPaymentsByClass(classId: string): void {
    if (classId === 'all') {
      this.selectAllPendingPayments();
      return;
    }
    
    this.selectedPaymentsForBulkPay = this.paymentHistory.filter(p => 
      (p.class?._id === classId || p.class === classId) && p.status !== 'paid'
    );
  }

  openBulkPayConfirmation(): void {
    if (this.selectedPaymentsForBulkPay.length === 0) {
      Swal.fire('تنبيه', 'يرجى اختيار مدفوعات للدفع', 'warning');
      return;
    }
  
    this.showBulkPayConfirmation = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  closeBulkPayConfirmation(): void {
    this.showBulkPayConfirmation = false;
  }

  // ===== Bulk Payment Management =====
  openBulkPaymentModal(): void {
    const currentDate = new Date();
    const currentMonth = this.months[currentDate.getMonth()];
    const currentYear = currentDate.getFullYear();
    
    this.bulkPayment = {
      studentIds: [],
      classId: '',
      amount: 0,
      month: `${currentMonth} ${currentYear}`,
      paymentMethod: 'cash',
      notes: 'دفعة جماعية'
    };
    
    // Auto-select current student
    if (this.student) {
      this.toggleStudentSelection(this.student);
    }
    
    this.showBulkPaymentModal = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  
  closeBulkPaymentModal(): void {
    this.showBulkPaymentModal = false;
    this.bulkPayment = {
      studentIds: [],
      classId: '',
      amount: 0,
      month: '',
      paymentMethod: 'cash',
      notes: ''
    };
    this.selectedStudents = [];
    this.classForBulkPayment = null;
    this.bulkPaymentResults = [];
    this.bulkPaymentProgress = 0;
  }

  // Student selection for bulk payment
  toggleStudentSelection(student: Student): void {
    const studentId = student._id || student.id;
    if (!studentId) return;
    
    const index = this.selectedStudents.findIndex(s => 
      (s._id || s.id) === studentId
    );
    
    if (index > -1) {
      this.selectedStudents.splice(index, 1);
      // Remove from bulkPayment.studentIds
      const studentIdsIndex = this.bulkPayment.studentIds.indexOf(studentId);
      if (studentIdsIndex > -1) {
        this.bulkPayment.studentIds.splice(studentIdsIndex, 1);
      }
    } else {
      this.selectedStudents.push(student);
      this.bulkPayment.studentIds.push(studentId);
    }
  }

  isStudentSelected(student: Student): boolean {
    const studentId = student._id || student.id;
    if (!studentId) return false;
    
    return this.selectedStudents.some(s => 
      (s._id || s.id) === studentId
    );
  }

  selectAllStudents(): void {
    this.selectedStudents = [...this.filteredStudents];
    this.bulkPayment.studentIds = this.filteredStudents
      .map(s => s._id || s.id)
      .filter(id => id !== undefined) as string[];
  }

  deselectAllStudents(): void {
    this.selectedStudents = [];
    this.bulkPayment.studentIds = [];
  }

  filterStudents(): void {
    if (!this.studentSearchTerm.trim()) {
      this.filteredStudents = [...this.allStudents];
      return;
    }
    
    const searchTerm = this.studentSearchTerm.toLowerCase();
    this.filteredStudents = this.allStudents.filter(student => 
      student.name.toLowerCase().includes(searchTerm) ||
      student.studentId.toLowerCase().includes(searchTerm) ||
      (student.parentName && student.parentName.toLowerCase().includes(searchTerm))
    );
  }

  // Class selection for bulk payment
  selectClassForBulkPayment(classItem: Class): void {
    this.classForBulkPayment = classItem;
    this.bulkPayment.classId = classItem._id || classItem.id || '';
    this.bulkPayment.amount = classItem.price || 0;
  }

  // Process bulk payment
  async processBulkPayment(): Promise<void> {
    if (this.selectedStudents.length === 0) {
      Swal.fire('خطأ', 'يرجى اختيار طالب واحد على الأقل', 'error');
      return;
    }

    if (!this.bulkPayment.amount || this.bulkPayment.amount <= 0) {
      Swal.fire('خطأ', 'يرجى إدخال مبلغ صحيح', 'error');
      return;
    }

    if (!this.bulkPayment.month) {
      Swal.fire('خطأ', 'يرجى اختيار الشهر', 'error');
      return;
    }

    const confirmation = await Swal.fire({
      title: 'تأكيد الدفع الجماعي',
      html: `
        <div class="text-start">
          <p><strong>عدد الطلاب:</strong> ${this.selectedStudents.length}</p>
          <p><strong>المبلغ للطالب الواحد:</strong> ${this.bulkPayment.amount.toLocaleString()} د.ج</p>
          <p><strong>الإجمالي:</strong> ${(this.selectedStudents.length * this.bulkPayment.amount).toLocaleString()} د.ج</p>
          <p><strong>الشهر:</strong> ${this.bulkPayment.month}</p>
          <p><strong>طريقة الدفع:</strong> ${this.getPaymentMethodLabel(this.bulkPayment.paymentMethod)}</p>
          ${this.classForBulkPayment ? `<p><strong>الحصة:</strong> ${this.classForBulkPayment.name}</p>` : ''}
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'نعم، دفع الجماعي',
      cancelButtonText: 'إلغاء',
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33'
    });

    if (!confirmation.isConfirmed) return;

    this.isProcessingBulkPayment = true;
    this.bulkPaymentProgress = 0;
    this.bulkPaymentResults = [];

    const totalStudents = this.selectedStudents.length;
    let successfulPayments = 0;
    let failedPayments = 0;

    // Create payment data array
    const paymentsData = this.selectedStudents.map(student => ({
      student: student._id || student.id,
      class: this.bulkPayment.classId,
      amount: this.bulkPayment.amount,
      month: this.bulkPayment.month,
      paymentMethod: this.bulkPayment.paymentMethod,
      notes: `${this.bulkPayment.notes} - ${student.name}`
    }));

    // Process payments in batches
    const batchSize = 5;
    for (let i = 0; i < paymentsData.length; i += batchSize) {
      const batch = paymentsData.slice(i, i + batchSize);
      
      try {
        // Process batch concurrently
        const batchPromises = batch.map(paymentData => 
          this.http.post<any>(`${this.apiUrl}/payments`, paymentData, {
            headers: this.getHeaders()
          }).toPromise()
        );

        const batchResults = await Promise.allSettled(batchPromises);
        
        batchResults.forEach((result, index) => {
          const studentIndex = i + index;
          const student = this.selectedStudents[studentIndex];
          
          if (result.status === 'fulfilled' && result.value) {
            successfulPayments++;
            this.bulkPaymentResults.push({
              student: student.name,
              success: true,
              message: 'تم الدفع بنجاح',
              receiptNumber: result.value.payment?.invoiceNumber || 'غير محدد'
            });
            
            // Print receipt if printer is available
            if (this.printerService.checkConnectionStatus()) {
              this.printBulkPaymentReceipt(student, result.value.payment);
            }
          } else {
            failedPayments++;
            this.bulkPaymentResults.push({
              student: student.name,
              success: false,
              message: result.status === 'rejected' ? result.reason?.error?.message || 'فشل في الدفع' : 'فشل غير معروف'
            });
          }
        });

        // Update progress
        this.bulkPaymentProgress = Math.round(((i + batch.length) / totalStudents) * 100);
        
        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error('Error processing batch:', error);
        failedPayments += batch.length;
      }
    }

    this.isProcessingBulkPayment = false;

    // Show results
    const resultsHtml = `
      <div class="text-start">
        <div class="alert alert-success">
          <h6><i class="fas fa-check-circle me-2"></i>تمت الدفعات بنجاح</h6>
          <p class="mb-1"><strong>النجاحات:</strong> ${successfulPayments}</p>
          <p class="mb-1"><strong>الفشل:</strong> ${failedPayments}</p>
          <p class="mb-0"><strong>الإجمالي:</strong> ${totalStudents}</p>
        </div>
        
        ${failedPayments > 0 ? `
          <div class="alert alert-danger mt-3">
            <h6><i class="fas fa-exclamation-triangle me-2"></i>فشل في بعض الدفعات:</h6>
            <div class="mt-2" style="max-height: 200px; overflow-y: auto;">
              ${this.bulkPaymentResults
                .filter(r => !r.success)
                .map(r => `<div class="mb-1">• ${r.student}: ${r.message}</div>`)
                .join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;

    Swal.fire({
      title: 'نتائج الدفع الجماعي',
      html: resultsHtml,
      icon: successfulPayments > 0 ? 'success' : 'error',
      showCancelButton: false,
      confirmButtonText: 'حسناً',
      didClose: () => {
        // Refresh payment history for current student
        if (this.student) {
          this.loadPaymentHistory(this.getStudentId());
          this.loadStudentPaymentSystems(this.getStudentId());
        }
        this.closeBulkPaymentModal();
      }
    });
  }

  // Print receipt for bulk payment
  private async printBulkPaymentReceipt(student: Student, paymentData: any): Promise<void> {
    try {
      const receiptData: ReceiptData = {
        receiptNumber: paymentData.invoiceNumber || `BULK-${Date.now().toString().slice(-8)}`,
        date: new Date().toLocaleDateString('ar-EG'),
        time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
        studentName: student.name,
        studentId: student.studentId,
        className: this.classForBulkPayment?.name || 'دفعة جماعية',
        month: this.bulkPayment.month,
        amount: this.bulkPayment.amount,
        paymentMethod: this.bulkPayment.paymentMethod,
        academicYear: student.academicYear,
        parentPhone: student.parentPhone,
        notes: `${this.bulkPayment.notes} - ${student.name}`
      };

      await this.printerService.printProfessionalReceipt(receiptData);
    } catch (error) {
      console.error('Error printing bulk payment receipt:', error);
    }
  }

  // ===== Class Payments View =====
  openClassPaymentsModal(classItem: any): void {
    this.selectedClassForPayments = classItem;
    this.loadClassPayments(classItem._id || classItem.id);
    this.showClassPaymentsModal = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  
  closeClassPaymentsModal(): void {
    this.showClassPaymentsModal = false;
    this.selectedClassForPayments = null;
    this.classPayments = [];
  }

  // Edit Payment
  openEditPaymentModal(payment: Payment): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.editingPayment = { ...payment };
    this.showEditPaymentModal = true;
  }
  
  closeEditPaymentModal(): void {
    this.showEditPaymentModal = false;
    this.editingPayment = null;
  }

  // Delete Payment
  openDeleteConfirmModal(payment: Payment): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.paymentToDelete = payment;
    this.showDeleteConfirmModal = true;
  }

  closeDeleteConfirmModal(): void {
    this.showDeleteConfirmModal = false;
    this.paymentToDelete = null;
  }

  // Add Single Payment
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
        this.loadStudentPaymentSystems(this.getStudentId());
      },
      error: (error) => {
        console.error('Error adding payment:', error);
        Swal.fire('خطأ', 'فشل في تسجيل الدفعة', 'error');
      }
    });
  }

  // Update Payment
  updatePayment(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
        this.loadStudentPaymentSystems(this.getStudentId());
      },
      error: (error) => {
        console.error('Error updating payment:', error);
        Swal.fire('خطأ', 'فشل في تحديث الدفعة', 'error');
      }
    });
  }

  // Delete Payment
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
        this.loadStudentPaymentSystems(this.getStudentId());
      },
      error: (error) => {
        console.error('Error deleting payment:', error);
        Swal.fire('خطأ', 'فشل في حذف الدفعة', 'error');
      }
    });
  }

  // Pay Payment with automatic printing
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
      confirmButtonText: 'دفع وطباعة',
      cancelButtonText: 'دفع فقط',
      showDenyButton: true,
      denyButtonText: 'إلغاء',
      confirmButtonColor: '#3085d6',
      denyButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
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
        // الدفع والطباعة
        this.processPaymentWithPrint(payment, result.value, true);
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        // الدفع فقط
        this.processPaymentWithPrint(payment, result.value || 'cash', false);
      }
    });
  }

  private processPaymentWithPrint(payment: Payment, method: string, shouldPrint: boolean): void {
    const paymentData = {
      paymentMethod: method,
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
      next: async (response) => {
        Swal.fire({
          icon: 'success',
          title: 'نجاح',
          text: 'تم دفع الدفعة بنجاح',
          timer: 1500,
          showConfirmButton: false
        });

        // تحديث البيانات
        this.loadPaymentHistory(this.getStudentId());
        this.loadStudentPaymentSystems(this.getStudentId());
        
        // الطباعة التلقائية إذا طلب المستخدم
        if (shouldPrint && response.payment) {
          await this.printPaymentReceipt(response.payment);
        }
      },
      error: (error) => {
        console.error('Error paying payment:', error);
        Swal.fire('خطأ', 'فشل في دفع الدفعة', 'error');
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
      inputPlaceholder: 'اختر طريقة الدفع',
      inputValue: 'cash',
      preConfirm: (paymentMethod) => {
        if (!paymentMethod) {
          Swal.showValidationMessage('يرجى اختيار طريقة الدفع');
        }
        return paymentMethod;
      }
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
                html: `
                  <div class="text-start">
                    <p>تم دفع الجولة ${round.roundNumber} بنجاح</p>
                    <p><strong>المبلغ:</strong> ${round.totalAmount.toLocaleString()} د.ج</p>
                    <p><strong>طريقة الدفع:</strong> ${this.getPaymentMethodLabel(result.value)}</p>
                    ${response.receiptNumber ? `<p><strong>رقم الإيصال:</strong> ${response.receiptNumber}</p>` : ''}
                  </div>
                `,
                timer: 3000,
                showConfirmButton: false
              });
              
              // تحديث البيانات
              const studentId = this.route.snapshot.paramMap.get('id');
              if (studentId) {
                this.loadStudentPaymentSystems(studentId);
                this.loadPaymentHistory(studentId);
              }
            },
            error: (error) => {
              console.error('Error paying round:', error);
              
              let errorMessage = 'فشل في دفع الجولة';
              if (error.error?.error) {
                errorMessage += `: ${error.error.error}`;
              } else if (error.message) {
                errorMessage += `: ${error.message}`;
              }
              
              Swal.fire({
                icon: 'error',
                title: 'خطأ',
                text: errorMessage,
                confirmButtonText: 'حسناً'
              });
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
    const receiptData: ReceiptData = {
      receiptNumber: payment.invoiceNumber || `RC-${Date.now().toString().slice(-8)}`,
      date: new Date().toLocaleDateString('en-US'),
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      studentName: payment.studentName || this.student?.name || '',
      studentId: payment.studentId || this.student?.studentId || '',
      className: payment.className || 'عام',
      month: payment.month,
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      academicYear: this.student?.academicYear,
      parentPhone: this.student?.parentPhone,
      notes: payment.notes || 'دفعة فردية'
    };

    this.printerService.printProfessionalReceipt(receiptData).then(success => {
      if (success) {
        Swal.fire({
          icon: 'success',
          title: 'تمت الطباعة',
          text: 'تم طباعة الإيصال بنجاح',
          timer: 1500,
          showConfirmButton: false
        });
      }
    });
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

  // دالة للتحقق من وجود مدفوعات مدفوعة
  hasPaidPaymentsSelected(): boolean {
    return this.selectedPaymentsForBulkPay.some(p => p.status === 'paid');
  }

  // دالة للحصول على المدفوعات المدفوعة المحددة
  getPaidSelectedPayments(): Payment[] {
    return this.selectedPaymentsForBulkPay.filter(p => p.status === 'paid');
  }

  // دالة طباعة المدفوعات المحددة
  async printSelectedPaymentsReceipt(): Promise<void> {
    const paidPayments = this.getPaidSelectedPayments();
    
    if (paidPayments.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'لا توجد مدفوعات مدفوعة',
        text: 'يرجى تحديد مدفوعات مدفوعة للطباعة',
        confirmButtonText: 'حسناً'
      });
      return;
    }

    // عرض خيارات الطباعة
    const { value: printOption } = await Swal.fire({
      title: 'خيارات الطباعة',
      html: `
        <div class="text-start">
          <div class="alert alert-info">
            <h6><i class="fas fa-info-circle me-2"></i>تفاصيل الطباعة</h6>
            <p class="mb-1"><strong>عدد الدفعات:</strong> ${paidPayments.length}</p>
            <p class="mb-1"><strong>المبلغ الإجمالي:</strong> ${paidPayments.reduce((sum, p) => sum + p.amount, 0).toLocaleString()} د.ج</p>
          </div>
          
          <div class="mb-3">
            <label class="form-label"><strong>اختر طريقة الطباعة:</strong></label>
            <select class="form-select" id="receiptOption">
              <option value="single">إيصال واحد لجميع الدفعات</option>
              <option value="multiple">إيصالات منفصلة لكل دفعة</option>
            </select>
          </div>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'طباعة',
      cancelButtonText: 'إلغاء',
      preConfirm: () => {
        const receiptOption = (document.getElementById('receiptOption') as HTMLSelectElement).value;
        return { receiptOption };
      }
    });

    if (!printOption) return;

    const { receiptOption } = printOption;

    if (receiptOption === 'single') {
      // طباعة إيصال واحد
      await this.printSingleReceiptForMultiplePayments(
        paidPayments, 
        paidPayments[0]?.paymentMethod || 'cash',
        'طباعة إيصال موحد للدفعات المدفوعة'
      );
    } else if (receiptOption === 'multiple') {
      // طباعة إيصالات منفصلة
      await this.printMultipleReceipts(paidPayments);
    }
  }

  // دالة مساعدة لتحديث البيانات
  private async refreshData(): Promise<void> {
    if (this.student) {
      this.loadPaymentHistory(this.getStudentId());
      this.loadStudentPaymentSystems(this.getStudentId());
      
      // تحديث تلقائي بعد 2 ثانية للتأكد من تحديث البيانات
      await this.delay(2000);
      this.loadPaymentHistory(this.getStudentId());
    }
  }

  // دالة مساعدة لعرض تفاصيل الدفع الجماعي
  private viewBulkPayDetails(paidPayments: Payment[], results: any[]): void {
    const detailsHtml = `
      <div class="text-start">
        <div class="table-responsive">
          <table class="table table-sm table-hover">
            <thead class="table-light">
              <tr>
                <th>#</th>
                <th>اسم الطالب</th>
                <th>الشهر</th>
                <th>المبلغ</th>
                <th>رقم الفاتورة</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              ${results.map((r, index) => `
                <tr class="${r.success ? 'table-success' : 'table-danger'}">
                  <td>${index + 1}</td>
                  <td>${r.student || 'غير محدد'}</td>
                  <td>${r.payment}</td>
                  <td>${paidPayments[index]?.amount?.toLocaleString('ar-SA') || '0'} د.ج</td>
                  <td>${r.receiptNumber || 'بدون'}</td>
                  <td>
                    <span class="badge ${r.success ? 'bg-success' : 'bg-danger'}">
                      ${r.success ? 'ناجح' : 'فاشل'}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    Swal.fire({
      title: 'تفاصيل الدفع الجماعي',
      html: detailsHtml,
      width: '800px',
      showConfirmButton: true,
      confirmButtonText: 'حسناً',
      showCancelButton: true,
      cancelButtonText: 'طباعة التقرير'
    }).then(result => {
      if (result.dismiss === Swal.DismissReason.cancel) {
        this.printBulkPayReport(paidPayments, results);
      }
    });
  }

  // دالة مساعدة لطباعة تقرير الدفع الجماعي
  private printBulkPayReport(paidPayments: Payment[], results: any[]): void {
    // تنفيذ طباعة التقرير
    console.log('طباعة تقرير الدفع الجماعي:', { paidPayments, results });
    // يمكن تنفيذ طباعة تقرير PDF أو طباعة مباشرة
  }

  // دالة مساعدة للحصول على عدد الطلاب المميزين
  getUniqueStudentsCount(): number {
    const studentIds = new Set<string>();
    this.selectedPaymentsForBulkPay.forEach(payment => {
      if (payment.student?._id) {
        studentIds.add(payment.student._id);
      } else if (payment.student) {
        studentIds.add(payment.student);
      }
    });
    return studentIds.size;
  }

  // دالة مساعدة للحصول على عدد الدفعات المدفوعة
  getPaidCount(): number {
    return this.selectedPaymentsForBulkPay.filter(p => p.status === 'paid').length;
  }

  // دالة مساعدة للحصول على عدد الدفعات المعلقة
  getPendingCount(): number {
    return this.selectedPaymentsForBulkPay.filter(p => p.status !== 'paid').length;
  }

  // دالة مساعدة للتحقق إذا تم تحديد جميع المدفوعات
  isAllSelected(): boolean {
    return this.selectedPaymentsForBulkPay.length > 0 && 
           this.selectedPaymentsForBulkPay.every(p => this.isPaymentSelected(p));
  }

  // دالة مساعدة لتحديد/إلغاء تحديد جميع المدفوعات
  toggleAllPayments(): void {
    if (this.isAllSelected()) {
      this.selectedPaymentsForBulkPay = [];
    } else {
      // إعادة تعيين وتحديد الكل
      this.selectedPaymentsForBulkPay = [...this.paymentHistory.filter(p => p.status !== 'paid')];
    }
  }

  // دالة مساعدة لمعالجة الدفع بإيصال واحد
  async processSingleReceiptPayment(): Promise<void> {
    this.closeBulkPayConfirmation();
    await this.processBulkPayWithSingleReceipt();
  }

  // دالة مساعدة لمعالجة الدفع بإيصالات متعددة
  async processMultipleReceiptsPayment(): Promise<void> {
    this.closeBulkPayConfirmation();
    await this.processBulkPayWithMultipleReceipts();
  }

  // دالة مساعدة لمعالجة الدفع مع إيصال واحد
  async processBulkPayWithSingleReceipt(): Promise<void> {
    if (this.selectedPaymentsForBulkPay.length === 0) return;

    // نستخدم نفس دالة processBulkPaySelected ولكن مع تحديد الإيصال الواحد
    this.selectedReceiptOption = 'single';
    await this.processBulkPaySelected();
  }

  // دالة مساعدة لمعالجة الدفع مع إيصالات متعددة
  async processBulkPayWithMultipleReceipts(): Promise<void> {
    if (this.selectedPaymentsForBulkPay.length === 0) return;

    // نستخدم نفس دالة processBulkPaySelected ولكن مع تحديد إيصالات متعددة
    this.selectedReceiptOption = 'multiple';
    await this.processBulkPaySelected();
  }
}