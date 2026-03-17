import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CountService } from '../../../services/count.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <nav class="main-header" dir="rtl">
      <div class="header-right">
        <div class="brand-zone">
          <div class="logo-circle">
            <i class="fas fa-graduation-cap"></i>
          </div>
          <div class="brand-text">
            <span class="app-name">نظام المنارة</span>
            <span class="app-status">لوحة التحكم التعليمية</span>
          </div>
        </div>

        <div class="search-wrapper">
          <i class="fas fa-search search-icon"></i>
          <input 
            type="text" 
            [(ngModel)]="searchTerm" 
            placeholder="بحث عن طالب، أستاذ، أو حصة..." 
            class="search-input">
        </div>
      </div>

      <div class="header-stats">
        <div class="stat-item" title="إجمالي الطلاب">
          <div class="stat-icon-mini blue"><i class="fas fa-user-graduate"></i></div>
          <div class="stat-values">
            <span class="stat-num">{{ studentCount }}</span>
            <span class="stat-label">طالب</span>
          </div>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item" title="إجمالي الأساتذة">
          <div class="stat-icon-mini purple"><i class="fas fa-chalkboard-teacher"></i></div>
          <div class="stat-values">
            <span class="stat-num">{{ teacherCount }}</span>
            <span class="stat-label">أستاذ</span>
          </div>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item" title="إجمالي الحصص">
          <div class="stat-icon-mini orange"><i class="fas fa-book-open"></i></div>
          <div class="stat-values">
            <span class="stat-num">{{ lessonCount }}</span>
            <span class="stat-label">حصة</span>
          </div>
        </div>
      </div>

      <div class="header-left">
        <div class="notification-bell">
          <i class="fas fa-bell"></i>
          <span class="badge-dot" *ngIf="notificationCount > 0">{{ notificationCount }}</span>
        </div>

        <div class="user-profile">
          <div class="user-info">
            <span class="user-name">{{ userName }}</span>
            <span class="user-role">{{ userRole }}</span>
          </div>
          <div class="avatar-wrapper">
            <img [src]="userAvatar" [alt]="userName" class="user-avatar">
            <div class="status-indicator online"></div>
          </div>
        </div>
      </div>
    </nav>
  `,
  styles: [`
    :host {
      display: block;
      --header-bg: #ffffff;
      --primary-color: #4361ee;
      --text-dark: #2b2d42;
      --text-light: #8d99ae;
      --border-color: #f0f2f5;
      --shadow: 0 2px 15px rgba(0, 0, 0, 0.05);
    }

    .main-header {
      height: 80px;
      background: var(--header-bg);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 2rem;
      border-bottom: 1px solid var(--border-color);
      box-shadow: var(--shadow);
      position: sticky;
      top: 0;
      z-index: 999;
    }

    /* Brand Section */
    .header-right {
      display: flex;
      align-items: center;
      gap: 2rem;
    }
    .brand-zone {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .logo-circle {
      width: 42px;
      height: 42px;
      background: linear-gradient(135deg, var(--primary-color), #7209b7);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 1.2rem;
    }
    .brand-text { display: flex; flex-direction: column; }
    .app-name { font-weight: 800; color: var(--text-dark); font-size: 1.1rem; }
    .app-status { font-size: 0.75rem; color: var(--text-light); }

    /* Search Bar */
    .search-wrapper {
      position: relative;
      width: 300px;
    }
    .search-input {
      width: 100%;
      padding: 10px 40px 10px 15px;
      background: #f8f9fa;
      border: 1.5px solid transparent;
      border-radius: 12px;
      font-size: 0.9rem;
      transition: all 0.3s;
    }
    .search-input:focus {
      background: white;
      border-color: var(--primary-color);
      box-shadow: 0 0 0 4px rgba(67, 97, 238, 0.1);
    }
    .search-icon {
      position: absolute;
      right: 15px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-light);
    }

    /* Stats Section */
    .header-stats {
      display: flex;
      align-items: center;
      background: #fcfcfd;
      padding: 8px 20px;
      border-radius: 50px;
      border: 1px solid var(--border-color);
    }
    .stat-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 0 10px;
    }
    .stat-icon-mini {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.9rem;
    }
    .stat-icon-mini.blue { background: #e0e7ff; color: #4361ee; }
    .stat-icon-mini.purple { background: #f3e8ff; color: #9333ea; }
    .stat-icon-mini.orange { background: #ffedd5; color: #ea580c; }
    
    .stat-values { display: flex; flex-direction: column; line-height: 1; }
    .stat-num { font-weight: 700; color: var(--text-dark); font-size: 1rem; }
    .stat-label { font-size: 0.7rem; color: var(--text-light); }
    .stat-divider { width: 1px; height: 25px; background: #e5e7eb; margin: 0 10px; }

    /* User Profile & Notifications */
    .header-left {
      display: flex;
      align-items: center;
      gap: 1.5rem;
    }
    .notification-bell {
      position: relative;
      cursor: pointer;
      color: var(--text-light);
      font-size: 1.2rem;
      transition: color 0.3s;
    }
    .notification-bell:hover { color: var(--primary-color); }
    .badge-dot {
      position: absolute;
      top: -5px;
      left: -5px;
      background: #f72585;
      color: white;
      font-size: 0.65rem;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid white;
    }

    .user-profile {
      display: flex;
      align-items: center;
      gap: 12px;
      padding-right: 1.5rem;
      border-right: 1px solid var(--border-color);
      cursor: pointer;
    }
    .user-info { text-align: left; display: flex; flex-direction: column; align-items: flex-start; }
    .user-name { font-weight: 700; color: var(--text-dark); font-size: 0.9rem; line-height: 1.2; }
    .user-role { font-size: 0.75rem; color: var(--text-light); }
    
    .avatar-wrapper { position: relative; }
    .user-avatar {
      width: 45px;
      height: 45px;
      border-radius: 12px;
      object-fit: cover;
      border: 2px solid white;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    .status-indicator {
      position: absolute;
      bottom: -2px;
      right: -2px;
      width: 12px;
      height: 12px;
      background: #10b981;
      border-radius: 50%;
      border: 2px solid white;
    }

    @media (max-width: 1024px) {
      .header-stats { display: none; }
      .search-wrapper { width: 200px; }
    }
  `]
})
export class HeaderComponent implements OnInit {
  private countService = inject(CountService);

  studentCount: number = 0;
  teacherCount: number = 0;
  lessonCount: number = 0;
  userName: string = 'جاري التحميل...';
  userRole: string = '';
  userAvatar: string = 'https://ui-avatars.com/api/?name=User&background=random';
  notificationCount: number = 3;
  searchTerm: any;

  ngOnInit(): void {
    this.loadStats();
    this.loadUserData();
  }

  loadStats(): void {
    forkJoin({
      students: this.countService.getStudentsNumber(),
      teachers: this.countService.getTeachersNumber(),
      classes: this.countService.getClassesNumber()
    }).subscribe({
      next: (res) => {
        this.studentCount = res.students.count;
        this.teacherCount = res.teachers.count;
        this.lessonCount = res.classes.count;
      },
      error: (err) => console.error('Error fetching stats:', err)
    });
  }

  loadUserData(): void {
    setTimeout(() => {
      this.userName = 'ياسر خيشه';
      this.userRole = 'مدير النظام';
      this.userAvatar = 'https://ui-avatars.com/api/?name=ياسر+خيشه&background=4361ee&color=fff';
    }, 800);
  }
}