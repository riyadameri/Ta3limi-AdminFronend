import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment.development';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { SoundService } from '../sound.service';
// ==========================================
// واجهات البيانات
// ==========================================
interface Teacher {
  _id: string;
  schoolId: string;
  name: string;
  subjects: string[];
  phone?: string;
  email?: string;
  hireDate?: string;
  active: boolean;
  salaryPercentage?: number;
}

interface Class {
  _id: string;
  name: string;
  subject: string;
  teacher?: { _id: string; name: string };
  students?: any[];
  price?: number;
  academicYear?: string;
}

interface LiveClass {
  _id: string;
  class: { _id: string; name: string; subject?: string };
  teacher: { _id: string; name: string };
  date: string;
  startTime?: string;
  endTime?: string;
  title?: string;
  status: string;
  attendance?: any[];
}

interface TeacherStats {
  totalClasses: number;
  totalStudents: number;
  totalLiveClasses: number;
  thisMonthClasses: number;
  attendanceRate: number;
  subjectsCount: number;
}

interface TeacherForm {
  name: string;
  subjects: string[];
  phone: string;
  email: string;
  hireDate: string;
  active: boolean;
  salaryPercentage: number;
}

@Component({
  selector: 'app-teachers-management',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  template: `
    <!-- ========================================== -->
    <!-- الأنماط المدمجة -->
    <!-- ========================================== -->
    <style>
      :host {
        --primary: #4361ee;
        --primary-dark: #3a56d4;
        --primary-light: #e0e7ff;
        --success: #10b981;
        --success-light: #d1fae5;
        --danger: #ef4444;
        --danger-light: #fee2e2;
        --warning: #f59e0b;
        --warning-light: #fef3c7;
        --info: #3b82f6;
        --info-light: #dbeafe;
        --text-dark: #0f172a;
        --text-medium: #334155;
        --text-light: #64748b;
        --text-muted: #94a3b8;
        --bg-body: #f1f5f9;
        --bg-card: #ffffff;
        --bg-hover: #f8fafc;
        --bg-input: #ffffff;
        --border: #e2e8f0;
        --border-light: #f1f5f9;
        --radius: 16px;
        --radius-sm: 10px;
        --radius-xs: 6px;
        --shadow-sm: 0 1px 3px rgba(0,0,0,0.06);
        --shadow-md: 0 4px 20px rgba(0,0,0,0.08);
        --shadow-lg: 0 8px 40px rgba(0,0,0,0.12);
        --shadow-xl: 0 20px 60px rgba(0,0,0,0.15);
        --transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        display: block;
        width: 100%;
      }

      .teachers-wrapper {
        width: 100%;
        min-height: 100vh;
        background: var(--bg-body);
      }

      .teachers-container {
        max-width: 1400px;
        margin: 0 auto;
        padding: 20px 24px;
        font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
        direction: rtl;
      }

      @media (max-width: 768px) {
        .teachers-container {
          padding: 12px 14px;
        }
      }

      .page-header {
        margin-bottom: 24px;
      }

      .header-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 12px;
      }

      @media (max-width: 480px) {
        .header-content {
          flex-direction: column;
          align-items: stretch;
        }
      }

      .header-title h1 {
        font-size: 1.6rem;
        font-weight: 700;
        color: var(--text-dark);
        display: flex;
        align-items: center;
        gap: 10px;
        margin: 0;
      }

      .header-title h1 i {
        color: var(--primary);
      }

      @media (max-width: 768px) {
        .header-title h1 {
          font-size: 1.3rem;
        }
      }

      .subtitle {
        font-size: 0.85rem;
        color: var(--text-light);
        margin: 4px 0 0 0;
      }

      .header-actions {
        display: flex;
        gap: 8px;
      }

      @media (max-width: 480px) {
        .header-actions {
          width: 100%;
        }
        .header-actions .btn {
          flex: 1;
          justify-content: center;
        }
      }

      .btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 10px 18px;
        border: none;
        border-radius: var(--radius-sm);
        font-weight: 600;
        font-size: 0.85rem;
        cursor: pointer;
        transition: var(--transition);
        text-decoration: none;
        white-space: nowrap;
      }

      .btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .btn i {
        font-size: 0.95rem;
      }

      @media (max-width: 480px) {
        .btn {
          padding: 8px 14px;
          font-size: 0.8rem;
        }
        .btn .btn-label {
          display: none;
        }
      }

      .btn-primary {
        background: var(--primary);
        color: white;
      }

      .btn-primary:hover:not(:disabled) {
        background: var(--primary-dark);
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(67, 97, 238, 0.3);
      }

      .btn-outline {
        background: transparent;
        color: var(--text-medium);
        border: 1.5px solid var(--border);
      }

      .btn-outline:hover:not(:disabled) {
        background: var(--bg-hover);
        border-color: var(--text-light);
      }

      .btn-danger {
        background: var(--danger);
        color: white;
      }

      .btn-danger:hover:not(:disabled) {
        background: #dc2626;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
      }

      .btn-sm {
        padding: 6px 12px;
        font-size: 0.75rem;
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        gap: 12px;
        margin-bottom: 20px;
      }

      @media (max-width: 480px) {
        .stats-grid {
          grid-template-columns: 1fr 1fr 1fr;
          gap: 8px;
        }
      }

      @media (max-width: 360px) {
        .stats-grid {
          grid-template-columns: 1fr 1fr;
        }
      }

      .stat-card {
        background: var(--bg-card);
        padding: 14px 16px;
        border-radius: var(--radius);
        display: flex;
        align-items: center;
        gap: 12px;
        box-shadow: var(--shadow-sm);
        border: 1px solid var(--border-light);
        transition: var(--transition);
      }

      .stat-card:hover {
        box-shadow: var(--shadow-md);
        transform: translateY(-2px);
      }

      .stat-icon {
        width: 42px;
        height: 42px;
        border-radius: var(--radius-sm);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.1rem;
        flex-shrink: 0;
      }

      .stat-icon.primary {
        background: var(--primary-light);
        color: var(--primary);
      }

      .stat-icon.success {
        background: var(--success-light);
        color: var(--success);
      }

      .stat-icon.warning {
        background: var(--warning-light);
        color: var(--warning);
      }

      .stat-details {
        flex: 1;
        min-width: 0;
      }

      .stat-details .stat-value {
        display: block;
        font-size: 1.3rem;
        font-weight: 700;
        color: var(--text-dark);
        line-height: 1.2;
      }

      .stat-details .stat-label {
        font-size: 0.7rem;
        color: var(--text-light);
      }

      @media (max-width: 480px) {
        .stat-card {
          padding: 10px 12px;
          gap: 8px;
        }
        .stat-icon {
          width: 32px;
          height: 32px;
          font-size: 0.85rem;
        }
        .stat-details .stat-value {
          font-size: 1rem;
        }
        .stat-details .stat-label {
          font-size: 0.6rem;
        }
      }

      .filter-section {
        background: var(--bg-card);
        padding: 16px 18px;
        border-radius: var(--radius);
        margin-bottom: 20px;
        box-shadow: var(--shadow-sm);
        border: 1px solid var(--border-light);
      }

      @media (max-width: 768px) {
        .filter-section {
          padding: 12px 14px;
        }
      }

      .search-container {
        position: relative;
        margin-bottom: 12px;
      }

      .search-icon {
        position: absolute;
        right: 14px;
        top: 50%;
        transform: translateY(-50%);
        color: var(--text-muted);
        font-size: 0.9rem;
      }

      .search-input {
        width: 100%;
        padding: 10px 40px 10px 40px;
        border: 1.5px solid var(--border);
        border-radius: var(--radius-sm);
        font-size: 0.9rem;
        outline: none;
        transition: var(--transition);
        background: var(--bg-input);
      }

      .search-input:focus {
        border-color: var(--primary);
        box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.1);
      }

      .search-input::placeholder {
        color: var(--text-muted);
      }

      .clear-search {
        position: absolute;
        left: 14px;
        top: 50%;
        transform: translateY(-50%);
        background: none;
        border: none;
        color: var(--text-muted);
        cursor: pointer;
        padding: 4px;
        font-size: 0.85rem;
        transition: var(--transition);
      }

      .clear-search:hover {
        color: var(--text-medium);
      }

      .filter-controls {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        align-items: center;
      }

      @media (max-width: 768px) {
        .filter-controls {
          flex-direction: column;
          align-items: stretch;
        }
      }

      .filter-group {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        flex: 1;
      }

      @media (max-width: 768px) {
        .filter-group {
          flex-direction: column;
        }
      }

      .filter-select {
        padding: 8px 32px 8px 12px;
        border: 1.5px solid var(--border);
        border-radius: var(--radius-sm);
        background: white;
        font-size: 0.8rem;
        color: var(--text-medium);
        cursor: pointer;
        outline: none;
        min-width: 140px;
        appearance: none;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2364748b' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: left 12px center;
        transition: var(--transition);
      }

      .filter-select:focus {
        border-color: var(--primary);
        box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.1);
      }

      @media (max-width: 768px) {
        .filter-select {
          width: 100%;
          min-width: unset;
        }
      }

      .btn-clear {
        padding: 8px 16px;
        background: transparent;
        border: 1.5px solid var(--danger);
        color: var(--danger);
        border-radius: var(--radius-sm);
        cursor: pointer;
        font-size: 0.8rem;
        font-weight: 600;
        transition: var(--transition);
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }

      .btn-clear:hover {
        background: var(--danger-light);
      }

      @media (max-width: 768px) {
        .btn-clear {
          justify-content: center;
        }
      }

      .desktop-view {
        display: block;
      }

      @media (max-width: 768px) {
        .desktop-view {
          display: none;
        }
      }

      .table-container {
        background: var(--bg-card);
        border-radius: var(--radius);
        overflow: hidden;
        box-shadow: var(--shadow-sm);
        border: 1px solid var(--border-light);
      }

      .teachers-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.85rem;
      }

      .teachers-table thead {
        background: var(--bg-body);
      }

      .teachers-table thead th {
        padding: 14px 16px;
        text-align: right;
        font-weight: 600;
        color: var(--text-medium);
        font-size: 0.8rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        border-bottom: 2px solid var(--border);
        white-space: nowrap;
      }

      .teachers-table thead th.actions-col {
        text-align: center;
        width: 140px;
      }

      .teachers-table tbody .teacher-row {
        cursor: pointer;
        transition: var(--transition);
      }

      .teachers-table tbody .teacher-row:hover {
        background: var(--bg-hover);
      }

      .teachers-table tbody td {
        padding: 14px 16px;
        border-bottom: 1px solid var(--border-light);
        vertical-align: middle;
      }

      .teachers-table tbody .teacher-row:last-child td {
        border-bottom: none;
      }

      .teacher-cell {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .avatar {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: 700;
        font-size: 0.8rem;
        flex-shrink: 0;
      }

      .teacher-name {
        font-weight: 500;
        color: var(--text-dark);
      }

      .subjects-cell {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
      }

      .subject-tag {
        padding: 2px 10px;
        border-radius: 20px;
        font-size: 0.7rem;
        font-weight: 500;
        white-space: nowrap;
      }

      .subject-more {
        font-size: 0.7rem;
        color: var(--text-muted);
        padding: 2px 6px;
      }

      .contact-cell {
        display: flex;
        flex-direction: column;
        gap: 2px;
        font-size: 0.8rem;
      }

      .contact-item {
        display: flex;
        align-items: center;
        gap: 6px;
        color: var(--text-medium);
      }

      .contact-item i {
        width: 16px;
        color: var(--text-muted);
        font-size: 0.7rem;
      }

      .contact-item.email {
        font-size: 0.75rem;
      }

      .contact-empty {
        color: var(--text-muted);
        font-size: 0.75rem;
      }

      .status-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 12px 4px 16px;
        border-radius: 20px;
        font-size: 0.75rem;
        font-weight: 600;
      }

      .status-badge .status-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        display: inline-block;
      }

      .status-badge.active {
        background: var(--success-light);
        color: #065f46;
      }

      .status-badge.active .status-dot {
        background: var(--success);
      }

      .status-badge.inactive {
        background: var(--danger-light);
        color: #991b1b;
      }

      .status-badge.inactive .status-dot {
        background: var(--danger);
      }

      .action-buttons {
        display: flex;
        gap: 4px;
        justify-content: center;
      }

      .action-btn {
        width: 32px;
        height: 32px;
        border: none;
        border-radius: var(--radius-xs);
        cursor: pointer;
        transition: var(--transition);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 0.8rem;
      }

      .action-btn:hover {
        transform: scale(1.1);
      }

      .action-btn.edit {
        background: var(--warning-light);
        color: #92400e;
      }

      .action-btn.edit:hover {
        background: #fde68a;
      }

      .action-btn.toggle {
        background: var(--primary-light);
        color: var(--primary);
      }

      .action-btn.toggle:hover {
        background: #c7d2fe;
      }

      .action-btn.delete {
        background: var(--danger-light);
        color: var(--danger);
      }

      .action-btn.delete:hover {
        background: #fca5a5;
      }

      .action-btn.info {
        background: var(--info-light);
        color: #0369a1;
      }

      .action-btn.info:hover {
        background: #bae6fd;
      }

      .mobile-view {
        display: none;
      }

      @media (max-width: 768px) {
        .mobile-view {
          display: block;
        }
      }

      .teacher-card {
        background: var(--bg-card);
        border-radius: var(--radius);
        margin-bottom: 12px;
        box-shadow: var(--shadow-sm);
        border: 1px solid var(--border-light);
        overflow: hidden;
        cursor: pointer;
        transition: var(--transition);
      }

      .teacher-card:hover {
        box-shadow: var(--shadow-md);
      }

      .teacher-card:active {
        transform: scale(0.99);
      }

      .card-header {
        display: flex;
        align-items: center;
        padding: 14px 16px;
        background: var(--bg-body);
        border-bottom: 1px solid var(--border-light);
        gap: 12px;
      }

      .card-avatar {
        width: 42px;
        height: 42px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: 700;
        font-size: 0.9rem;
        flex-shrink: 0;
      }

      .card-title {
        flex: 1;
        min-width: 0;
      }

      .card-name {
        display: block;
        font-weight: 600;
        color: var(--text-dark);
        font-size: 0.95rem;
      }

      .card-status {
        display: inline-block;
        font-size: 0.65rem;
        font-weight: 600;
        padding: 2px 10px;
        border-radius: 12px;
      }

      .card-status.active {
        background: var(--success-light);
        color: #065f46;
      }

      .card-status.inactive {
        background: var(--danger-light);
        color: #991b1b;
      }

      .card-actions {
        display: flex;
        gap: 4px;
      }

      .card-actions .action-btn {
        width: 30px;
        height: 30px;
      }

      .card-body {
        padding: 12px 16px;
      }

      .card-info-row {
        display: flex;
        justify-content: space-between;
        padding: 6px 0;
        border-bottom: 1px dashed var(--border-light);
        font-size: 0.8rem;
        flex-wrap: wrap;
        gap: 6px;
      }

      .card-info-row:last-child {
        border-bottom: none;
      }

      .card-info-row .info-label {
        color: var(--text-light);
        font-weight: 500;
      }

      .card-info-row .info-value {
        color: var(--text-medium);
        font-weight: 500;
      }

      .card-subjects {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
      }

      .card-subjects .subject-tag {
        padding: 1px 8px;
        border-radius: 12px;
        font-size: 0.65rem;
        font-weight: 500;
      }

      .card-footer {
        padding: 10px 16px;
        border-top: 1px solid var(--border-light);
        display: flex;
        gap: 8px;
        justify-content: flex-end;
      }

      .footer-btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 14px;
        border: none;
        border-radius: var(--radius-xs);
        font-size: 0.7rem;
        font-weight: 600;
        cursor: pointer;
        transition: var(--transition);
      }

      .footer-btn.toggle {
        background: var(--primary-light);
        color: var(--primary);
      }

      .footer-btn.toggle:hover {
        background: #c7d2fe;
      }

      .footer-btn.view {
        background: var(--bg-body);
        color: var(--text-medium);
      }

      .footer-btn.view:hover {
        background: #e2e8f0;
      }

      .empty-state {
        text-align: center;
        padding: 50px 20px;
        color: var(--text-light);
      }

      .empty-state i {
        font-size: 3rem;
        color: var(--text-muted);
        margin-bottom: 12px;
        display: block;
      }

      .empty-state p {
        font-size: 0.95rem;
        margin-bottom: 16px;
      }

      .empty-state-cell {
        padding: 40px 20px !important;
      }

      .pagination-section {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 12px;
        padding: 16px 4px;
        margin-top: 16px;
      }

      @media (max-width: 768px) {
        .pagination-section {
          flex-direction: column;
          align-items: stretch;
        }
      }

      .pagination-info {
        font-size: 0.8rem;
        color: var(--text-light);
      }

      .pagination-controls {
        display: flex;
        align-items: center;
        gap: 6px;
        flex-wrap: wrap;
      }

      @media (max-width: 768px) {
        .pagination-controls {
          justify-content: center;
        }
      }

      .page-btn {
        width: 36px;
        height: 36px;
        border: 1.5px solid var(--border);
        border-radius: var(--radius-xs);
        background: white;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: var(--transition);
        color: var(--text-medium);
      }

      .page-btn:hover:not(:disabled) {
        background: var(--bg-hover);
        border-color: var(--primary);
        color: var(--primary);
      }

      .page-btn:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }

      .page-numbers {
        display: flex;
        gap: 4px;
      }

      .page-num {
        width: 36px;
        height: 36px;
        border: 1.5px solid transparent;
        border-radius: var(--radius-xs);
        background: transparent;
        cursor: pointer;
        transition: var(--transition);
        font-weight: 500;
        color: var(--text-medium);
      }

      .page-num:hover {
        background: var(--bg-hover);
        border-color: var(--border);
      }

      .page-num.active {
        background: var(--primary);
        color: white;
        border-color: var(--primary);
      }

      .page-num.active:hover {
        background: var(--primary-dark);
      }

      .modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        padding: 20px;
        animation: fadeIn 0.2s ease;
      }

      @media (max-width: 768px) {
        .modal-overlay {
          padding: 12px;
          align-items: flex-end;
        }
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      @keyframes slideUp {
        from { transform: translateY(20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }

      .modal-container {
        background: var(--bg-card);
        border-radius: var(--radius);
        width: 100%;
        max-width: 520px;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: var(--shadow-xl);
        animation: slideUp 0.3s ease;
      }

      .modal-container.large {
        max-width: 820px;
      }

      .modal-container.small {
        max-width: 400px;
      }

      @media (max-width: 768px) {
        .modal-container {
          max-height: 95vh;
          border-radius: var(--radius) var(--radius) 0 0;
          max-width: 100%;
        }
        .modal-container.large,
        .modal-container.small {
          max-width: 100%;
        }
      }

      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 20px;
        border-bottom: 1px solid var(--border-light);
        position: sticky;
        top: 0;
        background: var(--bg-card);
        z-index: 2;
      }

      .modal-header h3 {
        margin: 0;
        font-size: 1.1rem;
        font-weight: 700;
        color: var(--text-dark);
      }

      .modal-close {
        width: 34px;
        height: 34px;
        border: none;
        border-radius: 50%;
        background: transparent;
        cursor: pointer;
        font-size: 1.1rem;
        color: var(--text-light);
        transition: var(--transition);
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .modal-close:hover {
        background: var(--bg-hover);
        color: var(--text-dark);
      }

      .modal-body {
        padding: 20px;
      }

      .modal-body.text-center {
        text-align: center;
      }

      .modal-footer {
        padding: 16px 20px;
        border-top: 1px solid var(--border-light);
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        position: sticky;
        bottom: 0;
        background: var(--bg-card);
        border-radius: 0 0 var(--radius) var(--radius);
      }

      .modal-footer.centered {
        justify-content: center;
      }

      @media (max-width: 480px) {
        .modal-footer {
          flex-direction: column-reverse;
        }
        .modal-footer .btn {
          width: 100%;
          justify-content: center;
        }
      }

      .form-group {
        margin-bottom: 16px;
      }

      .form-group label {
        display: block;
        font-weight: 600;
        font-size: 0.8rem;
        color: var(--text-medium);
        margin-bottom: 6px;
      }

      .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }

      @media (max-width: 480px) {
        .form-row {
          grid-template-columns: 1fr;
        }
      }

      .form-input {
        width: 100%;
        padding: 10px 12px;
        border: 1.5px solid var(--border);
        border-radius: var(--radius-sm);
        font-size: 0.9rem;
        outline: none;
        transition: var(--transition);
        background: var(--bg-input);
      }

      .form-input:focus {
        border-color: var(--primary);
        box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.1);
      }

      .form-input::placeholder {
        color: var(--text-muted);
      }

      .subjects-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 4px;
      }

      .subject-chip {
        padding: 6px 14px;
        background: var(--bg-body);
        border-radius: 20px;
        border: 2px solid transparent;
        cursor: pointer;
        font-size: 0.78rem;
        transition: var(--transition);
        user-select: none;
        color: var(--text-medium);
      }

      .subject-chip:hover {
        background: #e2e8f0;
        transform: translateY(-1px);
      }

      .subject-chip.selected {
        background: var(--primary-light);
        border-color: var(--primary);
        color: var(--primary);
        font-weight: 600;
      }

      .switch-label {
        display: flex;
        align-items: center;
        gap: 12px;
        font-weight: 600;
        font-size: 0.8rem;
        color: var(--text-medium);
        cursor: pointer;
      }

      .toggle-switch {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .toggle-switch input {
        display: none;
      }

      .toggle-switch input:checked + .switch-slider {
        background: var(--success);
      }

      .toggle-switch input:checked + .switch-slider::before {
        transform: translateX(16px);
      }

      .switch-slider {
        width: 40px;
        height: 22px;
        background: var(--border);
        border-radius: 12px;
        position: relative;
        transition: var(--transition);
        cursor: pointer;
      }

      .switch-slider::before {
        content: '';
        width: 18px;
        height: 18px;
        background: white;
        border-radius: 50%;
        position: absolute;
        top: 2px;
        right: 2px;
        transition: var(--transition);
        box-shadow: 0 1px 3px rgba(0,0,0,0.2);
      }

      .switch-status {
        font-size: 0.75rem;
        color: var(--text-light);
        min-width: 40px;
      }

      .details-profile {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 16px;
        background: var(--bg-body);
        border-radius: var(--radius-sm);
        margin-bottom: 16px;
      }

      @media (max-width: 480px) {
        .details-profile {
          flex-direction: column;
          text-align: center;
        }
      }

      .profile-avatar-large {
        width: 72px;
        height: 72px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 1.8rem;
        font-weight: 700;
        flex-shrink: 0;
      }

      .profile-info {
        flex: 1;
      }

      .profile-info h4 {
        margin: 0 0 4px 0;
        font-size: 1.1rem;
      }

      .profile-status {
        display: inline-block;
        padding: 2px 12px;
        border-radius: 12px;
        font-size: 0.7rem;
        font-weight: 600;
      }

      .profile-status.active {
        background: var(--success-light);
        color: #065f46;
      }

      .profile-status.inactive {
        background: var(--danger-light);
        color: #991b1b;
      }

      .profile-contact {
        display: flex;
        gap: 12px;
        margin: 6px 0;
        font-size: 0.8rem;
        color: var(--text-medium);
        flex-wrap: wrap;
      }

      .profile-contact i {
        color: var(--text-muted);
        width: 16px;
      }

      .profile-hire {
        font-size: 0.75rem;
        color: var(--text-light);
      }

      .stats-mini-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 8px;
        margin-bottom: 16px;
      }

      @media (max-width: 480px) {
        .stats-mini-grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }

      .stat-mini {
        background: var(--bg-body);
        padding: 12px;
        border-radius: var(--radius-sm);
        text-align: center;
      }

      .stat-mini .stat-mini-value {
        display: block;
        font-size: 1.3rem;
        font-weight: 700;
        color: var(--primary);
      }

      .stat-mini .stat-mini-label {
        font-size: 0.65rem;
        color: var(--text-light);
      }

      .tab-section {
        margin-bottom: 16px;
      }

      .tab-section:last-child {
        margin-bottom: 0;
      }

      .tab-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }

      .tab-header h5 {
        margin: 0;
        font-size: 0.9rem;
        color: var(--text-dark);
      }

      .tab-header h5 i {
        color: var(--primary);
        margin-left: 6px;
      }

      .mini-list {
        border: 1px solid var(--border-light);
        border-radius: var(--radius-sm);
        overflow: hidden;
      }

      .list-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 14px;
        border-bottom: 1px solid var(--border-light);
        font-size: 0.8rem;
        transition: var(--transition);
        cursor: pointer;
      }

      .list-item:last-child {
        border-bottom: none;
      }

      .list-item:hover {
        background: var(--bg-hover);
      }

      .list-item .list-item-name {
        flex: 1;
        font-weight: 500;
        color: var(--text-dark);
      }

      .list-item .list-item-subject {
        color: var(--text-light);
        font-size: 0.75rem;
      }

      .list-item .list-item-price {
        color: var(--text-medium);
        font-weight: 500;
      }

      .list-item .list-item-students {
        color: var(--text-light);
        font-size: 0.75rem;
      }

      .list-item .list-item-time {
        color: var(--text-light);
        font-size: 0.75rem;
      }

      .list-item .list-item-status {
        font-size: 0.7rem;
        padding: 2px 10px;
        border-radius: 12px;
        background: var(--warning-light);
        color: #92400e;
      }

      .list-item .list-item-status.completed {
        background: var(--success-light);
        color: #065f46;
      }

      @media (max-width: 480px) {
        .list-item {
          flex-wrap: wrap;
          gap: 4px;
        }
        .list-item .list-item-name {
          width: 100%;
          flex: none;
        }
      }

      .empty-list {
        padding: 20px;
        text-align: center;
        color: var(--text-light);
        font-size: 0.85rem;
      }

      .delete-icon {
        font-size: 3.5rem;
        color: var(--danger);
        margin-bottom: 12px;
      }

      .delete-icon i {
        background: var(--danger-light);
        padding: 16px;
        border-radius: 50%;
      }

      .delete-warning {
        font-size: 0.8rem;
        color: var(--danger);
        margin-top: 8px;
      }

      .loading-screen {
        position: fixed;
        inset: 0;
        background: rgba(255, 255, 255, 0.85);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 2000;
        gap: 16px;
      }

      .loading-spinner {
        width: 48px;
        height: 48px;
        border: 4px solid var(--border);
        border-top-color: var(--primary);
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }

      .loading-screen p {
        color: var(--text-medium);
        font-weight: 500;
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }

      ::-webkit-scrollbar {
        width: 6px;
        height: 6px;
      }

      ::-webkit-scrollbar-track {
        background: var(--bg-body);
        border-radius: 10px;
      }

      ::-webkit-scrollbar-thumb {
        background: var(--border);
        border-radius: 10px;
      }

      ::-webkit-scrollbar-thumb:hover {
        background: var(--text-muted);
      }

      @media print {
        .header-actions,
        .filter-section,
        .action-buttons,
        .pagination-section,
        .card-actions,
        .card-footer,
        .mobile-view {
          display: none !important;
        }
        .desktop-view {
          display: block !important;
        }
        .teachers-container {
          padding: 0 !important;
        }
      }
    </style>

    <!-- ========================================== -->
    <!-- القالب (HTML) - بدون دوال سهمية -->
    <!-- ========================================== -->
    <div class="teachers-wrapper">
      <div class="teachers-container">
        
        <!-- الرأس -->
        <header class="page-header">
          <div class="header-content">
            <div class="header-title">
              <h1>
                <i class="fas fa-chalkboard-teacher"></i>
                هيئة التدريس
              </h1>
              <p class="subtitle">إدارة الأساتذة وتوزيع المواد ومتابعة الأداء</p>
            </div>
            <div class="header-actions">
              <button class="btn btn-primary" (click)="openAddPopup()">
                <i class="fas fa-plus"></i>
                <span class="btn-label">إضافة</span>
              </button>
              <button class="btn btn-outline" (click)="exportToCSV()">
                <i class="fas fa-file-export"></i>
                <span class="btn-label">تصدير</span>
              </button>
            </div>
          </div>
        </header>

        <!-- الإحصائيات -->
        <section class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon primary">
              <i class="fas fa-users"></i>
            </div>
            <div class="stat-details">
              <span class="stat-value">{{ teachers.length }}</span>
              <span class="stat-label">إجمالي الأساتذة</span>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon success">
              <i class="fas fa-user-check"></i>
            </div>
            <div class="stat-details">
              <span class="stat-value">{{ activeTeachersCount }}</span>
              <span class="stat-label">نشطون</span>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon warning">
              <i class="fas fa-book-open"></i>
            </div>
            <div class="stat-details">
              <span class="stat-value">{{ uniqueSubjects.length }}</span>
              <span class="stat-label">مواد دراسية</span>
            </div>
          </div>
        </section>

        <!-- البحث والفلترة -->
        <section class="filter-section">
          <div class="search-container">
            <i class="fas fa-search search-icon"></i>
            <input
              type="text"
              [(ngModel)]="searchTerm"
              (input)="onSearchInput()"
              placeholder="بحث باسم، هاتف، بريد أو مادة..."
              class="search-input"
            />
            <button class="clear-search" *ngIf="searchTerm" (click)="clearSearch()">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <div class="filter-controls">
            <div class="filter-group">
              <select [(ngModel)]="subjectFilter" class="filter-select">
                <option value="">كل المواد</option>
                <option *ngFor="let s of uniqueSubjects" [value]="s">{{ s }}</option>
              </select>
              
              <select [(ngModel)]="statusFilter" class="filter-select">
                <option value="all">كل الحالات</option>
                <option value="active">نشط</option>
                <option value="inactive">غير نشط</option>
              </select>
              
              <select [(ngModel)]="sortBy" class="filter-select">
                <option value="name">ترتيب: الاسم</option>
                <option value="subjects">ترتيب: عدد المواد</option>
                <option value="hireDate">ترتيب: تاريخ التعيين</option>
              </select>
            </div>
            
            <button class="btn-clear" (click)="clearFilters()">
              <i class="fas fa-undo"></i>
              مسح
            </button>
          </div>
        </section>

        <!-- عرض سطح المكتب -->
        <div class="desktop-view">
          <div class="table-container">
            <table class="teachers-table">
              <thead>
                <tr>
                  <th>الأستاذ</th>
                  <th>المواد</th>
                  <th>معلومات التواصل</th>
                  <th>تاريخ التعيين</th>
                  <th>الحالة</th>
                  <th class="actions-col">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let teacher of paginatedTeachers" 
                    class="teacher-row" 
                    (click)="selectTeacher(teacher)">
                  <td>
                    <div class="teacher-cell">
                      <div class="avatar" [style.background]="getSubjectColor(teacher.subjects[0])">
                        {{ getInitials(teacher.name) }}
                      </div>
                      <span class="teacher-name">{{ teacher.name }}</span>
                    </div>
                  </td>
                  <td>
                    <div class="subjects-cell">
                      <span *ngFor="let s of teacher.subjects.slice(0, 2)" 
                            class="subject-tag"
                            [style.background]="getSubjectColor(s) + '20'"
                            [style.color]="getSubjectColor(s)">
                        {{ s }}
                      </span>
                      <span *ngIf="teacher.subjects.length > 2" class="subject-more">
                        +{{ teacher.subjects.length - 2 }}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div class="contact-cell">
                      <span *ngIf="teacher.phone" class="contact-item">
                        <i class="fas fa-phone"></i> {{ teacher.phone }}
                      </span>
                      <span *ngIf="teacher.email" class="contact-item email">
                        <i class="fas fa-envelope"></i> {{ teacher.email }}
                      </span>
                      <span *ngIf="!teacher.phone && !teacher.email" class="contact-empty">
                        غير متوفر
                      </span>
                    </div>
                  </td>
                  <td>{{ formatDate(teacher.hireDate) }}</td>
                  <td>
                    <span class="status-badge" [class]="getStatusClass(teacher)">
                      <span class="status-dot"></span>
                      {{ getTeacherStatus(teacher) }}
                    </span>
                  </td>
                  <td>
                    <div class="action-buttons" (click)="$event.stopPropagation()">
                      <button class="action-btn edit" (click)="openEditModal(teacher)" title="تعديل">
                        <i class="fas fa-edit"></i>
                      </button>
                      <button class="action-btn toggle" (click)="toggleTeacherStatus(teacher)" 
                              [title]="isTeacherActive(teacher) ? 'تعطيل' : 'تفعيل'">
                        <i [class]="isTeacherActive(teacher) ? 'fas fa-user-slash' : 'fas fa-user-check'"></i>
                      </button>
                      <button class="action-btn delete" (click)="openDeleteModal(teacher)" title="حذف">
                        <i class="fas fa-trash-alt"></i>
                      </button>
                    </div>
                  </td>
                </tr>
                <tr *ngIf="paginatedTeachers.length === 0">
                  <td colspan="6" class="empty-state-cell">
                    <div class="empty-state">
                      <i class="fas fa-search-minus"></i>
                      <p>لا يوجد أساتذة مطابقون لمعايير البحث</p>
                      <button class="btn btn-outline" (click)="clearFilters()">مسح الفلاتر</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- عرض الجوال -->
        <div class="mobile-view">
          <div *ngFor="let teacher of paginatedTeachers" class="teacher-card" 
               (click)="selectTeacher(teacher)">
            
            <div class="card-header">
              <div class="card-avatar" [style.background]="getSubjectColor(teacher.subjects[0])">
                {{ getInitials(teacher.name) }}
              </div>
              <div class="card-title">
                <span class="card-name">{{ teacher.name }}</span>
                <span class="card-status" [class]="getStatusClass(teacher)">
                  {{ getTeacherStatus(teacher) }}
                </span>
              </div>
              <div class="card-actions" (click)="$event.stopPropagation()">
                <button class="action-btn edit" (click)="openEditModal(teacher)">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete" (click)="openDeleteModal(teacher)">
                  <i class="fas fa-trash-alt"></i>
                </button>
              </div>
            </div>
            
            <div class="card-body">
              <div class="card-info-row">
                <span class="info-label">المواد:</span>
                <div class="card-subjects">
                  <span *ngFor="let s of teacher.subjects" class="subject-tag" 
                        [style.background]="getSubjectColor(s) + '20'"
                        [style.color]="getSubjectColor(s)">
                    {{ s }}
                  </span>
                </div>
              </div>
              <div class="card-info-row" *ngIf="teacher.phone">
                <span class="info-label">📱 الهاتف:</span>
                <span class="info-value">{{ teacher.phone }}</span>
              </div>
              <div class="card-info-row" *ngIf="teacher.email">
                <span class="info-label">✉️ البريد:</span>
                <span class="info-value">{{ teacher.email }}</span>
              </div>
              <div class="card-info-row">
                <span class="info-label">📅 التعيين:</span>
                <span class="info-value">{{ formatDate(teacher.hireDate) }}</span>
              </div>
            </div>
            
            <div class="card-footer" (click)="$event.stopPropagation()">
              <button class="footer-btn toggle" (click)="toggleTeacherStatus(teacher)">
                <i [class]="isTeacherActive(teacher) ? 'fas fa-user-slash' : 'fas fa-user-check'"></i>
                <span>{{ isTeacherActive(teacher) ? 'تعطيل' : 'تفعيل' }}</span>
              </button>
              <button class="footer-btn view" (click)="selectTeacher(teacher)">
                <i class="fas fa-eye"></i>
                <span>عرض</span>
              </button>
            </div>
          </div>
          
          <div *ngIf="paginatedTeachers.length === 0" class="empty-state">
            <i class="fas fa-users-slash"></i>
            <p>لا يوجد أساتذة مطابقون</p>
            <button class="btn btn-outline" (click)="clearFilters()">مسح الفلاتر</button>
          </div>
        </div>

        <!-- ترقيم الصفحات -->
        <div class="pagination-section" *ngIf="paginatedTeachers.length > 0">
          <div class="pagination-info">
            <span>عرض {{ paginatedTeachers.length }} من {{ pagination.totalItems }}</span>
          </div>
          <div class="pagination-controls">
            <button class="page-btn" (click)="prevPage()" [disabled]="pagination.currentPage === 1">
              <i class="fas fa-chevron-right"></i>
            </button>
            
            <div class="page-numbers">
              <button *ngFor="let page of [].constructor(totalPages); let i = index"
                      class="page-num"
                      [class.active]="pagination.currentPage === i + 1"
                      (click)="goToPage(i + 1)">
                {{ i + 1 }}
              </button>
            </div>
            
            <button class="page-btn" (click)="nextPage()" [disabled]="pagination.currentPage >= totalPages">
              <i class="fas fa-chevron-left"></i>
            </button>
          </div>
        </div>

        <!-- نافذة إضافة / تعديل -->
        <div class="modal-overlay" *ngIf="showAddPopup || showEditModal" (click)="closeAllPopups()">
          <div class="modal-container" (click)="$event.stopPropagation()">
            
            <div class="modal-header">
              <h3>{{ showAddPopup ? '➕ إضافة أستاذ جديد' : '✏️ تعديل بيانات الأستاذ' }}</h3>
              <button class="modal-close" (click)="closeAllPopups()">
                <i class="fas fa-times"></i>
              </button>
            </div>
            
            <div class="modal-body">
              <div class="form-group">
                <label for="teacherName">الاسم الكامل *</label>
                <input id="teacherName" type="text" [(ngModel)]="teacherForm.name" 
                       class="form-input" placeholder="أدخل الاسم الكامل">
              </div>
              
              <div class="form-row">
                <div class="form-group">
                  <label for="teacherPhone">رقم الهاتف</label>
                  <input id="teacherPhone" type="tel" [(ngModel)]="teacherForm.phone" 
                         class="form-input" placeholder="05XX XX XX XX">
                </div>
                <div class="form-group">
                  <label for="teacherEmail">البريد الإلكتروني</label>
                  <input id="teacherEmail" type="email" [(ngModel)]="teacherForm.email" 
                         class="form-input" placeholder="example@email.com">
                </div>
              </div>
              
              <div class="form-group">
                <label>المواد التخصصية *</label>
                <div class="subjects-grid">
                  <div *ngFor="let s of subjectsList" 
                       class="subject-chip"
                       [class.selected]="teacherForm.subjects.includes(s)"
                       (click)="toggleSubject(s)"
                       [style.border-color]="teacherForm.subjects.includes(s) ? getSubjectColor(s) : 'transparent'">
                    {{ s }}
                  </div>
                </div>
              </div>
              
              <div class="form-group">
                <label for="hireDate">تاريخ التعيين</label>
                <input id="hireDate" type="date" [(ngModel)]="teacherForm.hireDate" class="form-input">
              </div>
              
              <div class="form-group">
                <label class="switch-label">
                  <span>الحالة</span>
                  <div class="toggle-switch">
                    <input type="checkbox" [(ngModel)]="teacherForm.active" id="teacherActive">
                    <label for="teacherActive" class="switch-slider"></label>
                    <span class="switch-status">{{ teacherForm.active ? 'نشط' : 'غير نشط' }}</span>
                  </div>
                </label>
              </div>
            </div>
            
            <div class="modal-footer">
              <button class="btn btn-outline" (click)="closeAllPopups()">إلغاء</button>
              <button class="btn btn-primary" (click)="showAddPopup ? addTeacher() : editTeacher()" 
                      [disabled]="isSaving">
                <i class="fas" [class.fa-spinner]="isSaving" [class.fa-spin]="isSaving"></i>
                {{ isSaving ? 'جاري الحفظ...' : (showAddPopup ? 'إضافة' : 'حفظ التغييرات') }}
              </button>
            </div>
          </div>
        </div>

        <!-- نافذة تفاصيل الأستاذ -->
        <div class="modal-overlay" *ngIf="showDetailsPopup" (click)="closeAllPopups()">
          <div class="modal-container large" (click)="$event.stopPropagation()">
            
            <div class="modal-header">
              <h3>👤 ملف الأستاذ</h3>
              <button class="modal-close" (click)="closeAllPopups()">
                <i class="fas fa-times"></i>
              </button>
            </div>
            
            <div class="modal-body details-body" *ngIf="selectedTeacher">
              <div class="details-profile">
                <div class="profile-avatar-large" [style.background]="getSubjectColor(selectedTeacher.subjects[0])">
                  {{ getInitials(selectedTeacher.name) }}
                </div>
                <div class="profile-info">
                  <h4>{{ selectedTeacher.name }}</h4>
                  <span class="profile-status" [class]="getStatusClass(selectedTeacher)">
                    {{ getTeacherStatus(selectedTeacher) }}
                  </span>
                  <div class="profile-contact">
                    <span *ngIf="selectedTeacher.phone"><i class="fas fa-phone"></i> {{ selectedTeacher.phone }}</span>
                    <span *ngIf="selectedTeacher.email"><i class="fas fa-envelope"></i> {{ selectedTeacher.email }}</span>
                  </div>
                  <span class="profile-hire">📅 منذ {{ formatDate(selectedTeacher.hireDate) }}</span>
                </div>
              </div>

              <div class="stats-mini-grid">
                <div class="stat-mini">
                  <span class="stat-mini-value">{{ teacherStats.totalClasses }}</span>
                  <span class="stat-mini-label">حصص مسجلة</span>
                </div>
                <div class="stat-mini">
                  <span class="stat-mini-value">{{ teacherStats.totalStudents }}</span>
                  <span class="stat-mini-label">طلاب</span>
                </div>
                <div class="stat-mini">
                  <span class="stat-mini-value">{{ teacherStats.subjectsCount }}</span>
                  <span class="stat-mini-label">مواد</span>
                </div>
                <div class="stat-mini">
                  <span class="stat-mini-value">{{ teacherStats.attendanceRate }}%</span>
                  <span class="stat-mini-label">حضور</span>
                </div>
              </div>

              <div class="tab-section">
                <div class="tab-header">
                  <h5><i class="fas fa-chalkboard"></i> الحصص المسجلة</h5>
                  <button class="btn btn-sm btn-primary" (click)="navigateToLessonManagement()">
                    <i class="fas fa-plus"></i> إضافة
                  </button>
                </div>
                <div class="mini-list">
                  <div *ngFor="let cls of teacherClasses" class="list-item" (click)="navigateToLesson(cls._id)">
                    <span class="list-item-name">{{ cls.name }}</span>
                    <span class="list-item-subject">{{ cls.subject }}</span>
                    <span class="list-item-price">{{ cls.price || 0 }} د.ج</span>
                    <span class="list-item-students">{{ cls.students?.length || 0 }} طالب</span>
                  </div>
                  <div *ngIf="teacherClasses.length === 0" class="empty-list">
                    <p>لا توجد حصص مسجلة لهذا الأستاذ</p>
                  </div>
                </div>
              </div>

              <div class="tab-section">
                <h5><i class="fas fa-video"></i> الحصص الحية</h5>
                <div class="mini-list">
                  <div *ngFor="let lc of teacherLiveClasses.slice(0, 5)" class="list-item">
                    <span class="list-item-name">{{ lc.class?.name || lc.title || 'غير محدد' }}</span>
                    <span class="list-item-subject">{{ formatDate(lc.date) }}</span>
                    <span class="list-item-time">{{ formatTime(lc.startTime) }} - {{ formatTime(lc.endTime) }}</span>
                    <span class="list-item-status" [class.completed]="lc.status === 'completed'">
                      {{ lc.status === 'completed' ? 'مكتملة' : lc.status === 'ongoing' ? 'جارية' : 'قادمة' }}
                    </span>
                  </div>
                  <div *ngIf="teacherLiveClasses.length === 0" class="empty-list">
                    <p>لا توجد حصص حية مسجلة</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="modal-footer">
              <button class="btn btn-primary" (click)="closeAllPopups()">إغلاق</button>
            </div>
          </div>
        </div>

        <!-- نافذة تأكيد الحذف -->
        <div class="modal-overlay" *ngIf="showConfirmDeleteModal" (click)="closeAllPopups()">
          <div class="modal-container small" (click)="$event.stopPropagation()">
            <div class="modal-body text-center">
              <div class="delete-icon">
                <i class="fas fa-trash-alt"></i>
              </div>
              <h4>تأكيد الحذف</h4>
              <p>هل أنت متأكد من حذف الأستاذ <strong>{{ selectedTeacher?.name }}</strong>؟</p>
              <p class="delete-warning">⚠️ هذا الإجراء لا يمكن التراجع عنه</p>
            </div>
            <div class="modal-footer centered">
              <button class="btn btn-outline" (click)="closeAllPopups()">إلغاء</button>
              <button class="btn btn-danger" (click)="deleteTeacher()" [disabled]="isDeleting">
                <i class="fas" [class.fa-spinner]="isDeleting" [class.fa-spin]="isDeleting"></i>
                {{ isDeleting ? 'جاري الحذف...' : 'تأكيد الحذف' }}
              </button>
            </div>
          </div>
        </div>

        <!-- شاشة التحميل -->
        <div class="loading-screen" *ngIf="isLoading">
          <div class="loading-spinner"></div>
          <p>جاري التحميل...</p>
        </div>
      </div>
    </div>
  `
})
export class TeachersManagementComponent implements OnInit, OnDestroy {
  // ==========================================
  // البيانات الأساسية
  // ==========================================
  teachers: Teacher[] = [];
  classes: Class[] = [];
  liveClasses: LiveClass[] = [];
  teacherClasses: Class[] = [];
  teacherLiveClasses: LiveClass[] = [];
  
