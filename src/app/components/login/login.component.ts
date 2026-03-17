import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  template: `
    <div class="login-page-wrapper" dir="rtl">
      <div class="bg-shape shape-1"></div>
      <div class="bg-shape shape-2"></div>

      <div class="login-card-container">
        <div class="login-visual">
          <div class="visual-content">
            <span class="greeting-tag">{{ getGreeting() }}</span>
            <h1>مدرسة الرواد</h1>
            <p>نظام الإدارة الموحد للمؤسسات التعليمية</p>
            <div class="visual-icon">
               <i class="fas fa-user-shield"></i>
            </div>
          </div>
        </div>

        <div class="login-form-area">
          <div class="form-header">
            <h2>تسجيل الدخول</h2>
            <p>مرحباً بك مجدداً! يرجى إدخال بياناتك</p>
          </div>

          <form (ngSubmit)="login()" #loginForm="ngForm">
            <div class="input-group-custom">
              <label for="username">اسم المستخدم</label>
              <div class="input-wrapper">
                <i class="fas fa-user icon-prefix"></i>
                <input 
                  type="text" 
                  id="username" 
                  name="username" 
                  [(ngModel)]="username" 
                  placeholder="أدخل اسم المستخدم"
                  (keypress)="onUsernameKeyPress($event)"
                  required>
              </div>
            </div>

            <div class="input-group-custom">
              <div class="label-row">
                <label for="password">كلمة المرور</label>
                <a href="javascript:void(0)" (click)="forgotPassword()" class="forgot-link">نسيت كلمة المرور؟</a>
              </div>
              <div class="input-wrapper">
                <i class="fas fa-lock icon-prefix"></i>
                <input 
                  [type]="passwordFieldType" 
                  id="password" 
                  name="password" 
                  [(ngModel)]="password" 
                  placeholder="••••••••"
                  (keypress)="onPasswordKeyPress($event)"
                  required>
                <i class="fas" 
                   [class.fa-eye]="passwordFieldType === 'password'" 
                   [class.fa-eye-slash]="passwordFieldType === 'text'"
                   (click)="togglePasswordVisibility()" 
                   class="icon-suffix"></i>
              </div>
            </div>

            <div class="form-options">
              <label class="checkbox-container">
                <input type="checkbox" name="rememberMe" [(ngModel)]="rememberMe">
                <span class="checkmark"></span>
                تذكرني
              </label>
            </div>

            <div class="action-buttons">
              <button type="submit" class="btn-primary" [disabled]="isLoading || !isFormValid()">
                <span *ngIf="!isLoading">دخول للنظام</span>
                <span *ngIf="isLoading" class="loader-dots"></span>
              </button>
              
              <button type="button" class="btn-outline" (click)="redirectToAccountingInterface()" [disabled]="isLoading || !isFormValid()">
                <i class="fas fa-calculator"></i> واجهة المحاسبة
              </button>
            </div>
          </form>

          <footer class="form-footer">
            <p>&copy; {{ currentYear }} مدرسة الرواد. جميع الحقوق محفوظة.</p>
          </footer>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Global Container */
    .login-page-wrapper {
      min-height: 100vh;
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f0f4f8;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      position: relative;
      overflow: hidden;
      padding: 20px;
    }

    /* Background Decorations */
    .bg-shape {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
      z-index: 1;
      opacity: 0.5;
    }
    .shape-1 {
      width: 400px;
      height: 400px;
      background: #0a66c2;
      top: -100px;
      right: -100px;
    }
    .shape-2 {
      width: 300px;
      height: 300px;
      background: #4cc9f0;
      bottom: -50px;
      left: -50px;
    }

    /* Main Card */
    .login-card-container {
      width: 100%;
      max-width: 1000px;
      display: flex;
      background: rgba(255, 255, 255, 0.95);
      border-radius: 24px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.1);
      overflow: hidden;
      z-index: 10;
      backdrop-filter: blur(10px);
    }

    /* Left Branding Side */
    .login-visual {
      flex: 1;
      background: linear-gradient(135deg, #0a66c2 0%, #084d91 100%);
      padding: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      text-align: center;
    }
    .visual-content h1 { font-size: 2.5rem; margin-bottom: 10px; font-weight: 800; }
    .visual-content p { font-size: 1.1rem; opacity: 0.9; margin-bottom: 30px; }
    .greeting-tag {
      display: inline-block;
      padding: 6px 16px;
      background: rgba(255,255,255,0.2);
      border-radius: 20px;
      font-size: 0.9rem;
      margin-bottom: 20px;
    }
    .visual-icon { font-size: 5rem; opacity: 0.2; }

    /* Right Form Side */
    .login-form-area {
      flex: 1.2;
      padding: 50px;
      background: white;
      display: flex;
      flex-direction: column;
    }
    .form-header { margin-bottom: 35px; }
    .form-header h2 { font-size: 1.8rem; color: #1a1a1a; margin-bottom: 10px; font-weight: 700; }
    .form-header p { color: #666; font-size: 0.95rem; }

    /* Custom Inputs */
    .input-group-custom { margin-bottom: 25px; }
    .label-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .input-group-custom label { font-weight: 600; color: #444; font-size: 0.9rem; }
    
    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }
    .input-wrapper input {
      width: 100%;
      padding: 14px 45px 14px 15px;
      border: 2px solid #edf2f7;
      border-radius: 12px;
      font-size: 1rem;
      transition: all 0.3s;
      outline: none;
    }
    .input-wrapper input:focus {
      border-color: #0a66c2;
      box-shadow: 0 0 0 4px rgba(10, 102, 194, 0.1);
    }
    .icon-prefix { position: absolute; right: 15px; color: #a0aec0; font-size: 1.1rem; }
    .icon-suffix { position: absolute; left: 15px; color: #a0aec0; cursor: pointer; padding: 5px; }
    .icon-suffix:hover { color: #0a66c2; }

    /* Checkbox Styles */
    .form-options { margin-bottom: 30px; }
    .checkbox-container {
      display: flex;
      align-items: center;
      cursor: pointer;
      font-size: 0.9rem;
      color: #666;
      user-select: none;
    }
    .checkbox-container input { display: none; }
    .checkmark {
      height: 20px;
      width: 20px;
      background-color: #eee;
      border-radius: 6px;
      margin-left: 10px;
      position: relative;
      transition: all 0.2s;
    }
    .checkbox-container:hover input ~ .checkmark { background-color: #ccc; }
    .checkbox-container input:checked ~ .checkmark { background-color: #0a66c2; }
    .checkmark:after {
      content: "";
      position: absolute;
      display: none;
      left: 7px; top: 3px;
      width: 5px; height: 10px;
      border: solid white;
      border-width: 0 2px 2px 0;
      transform: rotate(45deg);
    }
    .checkbox-container input:checked ~ .checkmark:after { display: block; }

    /* Buttons */
    .action-buttons { display: flex; flex-direction: column; gap: 15px; }
    .btn-primary {
      width: 100%;
      padding: 15px;
      background: #0a66c2;
      color: white;
      border: none;
      border-radius: 12px;
      font-size: 1.1rem;
      font-weight: 700;
      cursor: pointer;
      transition: transform 0.2s, background 0.3s;
    }
    .btn-primary:hover { background: #084d91; transform: translateY(-2px); }
    .btn-primary:disabled { background: #a0aec0; cursor: not-allowed; transform: none; }

    .btn-outline {
      width: 100%;
      padding: 12px;
      background: transparent;
      color: #0a66c2;
      border: 2px solid #0a66c2;
      border-radius: 12px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      transition: all 0.3s;
    }
    .btn-outline:hover { background: rgba(10, 102, 194, 0.05); }

    .forgot-link { color: #0a66c2; text-decoration: none; font-size: 0.85rem; font-weight: 600; }
    .forgot-link:hover { text-decoration: underline; }

    /* Footer */
    .form-footer { margin-top: auto; padding-top: 30px; text-align: center; border-top: 1px solid #f0f0f0; }
    .form-footer p { font-size: 0.8rem; color: #999; }

    /* Loader */
    .loader-dots::after {
      content: '...';
      animation: dots 1.5s steps(5, end) infinite;
    }
    @keyframes dots { 0%, 20% { content: '.'; } 40% { content: '..'; } 60% { content: '...'; } }

    /* Responsive */
    @media (max-width: 768px) {
      .login-card-container { flex-direction: column; }
      .login-visual { padding: 30px; }
      .login-form-area { padding: 30px; }
      .visual-content h1 { font-size: 1.8rem; }
    }
  `]
})
export class LoginComponent implements OnInit {
  private apiUrl = environment.apiUrl;
  username: string = '';
  password: string = '';
  rememberMe: boolean = false;
  
