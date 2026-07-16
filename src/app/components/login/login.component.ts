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
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  private apiUrl = 'http://localhost:5090';
  
  username: string = '';
  password: string = '';
  schoolKey: string = '';
  rememberMe: boolean = false;
  
  currentYear: number = new Date().getFullYear();
  isLoading: boolean = false;
  passwordFieldType: string = 'password';
  errorMessage: string = '';

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.loadRememberedUser();
    this.checkExistingSession();
  }

  /**
   * التحقق من وجود جلسة نشطة
   */
  checkExistingSession(): void {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    const school = localStorage.getItem('school');
    
    if (token && user && school) {
      this.verifyTokenAndRedirect(token);
    }
  }

  /**
   * التحقق من صحة التوكن وتوجيه المستخدم
   */
  async verifyTokenAndRedirect(token: string): Promise<void> {
    try {
      const response = await fetch(`${this.apiUrl}/api/auth/verify`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          console.log('✅ جلسة نشطة، توجيه إلى /home');
          // ✅ تغيير التوجيه إلى /home
          this.router.navigate(['/home']);
          return;
        }
      }
      
      this.clearSession();
      
    } catch (error) {
      console.error('❌ خطأ في التحقق من التوكن:', error);
      if (localStorage.getItem('token')) {
        // ✅ تغيير التوجيه إلى /home
        this.router.navigate(['/home']);
      }
    }
  }

  /**
   * تحميل المستخدم المحفوظ
   */
  loadRememberedUser(): void {
    const rememberedUser = localStorage.getItem('rememberedUser');
    if (rememberedUser) {
      try {
        const credentials = JSON.parse(rememberedUser);
        if (credentials.rememberMe) {
          this.username = credentials.username || '';
          this.schoolKey = credentials.schoolKey || '';
          this.rememberMe = true;
        }
      } catch (e) {
        localStorage.removeItem('rememberedUser');
      }
    }
  }

  togglePasswordVisibility(): void {
    this.passwordFieldType = this.passwordFieldType === 'password' ? 'text' : 'password';
  }

  isFormValid(): boolean {
    return this.username.trim().length > 0 && 
           this.password.length > 0 && 
           this.schoolKey.trim().length > 0;
  }

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return '🌅 صباح الخير';
    if (hour < 18) return '🌤️ مساء الخير';
    return '🌙 مساء الخير';
  }

  /**
   * تسجيل الدخول والتوجيه إلى /home
   */
  async login(): Promise<void> {
    if (!this.isFormValid()) {
      Swal.fire({
        title: '⚠️ خطأ',
        text: 'يرجى إكمال جميع الحقول المطلوبة',
        icon: 'error',
        confirmButtonColor: '#6C63FF'
      });
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    try {
      const loginData = {
        username: this.username.trim(),
        password: this.password,
        schoolKey: this.schoolKey.trim()
      };

      const url = `${this.apiUrl}/api/auth/login`;
      
      console.log('📤 محاولة تسجيل الدخول إلى:', url);
      console.log('📤 البيانات:', { 
        username: loginData.username, 
        schoolKey: loginData.schoolKey 
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(loginData)
      });

      const data = await response.json();

      console.log('📥 رد الخادم:', data);

      if (response.ok && data.success) {
        this.saveSessionData(data);
        
        await Swal.fire({
          title: '✅ تم تسجيل الدخول',
          text: `مرحباً ${data.data.user.fullName || data.data.user.username}`,
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        });

        // ✅ توجيه المستخدم إلى /home (وليس /dashboard/students)
        console.log('🚀 توجيه إلى /home');
        this.router.navigate(['/home']);

      } else {
        this.errorMessage = data.error || data.message || 'بيانات الدخول غير صحيحة';
        
        Swal.fire({
          title: '❌ فشل الدخول',
          text: this.errorMessage,
          icon: 'error',
          confirmButtonColor: '#6C63FF'
        });
      }

    } catch (error) {
      console.error('❌ خطأ في تسجيل الدخول:', error);
      
      Swal.fire({
        title: '❌ خطأ في الاتصال',
        text: 'تعذر الاتصال بالخادم. تأكد من تشغيل الخادم على المنفذ 5090',
        icon: 'error',
        confirmButtonColor: '#6C63FF',
        confirmButtonText: 'إعادة المحاولة'
      });
      
    } finally {
      this.isLoading = false;
    }
  }

  private saveSessionData(data: any): void {
    try {
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('user', JSON.stringify(data.data.user));
      localStorage.setItem('school', JSON.stringify(data.data.school));
      
      if (data.data.school?.subscription) {
        localStorage.setItem('subscription', JSON.stringify(data.data.school.subscription));
      }

      if (data.data.user?.permissions) {
        localStorage.setItem('permissions', JSON.stringify(data.data.user.permissions));
      }

      localStorage.setItem('loginTime', new Date().toISOString());

      if (this.rememberMe) {
        localStorage.setItem('rememberedUser', JSON.stringify({
          username: this.username.trim(),
          schoolKey: this.schoolKey.trim(),
          rememberMe: true
        }));
      } else {
        localStorage.removeItem('rememberedUser');
      }

      console.log('✅ تم حفظ بيانات الجلسة');

    } catch (error) {
      console.error('❌ خطأ في حفظ البيانات:', error);
    }
  }

  private clearSession(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('school');
    localStorage.removeItem('subscription');
    localStorage.removeItem('permissions');
    localStorage.removeItem('loginTime');
    console.log('🗑️ تم حذف بيانات الجلسة');
  }

  forgotPassword(): void {
    Swal.fire({
      title: '🔑 نسيت كلمة المرور؟',
      text: 'يرجى التواصل مع إدارة المدرسة لإعادة تعيين كلمة المرور',
      icon: 'info',
      confirmButtonText: 'حسناً',
      confirmButtonColor: '#6C63FF'
    });
  }

  logout(): void {
    this.clearSession();
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getUser(): any {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  getSchool(): any {
    const school = localStorage.getItem('school');
    return school ? JSON.parse(school) : null;
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  onSchoolKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      document.getElementById('username')?.focus();
    }
  }

  onUsernameKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      document.getElementById('password')?.focus();
    }
  }

  onPasswordKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.login();
    }
  }

  async redirectToAccountingInterface(): Promise<void> {
    if (!this.isFormValid()) {
      Swal.fire({
        title: '⚠️ خطأ',
        text: 'يرجى إكمال جميع الحقول المطلوبة',
        icon: 'error',
        confirmButtonColor: '#6C63FF'
      });
      return;
    }

    this.isLoading = true;

    try {
      const loginData = {
        username: this.username.trim(),
        password: this.password,
        schoolKey: this.schoolKey.trim()
      };

      const response = await fetch(`${this.apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(loginData)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        this.saveSessionData(data);

        await Swal.fire({
          title: '✅ تم تسجيل الدخول',
          text: 'جاري تحويلك إلى واجهة المحاسبة...',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        });

        this.router.navigate(['/accounting']);
      } else {
        Swal.fire({
          title: '❌ فشل الدخول',
          text: data.error || data.message || 'بيانات غير صحيحة',
          icon: 'error',
          confirmButtonColor: '#6C63FF'
        });
      }
    } catch (error) {
      console.error('❌ خطأ:', error);
      Swal.fire({
        title: '❌ خطأ في الاتصال',
        text: 'تعذر الاتصال بالخادم',
        icon: 'error',
        confirmButtonColor: '#6C63FF'
      });
    } finally {
      this.isLoading = false;
    }
  }
}