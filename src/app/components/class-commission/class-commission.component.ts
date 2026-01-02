import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule } from '@angular/forms';
import { AccountingService } from '../../services/accounting.service';
import Swal from 'sweetalert2';
import { TeachersService } from '../../teachers.service';
import { ClassesService } from '../../classes.service';
import { CommonModule, NgIf } from "../../../../node_modules/@angular/common/common_module.d-NEF7UaHr";
@Component({
  selector: 'app-class-commission',
  templateUrl: './class-commission.component.html',
  styleUrls: ['./class-commission.component.css'],
  imports: [CommonModule , FormsModule]
})
export class ClassCommissionComponent implements OnInit {
  commissionForm: FormGroup;
  teachers: any[] = [];
  classes: any[] = [];
  commissionData: any = null;
  loading = false;
  studentAdjustments: any[] = [];

  constructor(
    private fb: FormBuilder,
    private accountingService: AccountingService,
    private teacherService: TeachersService,
    private classService: ClassesService
  ) {
    this.commissionForm = this.fb.group({
      teacherId: ['', { validators: [] }],
      classId: ['', { validators: [] }],
      month: [new Date().toISOString().slice(0, 7)],
      round: [''],
      paymentMethod: ['cash'],
      notes: ['']
    });
  }

  ngOnInit(): void {
    this.loadTeachers();
    this.loadClasses();
  }

  loadTeachers(): void {
    this.teacherService.getTeachers().subscribe({
      next: (teachers) => {
        this.teachers = teachers;
      },
      error: (error) => {
        console.error('Error loading teachers:', error);
      }
    });
  }

  loadClasses(): void {
    this.classService.getClasses().subscribe({
      next: (classes) => {
        this.classes = classes;
      },
      error: (error) => {
        console.error('Error loading classes:', error);
      }
    });
  }

  calculateCommission(): void {
    const formData = this.commissionForm.value;
    
    if (!formData.teacherId || !formData.classId || !formData.month) {
      Swal.fire({
        title: 'تنبيه',
        text: 'يرجى اختيار الأستاذ والحصة والشهر',
        icon: 'warning'
      });
      return;
    }

    this.loading = true;
    
    const params = {
      teacherId: formData.teacherId,
      classId: formData.classId,
      month: formData.month,
      round: formData.round || undefined
    };

    this.accountingService.calculateTeacherClassCommission(params).subscribe({
      next: (data) => {
        this.commissionData = data;
        this.initializeStudentAdjustments();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error calculating commission:', error);
        Swal.fire({
          title: 'خطأ',
          text: 'فشل في حساب العمولة',
          icon: 'error'
        });
        this.loading = false;
      }
    });
  }

  initializeStudentAdjustments(): void {
    if (this.commissionData?.students) {
      this.studentAdjustments = this.commissionData.students.map((student: any) => ({
        studentId: student.student._id,
        studentName: student.student.name,
        teacherShare: student.teacherShare,
        included: true,
        removeFromCommission: false
      }));
    }
  }

  toggleStudentInclusion(studentId: string): void {
    const adjustment = this.studentAdjustments.find(s => s.studentId === studentId);
    if (adjustment) {
      adjustment.removeFromCommission = !adjustment.removeFromCommission;
      this.updateTotalCommission();
    }
  }

  updateTotalCommission(): void {
    if (!this.commissionData) return;
    
    let total = this.commissionData.summary.totalTeacherCommission;
    
    this.studentAdjustments.forEach(adjustment => {
      if (adjustment.removeFromCommission) {
        total -= adjustment.teacherShare;
      }
    });
    
    this.commissionData.summary.calculatedTotal = total;
  }

  payCommission(): void {
    if (!this.commissionData) {
      return;
    }

    const formData = this.commissionForm.value;
    
    const paymentData = {
      teacherId: formData.teacherId,
      classId: formData.classId,
      month: formData.month,
      round: formData.round || null,
      paymentMethod: formData.paymentMethod,
      notes: formData.notes,
      studentAdjustments: this.studentAdjustments
        .filter(s => s.removeFromCommission)
        .map(s => ({
          studentId: s.studentId,
          removeFromCommission: true
        }))
    };

    Swal.fire({
      title: 'دفع عمولة الحصة',
      html: `
        <div class="text-right">
          <p><strong>الأستاذ:</strong> ${this.commissionData.teacher.name}</p>
          <p><strong>الحصة:</strong> ${this.commissionData.class.name}</p>
          <p><strong>الشهر:</strong> ${this.commissionData.period.month}</p>
          <p><strong>المبلغ الإجمالي:</strong> ${this.formatCurrency(this.commissionData.summary.calculatedTotal || this.commissionData.summary.totalTeacherCommission)}</p>
          <p><strong>عدد الطلاب المشمولين:</strong> ${this.studentAdjustments.filter(s => !s.removeFromCommission).length} من ${this.commissionData.students.length}</p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'دفع',
      cancelButtonText: 'إلغاء',
      icon: 'question'
    }).then((result) => {
      if (result.isConfirmed) {
        this.loading = true;
        
        this.accountingService.payClassCommission(paymentData).subscribe({
          next: (response) => {
            Swal.fire({
              title: 'نجاح',
              text: response.message,
              icon: 'success'
            });
            this.commissionData = null;
            this.commissionForm.reset({
              month: new Date().toISOString().slice(0, 7),
              paymentMethod: 'cash'
            });
            this.loading = false;
          },
          error: (error) => {
            console.error('Error paying commission:', error);
            Swal.fire({
              title: 'خطأ',
              text: 'فشل في دفع العمولة',
              icon: 'error'
            });
            this.loading = false;
          }
        });
      }
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('ar-DZ', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('ar-EG');
  }
}