import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-reservations',
  standalone: true,
  imports: [CommonModule, MatIconModule, FormsModule],
  templateUrl: './reservations.html',
  styleUrl: './reservations.scss'
})
export class Reservations implements OnInit {
  reservations: any[] = [];
  stats: any = null;
  books: any[] = [];
  isLoading = true;
  showReserveModal = false;
  showViewModal = false;
  showCancelConfirm = false;
  showCollectConfirm = false;
  selectedReservation: any = null;
  cancelId: number | null = null;
  collectId: number | null = null;
  statusFilter = '';
  currentPage = 1;
  totalPages = 1;
  total = 0;
  limit = 10;

  reserveForm: any = { bookSearch: '', bookId: '' };

  private baseUrl = 'http://localhost:5000/api';

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadReservations();
    this.loadStats();
  }

  getHeaders(): HttpHeaders {
    const token = localStorage.getItem('accessToken');
    return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  }

  loadStats(): void {
    const headers = this.getHeaders();
    this.http.get<any>(`${this.baseUrl}/reservations/stats`, { headers })
      .subscribe({
        next: (res) => {
          this.stats = res.data;
          this.cdr.detectChanges();
        },
        error: (err) => console.error(err)
      });
  }

  loadReservations(): void {
    this.isLoading = true;
    const headers = this.getHeaders();
    const params = `?page=${this.currentPage}&limit=${this.limit}&status=${this.statusFilter}`;

    this.http.get<any>(`${this.baseUrl}/reservations${params}`, { headers })
      .subscribe({
        next: (res) => {
          this.reservations = res.data || [];
          this.total = res.pagination?.total || 0;
          this.totalPages = res.pagination?.totalPages || 1;
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error(err);
          this.isLoading = false;
        }
      });
  }

  filterByStatus(status: string): void {
    this.statusFilter = status;
    this.currentPage = 1;
    this.loadReservations();
  }

  searchBooks(query: string): void {
    if (query.length < 2) return;
    const headers = this.getHeaders();
    this.http.get<any>(`${this.baseUrl}/books/search?q=${query}`, { headers })
      .subscribe({
        next: (res) => {
          this.books = res.data || [];
          this.cdr.detectChanges();
        },
        error: (err) => console.error(err)
      });
  }

  selectBook(book: any): void {
    this.reserveForm.bookId = book.id;
    this.reserveForm.bookSearch = book.title;
    this.books = [];
    this.cdr.detectChanges();
  }

  openReserveModal(): void {
    this.reserveForm = { bookSearch: '', bookId: '' };
    this.books = [];
    this.showReserveModal = true;
    this.cdr.detectChanges();
  }

  createReservation(): void {
    if (!this.reserveForm.bookId) {
      alert('Please select a book!');
      return;
    }

    const headers = this.getHeaders();
    this.http.post<any>(
      `${this.baseUrl}/reservations`,
      { bookId: parseInt(this.reserveForm.bookId) },
      { headers }
    ).subscribe({
      next: (res) => {
        if (res.success) {
          alert('Book reserved successfully!');
          this.closeModal();
          this.loadReservations();
          this.loadStats();
        }
      },
      error: (err) => alert(err.error?.message || 'Error creating reservation')
    });
  }

  viewReservation(reservation: any): void {
    const headers = this.getHeaders();
    this.http.get<any>(`${this.baseUrl}/reservations/${reservation.id}`, { headers })
      .subscribe({
        next: (res) => {
          this.selectedReservation = res.data;
          this.showViewModal = true;
          this.cdr.detectChanges();
        },
        error: (err) => console.error(err)
      });
  }

  openCancelConfirm(id: number): void {
    this.cancelId = id;
    this.showCancelConfirm = true;
    this.cdr.detectChanges();
  }

  confirmCancel(): void {
    if (!this.cancelId) return;
    const headers = this.getHeaders();

    this.http.delete<any>(
      `${this.baseUrl}/reservations/${this.cancelId}`,
      { headers }
    ).subscribe({
      next: () => {
        alert('Reservation cancelled!');
        this.closeModal();
        this.loadReservations();
        this.loadStats();
      },
      error: (err) => alert(err.error?.message || 'Error cancelling reservation')
    });
  }

  openCollectConfirm(id: number): void {
    this.collectId = id;
    this.showCollectConfirm = true;
    this.cdr.detectChanges();
  }

  confirmCollect(): void {
    if (!this.collectId) return;
    const headers = this.getHeaders();

    this.http.post<any>(
      `${this.baseUrl}/reservations/${this.collectId}/collect`,
      {},
      { headers }
    ).subscribe({
      next: (res) => {
        if (res.success) {
          alert('Book collected and issued successfully!');
          this.closeModal();
          this.loadReservations();
          this.loadStats();
        }
      },
      error: (err) => alert(err.error?.message || 'Error collecting reservation')
    });
  }

  closeModal(): void {
    this.showReserveModal = false;
    this.showViewModal = false;
    this.showCancelConfirm = false;
    this.showCollectConfirm = false;
    this.selectedReservation = null;
    this.cancelId = null;
    this.collectId = null;
    this.cdr.detectChanges();
  }

  changePage(page: number): void {
    this.currentPage = page;
    this.loadReservations();
  }

  getPages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  getStatusClass(status: string): string {
    const classes: any = {
      'PENDING': 'badge-warning',
      'AVAILABLE': 'badge-success',
      'COLLECTED': 'badge-gray',
      'CANCELLED': 'badge-danger',
      'EXPIRED': 'badge-danger'
    };
    return classes[status] || 'badge-gray';
  }

  getStatusIcon(status: string): string {
    const icons: any = {
      'PENDING': 'schedule',
      'AVAILABLE': 'check_circle',
      'COLLECTED': 'done_all',
      'CANCELLED': 'cancel',
      'EXPIRED': 'timer_off'
    };
    return icons[status] || 'info';
  }

  isExpiringSoon(expiresAt: string): boolean {
    if (!expiresAt) return false;
    const diff = new Date(expiresAt).getTime() - new Date().getTime();
    const hours = diff / (1000 * 60 * 60);
    return hours <= 24 && hours > 0;
  }

  isExpired(expiresAt: string): boolean {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  }

  canCollect(reservation: any): boolean {
    return reservation.status === 'AVAILABLE' && !this.isExpired(reservation.expiresAt);
  }

  canCancel(reservation: any): boolean {
    return ['PENDING', 'AVAILABLE'].includes(reservation.status);
  }

  getAvailableCopies(reservation: any): number {
    return reservation.book?.copies?.filter((c: any) => c.status === 'AVAILABLE').length || 0;
  }
}