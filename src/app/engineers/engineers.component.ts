import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, PercentPipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { supabase } from '../../integrations/supabase/client';

// Define a more detailed Engineer interface for this component
export interface Engineer {
  id: string;
  name: string;
  commission_rate: number;
}

@Component({
  selector: 'app-engineers',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PercentPipe],
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
      name: ['', Validators.required],
      commission_rate: [0.10, [Validators.required, Validators.min(0), Validators.max(1)]]
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
        .select('id, name, commission_rate')
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
    const { name, commission_rate } = this.engineerForm.value;
    try {
      const { error } = await supabase.from('engineers').insert([{ name, commission_rate }]);
      if (error) throw error;
      alert('تمت إضافة المهندس بنجاح!');
      this.resetForm();
      await this.fetchEngineers();
    } catch (err: any) {
      alert(`حدث خطأ أثناء إضافة المهندس: ${err.message}`);
    }
  }

  private async updateEngineer() {
    const { name, commission_rate } = this.engineerForm.value;
    const engineerId = this.editingEngineer()!.id;
    try {
      const { error } = await supabase.from('engineers').update({ name, commission_rate }).eq('id', engineerId);
      if (error) throw error;
      alert('تم تعديل بيانات المهندس بنجاح!');
      this.resetForm();
      await this.fetchEngineers();
    } catch (err: any) {
      alert(`حدث خطأ أثناء تعديل المهندس: ${err.message}`);
    }
  }

  startEdit(engineer: Engineer) {
    this.editingEngineer.set(engineer);
    this.engineerForm.patchValue({ 
      name: engineer.name,
      commission_rate: engineer.commission_rate 
    });
  }

  resetForm() {
    this.editingEngineer.set(null);
    this.engineerForm.reset({ name: '', commission_rate: 0.10 });
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