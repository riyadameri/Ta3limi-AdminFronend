import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { StudentsService, Student } from '../services/students.service';
import { PaymentsService } from '../services/payments.service';
import { ClassesService } from '../classes.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-student-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './student-details.component.html',
  styleUrls: ['./student-details.component.css']
})
export class StudentDetailsComponent implements OnInit {
  student: Student | null = null;
  loading: boolean = false;
  activeTab: string = 'info';
  studentClasses: any[] = [];
  paymentHistory: any[] = [];

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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private studentsService: StudentsService,
    private paymentsService: PaymentsService,
    private classesService: ClassesService
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
    // Using the correct method name from students service
    this.studentsService.getStudentClasses(studentId).subscribe({
      next: (classes) => {
        this.studentClasses = classes;
      },
      error: (error) => {
        console.error('Error loading student classes:', error);
        this.studentClasses = []; // Set empty array on error
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
        this.paymentHistory = []; // Set empty array on error
      }
    });
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  goBack(): void {
    this.router.navigate(['/home/students-management']);
  }

  // Add the missing methods that were causing errors
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

  // Additional methods for the template functionality
  editStudent(student: Student): void {
    // Navigate to edit page or open edit modal
    console.log('Edit student:', student);
    // Implement edit functionality
  }

  makePayment(student: Student): void {
    // Open payment modal or navigate to payment page
    console.log('Make payment for student:', student);
    // Implement payment functionality
  }

  printReport(student: Student): void {
    // Print student report
    console.log('Print report for student:', student);
    // Implement print functionality
  }
}