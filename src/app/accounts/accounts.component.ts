import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, PercentPipe } from '@angular/common';

import { supabase } from '../../integrations/supabase/client';

interface EngineerMonthlyTotal {
  engineerName: string;
  month: string;
  totalCost: number;
  ticketCount: number;
  commissionRate: number;
  commissionAmount: number;
}

@Component({
  selector: 'app-accounts',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, PercentPipe],
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
        .select('id, created_at, engineers(name, commission_rate), maintenance_costs(*)')
        .eq('status', 'تم الإصلاح')
        .not('assigned_engineer_id', 'is', null);

      if (error) throw error;

      const monthlyTotals = new Map<string, { totalCost: number; ticketCount: Set<string>; commissionRate: number }>();

      for (const ticket of data) {
        const engineer = ticket.engineers as any;
        if (engineer && ticket.maintenance_costs.length > 0) {
          // Filter for commissionable costs only ("الزياره" and "اتعاب الصيانه")
          const commissionableCosts = ticket.maintenance_costs.filter((item: any) => 
            item.description === 'الزياره' || item.description === 'اتعاب الصيانه'
          );

          // Calculate total based on filtered costs
          const ticketTotalCost = commissionableCosts.reduce((sum: number, item: any) => sum + (item.quantity * item.unit_price), 0);
          
          if (ticketTotalCost > 0) {
            const date = new Date(ticket.created_at);
            const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
            const engineerMonthKey = `${engineer.name}::${monthKey}`;

            const current = monthlyTotals.get(engineerMonthKey) || { totalCost: 0, ticketCount: new Set(), commissionRate: engineer.commission_rate };
            current.totalCost += ticketTotalCost;
            current.ticketCount.add(ticket.id);
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
          ticketCount: value.ticketCount.size,
          commissionRate: value.commissionRate,
          commissionAmount: value.totalCost * value.commissionRate
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