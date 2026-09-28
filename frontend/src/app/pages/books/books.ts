import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

declare const QRCode: any;

@Component({
  selector: 'app-books',
  standalone: true,
  imports: [CommonModule, MatIconModule, FormsModule],
  templateUrl: './books.html',
  styleUrl: './books.scss'
})
export class Books implements OnInit {
  books: any[] = [];
  categories: any[] = [];
  authors: any[] = [];
  publishers: any[] = [];
  isLoading = true;
  showModal = false;
  showViewModal = false;
  showDeleteConfirm = false;
  isEditing = false;
  selectedBook: any = null;
  deleteBookId: number | null = null;
  searchQuery = '';
  categoryFilter = '';
  statusFilter = '';
  currentPage = 1;
  totalPages = 1;
  total = 0;
  limit = 10;
  activeTab = 'books';

  form: any = {
    title: '', isbn: '', subtitle: '', edition: '',
    pages: '', price: '', description: '', keywords: '',
    categoryId: '', publisherId: '', languageId: '',
    authorIds: [], copies: 1
  };

  private baseUrl = 'http://localhost:5000/api';

  constructor(
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
   this.loadBooks();
   this.loadCategories();
   this.loadAuthors();
   this.loadPublishers();
   this.loadLanguages();
   this.loadSubjects();
  }

  getHeaders(): HttpHeaders {
    const token = localStorage.getItem('accessToken');
    return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  }

