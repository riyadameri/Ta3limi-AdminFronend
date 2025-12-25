import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { LiveClassesService, LiveClass, Attendance } from '../services/live-classes.service';
import { CardsService } from '../cards.service';
import { LessonsService } from '../services/lessons.service';

@Component({
  selector: 'app-live-class',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './live-class.component.html',
  styleUrl: './live-class.component.css'
})
export class LiveClassComponent implements OnInit, OnDestroy {
  // Live classes data
  liveClasses: LiveClass[] = [];
  filteredLiveClasses: LiveClass[] = [];
  selectedLiveClass: LiveClass | null = null;
  
  // Filters
  statusFilter: 'all' | 'scheduled' | 'ongoing' | 'completed' | 'cancelled' = 'all';
  dateFilter: string = '';
  searchTerm: string = '';
  
  // Loading states
  isLoading: boolean = false;
  isLoadingAttendance: boolean = false;
  
  // Modal states
  showAttendanceModal: boolean = false;
  showStartClassModal: boolean = false;
  showEndClassModal: boolean = false;
  showCancelClassModal: boolean = false;
  showCreateClassModal: boolean = false;
  
  // Attendance data
  attendanceRecords: Attendance[] = [];
  newAttendance = {
    studentId: '',
    status: 'present' as 'present' | 'absent' | 'late',
    method: 'manual' as 'rfid' | 'manual',
    notes: ''
  };
  
  // RFID scanning
  isScanningRFID: boolean = false;
  scannedRFID: string = '';
  
  // Create class form
  newClass = {
    classId: '',
    date: '',
    startTime: '',
    endTime: '',
    teacherId: '',
    classroomId: '',
    notes: ''
  };
  
  // Additional data
  classes: any[] = [];
  teachers: any[] = [];
  classrooms: any[] = [];
  
  private subscriptions: Subscription[] = [];

  constructor(
    private liveClassesService: LiveClassesService,
    private cardsService: CardsService,
    private lessonsService: LessonsService
  ) {}

  ngOnInit(): void {
    this.loadLiveClasses();
    this.loadClasses();
    this.loadTeachers();
    this.loadClassrooms();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  // Load live classes
  loadLiveClasses(): void {
    this.isLoading = true;
    const filters: any = {};
    
    if (this.statusFilter !== 'all') {
      filters.status = this.statusFilter;
    }
    if (this.dateFilter) {
      filters.date = this.dateFilter;
    }
    
    const sub = this.liveClassesService.getLiveClasses(filters).subscribe({
      next: (classes) => {
        this.liveClasses = classes;
        this.filterLiveClasses();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading live classes:', error);
        this.isLoading = false;
      }
    });
    this.subscriptions.push(sub);
  }

  filterLiveClasses(): void {
    let filtered = [...this.liveClasses];
    
    // Apply search filter
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(liveClass =>
        liveClass.class?.name?.toLowerCase().includes(term) ||
        liveClass.teacher?.name?.toLowerCase().includes(term) ||
        liveClass.classroom?.name?.toLowerCase().includes(term)
      );
    }
    
    this.filteredLiveClasses = filtered;
  }

  // Load additional data
  loadClasses(): void {
    const sub = this.lessonsService.getClasses().subscribe({
      next: (classes) => {
        this.classes = classes;
      },
      error: (error) => {
        console.error('Error loading classes:', error);
      }
    });
    this.subscriptions.push(sub);
  }

  loadTeachers(): void {
    // This would be replaced with actual teacher service
    // Mock data for demonstration
    this.teachers = [
      { _id: '1', name: 'Teacher 1' },
      { _id: '2', name: 'Teacher 2' },
      { _id: '3', name: 'Teacher 3' }
    ];
  }

  loadClassrooms(): void {
    // This would be replaced with actual classroom service
    // Mock data for demonstration
    this.classrooms = [
      { _id: '1', name: 'Room 101' },
      { _id: '2', name: 'Room 102' },
      { _id: '3', name: 'Room 103' }
    ];
  }

  // Open modal methods
  openAttendanceModal(liveClass: LiveClass): void {
    this.selectedLiveClass = liveClass;
    this.loadAttendance(liveClass._id);
    this.showAttendanceModal = true;
  }

  openStartClassModal(liveClass: LiveClass): void {
    this.selectedLiveClass = liveClass;
    this.showStartClassModal = true;
  }

  openEndClassModal(liveClass: LiveClass): void {
    this.selectedLiveClass = liveClass;
    this.showEndClassModal = true;
  }

  openCancelClassModal(liveClass: LiveClass): void {
    this.selectedLiveClass = liveClass;
    this.showCancelClassModal = true;
  }

  openCreateClassModal(): void {
    const today = new Date().toISOString().split('T')[0];
    this.newClass = {
      classId: '',
      date: today,
      startTime: '',
      endTime: '',
      teacherId: '',
      classroomId: '',
      notes: ''
    };
    this.showCreateClassModal = true;
  }

  // Close modal methods
  closeAllModals(): void {
    this.showAttendanceModal = false;
    this.showStartClassModal = false;
    this.showEndClassModal = false;
    this.showCancelClassModal = false;
    this.showCreateClassModal = false;
    this.selectedLiveClass = null;
    this.isScanningRFID = false;
    this.scannedRFID = '';
  }

  // Live class actions
  startLiveClass(): void {
    if (!this.selectedLiveClass) return;

    const sub = this.liveClassesService.startLiveClass(this.selectedLiveClass._id).subscribe({
      next: (updatedClass) => {
        this.updateLiveClassInList(updatedClass);
        this.closeAllModals();
      },
      error: (error) => {
        console.error('Error starting live class:', error);
      }
    });
    this.subscriptions.push(sub);
  }

