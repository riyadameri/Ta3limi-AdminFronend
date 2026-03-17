import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './components/login/login.component';
import { LiveClass } from './services/live-classes.service';
import { LessonManagementComponent } from './components/lesson-management/lesson-management.component';
import { StudentsManagementComponent } from './students-management/students-management.component';
import { RoomsManagementComponent } from './rooms-management-component/rooms-management-component.component';
import { PaymentsManagementComponent } from './payments-management/payments-management.component';
import { CardsManagementComponent } from './cards-management/cards-management.component';
import { LiveClassComponent } from './live-class/live-class.component';
import { TeachersManagementComponent } from './teachers-management/teachers-management.component';
import { StudentDetailsComponent } from './student-details/student-details.component';
import { AddStudentToClassesModalComponent } from './add-student-to-classes-modal/add-student-to-classes-modal.component';
import { AccountingComponent } from './components/accounting/accounting.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { LessonDetailComponent } from './lesson-detail/lesson-detail.component';
import { StudentAttendanceComponent } from './student-attendance/student-attendance.component';
export const routes: Routes = [
  // المسار الافتراضي - إعادة توجيه إلى login
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  
  // صفحة تسجيل الدخول
  { path: 'login', component: LoginComponent },
  
  {
    path : 'accounting',
    component: AccountingComponent,
    
  },

  // الصفحة الرئيسية مع التخطيط
  {
    path: 'home',
    component: HomeComponent,
    // يمكن إضافة canActivate: [AuthGuard] هنا إذا كانت الصفحة محمية
    children: [
      { path: 'lesson-management', component: LessonManagementComponent },
      {path:'dashboard',component:DashboardComponent},
      { path: 'live-class', component: LiveClassComponent },
      { path: 'students-management', component: StudentsManagementComponent },
      { path: 'students-management/:id', component: StudentDetailsComponent },   
      { path: 'add-student-to-classes-modal/:id', component: AddStudentToClassesModalComponent },
         { path: 'teachers-management', component: TeachersManagementComponent },
      { path: 'rooms-management', component: RoomsManagementComponent },
      { path: 'payments-management', component: PaymentsManagementComponent },
      { path: 'cards-management', component: CardsManagementComponent },
      { 
        path: 'lesson-detail/:lessonId', 
        component: LessonDetailComponent 
      },      { 
        path: 'lesson/:lessonId', 
        component: LessonDetailComponent 
      },
      { 
        path: 'attendance', 
        component: StudentAttendanceComponent 
      },
      { 
        path: 'scan', 
        component: StudentAttendanceComponent 
      },
          
      // مسار افتراضي داخل home
      { path: '', redirectTo: 'lesson-management', pathMatch: 'full' }
    ]
  },
  
];