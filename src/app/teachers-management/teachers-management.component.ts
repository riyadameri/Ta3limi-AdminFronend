import { Component, OnInit, ViewChild, ElementRef, inject } from '@angular/core';
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
  template: `
    <div class="dashboard-container" dir="rtl">
      <header class="page-header">
        <div class="header-title">
          <h1>إدارة هيئة التدريس</h1>
          <p>إدارة بيانات الأساتذة، تخصصاتهم، ومتابعة أدائهم الأكاديمي</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-primary" (click)="openAddPopup()">
            <i class="fas fa-plus"></i> إضافة أستاذ جديد
          </button>
          <button class="btn btn-outline" (click)="exportToCSV()">
            <i class="fas fa-file-export"></i> تصدير البيانات
          </button>
        </div>
      </header>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon blue"><i class="fas fa-chalkboard-teacher"></i></div>
          <div class="stat-content">
            <span class="stat-label">إجمالي الأساتذة</span>
            <span class="stat-value">{{ teachers.length }}</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon green"><i class="fas fa-user-check"></i></div>
          <div class="stat-content">
            <span class="stat-label">الأساتذة النشطين</span>
            <span class="stat-value">{{ activeTeachersCount }}</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon orange"><i class="fas fa-book-reader"></i></div>
          <div class="stat-content">
            <span class="stat-label">إجمالي المواد</span>
            <span class="stat-value">{{ subjectsList.length }}</span>
          </div>
        </div>
      </div>

      <div class="filter-bar shadow-sm">
        <div class="search-box">
          <i class="fas fa-search"></i>
          <input type="text" [(ngModel)]="searchTerm" placeholder="ابحث باسم الأستاذ، الهاتف أو البريد...">
        </div>
        <div class="filter-group">
          <select [(ngModel)]="subjectFilter" class="form-select">
            <option value="">كل المواد</option>
            <option *ngFor="let s of subjectsList" [value]="s">{{s}}</option>
          </select>
          <select [(ngModel)]="statusFilter" class="form-select">
            <option value="all">كل الحالات</option>
            <option value="active">نشط</option>
            <option value="inactive">غير نشط</option>
          </select>
          <button class="btn-clear" (click)="clearFilters()">مسح التصفية</button>
        </div>
      </div>

      <div class="table-responsive shadow-sm">
        <table class="data-table">
          <thead>
            <tr>
              <th>الأستاذ</th>
              <th>المواد التخصصية</th>
              <th>بيانات التواصل</th>
              <th>تاريخ التعيين</th>
              <th>الحالة</th>
              <th class="text-center">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let teacher of paginatedTeachers" class="row-hover">
              <td>
                <div class="teacher-info">
                  <div class="avatar-circle">{{ teacher.name[0] }}</div>
                  <span class="teacher-name">{{ teacher.name }}</span>
                </div>
              </td>
              <td>
                <div class="subject-tags">
                  <span *ngFor="let s of teacher.subjects" class="tag">{{ s }}</span>
                </div>
              </td>
              <td>
                <div class="contact-info">
                  <span><i class="fas fa-phone"></i> {{ teacher.phone || '---' }}</span>
                  <span class="email-text">{{ teacher.email || '---' }}</span>
                </div>
              </td>
              <td>{{ formatDate(teacher.hireDate) }}</td>
              <td>
                <span [class]="'status-badge ' + (isTeacherActive(teacher) ? 'active' : 'inactive')">
                  {{ getTeacherStatus(teacher) }}
                </span>
              </td>
              <td class="text-center">
                <div class="action-buttons">
                  <button class="icon-btn info" (click)="selectTeacher(teacher); showDetailsPopup = true" title="التفاصيل">
                    <i class="fas fa-eye"></i>
                  </button>
                  <button class="icon-btn edit" (click)="openEditModal(teacher)" title="تعديل">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button class="icon-btn status" (click)="toggleTeacherStatus(teacher)" 
                          [title]="isTeacherActive(teacher) ? 'تعطيل' : 'تفعيل'">
                    <i [class]="isTeacherActive(teacher) ? 'fas fa-user-slash' : 'fas fa-user-check'"></i>
                  </button>
                  <button class="icon-btn delete" (click)="openDeleteModal(teacher)" title="حذف">
                    <i class="fas fa-trash-alt"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div class="empty-state" *ngIf="paginatedTeachers.length === 0">
          <i class="fas fa-search-minus"></i>
          <p>لا يوجد أساتذة يطابقون معايير البحث</p>
        </div>

        <div class="pagination-area">
          <span class="pagination-info">عرض {{ paginatedTeachers.length }} من أصل {{ totalItems }}</span>
          <div class="pagination-controls">
            <button class="p-btn" (click)="prevPage()" [disabled]="currentPage === 1"><i class="fas fa-chevron-right"></i></button>
            <span class="page-num">{{ currentPage }} من {{ totalPages || 1 }}</span>
            <button class="p-btn" (click)="nextPage()" [disabled]="currentPage >= totalPages"><i class="fas fa-chevron-left"></i></button>
          </div>
        </div>
      </div>

      <div class="popup-backdrop" *ngIf="showAddPopup || showEditModal">
        <div class="popup-card">
          <div class="popup-header">
            <h3>{{ showAddPopup ? 'إضافة أستاذ جديد' : 'تعديل بيانات الأستاذ' }}</h3>
            <button class="close-btn" (click)="closeAllPopups()">&times;</button>
          </div>
          <div class="popup-body">
            <div class="form-grid">
              <div class="form-group full">
                <label>الاسم الكامل</label>
                <input type="text" [(ngModel)]="activeTeacherForm.name" class="form-input">
              </div>
              <div class="form-group">
                <label>رقم الهاتف</label>
                <input type="text" [(ngModel)]="activeTeacherForm.phone" class="form-input">
              </div>
              <div class="form-group">
                <label>البريد الإلكتروني</label>
                <input type="email" [(ngModel)]="activeTeacherForm.email" class="form-input">
              </div>
              <div class="form-group full">
                <label>المواد التخصصية</label>
                <div class="subject-selection">
                  <div *ngFor="let s of subjectsList" 
                       class="subject-chip"
                       [class.selected]="activeTeacherForm.subjects?.includes(s)"
                       (click)="toggleSubject(s, showAddPopup ? 'new' : 'edit')">
                    {{ s }}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="popup-footer">
            <button class="btn btn-outline" (click)="closeAllPopups()">إلغاء</button>
            <button class="btn btn-primary" (click)="showAddPopup ? addTeacher() : editTeacher()">حفظ البيانات</button>
          </div>
        </div>
      </div>

      <div class="popup-backdrop" *ngIf="showDetailsPopup">
        <div class="popup-card large">
          <div class="popup-header">
            <h3>ملف الأستاذ: {{ selectedTeacher?.name }}</h3>
            <button class="close-btn" (click)="showDetailsPopup = false">&times;</button>
          </div>
          <div class="popup-body">
            <div class="details-layout">
              <div class="details-sidebar">
                <div class="profile-main">
                  <div class="profile-avatar">{{ selectedTeacher?.name?.[0] }}</div>
                  <h4>{{ selectedTeacher?.name }}</h4>
                  <span class="hire-date">منذ {{ formatDate(selectedTeacher?.hireDate || '') }}</span>
                </div>
                <div class="stats-mini">
                  <div class="mini-card">
                    <span class="m-val">{{ teacherStats.totalClasses }}</span>
                    <span class="m-lab">حصة مسجلة</span>
                  </div>
                  <div class="mini-card">
                    <span class="m-val">{{ teacherStats.totalStudents }}</span>
                    <span class="m-lab">طالب إجمالي</span>
                  </div>
                </div>
              </div>
              <div class="details-main">
                <h5 class="section-title">الحصص الحية هذا الشهر ({{ teacherStats.thisMonthClasses }})</h5>
                <div class="mini-table-container">
                  <table class="mini-table">
                    <thead>
                      <tr>
                        <th>عنوان الحصة</th>
                        <th>التاريخ</th>
                        <th>الحالة</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let lc of teacherLiveClasses">
                        <td>{{ lc.title }}</td>
                        <td>{{ formatDate(lc.date) }}</td>
                        <td><span class="dot-status" [class.done]="lc.status === 'completed'">{{ lc.status }}</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="popup-backdrop" *ngIf="showConfirmDeleteModal">
        <div class="popup-card small">
          <div class="popup-body text-center">
            <div class="warning-icon"><i class="fas fa-exclamation-triangle"></i></div>
            <h3>هل أنت متأكد؟</h3>
            <p>سيتم حذف الأستاذ <strong>{{ selectedTeacher?.name }}</strong> نهائياً من النظام.</p>
          </div>
          <div class="popup-footer centered">
            <button class="btn btn-outline" (click)="showConfirmDeleteModal = false">تراجع</button>
            <button class="btn btn-danger" (click)="deleteTeacher()">تأكيد الحذف</button>
          </div>
        </div>
      </div>

      <div class="loading-overlay" *ngIf="isLoading">
        <div class="spinner"></div>
        <p>جاري المعالجة...</p>
      </div>
    </div>
  `,
  styles: [`
    :host {
      --primary: #4361ee;
      --success: #4cc9f0;
      --danger: #f72585;
      --bg: #f8f9fc;
      --text-main: #2b2d42;
      --text-muted: #8d99ae;
      --white: #ffffff;
      --border: #edf2f4;
    }

    .dashboard-container { padding: 2rem; background: var(--bg); min-height: 100vh; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .header-title h1 { font-size: 1.8rem; font-weight: 700; color: var(--text-main); margin-bottom: 0.5rem; }
    .header-title p { color: var(--text-muted); }

    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin-bottom: 2rem; }
    .stat-card { background: var(--white); padding: 1.5rem; border-radius: 15px; display: flex; align-items: center; box-shadow: 0 4px 6px rgba(0,0,0,0.02); }
    .stat-icon { width: 55px; height: 55px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; margin-left: 1.2rem; }
    .stat-icon.blue { background: #e0e7ff; color: #4361ee; }
    .stat-icon.green { background: #dcfce7; color: #16a34a; }
    .stat-icon.orange { background: #ffedd5; color: #ea580c; }
    .stat-label { display: block; color: var(--text-muted); font-size: 0.9rem; }
    .stat-value { font-size: 1.6rem; font-weight: 800; color: var(--text-main); }

    .filter-bar { background: var(--white); padding: 1rem; border-radius: 12px; display: flex; flex-wrap: wrap; gap: 1rem; align-items: center; margin-bottom: 2rem; }
    .search-box { position: relative; flex: 1; min-width: 300px; }
    .search-box i { position: absolute; right: 15px; top: 50%; transform: translateY(-50%); color: var(--text-muted); }
    .search-box input { width: 100%; padding: 0.8rem 2.8rem 0.8rem 1rem; border: 1.5px solid var(--border); border-radius: 10px; outline: none; }
    .form-select { padding: 0.8rem; border: 1.5px solid var(--border); border-radius: 10px; outline: none; cursor: pointer; }
    .btn-clear { background: none; border: none; color: var(--danger); font-weight: 600; cursor: pointer; }

    .table-responsive { background: var(--white); border-radius: 15px; overflow: hidden; }
    .data-table { width: 100%; border-collapse: collapse; text-align: right; }
    .data-table th { background: #f1f5f9; padding: 1.2rem; font-weight: 600; color: #64748b; font-size: 0.9rem; }
    .data-table td { padding: 1.2rem; border-bottom: 1px solid var(--border); }
    .row-hover:hover { background: #f8fafc; }

    .avatar-circle { width: 40px; height: 40px; border-radius: 50%; background: var(--primary); color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; }
    .tag { padding: 3px 10px; background: #f1f5f9; border-radius: 20px; font-size: 0.75rem; color: #475569; }
    .status-badge { padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 600; }
    .status-badge.active { background: #dcfce7; color: #166534; }
    .status-badge.inactive { background: #fee2e2; color: #991b1b; }

    .action-buttons { display: flex; gap: 8px; justify-content: center; }
    .icon-btn { width: 34px; height: 34px; border-radius: 8px; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; }
    .icon-btn.info { background: #e0f2fe; color: #0369a1; }
    .icon-btn.edit { background: #fef3c7; color: #92400e; }
    .icon-btn.delete { background: #fee2e2; color: #991b1b; }

    .popup-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 1rem; }
    .popup-card { background: var(--white); border-radius: 18px; width: 100%; max-width: 600px; max-height: 90vh; overflow-y: auto; }
    .popup-header { padding: 1.5rem; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
    .popup-body { padding: 1.5rem; }
    .popup-footer { padding: 1.5rem; border-top: 1px solid var(--border); display: flex; justify-content: flex-end; gap: 1rem; }

    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.2rem; }
    .form-group.full { grid-column: span 2; }
    .form-input { width: 100%; padding: 0.8rem; border: 1.5px solid var(--border); border-radius: 10px; outline: none; }
    .subject-selection { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 0.5rem; }
    .subject-chip { padding: 6px 15px; background: #f1f5f9; border-radius: 30px; cursor: pointer; font-size: 0.85rem; }
    .subject-chip.selected { background: var(--primary); color: white; }

    .btn { padding: 0.8rem 1.5rem; border-radius: 10px; border: none; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; }
    .btn-primary { background: var(--primary); color: white; }
    .btn-outline { background: transparent; border: 1.5px solid var(--border); color: var(--text-main); }
    .loading-overlay { position: fixed; inset: 0; background: rgba(255,255,255,0.8); z-index: 2000; display: flex; flex-direction: column; align-items: center; justify-content: center; }
    .spinner { width: 40px; height: 40px; border: 4px solid var(--border); border-top: 4px solid var(--primary); border-radius: 50%; animation: spin 1s linear infinite; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  `]
})
export class TeachersManagementComponent implements OnInit {
  private teachersService = inject(TeachersService);
  private classesService = inject(ClassesService);
  private liveClassesService = inject(LiveClassesService);
  
