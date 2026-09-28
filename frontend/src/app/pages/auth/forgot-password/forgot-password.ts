import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, MatIconModule, FormsModule, RouterLink],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.scss'
})
export class ForgotPassword {
  email = '';
  isLoading = false;
  isSubmitted = false;
  errorMessage = '';

  private baseUrl = 'http://localhost:5000/api';

  constructor(private http: HttpClient, private router: Router) {}

  onSubmit(): void {
    if (!this.email) {
      this.errorMessage = 'Please enter your email address';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.http.post<any>(`${this.baseUrl}/auth/forgot-password`, { email: this.email })
      .subscribe({
        next: (res) => {
          this.isLoading = false;
          this.isSubmitted = true;
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = err.error?.message || 'Something went wrong';
        }
      });
  }
}