import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';

import { supabase } from '../../integrations/supabase/client';

interface EngineerMonthlyTotal {
  engineerName: string;
  month: string;
  totalCost: number;
  ticketCount: number;
}

@Component({
  selector: 'app-accounts',
  standalone: true,
  imports: [CommonModule, CurrencyPipe],
  templateUrl: './accounts.component.html',
  styleUrl: './accounts.component.css'
})
export class AccountsComponent implements OnInit {
  reports = signal<EngineerMonthlyTotal[]>([]);
  isLoading = true;
  error: string | null = null;

  ngOnInit(): void {
    this.loadReports();
  }

  async loadReports() {
    this.isLoading = true;
    this.error = null;
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('created_at, maintenance_cost, engineers(name)')
        .eq('status', 'تم الإصلاح')
        .gt('maintenance_cost', 0)
        .not('assigned_engineer_id', 'is', null);

      if (error) throw error;

      const monthlyTotals = new Map<string, { totalCost: number; ticketCount: number }>();

      for (const ticket of data) {
        if (ticket.engineers) {
          const date = new Date(ticket.created_at);
          const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
          const engineerMonthKey = `${ticket.engineers.name}::${monthKey}`;

          const current = monthlyTotals.get(engineerMonthKey) || { totalCost: 0, ticketCount: 0 };
          current.totalCost += ticket.maintenance_cost || 0;
          current.ticketCount += 1;
          monthlyTotals.set(engineerMonthKey, current);
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
          ticketCount: value.ticketCount
        });
      }
      
      // Sort by month (desc) then by engineer name
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