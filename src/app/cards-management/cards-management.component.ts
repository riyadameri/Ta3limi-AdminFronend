import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, Observable, throwError, of } from 'rxjs';
import { environment } from '../../environments/environment.development';
interface Student {
  _id: string;
  name: string;
  studentId: string;
  parentPhone?: string;
  birthDate?: string;
  parentName?: string;
  academicYear?: string;
}

interface Card {
  _id: string;
  uid: string;
  student: Student | string;
  issueDate: string;
  isDetected?: boolean;
}

@Component({
  selector: 'app-cards-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cards-management.component.html',
  styleUrls: ['./cards-management.component.css']
})
export class CardsManagementComponent implements OnInit, OnDestroy {
  // Cards data
  cards: Card[] = [];
  loading = false;
  detectionActive = false;
  detectionInterval: any;
  
  // Modal states
  showAssignCardModal = false;
  showCardDetailsModal = false;
  
  // Form data
  selectedCard: Card | null = null;
  selectedStudentId = '';
  newCardUid = '';
  searchUid = '';
  
  // Students data
  students: Student[] = [];
  filteredStudents: Student[] = [];
  searchStudentTerm = '';
  
  // Card detection
  detectedCardUid = '';
  isCardDetected = false;
  detectionStatus = '';

  constructor(private http: HttpClient ) {}

  ngOnInit() {
    console.log('Component initialized');
    this.loadCards();
    this.loadStudents();
  }

/*************  ✨ Windsurf Command ⭐  *************/
/**
 * Stop card detection simulation on component destruction
 */
/*******  16415238-85ae-402d-a77f-862db18aa083  *******/
  ngOnDestroy() {
    this.stopCardDetection();
  }

