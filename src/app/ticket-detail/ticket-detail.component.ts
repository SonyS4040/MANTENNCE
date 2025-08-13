import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { supabase } from '../../integrations/supabase/client';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-ticket-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ticket-detail.component.html',
  styleUrls: ['./ticket-detail.component.css']
})
export class TicketDetailComponent implements OnInit {
  ticket = signal<any | null>(null);
  isLoading = signal(true);
  engineers: any[] = [];
  selectedEngineerId: string | null = null;
  isUpdating = false;

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    const ticketId = this.route.snapshot.paramMap.get('id');
    if (ticketId) {
      this.fetchTicket(ticketId);
      this.fetchEngineers();
    } else {
      this.isLoading.set(false);
    }
  }

  async fetchTicket(id: string) {
    this.isLoading.set(true);
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          *,
          assigned_engineer:engineers (
            id,
            name
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      this.ticket.set(data);
      this.selectedEngineerId = data.assigned_engineer_id;
    } catch (error) {
      console.error('Error fetching ticket:', error);
      this.ticket.set(null);
    } finally {
      this.isLoading.set(false);
    }
  }

  async fetchEngineers() {
    try {
      const { data, error } = await supabase.from('engineers').select('id, name');
      if (error) throw error;
      this.engineers = data;
    } catch (error) {
      console.error('Error fetching engineers:', error);
    }
  }

  async assignEngineer() {
    const ticketData = this.ticket();
    if (!ticketData || !this.selectedEngineerId) {
      alert('الرجاء اختيار مهندس أولاً.');
      return;
    }

    this.isUpdating = true;
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ assigned_engineer_id: this.selectedEngineerId })
        .eq('id', ticketData.id);

      if (error) throw error;
      
      // Refresh ticket data to show the newly assigned engineer's name
      await this.fetchTicket(ticketData.id);
      alert('تم تعيين المهندس بنجاح.');

    } catch (error: any) {
      console.error('Error assigning engineer:', error);
      alert(`حدث خطأ: ${error.message}`);
    } finally {
      this.isUpdating = false;
    }
  }

  async updateStatus(newStatus: string) {
    const ticketData = this.ticket();
    if (!ticketData) return;

    this.isUpdating = true;
    try {
      const { data, error } = await supabase
        .from('tickets')
        .update({ status: newStatus })
        .eq('id', ticketData.id)
        .select()
        .single();

      if (error) throw error;
      this.ticket.set(data); // Update local ticket data
      await this.fetchTicket(ticketData.id); // Re-fetch to get engineer name
      alert(`تم تحديث حالة الطلب إلى "${newStatus}".`);
    } catch (error: any) {
      console.error('Error updating status:', error);
      alert(`حدث خطأ: ${error.message}`);
    } finally {
      this.isUpdating = false;
    }
  }

  async deleteTicket() {
    const ticketData = this.ticket();
    if (!ticketData) return;

    if (confirm(`هل أنت متأكد من أنك تريد حذف الطلب رقم ${ticketData.ticket_ref}؟`)) {
      try {
        const { error } = await supabase
          .from('tickets')
          .delete()
          .eq('id', ticketData.id);

        if (error) throw error;
        alert('تم حذف الطلب بنجاح.');
        this.router.navigate(['/tickets']);
      } catch (error: any) {
        console.error('Error deleting ticket:', error);
        alert(`حدث خطأ: ${error.message}`);
      }
    }
  }
}