  selectedTeacher: Teacher | null = null;
  selectedTeacherId: string = '';
  
  // ==========================================
  // نماذج الإدخال
  // ==========================================
  teacherForm: TeacherForm = {
    name: '',
    subjects: [],
    phone: '',
    email: '',
    hireDate: new Date().toISOString().split('T')[0],
    active: true,
    salaryPercentage: 0
  };

  // ==========================================
  // حالة الفلترة والبحث
  // ==========================================
  searchTerm: string = '';
  subjectFilter: string = '';
  statusFilter: string = 'all';
  sortBy: string = 'name';
  sortOrder: 'asc' | 'desc' = 'asc';
  
// في Angular Component
subjectsList: string[] = [
  // الرياضيات والعلوم

  
  'علوم طبيعية', 
  'رياضيات', 
  'فيزياء', 
  'لغة عربية', 
  'لغة فرنسية', 
  'لغة انجليزية', 
  'تاريخ', 
  'جغرافيا', 'فلسفة', 'إعلام آلي',
  'كيمياء', 
  'تربية إسلامية', 
  "تسيير و اقتصاد",
];

  // ==========================================
  // حالة واجهة المستخدم
  // ==========================================
  isLoading: boolean = false;
  isSaving: boolean = false;
  isDeleting: boolean = false;
  