  loadBooks(): void {
    this.isLoading = true;
    const headers = this.getHeaders();
    const params = `?page=${this.currentPage}&limit=${this.limit}&search=${this.searchQuery}&categoryId=${this.categoryFilter}`;

    this.http.get<any>(`${this.baseUrl}/books${params}`, { headers })
      .subscribe({
        next: (res) => {
          this.books = res.data || [];
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

  loadCategories(): void {
    const headers = this.getHeaders();
    this.http.get<any>(`${this.baseUrl}/books/categories/all`, { headers })
      .subscribe({
        next: (res) => {
          this.categories = res.data || [];
          this.cdr.detectChanges();
        },
        error: (err) => console.error(err)
      });
  }

  loadAuthors(): void {
    const headers = this.getHeaders();
    this.http.get<any>(`${this.baseUrl}/books/authors/all`, { headers })
      .subscribe({
        next: (res) => {
          this.authors = res.data?.authors || res.data || [];
          this.cdr.detectChanges();
        },
        error: (err) => console.error(err)
      });
  }

  loadPublishers(): void {
    const headers = this.getHeaders();
    this.http.get<any>(`${this.baseUrl}/books/publishers/all`, { headers })
      .subscribe({
        next: (res) => {
          this.publishers = res.data?.publishers || res.data || [];
          this.cdr.detectChanges();
        },
        error: (err) => console.error(err)
      });
  }


  languages: any[] = [];
  subjects: any[] = [];

loadLanguages(): void {
  const headers = this.getHeaders();
  this.http.get<any>(`${this.baseUrl}/settings/languages`, { headers })
    .subscribe({
      next: (res) => {
        this.languages = res.data || [];
        this.cdr.detectChanges();
      },
      error: (err) => console.error(err)
    });
}

loadSubjects(): void {
  const headers = this.getHeaders();
  this.http.get<any>(`${this.baseUrl}/settings/subjects`, { headers })
    .subscribe({
      next: (res) => {
        this.subjects = res.data || [];
        this.cdr.detectChanges();
      },
      error: (err) => console.error(err)
    });
}

  search(): void {
    this.currentPage = 1;
    this.loadBooks();
  }

  openAddModal(): void {
  this.isEditing = false;
  this.selectedBook = null;
  this.bookAuthors = [];
  this.newAuthorInput = '';
  this.form = {
    title: '', isbn: '', subtitle: '', edition: '',
    pages: '', price: '', description: '', keywords: '',
    categoryId: '', publisherId: '', languageId: '', subjectId: '',
    authorIds: [], copies: 1
  };
  this.showModal = true;
  this.showViewModal = false;
  this.cdr.detectChanges();
 }

  openEditModal(book: any): void {
  this.isEditing = true;
  this.selectedBook = { ...book };
  // Remove duplicates using Set
  const uniqueAuthors = [...new Set<string>(
    book.authors?.map((a: any) => a.author?.name || '').filter((n: string) => n) || []
  )];
  this.bookAuthors = uniqueAuthors;
  this.newAuthorInput = '';
  this.form = {
  title: book.title || '',
  isbn: book.isbn || '',
  subtitle: book.subtitle || '',
  edition: book.edition || '',
  pages: book.pages || '',
  price: book.price || '',
  description: book.description || '',
  keywords: book.keywords || '',
  categoryId: book.categoryId?.toString() || '',
  publisherId: book.publisherId?.toString() || '',
  languageId: book.languageId?.toString() || '',
  subjectId: book.subjectId?.toString() || '',
  authorIds: [],
  copies: 0
  };
  this.showModal = true;
  this.showViewModal = false;
  this.cdr.detectChanges();
 }

  viewBook(book: any): void {
   const headers = this.getHeaders();
   this.http.get<any>(`${this.baseUrl}/books/${book.id}`, { headers })
    .subscribe({
      next: (res) => {
        this.selectedBook = res.data;
        this.showViewModal = true;
        this.showModal = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.selectedBook = { ...book };
        this.showViewModal = true;
        this.cdr.detectChanges();
      }
    });
  }

  closeModal(): void {
    this.showModal = false;
    this.showViewModal = false;
    this.showDeleteConfirm = false;
    this.showImportModal = false; 
    this.selectedBook = null;
    this.deleteBookId = null;
    this.isEditing = false;
    this.cdr.detectChanges();
  }

 saveBook(): void {
  if (!this.form.title || !this.form.categoryId) {
    alert('Title and Category are required!');
    return;
  }

  const headers = this.getHeaders();

  // Get all existing authors first
  this.http.get<any>(`${this.baseUrl}/books/authors/all`, { headers })
    .subscribe({
      next: async (res) => {
        const allAuthors = res.data?.authors || res.data || [];
        const finalAuthorIds: number[] = [];

        for (const authorName of this.bookAuthors) {
          const existing = allAuthors.find(
            (a: any) => a.name.toLowerCase() === authorName.toLowerCase()
          );

          if (existing) {
            // Author already exists — use existing id
            if (!finalAuthorIds.includes(existing.id)) {
              finalAuthorIds.push(existing.id);
            }
          } else {
            // Create new author
            try {
              const res2: any = await this.http.post<any>(
                `${this.baseUrl}/books/authors/create`,
                { name: authorName.trim() },
                { headers }
              ).toPromise();

              if (res2?.success && !finalAuthorIds.includes(res2.data.id)) {
                finalAuthorIds.push(res2.data.id);
              }
            } catch (e) {
              console.error('Error creating author:', authorName);
            }
          }
        }

        // Now save the book with unique author ids
        const url = this.isEditing
          ? `${this.baseUrl}/books/${this.selectedBook.id}`
          : `${this.baseUrl}/books`;
        const method = this.isEditing ? 'put' : 'post';

        const payload: any = {
          title: this.form.title,
          isbn: this.form.isbn || undefined,
          subtitle: this.form.subtitle || undefined,
          edition: this.form.edition || undefined,
          pages: this.form.pages ? parseInt(this.form.pages) : undefined,
          price: this.form.price ? parseFloat(this.form.price) : undefined,
          description: this.form.description || undefined,
          keywords: this.form.keywords || undefined,
          categoryId: parseInt(this.form.categoryId),
          publisherId: this.form.publisherId ? parseInt(this.form.publisherId) : undefined,
          languageId: this.form.languageId ? parseInt(this.form.languageId) : undefined,  // ← ADD
          subjectId: this.form.subjectId ? parseInt(this.form.subjectId) : undefined,      // ← ADD
          authorIds: [...new Set(finalAuthorIds)],
          copies: this.form.copies ? parseInt(this.form.copies) : 0,
           };

        this.http[method]<any>(url, payload, { headers })
          .subscribe({
            next: (res) => {
              if (res.success) {
                this.closeModal();
                this.loadBooks();
                // Reload authors list for next time
                this.loadAuthors();
              }
            },
            error: (err) => alert(err.error?.message || 'Error saving book')
          });
      },
      error: () => alert('Error fetching authors')
    });
 }

  confirmDelete(id: number): void {
    this.deleteBookId = id;
    this.showDeleteConfirm = true;
    this.cdr.detectChanges();
  }

  deleteBook(): void {
    if (!this.deleteBookId) return;
    const headers = this.getHeaders();
    this.http.delete<any>(`${this.baseUrl}/books/${this.deleteBookId}`, { headers })
      .subscribe({
        next: () => {
          this.closeModal();
          this.loadBooks();
        },
        error: (err) => alert(err.error?.message || 'Cannot delete book')
      });
  }

  addCopy(bookId: number): void {
    const headers = this.getHeaders();
    this.http.post<any>(
      `${this.baseUrl}/books/${bookId}/copies`,
      { condition: 'GOOD' },
      { headers }
    ).subscribe({
      next: () => {
        alert('Copy added successfully!');
        this.loadBooks();
      },
      error: (err) => alert(err.error?.message || 'Error adding copy')
    });
  }

  toggleAuthor(authorId: string): void {
    const idx = this.form.authorIds.indexOf(authorId);
    if (idx > -1) {
      this.form.authorIds.splice(idx, 1);
    } else {
      this.form.authorIds.push(authorId);
    }
  }

  isAuthorSelected(authorId: string): boolean {
    return this.form.authorIds.includes(authorId);
  }

  getAvailableCopies(book: any): number {
    return book.copies?.filter((c: any) => c.status === 'AVAILABLE').length || 0;
  }

  getTotalCopies(book: any): number {
    return book._count?.copies || book.copies?.length || 0;
  }

  getStatusClass(book: any): string {
   // Handle both list view (_count) and detail view (copies array)
   const copies = book.copies || [];
   const total = book._count?.copies || copies.length || 0;
   const available = copies.filter((c: any) => c.status === 'AVAILABLE').length;

   if (total === 0) return 'badge-gray';
   if (available <= 0) return 'badge-danger';
   if (available <= 2) return 'badge-warning';
   return 'badge-success';
   }

  getStatusText(book: any): string {
   const copies = book.copies || [];
   const total = book._count?.copies || copies.length || 0;
   const available = copies.filter((c: any) => c.status === 'AVAILABLE').length;

   if (total === 0) return 'No Copies';
   if (copies.length === 0) return `${total} Copies`;
   if (available <= 0) return 'Unavailable';
   return `${available}/${total} Available`;
   }
   changePage(page: number): void {
    this.currentPage = page;
    this.loadBooks();
  }

  getPages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  getAuthorNames(book: any): string {
   if (!book.authors || book.authors.length === 0) return 'Unknown Author';
   return book.authors
    .map((a: any) => a.author?.name || a.name || 'Unknown')
    .filter((name: string) => name !== 'Unknown')
    .join(', ') || 'Unknown Author';
  }

  getCoverColor(index: number): string {
    const colors = [
      'linear-gradient(135deg, #6366f1, #8b5cf6)',
      'linear-gradient(135deg, #10b981, #059669)',
      'linear-gradient(135deg, #f59e0b, #d97706)',
      'linear-gradient(135deg, #ef4444, #dc2626)',
      'linear-gradient(135deg, #0ea5e9, #0284c7)',
      'linear-gradient(135deg, #ec4899, #db2777)',
    ];
    return colors[index % colors.length];
  }
  
  generateQR(book: any): void {
  const qrData = JSON.stringify({
    id: book.id,
    title: book.title,
    isbn: book.isbn || 'N/A',
    category: book.category?.name
  });

  // Create QR window
  const qrWindow = window.open('', '_blank', 'width=500,height=600');
  if (!qrWindow) return;

  qrWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>QR Code - ${book.title}</title>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: Arial, sans-serif;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 40px 20px;
          background: #f8fafc;
          min-height: 100vh;
        }
        .card {
          background: white;
          border-radius: 16px;
          padding: 32px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
          text-align: center;
          max-width: 360px;
          width: 100%;
        }
        .library-name {
          font-size: 14px;
          font-weight: 700;
          color: #6366f1;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 8px;
        }
        h2 {
          font-size: 18px;
          font-weight: 800;
          color: #1e293b;
          margin-bottom: 4px;
          line-height: 1.3;
        }
        .isbn {
          font-size: 12px;
          color: #94a3b8;
          font-family: monospace;
          margin-bottom: 20px;
        }
        #qrcode {
          display: flex;
          justify-content: center;
          margin: 20px 0;
        }
        #qrcode canvas, #qrcode img {
          border-radius: 8px;
          border: 8px solid white;
          box-shadow: 0 0 0 1px #e2e8f0;
        }
        .category {
          display: inline-block;
          background: #eef2ff;
          color: #6366f1;
          font-size: 11px;
          font-weight: 700;
          padding: 4px 12px;
          border-radius: 20px;
          margin-bottom: 20px;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #f1f5f9;
          font-size: 13px;
        }
        .info-row:last-child { border-bottom: none; }
        .info-label { color: #94a3b8; }
        .info-value { font-weight: 600; color: #334155; }
        .actions {
          display: flex;
          gap: 12px;
          margin-top: 24px;
          justify-content: center;
        }
        button {
          padding: 10px 24px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .print-btn {
          background: #6366f1;
          color: white;
        }
        .print-btn:hover { background: #4f46e5; }
        .close-btn {
          background: #f1f5f9;
          color: #475569;
        }
        .close-btn:hover { background: #e2e8f0; }
        @media print {
          body { background: white; padding: 0; }
          .actions { display: none; }
          .card { box-shadow: none; }
        }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="library-name">📚 Library System</div>
        <h2>${book.title}</h2>
        <div class="isbn">${book.isbn || 'No ISBN'}</div>
        <div class="category">${book.category?.name || 'Uncategorized'}</div>

        <div id="qrcode"></div>

        <div class="info-row">
          <span class="info-label">Book ID</span>
          <span class="info-value">#${book.id}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Total Copies</span>
          <span class="info-value">${book._count?.copies || 0}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Category</span>
          <span class="info-value">${book.category?.name || '—'}</span>
        </div>

        <div class="actions">
          <button class="print-btn" onclick="window.print()">🖨️ Print QR</button>
          <button class="close-btn" onclick="window.close()">Close</button>
        </div>
      </div>

      <script>
        window.onload = function() {
          new QRCode(document.getElementById("qrcode"), {
            text: '${qrData.replace(/'/g, "\\'")}',
            width: 200,
            height: 200,
            colorDark: "#1e293b",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
          });
        };
      </script>
    </body>
    </html>
  `);
  qrWindow.document.close();
}

// Add these new properties:
bookAuthors: string[] = []; // manual author names typed by user
newAuthorInput = '';

// Add these methods:
showAuthorSuggestions = false;
filteredAuthors: any[] = [];

addAuthorToForm(): void {
  const name = this.newAuthorInput.trim();
  if (!name) return;
  if (this.bookAuthors.includes(name)) {
    alert('Author already added!');
    return;
  }
  this.bookAuthors.push(name);
  this.newAuthorInput = '';
  this.filteredAuthors = [];
  this.showAuthorSuggestions = false;
  this.cdr.detectChanges();
}

onAuthorInputChange(): void {
  const query = this.newAuthorInput.trim().toLowerCase();
  if (query.length < 1) {
    this.filteredAuthors = [];
    this.showAuthorSuggestions = false;
    this.cdr.detectChanges();
    return;
  }
  // Filter from loaded authors list
  this.filteredAuthors = this.authors
    .filter((a: any) =>
      a.name.toLowerCase().includes(query) &&
      !this.bookAuthors.includes(a.name)
    )
    .slice(0, 5);
  this.showAuthorSuggestions = this.filteredAuthors.length > 0;
  this.cdr.detectChanges();
}

selectAuthorSuggestion(author: any): void {
  if (!this.bookAuthors.includes(author.name)) {
    this.bookAuthors.push(author.name);
  }
  this.newAuthorInput = '';
  this.filteredAuthors = [];
  this.showAuthorSuggestions = false;
  this.cdr.detectChanges();
}

removeAuthorFromForm(index: number): void {
  this.bookAuthors.splice(index, 1);
  this.cdr.detectChanges();
}

showImportModal = false;
importFile: File | null = null;
importPreview: any[] = [];
importErrors: string[] = [];
isImporting = false;

openImportModal(): void {
  this.importFile = null;
  this.importPreview = [];
  this.importErrors = [];
  this.showImportModal = true;
  this.cdr.detectChanges();
}

onFileSelected(event: any): void {
  const file = event.target.files[0];
  if (!file) return;

  if (!file.name.endsWith('.csv')) {
    alert('Please select a CSV file!');
    return;
  }

  this.importFile = file;
  this.parseCSV(file);
}

parseCSV(file: File): void {
  const reader = new FileReader();
  reader.onload = (e: any) => {
    const text = e.target.result;
    const lines = text.split('\n').filter((line: string) => line.trim());

    if (lines.length < 2) {
      this.importErrors = ['CSV file must have header row and at least one data row'];
      this.cdr.detectChanges();
      return;
    }

    const headers = lines[0].split(',').map((h: string) => h.trim().toLowerCase());
    const requiredHeaders = ['title', 'categoryid'];

    this.importErrors = [];
    const missing = requiredHeaders.filter(h => !headers.includes(h));
    if (missing.length > 0) {
      this.importErrors = [`Missing required columns: ${missing.join(', ')}`];
      this.cdr.detectChanges();
      return;
    }

    this.importPreview = [];
    for (let i = 1; i < Math.min(lines.length, 6); i++) {
      const values = lines[i].split(',').map((v: string) => v.trim());
      const row: any = {};
      headers.forEach((header: string, index: number) => {
        row[header] = values[index] || '';
      });
      this.importPreview.push(row);
    }

    this.cdr.detectChanges();
  };
  reader.readAsText(file);
}

importBooks(): void {
  if (!this.importFile) return;

  this.isImporting = true;
  const reader = new FileReader();
  reader.onload = (e: any) => {
    const text = e.target.result;
    const lines = text.split('\n').filter((line: string) => line.trim());
    const headers = lines[0].split(',').map((h: string) => h.trim().toLowerCase());

    const books = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v: string) => v.trim());
      const row: any = {};
      headers.forEach((header: string, index: number) => {
        row[header] = values[index] || '';
      });

      if (row.title && row.categoryid) {
        books.push({
          title: row.title,
          isbn: row.isbn || undefined,
          categoryId: parseInt(row.categoryid),
          publisherId: row.publisherid ? parseInt(row.publisherid) : undefined,
          pages: row.pages ? parseInt(row.pages) : undefined,
          price: row.price ? parseFloat(row.price) : undefined,
          edition: row.edition || undefined,
          copies: row.copies ? parseInt(row.copies) : 1,
          description: row.description || undefined,
        });
      }
    }

    this.processImport(books);
  };
  reader.readAsText(this.importFile);
}

processImport(books: any[]): void {
  const headers = this.getHeaders();
  let success = 0;
  let failed = 0;
  const total = books.length;
  let processed = 0;

  books.forEach(book => {
    this.http.post<any>(`${this.baseUrl}/books`, book, { headers })
      .subscribe({
        next: (res) => {
          if (res.success) success++;
          processed++;
          if (processed === total) {
            this.isImporting = false;
            alert(`Import complete!\n✅ Success: ${success}\n❌ Failed: ${failed}`);
            this.showImportModal = false;
            this.loadBooks();
            this.cdr.detectChanges();
          }
        },
        error: () => {
          failed++;
          processed++;
          if (processed === total) {
            this.isImporting = false;
            alert(`Import complete!\n✅ Success: ${success}\n❌ Failed: ${failed}`);
            this.showImportModal = false;
            this.loadBooks();
            this.cdr.detectChanges();
          }
        }
      });
  });
}

downloadTemplate(): void {
  const csv = `title,isbn,categoryId,publisherId,pages,price,edition,copies,description
Clean Code,978-0132350884,1,,464,499,1st Edition,3,A book about writing clean code
The Pragmatic Programmer,978-0201616224,1,,352,599,2nd Edition,2,Software craftsmanship book`;

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'books-import-template.csv';
  a.click();
  URL.revokeObjectURL(url);
}

objectKeys(obj: any): string[] {
  return Object.keys(obj || {});
}

}

// showAddAuthorForm = false;
// newAuthorName = '';
// newAuthorNationality = '';

// toggleAddAuthorForm(): void {
//   this.showAddAuthorForm = !this.showAddAuthorForm;
//   this.newAuthorName = '';
//   this.newAuthorNationality = '';
// }

// addNewAuthor(): void {
//   if (!this.newAuthorName.trim()) {
//     alert('Author name is required!');
//     return;
//   }

//   const headers = this.getHeaders();
//   this.http.post<any>(
//     `${this.baseUrl}/books/authors/create`,
//     {
//       name: this.newAuthorName.trim(),
//       nationality: this.newAuthorNationality.trim() || undefined
//     },
//     { headers }
//   ).subscribe({
//     next: (res) => {
//       if (res.success) {
//         this.showAddAuthorForm = false;
//         this.newAuthorName = '';
//         this.newAuthorNationality = '';
//         this.loadAuthors();
//         alert(`Author "${res.data.name}" added successfully!`);
//       }
//     },
//     error: (err) => alert(err.error?.message || 'Error adding author')
//   });
// }
