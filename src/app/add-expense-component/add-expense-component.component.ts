import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment.development';

interface Transaction {
  _id: string;
  type: string;
  amount: number;
  description: string;
  category: string;
  date: string;
  paymentDate?: string;
  createdAt?: string;
  recordedBy?: any;
  student?: any;
  class?: any;
  teacher?: any;
  status?: string;
  _type?: string;
  typeLabel?: string;
  icon?: string;
  schoolId?: string;
}

interface School {
  _id: string;
  name: string;
  schoolKey: string;
  subscription?: {
    plan: string;
    planName: string;
    isActive: boolean;
    daysRemaining: number;
  };
}

@Component({
  selector: 'app-on-payments-component',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <style>
      /* ==========================================
         ROOT VARIABLES & RESET
         ========================================== */
      :host {
        --primary: #6366f1;
        --primary-dark: #4f46e5;
        --primary-light: #e0e7ff;
        --primary-gradient: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
        --secondary: #14b8a6;
        --secondary-dark: #0d9488;
        --secondary-light: #ccfbf1;
        --danger: #ef4444;
        --danger-light: #fee2e2;
        --warning: #f59e0b;
        --warning-light: #fef3c7;
        --text-dark: #0f172a;
        --text-medium: #334155;
        --text-light: #64748b;
        --text-muted: #94a3b8;
        --bg-body: #f1f5f9;
        --bg-card: rgba(255, 255, 255, 0.85);
        --bg-hover: #f8fafc;
        --border: #e2e8f0;
        --border-light: #f1f5f9;
        --radius: 16px;
        --radius-sm: 10px;
        --radius-xs: 6px;
        --shadow-sm: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03);
        --shadow-md: 0 10px 25px -5px rgba(0,0,0,0.08), 0 8px 10px -6px rgba(0,0,0,0.02);
        --shadow-lg: 0 20px 40px -10px rgba(0,0,0,0.15);
        --glass-bg: rgba(255, 255, 255, 0.7);
        --glass-border: rgba(255, 255, 255, 0.3);
        display: block;
        width: 100%;
        font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
        direction: rtl;
      }

      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }

      .page-wrapper {
        width: 100%;
        max-width: 100vw;
        min-height: 100vh;
        background: var(--bg-body);
        padding: 0;
        margin: 0;
        overflow-x: hidden;
        position: relative;
      }

      /* Animated background gradient */
      .page-wrapper::before {
        content: '';
        position: fixed;
        top: -50%;
        left: -50%;
        width: 200%;
        height: 200%;
        background: radial-gradient(ellipse at 70% 20%, rgba(99, 102, 241, 0.08) 0%, transparent 60%),
                    radial-gradient(ellipse at 30% 80%, rgba(20, 184, 166, 0.06) 0%, transparent 50%);
        z-index: 0;
        animation: bgFloat 20s ease-in-out infinite alternate;
        pointer-events: none;
      }

      @keyframes bgFloat {
        0% { transform: translate(0, 0) rotate(0deg); }
        100% { transform: translate(-2%, 2%) rotate(2deg); }
      }

      .page-container {
        max-width: 1280px;
        margin: 0 auto;
        padding: 20px;
        width: 100%;
        position: relative;
        z-index: 1;
      }

      @media (max-width: 768px) {
        .page-container { padding: 14px 12px; }
      }

      /* ==========================================
         GLASS HEADER
         ========================================== */
      .page-header {
        display: flex;
        flex-direction: column;
        gap: 14px;
        margin-bottom: 24px;
        background: var(--glass-bg);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        padding: 18px 20px;
        border-radius: var(--radius);
        box-shadow: var(--shadow-md);
        border: 1px solid var(--glass-border);
        position: relative;
        overflow: hidden;
        transition: all 0.3s ease;
      }

      .page-header::after {
        content: '';
        position: absolute;
        top: 0;
        right: 0;
        width: 6px;
        height: 100%;
        background: var(--primary-gradient);
        border-radius: 0 4px 4px 0;
      }

      .header-top {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
        flex-wrap: wrap;
        gap: 10px;
      }

      .page-title {
        display: flex;
        align-items: center;
        gap: 10px;
        color: var(--text-dark);
        font-size: 1.15rem;
        font-weight: 700;
        margin: 0;
      }

      .page-title i {
        background: var(--primary-gradient);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        font-size: 1.3rem;
      }

      .back-link {
        color: var(--text-light);
        font-size: 0.85rem;
        text-decoration: none;
        display: flex;
        align-items: center;
        gap: 6px;
        cursor: pointer;
        padding: 6px 12px;
        border-radius: 50px;
        transition: all 0.2s ease;
        background: rgba(0,0,0,0.03);
        border: 1px solid transparent;
      }

      .back-link:hover {
        background: rgba(99, 102, 241, 0.08);
        color: var(--primary);
        border-color: var(--primary-light);
        transform: translateX(-3px);
      }

      .header-actions {
        display: flex;
        gap: 10px;
        width: 100%;
        flex-wrap: wrap;
      }

      .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 10px 18px;
        border: none;
        border-radius: 50px;
        font-weight: 600;
        font-size: 0.85rem;
        cursor: pointer;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        flex: 1;
        min-width: 100px;
        position: relative;
        overflow: hidden;
      }

      .btn::after {
        content: '';
        position: absolute;
        inset: 0;
        background: rgba(255,255,255,0.2);
        opacity: 0;
        transition: opacity 0.3s ease;
        border-radius: inherit;
      }

      .btn:hover::after { opacity: 1; }
      .btn:active { transform: scale(0.96); }

      .btn-primary {
        background: var(--primary-gradient);
        color: white;
        box-shadow: 0 4px 12px rgba(99, 102, 241, 0.35);
      }
      .btn-primary:hover { box-shadow: 0 6px 20px rgba(99, 102, 241, 0.45); transform: translateY(-2px); }

      .btn-secondary {
        background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
        color: white;
        box-shadow: 0 4px 12px rgba(20, 184, 166, 0.35);
      }
      .btn-secondary:hover { box-shadow: 0 6px 20px rgba(20, 184, 166, 0.45); transform: translateY(-2px); }

      .btn-outline {
        border: 1.5px solid var(--border);
        color: var(--text-medium);
        background: transparent;
      }
      .btn-outline:hover { background: var(--bg-hover); border-color: var(--text-muted); }

      .btn-outline-primary {
        border: 1.5px solid var(--primary);
        color: var(--primary);
        background: transparent;
      }
      .btn-outline-primary.active {
        background: var(--primary-gradient);
        color: white;
        border-color: transparent;
        box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
      }
      .btn-outline-primary:hover:not(.active) { background: var(--primary-light); }

      .btn-outline-success {
        border: 1.5px solid var(--secondary);
        color: var(--secondary);
        background: transparent;
      }
      .btn-outline-success.active {
        background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
        color: white;
        border-color: transparent;
        box-shadow: 0 4px 12px rgba(20, 184, 166, 0.3);
      }
      .btn-outline-success:hover:not(.active) { background: var(--secondary-light); }

      .btn-outline-danger {
        border: 1.5px solid var(--danger);
        color: var(--danger);
        background: transparent;
      }
      .btn-outline-danger.active {
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        color: white;
        border-color: transparent;
        box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
      }
      .btn-outline-danger:hover:not(.active) { background: var(--danger-light); }

      .btn-outline-warning {
        border: 1.5px solid var(--warning);
        color: #b45309;
        background: transparent;
      }
      .btn-outline-warning.active {
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        color: white;
        border-color: transparent;
        box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
      }
      .btn-outline-warning:hover:not(.active) { background: var(--warning-light); }

      /* ==========================================
         SCHOOL CARD - GLASS
         ========================================== */
      .school-card {
        background: var(--glass-bg);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        border-radius: var(--radius);
        padding: 16px 20px;
        margin-bottom: 24px;
        box-shadow: var(--shadow-sm);
        border: 1px solid var(--glass-border);
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
        transition: all 0.3s ease;
        position: relative;
      }

      .school-card::before {
        content: '';
        position: absolute;
        top: 0;
        right: 0;
        width: 6px;
        height: 100%;
        background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
        border-radius: 0 4px 4px 0;
      }

      .school-card:hover {
        box-shadow: var(--shadow-md);
        transform: translateY(-1px);
      }

      .school-info-row {
        display: flex;
        justify-content: space-between;
        width: 100%;
        align-items: center;
        flex-wrap: wrap;
        gap: 8px;
      }

      /* ==========================================
         STATS - GLASS GRID
         ========================================== */
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 14px;
        margin-bottom: 24px;
        width: 100%;
      }

      @media (max-width: 768px) {
        .stats-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
      }
      @media (max-width: 480px) {
        .stats-grid { grid-template-columns: 1fr 1fr; gap: 8px; }
      }

      .stat-card {
        background: var(--glass-bg);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        padding: 16px 12px;
        border-radius: var(--radius-sm);
        text-align: center;
        box-shadow: var(--shadow-sm);
        border: 1px solid var(--glass-border);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        overflow: hidden;
      }

      .stat-card::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: var(--primary-gradient);
        opacity: 0;
        transition: opacity 0.3s ease;
      }

      .stat-card:hover {
        transform: translateY(-4px);
        box-shadow: var(--shadow-md);
      }
      .stat-card:hover::after { opacity: 1; }

      .stat-card:nth-child(2)::after { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); }
      .stat-card:nth-child(3)::after { background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%); }
      .stat-card:nth-child(4)::after { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); }

      .stat-label {
        font-size: 0.7rem;
        color: var(--text-light);
        margin-bottom: 6px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .stat-value {
        font-size: 1.2rem;
        font-weight: 800;
        letter-spacing: -0.5px;
      }

      /* ==========================================
         FILTER BAR
         ========================================== */
      .filter-bar {
        display: flex;
        flex-wrap: nowrap;
        gap: 8px;
        margin-bottom: 20px;
        overflow-x: auto;
        padding: 4px 2px 12px 2px;
        -webkit-overflow-scrolling: touch;
        width: 100%;
        scrollbar-width: thin;
      }

      .filter-bar::-webkit-scrollbar { height: 4px; }
      .filter-bar::-webkit-scrollbar-track { background: transparent; }
      .filter-bar::-webkit-scrollbar-thumb {
        background: var(--border);
        border-radius: 10px;
      }

      .filter-bar .btn {
        flex: 0 0 auto;
        font-size: 0.75rem;
        padding: 8px 16px;
        border-radius: 50px;
        white-space: nowrap;
        min-width: auto;
      }

      /* ==========================================
         TABLE - GLASS
         ========================================== */
      .table-container {
        background: var(--glass-bg);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        border-radius: var(--radius);
        box-shadow: var(--shadow-md);
        border: 1px solid var(--glass-border);
        margin-bottom: 24px;
        width: 100%;
        overflow: hidden;
        transition: all 0.3s ease;
      }

      .table-container:hover {
        box-shadow: var(--shadow-lg);
      }

      .table-responsive {
        width: 100%;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
        display: block;
        padding: 0 4px;
      }

      .table {
        width: 100%;
        border-collapse: collapse;
        min-width: 700px;
        text-align: right;
      }

      .table th, .table td {
        padding: 14px 16px;
        border-bottom: 1px solid rgba(226, 232, 240, 0.5);
        font-size: 0.8rem;
        vertical-align: middle;
      }

      .table th {
        background: rgba(248, 250, 252, 0.6);
        color: var(--text-medium);
        font-weight: 700;
        white-space: nowrap;
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.3px;
        position: sticky;
        top: 0;
        z-index: 2;
        backdrop-filter: blur(4px);
      }

      .table tr {
        transition: background 0.2s ease;
      }

      .table tbody tr:hover {
        background: rgba(99, 102, 241, 0.04);
      }

      .table tbody tr:last-child td {
        border-bottom: none;
      }

      /* ==========================================
         BADGES
         ========================================== */
      .badge-custom {
        padding: 4px 12px;
        border-radius: 50px;
        font-size: 0.7rem;
        font-weight: 600;
        display: inline-flex;
        align-items: center;
        gap: 5px;
        white-space: nowrap;
        letter-spacing: 0.2px;
      }

      .bg-success { background: var(--secondary-light); color: var(--secondary-dark); }
      .bg-danger { background: var(--danger-light); color: #991b1b; }
      .bg-primary { background: var(--primary-light); color: var(--primary-dark); }
      .bg-warning { background: var(--warning-light); color: #92400e; }
      .bg-secondary { background: #e2e8f0; color: var(--text-medium); }

      /* ==========================================
         ACTION BUTTONS
         ========================================== */
      .action-btn {
        width: 32px;
        height: 32px;
        border: none;
        border-radius: 50%;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 0.8rem;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        background: transparent;
      }

      .action-btn.view {
        color: var(--primary);
        background: rgba(99, 102, 241, 0.1);
      }
      .action-btn.view:hover {
        background: var(--primary-gradient);
        color: white;
        transform: scale(1.1);
        box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
      }

      .action-btn.delete {
        color: var(--danger);
        background: rgba(239, 68, 68, 0.1);
      }
      .action-btn.delete:hover {
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        color: white;
        transform: scale(1.1);
        box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
      }

      .action-group {
        display: flex;
        gap: 6px;
        align-items: center;
      }

      /* ==========================================
         MODAL - GLASS
         ========================================== */
      .modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.6);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        display: flex;
        align-items: flex-end;
        justify-content: center;
        z-index: 1000;
        animation: fadeIn 0.25s ease;
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      @keyframes slideUp {
        from { transform: translateY(30px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }

      .modal-container {
        background: var(--glass-bg);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border-radius: var(--radius) var(--radius) 0 0;
        width: 100%;
        max-width: 520px;
        max-height: 85vh;
        display: flex;
        flex-direction: column;
        animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        border: 1px solid var(--glass-border);
        border-bottom: none;
        box-shadow: var(--shadow-lg);
      }

      @media (min-width: 768px) {
        .modal-overlay { align-items: center; padding: 20px; }
        .modal-container { border-radius: var(--radius); max-height: 90vh; border: 1px solid var(--glass-border); }
      }

      .modal-header {
        padding: 18px 24px;
        border-bottom: 1px solid rgba(226, 232, 240, 0.5);
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-radius: var(--radius) var(--radius) 0 0;
        background: rgba(255,255,255,0.3);
      }

      .modal-header h5 {
        font-weight: 700;
        font-size: 1.05rem;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .modal-body {
        padding: 24px;
        overflow-y: auto;
      }

      .modal-footer {
        padding: 16px 24px;
        border-top: 1px solid rgba(226, 232, 240, 0.5);
        display: flex;
        gap: 10px;
        justify-content: flex-end;
        background: rgba(255,255,255,0.2);
        border-radius: 0 0 var(--radius) var(--radius);
      }

      .form-group {
        margin-bottom: 18px;
      }

      .form-group label {
        display: block;
        font-size: 0.8rem;
        margin-bottom: 6px;
        font-weight: 600;
        color: var(--text-medium);
      }

      .form-control {
        width: 100%;
        padding: 12px 14px;
        border: 1.5px solid var(--border);
        border-radius: var(--radius-sm);
        font-size: 16px;
        font-family: inherit;
        background: rgba(255,255,255,0.6);
        backdrop-filter: blur(4px);
        transition: all 0.2s ease;
      }

      .form-control:focus {
        outline: none;
        border-color: var(--primary);
        box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.15);
        background: white;
      }

      .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 14px;
      }

      @media (max-width: 480px) {
        .form-row { grid-template-columns: 1fr; gap: 0; }
        .modal-body { padding: 16px; }
        .modal-header, .modal-footer { padding: 14px 16px; }
      }

      /* ==========================================
         NOTIFICATIONS
         ========================================== */
      .notifications-container {
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 2000;
        width: calc(100% - 32px);
        max-width: 380px;
        pointer-events: none;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .notification {
        padding: 14px 20px;
        border-radius: var(--radius-sm);
        color: white;
        font-size: 0.85rem;
        display: flex;
        align-items: center;
        gap: 12px;
        box-shadow: var(--shadow-lg);
        animation: slideDown 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        pointer-events: auto;
        backdrop-filter: blur(8px);
        border: 1px solid rgba(255,255,255,0.2);
      }

      @keyframes slideDown {
        from { transform: translateY(-20px) scale(0.95); opacity: 0; }
        to { transform: translateY(0) scale(1); opacity: 1; }
      }

      .notification.success {
        background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
      }
      .notification.error {
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      }
      .notification.warning {
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      }
      .notification.info {
        background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      }

      .notification i {
        font-size: 1.1rem;
        flex-shrink: 0;
      }

      /* ==========================================
         EMPTY STATE
         ========================================== */
      .empty-state {
        text-align: center;
        padding: 40px 20px;
        color: var(--text-light);
      }

      .empty-state i {
        font-size: 2.5rem;
        margin-bottom: 12px;
        opacity: 0.4;
      }

      .empty-state p {
        font-size: 0.9rem;
      }

      /* ==========================================
         MISC
         ========================================== */
      .text-success { color: var(--secondary) !important; }
      .text-danger { color: var(--danger) !important; }
      .text-primary { color: var(--primary) !important; }
      .text-warning { color: var(--warning) !important; }

      .fw-bold { font-weight: 700; }

      .gap-1 { gap: 4px; }
      .gap-2 { gap: 8px; }
      .gap-3 { gap: 12px; }

      /* Scrollbar styling */
      ::-webkit-scrollbar { width: 6px; height: 6px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb {
        background: var(--border);
        border-radius: 10px;
      }
      ::-webkit-scrollbar-thumb:hover { background: var(--text-muted); }
    </style>

    <div class="page-wrapper">
      <div class="page-container">

        <!-- HEADER -->
        <header class="page-header">
          <div class="header-top">
            <h3 class="page-title">
              <i class="fas fa-coins"></i> معاملات اليوم
            </h3>
            <a class="back-link" (click)="goBack()">
              <i class="fas fa-arrow-right"></i> العودة
            </a>
          </div>
          <div class="header-actions">
            <button class="btn btn-primary" (click)="openAddExpense()">
              <i class="fas fa-plus-circle"></i> إضافة مصروف
            </button>
            <button class="btn btn-secondary" (click)="refreshData()">
              <i class="fas fa-sync-alt"></i> تحديث
            </button>
          </div>
        </header>

        <!-- SCHOOL CARD -->
        <div class="school-card" *ngIf="school">
          <div class="school-info-row">
            <h5 style="font-size:0.95rem; font-weight:700; display:flex; align-items:center; gap:8px; margin:0;">
              <i class="fas fa-school" style="color:var(--secondary);"></i> {{ school.name }}
            </h5>
            <span class="badge-custom bg-secondary">{{ school.schoolKey }}</span>
          </div>
          <div class="school-info-row" *ngIf="school.subscription">
            <span class="badge-custom" [class.bg-success]="school.subscription.isActive" [class.bg-danger]="!school.subscription.isActive">
              <i [class]="school.subscription.isActive ? 'fas fa-circle' : 'fas fa-times-circle'" style="font-size:0.4rem;"></i>
              {{ school.subscription.isActive ? 'نشط' : 'منتهي' }}
            </span>
            <span class="badge-custom bg-secondary">
              <i class="fas fa-clock"></i> {{ school.subscription.daysRemaining || 0 }} يوم
            </span>
          </div>
        </div>

        <!-- STATS -->
        <div class="stats-grid" *ngIf="summary">
          <div class="stat-card">
            <span class="stat-label"><i class="fas fa-arrow-down" style="color:var(--primary);"></i> الإيرادات</span>
            <span class="stat-value" style="color:var(--primary);">{{ summary.totalIncome | number }} د.ج</span>
          </div>
          <div class="stat-card">
            <span class="stat-label"><i class="fas fa-arrow-up" style="color:var(--danger);"></i> المصروفات</span>
            <span class="stat-value" style="color:var(--danger);">{{ summary.totalExpenses | number }} د.ج</span>
          </div>
          <div class="stat-card">
            <span class="stat-label"><i class="fas fa-wallet" style="color:var(--secondary);"></i> صافي المبلغ</span>
            <span class="stat-value" [style.color]="(summary.totalIncome - summary.totalExpenses) >= 0 ? 'var(--secondary)' : 'var(--danger)'">
              {{ summary.totalIncome - summary.totalExpenses | number }} د.ج
            </span>
          </div>
          <div class="stat-card">
            <span class="stat-label"><i class="fas fa-list" style="color:var(--warning);"></i> المعاملات</span>
            <span class="stat-value" style="color:var(--warning);">{{ summary.totalTransactions }}</span>
          </div>
        </div>

        <!-- FILTER BAR -->
        <div class="filter-bar">
          <button class="btn btn-outline-primary" [class.active]="filterType === 'all'" (click)="setFilter('all')">
            الكل ({{ transactions.length }})
          </button>
          <button class="btn btn-outline-success" [class.active]="filterType === 'income'" (click)="setFilter('income')">
            <i class="fas fa-arrow-down"></i> إيرادات ({{ getIncomeCount() }})
          </button>
          <button class="btn btn-outline-danger" [class.active]="filterType === 'expense'" (click)="setFilter('expense')">
            <i class="fas fa-arrow-up"></i> مصروفات ({{ getExpenseCount() }})
          </button>
          <button class="btn btn-outline-primary" [class.active]="filterType === 'payment'" (click)="setFilter('payment')">
            <i class="fas fa-money-bill-wave"></i> دفعات ({{ getPaymentCount() }})
          </button>
          <button class="btn btn-outline-warning" [class.active]="filterType === 'commission'" (click)="setFilter('commission')">
            <i class="fas fa-star"></i> عمولات ({{ getCommissionCount() }})
          </button>
        </div>

        <!-- TABLE -->
        <div class="table-container">
          <div class="table-responsive">
            <table class="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>الوصف</th>
                  <th>النوع</th>
                  <th>المبلغ</th>
                  <th>التصنيف</th>
                  <th>التاريخ</th>
                  <th>الحالة</th>
                  <th>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngIf="filteredTransactions.length === 0">
                  <td colspan="8">
                    <div class="empty-state">
                      <i class="fas fa-inbox"></i>
                      <p>لا توجد معاملات مدفوعة لهذا اليوم</p>
                    </div>
                  </td>
                </tr>
                <tr *ngFor="let transaction of filteredTransactions; let i = index">
                  <td style="font-weight:600; color:var(--text-light);">{{ i + 1 }}</td>
                  <td style="max-width:150px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-weight:500;">
                    {{ transaction.description || 'غير محدد' }}
                  </td>
                  <td>
                    <span class="badge-custom"
                          [class.bg-success]="transaction.type === 'income'"
                          [class.bg-danger]="transaction.type === 'expense'"
                          [class.bg-primary]="transaction._type === 'payment'"
                          [class.bg-warning]="transaction._type === 'commission'">
                      {{ transaction.typeLabel || transaction.type || 'غير محدد' }}
                    </span>
                  </td>
                  <td style="font-weight:700;" [class.text-success]="transaction.type === 'income'" [class.text-danger]="transaction.type === 'expense'">
                    {{ transaction.amount | number }}
                  </td>
                  <td>
                    <span class="badge-custom bg-secondary">{{ transaction.category || 'غير محدد' }}</span>
                  </td>
                  <td style="direction:ltr; text-align:right; font-size:0.75rem;">
                    {{ (transaction.paymentDate || transaction.date || transaction.createdAt) | date:'HH:mm' }}
                  </td>
                  <td>
                    <span class="badge-custom"
                          [class.bg-success]="transaction.status === 'paid'"
                          [class.bg-warning]="transaction.status === 'pending'"
                          [class.bg-danger]="transaction.status === 'late'">
                      {{ transaction.status === 'paid' ? 'مدفوع' : (transaction.status === 'pending' ? 'معلق' : 'متأخر') }}
                    </span>
                  </td>
                  <td>
                    <div class="action-group">
                      <button class="action-btn view" (click)="viewTransaction(transaction)"><i class="fas fa-eye"></i></button>
                      <button class="action-btn delete" (click)="deleteTransaction(transaction)"><i class="fas fa-trash-alt"></i></button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- EXPENSE MODAL -->
    <div class="modal-overlay" *ngIf="showExpenseModal" (click)="closeExpenseModal()">
      <div class="modal-container" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h5><i class="fas fa-plus-circle" style="color:var(--primary);"></i> إضافة مصروف</h5>
          <button class="action-btn" style="background:transparent; color:var(--text-light); font-size:1.2rem;" (click)="closeExpenseModal()">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <form #expenseForm="ngForm" (ngSubmit)="submitExpense(expenseForm)">
            <div class="form-group">
              <label>وصف المصروف <span class="text-danger">*</span></label>
              <input type="text" class="form-control" name="description" [(ngModel)]="newExpense.description" required placeholder="مثال: فواتير الكهرباء">
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>المبلغ (د.ج) <span class="text-danger">*</span></label>
                <input type="number" class="form-control" name="amount" [(ngModel)]="newExpense.amount" required min="1" placeholder="0">
              </div>
              <div class="form-group">
                <label>التصنيف <span class="text-danger">*</span></label>
                <select class="form-control" name="category" [(ngModel)]="newExpense.category" required>
                  <option value="tuition">رسوم دراسية</option>
                  <option value="salary">رواتب</option>
                  <option value="rent">إيجار</option>
                  <option value="utilities">فواتير</option>
                  <option value="supplies">مستلزمات</option>
                  <option value="other">أخرى</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label>طريقة الدفع</label>
              <select class="form-control" name="paymentMethod" [(ngModel)]="newExpense.paymentMethod">
                <option value="cash">نقداً</option>
                <option value="bank_transfer">تحويل بنكي</option>
                <option value="cheque">شيك</option>
              </select>
            </div>
            <div class="form-group">
              <label>ملاحظات</label>
              <textarea class="form-control" name="notes" [(ngModel)]="newExpense.notes" rows="2" placeholder="أي ملاحظات إضافية..."></textarea>
            </div>

            <div class="modal-footer" style="margin-top:6px; padding:12px 0 0 0; border-top:1px solid var(--border-light); border-radius:0;">
              <button type="button" class="btn btn-outline" (click)="closeExpenseModal()">إلغاء</button>
              <button type="submit" class="btn btn-primary" [disabled]="!expenseForm.valid || isSubmitting" style="min-width:120px;">
                <i class="fas fa-spinner fa-spin" *ngIf="isSubmitting"></i>
                {{ isSubmitting ? 'جاري الحفظ...' : 'حفظ المصروف' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- NOTIFICATIONS -->
    <div class="notifications-container">
      <div *ngFor="let note of notifications" class="notification" [class]="note.type">
        <i [class]="note.type === 'success' ? 'fas fa-check-circle' : (note.type === 'error' ? 'fas fa-exclamation-circle' : 'fas fa-info-circle')"></i>
        <span>{{ note.message }}</span>
      </div>
    </div>
  `
})
export class OnPaymentsComponentComponent implements OnInit {

  private apiUrl = environment.apiUrl;

  school: School | null = null;
  transactions: Transaction[] = [];
  filteredTransactions: Transaction[] = [];

  summary: any = {
    totalIncome: 0,
    totalExpenses: 0,
    totalTransactions: 0
  };

  todayDate: string = '';
  filterType: string = 'all';

  showExpenseModal: boolean = false;
  isSubmitting: boolean = false;
  newExpense: any = {
    description: '',
    amount: null,
    category: 'other',
    paymentMethod: 'cash',
    notes: ''
  };

  notifications: any[] = [];

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    const now = new Date();
    this.todayDate = now.toLocaleDateString('ar-EG', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    this.loadSchoolData();
    this.loadTransactions();
  }

  loadSchoolData(): void {
    try {
      const schoolData = localStorage.getItem('school');
      if (schoolData) {
        this.school = JSON.parse(schoolData);
      } else {
        this.showNotification('warning', 'لم يتم العثور على بيانات المدرسة');
      }
    } catch (e) {
      console.error('❌ خطأ في قراءة بيانات المدرسة:', e);
      this.showNotification('error', 'حدث خطأ في قراءة بيانات المدرسة');
    }
  }

  loadTransactions(): void {
    if (!this.school || !this.school._id) {
      this.showNotification('warning', 'بيانات المدرسة غير متوفرة');
      return;
    }

    const schoolId = this.school._id;

    this.http.get<any>(`${this.apiUrl}/accounting/todays-transactions/${schoolId}`)
      .subscribe({
        next: (response) => {
          if (response && response.success) {
            const allTransactions = response.transactions || [];

            this.transactions = allTransactions.filter(t => {
              const status = t.status || t._type || '';
              return status === 'paid' ||
                     status === 'مدفوع' ||
                     (t.type === 'expense' && t.status === 'paid') ||
                     (t.type === 'income' && t.status === 'paid') ||
                     t._type === 'payment' ||
                     t._type === 'commission' ||
                     t._type === 'registration_fee';
            });

            this.summary = {
              totalIncome: 0,
              totalExpenses: 0,
              totalTransactions: this.transactions.length
            };

            this.transactions.forEach(t => {
              if (t.type === 'income' || t._type === 'payment' || t._type === 'registration_fee') {
                this.summary.totalIncome += t.amount;
              } else if (t.type === 'expense' || t._type === 'expense' || t._type === 'commission') {
                this.summary.totalExpenses += t.amount;
              }
            });

            if (response.date && response.date.formatted) {
              this.todayDate = response.date.formatted;
            }

            this.applyFilter();
            this.showNotification('success', `✅ تم تحميل ${this.transactions.length} معاملة مدفوعة`);
          } else {
            this.showNotification('error', response?.error || 'فشل في تحميل المعاملات');
          }
        },
        error: (err) => {
          console.error('❌ خطأ في جلب المعاملات:', err);
          this.showNotification('error', err.error?.error || 'حدث خطأ أثناء تحميل المعاملات');
        }
      });
  }

  refreshData(): void {
    this.loadTransactions();
  }

  setFilter(type: string): void {
    this.filterType = type;
    this.applyFilter();
  }

  applyFilter(): void {
    if (this.filterType === 'all') {
      this.filteredTransactions = [...this.transactions];
    } else {
      this.filteredTransactions = this.transactions.filter(t => {
        if (this.filterType === 'income') {
          return t.type === 'income' || t._type === 'payment' || t._type === 'registration_fee';
        }
        if (this.filterType === 'expense') {
          return t.type === 'expense' || t._type === 'expense';
        }
        if (this.filterType === 'payment') {
          return t._type === 'payment' || t._type === 'registration_fee';
        }
        if (this.filterType === 'commission') {
          return t._type === 'commission';
        }
        return true;
      });
    }
  }

  getIncomeCount(): number {
    return this.transactions.filter(t => t.type === 'income' || t._type === 'payment' || t._type === 'registration_fee').length;
  }

  getExpenseCount(): number {
    return this.transactions.filter(t => t.type === 'expense' || t._type === 'expense').length;
  }

  getPaymentCount(): number {
    return this.transactions.filter(t => t._type === 'payment' || t._type === 'registration_fee').length;
  }

  getCommissionCount(): number {
    return this.transactions.filter(t => t._type === 'commission').length;
  }

  viewTransaction(transaction: Transaction): void {
    this.showNotification('info', `المعاملة: ${transaction.description || 'غير محدد'} - ${transaction.amount} د.ج`);
  }

  deleteTransaction(transaction: Transaction): void {
    if (!confirm(`هل أنت متأكد من حذف هذه المعاملة؟\n${transaction.description || 'غير محدد'} - ${transaction.amount} د.ج`)) {
      return;
    }

    const endpoint = this.getDeleteEndpoint(transaction);
    if (!endpoint) {
      this.showNotification('error', 'لا يمكن حذف هذا النوع من المعاملات');
      return;
    }

    this.http.delete(`${this.apiUrl}${endpoint}/${transaction._id}`)
      .subscribe({
        next: () => {
          this.showNotification('success', '✅ تم حذف المعاملة بنجاح');
          this.refreshData();
        },
        error: (err) => {
          console.error('❌ خطأ في حذف المعاملة:', err);
          this.showNotification('error', err.error?.error || 'فشل في حذف المعاملة');
        }
      });
  }

  getDeleteEndpoint(transaction: Transaction): string | null {
    if (transaction._type === 'payment' || transaction._type === 'registration_fee') {
      return '/payments';
    }
    if (transaction._type === 'expense') {
      return '/accounting/expenses';
    }
    if (transaction._type === 'commission') {
      return '/accounting/teacher-commissions';
    }
    if (transaction._type === 'financial_transaction') {
      return '/accounting/transactions';
    }
    return null;
  }

  openAddExpense(): void {
    this.newExpense = {
      description: '',
      amount: null,
      category: 'other',
      paymentMethod: 'cash',
      notes: ''
    };
    this.showExpenseModal = true;
    document.body.style.overflow = 'hidden';
  }

  closeExpenseModal(): void {
    this.showExpenseModal = false;
    document.body.style.overflow = '';
  }

  submitExpense(form: any): void {
    if (!form.valid) return;

    const schoolId = this.school?._id;
    if (!schoolId) {
      this.showNotification('error', 'بيانات المدرسة غير متوفرة');
      return;
    }

    this.isSubmitting = true;

    const payload = {
      schoolId: schoolId,
      description: this.newExpense.description,
      amount: this.newExpense.amount,
      category: this.newExpense.category,
      paymentMethod: this.newExpense.paymentMethod,
      notes: this.newExpense.notes,
      type: 'operational',
      status: 'paid',
      date: new Date()
    };

    this.http.post<any>(`${this.apiUrl}/accounting/expenses`, payload)
      .subscribe({
        next: (res) => {
          this.isSubmitting = false;
          if (res && res.success) {
            this.showNotification('success', '✅ تم تسجيل المصروف بنجاح');
            this.closeExpenseModal();
            this.refreshData();
          } else {
            this.showNotification('error', res?.error || 'فشل في تسجيل المصروف');
          }
        },
        error: (err) => {
          this.isSubmitting = false;
          console.error('❌ خطأ في إضافة المصروف:', err);
          this.tryAlternativeExpenseEndpoint(payload);
        }
      });
  }

  tryAlternativeExpenseEndpoint(payload: any): void {
    const altPayload = {
      schoolId: payload.schoolId,
      type: 'expense',
      amount: payload.amount,
      description: payload.description,
      category: payload.category,
      date: payload.date,
      reference: `EXP-${Date.now()}`
    };

    this.http.post<any>(`${this.apiUrl}/accounting/transactions`, altPayload)
      .subscribe({
        next: (res) => {
          this.isSubmitting = false;
          if (res && res.success) {
            this.showNotification('success', '✅ تم تسجيل المصروف بنجاح');
            this.closeExpenseModal();
            this.refreshData();
          } else {
            this.showNotification('error', 'فشل في تسجيل المصروف');
          }
        },
        error: (err2) => {
          this.isSubmitting = false;
          this.showNotification('error', 'حدث خطأ أثناء حفظ المصروف. يرجى المحاولة مرة أخرى.');
        }
      });
  }

  showNotification(type: 'success' | 'error' | 'warning' | 'info', message: string): void {
    const notification = { id: Date.now(), type, message };
    this.notifications.unshift(notification);
    setTimeout(() => {
      this.notifications = this.notifications.filter(n => n.id !== notification.id);
    }, 5000);
  }

  goBack(): void {
    this.router.navigate(['/home/dashboard']);
  }
}