  endLiveClass(): void {
    if (!this.selectedLiveClass) return;

    const sub = this.liveClassesService.endLiveClass(this.selectedLiveClass._id).subscribe({
      next: (updatedClass) => {
        this.updateLiveClassInList(updatedClass);
        this.closeAllModals();
      },
      error: (error) => {
        console.error('Error ending live class:', error);
      }
    });
    this.subscriptions.push(sub);
  }

  cancelLiveClass(): void {
    if (!this.selectedLiveClass) return;

    const sub = this.liveClassesService.cancelLiveClass(this.selectedLiveClass._id).subscribe({
      next: (updatedClass) => {
        this.updateLiveClassInList(updatedClass);
        this.closeAllModals();
      },
      error: (error) => {
        console.error('Error cancelling live class:', error);
      }
    });
    this.subscriptions.push(sub);
  }

  createLiveClass(): void {
    const liveClassData = {
      class: this.newClass.classId,
      date: this.newClass.date,
      startTime: this.newClass.startTime,
      endTime: this.newClass.endTime || undefined,
      teacher: this.newClass.teacherId,
      classroom: this.newClass.classroomId,
      notes: this.newClass.notes || undefined,
      status: 'scheduled'
    };

    const sub = this.liveClassesService.createLiveClass(liveClassData).subscribe({
      next: (newLiveClass) => {
        this.liveClasses.unshift(newLiveClass);
        this.filterLiveClasses();
        this.closeAllModals();
      },
      error: (error) => {
        console.error('Error creating live class:', error);
      }
    });
    this.subscriptions.push(sub);
  }

  // Attendance methods
  loadAttendance(liveClassId: string): void {
    this.isLoadingAttendance = true;
    const sub = this.liveClassesService.getLiveClassById(liveClassId).subscribe({
      next: (liveClass) => {
        this.attendanceRecords = liveClass.attendance || [];
        this.isLoadingAttendance = false;
      },
      error: (error) => {
        console.error('Error loading attendance:', error);
        this.isLoadingAttendance = false;
      }
    });
    this.subscriptions.push(sub);
  }

  recordAttendance(): void {
    if (!this.selectedLiveClass || !this.newAttendance.studentId) return;

    const attendanceData = {
      studentId: this.newAttendance.studentId,
      status: this.newAttendance.status,
      method: this.newAttendance.method,
      notes: this.newAttendance.notes || undefined
    };

    const sub = this.liveClassesService.recordAttendance(
      this.selectedLiveClass._id,
      attendanceData
    ).subscribe({
      next: (updatedAttendance) => {
        // Refresh attendance records
        this.loadAttendance(this.selectedLiveClass!._id);
        this.resetAttendanceForm();
      },
      error: (error) => {
        console.error('Error recording attendance:', error);
      }
    });
    this.subscriptions.push(sub);
  }

  resetAttendanceForm(): void {
    this.newAttendance = {
      studentId: '',
      status: 'present',
      method: 'manual',
      notes: ''
    };
    this.isScanningRFID = false;
    this.scannedRFID = '';
  }

  // RFID scanning for attendance
  startRFIDScan(): void {
    this.isScanningRFID = true;
    this.scannedRFID = '';
    
    // Simulate RFID scanning
    setTimeout(() => {
      // In real app, this would come from hardware
      this.scannedRFID = 'UID' + Math.random().toString(36).substr(2, 8).toUpperCase();
      this.checkRFIDCard(this.scannedRFID);
    }, 1000);
  }

  checkRFIDCard(uid: string): void {
    const sub = this.cardsService.checkCardAuthorization(uid).subscribe({
      next: (response) => {
        if (response.authorized && response.student) {
          this.newAttendance.studentId = response.student._id;
          this.newAttendance.method = 'rfid';
        }
        this.isScanningRFID = false;
      },
      error: (error) => {
        console.error('Error checking RFID card:', error);
        this.isScanningRFID = false;
      }
    });
    this.subscriptions.push(sub);
  }

  // Auto mark absent
  autoMarkAbsent(): void {
    if (!this.selectedLiveClass) return;

    const sub = this.liveClassesService.autoMarkAbsent(this.selectedLiveClass._id).subscribe({
      next: () => {
        this.loadAttendance(this.selectedLiveClass!._id);
      },
      error: (error) => {
        console.error('Error auto-marking absent:', error);
      }
    });
    this.subscriptions.push(sub);
  }

  // Helper methods
  updateLiveClassInList(updatedClass: LiveClass): void {
    const index = this.liveClasses.findIndex(c => c._id === updatedClass._id);
    if (index !== -1) {
      this.liveClasses[index] = updatedClass;
    }
    this.filterLiveClasses();
  }

  formatTime(time: string): string {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'scheduled': return 'status-scheduled';
      case 'ongoing': return 'status-ongoing';
      case 'completed': return 'status-completed';
      case 'cancelled': return 'status-cancelled';
      default: return '';
    }
  }

  getAttendanceStatusClass(status: string): string {
    switch (status) {
      case 'present': return 'attendance-present';
      case 'absent': return 'attendance-absent';
      case 'late': return 'attendance-late';
      default: return '';
    }
  }

  // Get students from selected class
  getClassStudents(): any[] {
    if (!this.selectedLiveClass?.class?.students) return [];
    return this.selectedLiveClass.class.students;
  }
}