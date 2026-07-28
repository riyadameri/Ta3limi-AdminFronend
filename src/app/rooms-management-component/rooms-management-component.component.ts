import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment.development';

export interface Classroom {
  _id?: string;
  schoolId?: string;
  name: string;
  capacity: number;
  floor: number;
  building: string;
  location: string;
  color: string;
  equipment: string[];
  status: 'available' | 'occupied' | 'maintenance';
  description?: string;
  floorArea?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

@Component({
  selector: 'app-rooms-management',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  template: `
    <div class="rooms-container">
      <!-- School Info Header -->
      <div class="school-header" *ngIf="school">
        <div class="school-info">
          <i class="fas fa-school"></i>
          <div>
            <h2>{{ school.name }}</h2>
            <p>{{ school.email }} | {{ school.phone }}</p>
          </div>
          <span class="school-id">#{{ schoolId }}</span>
        </div>
      </div>

      <!-- Page Header -->
      <div class="page-header">
        <div class="header-content">
          <div class="title-section">
            <h1><i class="fas fa-chalkboard"></i> إدارة الغرف الدراسية</h1>
            <p class="subtitle">إدارة وتنظيم جميع الغرف الدراسية في {{ getSchoolDisplayName() }}</p>
          </div>
          <button class="btn btn-primary btn-add" (click)="openAddDialog()">
            <i class="fas fa-plus-circle"></i> إضافة غرفة جديدة
          </button>
        </div>
      </div>

      <!-- Statistics -->
      <div class="stats-grid" *ngIf="!isLoading">
        <div class="stat-card">
          <div class="stat-icon total"><i class="fas fa-door-open"></i></div>
          <div class="stat-info">
            <span class="stat-value">{{ statistics.totalRooms }}</span>
            <span class="stat-label">إجمالي الغرف</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon available"><i class="fas fa-check-circle"></i></div>
          <div class="stat-info">
            <span class="stat-value">{{ statistics.availableRooms }}</span>
            <span class="stat-label">غرف متاحة</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon occupied"><i class="fas fa-users"></i></div>
          <div class="stat-info">
            <span class="stat-value">{{ statistics.occupiedRooms }}</span>
            <span class="stat-label">غرف مشغولة</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon maintenance"><i class="fas fa-tools"></i></div>
          <div class="stat-info">
            <span class="stat-value">{{ statistics.maintenanceRooms }}</span>
            <span class="stat-label">قيد الصيانة</span>
          </div>
        </div>
      </div>

      <!-- Filters Bar -->
      <div class="filters-bar" *ngIf="!isLoading">
        <div class="filters-group">
          <div class="filter-item">
            <i class="fas fa-layer-group"></i>
            <select class="form-control" [(ngModel)]="filters.floor" (change)="applyFilters()">
              <option value="">كل الطوابق</option>
              <option *ngFor="let floor of availableFloors" [value]="floor">الطابق {{ floor }}</option>
            </select>
          </div>
          <div class="filter-item">
            <i class="fas fa-building"></i>
            <select class="form-control" [(ngModel)]="filters.building" (change)="applyFilters()">
              <option value="">كل المباني</option>
              <option *ngFor="let building of availableBuildings" [value]="building">{{ building }}</option>
            </select>
          </div>
          <div class="filter-item">
            <i class="fas fa-info-circle"></i>
            <select class="form-control" [(ngModel)]="filters.status" (change)="applyFilters()">
              <option value="">كل الحالات</option>
              <option value="available">متاحة</option>
              <option value="occupied">مشغولة</option>
              <option value="maintenance">قيد الصيانة</option>
            </select>
          </div>
          <div class="filter-item">
            <i class="fas fa-users"></i>
            <input type="number" class="form-control" [(ngModel)]="filters.minCapacity" 
                   (change)="applyFilters()" placeholder="الحد الأدنى للسعة">
          </div>
        </div>
        <button class="btn btn-secondary" (click)="clearFilters()">
          <i class="fas fa-undo"></i> إعادة تعيين
        </button>
      </div>

      <!-- Loading State -->
      <div class="loading-state" *ngIf="isLoading">
        <div class="spinner"></div>
        <p>جاري تحميل الغرف...</p>
      </div>

      <!-- Rooms Grid -->
      <div class="rooms-grid" *ngIf="!isLoading">
        <div *ngFor="let room of filteredRooms" class="room-card" (click)="selectRoom(room)">
          <div class="room-header" [style.background]="room.color || '#4361ee'">
            <div class="room-title">
              <h3>{{ room.name }}</h3>
              <span class="room-code">{{ room.building }}-{{ room.floor }}{{ room.name }}</span>
            </div>
            <span class="status-badge" [class]="room.status">
              {{ getStatusText(room.status) }}
            </span>
          </div>
          <div class="room-body">
            <div class="room-info-grid">
              <div class="info-item">
                <i class="fas fa-building"></i>
                <span>{{ room.building }}</span>
              </div>
              <div class="info-item">
                <i class="fas fa-layer-group"></i>
                <span>الطابق {{ room.floor }}</span>
              </div>
              <div class="info-item">
                <i class="fas fa-users"></i>
                <span>{{ room.capacity }} طالب</span>
              </div>
              <div class="info-item" *ngIf="room.location">
                <i class="fas fa-map-marker-alt"></i>
                <span>{{ room.location }}</span>
              </div>
            </div>
            <div class="room-equipment" *ngIf="room.equipment && room.equipment.length > 0">
              <span *ngFor="let item of room.equipment" class="equipment-tag">
                <i class="fas fa-check-circle"></i> {{ item }}
              </span>
            </div>
            <div class="room-actions">
              <button class="btn btn-sm btn-edit" (click)="$event.stopPropagation(); openEditDialog(room)">
                <i class="fas fa-edit"></i> تعديل
              </button>
              <button class="btn btn-sm btn-delete" (click)="$event.stopPropagation(); deleteRoom(room._id || '')">
                <i class="fas fa-trash"></i> حذف
              </button>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div class="empty-state" *ngIf="filteredRooms.length === 0">
          <i class="fas fa-door-open empty-icon"></i>
          <h3>لا توجد غرف</h3>
          <p>لم يتم العثور على أي غرف تطابق معايير البحث</p>
          <button class="btn btn-primary" (click)="openAddDialog()">
            <i class="fas fa-plus-circle"></i> إضافة غرفة جديدة
          </button>
        </div>
      </div>

      <!-- Room Details Panel -->
      <div class="details-panel" *ngIf="selectedRoom">
        <div class="panel-header">
          <h2>{{ selectedRoom.name }}</h2>
          <button class="btn btn-close" (click)="selectedRoom = null">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="panel-body">
          <div class="details-grid">
            <div class="detail-item">
              <label>المبنى</label>
              <span>{{ selectedRoom.building }}</span>
            </div>
            <div class="detail-item">
              <label>الطابق</label>
              <span>{{ selectedRoom.floor }}</span>
            </div>
            <div class="detail-item">
              <label>السعة</label>
              <span>{{ selectedRoom.capacity }} طالب</span>
            </div>
            <div class="detail-item">
              <label>الحالة</label>
              <span class="status-badge" [class]="selectedRoom.status">
                {{ getStatusText(selectedRoom.status) }}
              </span>
            </div>
            <div class="detail-item" *ngIf="selectedRoom.location">
              <label>الموقع</label>
              <span>{{ selectedRoom.location }}</span>
            </div>
            <div class="detail-item" *ngIf="selectedRoom.equipment && selectedRoom.equipment.length > 0">
              <label>التجهيزات</label>
              <span>{{ selectedRoom.equipment.join(', ') }}</span>
            </div>
            <div class="detail-item" *ngIf="selectedRoom.schoolId">
              <label>المدرسة</label>
              <span>{{ getSchoolDisplayName() }}</span>
            </div>
          </div>
          <div class="panel-actions">
            <button class="btn btn-primary" (click)="changeRoomStatus(selectedRoom, getNextStatus(selectedRoom.status))">
              <i class="fas fa-sync"></i> تغيير الحالة
            </button>
            <button class="btn btn-secondary" (click)="openEditDialog(selectedRoom)">
              <i class="fas fa-edit"></i> تعديل
            </button>
          </div>
        </div>
      </div>

      <!-- Add/Edit Dialog -->
      <div class="dialog-overlay" *ngIf="isDialogOpen">
        <div class="dialog-box">
          <div class="dialog-header">
            <h2>
              <i class="fas" [class.fa-plus-circle]="!editingRoom" [class.fa-edit]="editingRoom"></i> 
              {{ editingRoom ? 'تعديل الغرفة' : 'إضافة غرفة جديدة' }}
            </h2>
            <button class="btn btn-close" (click)="closeDialog()">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="dialog-body">
            <!-- School Info Badge -->
            <div class="school-info-badge" *ngIf="school">
              <i class="fas fa-school"></i>
              <span>{{ school.name }}</span>
              <span class="badge">ID: {{ schoolId }}</span>
            </div>
            <div class="alert alert-warning" *ngIf="!schoolId">
              <i class="fas fa-exclamation-triangle"></i>
              ⚠️ لم يتم تحديد المدرسة. يرجى تسجيل الدخول أولاً.
            </div>

            <div class="form-group">
              <label>اسم الغرفة <span class="required">*</span></label>
              <input type="text" class="form-control" [(ngModel)]="formData.name" 
                     placeholder="مثال: غرفة 101" required>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>المبنى <span class="required">*</span></label>
                <input type="text" class="form-control" [(ngModel)]="formData.building" 
                       placeholder="المبنى الرئيسي" required>
              </div>
              <div class="form-group">
                <label>الطابق <span class="required">*</span></label>
                <input type="number" class="form-control" [(ngModel)]="formData.floor" 
                       min="1" required>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>السعة <span class="required">*</span></label>
                <input type="number" class="form-control" [(ngModel)]="formData.capacity" 
                       min="1" required>
              </div>
              <div class="form-group">
                <label>الحالة</label>
                <select class="form-control" [(ngModel)]="formData.status">
                  <option value="available">متاحة</option>
                  <option value="occupied">مشغولة</option>
                  <option value="maintenance">قيد الصيانة</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label>الموقع</label>
              <input type="text" class="form-control" [(ngModel)]="formData.location" 
                     placeholder="موقع الغرفة">
            </div>
            <div class="form-group">
              <label>لون الغرفة</label>
              <div class="color-picker-group">
                <input type="color" class="color-input" [(ngModel)]="formData.color">
                <span class="color-hex">{{ formData.color || '#4361ee' }}</span>
              </div>
            </div>
            <div class="form-group">
              <label>التجهيزات</label>
              <div class="equipment-grid">
                <label class="equipment-item" *ngFor="let item of equipmentOptions">
                  <input type="checkbox" [checked]="isEquipmentSelected(item)" 
                         (change)="toggleEquipment(item)">
                  <i class="fas fa-check-circle" [class.checked]="isEquipmentSelected(item)"></i>
                  {{ item }}
                </label>
              </div>
            </div>
          </div>
          <div class="dialog-footer">
            <button class="btn btn-secondary" (click)="closeDialog()">إلغاء</button>
            <button class="btn btn-primary" (click)="saveRoom()" [disabled]="!schoolId || !isFormValid()">
              <i class="fas fa-save"></i> {{ editingRoom ? 'حفظ التغييرات' : 'إضافة الغرفة' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      --primary-color: #4361ee;
      --secondary-color: #7209b7;
      --success-color: #10b981;
      --danger-color: #ef4444;
      --warning-color: #f59e0b;
      --text-dark: #1e293b;
      --text-light: #64748b;
      --bg-light: #f8fafc;
      --border-color: #e2e8f0;
      --shadow-sm: 0 1px 3px rgba(0,0,0,0.08);
      --shadow-md: 0 4px 12px rgba(0,0,0,0.1);
      --shadow-lg: 0 8px 24px rgba(0,0,0,0.12);
      --radius: 12px;
    }

    .rooms-container {
      padding: 20px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .school-header {
      background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
      padding: 16px 24px;
      border-radius: var(--radius);
      margin-bottom: 24px;
      color: white;
    }

    .school-info {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .school-info i {
      font-size: 32px;
      opacity: 0.8;
    }

    .school-info h2 {
      margin: 0;
      font-size: 20px;
    }

    .school-info p {
      margin: 0;
      opacity: 0.8;
      font-size: 14px;
    }

    .school-id {
      background: rgba(255,255,255,0.2);
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      margin-right: auto;
    }

    .school-info-badge {
      background: var(--bg-light);
      padding: 8px 16px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
      border: 1px solid var(--border-color);
    }

    .school-info-badge i {
      color: var(--primary-color);
    }

    .school-info-badge .badge {
      background: var(--primary-color);
      color: white;
      padding: 2px 10px;
      border-radius: 12px;
      font-size: 12px;
    }

    .alert {
      padding: 12px 16px;
      border-radius: 8px;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .alert-warning {
      background: #fef3c7;
      color: #92400e;
      border: 1px solid #f59e0b;
    }

    .alert-warning i {
      color: #f59e0b;
    }

    .page-header {
      background: white;
      padding: 24px 30px;
      border-radius: var(--radius);
      margin-bottom: 24px;
      box-shadow: var(--shadow-sm);
      display: flex;
      justify-content: space-between;
      align-items: center;
      border: 1px solid var(--border-color);
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
    }

    .title-section h1 {
      margin: 0;
      font-size: 26px;
      color: var(--text-dark);
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .title-section h1 i {
      color: var(--primary-color);
    }

    .subtitle {
      margin: 4px 0 0;
      color: var(--text-light);
      font-size: 14px;
    }

    .btn-add {
      padding: 12px 24px;
      font-size: 16px;
    }

    .btn {
      padding: 8px 18px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      transition: all 0.3s ease;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    .btn-primary {
      background: var(--primary-color);
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #3651d4;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(67, 97, 238, 0.3);
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-secondary {
      background: var(--bg-light);
      color: var(--text-dark);
      border: 1px solid var(--border-color);
    }

    .btn-secondary:hover {
      background: #f1f5f9;
    }

    .btn-sm {
      padding: 5px 12px;
      font-size: 12px;
    }

    .btn-edit {
      background: #e0e7ff;
      color: var(--primary-color);
    }

    .btn-edit:hover {
      background: #c7d2fe;
    }

    .btn-delete {
      background: #fee2e2;
      color: var(--danger-color);
    }

    .btn-delete:hover {
      background: #fecaca;
    }

    .btn-close {
      background: transparent;
      color: var(--text-light);
      padding: 4px 8px;
      font-size: 20px;
    }

    .btn-close:hover {
      color: var(--danger-color);
      transform: rotate(90deg);
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      margin-bottom: 24px;
    }

    .stat-card {
      background: white;
      padding: 20px;
      border-radius: var(--radius);
      display: flex;
      align-items: center;
      gap: 16px;
      box-shadow: var(--shadow-sm);
      border: 1px solid var(--border-color);
      transition: all 0.3s ease;
    }

    .stat-card:hover {
      transform: translateY(-3px);
      box-shadow: var(--shadow-md);
    }

    .stat-icon {
      width: 52px;
      height: 52px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
    }

    .stat-icon.total {
      background: #e0e7ff;
      color: var(--primary-color);
    }

    .stat-icon.available {
      background: #d1fae5;
      color: var(--success-color);
    }

    .stat-icon.occupied {
      background: #fee2e2;
      color: var(--danger-color);
    }

    .stat-icon.maintenance {
      background: #fef3c7;
      color: var(--warning-color);
    }

    .stat-info {
      flex: 1;
    }

    .stat-value {
      display: block;
      font-size: 28px;
      font-weight: 700;
      color: var(--text-dark);
    }

    .stat-label {
      color: var(--text-light);
      font-size: 13px;
    }

    .filters-bar {
      background: white;
      padding: 16px 20px;
      border-radius: var(--radius);
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
      border: 1px solid var(--border-color);
      box-shadow: var(--shadow-sm);
    }

    .filters-group {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      align-items: center;
    }

    .filter-item {
      display: flex;
      align-items: center;
      gap: 8px;
      background: var(--bg-light);
      padding: 4px 12px 4px 8px;
      border-radius: 8px;
      border: 1px solid var(--border-color);
    }

    .filter-item i {
      color: var(--text-light);
      font-size: 14px;
    }

    .form-control {
      padding: 6px 10px;
      border: none;
      background: transparent;
      font-size: 14px;
      color: var(--text-dark);
      min-width: 120px;
    }

    .form-control:focus {
      outline: none;
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      background: white;
      border-radius: var(--radius);
    }

    .spinner {
      width: 48px;
      height: 48px;
      border: 4px solid var(--border-color);
      border-top-color: var(--primary-color);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .loading-state p {
      margin-top: 16px;
      color: var(--text-light);
    }

    .rooms-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 20px;
      margin-bottom: 24px;
    }

    .room-card {
      background: white;
      border-radius: var(--radius);
      overflow: hidden;
      box-shadow: var(--shadow-sm);
      border: 1px solid var(--border-color);
      transition: all 0.3s ease;
      cursor: pointer;
    }

    .room-card:hover {
      transform: translateY(-4px);
      box-shadow: var(--shadow-lg);
    }

    .room-header {
      padding: 16px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: white;
    }

    .room-title h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 700;
    }

    .room-code {
      font-size: 12px;
      opacity: 0.8;
    }

    .status-badge {
      padding: 4px 14px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      background: rgba(255,255,255,0.25);
      backdrop-filter: blur(4px);
    }

    .status-badge.available {
      background: var(--success-color);
      color: white;
    }

    .status-badge.occupied {
      background: var(--danger-color);
      color: white;
    }

    .status-badge.maintenance {
      background: var(--warning-color);
      color: white;
    }

    .room-body {
      padding: 16px 20px;
    }

    .room-info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-bottom: 12px;
    }

    .info-item {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--text-light);
      font-size: 13px;
    }

    .info-item i {
      width: 16px;
      color: var(--primary-color);
    }

    .room-equipment {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 12px;
    }

    .equipment-tag {
      background: var(--bg-light);
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 12px;
      color: var(--text-dark);
      border: 1px solid var(--border-color);
    }

    .equipment-tag i {
      color: var(--success-color);
      margin-left: 4px;
    }

    .room-actions {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
      border-top: 1px solid var(--border-color);
      padding-top: 12px;
    }

    .empty-state {
      grid-column: 1 / -1;
      text-align: center;
      padding: 60px 20px;
      background: white;
      border-radius: var(--radius);
      border: 2px dashed var(--border-color);
    }

    .empty-icon {
      font-size: 64px;
      color: var(--border-color);
      margin-bottom: 16px;
    }

    .empty-state h3 {
      margin: 0;
      color: var(--text-dark);
    }

    .empty-state p {
      color: var(--text-light);
      margin: 8px 0 20px;
    }

    .details-panel {
      background: white;
      border-radius: var(--radius);
      border: 1px solid var(--border-color);
      box-shadow: var(--shadow-md);
      margin-top: 24px;
      overflow: hidden;
    }

    .panel-header {
      padding: 16px 20px;
      background: var(--bg-light);
      border-bottom: 1px solid var(--border-color);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .panel-header h2 {
      margin: 0;
      font-size: 20px;
      color: var(--text-dark);
    }

    .panel-body {
      padding: 20px;
    }

    .details-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 20px;
    }

    .detail-item {
      display: flex;
      flex-direction: column;
    }

    .detail-item label {
      font-size: 12px;
      color: var(--text-light);
      margin-bottom: 4px;
    }

    .detail-item span {
      font-size: 16px;
      color: var(--text-dark);
      font-weight: 500;
    }

    .panel-actions {
      display: flex;
      gap: 12px;
      border-top: 1px solid var(--border-color);
      padding-top: 16px;
    }

    .dialog-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(15, 23, 42, 0.5);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2000;
      animation: fadeIn 0.3s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .dialog-box {
      background: white;
      border-radius: 16px;
      width: 95%;
      max-width: 600px;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: var(--shadow-lg);
      animation: slideUp 0.3s ease;
    }

    @keyframes slideUp {
      from {
        transform: translateY(20px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    .dialog-header {
      padding: 20px 24px;
      border-bottom: 2px solid var(--border-color);
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: var(--bg-light);
      border-radius: 16px 16px 0 0;
    }

    .dialog-header h2 {
      margin: 0;
      font-size: 20px;
      color: var(--text-dark);
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .dialog-header h2 i {
      color: var(--primary-color);
    }

    .dialog-body {
      padding: 24px;
    }

    .dialog-footer {
      padding: 16px 24px;
      border-top: 1px solid var(--border-color);
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      background: var(--bg-light);
      border-radius: 0 0 16px 16px;
    }

    .form-group {
      margin-bottom: 16px;
    }

    .form-group label {
      display: block;
      margin-bottom: 6px;
      font-weight: 600;
      color: var(--text-dark);
      font-size: 14px;
    }

    .required {
      color: var(--danger-color);
    }

    .form-control {
      width: 100%;
      padding: 10px 14px;
      border: 1.5px solid var(--border-color);
      border-radius: 8px;
      font-size: 14px;
      transition: border-color 0.3s ease;
      color: var(--text-dark);
      background: white;
    }

    .form-control:focus {
      outline: none;
      border-color: var(--primary-color);
      box-shadow: 0 0 0 4px rgba(67, 97, 238, 0.1);
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .color-picker-group {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .color-input {
      width: 48px;
      height: 48px;
      padding: 2px;
      border: 2px solid var(--border-color);
      border-radius: 8px;
      cursor: pointer;
    }

    .color-hex {
      font-size: 14px;
      color: var(--text-light);
      font-family: monospace;
    }

    .equipment-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
      gap: 8px;
    }

    .equipment-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: var(--bg-light);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s ease;
      font-size: 14px;
    }

    .equipment-item:hover {
      background: #f1f5f9;
    }

    .equipment-item input[type="checkbox"] {
      display: none;
    }

    .equipment-item i {
      color: var(--border-color);
      transition: color 0.3s ease;
    }

    .equipment-item i.checked {
      color: var(--success-color);
    }

    @media (max-width: 1024px) {
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 768px) {
      .rooms-container {
        padding: 12px;
      }

      .page-header {
        padding: 16px 20px;
        flex-direction: column;
        gap: 16px;
      }

      .header-content {
        flex-direction: column;
        gap: 16px;
        align-items: stretch;
      }

      .title-section h1 {
        font-size: 22px;
      }

      .btn-add {
        width: 100%;
        justify-content: center;
      }

      .stats-grid {
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }

      .stat-card {
        padding: 16px;
      }

      .stat-value {
        font-size: 22px;
      }

      .filters-bar {
        flex-direction: column;
        align-items: stretch;
      }

      .filters-group {
        flex-direction: column;
      }

      .filter-item {
        width: 100%;
      }

      .filter-item .form-control {
        width: 100%;
        min-width: unset;
      }

      .rooms-grid {
        grid-template-columns: 1fr;
      }

      .form-row {
        grid-template-columns: 1fr;
      }

      .dialog-box {
        width: 98%;
        max-height: 95vh;
      }

      .details-grid {
        grid-template-columns: 1fr;
      }

      .panel-actions {
        flex-direction: column;
      }

      .panel-actions .btn {
        width: 100%;
        justify-content: center;
      }

      .equipment-grid {
        grid-template-columns: 1fr 1fr;
      }
    }

    @media (max-width: 480px) {
      .stats-grid {
        grid-template-columns: 1fr;
      }

      .room-info-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class RoomsManagementComponent implements OnInit {
  private apiUrl = environment.apiUrl;

  schoolId: string | null = null;
  school: any = null;

  rooms: Classroom[] = [];
  filteredRooms: Classroom[] = [];
  selectedRoom: Classroom | null = null;
  isLoading = true;

  statistics = {
    totalRooms: 0,
    availableRooms: 0,
    occupiedRooms: 0,
    maintenanceRooms: 0
  };

  filters = {
    floor: '',
    building: '',
    status: '',
    minCapacity: null as number | null
  };

  availableFloors: number[] = [];
  availableBuildings: string[] = [];

  isDialogOpen = false;
  editingRoom = false;
  formData: any = {
    name: '',
    capacity: 30,
    floor: 1,
    building: '',
    location: '',
    color: '#4361ee',
    equipment: [],
    status: 'available'
  };

  equipmentOptions = ['بروجيكتور', 'سبورة ذكية', 'مكيف هواء', 'أجهزة كمبيوتر', 'نظام صوت', 'طابعة', 'شاشة تفاعلية'];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadSchoolData();
    this.loadRooms();
  }

  loadSchoolData(): void {
    try {
      const userStr = localStorage.getItem('user');
      const schoolStr = localStorage.getItem('school');
      
      console.log('🔍 تحميل بيانات المدرسة...');
      
      if (userStr) {
        const user = JSON.parse(userStr);
        this.schoolId = user?.schoolId || null;
        console.log('🏫 schoolId من الجلسة:', this.schoolId);
      }
      
      if (schoolStr) {
        this.school = JSON.parse(schoolStr);
        console.log('🏫 بيانات المدرسة:', this.school);
      }

      // محاولة الحصول على schoolId من school إذا لم يكن موجوداً
      if (!this.schoolId && this.school) {
        this.schoolId = this.school._id;
        console.log('🏫 تم استخراج schoolId من school:', this.schoolId);
      }

      if (!this.schoolId) {
        console.warn('⚠️ لا يوجد schoolId في الجلسة');
        // محاولة قراءة من التوكن
        const token = localStorage.getItem('token');
        if (token) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            if (payload.schoolId) {
              this.schoolId = payload.schoolId;
              console.log('🏫 تم استخراج schoolId من التوكن:', this.schoolId);
            }
          } catch (e) {
            console.error('❌ خطأ في فك التوكن:', e);
          }
        }
      }
    } catch (error) {
      console.error('❌ خطأ في تحميل بيانات المدرسة:', error);
    }
  }

  loadRooms(): void {
    this.isLoading = true;

    const token = localStorage.getItem('token');
    if (!token) {
      console.error('❌ لا يوجد توكن');
      this.isLoading = false;
      return;
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    // إرسال schoolId كـ query param
    let url = `${this.apiUrl}/classrooms`;
    if (this.schoolId) {
      url += `?schoolId=${this.schoolId}`;
    }

    console.log('📤 جلب الغرف من:', url);

    this.http.get<Classroom[]>(url, { headers }).subscribe({
      next: (rooms) => {
        console.log(`✅ تم جلب ${rooms.length} غرفة للمدرسة ${this.schoolId}`);
        this.rooms = rooms;
        this.filteredRooms = [...rooms];
        this.updateStatistics();
        this.extractFilterOptions();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ خطأ في جلب الغرف:', error);
        console.error('❌ تفاصيل الخطأ:', error.error);
        this.isLoading = false;
        this.rooms = [];
        this.filteredRooms = [];
        this.updateStatistics();
      }
    });
  }

  updateStatistics(): void {
    this.statistics.totalRooms = this.rooms.length;
    this.statistics.availableRooms = this.rooms.filter(r => r.status === 'available').length;
    this.statistics.occupiedRooms = this.rooms.filter(r => r.status === 'occupied').length;
    this.statistics.maintenanceRooms = this.rooms.filter(r => r.status === 'maintenance').length;
  }

  extractFilterOptions(): void {
    const floors = new Set<number>();
    const buildings = new Set<string>();
    
    this.rooms.forEach(room => {
      if (room.floor) floors.add(room.floor);
      if (room.building) buildings.add(room.building);
    });
    
    this.availableFloors = Array.from(floors).sort((a, b) => a - b);
    this.availableBuildings = Array.from(buildings);
  }

  applyFilters(): void {
    this.filteredRooms = this.rooms.filter(room => {
      if (this.filters.floor && room.floor !== parseInt(this.filters.floor)) return false;
      if (this.filters.building && room.building !== this.filters.building) return false;
      if (this.filters.status && room.status !== this.filters.status) return false;
      if (this.filters.minCapacity && room.capacity < this.filters.minCapacity) return false;
      return true;
    });
  }

  clearFilters(): void {
    this.filters = {
      floor: '',
      building: '',
      status: '',
      minCapacity: null
    };
    this.applyFilters();
  }

  openAddDialog(): void {
    // التحقق من وجود schoolId
    if (!this.schoolId) {
      alert('⚠️ يجب تسجيل الدخول أولاً أو تحديد المدرسة');
      // محاولة تحميل البيانات مرة أخرى
      this.loadSchoolData();
      return;
    }

    this.editingRoom = false;
    this.formData = {
      name: '',
      capacity: 30,
      floor: 1,
      building: '',
      location: '',
      color: '#4361ee',
      equipment: [],
      status: 'available'
    };
    this.isDialogOpen = true;
  }

  openEditDialog(room: Classroom): void {
    this.editingRoom = true;
    this.formData = { ...room };
    this.isDialogOpen = true;
  }

  closeDialog(): void {
    this.isDialogOpen = false;
    this.editingRoom = false;
  }

  isFormValid(): boolean {
    return !!(this.formData.name && 
              this.formData.name.trim() && 
              this.formData.building && 
              this.formData.building.trim() && 
              this.formData.floor > 0 && 
              this.formData.capacity > 0);
  }

  saveRoom(): void {
    // التحقق من صحة البيانات
    if (!this.isFormValid()) {
      alert('⚠️ الرجاء ملء جميع الحقول المطلوبة');
      return;
    }

    // التحقق من وجود schoolId
    if (!this.schoolId) {
      alert('⚠️ يجب تسجيل الدخول أولاً');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      alert('⚠️ يرجى تسجيل الدخول أولاً');
      return;
    }

    const headers = new HttpHeaders()
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json');

    // تأكد من إرسال schoolId بشكل صحيح
    const roomData = {
      schoolId: this.schoolId,
      name: this.formData.name.trim(),
      capacity: Number(this.formData.capacity),
      floor: Number(this.formData.floor),
      building: this.formData.building.trim(),
      location: this.formData.location || '',
      color: this.formData.color || '#4361ee',
      equipment: this.formData.equipment || [],
      status: this.formData.status || 'available'
    };

    console.log('📤 إرسال بيانات الغرفة:', roomData);

    if (this.editingRoom && this.formData._id) {
      // تحديث غرفة موجودة
      this.http.put<Classroom>(`${this.apiUrl}/classrooms/${this.formData._id}`, roomData, { headers }).subscribe({
        next: (updatedRoom) => {
          console.log('✅ تم تحديث الغرفة:', updatedRoom);
          const index = this.rooms.findIndex(r => r._id === updatedRoom._id);
          if (index !== -1) {
            this.rooms[index] = updatedRoom;
          }
          this.filteredRooms = [...this.rooms];
          this.updateStatistics();
          this.extractFilterOptions();
          this.closeDialog();
          alert('✅ تم تحديث الغرفة بنجاح');
        },
        error: (error) => {
          console.error('❌ خطأ في تحديث الغرفة:', error);
          console.error('❌ تفاصيل الخطأ:', error.error);
          const errorMsg = error.error?.message || error.error?.error || 'حدث خطأ غير معروف';
          alert(`❌ حدث خطأ أثناء تحديث الغرفة: ${errorMsg}`);
        }
      });
    } else {
      // إضافة غرفة جديدة
      this.http.post<Classroom>(`${this.apiUrl}/classrooms`, roomData, { headers }).subscribe({
        next: (newRoom) => {
          console.log('✅ تم إضافة الغرفة:', newRoom);
          this.rooms.push(newRoom);
          this.filteredRooms = [...this.rooms];
          this.updateStatistics();
          this.extractFilterOptions();
          this.closeDialog();
          alert(`✅ تم إضافة الغرفة "${newRoom.name}" بنجاح في مدرسة ${this.school?.name || ''}`);
        },
        error: (error) => {
          console.error('❌ خطأ في إضافة الغرفة:', error);
          console.error('❌ تفاصيل الخطأ:', error.error);
          
          let errorMsg = 'حدث خطأ غير معروف';
          if (error.error?.message) {
            errorMsg = error.error.message;
          } else if (error.error?.error) {
            errorMsg = error.error.error;
          } else if (error.status === 400) {
            errorMsg = 'بيانات غير صالحة. تأكد من إدخال جميع الحقول المطلوبة بشكل صحيح.';
          }
          
          alert(`❌ حدث خطأ أثناء إضافة الغرفة: ${errorMsg}`);
        }
      });
    }
  }

  deleteRoom(id: string): void {
    if (!id) return;
    
    const token = localStorage.getItem('token');
    if (!token) {
      alert('⚠️ يرجى تسجيل الدخول أولاً');
      return;
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    if (confirm('⚠️ هل أنت متأكد من حذف هذه الغرفة؟')) {
      this.http.delete(`${this.apiUrl}/classrooms/${id}`, { headers }).subscribe({
        next: () => {
          this.rooms = this.rooms.filter(r => r._id !== id);
          this.filteredRooms = [...this.rooms];
          this.updateStatistics();
          this.extractFilterOptions();
          if (this.selectedRoom?._id === id) {
            this.selectedRoom = null;
          }
          alert('✅ تم حذف الغرفة بنجاح');
        },
        error: (error) => {
          console.error('❌ خطأ في حذف الغرفة:', error);
          const errorMsg = error.error?.message || error.error?.error || 'حدث خطأ غير معروف';
          alert(`❌ حدث خطأ أثناء حذف الغرفة: ${errorMsg}`);
        }
      });
    }
  }

  selectRoom(room: Classroom): void {
    this.selectedRoom = room;
  }

  changeRoomStatus(room: Classroom, newStatus: 'available' | 'occupied' | 'maintenance'): void {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('⚠️ يرجى تسجيل الدخول أولاً');
      return;
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    const updatedRoom = { ...room, status: newStatus };
    this.http.put<Classroom>(`${this.apiUrl}/classrooms/${room._id}`, updatedRoom, { headers }).subscribe({
      next: (result) => {
        const index = this.rooms.findIndex(r => r._id === result._id);
        if (index !== -1) {
          this.rooms[index] = result;
        }
        this.filteredRooms = [...this.rooms];
        this.updateStatistics();
        if (this.selectedRoom?._id === result._id) {
          this.selectedRoom = result;
        }
        alert(`✅ تم تغيير حالة الغرفة إلى ${this.getStatusText(newStatus)}`);
      },
      error: (error) => {
        console.error('❌ خطأ في تغيير حالة الغرفة:', error);
        alert('❌ حدث خطأ أثناء تغيير حالة الغرفة');
      }
    });
  }

  getStatusText(status: string): string {
    switch(status) {
      case 'available': return '🟢 متاحة';
      case 'occupied': return '🔴 مشغولة';
      case 'maintenance': return '🟡 قيد الصيانة';
      default: return '❓ غير معروف';
    }
  }

  getNextStatus(currentStatus: string): 'available' | 'occupied' | 'maintenance' {
    switch(currentStatus) {
      case 'available': return 'occupied';
      case 'occupied': return 'maintenance';
      case 'maintenance': return 'available';
      default: return 'available';
    }
  }

  isEquipmentSelected(item: string): boolean {
    return this.formData.equipment?.includes(item) || false;
  }

  toggleEquipment(item: string): void {
    const index = this.formData.equipment.indexOf(item);
    if (index > -1) {
      this.formData.equipment.splice(index, 1);
    } else {
      this.formData.equipment.push(item);
    }
  }

  getSchoolDisplayName(): string {
    return this.school?.name || 'المدرسة';
  }
}