import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, MatIconModule, FormsModule],
  templateUrl: './users.html',
  styleUrl: './users.scss'
})
export class Users implements OnInit {
  users: any[] = [];
  roles: any[] = [];
  isLoading = true;
  showModal = false;
  showViewModal = false;
  isEditing = false;
  selectedUser: any = null;
  searchQuery = '';
  roleFilter = '';
  statusFilter = '';
  currentPage = 1;
  totalPages = 1;
  total = 0;
  limit = 10;

  form: any = {
    name: '', email: '', password: '',
    mobile: '', address: '', roleId: '', status: 'ACTIVE'
  };

  private baseUrl = 'http://localhost:5000/api';

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadUsers();
    this.loadRoles();
  }

  getHeaders(): HttpHeaders {
    const token = localStorage.getItem('accessToken');
    return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  }

  loadUsers(): void {
    this.isLoading = true;
    const headers = this.getHeaders();
    const params = `?page=${this.currentPage}&limit=${this.limit}&search=${this.searchQuery}&role=${this.roleFilter}&status=${this.statusFilter}`;

    this.http.get<any>(`${this.baseUrl}/users${params}`, { headers })
      .subscribe({
        next: (res) => {
          this.users = res.data || [];
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

  loadRoles(): void {
    const headers = this.getHeaders();
    this.http.get<any>(`${this.baseUrl}/users/roles`, { headers })
      .subscribe({
        next: (res) => {
          this.roles = res.data || [];
          this.cdr.detectChanges();
        },
        error: (err) => console.error(err)
      });
  }

  search(): void {
    this.currentPage = 1;
    this.loadUsers();
  }

  openAddModal(): void {
    this.isEditing = false;
    this.selectedUser = null;
    this.form = {
      name: '', email: '', password: '',
      mobile: '', address: '', roleId: '', status: 'ACTIVE'
    };
    this.showModal = true;
    this.cdr.detectChanges();
  }

  openEditModal(user: any): void {
    this.isEditing = true;
    this.selectedUser = { ...user };
    this.form = {
      name: user.name || '',
      email: user.email || '',
      password: '',
      mobile: user.mobile || '',
      address: user.address || '',
      roleId: user.role?.id?.toString() || '',
      status: user.status || 'ACTIVE'
    };
    this.showModal = true;
    this.showViewModal = false;
    this.cdr.detectChanges();
  }

  viewUser(user: any): void {
    this.selectedUser = { ...user };
    this.showViewModal = true;
    this.showModal = false;
    this.cdr.detectChanges();
  }

  closeModal(): void {
    this.showModal = false;
    this.showViewModal = false;
    this.selectedUser = null;
    this.isEditing = false;
    this.cdr.detectChanges();
  }

  saveUser(): void {
    if (!this.form.name || !this.form.email || !this.form.roleId) {
      alert('Name, email and role are required!');
      return;
    }
    if (!this.isEditing && !this.form.password) {
      alert('Password is required for new users!');
      return;
    }

    const headers = this.getHeaders();
    const url = this.isEditing
      ? `${this.baseUrl}/users/${this.selectedUser.id}`
      : `${this.baseUrl}/users`;
    const method = this.isEditing ? 'put' : 'post';

    const payload: any = {
      name: this.form.name,
      email: this.form.email,
      mobile: this.form.mobile,
      address: this.form.address,
      roleId: parseInt(this.form.roleId),
    };

    if (!this.isEditing) {
      payload.password = this.form.password;
    }

    this.http[method]<any>(url, payload, { headers })
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.closeModal();
            this.loadUsers();
          }
        },
        error: (err) => alert(err.error?.message || 'Error saving user')
      });
  }

  updateStatus(id: number, status: string): void {
    const headers = this.getHeaders();
    this.http.patch<any>(
      `${this.baseUrl}/users/${id}/status`,
      { status },
      { headers }
    ).subscribe({
      next: () => this.loadUsers(),
      error: (err) => alert(err.error?.message || 'Error updating status')
    });
  }

  deleteUser(id: number): void {
    if (!confirm('Are you sure you want to delete this user?')) return;
    const headers = this.getHeaders();
    this.http.delete<any>(`${this.baseUrl}/users/${id}`, { headers })
      .subscribe({
        next: () => this.loadUsers(),
        error: (err) => alert(err.error?.message || 'Cannot delete user')
      });
  }

  changePage(page: number): void {
    this.currentPage = page;
    this.loadUsers();
  }

  getPages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  getStatusClass(status: string): string {
    const classes: any = {
      'ACTIVE': 'badge-success',
      'SUSPENDED': 'badge-danger',
      'INACTIVE': 'badge-gray'
    };
    return classes[status] || 'badge-gray';
  }

  getRoleClass(role: string): string {
    const classes: any = {
      'SUPER_ADMIN': 'role-admin',
      'LIBRARIAN': 'role-librarian',
      'ASSISTANT_LIBRARIAN': 'role-assistant',
      'MEMBER': 'role-member'
    };
    return classes[role] || 'role-member';
  }

  getRoleIcon(role: string): string {
    const icons: any = {
      'SUPER_ADMIN': 'admin_panel_settings',
      'LIBRARIAN': 'local_library',
      'ASSISTANT_LIBRARIAN': 'library_books',
      'MEMBER': 'person'
    };
    return icons[role] || 'person';
  }

  showResetPasswordModal = false;
resetPasswordUserId: number | null = null;
resetPasswordUserName = '';
resetPasswordForm: any = {
  newPassword: '',
  confirmPassword: ''
};
isResettingPassword = false;
hideResetPass = true;
hideResetConfirm = true;

openResetPassword(user: any): void {
  this.resetPasswordUserId = user.id;
  this.resetPasswordUserName = user.name;
  this.resetPasswordForm = { newPassword: '', confirmPassword: '' };
  this.showResetPasswordModal = true;
  this.cdr.detectChanges();
}

resetUserPassword(): void {
  const { newPassword, confirmPassword } = this.resetPasswordForm;

  if (!newPassword || !confirmPassword) {
    alert('Please fill all fields!');
    return;
  }

  if (newPassword.length < 6) {
    alert('Password must be at least 6 characters!');
    return;
  }

  if (newPassword !== confirmPassword) {
    alert('Passwords do not match!');
    return;
  }

  this.isResettingPassword = true;
  const headers = this.getHeaders();

  // Admin force-reset another user's password
  this.http.patch<any>(
    `${this.baseUrl}/users/${this.resetPasswordUserId}/reset-password`,
    { newPassword },
    { headers }
  ).subscribe({
    next: (res) => {
      if (res.success) {
        alert(`Password reset successfully for ${this.resetPasswordUserName}!`);
        this.showResetPasswordModal = false;
        this.isResettingPassword = false;
        this.cdr.detectChanges();
      }
    },
    error: (err) => {
      alert(err.error?.message || 'Error resetting password');
      this.isResettingPassword = false;
    }
  });
}


toggleResetPassVisibility(): void {
  this.hideResetPass = !this.hideResetPass;
  this.cdr.detectChanges();
}

toggleResetConfirmVisibility(): void {
  this.hideResetConfirm = !this.hideResetConfirm;
  this.cdr.detectChanges();
}

closeUserModal(): void {
  this.showModal = false;
  this.showViewModal = false;
  this.showResetPasswordModal = false;
  this.selectedUser = null;
  this.isEditing = false;
  this.cdr.detectChanges();
}

}