  teachers: Teacher[] = [];
  classes: Class[] = [];
  liveClasses: LiveClass[] = [];
  teacherClasses: Class[] = [];
  teacherLiveClasses: LiveClass[] = [];
  
  selectedTeacher: Teacher | null = null;
  selectedTeacherId: string = '';
  
  // الكائنات والنماذج
  newTeacher: any = { name: '', subjects: [], phone: '', email: '', hireDate: new Date().toISOString().split('T')[0], active: true };
  editTeacherData: any = {};
  activeTeacherForm: any = {}; // الكائن الوسيط الذي يحل مشكلة الـ ngModel

  searchTerm: string = '';
  subjectFilter: string = '';
  statusFilter: string = 'all';
  subjectsList = ['رياضيات', 'فيزياء', 'علوم', 'لغة عربية', 'لغة فرنسية', 'لغة انجليزية', 'تاريخ', 'جغرافيا', 'فلسفة', 'إعلام آلي'];
  
  isLoading: boolean = false;
  showAddPopup: boolean = false;
  showEditModal: boolean = false;
  showDetailsPopup: boolean = false;
  showConfirmDeleteModal: boolean = false;
  
  teacherStats: any = { totalClasses: 0, totalStudents: 0, totalLiveClasses: 0, thisMonthClasses: 0 };
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalItems: number = 0;

