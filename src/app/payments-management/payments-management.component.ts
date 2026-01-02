import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PaymentsService } from '../services/payments.service';
import { StudentsService } from '../services/students.service';
import { LessonsService } from '../services/lessons.service';
import { TeachersService } from '../services/teachers.service';
import { AuthService } from '../services/auth.service';
import { PrinterService, ReceiptData } from '../services/printer.service';
import { Observable, forkJoin } from 'rxjs';
import Swal from 'sweetalert2';

interface Payment {
  _id: string;
  student: any;
  class: any;
  amount: number;
  month: string;
  paymentDate: Date | null;
  status: 'paid' | 'pending' | 'late';
  paymentMethod: 'cash' | 'bank' | 'online' | 'mobile' | 'check';
  invoiceNumber: string;
  recordedBy: any;
  commissionRecorded: boolean;
  commissionId: string;
  notes?: string;
}

@Component({
  selector: 'app-payments-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './payments-management.component.html',
  styleUrls: ['./payments-management.component.css']
})
export class PaymentsManagementComponent implements OnInit {
  // Main state variables
  payments: Payment[] = [];
  filteredPayments: Payment[] = [];
  students: any[] = [];
  classes: any[] = [];
  teachers: any[] = [];
  
  // Loading states
  isLoading = true;
  isRecordingPayment = false;
  isExporting = false;
  
  // Filter state
  filters = {
    student: '',
    class: '',
    month: '',
    status: '',
    paymentMethod: '',
    startDate: '',
    endDate: ''
  };
  
  // New payment form
  newPaymentForm: FormGroup;
  isNewPaymentModalOpen = false;
  selectedStudentForPayment: any = null;
  availableMonths: string[] = [];
  
  // Edit payment state
  isEditPaymentModalOpen = false;
  editingPayment: Payment | null = null;
  
  // Bulk actions
  selectedPayments: Set<string> = new Set();
  isBulkActionLoading = false;
  
  // Statistics
  stats = {
    totalPayments: 0,
    totalAmount: 0,
    pendingPayments: 0,
    latePayments: 0,
    paidAmount: 0,
    pendingAmount: 0
  };
  
  // Pagination
  currentPage = 1;
  itemsPerPage = 20;
  totalPages = 1;
  
  // View options
  viewMode: 'table' | 'cards' = 'table';
  sortField = 'paymentDate';
  sortDirection: 'asc' | 'desc' = 'desc';
  
  // Printer connection state
  isPrinterConnected = false;
  printerStatus = 'غير متصل';
  
  constructor(
    private paymentsService: PaymentsService,
    private studentsService: StudentsService,
    private lessonsService: LessonsService,
    private teachersService: TeachersService,
    private authService: AuthService,
    private printerService: PrinterService,
    private fb: FormBuilder
  ) {
    this.newPaymentForm = this.fb.group({
      studentId: ['', Validators.required],
      classId: ['', Validators.required],
      amount: ['', [Validators.required, Validators.min(1)]],
      month: ['', Validators.required],
      paymentMethod: ['cash', Validators.required],
      paymentDate: [new Date().toISOString().split('T')[0], Validators.required],
      notes: ['']
    });
    
    this.generateAvailableMonths();
  }
  
  ngOnInit() {
    this.loadInitialData();
    this.checkPrinterConnection();
    this.updatePrinterStatus();
  }
  
  loadInitialData() {
    this.isLoading = true;
    
    forkJoin({
      payments: this.paymentsService.getPayments(),
      students: this.studentsService.getStudents(),
      classes: this.lessonsService.getClasses(),
      teachers: this.teachersService.getTeachers()
    }).subscribe({
      next: (results) => {
        this.payments = results.payments;
        this.students = results.students;
        this.classes = results.classes;
        this.teachers = results.teachers;
        this.applyFilters();
        this.calculateStatistics();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading data:', error);
        this.showError('فشل تحميل البيانات');
        this.isLoading = false;
      }
    });
  }
  
  generateAvailableMonths() {
    const currentDate = new Date();
    const months: string[] = [];
    
    // Generate 12 months back and 6 months forward
    for (let i = -12; i <= 6; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
      const monthString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      months.push(monthString);
    }
    
    this.availableMonths = months;
  }
  
