// students-management.component.ts (الكامل مع التصحيحات)
import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { StudentsService, Student } from '../services/students.service';
import Swal from 'sweetalert2';

// تعريف واجهة مضافة للـ avatar
interface StudentWithAvatar extends Student {
  avatar?: string;
}

@Component({
  selector: 'app-students-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './students-management.component.html',
  styleUrls: ['./students-management.component.css']
})
export class StudentsManagementComponent implements OnInit {
  private toggleBodyScroll(disable: boolean): void {
    if (typeof document !== 'undefined') {
      const body = document.querySelector('body');
      if (body) {
        if (disable) {
          body.classList.add('no-scroll', 'modal-open');
        } else {
          body.classList.remove('no-scroll', 'modal-open');
        }
      }
    }
  }
  
  students: StudentWithAvatar[] = [];
  filteredStudents: StudentWithAvatar[] = [];
  
  loading: boolean = false;
  searchTerm: string = '';
  selectedAcademicYear: string = 'all';
  showRegistrationForm: boolean = false;
  showEditForm: boolean = false;
  showBulkImportForm: boolean = false;
  showPaymentModal: boolean = false;
  selectedStudent: StudentWithAvatar | null = null;
  editMode: boolean = false;

  // New student form
  newStudent = {
    name: '',
    parentName: '',
    parentPhone: '',
    academicYear: '',
    birthDate: '',
    registrationDate: new Date().toISOString().split('T')[0]
  };

  // Bulk import data
  bulkImportData = {
    students: [
      { name: '', parentName: '', parentPhone: '', academicYear: '', birthDate: '' }
    ],
    delimiter: ',',
    academicYear: ''
  };

  // Payment data
  paymentData = {
    amount: 600,
    paymentMethod: 'cash',
    notes: ''
  };

