import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, PercentPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { supabase } from '../../integrations/supabase/client';

// واجهة لتفاصيل الصيانة داخل التقرير
interface TicketDetailForReport {
  id: string;
  ticket_ref: string;
  customer_name: string;
  cost: number;
}

// تحديث الواجهة الرئيسية لتشمل تفاصيل الصيانات
interface EngineerMonthlyTotal {
  engineerName: string;
  month: string;
  totalCost: number;
  ticketCount: number;
  commissionRate: number;
  commissionAmount: number;
  tickets: TicketDetailForReport[];
  key: string; // مفتاح فريد لتتبع الصف المفتوح
}

@Component({
  selector: 'app-accounts',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, PercentPipe, RouterLink],
  templateUrl: './accounts.component.html',
  styleUrl: './accounts.component.css'
})
export class AccountsComponent implements OnInit {
  reports = signal<EngineerMonthlyTotal[]>([]);
  isLoading = true;
  error: string | null = null;
  expandedReportKey = signal<string | null>(null); // لتتبع الصف المفتوح حالياً

  ngOnInit(): void {
    this.loadReports();
  }

  // دالة لفتح وإغلاق تفاصيل الصف
  toggleDetails(key: string): void {
    if (this.expandedReportKey() === key) {
      this.expandedReportKey.set(null); // إغلاق الصف إذا كان مفتوحاً
    } else {
      this.expandedReportKey.set(key); // فتح صف جديد
    }
  }

  async loadReports() {
    this.isLoading = true;
    this.error = null;
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('id, created_at, ticket_ref, customer_name, engineers(name, commission_rate), maintenance_costs(*)')
        .eq('status', 'تم الإصلاح')
        .not('assigned_engineer_id', 'is', null);

      if (error) throw error;

      const monthlyTotals = new Map<string, { totalCost: number; tickets: TicketDetailForReport[]; commissionRate: number }>();

      for (const ticket of data) {
        const engineer = ticket.engineers as any;
        if (engineer && ticket.maintenance_costs.length > 0) {
          const commissionableCosts = ticket.maintenance_costs.filter((item: any) => 
            item.description === 'الزياره' || item.description === 'اتعاب الصيانه'
          );
          const ticketTotalCost = commissionableCosts.reduce((sum: number, item: any) => sum + (item.quantity * item.unit_price), 0);
          
          if (ticketTotalCost > 0) {
            const date = new Date(ticket.created_at);
            const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
            const engineerMonthKey = `${engineer.name}::${monthKey}`;

            const current = monthlyTotals.get(engineerMonthKey) || { totalCost: 0, tickets: [] as TicketDetailForReport[], commissionRate: engineer.commission_rate };
            
            current.totalCost += ticketTotalCost;
            current.tickets.push({
              id: ticket.id,
              ticket_ref: ticket.ticket_ref,
              customer_name: ticket.customer_name,
              cost: ticketTotalCost
            });

            monthlyTotals.set(engineerMonthKey, current);
          }
        }
      }

      const formattedReports: EngineerMonthlyTotal[] = [];
      for (const [key, value] of monthlyTotals.entries()) {
        const [engineerName, monthStr] = key.split('::');
        const monthDate = new Date(`${monthStr}-01`);
        const monthFormatted = monthDate.toLocaleString('ar-EG', { year: 'numeric', month: 'long' });
        
        formattedReports.push({
          engineerName,
          month: monthFormatted,
          totalCost: value.totalCost,
          ticketCount: value.tickets.length,
          commissionRate: value.commissionRate,
          commissionAmount: value.totalCost * value.commissionRate,
          tickets: value.tickets,
          key: key
        });
      }
      
      formattedReports.sort((a, b) => {
        const monthA = a.month;
        const monthB = b.month;
        if (monthA > monthB) return -1;
        if (monthA < monthB) return 1;
        return a.engineerName.localeCompare(b.engineerName);
      });

      this.reports.set(formattedReports);

    } catch (err: any) {
      this.error = `حدث خطأ أثناء جلب التقارير: ${err.message}`;
    } finally {
      this.isLoading = false;
    }
  }
}