import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardsService, Card, AuthorizedCard } from '../cards.service';
import { StudentsService, Student } from '../services/students.service';
import { AuthService } from '../services/auth.service';

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
  authorizedCards: AuthorizedCard[] = [];
  loading = false;
  
  // Modal states
  showAssignCardModal = false;
  showAddAuthorizedCardModal = false;
  showCardDetailsModal = false;
  
  // Form data
  selectedCard: Card | null = null;
  selectedStudentId = '';
  newCardUid = '';
  searchUid = '';
  
  // Authorized card form
  newAuthorizedCard = {
    uid: '',
    cardName: '',
    description: '',
    expirationDate: '',
    notes: ''
  };
  
  // Students data
  students: Student[] = [];
  filteredStudents: Student[] = [];
  searchStudentTerm = '';
  
  // Search and filter
  filterActive = true;
  filterExpired = false;
  
  constructor(
    private cardsService: CardsService,
    private studentsService: StudentsService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadCards();
    this.loadAuthorizedCards();
    this.loadStudents();
  }

  ngOnDestroy() {
    // Cleanup if needed
  }

  // Load all cards
  loadCards() {
    this.loading = true;
    this.cardsService.getCards().subscribe({
      next: (cards) => {
        this.cards = cards;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading cards:', error);
        this.loading = false;
      }
    });
  }

  // Load authorized cards
  loadAuthorizedCards() {
    this.cardsService.getAuthorizedCards(this.filterActive, this.filterExpired).subscribe({
      next: (cards) => {
        this.authorizedCards = cards;
      },
      error: (error) => {
        console.error('Error loading authorized cards:', error);
      }
    });
  }

  // Load students
  loadStudents() {
    this.studentsService.getStudents().subscribe({
      next: (students) => {
        this.students = students;
        this.filteredStudents = students;
      },
      error: (error) => {
        console.error('Error loading students:', error);
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
      student.parentPhone?.toLowerCase().includes(term)
    );
  }

  // Assign card to student
  assignCardToStudent() {
    if (!this.selectedCard || !this.selectedStudentId) {
      alert('يرجى اختيار بطاقة وطالب');
      return;
    }

    this.cardsService.assignCardToStudent(this.selectedCard._id, this.selectedStudentId).subscribe({
      next: (updatedCard) => {
        alert('تم تعيين البطاقة للطالب بنجاح');
        this.showAssignCardModal = false;
        this.selectedCard = null;
        this.selectedStudentId = '';
        this.loadCards();
      },
      error: (error) => {
        console.error('Error assigning card:', error);
        alert('حدث خطأ أثناء تعيين البطاقة');
      }
    });
  }

  // Add new authorized card
  addAuthorizedCard() {
    if (!this.newAuthorizedCard.uid || !this.newAuthorizedCard.cardName) {
      alert('يرجى ملء الحقول المطلوبة');
      return;
    }

    this.cardsService.createAuthorizedCard(this.newAuthorizedCard).subscribe({
      next: (card) => {
        alert('تم إضافة البطاقة المصرحة بنجاح');
        this.showAddAuthorizedCardModal = false;
        this.resetAuthorizedCardForm();
        this.loadAuthorizedCards();
      },
      error: (error) => {
        console.error('Error adding authorized card:', error);
        alert('حدث خطأ أثناء إضافة البطاقة');
      }
    });
  }

  // Check card authorization
  checkCardAuthorization() {
    if (!this.searchUid.trim()) {
      alert('يرجى إدخال رقم البطاقة');
      return;
    }

    this.cardsService.checkCardAuthorization(this.searchUid).subscribe({
      next: (result) => {
        if (result.authorized) {
          alert('البطاقة مصرحة وصالحة');
        } else {
          alert('البطاقة غير مصرحة أو منتهية الصلاحية');
        }
      },
      error: (error) => {
        alert('البطاقة غير مصرحة');
      }
    });
  }

  // Delete card
  deleteCard(cardId: string, cardType: 'regular' | 'authorized') {
    if (!confirm('هل أنت متأكد من حذف هذه البطاقة؟')) {
      return;
    }

    if (cardType === 'regular') {
      this.cardsService.deleteCard(cardId).subscribe({
        next: () => {
          alert('تم حذف البطاقة بنجاح');
          this.loadCards();
        },
        error: (error) => {
          console.error('Error deleting card:', error);
          alert('حدث خطأ أثناء حذف البطاقة');
        }
      });
    } else {
      this.cardsService.deleteAuthorizedCard(cardId).subscribe({
        next: () => {
          alert('تم حذف البطاقة المصرحة بنجاح');
          this.loadAuthorizedCards();
        },
        error: (error) => {
          console.error('Error deleting authorized card:', error);
          alert('حدث خطأ أثناء حذف البطاقة المصرحة');
        }
      });
    }
  }

  // View card details
  viewCardDetails(card: Card) {
    this.selectedCard = card;
    this.showCardDetailsModal = true;
  }

  // Reset authorized card form
  resetAuthorizedCardForm() {
    this.newAuthorizedCard = {
      uid: '',
      cardName: '',
      description: '',
      expirationDate: '',
      notes: ''
    };
  }

  // Apply filters for authorized cards
  applyFilters() {
    this.loadAuthorizedCards();
  }

  // Format date for display
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('ar-EG');
  }

  // Check if card is expired
  isCardExpired(expirationDate: string): boolean {
    return new Date(expirationDate) < new Date();
  }

  // Get student name by ID
  getStudentName(studentId: string): string {
    const student = this.students.find(s => s._id === studentId);
    return student ? student.name : 'غير معين';
  }
}