  ngOnInit(): void {
    this.loadTeachers();
    this.loadClasses();
    this.loadLiveClasses();
  }

  // دوال فتح النوافذ المنبثقة
  openAddPopup(): void {
    this.resetNewTeacherForm();
    this.activeTeacherForm = this.newTeacher;
    this.showAddPopup = true;
  }

  openEditModal(teacher: Teacher): void {
    this.selectedTeacher = teacher;
    this.editTeacherData = { ...teacher, subjects: [...teacher.subjects], hireDate: teacher.hireDate.split('T')[0] };
    this.activeTeacherForm = this.editTeacherData;
    this.showEditModal = true;
  }

  closeAllPopups(): void {
    this.showAddPopup = false;
    this.showEditModal = false;
  }

  get activeTeachersCount(): number {
    return this.teachers.filter(t => this.isTeacherActive(t)).length;
  }

  loadTeachers(): void {
    this.isLoading = true;
    this.teachersService.getTeachers().subscribe({
      next: (data) => { this.teachers = data; this.totalItems = data.length; this.isLoading = false; },
      error: () => { this.isLoading = false; }
    });
  }

  loadClasses(): void { this.classesService.getClasses().subscribe(data => this.classes = data); }
  loadLiveClasses(): void { this.liveClassesService.getLiveClasses().subscribe(data => this.liveClasses = data); }