  currentYear: number = new Date().getFullYear();
  isLoading: boolean = false;
  passwordFieldType: string = 'password';

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.loadRememberedUser();
  }

  loadRememberedUser(): void {
    const rememberedUser = localStorage.getItem('rememberedUser');
    if (rememberedUser) {
      try {
        const credentials = JSON.parse(rememberedUser);
        if (credentials.rememberMe) {
          this.username = credentials.username;
          this.rememberMe = true;
        }
      } catch (e) { localStorage.removeItem('rememberedUser'); }
    }
  }

  togglePasswordVisibility(): void {
    this.passwordFieldType = this.passwordFieldType === 'password' ? 'text' : 'password';
  }

  async login(): Promise<void> {
    if (!this.isFormValid()) {
      Swal.fire({ title: 'خطأ', text: 'يرجى إكمال البيانات', icon: 'error', confirmButtonColor: '#0a66c2' });
      return;
    }

    this.isLoading = true;

    try {
      const response = await fetch(`${this.apiUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: this.username.trim(), password: this.password })
      });

      const data = await response.json();

      if (response.ok && data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        if (this.rememberMe) {
          localStorage.setItem('rememberedUser', JSON.stringify({ username: this.username.trim(), rememberMe: true }));
        } else {
          localStorage.removeItem('rememberedUser');
        }

        await Swal.fire({
          title: 'تم تسجيل الدخول',
          text: 'جاري تحويلك إلى مدرسة الرواد...',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        });

        this.router.navigate(['/home/lesson-management']);
      } else {
        Swal.fire({ title: 'فشل الدخول', text: data.message || 'بيانات غير صحيحة', icon: 'error' });
      }
    } catch (err) {
      Swal.fire({ title: 'خطأ في الاتصال', text: 'يرجى التحقق من الإنترنت', icon: 'error' });
    } finally {
      this.isLoading = false;
    }
  }

  onUsernameKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') document.getElementById('password')?.focus();
  }

  onPasswordKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') this.login();
  }

  forgotPassword(): void {
    Swal.fire({
      title: 'نسيت كلمة المرور؟',
      text: 'يرجى الاتصال بإدارة مدرسة الرواد لإعادة تعيين حسابك.',
      icon: 'info',
      confirmButtonText: 'حسناً'
    });
  }

  isFormValid(): boolean { return this.username.trim().length > 0 && this.password.length > 0; }

  getGreeting(): string {
    const hour = new Date().getHours();
    return hour < 12 ? 'صباح الخير' : 'مساء الخير';
  }

  async redirectToAccountingInterface(){
    // Standard login logic applied here as requested
    if (!this.isFormValid()) {
      Swal.fire({ title: 'خطأ', text: 'يرجى إكمال البيانات', icon: 'error', confirmButtonColor: '#0a66c2' });
      return;
    }

    this.isLoading = true;

    try {
      const response = await fetch(`${this.apiUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: this.username.trim(), password: this.password })
      });

      const data = await response.json();

      if (response.ok && data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        if (this.rememberMe) {
          localStorage.setItem('rememberedUser', JSON.stringify({ username: this.username.trim(), rememberMe: true }));
        } else {
          localStorage.removeItem('rememberedUser');
        }

        await Swal.fire({
          title: 'تم تسجيل الدخول',
          text: 'جاري تحويلك إلى مدرسة الرواد...',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        });

        this.router.navigate(['/accounting']);
      } else {
        Swal.fire({ title: 'فشل الدخول', text: data.message || 'بيانات غير صحيحة', icon: 'error' });
      }
    } catch (err) {
      Swal.fire({ title: 'خطأ في الاتصال', text: 'يرجى التحقق من الإنترنت', icon: 'error' });
    } finally {
      this.isLoading = false;
    }
  }
}