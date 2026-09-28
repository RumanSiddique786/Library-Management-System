import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, MatIconModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {
  email = '';
  password = '';
  isLoading = false;
  hidePassword = true;
  emailControl = { value: '', invalid: false, touched: false, hasError: () => false, markAsTouched: () => {} };
  passwordControl = { value: '', invalid: false, touched: false, hasError: () => false, markAsTouched: () => {} };

  constructor(private http: HttpClient, private router: Router) {}

 onSubmit(): void {
  console.log('onSubmit called!');
  this.isLoading = true;

  this.http.post<any>('http://localhost:5000/api/auth/login', {
    email: this.email,
    password: this.password
  }).subscribe({
    next: (response) => {
      console.log('Success:', response);
      this.isLoading = false;
      if (response.success) {
        // Save to localStorage first
        localStorage.setItem('accessToken', response.data.accessToken);
        localStorage.setItem('refreshToken', response.data.refreshToken);
        localStorage.setItem('user', JSON.stringify(response.data.user));

        // Small delay to ensure localStorage is set
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 100);
      }
    },
    error: (error) => {
      console.log('Error:', error);
      this.isLoading = false;
      alert(error.error?.message || 'Login failed!');
    }
  });
 }

  getEmailError(): string { return ''; }
  getPasswordError(): string { return ''; }
}