  get filteredTeachers(): Teacher[] {
    let filtered = this.teachers;
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(t => t.name.toLowerCase().includes(term) || t.email?.toLowerCase().includes(term));
    }
    if (this.subjectFilter) filtered = filtered.filter(t => t.subjects.includes(this.subjectFilter));
    if (this.statusFilter === 'active') filtered = filtered.filter(t => this.isTeacherActive(t));
    else if (this.statusFilter === 'inactive') filtered = filtered.filter(t => !this.isTeacherActive(t));
    this.totalItems = filtered.length;
    return filtered;
  }

  get paginatedTeachers(): Teacher[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredTeachers.slice(start, start + this.itemsPerPage);
  }

  nextPage(): void { if (this.currentPage < this.totalPages) this.currentPage++; }
  prevPage(): void { if (this.currentPage > 1) this.currentPage--; }
  get totalPages(): number { return Math.ceil(this.totalItems / this.itemsPerPage); }

  selectTeacher(teacher: Teacher): void {
    this.selectedTeacher = teacher;
    this.selectedTeacherId = teacher._id;
    this.loadTeacherDetails();
  }

  loadTeacherDetails(): void {
    if (!this.selectedTeacher) return;
    this.teacherClasses = this.classes.filter(cls => cls.teacher && cls.teacher._id === this.selectedTeacherId);
    this.teacherLiveClasses = this.liveClasses.filter(lc => lc.teacher && lc.teacher._id === this.selectedTeacherId);
    this.calculateTeacherStats();
  }

  calculateTeacherStats(): void {
    const now = new Date();
    this.teacherStats = {
      totalClasses: this.teacherClasses.length,
      totalStudents: this.teacherClasses.reduce((sum, cls) => sum + (cls.students?.length || 0), 0),
      totalLiveClasses: this.teacherLiveClasses.length,
      thisMonthClasses: this.teacherLiveClasses.filter(lc => {
        const d = new Date(lc.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }).length
    };
  }

  addTeacher(): void {
    if (!this.validateTeacherForm(this.activeTeacherForm)) return;
    this.isLoading = true;
    this.teachersService.createTeacher(this.activeTeacherForm).subscribe({
      next: () => { this.loadTeachers(); this.showAddPopup = false; this.isLoading = false; },
      error: () => { this.isLoading = false; }
    });
  }

  editTeacher(): void {
    if (!this.selectedTeacher || !this.validateTeacherForm(this.activeTeacherForm)) return;
    this.isLoading = true;
    this.teachersService.updateTeacher(this.selectedTeacher._id, this.activeTeacherForm).subscribe({
      next: () => { this.loadTeachers(); this.showEditModal = false; this.isLoading = false; },
      error: () => { this.isLoading = false; }
    });
  }

  deleteTeacher(): void {
    if (!this.selectedTeacher) return;
    this.isLoading = true;
    this.teachersService.deleteTeacher(this.selectedTeacher._id).subscribe({
      next: () => { this.loadTeachers(); this.showConfirmDeleteModal = false; this.isLoading = false; },
      error: () => { this.isLoading = false; }
    });
  }

  toggleTeacherStatus(teacher: Teacher): void {
    const current = teacher.active ?? true;
    this.teachersService.updateTeacher(teacher._id, { ...teacher, active: !current }).subscribe(() => this.loadTeachers());
  }

  validateTeacherForm(data: any): boolean {
    if (!data.name?.trim()) { alert('الاسم مطلوب'); return false; }
    if (!data.subjects?.length) { alert('اختر مادة واحدة على الأقل'); return false; }
    return true;
  }

  resetNewTeacherForm(): void {
    this.newTeacher = { name: '', subjects: [], phone: '', email: '', hireDate: new Date().toISOString().split('T')[0], active: true };
  }

  openDeleteModal(teacher: Teacher): void { this.selectedTeacher = teacher; this.showConfirmDeleteModal = true; }

  toggleSubject(subject: string, formType: 'new' | 'edit'): void {
    const data = this.activeTeacherForm;
    if (!data.subjects) data.subjects = [];
    const idx = data.subjects.indexOf(subject);
    idx > -1 ? data.subjects.splice(idx, 1) : data.subjects.push(subject);
  }

  formatDate(ds: string): string { return ds ? new Date(ds).toLocaleDateString('ar-EG') : ''; }
  isTeacherActive(t: Teacher): boolean { return t.active !== false; }
  getTeacherStatus(t: Teacher): string { return this.isTeacherActive(t) ? 'نشط' : 'غير نشط'; }

  clearFilters(): void { this.searchTerm = ''; this.subjectFilter = ''; this.statusFilter = 'all'; this.currentPage = 1; }

  exportToCSV(): void {
    const rows = this.filteredTeachers.map(t => [t.name, t.subjects.join('|'), t.phone, t.email, this.getTeacherStatus(t)]);
    const csv = 'الاسم,المواد,الهاتف,الايميل,الحالة\n' + rows.map(r => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `teachers_export.csv`;
    link.click();
  }
}