  applyFilters() {
    let filtered = [...this.payments];
    
    // Apply each filter
    if (this.filters.student) {
      filtered = filtered.filter(p => 
        p.student?._id === this.filters.student ||
        p.student?.name?.toLowerCase().includes(this.filters.student.toLowerCase())
      );
    }
    
    if (this.filters.class) {
      filtered = filtered.filter(p => 
        p.class?._id === this.filters.class ||
        p.class?.name?.toLowerCase().includes(this.filters.class.toLowerCase())
      );
    }
    
    if (this.filters.month) {
      filtered = filtered.filter(p => p.month === this.filters.month);
    }
    
    if (this.filters.status) {
      filtered = filtered.filter(p => p.status === this.filters.status);
    }
    
    if (this.filters.paymentMethod) {
      filtered = filtered.filter(p => p.paymentMethod === this.filters.paymentMethod);
    }
    
    if (this.filters.startDate) {
      const startDate = new Date(this.filters.startDate);
      filtered = filtered.filter(p => {
        if (!p.paymentDate) return false;
        return new Date(p.paymentDate) >= startDate;
      });
    }
    
    if (this.filters.endDate) {
      const endDate = new Date(this.filters.endDate);
      endDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(p => {
        if (!p.paymentDate) return false;
        return new Date(p.paymentDate) <= endDate;
      });
    }
    
    // Sort results
    filtered.sort((a, b) => {
      let aValue: any = a[this.sortField as keyof Payment];
      let bValue: any = b[this.sortField as keyof Payment];
      
      if (this.sortField === 'paymentDate') {
        aValue = a.paymentDate ? new Date(a.paymentDate) : new Date(0);
        bValue = b.paymentDate ? new Date(b.paymentDate) : new Date(0);
      }
      
      if (this.sortField === 'student.name') {
        aValue = a.student?.name || '';
        bValue = b.student?.name || '';
      }
      
      if (this.sortField === 'class.name') {
        aValue = a.class?.name || '';
        bValue = b.class?.name || '';
      }
      
      if (aValue < bValue) return this.sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    this.filteredPayments = filtered;
    this.calculatePagination();
  }
  
  calculateStatistics() {
    this.stats.totalPayments = this.payments.length;
    this.stats.pendingPayments = this.payments.filter(p => p.status === 'pending').length;
    this.stats.latePayments = this.payments.filter(p => p.status === 'late').length;
    
    this.stats.totalAmount = this.payments.reduce((sum, p) => sum + p.amount, 0);
    this.stats.paidAmount = this.payments
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + p.amount, 0);
    this.stats.pendingAmount = this.stats.totalAmount - this.stats.paidAmount;
  }
  
  calculatePagination() {
    this.totalPages = Math.ceil(this.filteredPayments.length / this.itemsPerPage);
    this.currentPage = Math.max(1, Math.min(this.currentPage, this.totalPages));
  }
  
  get paginatedPayments() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredPayments.slice(startIndex, endIndex);
  }
  
  // Pagination helper methods
  getPaginatedInfo(): { start: number, end: number } {
    const start = (this.currentPage - 1) * this.itemsPerPage + 1;
    const end = Math.min(this.currentPage * this.itemsPerPage, this.filteredPayments.length);
    return { start, end };
  }
  
  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 7;
    
