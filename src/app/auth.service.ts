import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../integrations/supabase/client';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  session = signal<Session | null>(null);
  user = signal<User | null>(null);

  constructor(private router: Router) {
    supabase.auth.onAuthStateChange((event, session) => {
      this.session.set(session);
      this.user.set(session?.user ?? null);
    });
  }

  async signOut() {
    await supabase.auth.signOut();
    this.router.navigate(['/']);
  }
}