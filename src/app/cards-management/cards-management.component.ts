import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardsService, Card, AuthorizedCard } from '../cards.service';
import { StudentsService , Student } from '../services/students.service';
import { AuthService } from '../services/auth.service';
@Component({
  selector: 'app-cards-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cards-management.component.html',
  styleUrls: ['./cards-management.component.css']
})
export class CardsManagementComponent implements OnInit, OnDestroy {
  // Data
  cards: Card[] = [];
  students: Student[] = [];
  filteredCards: Card[] = [];
  authorizedCards: AuthorizedCard[] = [];
  
  // UI State
  loading: boolean = true;
  loadingStudents: boolean = false;
  loadingAuthorizedCards: boolean = false;
  viewMode: 'list' | 'grid' = 'list';
  showAssignModal: boolean = false;
  showCreateModal: boolean = false;
  showUnassignModal: boolean = false;
  showAuthorizedCardsModal: boolean = false;
  
  // Filters
  filterStatus: string = 'all';
  filterStudentId: string = '';
  filterCardId: string = '';
  
  // Form Data
  selectedCard: Card | null = null;
  selectedStudentId: string = '';
  newCardUid: string = '';
  authorizedCardData: any = {
    uid: '',
    cardName: '',
    description: '',
    expirationDate: '',
    notes: ''
  };
  
  // Statistics
  stats = {
    total: 0,
    assigned: 0,
    unassigned: 0,
    active: 0,
    expired: 0
  };
  
  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 1;

  constructor(
    private cardsService: CardsService,
    private studentsService: StudentsService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadCards();
    this.loadStudents();
    this.loadAuthorizedCards();
  }

  ngOnDestroy(): void {}

  loadCards(): void {
    this.loading = true;
    this.cardsService.getCards().subscribe({
      next: (cards) => {
        this.cards = cards;
        this.filteredCards = [...cards];
        this.calculateStats();
        this.calculatePagination();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading cards:', error);
        this.loading = false;
      }
    });
  }

  loadStudents(): void {
    this.loadingStudents = true;
    this.studentsService.getStudents().subscribe({
      next: (students) => {
        this.students = students;
        this.loadingStudents = false;
      },
      error: (error) => {
        console.error('Error loading students:', error);
        this.loadingStudents = false;
      }
    });
  }

  loadAuthorizedCards(): void {
    this.loadingAuthorizedCards = true;
    this.cardsService.getAuthorizedCards(true, false).subscribe({
      next: (cards) => {
        this.authorizedCards = cards;
        this.calculateAuthorizedStats();
        this.loadingAuthorizedCards = false;
      },
      error: (error) => {
        console.error('Error loading authorized cards:', error);
        this.loadingAuthorizedCards = false;
      }
    });
  }

  calculateStats(): void {
    this.stats.total = this.cards.length;
    this.stats.assigned = this.cards.filter(card => card.student && typeof card.student === 'object').length;
    this.stats.unassigned = this.cards.filter(card => !card.student || typeof card.student !== 'object').length;
  }

  calculateAuthorizedStats(): void {
    const now = new Date();
    this.stats.active = this.authorizedCards.filter(card => {
      const expDate = new Date(card.expirationDate);
      return card.active && expDate >= now;
    }).length;
    
    this.stats.expired = this.authorizedCards.filter(card => {
      const expDate = new Date(card.expirationDate);
      return !card.active || expDate < now;
    }).length;
  }