  academicYears = [
    { value: 'all', label: 'جميع المستويات' },
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

  constructor(
    private studentsService: StudentsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadStudents();
  }

  loadStudents(): void {
    this.loading = true;
    this.studentsService.getStudents().subscribe({
      next: (students) => {
        this.students = students as StudentWithAvatar[];
        this.filteredStudents = [...this.students];
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading students:', error);
        Swal.fire('خطأ', 'فشل في تحميل بيانات الطلاب', 'error');
        this.loading = false;
      }
    });
  }

  filterStudents(): void {
    this.filteredStudents = this.students.filter(student => {
      const matchesSearch = !this.searchTerm || 
        student.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (student.studentId && student.studentId.includes(this.searchTerm)) ||
        (student.parentName && student.parentName.toLowerCase().includes(this.searchTerm.toLowerCase()));
      
      const matchesYear = this.selectedAcademicYear === 'all' || 
        student.academicYear === this.selectedAcademicYear;
      
      return matchesSearch && matchesYear;
    });
  }

  getDisplayedStudents(): StudentWithAvatar[] {
    return this.filteredStudents;
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.selectedAcademicYear = 'all';
    this.filterStudents();
  }

  // Helper functions
  getAvatarColor(student: StudentWithAvatar | null): string {
    if (!student) return '#0a66c2';
    const colors = [
      '#0a66c2', '#004182', '#2563eb', '#3b82f6', '#7c3aed',
      '#10b981', '#06b6d4', '#f59e0b', '#ef4444', '#8b5cf6'
    ];
    const index = student.name.length % colors.length;
    return colors[index];
  }

  getStudentInitials(student: StudentWithAvatar | null): string {
    return student ? student.name.charAt(0).toUpperCase() : '?';
  }

  getAcademicYearName(code: string | undefined): string {
    if (!code) return 'غير محدد';
    const year = this.academicYears.find(y => y.value === code);
    return year ? year.label : code;
  }

  getPaymentStatus(student: StudentWithAvatar): string {
    return student.hasPaidRegistration ? 'مدفوع' : 'غير مدفوع';
  }

  getPaymentStatusClass(student: StudentWithAvatar): string {
    return student.hasPaidRegistration ? 'status-paid' : 'status-unpaid';
  }

  // Single student registration
  openRegistrationForm(): void {
    this.editMode = false;
    this.resetForm();
    this.showRegistrationForm = true;
    this.toggleBodyScroll(true);
  }
  
  

  editStudent(student: StudentWithAvatar): void {
    this.editMode = true;
    this.selectedStudent = student;
    this.newStudent = {
      name: student.name,
      parentName: student.parentName || '',
      parentPhone: student.parentPhone || '',
      academicYear: student.academicYear,
      birthDate: student.birthDate || '',
      registrationDate: student.registrationDate ? 
        new Date(student.registrationDate).toISOString().split('T')[0] : 
        new Date().toISOString().split('T')[0]
    };
    this.showRegistrationForm = true;
  }

  closeRegistrationForm(): void {
    this.showRegistrationForm = false;
    this.selectedStudent = null;
    this.toggleBodyScroll(false);
    this.resetForm();
  }
  
  registerStudent(): void {
    if (!this.validateStudentForm()) return;

    this.loading = true;
    
    if (this.editMode && this.selectedStudent) {
      // Update existing student
      const studentId = this.selectedStudent._id || this.selectedStudent.id;
      if (!studentId) {
        Swal.fire('خطأ', 'لا يمكن تحديد هوية الطالب', 'error');
        this.loading = false;
        return;
      }

      this.studentsService.updateStudent(studentId, this.newStudent).subscribe({
        next: (student) => {
          Swal.fire('نجاح', 'تم تحديث بيانات الطالب بنجاح', 'success');
          this.closeRegistrationForm();
          this.loadStudents();
        },
        error: (error) => {
          console.error('Error updating student:', error);
          Swal.fire('خطأ', 'فشل في تحديث بيانات الطالب', 'error');
          this.loading = false;
        }
      });
    } else {
      // Create new student
      this.studentsService.createStudent(this.newStudent).subscribe({
        next: (student) => {
          Swal.fire('نجاح', 'تم تسجيل الطالب بنجاح', 'success');
          this.closeRegistrationForm();
          this.loadStudents();
        },
        error: (error) => {
          console.error('Error registering student:', error);
          Swal.fire('خطأ', 'فشل في تسجيل الطالب', 'error');
          this.loading = false;
        }
      });
    }
  }

  validateStudentForm(): boolean {
    if (!this.newStudent.name.trim()) {
      Swal.fire('خطأ', 'يرجى إدخال اسم الطالب', 'error');
      return false;
    }
    if (!this.newStudent.academicYear) {
      Swal.fire('خطأ', 'يرجى اختيار المستوى الدراسي', 'error');
      return false;
    }
    return true;
  }

  resetForm(): void {
    this.newStudent = {
      name: '',
      parentName: '',
      parentPhone: '',
      academicYear: '',
      birthDate: '',
      registrationDate: new Date().toISOString().split('T')[0]
    };
  }

  // Dropdown functionality
  toggleDropdown(event: Event): void {
    event.stopPropagation();
    const dropdown = (event.target as HTMLElement).closest('.student-actions-dropdown')?.querySelector('.dropdown-menu');
    if (dropdown) {
      dropdown.classList.toggle('show');
    }
  }

  @HostListener('document:click', ['$event'])
  closeAllDropdowns(event: Event): void {
    const dropdowns = document.querySelectorAll('.dropdown-menu.show');
    dropdowns.forEach(dropdown => {
      if (!dropdown.closest('.student-actions-dropdown')?.contains(event.target as Node)) {
        dropdown.classList.remove('show');
      }
    });
  }

  // Bulk import functions
  openBulkImportForm(): void {
    this.bulkImportData = {
      students: [
        { name: '', parentName: '', parentPhone: '', academicYear: '', birthDate: '' }
      ],
      delimiter: ',',
      academicYear: ''
    };
    this.showBulkImportForm = true;
    this.toggleBodyScroll(true);
  }
  

  closeBulkImportForm(): void {
    this.showBulkImportForm = false;
    this.toggleBodyScroll(false);
  }
  
  addImportRow(): void {
    this.bulkImportData.students.push(
      { name: '', parentName: '', parentPhone: '', academicYear: '', birthDate: '' }
    );
  }

  removeImportRow(index: number): void {
    if (this.bulkImportData.students.length > 1) {
      this.bulkImportData.students.splice(index, 1);
    }
  }

  importFromText(): void {
    Swal.fire({
      title: 'إدخال البيانات النصية',
      html: `
        <div>
          <p>أدخل بيانات الطلاب، كل طالب في سطر جديد.</p>
          <p>الصيغة: <strong>الاسم,ولي الأمر,رقم الهاتف,المستوى,تاريخ الميلاد (اختياري)</strong></p>
          <p>مثال: محمد أحمد,أحمد محمد,0551234567,1AS,2008-01-15</p>
          <textarea id="studentsText" rows="10" class="swal2-textarea" 
            placeholder="أدخل بيانات الطلاب هنا..."></textarea>
          <div class="mt-3">
            <label for="delimiter">الفاصل:</label>
            <select id="delimiter" class="swal2-select">
              <option value=",">فاصلة (,)</option>
              <option value=";">فاصلة منقوطة (;)</option>
              <option value="\t">تبويب (Tab)</option>
            </select>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'استيراد',
      cancelButtonText: 'إلغاء',
      preConfirm: () => {
        const text = (document.getElementById('studentsText') as HTMLTextAreaElement).value;
        const delimiter = (document.getElementById('delimiter') as HTMLSelectElement).value;
        
        if (!text.trim()) {
          Swal.showValidationMessage('يرجى إدخال بيانات الطلاب');
          return false;
        }

        return { text, delimiter };
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        this.parseTextData(result.value.text, result.value.delimiter);
      }
    });
  }

  parseTextData(text: string, delimiter: string): void {
    const lines = text.split('\n').filter(line => line.trim() !== '');
    const students = lines.map(line => {
      const parts = line.split(delimiter).map(part => part.trim());
      return parts.length >= 3 ? {
        name: parts[0],
        parentName: parts[1] || '',
        parentPhone: parts[2] || '',
        academicYear: this.bulkImportData.academicYear || parts[3] || '',
        birthDate: parts[4] || ''
      } : null;
    }).filter(student => student !== null);
    if (students.length > 0) {
      this.bulkImportData.students = students;
      Swal.fire('نجاح', `تم تحليل ${students.length} طالب`, 'success');
    } else {
      Swal.fire('خطأ', 'لم يتم العثور على بيانات صحيحة', 'error');
    }
  }

  importStudents(): void {
    if (!this.validateBulkImportData()) return;

    Swal.fire({
      title: 'تأكيد الاستيراد',
      html: `سيتم إضافة ${this.bulkImportData.students.length} طالب. هل تريد المتابعة؟`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'نعم، استيراد',
      cancelButtonText: 'إلغاء'
    }).then((result) => {
      if (result.isConfirmed) {
        this.processBulkImport();
      }
    });
  }

  validateBulkImportData(): boolean {
    for (let i = 0; i < this.bulkImportData.students.length; i++) {
      const student = this.bulkImportData.students[i];
      if (!student.name.trim()) {
        Swal.fire('خطأ', `يرجى إدخال اسم الطالب في الصف ${i + 1}`, 'error');
        return false;
      }
    }
    
    if (!this.bulkImportData.academicYear && this.bulkImportData.students.some(s => !s.academicYear)) {
      Swal.fire('خطأ', 'يرجى تحديد المستوى الدراسي للطلاب', 'error');
      return false;
    }
    
    return true;
  }

  processBulkImport(): void {
    this.loading = true;
    
    // Apply default academic year to all students if specified
    if (this.bulkImportData.academicYear) {
      this.bulkImportData.students.forEach(student => {
        if (!student.academicYear) {
          student.academicYear = this.bulkImportData.academicYear;
        }
      });
    }

    // Process each student
    let successCount = 0;
    let errorCount = 0;
    const totalStudents = this.bulkImportData.students.length;

    const processNextStudent = (index: number) => {
      if (index >= totalStudents) {
        this.loading = false;
        this.showBulkImportForm = false;
        
        Swal.fire({
          title: 'تم الاستيراد',
          html: `
            <div class="text-center">
              <i class="bi bi-check-circle-fill text-success" style="font-size: 3rem;"></i>
              <h4 class="mt-3">تم الانتهاء من الاستيراد</h4>
              <div class="mt-3">
                <p>الطلاب المضافة بنجاح: <strong>${successCount}</strong></p>
                <p>الطلاب التي فشل إضافتها: <strong>${errorCount}</strong></p>
              </div>
            </div>
          `,
          confirmButtonText: 'تم'
        }).then(() => {
          this.loadStudents();
        });
        
        return;
      }

      const studentData = this.bulkImportData.students[index];
      
      // Add registration date
      const studentToCreate = {
        ...studentData,
        registrationDate: new Date().toISOString().split('T')[0]
      };

      this.studentsService.createStudent(studentToCreate).subscribe({
        next: (student) => {
          successCount++;
          processNextStudent(index + 1);
        },
        error: (error) => {
          console.error(`Error importing student ${studentData.name}:`, error);
          errorCount++;
          processNextStudent(index + 1);
        }
      });
    };

    processNextStudent(0);
  }

  downloadImportTemplate(): void {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "الاسم,ولي الأمر,رقم الهاتف,المستوى,تاريخ الميلاد\n" +
      "محمد أحمد,أحمد محمد,0551234567,1AS,2008-01-15\n" +
      "سارة محمد,محمد خالد,0557654321,2AS,2007-05-20\n" +
      "علي حسن,حسن علي,0551122334,1MS,2009-08-10";
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "نموذج_استيراد_الطلاب.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  openPaymentModal(student: StudentWithAvatar): void {
    this.selectedStudent = student;
    this.paymentData.amount = 600;
    this.showPaymentModal = true;
    this.toggleBodyScroll(true);
  }
  
  
  closePaymentModal(): void {
    this.showPaymentModal = false;
    this.selectedStudent = null;
    this.toggleBodyScroll(false);
    this.paymentData = {
      amount: 600,
      paymentMethod: 'cash',
      notes: ''
    };
  }
  
  ngOnDestroy(): void {
    this.toggleBodyScroll(false);
  }
  

  processPayment(): void {
    if (!this.selectedStudent) return;
    
    const studentId = this.selectedStudent._id || this.selectedStudent.id;
    if (!studentId) {
      Swal.fire('خطأ', 'لا يمكن تحديد هوية الطالب', 'error');
      return;
    }

    this.loading = true;
    this.studentsService.payRegistrationFee(studentId, this.paymentData).subscribe({
      next: (response) => {
        Swal.fire('نجاح', 'تم دفع رسوم التسجيل بنجاح', 'success');
        this.closePaymentModal();
        this.loadStudents();
      },
      error: (error) => {
        console.error('Error processing payment:', error);
        Swal.fire('خطأ', 'فشل في معالجة الدفع', 'error');
        this.loading = false;
      }
    });
  }

  // Other functions
  viewStudentDetails(student: StudentWithAvatar): void {
    const studentId = student._id || student.id;
    if (studentId) {
      this.router.navigate(['/home/students-management', studentId]);
    } else {
      Swal.fire('خطأ', 'لا يمكن عرض تفاصيل الطالب', 'error');
    }
  }

  deleteStudent(student: StudentWithAvatar): void {
    const studentId = student._id || student.id;
    if (!studentId) {
      Swal.fire('خطأ', 'لا يمكن تحديد هوية الطالب للحذف', 'error');
      return;
    }

    Swal.fire({
      title: 'هل أنت متأكد؟',
      text: `سيتم حذف الطالب ${student.name} بشكل دائم`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'نعم، احذف',
      cancelButtonText: 'إلغاء'
    }).then((result) => {
      if (result.isConfirmed) {
        this.studentsService.deleteStudent(studentId).subscribe({
          next: () => {
            Swal.fire('تم الحذف', 'تم حذف الطالب بنجاح', 'success');
            this.loadStudents();
          },
          error: (error) => {
            console.error('Error deleting student:', error);
            Swal.fire('خطأ', 'فشل في حذف الطالب', 'error');
          }
        });
      }
    });
  }

  // Helper function for CSV parsing
  parseCSV(csvText: string, delimiter: string = ','): any[] {
    const lines = csvText.split('\n');
    const result: any[] = [];
    const headers = lines[0].split(delimiter).map(header => header.trim());

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      const obj: any = {};
      const currentline = lines[i].split(delimiter).map(item => item.trim());
      
      for (let j = 0; j < headers.length; j++) {
        obj[headers[j]] = currentline[j] || '';
      }
      
      result.push(obj); // Ensure obj matches the type defined for result
    }
    
    return result;
  }

  
}