import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './services/auth.service';

export interface Card {
  _id: string;
  uid: string;
  student?: any;
  issueDate: string;
}

export interface AuthorizedCard {
  _id: string;
  uid: string;
  cardName: string;
  description?: string;
  expirationDate: string;
  active: boolean;
  createdBy?: any;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class CardsService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient, private authService: AuthService) {}

  // Cards Management
  getCards(): Observable<Card[]> {
    return this.http.get<Card[]>(`${this.apiUrl}/cards`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  getCardByUid(uid: string): Observable<Card> {
    return this.http.get<Card>(`${this.apiUrl}/cards/uid/${uid}`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  createCard(cardData: any): Observable<Card> {
    return this.http.post<Card>(`${this.apiUrl}/cards`, cardData, {
      headers: this.authService.getAuthHeaders()
    });
  }

  updateCard(id: string, cardData: any): Observable<Card> {
    return this.http.put<Card>(`${this.apiUrl}/cards/${id}`, cardData, {
      headers: this.authService.getAuthHeaders()
    });
  }

  deleteCard(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/cards/${id}`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  assignCardToStudent(cardId: string, studentId: string): Observable<Card> {
    return this.http.put<Card>(`${this.apiUrl}/cards/${cardId}`, { student: studentId }, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // Authorized Cards Management
  getAuthorizedCards(active?: boolean, expired?: boolean): Observable<AuthorizedCard[]> {
    let url = `${this.apiUrl}/authorized-cards`;
    const params = [];
    
    if (active !== undefined) params.push(`active=${active}`);
    if (expired !== undefined) params.push(`expired=${expired}`);
    
    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }
    
    return this.http.get<AuthorizedCard[]>(url, {
      headers: this.authService.getAuthHeaders()
    });
  }

  createAuthorizedCard(cardData: any): Observable<AuthorizedCard> {
    return this.http.post<AuthorizedCard>(`${this.apiUrl}/authorized-cards`, cardData, {
      headers: this.authService.getAuthHeaders()
    });
  }

  updateAuthorizedCard(id: string, cardData: any): Observable<AuthorizedCard> {
    return this.http.put<AuthorizedCard>(`${this.apiUrl}/authorized-cards/${id}`, cardData, {
      headers: this.authService.getAuthHeaders()
    });
  }

  deleteAuthorizedCard(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/authorized-cards/${id}`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  checkCardAuthorization(uid: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/authorized-cards/check/${uid}`, {
      headers: this.authService.getAuthHeaders()
    });
  }
}
