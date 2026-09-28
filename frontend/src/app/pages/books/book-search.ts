import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-book-search',
  standalone: true,
  imports: [CommonModule, MatIconModule, FormsModule],
  template: `
    <div class="search-page">
      <div class="search-header">
        <h2>Book Search</h2>
        <p>Search and check availability of books</p>
      </div>

      <!-- Search Bar -->
      <div class="search-container">
        <div class="search-input-big">
          <mat-icon>search</mat-icon>
          <input
            type="text"
            [(ngModel)]="searchQuery"
            (input)="onSearch()"
            placeholder="Search by title, ISBN, author, publisher..."
            autocomplete="off"
          />
          @if (searchQuery) {
            <button class="clear-search" (click)="clearSearch()">
              <mat-icon>close</mat-icon>
            </button>
          }
        </div>

        <!-- Filter Pills -->
        <div class="filter-pills">
          <button class="pill" [class.active]="filterStatus === ''"
            (click)="setFilter('')">
            All Books
          </button>
          <button class="pill available" [class.active]="filterStatus === 'available'"
            (click)="setFilter('available')">
            <mat-icon>check_circle</mat-icon>
            Available
          </button>
          <button class="pill issued" [class.active]="filterStatus === 'issued'"
            (click)="setFilter('issued')">
            <mat-icon>book</mat-icon>
            Issued
          </button>
        </div>
      </div>

      <!-- Results -->
      @if (isLoading) {
        <div class="search-loading">
          <div class="spinner"></div>
          <p>Searching...</p>
       </div>
      } @else if (books.length === 0 && (searchQuery || filterStatus)) {
        <div class="no-results">
          <mat-icon>search_off</mat-icon>
          <h3>No books found</h3>
          <p>Try different search terms</p>
        </div>
      //  <!-- } @else if (books.length === 0) {
      //   <div class="search-hint">
      //     <mat-icon>local_library</mat-icon>
      //     <h3>Start typing to search books</h3>
      //     <p>Search by title, ISBN, author name or publisher</p>
      //   </div> -->
      } @else {
       <div class="results-header">
       <span>
       {{ books.length }} book(s)
       @if (filterStatus === 'available') { (Available) }
       @if (filterStatus === 'issued') { (Issued) }
       @if (searchQuery) { for "{{ searchQuery }}" }
       </span>
      </div>

        <div class="books-grid">
          @for (book of books; track book.id; let i = $index) {
            <div class="book-result-card">
              <div class="book-cover" [style.background]="getColor(i)">
                <mat-icon>menu_book</mat-icon>
              </div>
              <div class="book-details">
                <h4>{{ book.title }}</h4>
                @if (book.subtitle) {
                  <p class="subtitle">{{ book.subtitle }}</p>
                }
                <div class="book-meta-row">
                  <span class="author">
                    <mat-icon>person</mat-icon>
                    {{ getAuthors(book) }}
                  </span>
                </div>
                <div class="book-meta-row">
                  <span class="isbn">
                    <mat-icon>qr_code</mat-icon>
                    {{ book.isbn || 'No ISBN' }}
                  </span>
                  <span class="category-tag">{{ book.category?.name }}</span>
                </div>
                @if (book.publisher) {
                  <div class="book-meta-row">
                    <span class="publisher">
                      <mat-icon>business</mat-icon>
                      {{ book.publisher?.name }}
                    </span>
                  </div>
                }

                <!-- Availability -->
                <div class="availability-section">
                  <div class="avail-header">
                    <span>Copies ({{ getTotalCopies(book) }} total)</span>
                    <span class="avail-count"
                      [class.has-copies]="getAvailableCopies(book) > 0"
                      [class.no-copies]="getAvailableCopies(book) === 0">
                      {{ getAvailableCopies(book) }} available
                    </span>
                  </div>

                  @if (book.copies?.length > 0) {
                    <div class="copies-status">
                      @for (copy of book.copies; track copy.id) {
                        <div class="copy-pill" [class]="'copy-' + copy.status.toLowerCase()"
                          [title]="copy.copyCode + ' - ' + copy.condition">
                          <span class="copy-dot"></span>
                          <span>{{ copy.copyCode }}</span>
                          <span class="copy-status">{{ copy.status }}</span>
                        </div>
                      }
                    </div>
                  }
                </div>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .search-page {
      max-width: 1200px;
      margin: 0 auto;
    }

    .search-header {
      margin-bottom: 24px;
      h2 {
        font-size: 28px;
        font-weight: 800;
        color: #1e293b;
        letter-spacing: -0.5px;
        margin-bottom: 4px;
      }
      p { font-size: 14px; color: #64748b; }
    }

    .search-container {
      margin-bottom: 24px;
    }

    .search-input-big {
      display: flex;
      align-items: center;
      gap: 12px;
      background: white;
      border: 2px solid #e2e8f0;
      border-radius: 14px;
      padding: 14px 20px;
      margin-bottom: 16px;
      transition: all 0.2s;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);

      &:focus-within {
        border-color: #6366f1;
        box-shadow: 0 0 0 4px rgba(99,102,241,0.1);
      }

      mat-icon {
        color: #94a3b8;
        font-size: 22px;
        width: 22px;
        height: 22px;
        flex-shrink: 0;
      }

      input {
        flex: 1;
        border: none;
        outline: none;
        font-size: 16px;
        color: #334155;
        background: transparent;
        &::placeholder { color: #94a3b8; }
      }

      .clear-search {
        background: none;
        border: none;
        cursor: pointer;
        color: #94a3b8;
        display: flex;
        padding: 4px;
        border-radius: 6px;
        &:hover { color: #64748b; background: #f1f5f9; }
        mat-icon { font-size: 18px; width: 18px; height: 18px; }
      }
    }

    .filter-pills {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .pill {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border: 1.5px solid #e2e8f0;
      border-radius: 20px;
      background: white;
      font-size: 13px;
      font-weight: 600;
      color: #64748b;
      cursor: pointer;
      transition: all 0.15s;

      mat-icon { font-size: 14px; width: 14px; height: 14px; }

      &:hover { border-color: #6366f1; color: #6366f1; background: #eef2ff; }

      &.active {
        background: #6366f1;
        border-color: #6366f1;
        color: white;
        mat-icon { color: white; }
      }

      &.available.active { background: #10b981; border-color: #10b981; }
      &.issued.active { background: #f59e0b; border-color: #f59e0b; }
    }

    .search-loading, .no-results, .search-hint {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 80px 40px;
      gap: 12px;
      color: #94a3b8;

      mat-icon { font-size: 56px; width: 56px; height: 56px; color: #cbd5e1; }
      h3 { font-size: 18px; font-weight: 700; color: #475569; }
      p { font-size: 14px; }

      .spinner {
        width: 40px;
        height: 40px;
        border: 3px solid #e2e8f0;
        border-top-color: #6366f1;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    .results-header {
      font-size: 13px;
      color: #64748b;
      font-weight: 600;
      margin-bottom: 16px;
      padding: 0 4px;
    }

    .books-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(480px, 1fr));
      gap: 16px;
    }

    .book-result-card {
      display: flex;
      gap: 16px;
      background: white;
      border-radius: 16px;
      padding: 20px;
      border: 1px solid #f1f5f9;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      transition: all 0.2s;

      &:hover {
        border-color: #e0e7ff;
        box-shadow: 0 4px 16px rgba(99,102,241,0.1);
        transform: translateY(-1px);
      }
    }

    .book-cover {
      width: 60px;
      height: 80px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 4px 8px rgba(0,0,0,0.15);

      mat-icon {
        font-size: 28px;
        width: 28px;
        height: 28px;
        color: rgba(255,255,255,0.9);
      }
    }

    .book-details {
      flex: 1;
      overflow: hidden;

      h4 {
        font-size: 15px;
        font-weight: 800;
        color: #1e293b;
        margin-bottom: 2px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .subtitle {
        font-size: 12px;
        color: #94a3b8;
        margin-bottom: 8px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }

    .book-meta-row {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 6px;
      flex-wrap: wrap;

      span {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        color: #64748b;

        mat-icon { font-size: 12px; width: 12px; height: 12px; color: #94a3b8; }
      }

      .category-tag {
        background: #f5f3ff;
        color: #8b5cf6;
        font-size: 10px;
        font-weight: 700;
        padding: 2px 8px;
        border-radius: 10px;
      }
    }

    .availability-section {
      margin-top: 10px;
      background: #f8fafc;
      border-radius: 8px;
      padding: 10px 12px;
    }

    .avail-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      font-size: 11px;
      font-weight: 700;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.5px;

      .avail-count {
        font-size: 12px;
        font-weight: 800;
        padding: 2px 10px;
        border-radius: 10px;

        &.has-copies { background: #ecfdf5; color: #10b981; }
        &.no-copies { background: #fef2f2; color: #ef4444; }
      }
    }

    .copies-status {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .copy-pill {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 10px;
      font-weight: 600;

      .copy-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        flex-shrink: 0;
      }

      .copy-status { opacity: 0.8; }

      &.copy-available {
        background: #ecfdf5;
        color: #10b981;
        .copy-dot { background: #10b981; }
      }

      &.copy-issued {
        background: #eff6ff;
        color: #3b82f6;
        .copy-dot { background: #3b82f6; }
      }

      &.copy-reserved {
        background: #fffbeb;
        color: #f59e0b;
        .copy-dot { background: #f59e0b; }
      }

      &.copy-lost, &.copy-damaged {
        background: #fef2f2;
        color: #ef4444;
        .copy-dot { background: #ef4444; }
      }

      &.copy-maintenance {
        background: #f8fafc;
        color: #94a3b8;
        .copy-dot { background: #94a3b8; }
      }
    }
  `]
})
export class BookSearch implements OnInit {
  books: any[] = [];
  searchQuery = '';
  filterStatus = '';
  isLoading = false;
  private searchTimeout: any;
  private baseUrl = 'http://localhost:5000/api';

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}
  
  getHeaders(): HttpHeaders {
    const token = localStorage.getItem('accessToken');
    return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  }
  
  ngOnInit(): void {
  this.loadBooks(); // Load all books immediately on page open
  } 

 setFilter(filter: string): void {
  this.filterStatus = filter;
  this.loadBooks();
 }

 loadBooks(): void {
  this.isLoading = true;
  const headers = this.getHeaders();
  const q = this.searchQuery.trim();
  const params = `?q=${q}&filter=${this.filterStatus}`;

  this.http.get<any>(`${this.baseUrl}/books/search${params}`, { headers })
    .subscribe({
      next: (res) => {
        this.books = res.data || [];
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
 }

 onSearch(): void {
  clearTimeout(this.searchTimeout);
  this.searchTimeout = setTimeout(() => {
    this.loadBooks();
  }, 300);
 }

 clearSearch(): void {
  this.searchQuery = '';
  this.loadBooks(); // Show all books after clearing
  this.cdr.detectChanges();
 }

  getAuthors(book: any): string {
    return book.authors?.map((a: any) => a.author?.name).join(', ') || 'Unknown';
  }

  getAvailableCopies(book: any): number {
    return book.copies?.filter((c: any) => c.status === 'AVAILABLE').length || 0;
  }

  getTotalCopies(book: any): number {
    return book._count?.copies || book.copies?.length || 0;
  }

  getColor(i: number): string {
    const colors = [
      'linear-gradient(135deg, #6366f1, #8b5cf6)',
      'linear-gradient(135deg, #10b981, #059669)',
      'linear-gradient(135deg, #f59e0b, #d97706)',
      'linear-gradient(135deg, #ef4444, #dc2626)',
      'linear-gradient(135deg, #0ea5e9, #0284c7)',
      'linear-gradient(135deg, #ec4899, #db2777)',
    ];
    return colors[i % colors.length];
  }
}