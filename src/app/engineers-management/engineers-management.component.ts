import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { supabase } from '../../integrations/supabase/client';

@Component({
  selector: 'app-engineers-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './engineers-management.component.html',
  styleUrls: ['./engineers-management.component.css']
})
export class EngineersManagementComponent implements OnInit {
  engineers: any[] = [];
  newEngineerName: string = '';
  isLoading: boolean = true;
  isAdding: boolean = false;

  async ngOnInit() {
    await this.fetchEngineers();
  }

  async fetchEngineers() {
    this.isLoading = true;
    try {
      const { data, error } = await supabase
        .from('engineers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      this.engineers = data;
    } catch (error: any) {
      console.error('Error fetching engineers:', error);
      alert('حدث خطأ أثناء جلب قائمة المهندسين.');
    } finally {
      this.isLoading = false;
    }
  }

  async addEngineer() {
    if (!this.newEngineerName.trim()) {
      alert('الرجاء إدخال اسم المهندس.');
      return;
    }
    this.isAdding = true;
    try {
      const { error } = await supabase
        .from('engineers')
        .insert([{ name: this.newEngineerName.trim() }]);
      
      if (error) throw error;

      this.newEngineerName = '';
      await this.fetchEngineers(); // Refresh the list
      alert('تمت إضافة المهندس بنجاح.');
    } catch (error: any) {
      console.error('Error adding engineer:', error);
      alert('حدث خطأ أثناء إضافة المهندس.');
    } finally {
      this.isAdding = false;
    }
  }

  async deleteEngineer(engineerId: string, engineerName: string) {
    if (!confirm(`هل أنت متأكد من أنك تريد حذف المهندس "${engineerName}"؟`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('engineers')
        .delete()
        .eq('id', engineerId);

      if (error) throw error;

      this.engineers = this.engineers.filter(e => e.id !== engineerId);
      alert('تم حذف المهندس بنجاح.');
    } catch (error: any) {
      console.error('Error deleting engineer:', error);
      alert('حدث خطأ أثناء حذف المهندس.');
    }
  }
}