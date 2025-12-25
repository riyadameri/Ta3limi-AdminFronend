import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TeachersService, Teacher } from '../services/teachers.service';
import { ClassesService, Class } from '../classes.service';
import { LiveClassesService, LiveClass } from '../services/live-classes.service';
import { LessonsService } from '../services/lessons.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-teachers-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './teachers-management.component.html',
  styleUrls: ['./teachers-management.component.css']
})
export class TeachersManagementComponent implements OnInit {
  // Data arrays
  teachers: Teacher[] = [];
  classes: Class[] = [];
  liveClasses: LiveClass[] = [];
  teacherClasses: Class[] = [];
  teacherLiveClasses: LiveClass[] = [];
  
  // Selected teacher
  selectedTeacher: Teacher | null = null;
  selectedTeacherId: string = '';
  
  // Forms data
  newTeacher: any = {
    name: '',
    subjects: [],
    phone: '',
    email: '',
    hireDate: new Date().toISOString().split('T')[0],
    active: true
  };
  
  editTeacherData: any = {};
  
  // Filter and search
  searchTerm: string = '';
  subjectFilter: string = '';
  statusFilter: string = 'all';
  
  // Available subjects
  subjectsList = [
    'رياضيات', 'فيزياء', 'علوم', 'لغة عربية', 
    'لغة فرنسية', 'لغة انجليزية', 'تاريخ', 
    'جغرافيا', 'فلسفة', 'إعلام آلي'
  ];
  
  // UI states
  isLoading: boolean = false;
  showAddModal: boolean = false;
  showEditModal: boolean = false;
  showDetailsModal: boolean = false;
  showConfirmDeleteModal: boolean = false;
  showClassesModal: boolean = false;
  
  // Teacher statistics
  teacherStats: any = {
    totalClasses: 0,
    totalStudents: 0,
    totalLiveClasses: 0,
    thisMonthClasses: 0
  };
  
  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalItems: number = 0;
  
  @ViewChild('fileInput') fileInput!: ElementRef;

  constructor(
    private teachersService: TeachersService,
    private classesService: ClassesService,
    private liveClassesService: LiveClassesService,
    private lessonsService: LessonsService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadTeachers();
    this.loadClasses();
    this.loadLiveClasses();
  }

  // Get active teachers count - computed property
  get activeTeachersCount(): number {
    return this.teachers.filter(t => this.isTeacherActive(t)).length;
  }

  // Load teachers
  loadTeachers(): void {
    this.isLoading = true;
    this.teachersService.getTeachers().subscribe({
      next: (data) => {
        this.teachers = data;
        this.totalItems = data.length;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading teachers:', error);
        this.isLoading = false;
        alert('فشل في تحميل بيانات الأساتذة');
      }
    });
  }

  // Load classes
  loadClasses(): void {
    this.classesService.getClasses().subscribe({
      next: (data) => {
        this.classes = data;
      },
      error: (error) => {
        console.error('Error loading classes:', error);
      }
    });
  }

  // Load live classes
  loadLiveClasses(): void {
    this.liveClassesService.getLiveClasses().subscribe({
      next: (data) => {
        this.liveClasses = data;
      },
      error: (error) => {
        console.error('Error loading live classes:', error);
      }
    });
  }

  // Filter teachers
  get filteredTeachers(): Teacher[] {
    let filtered = this.teachers;
    
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(teacher => 
        teacher.name.toLowerCase().includes(term) ||
        teacher.email?.toLowerCase().includes(term) ||
        teacher.phone?.includes(term)
      );
    }
    
    if (this.subjectFilter) {
      filtered = filtered.filter(teacher => 
        teacher.subjects.includes(this.subjectFilter)
      );
    }
    
    if (this.statusFilter === 'active') {
      filtered = filtered.filter(teacher => 
        teacher.active === undefined || teacher.active === true
      );
    } else if (this.statusFilter === 'inactive') {
      filtered = filtered.filter(teacher => teacher.active === false);
    }
    