  applyFilters(): void {
    let filtered = [...this.cards];

    if (this.filterStatus !== 'all') {
      if (this.filterStatus === 'assigned') {
        filtered = filtered.filter(card => card.student && typeof card.student === 'object');
      } else if (this.filterStatus === 'unassigned') {
        filtered = filtered.filter(card => !card.student || typeof card.student !== 'object');
      }
    }

    if (this.filterStudentId) {
      filtered = filtered.filter(card => {
        if (card.student && typeof card.student === 'object') {
          const student = card.student as Student;
          return student.studentId?.toLowerCase().includes(this.filterStudentId.toLowerCase()) ||
                 student.name?.toLowerCase().includes(this.filterStudentId.toLowerCase());
        }
        return false;
      });
    }

    if (this.filterCardId) {
      filtered = filtered.filter(card => 
        card.uid.toLowerCase().includes(this.filterCardId.toLowerCase())
      );
    }

    this.filteredCards = filtered;
    this.calculatePagination();
    this.currentPage = 1;
  }

  clearFilters(): void {
    this.filterStatus = 'all';
    this.filterStudentId = '';
    this.filterCardId = '';
    this.filteredCards = [...this.cards];
    this.calculatePagination();
    this.currentPage = 1;
  }

  calculatePagination(): void {
    this.totalPages = Math.ceil(this.filteredCards.length / this.itemsPerPage);
  }

