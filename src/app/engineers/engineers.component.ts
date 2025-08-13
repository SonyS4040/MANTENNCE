import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { supabase } from '../../integrations/supabase/client';
import { Engineer } from '../ticket-detail/ticket-detail.component';

@Component({
  selector: 'app-engineers',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './engineers.component.html',
  styleUrl: './engineers.component.css'
})
export class EngineersComponent implements OnInit {
  engineers = signal<Engineer[]>([]);
  isLoading = true;
  error: string | null = null;
  addEngineerForm: FormGroup;
  isSubmitting = false;

  constructor(private fb: FormBuilder) {
    this.addEngineerForm = this.fb.group({
      name: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.fetchEngineers();
  }

  async fetchEngineers() {
    this.isLoading = true;
    this.error = null;
    try {
      const { data, error } = await supabase
        .from('engineers')
        .select('id, name')
        .order('created_at', { ascending: false });

      if (error) throw error;
      this.engineers.set(data || []);
    } catch (err: any) {
      this.error = `حدث خطأ في جلب قائمة المهندسين: ${err.message}`;
    } finally {
      this.isLoading = false;
    }
  }

  async addEngineer() {
    if (this.addEngineerForm.invalid) {
      this.addEngineerForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const { name } = this.addEngineerForm.value;

    try {
      const { error } = await supabase.from('engineers').insert([{ name }]);
      if (error) throw error;

      alert('تمت إضافة المهندس بنجاح!');
      this.addEngineerForm.reset();
      await this.fetchEngineers(); // Refresh the list

    } catch (err: any) {
      alert(`حدث خطأ أثناء إضافة المهندس: ${err.message}`);
    } finally {
      this.isSubmitting = false;
    }
  }

  async deleteEngineer(id: string, name: string) {
    if (!confirm(`هل أنت متأكد من رغبتك في حذف المهندس "${name}"؟`)) {
      return;
    }

    try {
      const { error } = await supabase.from('engineers').delete().eq('id', id);
      if (error) throw error;

      alert('تم حذف المهندس بنجاح.');
      await this.fetchEngineers(); // Refresh the list

    } catch (err: any) {
      alert(`حدث خطأ أثناء حذف المهندس: ${err.message}`);
    }
  }
}