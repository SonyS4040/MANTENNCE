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
  editingEngineer = signal<Engineer | null>(null);
  isLoading = true;
  error: string | null = null;
  engineerForm: FormGroup;
  isSubmitting = false;

  constructor(private fb: FormBuilder) {
    this.engineerForm = this.fb.group({
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

  async onSubmit() {
    if (this.engineerForm.invalid) {
      this.engineerForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    
    if (this.editingEngineer()) {
      await this.updateEngineer();
    } else {
      await this.addEngineer();
    }

    this.isSubmitting = false;
  }

  private async addEngineer() {
    const { name } = this.engineerForm.value;
    try {
      const { error } = await supabase.from('engineers').insert([{ name }]);
      if (error) throw error;
      alert('تمت إضافة المهندس بنجاح!');
      this.resetForm();
      await this.fetchEngineers();
    } catch (err: any) {
      alert(`حدث خطأ أثناء إضافة المهندس: ${err.message}`);
    }
  }

  private async updateEngineer() {
    const { name } = this.engineerForm.value;
    const engineerId = this.editingEngineer()!.id;
    try {
      const { error } = await supabase.from('engineers').update({ name }).eq('id', engineerId);
      if (error) throw error;
      alert('تم تعديل اسم المهندس بنجاح!');
      this.resetForm();
      await this.fetchEngineers();
    } catch (err: any) {
      alert(`حدث خطأ أثناء تعديل المهندس: ${err.message}`);
    }
  }

  startEdit(engineer: Engineer) {
    this.editingEngineer.set(engineer);
    this.engineerForm.patchValue({ name: engineer.name });
  }

  resetForm() {
    this.editingEngineer.set(null);
    this.engineerForm.reset();
  }

  async deleteEngineer(id: string, name: string) {
    if (!confirm(`هل أنت متأكد من رغبتك في حذف المهندس "${name}"؟`)) {
      return;
    }
    try {
      const { error } = await supabase.from('engineers').delete().eq('id', id);
      if (error) throw error;
      alert('تم حذف المهندس بنجاح.');
      await this.fetchEngineers();
    } catch (err: any)
      {
      alert(`حدث خطأ أثناء حذف المهندس: ${err.message}`);
    }
  }
}