  // Error handler for HTTP requests
  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('HTTP Error:', error);
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      console.error('Client-side error:', error.error.message);
    } else {
      // Server-side error
      console.error(`Server returned code ${error.status}, body was:`, error.error);
    }
    
    return throwError(() => new Error('حدث خطأ في الاتصال بالخادم'));
  }

  // Load all cards
  loadCards() {
    this.loading = true;
    console.log('Loading cards...');
    
    this.http.get<Card[]>(`${environment.apiUrl}/cards`)
      .pipe(
        catchError(error => {
          console.error('Error in loadCards:', error);
          alert('حدث خطأ أثناء تحميل البطاقات. تأكد من تشغيل الخادم.');
          return of([]); // Return empty array on error
        })
      )
      .subscribe({
        next: (cards: Card[]) => {
          console.log('Cards loaded:', cards);
          this.cards = cards || [];
          this.loading = false;
          
          // If no cards, show message
          if (this.cards.length === 0) {
            console.log('No cards found');
          }
        },
        error: (error) => {
          console.error('Subscription error in loadCards:', error);
          this.cards = [];
          this.loading = false;
          alert('تعذر تحميل البطاقات. يرجى المحاولة مرة أخرى.');
        },
        complete: () => {
          console.log('loadCards request completed');
          this.loading = false;
        }
      });
  }

  // Load students
  loadStudents() {
    console.log('Loading students...');
    
    this.http.get<Student[]>(`${environment.apiUrl}/students`)
      .pipe(
        catchError(error => {
          console.error('Error in loadStudents:', error);
          alert('حدث خطأ أثناء تحميل الطلاب. تأكد من تشغيل الخادم.');
          return of([]); // Return empty array on error
        })
      )
      .subscribe({
        next: (students: Student[]) => {
          console.log('Students loaded:', students);
          this.students = students || [];
          this.filteredStudents = this.students;
          
          // If no students, show message
          if (this.students.length === 0) {
            console.log('No students found');
          }
        },
        error: (error) => {
          console.error('Subscription error in loadStudents:', error);
          this.students = [];
          this.filteredStudents = [];
          alert('تعذر تحميل الطلاب. يرجى المحاولة مرة أخرى.');
        }
      });
  }

  // Filter students by search term
  filterStudents() {
    if (!this.searchStudentTerm.trim()) {
      this.filteredStudents = this.students;
      return;
    }
    
    const term = this.searchStudentTerm.toLowerCase();
    this.filteredStudents = this.students.filter(student => 
      student.name.toLowerCase().includes(term) ||
      student.studentId.toLowerCase().includes(term) ||
      (student.parentPhone && student.parentPhone.toLowerCase().includes(term))
    );
  }

  // Start card detection simulation
  startCardDetection() {
    this.detectionActive = true;
    this.detectionStatus = 'جاري البحث عن بطاقة...';
    
    // Simulate card detection (in real app, this would use WebSocket or RFID)
    this.detectionInterval = setInterval(() => {
      // Simulate detecting a card with random UID
      if (this.detectionActive && !this.isCardDetected) {
        this.detectedCardUid = 'CARD-' + Math.random().toString(36).substr(2, 8).toUpperCase();
        this.isCardDetected = true;
        this.detectionStatus = `تم اكتشاف البطاقة: ${this.detectedCardUid}`;
        
        // Auto-fill new card form
        this.newCardUid = this.detectedCardUid;
        
        // Show detection for existing cards
        const existingCard = this.cards.find(card => card.uid === this.detectedCardUid);
        if (existingCard) {
          existingCard.isDetected = true;
          setTimeout(() => {
            existingCard.isDetected = false;
          }, 2000);
        }
      }
    }, 3000);
  }

  // Stop card detection
  stopCardDetection() {
    this.detectionActive = false;
    this.isCardDetected = false;
    this.detectedCardUid = '';
    this.detectionStatus = '';
    
    if (this.detectionInterval) {
      clearInterval(this.detectionInterval);
      this.detectionInterval = null;
    }
  }

  // Reset detection
  resetDetection() {
    this.isCardDetected = false;
    this.detectedCardUid = '';
    this.detectionStatus = 'جاهز للكشف عن بطاقة جديدة';
  }

  // Create new card
  createCard() {
    if (!this.newCardUid.trim()) {
      alert('يرجى إدخال رقم البطاقة');
      return;
    }

    const cardData = { 
      uid: this.newCardUid,
      student: this.selectedStudentId || null
    };

    console.log('Creating card with data:', cardData);
    
    this.http.post<Card>(`${environment.apiUrl}/cards`, cardData)
      .pipe(
        catchError(error => {
          console.error('Error creating card:', error);
          const errorMessage = error.error?.error || 'حدث خطأ أثناء إنشاء البطاقة';
          alert(errorMessage);
          return throwError(() => new Error(errorMessage));
        })
      )
      .subscribe({
        next: (newCard) => {
          console.log('Card created successfully:', newCard);
          alert('تم إنشاء البطاقة بنجاح');
          this.newCardUid = '';
          this.selectedStudentId = '';
          this.loadCards();
        },
        error: (error) => {
          console.error('Subscription error in createCard:', error);
        }
      });
  }

  // Assign card to student
  assignCardToStudent() {
    if (!this.selectedCard || !this.selectedStudentId) {
      alert('يرجى اختيار بطاقة وطالب');
      return;
    }

    console.log(`Assigning card ${this.selectedCard._id} to student ${this.selectedStudentId}`);
    
    this.http.put<Card>(`${environment.apiUrl}/cards/${this.selectedCard._id}`, {
      student: this.selectedStudentId
    })
      .pipe(
        catchError(error => {
          console.error('Error assigning card:', error);
          const errorMessage = error.error?.error || 'حدث خطأ أثناء تعيين البطاقة';
          alert(errorMessage);
          return throwError(() => new Error(errorMessage));
        })
      )
      .subscribe({
        next: (updatedCard) => {
          console.log('Card assigned successfully:', updatedCard);
          alert('تم تعيين البطاقة للطالب بنجاح');
          this.showAssignCardModal = false;
          this.selectedCard = null;
          this.selectedStudentId = '';
          this.loadCards();
        },
        error: (error) => {
          console.error('Subscription error in assignCardToStudent:', error);
        }
      });
  }

  // Update card
  updateCard(cardId: string, updates: any) {
    console.log(`Updating card ${cardId} with:`, updates);
    
    this.http.put(`${environment.apiUrl}/cards/${cardId}`, updates)
      .pipe(
        catchError(error => {
          console.error('Error updating card:', error);
          const errorMessage = error.error?.error || 'حدث خطأ أثناء تحديث البطاقة';
          alert(errorMessage);
          return throwError(() => new Error(errorMessage));
        })
      )
      .subscribe({
        next: () => {
          console.log('Card updated successfully');
          alert('تم تحديث البطاقة بنجاح');
          this.loadCards();
        },
        error: (error) => {
          console.error('Subscription error in updateCard:', error);
        }
      });
  }

  // Unassign card from student
  unassignCard(cardId: string) {
    if (!confirm('هل تريد إلغاء تعيين البطاقة من الطالب؟')) {
      return;
    }

    console.log(`Unassigning card ${cardId}`);
    
    this.http.put(`${environment.apiUrl}/cards/${cardId}`, { student: null })
      .pipe(
        catchError(error => {
          console.error('Error unassigning card:', error);
          const errorMessage = error.error?.error || 'حدث خطأ أثناء إلغاء تعيين البطاقة';
          alert(errorMessage);
          return throwError(() => new Error(errorMessage));
        })
      )
      .subscribe({
        next: () => {
          console.log('Card unassigned successfully');
          alert('تم إلغاء تعيين البطاقة بنجاح');
          this.loadCards();
        },
        error: (error) => {
          console.error('Subscription error in unassignCard:', error);
        }
      });
  }

  // Delete card
  deleteCard(cardId: string) {
    if (!confirm('هل أنت متأكد من حذف هذه البطاقة؟')) {
      return;
    }

    console.log(`Deleting card ${cardId}`);
    
    this.http.delete(`${environment.apiUrl}/cards/${cardId}`)
      .pipe(
        catchError(error => {
          console.error('Error deleting card:', error);
          const errorMessage = error.error?.error || 'حدث خطأ أثناء حذف البطاقة';
          alert(errorMessage);
          return throwError(() => new Error(errorMessage));
        })
      )
      .subscribe({
        next: () => {
          console.log('Card deleted successfully');
          alert('تم حذف البطاقة بنجاح');
          this.loadCards();
        },
        error: (error) => {
          console.error('Subscription error in deleteCard:', error);
        }
      });
  }

  // View card details
  viewCardDetails(card: Card) {
    this.selectedCard = card;
    this.showCardDetailsModal = true;
  }

  // Check card by UID
  checkCard() {
    if (!this.searchUid.trim()) {
      alert('يرجى إدخال رقم البطاقة');
      return;
    }

    console.log(`Checking card with UID: ${this.searchUid}`);
    
    this.http.get<any>(`${environment.apiUrl}/cards/uid/${this.searchUid}`)
      .pipe(
        catchError(error => {
          console.error('Error checking card:', error);
          alert('البطاقة غير مسجلة');
          return throwError(() => new Error('البطاقة غير مسجلة'));
        })
      )
      .subscribe({
        next: (result) => {
          console.log('Card check result:', result);
          if (result.student) {
            alert(`البطاقة مسجلة باسم: ${result.student.name} (${result.student.studentId})`);
          } else {
            alert('البطاقة غير مسجلة');
          }
        },
        error: (error) => {
          console.error('Subscription error in checkCard:', error);
        }
      });
  }

  // Get student name by ID
  getStudentName(card: Card): string {
    if (typeof card.student === 'object' && card.student !== null) {
      return card.student.name;
    }
    return 'غير معين';
  }

  // Get student object
  getStudentObject(card: Card): Student | null {
    if (typeof card.student === 'object' && card.student !== null) {
      return card.student;
    }
    return null;
  }

  // Format date for display
  formatDate(dateString: string): string {
    try {
      return new Date(dateString).toLocaleDateString('ar-EG');
    } catch (error) {
      return dateString;
    }
  }
}