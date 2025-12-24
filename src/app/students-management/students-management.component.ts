// students-management.component.ts (المحدث والمصحح)
import { Component, OnInit } from '@angular/core';
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
  students: StudentWithAvatar[] = [];
  filteredStudents: StudentWithAvatar[] = [];
  
  loading: boolean = false;
  searchTerm: string = '';
  selectedAcademicYear: string = 'all';
  showRegistrationForm: boolean = false;
  showPaymentModal: boolean = false;
  selectedStudent: StudentWithAvatar | null = null;


  
  // New student form
  newStudent = {
    name: '',
    parentName: '',
    parentPhone: '',
    academicYear: '',
    birthDate: '',
    registrationDate: new Date().toISOString().split('T')[0]
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
        // Cast students to include avatar property
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

  openRegistrationForm(): void {
    this.showRegistrationForm = true;
  }

  closeRegistrationForm(): void {
    this.showRegistrationForm = false;
    this.resetForm();
  }

  registerStudent(): void {
    if (!this.validateStudentForm()) return;

    this.loading = true;
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

  openPaymentModal(student: StudentWithAvatar): void {
    this.selectedStudent = student;
    this.paymentData.amount = 600;
    this.showPaymentModal = true;
  }

  closePaymentModal(): void {
    this.showPaymentModal = false;
    this.selectedStudent = null;
    this.paymentData = {
      amount: 600,
      paymentMethod: 'cash',
      notes: ''
    };
  }

  processPayment(): void {
    if (!this.selectedStudent) return;
    
    // Get the student ID safely
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

  viewStudentDetails(student: StudentWithAvatar): void {
    // Get the student ID safely
    const studentId = student._id || student.id;
    if (studentId) {
      this.router.navigate(['/home/students-management', studentId]);
    } else {
      console.error('Cannot navigate: Student ID is undefined');
      Swal.fire('خطأ', 'لا يمكن عرض تفاصيل الطالب', 'error');
    }
  }

  editStudent(student: StudentWithAvatar): void {
    Swal.fire('تحت التطوير', 'ميزة التعديل قيد التطوير', 'info');
  }

  deleteStudent(student: StudentWithAvatar): void {
    // Get the student ID safely
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

  getAcademicYearName(code: string): string {
    const year = this.academicYears.find(y => y.value === code);
    return year ? year.label : code;
  }

  getPaymentStatus(student: StudentWithAvatar): string {
    return student.hasPaidRegistration ? 'مدفوع' : 'غير مدفوع';
  }

  getPaymentStatusClass(student: StudentWithAvatar): string {
    return student.hasPaidRegistration ? 'status-paid' : 'status-unpaid';
  }

  getStudentAvatar(student: StudentWithAvatar): string {
    // Use avatar if exists, otherwise generate initials avatar
    if (student.avatar) {
      return student.avatar;
    }
    
    // Generate avatar with initials
    const initials = student.name.charAt(0).toUpperCase();
    const backgroundColor = this.getRandomColor();
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=${backgroundColor.substring(1)}&color=fff&size=100`;
  }

  getStudentInitials(student: StudentWithAvatar): string {
    return student.name.charAt(0).toUpperCase();
  }

  private getRandomColor(): string {
    const colors = [
      '#0a66c2', '#004182', '#2563eb', '#3b82f6', '#7c3aed',
      '#10b981', '#06b6d4', '#f59e0b', '#ef4444', '#8b5cf6'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  
}