  get paginatedCards(): Card[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredCards.slice(startIndex, endIndex);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  openAssignModal(card: Card): void {
    this.selectedCard = card;
    this.selectedStudentId = '';
    this.showAssignModal = true;
  }

  openUnassignModal(card: Card): void {
    this.selectedCard = card;
    this.showUnassignModal = true;
  }

  assignCard(): void {
    if (!this.selectedCard || !this.selectedStudentId) return;

    this.cardsService.assignCardToStudent(this.selectedCard._id, this.selectedStudentId).subscribe({
      next: (updatedCard) => {
        const index = this.cards.findIndex(c => c._id === updatedCard._id);
        if (index !== -1) {
          this.cards[index] = updatedCard;
        }
        this.filteredCards = [...this.cards];
        this.calculateStats();
        this.showAssignModal = false;
        this.selectedCard = null;
        this.selectedStudentId = '';
      },
      error: (error) => {
        console.error('Error assigning card:', error);
        alert('فشل في تعيين البطاقة: ' + (error.error?.error || error.message));
      }
    });
  }

  unassignCard(): void {
    if (!this.selectedCard) return;

    this.cardsService.updateCard(this.selectedCard._id, { student: null }).subscribe({
      next: (updatedCard) => {
        const index = this.cards.findIndex(c => c._id === updatedCard._id);
        if (index !== -1) {
          this.cards[index] = updatedCard;
        }
        this.filteredCards = [...this.cards];
        this.calculateStats();
        this.showUnassignModal = false;
        this.selectedCard = null;
      },
      error: (error) => {
        console.error('Error unassigning card:', error);
        alert('فشل في إلغاء تعيين البطاقة: ' + error.message);
      }
    });
  }

  createCard(): void {
    if (!this.newCardUid.trim()) {
      alert('يرجى إدخال معرف البطاقة');
      return;
    }

    // First check if card is authorized
    this.cardsService.checkCardAuthorization(this.newCardUid).subscribe({
      next: (authResponse) => {
        if (authResponse.authorized) {
          // Card is authorized, proceed to create
          const cardData = {
            uid: this.newCardUid,
            student: null,
            issueDate: new Date().toISOString()
          };

          this.cardsService.createCard(cardData).subscribe({
            next: (newCard) => {
              this.cards.push(newCard);
              this.filteredCards = [...this.cards];
              this.calculateStats();
              this.newCardUid = '';
              this.showCreateModal = false;
              alert('تم إنشاء البطاقة بنجاح');
            },
            error: (error) => {
              console.error('Error creating card:', error);
              alert('فشل في إنشاء البطاقة: ' + (error.error?.error || error.message));
            }
          });
        } else {
          alert('البطاقة غير مصرحة أو منتهية الصلاحية. يرجى إضافتها أولاً إلى البطاقات المصرحة.');
          this.showCreateModal = false;
          this.showAuthorizedCardsModal = true;
          this.authorizedCardData.uid = this.newCardUid;
        }
      },
      error: (error) => {
        console.error('Error checking card authorization:', error);
        alert('خطأ في التحقق من صلاحية البطاقة: ' + error.message);
      }
    });
  }

  addAuthorizedCard(): void {
    if (!this.authorizedCardData.uid.trim() || !this.authorizedCardData.cardName.trim()) {
      alert('يرجى إدخال معرف البطاقة واسم البطاقة');
      return;
    }

    // Validate expiration date
    if (!this.authorizedCardData.expirationDate) {
      alert('يرجى تحديد تاريخ انتهاء الصلاحية');
      return;
    }

    this.cardsService.createAuthorizedCard(this.authorizedCardData).subscribe({
      next: (newCard) => {
        this.authorizedCards.push(newCard);
        this.calculateAuthorizedStats();
        this.authorizedCardData = {
          uid: '',
          cardName: '',
          description: '',
          expirationDate: '',
          notes: ''
        };
        alert('تمت إضافة البطاقة المصرحة بنجاح');
      },
      error: (error) => {
        console.error('Error adding authorized card:', error);
        alert('فشل في إضافة البطاقة المصرحة: ' + (error.error?.error || error.message));
      }
    });
  }

  updateAuthorizedCard(card: AuthorizedCard): void {
    const updatedData = {
      cardName: card.cardName,
      description: card.description,
      expirationDate: card.expirationDate,
      active: card.active,
      notes: card.notes
    };

    this.cardsService.updateAuthorizedCard(card._id, updatedData).subscribe({
      next: (updatedCard) => {
        const index = this.authorizedCards.findIndex(c => c._id === updatedCard._id);
        if (index !== -1) {
          this.authorizedCards[index] = updatedCard;
        }
        this.calculateAuthorizedStats();
        alert('تم تحديث البطاقة المصرحة بنجاح');
      },
      error: (error) => {
        console.error('Error updating authorized card:', error);
        alert('فشل في تحديث البطاقة المصرحة: ' + error.message);
      }
    });
  }

  deleteAuthorizedCard(cardId: string): void {
    if (confirm('هل أنت متأكد من حذف هذه البطاقة المصرحة؟')) {
      this.cardsService.deleteAuthorizedCard(cardId).subscribe({
        next: () => {
          this.authorizedCards = this.authorizedCards.filter(c => c._id !== cardId);
          this.calculateAuthorizedStats();
          alert('تم حذف البطاقة المصرحة بنجاح');
        },
        error: (error) => {
          console.error('Error deleting authorized card:', error);
          alert('فشل في حذف البطاقة المصرحة: ' + error.message);
        }
      });
    }
  }

  deleteCard(cardId: string): void {
    if (confirm('هل أنت متأكد من حذف هذه البطاقة؟')) {
      this.cardsService.deleteCard(cardId).subscribe({
        next: () => {
          this.cards = this.cards.filter(c => c._id !== cardId);
          this.filteredCards = this.filteredCards.filter(c => c._id !== cardId);
          this.calculateStats();
          alert('تم حذف البطاقة بنجاح');
        },
        error: (error) => {
          console.error('Error deleting card:', error);
          alert('فشل في حذف البطاقة: ' + error.message);
        }
      });
    }
  }

  getStudentName(card: Card): string {
    if (!card.student || typeof card.student !== 'object') {
      return 'غير معين';
    }
    return (card.student as Student).name || 'غير معروف';
  }

  getStudentId(card: Card): string {
    if (!card.student || typeof card.student !== 'object') {
      return '-';
    }
    return (card.student as Student).studentId || '-';
  }

  formatDate(dateString: string): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  isCardActive(card: AuthorizedCard): boolean {
    if (!card.active) return false;
    const expDate = new Date(card.expirationDate);
    const now = new Date();
    return expDate >= now;
  }

  toggleAuthorizedCardStatus(card: AuthorizedCard): void {
    const updatedCard = { ...card, active: !card.active };
    this.updateAuthorizedCard(updatedCard);
  }
}