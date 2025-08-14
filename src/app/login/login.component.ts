import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { supabase } from '../../integrations/supabase/client';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  loginForm: FormGroup;
  isSubmitting = false;
  authError: string | null = null;
  
  private fb = inject(FormBuilder);
  private router = inject(Router);

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  async handleLogin() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.authError = null;

    try {
      const { email, password } = this.loginForm.value;
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      // The auth service will handle navigation on successful sign-in
    } catch (error: any) {
      this.authError = error.message || 'An unexpected error occurred.';
    } finally {
      this.isSubmitting = false;
    }
  }

  async handleSignup() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.authError = null;

    try {
      const { email, password } = this.loginForm.value;
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      alert('تم إنشاء حسابك بنجاح! يرجى التحقق من بريدك الإلكتروني لتفعيل الحساب.');
      this.loginForm.reset();
    } catch (error: any) {
      this.authError = error.message || 'An unexpected error occurred.';
    } finally {
      this.isSubmitting = false;
    }
  }
}