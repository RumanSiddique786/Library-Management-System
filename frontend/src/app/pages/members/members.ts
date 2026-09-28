import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-members',
  standalone: true,
  imports: [CommonModule, MatIconModule, FormsModule],
  templateUrl: './members.html',
  styleUrl: './members.scss'
})
export class Members implements OnInit {
  members: any[] = [];
  memberTypes: any[] = [];
  isLoading = true;
  showModal = false;
  showViewModal = false;
  isEditing = false;
  selectedMember: any = null;
  searchQuery = '';
  statusFilter = '';
  currentPage = 1;
  totalPages = 1;
  total = 0;
  limit = 10;

  form: any = {
    name: '', email: '', mobile: '', address: '',
    department: '', studentId: '', faculty: '',
    memberTypeId: '', expiryDate: ''
  };

  private baseUrl = 'http://localhost:5000/api';

  constructor(
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadMembers();
    this.loadMemberTypes();
  }

  getHeaders(): HttpHeaders {
    const token = localStorage.getItem('accessToken');
    return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  }

  loadMembers(): void {
    this.isLoading = true;
    const headers = this.getHeaders();
    const params = `?page=${this.currentPage}&limit=${this.limit}&search=${this.searchQuery}&status=${this.statusFilter}`;

    this.http.get<any>(`${this.baseUrl}/members${params}`, { headers })
      .subscribe({
        next: (res) => {
          this.members = res.data || [];
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

  loadMemberTypes(): void {
    const headers = this.getHeaders();
    this.http.get<any>(`${this.baseUrl}/members/types`, { headers })
      .subscribe({
        next: (res) => {
          this.memberTypes = res.data || [];
          this.cdr.detectChanges();
        },
        error: (err) => console.error(err)
      });
  }

  search(): void {
    this.currentPage = 1;
    this.loadMembers();
  }

  openAddModal(): void {
  this.isEditing = false;
  this.selectedMember = null;
  this.form = {
    name: '', email: '', mobile: '', address: '',
    department: '', studentId: '', faculty: '',
    memberTypeId: '', expiryDate: ''
  };
  this.showModal = true;
  this.showViewModal = false;
  this.cdr.detectChanges();
  }

   openEditModal(member: any): void {
   this.isEditing = true;
   this.selectedMember = { ...member };
   this.form = {
    name: member.name || '',
    email: member.email || '',
    mobile: member.mobile || '',
    address: member.address || '',
    department: member.department || '',
    studentId: member.studentId || '',
    faculty: member.faculty || '',
    memberTypeId: member.memberTypeId?.toString() || '',
    expiryDate: member.expiryDate?.split('T')[0] || ''
   };
   this.showViewModal = false;
   this.showModal = true;
   this.cdr.detectChanges();
   }

   viewMember(member: any): void {
   console.log('Viewing member:', member);
   this.selectedMember = { ...member };
   this.showModal = false;
   this.showViewModal = true;
   this.cdr.detectChanges();
   }

   closeModal(): void {
    this.showModal = false;
    this.showViewModal = false;
    this.showRenewConfirm = false;
    this.showWishlistModal = false;
    this.selectedMember = null;
    this.renewMemberId = null;
    this.wishlistMemberId = null;
    this.wishlistBooks = [];
    this.wishlistSearch = '';
    this.memberWishlist = [];
    this.isEditing = false;
    this.cdr.detectChanges();
  }
    
  saveMember(): void {
  if (!this.form.name || !this.form.email || !this.form.mobile || !this.form.memberTypeId) {
    alert('Please fill all required fields (Name, Email, Mobile, Member Type)');
    return;
  }

  const headers = this.getHeaders();
  const url = this.isEditing
    ? `${this.baseUrl}/members/${this.selectedMember.id}`
    : `${this.baseUrl}/members`;
  const method = this.isEditing ? 'put' : 'post';

  const payload = {
    name: this.form.name,
    email: this.form.email,
    mobile: this.form.mobile,
    address: this.form.address || '',
    department: this.form.department || '',
    studentId: this.form.studentId || '',
    faculty: this.form.faculty || '',
    memberTypeId: parseInt(this.form.memberTypeId),
  };

  console.log('Saving member:', payload);

  this.http[method]<any>(url, payload, { headers })
    .subscribe({
      next: (res) => {
        console.log('Response:', res);
        if (res.success) {
          this.closeModal();
          this.loadMembers();
        }
      },
      error: (err) => {
        console.error('Error:', err);
        alert(err.error?.message || 'Error saving member')
      }
    });
  }

  deleteMember(id: number): void {
    if (!confirm('Are you sure you want to delete this member?')) return;
    const headers = this.getHeaders();
    this.http.delete<any>(`${this.baseUrl}/members/${id}`, { headers })
      .subscribe({
        next: () => this.loadMembers(),
        error: (err) => alert(err.error?.message || 'Cannot delete member')
      });
  }

 showRenewConfirm = false;
 renewMemberId: number | null = null;
 
 showWishlistModal = false;
 memberWishlist: any[] = [];
 wishlistMemberId: number | null = null;
 wishlistBooks: any[] = [];
 wishlistSearch = '';

 openRenewConfirm(id: number): void {
  this.renewMemberId = id;
  this.showRenewConfirm = true;
  this.cdr.detectChanges();
 }

 confirmRenew(): void {
  if (!this.renewMemberId) return;
  const headers = this.getHeaders();

  this.http.patch<any>(
    `${this.baseUrl}/members/${this.renewMemberId}/renew`,
    {},
    { headers }
  ).subscribe({
    next: (res) => {
      console.log('Renewed:', res);
      this.showRenewConfirm = false;
      this.renewMemberId = null;
      this.closeModal();
      this.loadMembers();
    },
    error: (err) => {
      console.error('Renew error:', err);
      this.showRenewConfirm = false;
      alert(err.error?.message || 'Error renewing');
    }
  });
 }

 cancelRenew(): void {
  this.showRenewConfirm = false;
  this.renewMemberId = null;
  this.cdr.detectChanges();
 }

  updateStatus(id: number, status: string): void {
    const headers = this.getHeaders();
    this.http.patch<any>(`${this.baseUrl}/members/${id}/status`, { status }, { headers })
      .subscribe({
        next: () => this.loadMembers(),
        error: (err) => alert(err.error?.message || 'Error updating status')
      });
  }

  changePage(page: number): void {
    this.currentPage = page;
    this.loadMembers();
  }

  getStatusClass(status: string): string {
    const classes: any = {
      'ACTIVE': 'badge-success',
      'EXPIRED': 'badge-warning',
      'SUSPENDED': 'badge-danger',
      'INACTIVE': 'badge-gray'
    };
    return classes[status] || 'badge-gray';
  }

  isExpiringSoon(expiryDate: string): boolean {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays > 0;
  }

  isExpired(expiryDate: string): boolean {
    return new Date(expiryDate) < new Date();
  }
  
  getActiveCount(): number {
  return this.members.filter(m => m.status === 'ACTIVE').length;
  }

  getExpiredCount(): number {
  return this.members.filter(m => m.status === 'EXPIRED').length;
  }  
  getPages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  generateMemberQR(member: any): void {
  const qrData = JSON.stringify({
    memberId: member.memberId,
    name: member.name,
    type: member.memberType?.name,
    expiry: member.expiryDate
  });

  const qrWindow = window.open('', '_blank', 'width=500,height=650');
  if (!qrWindow) return;

  qrWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Member Card - ${member.name}</title>
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
        .membership-card {
          background: linear-gradient(135deg, #1e293b, #334155);
          border-radius: 20px;
          padding: 28px;
          width: 360px;
          color: white;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          position: relative;
          overflow: hidden;
        }
        .membership-card::before {
          content: '';
          position: absolute;
          width: 200px;
          height: 200px;
          background: rgba(99,102,241,0.15);
          border-radius: 50%;
          top: -80px;
          right: -60px;
        }
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
        }
        .library-brand {
          font-size: 13px;
          font-weight: 700;
          color: #818cf8;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .member-type {
          background: rgba(99,102,241,0.3);
          border: 1px solid rgba(99,102,241,0.5);
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 700;
          color: #a5b4fc;
        }
        .avatar {
          width: 56px;
          height: 56px;
          border-radius: 14px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: 800;
          color: white;
          margin-bottom: 12px;
        }
        .member-name {
          font-size: 22px;
          font-weight: 800;
          color: white;
          margin-bottom: 4px;
          letter-spacing: -0.5px;
        }
        .member-id {
          font-size: 13px;
          color: rgba(255,255,255,0.5);
          font-family: monospace;
          margin-bottom: 20px;
        }
        .card-divider {
          border-top: 1px solid rgba(255,255,255,0.1);
          margin: 16px 0;
        }
        .card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .expiry-info {
          font-size: 11px;
          color: rgba(255,255,255,0.4);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }
        .expiry-date {
          font-size: 15px;
          font-weight: 700;
          color: white;
        }
        #qrcode-member canvas, #qrcode-member img {
          border-radius: 8px;
          border: 4px solid rgba(255,255,255,0.1);
        }
        .dept {
          font-size: 13px;
          color: rgba(255,255,255,0.5);
          margin-bottom: 4px;
        }
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
        }
        .print-btn { background: #6366f1; color: white; }
        .close-btn { background: #f1f5f9; color: #475569; }
        @media print {
          body { background: white; padding: 0; }
          .actions { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="membership-card">
        <div class="card-header">
          <div class="library-brand">📚 LibraryMS</div>
          <div class="member-type">${member.memberType?.name || 'MEMBER'}</div>
        </div>

        <div class="avatar">${member.name.charAt(0).toUpperCase()}</div>
        <div class="member-name">${member.name}</div>
        <div class="member-id">${member.memberId}</div>

        @if (member.department) {
          <div class="dept">${member.department}</div>
        }

        <div class="card-divider"></div>

        <div class="card-footer">
          <div>
            <div class="expiry-info">Valid Until</div>
            <div class="expiry-date">${new Date(member.expiryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
          </div>
          <div id="qrcode-member"></div>
        </div>
      </div>

      <div class="actions">
        <button class="print-btn" onclick="window.print()">🖨️ Print Card</button>
        <button class="close-btn" onclick="window.close()">Close</button>
      </div>

      <script>
        window.onload = function() {
          new QRCode(document.getElementById("qrcode-member"), {
            text: '${qrData.replace(/'/g, "\\'")}',
            width: 80,
            height: 80,
            colorDark: "#ffffff",
            colorLight: "#1e293b",
            correctLevel: QRCode.CorrectLevel.H
          });
        };
      </script>
    </body>
    </html>
  `);
  qrWindow.document.close();
}





viewWishlist(member: any): void {
  this.wishlistMemberId = member.id;
  this.memberWishlist = [];
  this.wishlistBooks = [];
  this.wishlistSearch = '';
  this.showWishlistModal = true;
  this.cdr.detectChanges();
  this.loadWishlist(member.id);
}

loadWishlist(memberId: number): void {
  const headers = this.getHeaders();
  this.http.get<any>(
    `${this.baseUrl}/members/${memberId}/wishlist`,
    { headers }
  ).subscribe({
    next: (res) => {
      this.memberWishlist = res.data || [];
      this.cdr.detectChanges();
    },
    error: (err) => console.error(err)
  });
}

searchWishlistBooks(): void {
  if (this.wishlistSearch.length < 2) {
    this.wishlistBooks = [];
    this.cdr.detectChanges();
    return;
  }
  const headers = this.getHeaders();
  this.http.get<any>(
    `${this.baseUrl}/books/search?q=${this.wishlistSearch}`,
    { headers }
  ).subscribe({
    next: (res) => {
      this.wishlistBooks = res.data || [];
      this.cdr.detectChanges();
    },
    error: (err) => console.error(err)
  });
}

addToWishlist(bookId: number): void {
  if (!this.wishlistMemberId) return;
  const headers = this.getHeaders();
  this.http.post<any>(
    `${this.baseUrl}/members/${this.wishlistMemberId}/wishlist`,
    { bookId },
    { headers }
  ).subscribe({
    next: (res) => {
      if (res.success) {
        this.wishlistSearch = '';
        this.wishlistBooks = [];
        this.loadWishlist(this.wishlistMemberId!);
      }
    },
    error: (err) => alert(err.error?.message || 'Error adding to wishlist')
  });
}

removeFromWishlist(bookId: number): void {
  if (!this.wishlistMemberId) return;
  const headers = this.getHeaders();
  this.http.delete<any>(
    `${this.baseUrl}/members/${this.wishlistMemberId}/wishlist/${bookId}`,
    { headers }
  ).subscribe({
    next: () => this.loadWishlist(this.wishlistMemberId!),
    error: (err) => alert(err.error?.message || 'Error removing from wishlist')
  });
}
}