  showAddPopup: boolean = false;
  showEditModal: boolean = false;
  showDetailsPopup: boolean = false;
  showConfirmDeleteModal: boolean = false;
  
  teacherStats: TeacherStats = {
    totalClasses: 0,
    totalStudents: 0,
    totalLiveClasses: 0,
    thisMonthClasses: 0,
    attendanceRate: 0,
    subjectsCount: 0
  };
  
  pagination = {
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0
  };

  // ==========================================
  // متغيرات مساعدة
  // ==========================================
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();
  private apiUrl = environment.apiUrl;

  // ==========================================
  // المُنشئ
  // ==========================================
  constructor(
    private http: HttpClient,
    private router: Router,
    private soundService: SoundService, 
  ) {}

  // ==========================================
  // دورة الحياة
  // ==========================================
  ngOnInit(): void {
    this.loadAllData();
    this.setupSearchDebounce();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ==========================================
  // إعداد البحث المتأخر
  // ==========================================
  private setupSearchDebounce(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.pagination.currentPage = 1;
    });
  }

  // ==========================================
  // جلب البيانات
  // ==========================================
  private loadAllData(): void {
    this.loadTeachers();
    this.loadClasses();
    this.loadLiveClasses();
  }

  loadTeachers(): void {
    this.isLoading = true;
    const schoolId = this.getSchoolId();
    
    if (!schoolId) {
      this.loadAllTeachers();
      return;
    }

    this.http.get<Teacher[]>(
      `${this.apiUrl}/teachers/school/${schoolId}`,
      { headers: this.getHeaders() }
    ).pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => {
        this.teachers = this.sortTeachers(data);
        this.pagination.totalItems = data.length;
        this.isLoading = false;
      },
      error: () => {
        this.loadAllTeachers();
      }
    });
  }

  private loadAllTeachers(): void {
    this.http.get<Teacher[]>(
      `${this.apiUrl}/teachers`,
      { headers: this.getHeaders() }
    ).pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => {
        this.teachers = this.sortTeachers(data);
        this.pagination.totalItems = data.length;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('❌ خطأ في تحميل الأساتذة:', err);
        this.teachers = [];
        this.pagination.totalItems = 0;
        this.isLoading = false;
      }
    });
  }

  loadClasses(): void {
    const schoolId = this.getSchoolId();
    const url = schoolId 
      ? `${this.apiUrl}/classes/school/${schoolId}`
      : `${this.apiUrl}/classes`;
    
    this.http.get<Class[]>(url, { headers: this.getHeaders() })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.classes = data;
        },
        error: (err) => {
          console.error('❌ خطأ في تحميل الحصص:', err);
          this.classes = [];
        }
      });
  }
  
  loadLiveClasses(): void {
    const schoolId = this.getSchoolId();
    const url = schoolId 
      ? `${this.apiUrl}/live-classes/school/${schoolId}`
      : `${this.apiUrl}/live-classes`;
    
    this.http.get<LiveClass[]>(url, { headers: this.getHeaders() })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.liveClasses = data;
        },
        error: (err) => {
          console.error('❌ خطأ في تحميل الحصص الحية:', err);
          this.liveClasses = [];
        }
      });
  }

  // ==========================================
  // عمليات CRUD
  // ==========================================
  addTeacher(): void {
    if (!this.validateTeacherForm()) return;
    
    const schoolId = this.getSchoolId();
    if (!schoolId) {
      this.showToast('⚠️ لا يمكن إضافة أستاذ بدون تحديد المدرسة', 'warning');
      return;
    }

    this.isSaving = true;
    
    const teacherData = {
      ...this.teacherForm,
      schoolId: schoolId
    };
    
    this.http.post(`${this.apiUrl}/teachers`, teacherData, { headers: this.getHeaders() })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.showToast('✅ تم إضافة الأستاذ بنجاح', 'success');
          this.soundService.playStudentAdded();
          this.loadTeachers();
          this.closeAllPopups();
          this.isSaving = false;
        },
        error: (err) => {
          this.showToast('❌ حدث خطأ أثناء إضافة الأستاذ', 'error');
          this.soundService.playError();
          this.isSaving = false;
        }
      });
  }

  editTeacher(): void {
    if (!this.selectedTeacher || !this.validateTeacherForm()) return;
    
    this.isSaving = true;
    const updateData = { ...this.teacherForm };
    
    this.http.put(
      `${this.apiUrl}/teachers/${this.selectedTeacher._id}`,
      updateData,
      { headers: this.getHeaders() }
    ).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.showToast('✅ تم تحديث بيانات الأستاذ', 'success');
        this.loadTeachers();
        this.closeAllPopups();
        this.isSaving = false;
      },
      error: (err) => {
        this.showToast('❌ حدث خطأ أثناء تحديث الأستاذ', 'error');
        this.isSaving = false;
      }
    });
  }

  deleteTeacher(): void {
    if (!this.selectedTeacher) return;
    
    this.isDeleting = true;
    this.http.delete(
      `${this.apiUrl}/teachers/${this.selectedTeacher._id}`,
      { headers: this.getHeaders() }
    ).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.showToast('🗑️ تم حذف الأستاذ بنجاح', 'success');
        this.loadTeachers();
        this.showConfirmDeleteModal = false;
        this.isDeleting = false;
      },
      error: (err) => {
        this.showToast('❌ حدث خطأ أثناء حذف الأستاذ', 'error');
        this.isDeleting = false;
      }
    });
  }

  toggleTeacherStatus(teacher: Teacher): void {
    const current = teacher.active ?? true;
    const updateData = { ...teacher, active: !current };
    
    this.http.put(
      `${this.apiUrl}/teachers/${teacher._id}`,
      updateData,
      { headers: this.getHeaders() }
    ).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.showToast(`✅ تم ${!current ? 'تفعيل' : 'تعطيل'} الأستاذ`, 'success');
        this.loadTeachers();
      },
      error: (err) => {
        this.showToast('❌ حدث خطأ في تغيير حالة الأستاذ', 'error');
      }
    });
  }

  // ==========================================
  // التحقق من صحة النماذج
  // ==========================================
  private validateTeacherForm(): boolean {
    if (!this.teacherForm.name?.trim()) {
      this.showToast('⚠️ الاسم مطلوب', 'warning');
      return false;
    }
    if (!this.teacherForm.subjects?.length) {
      this.showToast('⚠️ اختر مادة واحدة على الأقل', 'warning');
      return false;
    }
    if (this.teacherForm.email && !this.isValidEmail(this.teacherForm.email)) {
      this.showToast('⚠️ البريد الإلكتروني غير صحيح', 'warning');
      return false;
    }
    return true;
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // ==========================================
  // عمليات النماذج
  // ==========================================
  resetForm(): void {
    this.teacherForm = {
      name: '',
      subjects: [],
      phone: '',
      email: '',
      hireDate: new Date().toISOString().split('T')[0],
      active: true,
      salaryPercentage: 0
    };
  }

  toggleSubject(subject: string): void {
    const idx = this.teacherForm.subjects.indexOf(subject);
    if (idx > -1) {
      this.teacherForm.subjects.splice(idx, 1);
    } else {
      this.teacherForm.subjects.push(subject);
    }
  }

  // ==========================================
  // البحث
  // ==========================================
  onSearchInput(): void {
    this.searchSubject.next(this.searchTerm);
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.searchSubject.next('');
  }

  // ==========================================
  // عمليات عرض البيانات
  // ==========================================
  openAddPopup(): void {
    this.resetForm();
    this.showAddPopup = true;
    document.body.style.overflow = 'hidden';
  }

  openEditModal(teacher: Teacher): void {
    this.soundService.playClick();
    this.selectedTeacher = teacher;
    this.teacherForm = {
      name: teacher.name,
      subjects: [...teacher.subjects],
      phone: teacher.phone || '',
      email: teacher.email || '',
      hireDate: teacher.hireDate ? teacher.hireDate.split('T')[0] : new Date().toISOString().split('T')[0],
      active: teacher.active,
      salaryPercentage: teacher.salaryPercentage || 0
    };
    this.showEditModal = true;
    document.body.style.overflow = 'hidden';
  }

  openDeleteModal(teacher: Teacher): void {
    this.selectedTeacher = teacher;
    this.showConfirmDeleteModal = true;
    document.body.style.overflow = 'hidden';
  }

  selectTeacher(teacher: Teacher): void {
    this.soundService.playClick();
    this.selectedTeacher = teacher;
    this.selectedTeacherId = teacher._id;
    this.loadTeacherDetails();
    this.showDetailsPopup = true;
    document.body.style.overflow = 'hidden';
  }

  closeAllPopups(): void {
    this.soundService.playClick();
    this.showAddPopup = false;
    this.showEditModal = false;
    this.showDetailsPopup = false;
    this.showConfirmDeleteModal = false;
    document.body.style.overflow = '';
  }

  // ==========================================
  // تفاصيل الأستاذ
  // ==========================================
  loadTeacherDetails(): void {
    if (!this.selectedTeacher) return;
    
    this.teacherClasses = this.classes.filter(cls => 
      cls.teacher?._id === this.selectedTeacherId
    );
    
    this.teacherLiveClasses = this.liveClasses.filter(lc => 
      lc.teacher?._id === this.selectedTeacherId
    );
    
    this.calculateTeacherStats();
  }

  private calculateTeacherStats(): void {
    const now = new Date();
    const totalStudents = this.teacherClasses.reduce(
      (sum, cls) => sum + (cls.students?.length || 0), 0
    );
    
    const thisMonth = this.teacherLiveClasses.filter(lc => {
      const d = new Date(lc.date);
      return d.getMonth() === now.getMonth() && 
             d.getFullYear() === now.getFullYear();
    }).length;

    const attendanceRate = this.teacherLiveClasses.length > 0
      ? Math.round((this.teacherLiveClasses.filter(lc => lc.status === 'completed').length / this.teacherLiveClasses.length) * 100)
      : 0;

    this.teacherStats = {
      totalClasses: this.teacherClasses.length,
      totalStudents: totalStudents,
      totalLiveClasses: this.teacherLiveClasses.length,
      thisMonthClasses: thisMonth,
      attendanceRate: attendanceRate,
      subjectsCount: this.selectedTeacher?.subjects?.length || 0
    };
  }

  // ==========================================
  // الفلترة والترتيب
  // ==========================================
  get filteredTeachers(): Teacher[] {
    let filtered = [...this.teachers];
    
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(t =>
        t.name.toLowerCase().includes(term) ||
        t.email?.toLowerCase().includes(term) ||
        t.phone?.includes(term) ||
        t.subjects.some(s => s.toLowerCase().includes(term))
      );
    }
    
    if (this.subjectFilter) {
      filtered = filtered.filter(t => t.subjects.includes(this.subjectFilter));
    }
    
    if (this.statusFilter === 'active') {
      filtered = filtered.filter(t => this.isTeacherActive(t));
    } else if (this.statusFilter === 'inactive') {
      filtered = filtered.filter(t => !this.isTeacherActive(t));
    }
    
    filtered = this.sortTeachers(filtered);
    this.pagination.totalItems = filtered.length;
    return filtered;
  }

  private sortTeachers(teachers: Teacher[]): Teacher[] {
    return teachers.sort((a, b) => {
      let comparison = 0;
      switch (this.sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'subjects':
          comparison = (a.subjects?.length || 0) - (b.subjects?.length || 0);
          break;
        case 'hireDate':
          comparison = new Date(a.hireDate || 0).getTime() - new Date(b.hireDate || 0).getTime();
          break;
        default:
          comparison = a.name.localeCompare(b.name);
      }
      return this.sortOrder === 'asc' ? comparison : -comparison;
    });
  }

  get paginatedTeachers(): Teacher[] {
    const start = (this.pagination.currentPage - 1) * this.pagination.itemsPerPage;
    return this.filteredTeachers.slice(start, start + this.pagination.itemsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.pagination.totalItems / this.pagination.itemsPerPage);
  }

  get activeTeachersCount(): number {
    return this.teachers.filter(t => this.isTeacherActive(t)).length;
  }

  get uniqueSubjects(): string[] {
    const subjects = new Set<string>();
    this.teachers.forEach(t => t.subjects?.forEach(s => subjects.add(s)));
    return Array.from(subjects).sort();
  }

  // ==========================================
  // التنقل
  // ==========================================
  nextPage(): void {
    if (this.pagination.currentPage < this.totalPages) {
      this.pagination.currentPage++;
      this.scrollToTop();
    }
  }

  prevPage(): void {
    if (this.pagination.currentPage > 1) {
      this.pagination.currentPage--;
      this.scrollToTop();
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.pagination.currentPage = page;
      this.scrollToTop();
    }
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.subjectFilter = '';
    this.statusFilter = 'all';
    this.pagination.currentPage = 1;
  }

  private scrollToTop(): void {
    const container = document.querySelector('.teachers-container');
    if (container) {
      container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // ==========================================
  // التنقل بين الصفحات
  // ==========================================
  navigateToLessonManagement(): void {
    this.router.navigate(['/home/lesson-management']);
  }

  navigateToLesson(lessonId: string): void {
    this.router.navigate(['/home/lesson-detail', lessonId]);
  }

  // ==========================================
  // التصدير
  // ==========================================
  exportToCSV(): void {
    if (this.filteredTeachers.length === 0) {
      this.showToast('⚠️ لا توجد بيانات للتصدير', 'warning');
      return;
    }

    const headers = ['الاسم', 'المواد', 'الهاتف', 'البريد الإلكتروني', 'الحالة', 'تاريخ التعيين'];
    const rows = this.filteredTeachers.map(t => [
      t.name,
      t.subjects?.join(' | ') || '',
      t.phone || '',
      t.email || '',
      this.getTeacherStatus(t),
      this.formatDate(t.hireDate || '')
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { 
      type: 'text/csv;charset=utf-8;' 
    });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `teachers_export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    
    this.showToast('✅ تم تصدير البيانات بنجاح', 'success');
  }

  // ==========================================
  // الأدوات المساعدة
  // ==========================================
  private getSchoolId(): string | null {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user?.schoolId) return user.schoolId;
      }

      const schoolStr = localStorage.getItem('school');
      if (schoolStr) {
        const school = JSON.parse(schoolStr);
        if (school?._id) return school._id;
      }

      const token = localStorage.getItem('token');
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          if (payload?.schoolId) return payload.schoolId;
        } catch (e) {
          console.warn('⚠️ فشل فك تشفير token');
        }
      }

      return null;
    } catch (e) {
      console.error('❌ خطأ في getSchoolId:', e);
      return null;
    }
  }

  private getToken(): string | null {
    try {
      return localStorage.getItem('token');
    } catch (e) {
      console.error('❌ خطأ في قراءة token:', e);
      return null;
    }
  }

  private getHeaders(): any {
    const token = this.getToken();
    return {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    };
  }

  formatDate(ds: string): string {
    if (!ds) return '---';
    try {
      return new Date(ds).toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return '---';
    }
  }

  formatTime(time: string): string {
    if (!time) return '---';
    try {
      const [h, m] = time.split(':');
      return `${h}:${m}`;
    } catch {
      return time;
    }
  }

  isTeacherActive(t: Teacher): boolean {
    return t.active !== false;
  }

  getTeacherStatus(t: Teacher): string {
    return this.isTeacherActive(t) ? 'نشط' : 'غير نشط';
  }

  getStatusClass(t: Teacher): string {
    return this.isTeacherActive(t) ? 'active' : 'inactive';
  }

  getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  getSubjectColor(subject: string): string {
    const colors: { [key: string]: string } = {
      'رياضيات': '#4361ee',
      'فيزياء': '#f59e0b',
      'كيمياء': '#10b981',
      'علوم طبيعية': '#06b6d4',
      'لغة عربية': '#8b5cf6',
      'لغة فرنسية': '#ec4899',
      'لغة انجليزية': '#3b82f6',
      'تاريخ': '#f97316',
      'جغرافيا': '#14b8a6',
      'فلسفة': '#6366f1',
      'إعلام آلي': '#8b5cf6',
      'تربية بدنية': '#22c55e',
      'تربية فنية': '#a855f7',
      'تربية موسيقية': '#ef4444'
    };
    return colors[subject] || '#64748b';
  }

  // ==========================================
  // الإشعارات (Toast)
  // ==========================================
  private showToast(message: string, type: 'success' | 'error' | 'warning' = 'success'): void {
    alert(message);
  }
}