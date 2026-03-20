import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

interface Student {
  _id: string;
  name: string;
  studentId?: string;
  parentPhone: string;
  parentEmail?: string;
  academicYear: string;
  status: string;
  active: boolean;
}

interface MessageTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  fields: TemplateField[];
}

interface TemplateField {
  name: string;
  label: string;
  type: string;
  required: boolean;
}

@Component({
  selector: 'app-messages-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="messages-dashboard" dir="rtl">
      <!-- Loading Overlay -->
      <div class="loading-overlay" *ngIf="loading">
        <div class="spinner"></div>
        <p>جاري تحميل البيانات...</p>
      </div>

      <!-- Header with WhatsApp Status -->
      <div class="header">
        <div class="header-content">
          <h1>
            <span class="icon">📱</span>
            نظام الرسائل عبر واتساب
          </h1>
          <p class="subtitle">إرسال رسائل وإشعارات لأولياء الأمور عبر واتساب</p>
        </div>
        <div class="status-badge" [class.connected]="whatsappConnected">
          <span class="status-dot"></span>
          <span class="status-text">{{ whatsappConnected ? 'متصل' : 'غير متصل' }}</span>
          <span class="phone-number" *ngIf="whatsappNumber">({{ whatsappNumber }})</span>
        </div>
        <button class="refresh-btn" (click)="refreshData()" title="تحديث البيانات">
          🔄 تحديث
        </button>
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon" style="background: #e3f2fd; color: #1976d2;">📨</div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.totalMessages || 0 }}</div>
            <div class="stat-label">إجمالي الرسائل</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background: #e8f5e9; color: #388e3c;">✅</div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.successfulMessages || 0 }}</div>
            <div class="stat-label">تم الإرسال</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background: #fff3e0; color: #f57c00;">👥</div>
          <div class="stat-content">
            <div class="stat-value">{{ students.length }}</div>
            <div class="stat-label">أولياء الأمور</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background: #fce4ec; color: #c2185b;">💰</div>
          <div class="stat-content">
            <div class="stat-value">{{ lateStudentsCount }}</div>
            <div class="stat-label">دفعات متأخرة</div>
          </div>
        </div>
      </div>

      <!-- Tabs Navigation -->
      <div class="tabs">
        <button 
          *ngFor="let tab of tabs" 
          class="tab-btn" 
          [class.active]="activeTab === tab.id"
          (click)="activeTab = tab.id">
          <span class="tab-icon">{{ tab.icon }}</span>
          <span class="tab-label">{{ tab.name }}</span>
        </button>
      </div>

      <!-- Tab Content: إرسال رسالة غياب -->
      <div class="tab-content" *ngIf="activeTab === 'absence'">
        <div class="content-header">
          <h2><span class="icon">🔴</span> إرسال رسالة غياب عبر واتساب</h2>
          <p>إرسال إشعار غياب لولي أمر الطالب</p>
        </div>

        <div class="form-grid">
          <div class="form-group">
            <label>اختر الطالب</label>
            <select class="form-control" [(ngModel)]="selectedAbsenceStudentId">
              <option value="">-- اختر طالباً --</option>
              <option *ngFor="let student of students" [value]="student._id">
                {{ student.name }} ({{ student.academicYear }}) - {{ student.parentPhone }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>نص الرسالة (اختياري)</label>
            <textarea 
              class="form-control" 
              rows="4"
              placeholder="اترك هذا الحقل فارغاً لاستخدام الرسالة الافتراضية..."
              [(ngModel)]="absenceMessage.customMessage"></textarea>
          </div>

          <div class="preview-box" *ngIf="getSelectedStudent(selectedAbsenceStudentId) as student">
            <h4>معاينة الرسالة:</h4>
            <div class="message-preview">
              🔴 *تنبيه غياب*
              
              عزيزي ولي أمر الطالب/ة *{{ student.name }}*
              نود إعلامكم بأن الطالب/ة لم يحضر اليوم *{{ getCurrentDate() }}*
              يرجى التواصل مع إدارة المدرسة لمعرفة أسباب الغياب.

              مع تحيات إدارة المدرسة
            </div>
          </div>

          <div class="form-actions">
            <button 
              class="btn-primary" 
              [disabled]="!selectedAbsenceStudentId || sending"
              (click)="sendAbsenceMessage()">
              <span class="spinner" *ngIf="sending"></span>
              {{ sending ? 'جاري الإرسال عبر واتساب...' : 'إرسال رسالة الغياب' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Tab Content: تأخر الدفع -->
      <div class="tab-content" *ngIf="activeTab === 'late-payment'">
        <div class="content-header">
          <h2><span class="icon">💰</span> تنبيهات تأخر الدفع عبر واتساب</h2>
          <p>إرسال تنبيهات للطلاب المتأخرين في الدفع</p>
        </div>

        <div class="filters-bar">
          <select class="form-control" [(ngModel)]="latePaymentFilters.class">
            <option value="">جميع الحصص</option>
            <option *ngFor="let class of uniqueClasses" [value]="class">{{ class }}</option>
          </select>
        </div>

        <div class="students-list" *ngIf="lateStudents.length > 0">
          <div class="list-header">
            <span>الطالب</span>
            <span>الحصة</span>
            <span>المبلغ</span>
            <span>تاريخ الاستحقاق</span>
            <span>الإجراء</span>
          </div>

          <div *ngFor="let student of filteredLateStudents" class="list-item">
            <div class="student-info">
              <span class="student-name">{{ student.name }}</span>
              <span class="student-phone">{{ student.parentPhone }}</span>
            </div>
            <span class="student-class">{{ student.academicYear }}</span>
            <span class="amount">{{ student.totalAmountDue || 5000 }} د.ج</span>
            <span class="due-date">{{ student.paymentDue || getTodayDate() }}</span>
            <button 
              class="btn-sm btn-warning"
              [disabled]="sending"
              (click)="sendLatePaymentMessage(student)">
              إرسال تنبيه عبر واتساب
            </button>
          </div>
        </div>

        <div class="no-data" *ngIf="lateStudents.length === 0">
          <span class="icon">💰</span>
          <p>لا توجد دفعات متأخرة</p>
        </div>
      </div>

      <!-- Tab Content: بدء الحصة -->
      <div class="tab-content" *ngIf="activeTab === 'class-started'">
        <div class="content-header">
          <h2><span class="icon">📚</span> إشعار بدء الحصة عبر واتساب</h2>
          <p>إرسال إشعار لأولياء الأمور عند بدء الحصة</p>
        </div>

        <div class="form-grid">
          <div class="form-group">
            <label>اختر الحصة</label>
            <select class="form-control" [(ngModel)]="classStartedData.classId">
              <option value="">اختر حصة...</option>
              <option *ngFor="let class of uniqueClasses" [value]="class">{{ class }}</option>
            </select>
          </div>

          <div class="form-group">
            <label>نوع الإرسال</label>
            <div class="radio-group">
              <label class="radio-label">
                <input type="radio" name="sendToAll" [value]="true" [(ngModel)]="classStartedData.sendToAll">
                جميع الطلاب
              </label>
              <label class="radio-label">
                <input type="radio" name="sendToAll" [value]="false" [(ngModel)]="classStartedData.sendToAll">
                اختيار طلاب محددين
              </label>
            </div>
          </div>

          <div class="form-group" *ngIf="!classStartedData.sendToAll">
            <label>اختر الطلاب</label>
            <div class="students-selector">
              <div *ngFor="let student of getClassStudents(classStartedData.classId)" class="checkbox-label">
                <input 
                  type="checkbox" 
                  [value]="student._id"
                  (change)="toggleStudentSelection(student._id)">
                {{ student.name }} - {{ student.parentPhone }}
              </div>
            </div>
          </div>

          <div class="form-group">
            <label>نص الرسالة (اختياري)</label>
            <textarea 
              class="form-control" 
              rows="4"
              [(ngModel)]="classStartedData.customMessage"></textarea>
          </div>

          <div class="preview-box" *ngIf="classStartedData.classId">
            <h4>معاينة الرسالة:</h4>
            <div class="message-preview">
              📚 *بدء الحصة*
              
              عزيزي ولي الأمر،
              نود إعلامكم بأن حصة *{{ classStartedData.classId }}* قد بدأت الآن.
              📅 التاريخ: {{ getCurrentDate() }}
              ⏰ الوقت: {{ getCurrentTime() }}

              مع تحيات إدارة المدرسة
            </div>
          </div>

          <div class="form-actions">
            <button 
              class="btn-primary" 
              [disabled]="!classStartedData.classId || sending"
              (click)="sendClassStartedMessage()">
              {{ sending ? 'جاري الإرسال...' : 'إرسال إشعار بدء الحصة' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Tab Content: تأخر طالب -->
      <div class="tab-content" *ngIf="activeTab === 'student-late'">
        <div class="content-header">
          <h2><span class="icon">⏰</span> إشعار تأخر طالب عبر واتساب</h2>
          <p>إرسال إشعار عند تأخر الطالب عن الحصة</p>
        </div>

        <div class="form-grid">
          <div class="form-group">
            <label>اختر الطالب</label>
            <select class="form-control" [(ngModel)]="selectedLateStudentId">
              <option value="">-- اختر طالباً --</option>
              <option *ngFor="let student of students" [value]="student._id">
                {{ student.name }} ({{ student.academicYear }}) - {{ student.parentPhone }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>مدة التأخير (بالدقائق)</label>
            <input 
              type="number" 
              class="form-control" 
              [(ngModel)]="lateData.lateMinutes"
              placeholder="مثال: 15"
              min="1"
              max="120">
          </div>

          <div class="form-group">
            <label>نص الرسالة (اختياري)</label>
            <textarea 
              class="form-control" 
              rows="4"
              [(ngModel)]="lateData.customMessage"></textarea>
          </div>

          <div class="preview-box" *ngIf="getSelectedStudent(selectedLateStudentId) as student">
            <h4>معاينة الرسالة:</h4>
            <div class="message-preview">
              ⏰ *تنبيه تأخر*
              
              عزيزي ولي أمر الطالب/ة *{{ student.name }}*
              نود إعلامكم بأن الطالب/ة تأخر عن الحصة اليوم.
              📅 التاريخ: {{ getCurrentDate() }}
              ⏰ وقت الوصول: {{ getCurrentTime() }}
              ⌛ مدة التأخير: {{ lateData.lateMinutes || 15 }} دقيقة
              يرجى التنبيه على الطالب بالالتزام بالمواعيد.

              مع تحيات إدارة المدرسة
            </div>
          </div>

          <div class="form-actions">
            <button 
              class="btn-primary" 
              [disabled]="!selectedLateStudentId || sending"
              (click)="sendLateMessage()">
              {{ sending ? 'جاري الإرسال...' : 'إرسال إشعار التأخير' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Tab Content: رسالة جماعية -->
      <div class="tab-content" *ngIf="activeTab === 'bulk'">
        <div class="content-header">
          <h2><span class="icon">👥</span> رسالة جماعية عبر واتساب</h2>
          <p>إرسال رسالة لمجموعة من أولياء الأمور</p>
        </div>

        <div class="form-grid">
          <div class="form-group">
            <label>اختر المستلمين</label>
            <div class="recipient-options">
              <div class="option-group">
                <label class="radio-label">
                  <input type="radio" name="bulkRecipientType" value="all" [(ngModel)]="bulkData.recipientType">
                  جميع أولياء الأمور
                </label>
                <label class="radio-label">
                  <input type="radio" name="bulkRecipientType" value="class" [(ngModel)]="bulkData.recipientType">
                  حصة محددة
                </label>
                <label class="radio-label">
                  <input type="radio" name="bulkRecipientType" value="late" [(ngModel)]="bulkData.recipientType">
                  المتأخرين في الدفع فقط
                </label>
              </div>

              <div class="option-controls" *ngIf="bulkData.recipientType === 'class'">
                <select class="form-control" [(ngModel)]="bulkData.classId">
                  <option value="">اختر الحصة</option>
                  <option *ngFor="let class of uniqueClasses" [value]="class">{{ class }}</option>
                </select>
              </div>
            </div>
          </div>

          <div class="recipients-count" *ngIf="getRecipientsCount() > 0">
            عدد المستلمين: {{ getRecipientsCount() }} ولي أمر
          </div>

          <div class="form-group">
            <label>نص الرسالة</label>
            <textarea 
              class="form-control" 
              rows="6"
              placeholder="اكتب نص الرسالة هنا..."
              [(ngModel)]="bulkData.message"></textarea>
            <div class="char-counter">{{ bulkData.message?.length || 0 }}/500</div>
          </div>

          <div class="form-actions">
            <button 
              class="btn-primary" 
              [disabled]="!bulkData.message || sending || getRecipientsCount() === 0"
              (click)="sendBulkMessage()">
              <span class="spinner" *ngIf="sending"></span>
              {{ sending ? 'جاري الإرسال...' : 'إرسال الرسالة الجماعية' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Tab Content: قوالب جاهزة -->
      <div class="tab-content" *ngIf="activeTab === 'templates'">
        <div class="content-header">
          <h2><span class="icon">📋</span> قوالب جاهزة</h2>
          <p>استخدم قالباً جاهزاً لإرسال رسالة عبر واتساب</p>
        </div>

        <div class="templates-grid">
          <div *ngFor="let template of templates" class="template-card">
            <div class="template-icon">{{ template.icon }}</div>
            <h3>{{ template.name }}</h3>
            <p>{{ template.description }}</p>
            <button class="btn-outline" (click)="openTemplateModal(template)">استخدام القالب</button>
          </div>
        </div>
      </div>

      <!-- Tab Content: سجل الرسائل -->
      <div class="tab-content" *ngIf="activeTab === 'history'">
        <div class="content-header">
          <h2><span class="icon">📜</span> سجل الرسائل المرسلة</h2>
          <p>عرض سجل الرسائل المرسلة عبر واتساب</p>
        </div>

        <div class="history-filters">
          <select class="form-control" [(ngModel)]="historyFilters.type">
            <option value="">جميع الأنواع</option>
            <option value="absence">غياب</option>
            <option value="late_payment_reminder">تأخر دفع</option>
            <option value="bulk">جماعية</option>
          </select>

          <input 
            type="date" 
            class="form-control" 
            [(ngModel)]="historyFilters.startDate"
            placeholder="من تاريخ">

          <input 
            type="date" 
            class="form-control" 
            [(ngModel)]="historyFilters.endDate"
            placeholder="إلى تاريخ">

          <button class="btn-primary" (click)="loadMessageHistory()">بحث</button>
        </div>

        <div class="stats-summary" *ngIf="historyStats.total > 0">
          <div class="stat-item">
            <span class="stat-label">إجمالي الرسائل:</span>
            <span class="stat-value">{{ historyStats.total }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">نسبة النجاح:</span>
            <span class="stat-value success">{{ historyStats.successRate }}%</span>
          </div>
        </div>

        <div class="messages-list">
          <div *ngFor="let message of messageHistory" class="message-item">
            <div class="message-header">
              <span class="message-type" [ngClass]="getMessageTypeClass(message.messageType || message.type)">
                {{ getMessageTypeName(message.messageType || message.type) }}
              </span>
              <span class="message-date">{{ (message.sentAt || message.createdAt | date:'yyyy/MM/dd HH:mm') }}</span>
            </div>
            <div class="message-content">{{ message.content || message.text }}</div>
            <div class="message-footer">
              <span class="recipients-count">
                {{ getSuccessfulCount(message) }}/{{ getTotalCount(message) }} تم الإرسال
              </span>
              <button class="btn-link" (click)="viewMessageDetails(message)">عرض التفاصيل</button>
            </div>
          </div>
        </div>

        <div class="no-data" *ngIf="messageHistory.length === 0">
          <span class="icon">📭</span>
          <p>لا توجد رسائل</p>
        </div>
      </div>
    </div>

    <!-- Modal for Template -->
    <div class="modal" *ngIf="showTemplateModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>{{ selectedTemplate?.name }}</h2>
          <button class="close-btn" (click)="showTemplateModal = false">×</button>
        </div>

        <div class="modal-body">
          <div *ngFor="let field of selectedTemplate?.fields" class="form-group">
            <label>{{ field.label }}</label>
            <input 
              *ngIf="field.type === 'text' || field.type === 'date' || field.type === 'time'"
              [type]="field.type"
              class="form-control"
              [(ngModel)]="templateData[field.name]">

            <textarea 
              *ngIf="field.type === 'textarea'"
              class="form-control"
              rows="4"
              [(ngModel)]="templateData[field.name]"></textarea>
          </div>

          <div class="form-group">
            <label>اختر المستلمين</label>
            <select class="form-control" [(ngModel)]="templateRecipients">
              <option value="all">جميع أولياء الأمور</option>
              <option *ngFor="let class of uniqueClasses" [value]="class">طلاب حصة {{ class }}</option>
            </select>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-outline" (click)="showTemplateModal = false">إلغاء</button>
          <button class="btn-primary" (click)="sendTemplateMessage()" [disabled]="sending">
            <span class="spinner" *ngIf="sending"></span>
            {{ sending ? 'جاري الإرسال...' : 'إرسال عبر واتساب' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .messages-dashboard {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      direction: rtl;
      position: relative;
    }

    .loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255, 255, 255, 0.8);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 9999;
    }

    .loading-overlay .spinner {
      width: 50px;
      height: 50px;
      border: 5px solid #f3f3f3;
      border-top: 5px solid #25D366;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 20px;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
      padding: 20px;
      background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
      border-radius: 15px;
      color: white;
    }

    .header h1 {
      margin: 0;
      font-size: 28px;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .header .icon {
      font-size: 32px;
    }

    .subtitle {
      margin: 5px 0 0;
      opacity: 0.9;
    }

    .refresh-btn {
      padding: 8px 16px;
      background: rgba(255, 255, 255, 0.2);
      border: 1px solid white;
      border-radius: 30px;
      color: white;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.3s;
    }

    .refresh-btn:hover {
      background: rgba(255, 255, 255, 0.3);
    }

    .status-badge {
      padding: 8px 16px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 30px;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
    }

    .status-badge.connected .status-dot {
      background: #4caf50;
    }

    .status-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #f44336;
    }

    .phone-number {
      font-size: 12px;
      opacity: 0.9;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      margin-bottom: 30px;
    }

    .stat-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 15px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .stat-icon {
      width: 50px;
      height: 50px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
    }

    .stat-value {
      font-size: 24px;
      font-weight: bold;
    }

    .stat-label {
      color: #666;
      font-size: 14px;
    }

    .tabs {
      display: flex;
      gap: 10px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }

    .tab-btn {
      padding: 12px 24px;
      border: none;
      background: white;
      border-radius: 30px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      transition: all 0.3s;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .tab-btn:hover {
      background: #f0f0f0;
    }

    .tab-btn.active {
      background: #25D366;
      color: white;
    }

    .tab-content {
      background: white;
      border-radius: 12px;
      padding: 25px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .content-header {
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 2px solid #f0f0f0;
    }

    .content-header h2 {
      margin: 0;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .form-grid {
      display: grid;
      gap: 20px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .form-group label {
      font-weight: 600;
      color: #333;
    }

    .form-control {
      padding: 10px 12px;
      border: 1px solid #ddd;
      border-radius: 8px;
      font-size: 14px;
      font-family: inherit;
    }

    .form-control:focus {
      outline: none;
      border-color: #25D366;
    }

    textarea.form-control {
      resize: vertical;
    }

    .preview-box {
      background: #f9f9f9;
      border: 1px solid #eee;
      border-radius: 8px;
      padding: 15px;
    }

    .preview-box h4 {
      margin: 0 0 10px;
      color: #666;
    }

    .message-preview {
      white-space: pre-line;
      font-family: monospace;
      padding: 10px;
      background: white;
      border-radius: 4px;
      border-right: 3px solid #25D366;
    }

    .checkbox-label, .radio-label {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      padding: 5px;
    }

    .radio-group {
      display: flex;
      gap: 20px;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 20px;
    }

    .btn-primary {
      padding: 12px 24px;
      background: #25D366;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 16px;
      transition: background 0.3s;
    }

    .btn-primary:hover:not(:disabled) {
      background: #128C7E;
    }

    .btn-primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-outline {
      padding: 8px 16px;
      background: transparent;
      border: 1px solid #ddd;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.3s;
    }

    .btn-outline:hover {
      background: #f5f5f5;
    }

    .btn-sm {
      padding: 6px 12px;
      font-size: 12px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }

    .btn-warning {
      background: #f59e0b;
      color: white;
    }

    .btn-warning:hover {
      background: #d97706;
    }

    .btn-link {
      background: none;
      border: none;
      color: #25D366;
      cursor: pointer;
      text-decoration: underline;
    }

    .spinner {
      display: inline-block;
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255,255,255,0.3);
      border-radius: 50%;
      border-top-color: white;
      animation: spin 1s ease-in-out infinite;
      margin-left: 8px;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .filters-bar {
      display: flex;
      gap: 10px;
      margin-bottom: 20px;
    }

    .students-list {
      border: 1px solid #ddd;
      border-radius: 8px;
      overflow: hidden;
    }

    .list-header {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
      padding: 12px;
      background: #f5f5f5;
      font-weight: 600;
    }

    .list-item {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
      padding: 12px;
      border-bottom: 1px solid #eee;
      align-items: center;
    }

    .list-item:last-child {
      border-bottom: none;
    }

    .student-info {
      display: flex;
      flex-direction: column;
    }

    .student-name {
      font-weight: 600;
    }

    .student-phone {
      font-size: 12px;
      color: #666;
    }

    .amount {
      font-weight: 600;
      color: #e53e3e;
    }

    .due-date {
      color: #666;
    }

    .no-data {
      text-align: center;
      padding: 40px;
      color: #999;
    }

    .no-data .icon {
      font-size: 48px;
      display: block;
      margin-bottom: 10px;
    }

    .recipient-options {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    .option-group {
      display: flex;
      gap: 20px;
    }

    .recipients-count {
      padding: 10px;
      background: #e8f5e9;
      border-radius: 8px;
      color: #2e7d32;
      font-weight: 600;
      text-align: center;
    }

    .students-selector {
      max-height: 200px;
      overflow-y: auto;
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 10px;
    }

    .char-counter {
      text-align: left;
      color: #999;
      font-size: 12px;
    }

    .templates-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 20px;
    }

    .template-card {
      padding: 20px;
      border: 1px solid #ddd;
      border-radius: 8px;
      text-align: center;
      transition: all 0.3s;
    }

    .template-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 5px 15px rgba(0,0,0,0.1);
    }

    .template-icon {
      font-size: 48px;
      margin-bottom: 10px;
    }

    .template-card h3 {
      margin: 10px 0 5px;
    }

    .template-card p {
      color: #666;
      font-size: 14px;
      margin-bottom: 15px;
    }

    .history-filters {
      display: flex;
      gap: 10px;
      margin-bottom: 20px;
    }

    .stats-summary {
      display: flex;
      gap: 20px;
      padding: 15px;
      background: #f5f5f5;
      border-radius: 8px;
      margin-bottom: 20px;
    }

    .stat-item {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .stat-value.success {
      color: #2e7d32;
      font-weight: bold;
    }

    .messages-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .message-item {
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 15px;
    }

    .message-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }

    .message-type {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
    }

    .message-type.absence { background: #fee2e2; color: #e53e3e; }
    .message-type.late_payment_reminder { background: #fef3c7; color: #d97706; }
    .message-type.bulk { background: #e0e7ff; color: #4338ca; }
    .message-type.individual { background: #e0f2fe; color: #0369a1; }
    .message-type.class { background: #f3e8ff; color: #7e22ce; }

    .message-date {
      color: #666;
      font-size: 12px;
    }

    .message-content {
      margin-bottom: 10px;
      padding: 10px;
      background: #f9f9f9;
      border-radius: 4px;
      white-space: pre-line;
    }

    .message-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
      color: #666;
    }

    .modal {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-content {
      background: white;
      border-radius: 12px;
      width: 500px;
      max-width: 90%;
    }

    .modal-header {
      padding: 20px;
      border-bottom: 1px solid #eee;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .modal-header h2 {
      margin: 0;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #999;
    }

    .modal-body {
      padding: 20px;
      max-height: 400px;
      overflow-y: auto;
    }

    .modal-footer {
      padding: 20px;
      border-top: 1px solid #eee;
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }

    @media (max-width: 768px) {
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .tabs {
        flex-wrap: wrap;
      }

      .tab-btn {
        flex: 1 1 auto;
      }

      .list-header, .list-item {
        grid-template-columns: 1fr;
        gap: 5px;
      }

      .history-filters {
        flex-direction: column;
      }
    }
  `]
})
export class MessagesDashboardComponent implements OnInit {
  // Tab management
  activeTab = 'absence';
  tabs = [
    { id: 'absence', name: 'رسالة غياب', icon: '🔴' },
    { id: 'late-payment', name: 'تأخر دفع', icon: '💰' },
    { id: 'class-started', name: 'بدء الحصة', icon: '📚' },
    { id: 'student-late', name: 'تأخر طالب', icon: '⏰' },
    { id: 'bulk', name: 'رسالة جماعية', icon: '👥' },
    { id: 'templates', name: 'قوالب جاهزة', icon: '📋' },
    { id: 'history', name: 'سجل الرسائل', icon: '📜' }
  ];

  // Data
  students: any[] = [];
  templates: MessageTemplate[] = [];
  messageHistory: any[] = [];
  selectedStudents: string[] = [];

  // WhatsApp status
  whatsappConnected = false;
  whatsappNumber = '';

  // Stats
  stats = {
    totalMessages: 0,
    successfulMessages: 0
  };
  historyStats = {
    total: 0,
    successRate: 0,
    byType: {}
  };

  // Form data
  selectedAbsenceStudentId = '';
  absenceMessage = {
    customMessage: ''
  };

  latePaymentFilters = {
    class: ''
  };

  classStartedData = {
    classId: '',
    sendToAll: true,
    customMessage: ''
  };

  selectedLateStudentId = '';
  lateData = {
    lateMinutes: 15,
    customMessage: ''
  };

  bulkData = {
    recipientType: 'all',
    classId: '',
    message: ''
  };

  historyFilters = {
    type: '',
    startDate: '',
    endDate: ''
  };

  // Modal
  showTemplateModal = false;
  selectedTemplate: MessageTemplate | null = null;
  templateData: any = {};
  templateRecipients = 'all';

  // UI state
  sending = false;
  loading = false;

  // Add Date constructor for template
  newDate = new Date();

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.refreshData();
  }

  refreshData() {
    this.loadInitialData();
    this.checkWhatsAppStatus();
    this.loadTemplates();
    this.loadMessageHistory();
    this.loadLatePayments();
  }

  loadInitialData() {
    this.loading = true;
    
    // Get all students from the correct endpoint
    this.http.get('http://localhost:5090/api/students').subscribe({
      next: (res: any) => {
        console.log('Students API response:', res);
        
        // Handle different response structures
        if (Array.isArray(res)) {
          this.students = res;
        } else if (res && res.data && Array.isArray(res.data)) {
          this.students = res.data;
        } else if (res && res.students && Array.isArray(res.students)) {
          this.students = res.students;
        } else if (res && res.success && res.data) {
          this.students = res.data;
        } else {
          console.warn('Unexpected students response format:', res);
          this.students = [];
        }
        
        console.log('Loaded students:', this.students.length);
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading students:', err);
        this.loading = false;
        // Fallback to empty array
        this.students = [];
      }
    });
  }

  checkWhatsAppStatus() {
    this.http.get('http://localhost:5090/api/whatsapp/status').subscribe({
      next: (res: any) => {
        console.log('WhatsApp status:', res);
        this.whatsappConnected = res.connected || false;
        this.whatsappNumber = res.number || '';
      },
      error: (err) => {
        console.error('Error checking WhatsApp status:', err);
        this.whatsappConnected = false;
      }
    });
  }

  loadMessageHistory() {
    let params = new URLSearchParams();
    if (this.historyFilters.type) params.set('type', this.historyFilters.type);
    if (this.historyFilters.startDate) params.set('startDate', this.historyFilters.startDate);
    if (this.historyFilters.endDate) params.set('endDate', this.historyFilters.endDate);

    this.http.get(`http://localhost:5090/api/messages/history?${params.toString()}`).subscribe({
      next: (res: any) => {
        console.log('Message history response:', res);
        
        if (res && res.messages) {
          this.messageHistory = res.messages;
        } else if (Array.isArray(res)) {
          this.messageHistory = res;
        } else {
          this.messageHistory = [];
        }
        
        if (res && res.stats) {
          this.historyStats = res.stats;
        }
      },
      error: (err) => {
        console.error('Error loading message history:', err);
        this.messageHistory = [];
      }
    });
  }

  loadTemplates() {
    this.http.get('http://localhost:5090/api/messages/templates').subscribe({
      next: (res: any) => {
        console.log('Templates response:', res);
        
        if (res && res.templates) {
          this.templates = res.templates;
        } else if (Array.isArray(res)) {
          this.templates = res;
        } else {
          this.templates = [];
        }
      },
      error: (err) => {
        console.error('Error loading templates:', err);
        // Fallback to default templates if API fails
        this.templates = [
          {
            id: 'schedule-change',
            name: 'تغيير موعد الحصة',
            description: 'إشعار بتغيير موعد حصة',
            icon: '📅',
            fields: [
              { name: 'className', label: 'اسم الحصة', type: 'text', required: true },
              { name: 'newDate', label: 'التاريخ الجديد', type: 'date', required: true },
              { name: 'newTime', label: 'الوقت الجديد', type: 'time', required: true },
              { name: 'reason', label: 'السبب', type: 'textarea', required: false }
            ]
          },
          {
            id: 'holiday-greeting',
            name: 'تهنئة بمناسبة',
            description: 'رسالة تهنئة بمناسبة دينية أو وطنية',
            icon: '🎉',
            fields: [
              { name: 'occasion', label: 'المناسبة', type: 'text', required: true },
              { name: 'customMessage', label: 'رسالة مخصصة', type: 'textarea', required: false }
            ]
          },
          {
            id: 'exam-reminder',
            name: 'تذكير بالامتحانات',
            description: 'تذكير بموعد الامتحانات',
            icon: '📝',
            fields: [
              { name: 'examName', label: 'اسم الامتحان', type: 'text', required: true },
              { name: 'examDate', label: 'تاريخ الامتحان', type: 'date', required: true }
            ]
          },
          {
            id: 'general-announcement',
            name: 'إعلان عام',
            description: 'إعلان هام لأولياء الأمور',
            icon: '📢',
            fields: [
              { name: 'message', label: 'نص الإعلان', type: 'textarea', required: true }
            ]
          }
        ];
      }
    });
  }

  loadLatePayments() {
    this.http.get('http://localhost:5090/api/notifications/late-payments').subscribe({
      next: (res: any) => {
        console.log('Late payments:', res);
        // Update stats if needed
        if (res && res.students) {
          // You can update UI based on this data
        }
      },
      error: (err) => console.error('Error loading late payments:', err)
    });
  }

  get uniqueClasses(): string[] {
    if (!this.students || this.students.length === 0) {
      return [];
    }
    return [...new Set(this.students.map(s => s.academicYear || s.class || ''))].filter(c => c);
  }

  get lateStudents(): any[] {
    if (!this.students || this.students.length === 0) {
      return [];
    }
    // For demo purposes, mark some students as late
    return this.students.filter((s, index) => index % 3 === 0);
  }

  get lateStudentsCount(): number {
    return this.lateStudents.length;
  }

  get filteredLateStudents(): any[] {
    if (!this.latePaymentFilters.class || !this.lateStudents) {
      return this.lateStudents;
    }
    return this.lateStudents.filter(s => s.academicYear === this.latePaymentFilters.class);
  }

  getSelectedStudent(id: string): any {
    if (!id) return undefined;
    return this.students.find(s => s._id === id);
  }

  getClassStudents(classId: string): any[] {
    if (!classId || !this.students) return [];
    return this.students.filter(s => s.academicYear === classId);
  }

  getSuccessfulCount(message: any): number {
    if (message.results) {
      return message.results.filter((r: any) => r.success).length || 0;
    }
    return message.success ? 1 : 0;
  }

  getTotalCount(message: any): number {
    if (message.results) {
      return message.results.length || 0;
    }
    return message.recipients?.length || 1;
  }

  toggleStudentSelection(studentId: string) {
    const index = this.selectedStudents.indexOf(studentId);
    if (index === -1) {
      this.selectedStudents.push(studentId);
    } else {
      this.selectedStudents.splice(index, 1);
    }
  }

  getRecipientsCount(): number {
    if (!this.students) return 0;
    
    switch (this.bulkData.recipientType) {
      case 'all':
        return this.students.filter(s => s.parentPhone).length;
      case 'class':
        return this.students.filter(s => 
          s.academicYear === this.bulkData.classId && s.parentPhone
        ).length;
      case 'late':
        return this.lateStudents.filter(s => s.parentPhone).length;
      default:
        return 0;
    }
  }

  getCurrentDate(): string {
    return new Date().toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getCurrentTime(): string {
    return new Date().toLocaleTimeString('ar-EG', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getTodayDate(): string {
    return new Date().toLocaleDateString('ar-EG');
  }

  getMessageTypeName(type: string): string {
    const types: any = {
      'absence': 'رسالة غياب',
      'late_payment_reminder': 'تأخر دفع',
      'bulk': 'رسالة جماعية',
      'individual': 'رسالة فردية',
      'class': 'رسالة حصة',
      'template': 'قالب',
      'student-late': 'تأخر طالب',
      'class-started': 'بدء حصة'
    };
    return types[type] || type;
  }

  getMessageTypeClass(type: string): string {
    const classes: any = {
      'absence': 'absence',
      'late_payment_reminder': 'late_payment_reminder',
      'bulk': 'bulk',
      'individual': 'individual',
      'class': 'class',
      'template': 'template',
      'student-late': 'absence',
      'class-started': 'class'
    };
    return classes[type] || '';
  }

  sendAbsenceMessage() {
    if (!this.selectedAbsenceStudentId) {
      alert('الرجاء اختيار طالب');
      return;
    }

    this.sending = true;
    const data = {
      studentId: this.selectedAbsenceStudentId,
      customMessage: this.absenceMessage.customMessage
    };

    this.http.post('http://localhost:5090/api/messages/absence', data).subscribe({
      next: (res: any) => {
        this.sending = false;
        if (res && res.success) {
          alert('✅ تم إرسال رسالة الغياب عبر واتساب بنجاح');
          this.selectedAbsenceStudentId = '';
          this.absenceMessage.customMessage = '';
          this.loadMessageHistory();
          
          this.stats.totalMessages++;
          if (res.data?.result?.success) this.stats.successfulMessages++;
        } else {
          alert('❌ فشل إرسال الرسالة: ' + (res?.error || 'خطأ غير معروف'));
        }
      },
      error: (err) => {
        this.sending = false;
        console.error('Error sending absence message:', err);
        
        let errorMsg = '❌ خطأ في إرسال الرسالة';
        if (err.error?.error) {
          errorMsg += ': ' + err.error.error;
        } else if (err.error?.message) {
          errorMsg += ': ' + err.error.message;
        } else if (err.message) {
          errorMsg += ': ' + err.message;
        }
        
        alert(errorMsg);
      }
    });
  }

  sendLatePaymentMessage(student: any) {
    this.sending = true;
    const data = {
      studentId: student._id,
      amount: 5000,
      month: new Date().toLocaleDateString('ar-EG', { month: 'long' })
    };

    this.http.post('http://localhost:5090/api/messages/late-payment', data).subscribe({
      next: (res: any) => {
        this.sending = false;
        if (res && res.success) {
          alert(`✅ تم إرسال تنبيه الدفع إلى ${student.name} عبر واتساب`);
          this.loadMessageHistory();
          this.stats.totalMessages++;
          if (res.data?.result?.success) this.stats.successfulMessages++;
        } else {
          alert('❌ فشل إرسال الرسالة');
        }
      },
      error: (err) => {
        this.sending = false;
        console.error('Error sending late payment message:', err);
        alert('❌ خطأ في إرسال الرسالة: ' + (err.error?.error || err.message));
      }
    });
  }

  sendClassStartedMessage() {
    if (!this.classStartedData.classId) {
      alert('الرجاء اختيار الحصة');
      return;
    }

    this.sending = true;
    const data: any = {
      classId: this.classStartedData.classId,
      sendToAll: this.classStartedData.sendToAll,
      customMessage: this.classStartedData.customMessage
    };

    if (!this.classStartedData.sendToAll && this.selectedStudents.length > 0) {
      data.specificStudents = this.selectedStudents;
    }

    this.http.post('http://localhost:5090/api/messages/class-started', data).subscribe({
      next: (res: any) => {
        this.sending = false;
        if (res && res.success) {
          alert(res.message || '✅ تم إرسال إشعار بدء الحصة بنجاح');
          this.classStartedData.classId = '';
          this.classStartedData.customMessage = '';
          this.selectedStudents = [];
          this.loadMessageHistory();
          
          if (res.data?.results) {
            this.stats.totalMessages += res.data.results.length;
            this.stats.successfulMessages += res.data.results.filter((r: any) => r.success).length;
          }
        } else {
          alert('❌ فشل إرسال الرسالة');
        }
      },
      error: (err) => {
        this.sending = false;
        console.error('Error sending class started message:', err);
        alert('❌ خطأ في إرسال الرسالة: ' + (err.error?.error || err.message));
      }
    });
  }

  sendLateMessage() {
    if (!this.selectedLateStudentId) {
      alert('الرجاء اختيار طالب');
      return;
    }

    this.sending = true;
    const data = {
      studentId: this.selectedLateStudentId,
      lateMinutes: this.lateData.lateMinutes,
      customMessage: this.lateData.customMessage
    };

    this.http.post('http://localhost:5090/api/messages/student-late', data).subscribe({
      next: (res: any) => {
        this.sending = false;
        if (res && res.success) {
          alert('✅ تم إرسال إشعار التأخير عبر واتساب بنجاح');
          this.selectedLateStudentId = '';
          this.lateData.customMessage = '';
          this.loadMessageHistory();
          this.stats.totalMessages++;
          if (res.data?.result?.success) this.stats.successfulMessages++;
        } else {
          alert('❌ فشل إرسال الرسالة');
        }
      },
      error: (err) => {
        this.sending = false;
        console.error('Error sending late message:', err);
        alert('❌ خطأ في إرسال الرسالة: ' + (err.error?.error || err.message));
      }
    });
  }

  sendBulkMessage() {
    if (!this.bulkData.message) {
      alert('الرجاء إدخال نص الرسالة');
      return;
    }

    const recipientsCount = this.getRecipientsCount();
    if (recipientsCount === 0) {
      alert('لا يوجد مستلمين صالحين');
      return;
    }

    this.sending = true;
    const data: any = {
      message: this.bulkData.message
    };

    if (this.bulkData.recipientType === 'class' && this.bulkData.classId) {
      data.classId = this.bulkData.classId;
    } else if (this.bulkData.recipientType === 'late') {
      data.filters = { paymentStatus: 'late' };
    }

    this.http.post('http://localhost:5090/api/messages/bulk', data).subscribe({
      next: (res: any) => {
        this.sending = false;
        if (res && res.success) {
          alert(res.message || '✅ تم إرسال الرسالة الجماعية بنجاح');
          this.bulkData.message = '';
          this.loadMessageHistory();
          
          if (res.data) {
            this.stats.totalMessages += res.data.results?.length || 0;
            this.stats.successfulMessages += res.data.results?.filter((r: any) => r.success).length || 0;
          }
        } else {
          alert('❌ فشل إرسال الرسالة');
        }
      },
      error: (err) => {
        this.sending = false;
        console.error('Error sending bulk message:', err);
        alert('❌ خطأ في إرسال الرسالة: ' + (err.error?.error || err.message));
      }
    });
  }

  openTemplateModal(template: MessageTemplate) {
    this.selectedTemplate = template;
    this.templateData = {};
    this.templateRecipients = 'all';
    this.showTemplateModal = true;
  }

  sendTemplateMessage() {
    this.sending = true;
    const data: any = {
      templateType: this.selectedTemplate?.id,
      customData: this.templateData
    };

    if (this.templateRecipients !== 'all') {
      data.classId = this.templateRecipients;
    }

    this.http.post('http://localhost:5090/api/messages/template', data).subscribe({
      next: (res: any) => {
        this.sending = false;
        this.showTemplateModal = false;
        if (res && res.success) {
          alert(res.message || '✅ تم إرسال رسالة القالب بنجاح');
          this.loadMessageHistory();
        } else {
          alert('❌ فشل إرسال الرسالة');
        }
      },
      error: (err) => {
        this.sending = false;
        console.error('Error sending template message:', err);
        alert('❌ خطأ في إرسال الرسالة: ' + (err.error?.error || err.message));
      }
    });
  }

  viewMessageDetails(message: any) {
    const successful = this.getSuccessfulCount(message);
    const failed = this.getTotalCount(message) - successful;
    
    alert(`📊 تفاصيل الرسالة:\n\n` +
          `📅 التاريخ: ${new Date(message.sentAt || message.createdAt || new Date()).toLocaleString('ar-EG')}\n` +
          `✅ تم الإرسال بنجاح: ${successful}\n` +
          `❌ فشل الإرسال: ${failed}\n` +
          `📝 الرسالة: ${message.content || message.text || ''}`);
  }
}