    if (this.totalPages <= maxVisiblePages) {
      // Show all pages
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show limited pages around current page
      let startPage = Math.max(1, this.currentPage - 3);
      let endPage = Math.min(this.totalPages, this.currentPage + 3);
      
      // Adjust if at start or end
      if (this.currentPage <= 4) {
        endPage = maxVisiblePages;
      } else if (this.currentPage >= this.totalPages - 3) {
        startPage = this.totalPages - maxVisiblePages + 1;
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  }
  
  // Filter and sort methods
  clearFilters() {
    this.filters = {
      student: '',
      class: '',
      month: '',
      status: '',
      paymentMethod: '',
      startDate: '',
      endDate: ''
    };
    this.applyFilters();
  }
  
  sort(field: string) {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    this.applyFilters();
  }
  
  // Payment actions
  openNewPaymentModal(student?: any) {
    if (student) {
      this.selectedStudentForPayment = student;
      this.newPaymentForm.patchValue({ studentId: student._id });
    }
    
    this.newPaymentForm.reset({
      paymentMethod: 'cash',
      paymentDate: new Date().toISOString().split('T')[0],
      amount: '',
      month: '',
      classId: '',
      notes: ''
    });
    
    this.isNewPaymentModalOpen = true;
  }
  
  closeNewPaymentModal() {
    this.isNewPaymentModalOpen = false;
    this.selectedStudentForPayment = null;
  }
  
  onSubmitNewPayment() {
    if (this.newPaymentForm.invalid) {
      this.markFormGroupTouched(this.newPaymentForm);
      return;
    }
    
    this.isRecordingPayment = true;
    const paymentData = this.newPaymentForm.value;
    
    this.paymentsService.createPayment(paymentData).subscribe({
      next: (response) => {
        this.showSuccess('تم تسجيل الدفعة بنجاح');
        this.loadInitialData();
        this.closeNewPaymentModal();
        this.isRecordingPayment = false;
      },
      error: (error) => {
        console.error('Error recording payment:', error);
        this.showError('فشل تسجيل الدفعة');
        this.isRecordingPayment = false;
      }
    });
  }
  
  markPaymentAsPaid(payment: Payment) {
    Swal.fire({
      title: 'تأكيد الدفع',
      text: `هل تريد تأكيد دفع مبلغ ${payment.amount} د.ج للطالب ${payment.student?.name}؟`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'نعم، تأكيد الدفع',
      cancelButtonText: 'إلغاء',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        const paymentData = {
          paymentDate: new Date().toISOString(),
          paymentMethod: 'cash'
        };
        
        this.paymentsService.payPayment(payment._id, paymentData).subscribe({
          next: (updatedPayment) => {
            this.showSuccess('تم تسجيل الدفع بنجاح');
            // Update local state
            const index = this.payments.findIndex(p => p._id === payment._id);
            if (index !== -1) {
              this.payments[index] = updatedPayment;
              this.applyFilters();
              this.calculateStatistics();
            }
          },
          error: (error) => {
            console.error('Error marking payment as paid:', error);
            this.showError('فشل تسجيل الدفع');
          }
        });
      }
    });
  }
  
  openEditPaymentModal(payment: Payment) {
    this.editingPayment = { ...payment };
    this.isEditPaymentModalOpen = true;
  }
  
  updatePaymentAmount() {
    if (!this.editingPayment) return;
    
    Swal.fire({
      title: 'تعديل المبلغ',
      input: 'number',
      inputLabel: 'المبلغ الجديد',
      inputValue: this.editingPayment.amount,
      inputAttributes: {
        min: '1',
        step: '100'
      },
      showCancelButton: true,
      confirmButtonText: 'حفظ',
      cancelButtonText: 'إلغاء',
      reverseButtons: true,
      inputValidator: (value) => {
        if (!value || Number(value) <= 0) {
          return 'يرجى إدخال مبلغ صحيح';
        }
        return null;
      }
    }).then((result) => {
      if (result.isConfirmed) {
        const newAmount = Number(result.value);
        this.paymentsService.updatePaymentAmount(this.editingPayment!._id, newAmount).subscribe({
          next: (updatedPayment) => {
            this.showSuccess('تم تعديل المبلغ بنجاح');
            // Update local state
            const index = this.payments.findIndex(p => p._id === this.editingPayment!._id);
            if (index !== -1) {
              this.payments[index] = updatedPayment;
              this.applyFilters();
              this.calculateStatistics();
            }
            this.isEditPaymentModalOpen = false;
          },
          error: (error) => {
            console.error('Error updating payment amount:', error);
            this.showError('فشل تعديل المبلغ');
          }
        });
      }
    });
  }
  
