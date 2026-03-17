import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';

interface Class {
  _id: string;
  name: string;
  subject: string;
  academicYear: string;
  price: number;
  teacher?: {
    _id: string;
    name: string;
  };
  students?: any[];
  paymentSystem: 'monthly' | 'rounds';
  schedule?: Array<{
    day: string;
    time: string;
    classroom?: {
      name: string;
    };
  }>;
  createdAt: Date;
}

@Component({
  selector: 'app-lesson-management',
  standalone: true,
  imports: [CommonModule, RouterModule, HttpClientModule, FormsModule],
  template: `
    <div class="dashboard-wrapper" dir="rtl">
      <header class="page-header">
        <div class="header-content">
          <div>
            <h1>إدارة الحصص والدروس</h1>
            <p class="subtitle">قم بتنظيم ومتابعة كافة الحصص التعليمية في مكان واحد</p>
          </div>
          <div class="header-actions">
            <button class="btn btn-primary" (click)="openAddLessonDialog()">
              <i class="fas fa-plus"></i> إضافة حصة جديدة
            </button>
            <button class="btn btn-outline" (click)="exportToExcel()">
              <i class="fas fa-file-export"></i> تصدير البيانات
            </button>
          </div>
        </div>
      </header>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon blue"><i class="fas fa-book"></i></div>
          <div class="stat-info">
            <span class="label">إجمالي الحصص</span>
            <span class="value">{{ lessons.length }}</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon green"><i class="fas fa-users"></i></div>
          <div class="stat-info">
            <span class="label">إجمالي الطلاب</span>
            <span class="value">{{ getTotalStudents() }}</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon orange"><i class="fas fa-wallet"></i></div>
          <div class="stat-info">
            <span class="label">متوسط السعر</span>
            <span class="value">{{ formatPrice(getAveragePrice()) }}</span>
          </div>
        </div>
      </div>

      <section class="filter-section">
        <div class="filter-grid">
          <div class="form-group">
            <label>المادة</label>
            <select [(ngModel)]="filterSubject" (change)="applyFilter()" class="form-control">
              <option value="">كل المواد</option>
              <option *ngFor="let s of subjects" [value]="s">{{s}}</option>
            </select>
          </div>
          <div class="form-group">
            <label>المستوى الدراسي</label>
            <select [(ngModel)]="filterAcademicYear" (change)="applyFilter()" class="form-control">
              <option value="">كل المستويات</option>
              <option *ngFor="let y of academicYears" [value]="y">{{y}}</option>
            </select>
          </div>
          <div class="form-group">
            <label>بحث عن أستاذ</label>
            <input type="text" [(ngModel)]="filterTeacher" (input)="applyFilter()" 
                   placeholder="اسم الأستاذ..." class="form-control">
          </div>
          <div class="filter-btns">
             <button class="btn btn-secondary" (click)="clearFilters()">مسح التصفية</button>
          </div>
        </div>
      </section>

      <div class="table-container shadow">
        <div class="table-header-actions" *ngIf="selectedLessons.size > 0">
           <span>تم تحديد {{ selectedLessons.size }} حصة</span>
           <button class="btn btn-danger btn-sm" (click)="deleteSelectedLessons()">حذف المحدد</button>
        </div>

        <table class="custom-table">
          <thead>
            <tr>
              <th width="40">
                <input type="checkbox" (change)="toggleAllSelection()" 
                       [checked]="selectedLessons.size === paginatedLessons.length && paginatedLessons.length > 0">
              </th>
              <th (click)="onSort('name')" class="sortable">اسم الحصة <i class="fas fa-sort"></i></th>
              <th>المادة</th>
              <th>الأستاذ</th>
              <th>المستوى</th>
              <th>السعر</th>
              <th>النظام</th>
              <th>الطلاب</th>
              <th class="text-center">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let lesson of paginatedLessons" (click)="navigateToDetails(lesson._id)" class="clickable-row">
              <td (click)="$event.stopPropagation()">
                <input type="checkbox" [checked]="selectedLessons.has(lesson._id)" 
                       (change)="toggleSelection(lesson._id, $event)">
              </td>
              <td><strong>{{ lesson.name }}</strong></td>
              <td><span class="badge badge-info">{{ lesson.subject }}</span></td>
              <td>{{ getTeacherName(lesson) }}</td>
              <td>{{ lesson.academicYear }}</td>
              <td>{{ formatPrice(lesson.price) }}</td>
              <td>
                <span [class]="'system-tag ' + lesson.paymentSystem">
                  {{ getPaymentSystemText(lesson.paymentSystem) }}
                </span>
              </td>
              <td>
                <div class="student-count">
                  <i class="fas fa-user-graduate"></i> {{ getStudentsCount(lesson) }}
                </div>
              </td>
              <td class="text-center" (click)="$event.stopPropagation()">
                <div class="action-btns">
                  <button class="icon-btn edit" (click)="navigateToDetails(lesson._id)" title="تعديل">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button class="icon-btn delete" (click)="deleteLesson(lesson._id, $event)" title="حذف">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
            <tr *ngIf="filteredLessons.length === 0">
              <td colspan="9" class="empty-state">
                <i class="fas fa-folder-open"></i>
                <p>لا توجد نتائج تطابق بحثك</p>
              </td>
            </tr>
          </tbody>
        </table>

        <div class="pagination-footer">
          <span class="total-info">عرض {{ paginatedLessons.length }} من {{ totalItems }}</span>
          <div class="pagination-controls">
            <button [disabled]="currentPage === 1" (click)="prevPage()" class="page-btn">السابق</button>
            <button *ngFor="let page of getVisiblePages()" 
                    [class.active]="currentPage === page"
                    (click)="page !== '...' ? goToPage(page) : null"
                    class="page-btn">
              {{ page }}
            </button>
            <button [disabled]="currentPage === totalPages" (click)="nextPage()" class="page-btn">التالي</button>
          </div>
        </div>
      </div>

      <div class="popup-backdrop" *ngIf="showAddDialog">
        <div class="popup-container">
          <div class="popup-header">
            <h3>إنشاء حصة تعليمية جديدة</h3>
            <button class="close-btn" (click)="showAddDialog = false">&times;</button>
          </div>
          <div class="popup-body">
            <div class="form-grid">
              <div class="form-group full">
                <label>اسم الحصة *</label>
                <input type="text" [(ngModel)]="newLesson.name" class="form-control" placeholder="مثلاً: مراجعة الميكانيك للباكالوريا">
              </div>
              <div class="form-group">
                <label>المادة</label>
                <select [(ngModel)]="newLesson.subject" class="form-control">
                  <option *ngFor="let s of subjects" [value]="s">{{s}}</option>
                </select>
              </div>
              <div class="form-group">
                <label>المستوى</label>
                <select [(ngModel)]="newLesson.academicYear" class="form-control">
                  <option *ngFor="let y of academicYears" [value]="y">{{y}}</option>
                </select>
              </div>
              <div class="form-group">
                <label>الأستاذ</label>
                <select [(ngModel)]="newLesson.teacher" class="form-control">
                  <option *ngFor="let t of teachers" [value]="t._id">{{t.name}}</option>
                </select>
              </div>
              <div class="form-group">
                <label>سعر الحصة (د.ج)</label>
                <input type="number" [(ngModel)]="newLesson.price" class="form-control">
              </div>
              <div class="form-group">
                <label>نظام الدفع</label>
                <select [(ngModel)]="newLesson.paymentSystem" class="form-control">
                  <option value="monthly">شهري</option>
                  <option value="rounds">جولات</option>
                </select>
              </div>
            </div>

            <div class="schedule-section">
              <div class="section-title">
                <h4>التوقيت والمكان</h4>
                <button class="btn-text" (click)="addScheduleRow()">+ إضافة موعد</button>
              </div>
              <div class="schedule-row" *ngFor="let row of newLesson.schedule; let i = index">
                <select [(ngModel)]="row.day" class="form-control small">
                  <option value="">اليوم</option>
                  <option *ngFor="let d of days" [value]="d">{{d}}</option>
                </select>
                <input type="time" [(ngModel)]="row.time" class="form-control small">
                <select [(ngModel)]="row.classroom" class="form-control small">
                  <option value="">القاعة</option>
                  <option *ngFor="let c of classrooms" [value]="c._id">{{c.name}}</option>
                </select>
                <button class="remove-btn" (click)="removeScheduleRow(i)">&times;</button>
              </div>
            </div>
          </div>
          <div class="popup-footer">
            <button class="btn btn-outline" (click)="showAddDialog = false">إلغاء</button>
            <button class="btn btn-primary" (click)="createLesson()" [disabled]="loading">
              {{ loading ? 'جاري الحفظ...' : 'حفظ الحصة' }}
            </button>
          </div>
        </div>
      </div>

      <div class="toast success" *ngIf="successMessage">{{ successMessage }}</div>
      <div class="toast error" *ngIf="errorMessage">{{ errorMessage }}</div>
    </div>
  `,
  styles: [`
    :host {
      --primary: #4361ee;
      --secondary: #7209b7;
      --success: #4cc9f0;
      --danger: #f72585;
      --bg: #f8f9fc;
      --text-main: #2b2d42;
      --text-muted: #8d99ae;
      --white: #ffffff;
      --border: #edf2f4;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    .dashboard-wrapper {
      padding: 2rem;
      background: var(--bg);
      min-height: 100vh;
      color: var(--text-main);
    }

    /* Header */
    .page-header {
      margin-bottom: 2rem;
    }
    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .page-header h1 {
      font-size: 1.8rem;
      font-weight: 700;
      margin: 0;
      color: var(--text-main);
    }
    .subtitle { color: var(--text-muted); margin-top: 5px; }

    /* Stats */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }
    .stat-card {
      background: var(--white);
      padding: 1.5rem;
      border-radius: 12px;
      display: flex;
      align-items: center;
      box-shadow: 0 4px 6px rgba(0,0,0,0.02);
    }
    .stat-icon {
      width: 50px;
      height: 50px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      margin-left: 1rem;
    }
    .stat-icon.blue { background: #e0e7ff; color: #4361ee; }
    .stat-icon.green { background: #dcfce7; color: #16a34a; }
    .stat-icon.orange { background: #ffedd5; color: #ea580c; }
    .stat-info .label { font-size: 0.9rem; color: var(--text-muted); display: block; }
    .stat-info .value { font-size: 1.4rem; font-weight: 700; }

    /* Buttons */
    .btn {
      padding: 0.6rem 1.2rem;
      border-radius: 8px;
      border: none;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.3s;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
    .btn-primary { background: var(--primary); color: white; }
    .btn-primary:hover { background: #3046bc; transform: translateY(-2px); }
    .btn-outline { background: transparent; border: 1.5px solid var(--border); }
    .btn-danger { background: var(--danger); color: white; }

    /* Table */
    .table-container {
      background: var(--white);
      border-radius: 12px;
      overflow: hidden;
      margin-top: 2rem;
    }
    .custom-table {
      width: 100%;
      border-collapse: collapse;
      text-align: right;
    }
    .custom-table th {
      background: #f1f5f9;
      padding: 1rem;
      font-weight: 600;
      color: #64748b;
      font-size: 0.85rem;
    }
    .custom-table td {
      padding: 1rem;
      border-bottom: 1px solid var(--border);
    }
    .clickable-row:hover { background: #f8fafc; cursor: pointer; }
    
    .badge {
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .badge-info { background: #e0f2fe; color: #0369a1; }
    
    .system-tag {
      padding: 3px 8px;
      border-radius: 5px;
      font-size: 0.8rem;
    }
    .system-tag.monthly { background: #fef3c7; color: #92400e; }
    .system-tag.rounds { background: #dcfce7; color: #166534; }

    /* Popup Logic (Replacing Modal) */
    .popup-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      backdrop-filter: blur(4px);
    }
    .popup-container {
      background: var(--white);
      width: 90%;
      max-width: 700px;
      border-radius: 16px;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
    }
    .popup-header {
      padding: 1.5rem;
      border-bottom: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .popup-body { padding: 1.5rem; }
    .popup-footer {
      padding: 1.5rem;
      border-top: 1px solid var(--border);
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
    }

    /* Forms */
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .form-group.full { grid-column: span 2; }
    .form-group label { display: block; margin-bottom: 6px; font-weight: 500; font-size: 0.9rem; }
    .form-control {
      width: 100%;
      padding: 0.6rem;
      border: 1.5px solid var(--border);
      border-radius: 8px;
      outline: none;
    }
    .form-control:focus { border-color: var(--primary); }

    /* Schedule */
    .schedule-section { margin-top: 1.5rem; background: #f8fafc; padding: 1rem; border-radius: 10px; }
    .section-title { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .schedule-row { display: grid; grid-template-columns: 1fr 1fr 1fr 40px; gap: 10px; margin-bottom: 10px; }
    
    /* Toasts */
    .toast {
      position: fixed;
      bottom: 2rem;
      left: 2rem;
      padding: 1rem 2rem;
      border-radius: 10px;
      color: white;
      z-index: 2000;
      animation: slideIn 0.3s ease;
    }
    .toast.success { background: #10b981; }
    .toast.error { background: #ef4444; }

    @keyframes slideIn { from { transform: translateX(-100%); } to { transform: translateX(0); } }

    /* Pagination */
    .pagination-footer {
      padding: 1rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid var(--border);
    }
    .page-btn {
      padding: 5px 12px;
      border: 1px solid var(--border);
      background: white;
      cursor: pointer;
      border-radius: 5px;
    }
    .page-btn.active { background: var(--primary); color: white; border-color: var(--primary); }
    .page-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  `]
})
export class LessonManagementComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  
  lessons: Class[] = [];
  filteredLessons: Class[] = [];
  loading = false;
  errorMessage = '';
  successMessage = '';
  
  filterSubject = '';
  filterAcademicYear = '';
  filterTeacher = '';
  
  showAddDialog = false;
  newLesson = {
    name: '',
    subject: '',
    academicYear: '',
    price: 0,
    teacher: '',
    description: '',
    paymentSystem: 'monthly' as 'monthly' | 'rounds',
    roundSettings: {
      sessionCount: 8,
      sessionDuration: 2,
      breakBetweenSessions: 0
    },
    schedule: [] as Array<{
      day: string;
      time: string;
      classroom: string;
    }>
  };
  
  subjects = ['رياضيات', 'فيزياء', 'علوم', 'لغة عربية', 'لغة فرنسية', 'لغة انجليزية', 'تاريخ', 'جغرافيا', 'فلسفة', 'إعلام آلي'];
  academicYears = ['1AS', '2AS', '3AS', '1MS', '2MS', '3MS', '4MS', '5MS', '1AP', '2AP', '3AP', '4AP', '5AP', 'NS'];
  days = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
  teachers: any[] = [];
  classrooms: any[] = [];
  
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  sortField = 'name';
  sortDirection: 'asc' | 'desc' = 'asc';
  selectedLessons = new Set<string>();
  
  ngOnInit(): void {
    this.loadClasses();
    this.loadTeachers();
    this.loadClassrooms();
  }
  
  loadClasses(): void {
    this.loading = true;
    this.http.get<Class[]>(`${environment.apiUrl}/classes`)
      .subscribe({
        next: (classes) => {
          this.lessons = classes;
          this.filteredLessons = [...classes];
          this.applyFilter();
          this.loading = false;
        },
        error: () => {
          this.errorMessage = 'فشل تحميل قائمة الحصص';
          this.loading = false;
        }
      });
  }

  loadTeachers(): void {
    this.http.get<any[]>(`${environment.apiUrl}/teachers`).subscribe(t => this.teachers = t);
  }

  loadClassrooms(): void {
    this.http.get<any[]>(`${environment.apiUrl}/classrooms`).subscribe(c => this.classrooms = c);
  }
  
  applyFilter(): void {
    this.filteredLessons = this.lessons.filter(lesson => {
      const matchesSubject = !this.filterSubject || lesson.subject === this.filterSubject;
      const matchesAcademicYear = !this.filterAcademicYear || lesson.academicYear === this.filterAcademicYear;
      const matchesTeacher = !this.filterTeacher || 
        lesson.teacher?.name?.toLowerCase().includes(this.filterTeacher.toLowerCase());
      return matchesSubject && matchesAcademicYear && matchesTeacher;
    });
    this.totalItems = this.filteredLessons.length;
    this.currentPage = 1;
    this.sortData();
  }
  
  clearFilters(): void {
    this.filterSubject = '';
    this.filterAcademicYear = '';
    this.filterTeacher = '';
    this.applyFilter();
  }
  
  sortData(): void {
    this.filteredLessons.sort((a, b) => {
      let valueA = a[this.sortField as keyof Class];
      let valueB = b[this.sortField as keyof Class];
      if (valueA === undefined || valueB === undefined) return 0;
      if (typeof valueA === 'string') valueA = valueA.toLowerCase();
      if (typeof valueB === 'string') valueB = valueB.toLowerCase();
      if (valueA < valueB) return this.sortDirection === 'asc' ? -1 : 1;
      if (valueA > valueB) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }
  
  onSort(field: string): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    this.sortData();
  }
  
  navigateToDetails(lessonId: string): void {
    this.router.navigate(['/home/lesson-detail', lessonId]);
  }
  
  openAddLessonDialog(): void {
    this.showAddDialog = true;
    this.newLesson = {
      name: '', subject: '', academicYear: '', price: 0, teacher: '', description: '',
      paymentSystem: 'monthly',
      roundSettings: { sessionCount: 8, sessionDuration: 2, breakBetweenSessions: 0 },
      schedule: []
    };
  }
  
  addScheduleRow(): void {
    this.newLesson.schedule.push({ day: '', time: '', classroom: '' });
  }
  
  removeScheduleRow(index: number): void {
    this.newLesson.schedule.splice(index, 1);
  }
  
  createLesson(): void {
    if (!this.newLesson.name || !this.newLesson.subject || !this.newLesson.academicYear || !this.newLesson.price) {
      this.showToast('يرجى ملء جميع الحقول المطلوبة', 'error');
      return;
    }
    
    this.loading = true;
    this.http.post(`${environment.apiUrl}/classes`, this.newLesson)
      .subscribe({
        next: (response: any) => {
          this.showToast(response.message || 'تم إنشاء الحصة بنجاح', 'success');
          this.showAddDialog = false;
          this.loadClasses();
          this.loading = false;
        },
        error: (err) => {
          this.showToast(err.error?.error || 'فشل إنشاء الحصة', 'error');
          this.loading = false;
        }
      });
  }
  
  deleteLesson(lessonId: string, event: Event): void {
    event.stopPropagation();
    if (confirm('هل أنت متأكد من حذف هذه الحصة؟')) {
      this.http.delete(`${environment.apiUrl}/classes/${lessonId}`).subscribe(() => {
        this.showToast('تم حذف الحصة بنجاح', 'success');
        this.loadClasses();
      });
    }
  }

  showToast(msg: string, type: 'success' | 'error') {
    if (type === 'success') {
      this.successMessage = msg;
      setTimeout(() => this.successMessage = '', 3000);
    } else {
      this.errorMessage = msg;
      setTimeout(() => this.errorMessage = '', 3000);
    }
  }
  
  toggleSelection(lessonId: string, event: Event): void {
    event.stopPropagation();
    this.selectedLessons.has(lessonId) ? this.selectedLessons.delete(lessonId) : this.selectedLessons.add(lessonId);
  }
  
  toggleAllSelection(): void {
    if (this.selectedLessons.size === this.paginatedLessons.length) {
      this.selectedLessons.clear();
    } else {
      this.paginatedLessons.forEach(lesson => this.selectedLessons.add(lesson._id));
    }
  }
  
  deleteSelectedLessons(): void {
    if (confirm(`حذف ${this.selectedLessons.size} حصص؟`)) {
      const promises = Array.from(this.selectedLessons).map(id => this.http.delete(`${environment.apiUrl}/classes/${id}`).toPromise());
      Promise.all(promises).then(() => {
        this.showToast('تم الحذف بنجاح', 'success');
        this.selectedLessons.clear();
        this.loadClasses();
      });
    }
  }

  get paginatedLessons(): Class[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredLessons.slice(start, start + this.itemsPerPage);
  }
  
  get totalPages(): number { return Math.ceil(this.totalItems / this.itemsPerPage); }
  
  goToPage(page: any): void { if (typeof page === 'number') this.currentPage = page; }
  prevPage(): void { if (this.currentPage > 1) this.currentPage--; }
  nextPage(): void { if (this.currentPage < this.totalPages) this.currentPage++; }
  
  formatPrice(price: number): string { return new Intl.NumberFormat('ar-DZ').format(price) + ' د.ج'; }
  getPaymentSystemText(system: string): string { return system === 'monthly' ? 'دفع شهري' : 'نظام جولات'; }
  getStudentsCount(lesson: Class): number { return lesson.students?.length || 0; }
  getTeacherName(lesson: Class): string { return lesson.teacher?.name || 'غير محدد'; }
  getTotalStudents(): number { return this.lessons.reduce((sum, l) => sum + (l.students?.length || 0), 0); }
  getAveragePrice(): number { return this.lessons.length ? Math.round(this.lessons.reduce((s, l) => s + l.price, 0) / this.lessons.length) : 0; }

  getVisiblePages(): (number | string)[] {
    const pages: (number | string)[] = [];
    if (this.totalPages <= 5) {
      for (let i = 1; i <= this.totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (this.currentPage > 3) pages.push('...');
      const start = Math.max(2, this.currentPage - 1);
      const end = Math.min(this.totalPages - 1, this.currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (this.currentPage < this.totalPages - 2) pages.push('...');
      pages.push(this.totalPages);
    }
    return pages;
  }
  
  exportToExcel(): void { alert('جاري تحضير ملف الإكسل...'); }
}