    this.totalItems = filtered.length;
    return filtered;
  }

  // Get paginated teachers
  get paginatedTeachers(): Teacher[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredTeachers.slice(startIndex, startIndex + this.itemsPerPage);
  }

  // Pagination methods
  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }

  // Select teacher
  selectTeacher(teacher: Teacher): void {
    this.selectedTeacher = teacher;
    this.selectedTeacherId = teacher._id;
    this.loadTeacherDetails();
  }

  // Load teacher details
  loadTeacherDetails(): void {
    if (!this.selectedTeacher) return;
    
    // Load teacher's classes
    this.teacherClasses = this.classes.filter(cls => 
      cls.teacher && cls.teacher._id === this.selectedTeacherId
    );
    
    // Load teacher's live classes
    this.teacherLiveClasses = this.liveClasses.filter(liveClass => 
      liveClass.teacher && liveClass.teacher._id === this.selectedTeacherId
    );
    
    // Calculate statistics
    this.calculateTeacherStats();
  }

  // Calculate teacher statistics
  calculateTeacherStats(): void {
    if (!this.selectedTeacher) return;
    
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    
    this.teacherStats = {
      totalClasses: this.teacherClasses.length,
      totalStudents: this.teacherClasses.reduce((sum, cls) => 
        sum + (cls.students ? cls.students.length : 0), 0),
      totalLiveClasses: this.teacherLiveClasses.length,
      thisMonthClasses: this.teacherLiveClasses.filter(liveClass => {
        const classDate = new Date(liveClass.date);
        return classDate.getMonth() + 1 === currentMonth && 
               classDate.getFullYear() === currentYear;
      }).length
    };
  }

  // Add new teacher
  addTeacher(): void {
    if (!this.validateTeacherForm(this.newTeacher)) {
      return;
    }
    
    this.isLoading = true;
    this.teachersService.createTeacher(this.newTeacher).subscribe({
      next: (response: any) => {
        if (response.existed) {
          alert('هذا الأستاذ موجود بالفعل في النظام');
          this.loadTeachers();
        } else {
          alert('تم إضافة الأستاذ بنجاح');
          this.loadTeachers();
          this.showAddModal = false;
          this.resetNewTeacherForm();
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error adding teacher:', error);
        alert('فشل في إضافة الأستاذ');
        this.isLoading = false;
      }
    });
  }

  // Edit teacher
  editTeacher(): void {
    if (!this.selectedTeacher || !this.validateTeacherForm(this.editTeacherData)) {
      return;
    }
    
    this.isLoading = true;
    this.teachersService.updateTeacher(this.selectedTeacher._id, this.editTeacherData).subscribe({
      next: () => {
        alert('تم تحديث بيانات الأستاذ بنجاح');
        this.loadTeachers();
        this.showEditModal = false;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error updating teacher:', error);
        alert('فشل في تحديث بيانات الأستاذ');
        this.isLoading = false;
      }
    });
  }

  // Delete teacher
  deleteTeacher(): void {
    if (!this.selectedTeacher) return;
    
    this.isLoading = true;
    this.teachersService.deleteTeacher(this.selectedTeacher._id).subscribe({
      next: () => {
        alert('تم حذف الأستاذ بنجاح');
        this.loadTeachers();
        this.selectedTeacher = null;
        this.showConfirmDeleteModal = false;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error deleting teacher:', error);
        alert('فشل في حذف الأستاذ');
        this.isLoading = false;
      }
    });
  }

  // Toggle teacher status
  toggleTeacherStatus(teacher: Teacher): void {
    const currentActive = teacher.active === undefined ? true : teacher.active;
    const updatedTeacher = { ...teacher, active: !currentActive };
    
    this.teachersService.updateTeacher(teacher._id, updatedTeacher).subscribe({
      next: () => {
        const status = !currentActive ? 'تفعيل' : 'تعطيل';
        alert(`تم ${status} الأستاذ بنجاح`);
        this.loadTeachers();
        
        if (this.selectedTeacher && this.selectedTeacher._id === teacher._id) {
          this.selectedTeacher.active = !currentActive;
        }
      },
      error: (error) => {
        console.error('Error updating teacher status:', error);
        alert('فشل في تحديث حالة الأستاذ');
      }
    });
  }

  // Validate teacher form
  validateTeacherForm(teacherData: any): boolean {
    if (!teacherData.name.trim()) {
      alert('يرجى إدخال اسم الأستاذ');
      return false;
    }
    
    if (!teacherData.subjects || teacherData.subjects.length === 0) {
      alert('يرجى اختيار مادة واحدة على الأقل');
      return false;
    }
    
    if (teacherData.email && !this.isValidEmail(teacherData.email)) {
      alert('يرجى إدخال بريد إلكتروني صحيح');
      return false;
    }
    
    return true;
  }

  // Validate email
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Reset new teacher form
  resetNewTeacherForm(): void {
    this.newTeacher = {
      name: '',
      subjects: [],
      phone: '',
      email: '',
      hireDate: new Date().toISOString().split('T')[0],
      active: true
    };
  }

  // Open edit modal
  openEditModal(teacher: Teacher): void {
    this.selectedTeacher = teacher;
    this.editTeacherData = {
      name: teacher.name,
      subjects: [...teacher.subjects],
      phone: teacher.phone || '',
      email: teacher.email || '',
      hireDate: teacher.hireDate.split('T')[0],
      active: teacher.active === undefined ? true : teacher.active
    };
    this.showEditModal = true;
  }

  // Open delete confirmation modal
  openDeleteModal(teacher: Teacher): void {
    this.selectedTeacher = teacher;
    this.showConfirmDeleteModal = true;
  }

  // Toggle subject selection
  toggleSubject(subject: string, form: 'new' | 'edit'): void {
    const teacherData = form === 'new' ? this.newTeacher : this.editTeacherData;
    const index = teacherData.subjects.indexOf(subject);
    
    if (index > -1) {
      teacherData.subjects.splice(index, 1);
    } else {
      teacherData.subjects.push(subject);
    }
  }

  // Check if subject is selected
  isSubjectSelected(subject: string, form: 'new' | 'edit'): boolean {
    const teacherData = form === 'new' ? this.newTeacher : this.editTeacherData;
    return teacherData.subjects.includes(subject);
  }

  // Get subjects text
  getSubjectsText(subjects: string[]): string {
    return subjects.join('، ');
  }

  // Format date
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG');
  }

  // Check if teacher is active
  isTeacherActive(teacher: Teacher): boolean {
    return teacher.active === undefined || teacher.active === true;
  }

  // Get teacher status text
  getTeacherStatus(teacher: Teacher): string {
    return this.isTeacherActive(teacher) ? 'نشط' : 'غير نشط';
  }

  // Export teachers to CSV
  exportToCSV(): void {
    const headers = ['الاسم', 'المواد', 'الهاتف', 'البريد الإلكتروني', 'تاريخ التعيين', 'الحالة'];
    const data = this.filteredTeachers.map(teacher => [
      teacher.name,
      teacher.subjects.join(' - '),
      teacher.phone || 'غير متوفر',
      teacher.email || 'غير متوفر',
      this.formatDate(teacher.hireDate),
      this.getTeacherStatus(teacher)
    ]);
    
    const csvContent = [
      headers.join(','),
      ...data.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `الأساتذة_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Import from CSV (simplified version)
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const content = e.target.result;
      this.processCSV(content);
    };
    reader.readAsText(file, 'UTF-8');
  }

  processCSV(content: string): void {
    // Simplified CSV processing
    const lines = content.split('\n');
    const headers = lines[0].split(',');
    
    console.log('Processing CSV file...');
    alert('وظيفة الاستيراد قيد التطوير');
    
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  // Clear filters
  clearFilters(): void {
    this.searchTerm = '';
    this.subjectFilter = '';
    this.statusFilter = 'all';
    this.currentPage = 1;
  }
  calculateClassesstudentlenght(cls : any){
    return cls.students.lenght 
  }
}