  cancelPayment(payment: Payment) {
    Swal.fire({
      title: 'تأكيد الإلغاء',
      text: `هل تريد إلغاء دفعة مبلغ ${payment.amount} د.ج للطالب ${payment.student?.name}؟`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'نعم، إلغاء الدفعة',
      cancelButtonText: 'إلغاء الأمر',
      confirmButtonColor: '#d33',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.paymentsService.cancelPayment(payment._id).subscribe({
          next: () => {
            this.showSuccess('تم إلغاء الدفعة بنجاح');
            // Update local state
            const index = this.payments.findIndex(p => p._id === payment._id);
            if (index !== -1) {
              this.payments[index].status = 'pending';
              this.payments[index].paymentDate = null;
              this.applyFilters();
              this.calculateStatistics();
            }
          },
          error: (error) => {
            console.error('Error canceling payment:', error);
            this.showError('فشل إلغاء الدفعة');
          }
        });
      }
    });
  }
  
  deletePayment(payment: Payment) {
    Swal.fire({
      title: 'تأكيد الحذف',
      text: `هل تريد حذف دفعة مبلغ ${payment.amount} د.ج للطالب ${payment.student?.name}؟`,
      icon: 'error',
      showCancelButton: true,
      confirmButtonText: 'نعم، حذف الدفعة',
      cancelButtonText: 'إلغاء الأمر',
      confirmButtonColor: '#d33',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.paymentsService.deletePayment(payment._id).subscribe({
          next: () => {
            this.showSuccess('تم حذف الدفعة بنجاح');
            // Remove from local state
            this.payments = this.payments.filter(p => p._id !== payment._id);
            this.applyFilters();
            this.calculateStatistics();
          },
          error: (error) => {
            console.error('Error deleting payment:', error);
            this.showError('فشل حذف الدفعة');
          }
        });
      }
    });
  }
  
  // Bulk actions
  togglePaymentSelection(paymentId: string) {
    if (this.selectedPayments.has(paymentId)) {
      this.selectedPayments.delete(paymentId);
    } else {
      this.selectedPayments.add(paymentId);
    }
  }
  
  selectAllPayments() {
    if (this.selectedPayments.size === this.filteredPayments.length) {
      this.selectedPayments.clear();
    } else {
      this.filteredPayments.forEach(p => this.selectedPayments.add(p._id));
    }
  }
  
  markSelectedAsPaid() {
    if (this.selectedPayments.size === 0) {
      this.showWarning('يرجى اختيار دفعات أولاً');
      return;
    }
    
    Swal.fire({
      title: 'تأكيد الدفع الجماعي',
      text: `هل تريد تأكيد دفع ${this.selectedPayments.size} دفعة؟`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'نعم، تأكيد الدفع',
      cancelButtonText: 'إلغاء',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.isBulkActionLoading = true;
        const paymentPromises = Array.from(this.selectedPayments).map(paymentId => 
          this.paymentsService.payPayment(paymentId, {
            paymentDate: new Date().toISOString(),
            paymentMethod: 'cash'
          })
        );
        
        // Execute all promises
        Promise.all(paymentPromises.map(p => p.toPromise())).then(() => {
          this.applyFilters();
          this.calculateStatistics();
          this.selectedPayments.clear();
          this.isBulkActionLoading = false;
          this.showSuccess(`تم تسديد ${paymentPromises.length} دفعة بنجاح`);
        }).catch(error => {
          console.error('Error in bulk payment:', error);
          this.showError('حدث خطأ في تسديد بعض الدفعات');
          this.isBulkActionLoading = false;
        });
      }
    });
  }
  
  // ===== Printer Service Integration Methods =====
  
  async printSelectedReceipts() {
    if (this.selectedPayments.size === 0) {
      this.showWarning('يرجى اختيار دفعات أولاً');
      return;
    }
    
    const selectedPaymentIds = Array.from(this.selectedPayments);
    const selectedPayments = this.payments.filter(p => selectedPaymentIds.includes(p._id));
    
    if (selectedPayments.length === 0) {
      this.showError('لم يتم العثور على بيانات الدفعات المحددة');
      return;
    }
    
    // Check if printer is connected
    if (!this.isPrinterConnected) {
      const connect = await this.connectToPrinter();
      if (!connect) return;
    }
    
    // Print receipts one by one
    let successCount = 0;
    
    for (const payment of selectedPayments) {
      const success = await this.printSinglePaymentReceipt(payment);
      if (success) successCount++;
      
      // Small delay between prints
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    if (successCount > 0) {
      this.showSuccess(`تم طباعة ${successCount} من ${selectedPayments.length} إيصال بنجاح`);
      if (successCount === selectedPayments.length) {
        this.selectedPayments.clear();
      }
    }
  }
  
  async printSinglePaymentReceipt(payment: Payment): Promise<boolean> {
    // Check if printer is connected
    if (!this.isPrinterConnected) {
      const connect = await this.connectToPrinter();
      if (!connect) return false;
    }
    
    // Prepare receipt data
    const receiptData: ReceiptData = {
      receiptNumber: payment.invoiceNumber || `PAY-${Date.now().toString().slice(-8)}`,
      date: payment.paymentDate 
        ? new Date(payment.paymentDate).toLocaleDateString('ar-EG') 
        : new Date().toLocaleDateString('ar-EG'),
      time: payment.paymentDate
        ? new Date(payment.paymentDate).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
        : new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      studentName: payment.student?.name || 'غير معروف',
      studentId: payment.student?.studentId || 'بدون رقم',
      className: payment.class?.name || 'غير معروف',
      month: payment.month,
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      academicYear: payment.student?.academicYear || '',
      parentPhone: payment.student?.parentPhone || '',
      notes: payment.notes || `حالة الدفع: ${this.getStatusText(payment.status)}`
    };
    
    // Print receipt
    try {
      const success = await this.printerService.printProfessionalReceipt(receiptData);
      if (success) {
        // Mark as printed in UI
        this.showToast('تم طباعة إيصال الدفع');
      }
      return success;
    } catch (error) {
      console.error('Error printing receipt:', error);
      this.showError('فشل طباعة الإيصال');
      return false;
    }
  }
  
  async connectToPrinter(): Promise<boolean> {
    try {
      this.showLoading('جاري الاتصال بالطابعة...');
      const connected = await this.printerService.connectToThermalPrinter();
      this.isPrinterConnected = connected;
      this.updatePrinterStatus();
      
      if (connected) {
        this.showSuccess('تم الاتصال بالطابعة بنجاح');
      }
      
      return connected;
    } catch (error) {
      console.error('Error connecting to printer:', error);
      this.isPrinterConnected = false;
      this.updatePrinterStatus();
      return false;
    }
  }
  
  async disconnectPrinter() {
    try {
      await this.printerService.disconnect();
      this.isPrinterConnected = false;
      this.updatePrinterStatus();
      this.showSuccess('تم قطع الاتصال بالطابعة');
    } catch (error) {
      console.error('Error disconnecting printer:', error);
    }
  }
  
  checkPrinterConnection() {
    this.isPrinterConnected = this.printerService.checkConnectionStatus();
    this.updatePrinterStatus();
  }
  
  updatePrinterStatus() {
    if (this.isPrinterConnected) {
      const status = this.printerService.getPrinterStatus();
      this.printerStatus = `متصل - ${status.timestamp}`;
    } else {
      this.printerStatus = 'غير متصل';
    }
  }
  
  async printTestPage() {
    // Check if printer is connected
    if (!this.isPrinterConnected) {
      const connect = await this.connectToPrinter();
      if (!connect) return;
    }
    
    try {
      this.showLoading('جاري طباعة صفحة الاختبار...');
      const success = await this.printerService.printAdvancedTestPage();
      
      if (success) {
        this.isPrinterConnected = true;
        this.updatePrinterStatus();
        this.showSuccess('تم طباعة صفحة الاختبار بنجاح');
      }
    } catch (error) {
      console.error('Error printing test page:', error);
      this.showError('فشل طباعة صفحة الاختبار');
    }
  }
  
  async printWelcomeMessage() {
    if (!this.isPrinterConnected) {
      const connect = await this.connectToPrinter();
      if (!connect) return;
    }
    
    try {
      this.showLoading('جاري طباعة رسالة الترحيب...');
      const success = await this.printerService.printWelcomeMessage();
      
      if (success) {
        this.showSuccess('تم طباعة رسالة الترحيب بنجاح');
      }
    } catch (error) {
      console.error('Error printing welcome message:', error);
      this.showError('فشل طباعة رسالة الترحيب');
    }
  }
  
  async printMonthlyReport() {
    // Check if printer is connected
    if (!this.isPrinterConnected) {
      const connect = await this.connectToPrinter();
      if (!connect) return;
    }
    
    // Get selected student or show selection dialog
    const selectedPayment = this.paginatedPayments[0];
    if (!selectedPayment) {
      this.showWarning('لا توجد مدفوعات لعرض التقرير');
      return;
    }
    
    // For demo purposes, print report for first student
    const studentData = selectedPayment.student;
    if (!studentData) {
      this.showError('لا توجد بيانات كافية للطالب');
      return;
    }
    
    // Simulate attendance and payment data
    const attendanceData = {
      attendanceRate: 85,
      present: 17,
      absent: 3,
      late: 2
    };
    
    const paymentData = {
      totalPaid: this.stats.paidAmount,
      pending: this.stats.pendingAmount
    };
    
    try {
      this.showLoading('جاري طباعة التقرير الشهري...');
      const success = await this.printerService.printStudentMonthlyReport(
        studentData,
        attendanceData,
        paymentData
      );
      
      if (success) {
        this.showSuccess('تم طباعة التقرير الشهري بنجاح');
      }
    } catch (error) {
      console.error('Error printing monthly report:', error);
      this.showError('فشل طباعة التقرير الشهري');
    }
  }
  
  exportToExcel() {
    this.isExporting = true;
    
    // Generate Excel data
    const headers = [
      'رقم الفاتورة',
      'اسم الطالب',
      'رقم الطالب',
      'الحصة',
      'المبلغ',
      'الشهر',
      'تاريخ الدفع',
      'طريقة الدفع',
      'الحالة',
      'ملاحظات'
    ];
    
    const data = this.filteredPayments.map(payment => [
      payment.invoiceNumber || 'N/A',
      payment.student?.name || 'غير معروف',
      payment.student?.studentId || 'N/A',
      payment.class?.name || 'غير معروف',
      payment.amount,
      payment.month,
      payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString('ar-EG') : 'غير مدفوع',
      this.getPaymentMethodText(payment.paymentMethod),
      this.getStatusText(payment.status),
      payment.notes || ''
    ]);
    
    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...data.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    // Download CSV
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `مدفوعات_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    this.isExporting = false;
    this.showSuccess('تم تصدير البيانات بنجاح');
  }
  
  // Helper methods
  getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'paid': 'مدفوع',
      'pending': 'معلق',
      'late': 'متأخر'
    };
    return statusMap[status] || status;
  }
  
  getPaymentMethodText(method: string): string {
    const methodMap: { [key: string]: string } = {
      'cash': 'نقدي',
      'bank': 'تحويل بنكي',
      'online': 'دفع إلكتروني',
      'mobile': 'دفع محمول',
      'check': 'شيك'
    };
    return methodMap[method] || method;
  }
  
  getStatusClass(status: string): string {
    switch (status) {
      case 'paid': return 'status-paid';
      case 'pending': return 'status-pending';
      case 'late': return 'status-late';
      default: return '';
    }
  }
  
  getStudentClasses(studentId: string) {
    return this.classes.filter(c => 
      c.students?.some((s: any) => s._id === studentId)
    );
  }
  
  markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
  
  // Alert methods
  showSuccess(message: string) {
    Swal.fire({
      icon: 'success',
      title: 'نجاح',
      text: message,
      confirmButtonText: 'حسناً',
      timer: 3000
    });
  }
  
  showError(message: string) {
    Swal.fire({
      icon: 'error',
      title: 'خطأ',
      text: message,
      confirmButtonText: 'حسناً'
    });
  }
  
  showWarning(message: string) {
    Swal.fire({
      icon: 'warning',
      title: 'تحذير',
      text: message,
      confirmButtonText: 'حسناً'
    });
  }
  
  showToast(message: string) {
    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.onmouseenter = Swal.stopTimer;
        toast.onmouseleave = Swal.resumeTimer;
      }
    });
    
    Toast.fire({
      icon: 'success',
      title: message
    });
  }
  
  showLoading(message: string) {
    Swal.fire({
      title: message,
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
  }
  
  // Getter for template
  get printerStatusText(): string {
    return this.isPrinterConnected ? 'متصل' : 'غير متصل';
  }
}