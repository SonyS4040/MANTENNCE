import { Component } from '@angular/core';
import { SupabaseAuthUiModule } from '@supabase/auth-ui-angular';
import { supabase } from '../../integrations/supabase/client';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [SupabaseAuthUiModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  supabase = supabase;
}