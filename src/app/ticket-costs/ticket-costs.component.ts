import { Component, Input, OnInit, signal, computed, inject, OnDestroy } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { supabase } from '../../integrations/supabase/client';
import { Subscription } from 'rxjs';

export interface MaintenanceCost {
  id: string;
  ticket_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  created_at: string;
}

@Component({
  selector: 'app-ticket-costs',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CurrencyPipe],
  templateUrl: './ticket-costs.component.html',
  styleUrl: './ticket-costs.component.css'
})
export class TicketCostsComponent implements OnInit, OnDestroy {
  @Input({ required: true }) ticketId!: string;

  costItems = signal<MaintenanceCost[]>([]);
  isAddingCost = signal(false);
  costItemForm: FormGroup;
  private descriptionTypeSubscription: Subscription | undefined;

  private fb = inject(FormBuilder);

  totalCost = computed(() => 
    this.costItems().reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
  );

  constructor() {
    this.costItemForm = this.fb.group({
      descriptionType: ['الزياره', Validators.required],
      description: [''],
      quantity: [1, [Validators.required, Validators.min(0.01)]],
      unit_price: [0, [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit(): void {
    this.fetchCostItems();
    this.setupConditionalValidation();
  }

  ngOnDestroy(): void {
    this.descriptionTypeSubscription?.unsubscribe();
  }

  private setupConditionalValidation(): void {
    const descriptionControl = this.costItemForm.get('description');
    this.descriptionTypeSubscription = this.costItemForm.get('descriptionType')?.valueChanges.subscribe(value => {
      if (value === 'اخري') {
        descriptionControl?.setValidators(Validators.required);
      } else {
        descriptionControl?.clearValidators();
        descriptionControl?.setValue('');
      }
      descriptionControl?.updateValueAndValidity();
    });
  }

  async fetchCostItems() {
    try {
      const { data, error } = await supabase
        .from('maintenance_costs')
        .select('*')
        .eq('ticket_id', this.ticketId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      this.costItems.set(data || []);
    } catch (err: any) {
      console.error('Error fetching cost items:', err);
      alert(`حدث خطأ في جلب بنود التكلفة: ${err.message}`);
    }
  }

  async addCostItem() {
    if (this.costItemForm.invalid) {
      this.costItemForm.markAllAsTouched();
      return;
    }
    this.isAddingCost.set(true);
    
    const formValue = this.costItemForm.value;
    const finalDescription = formValue.descriptionType === 'اخري' ? formValue.description : formValue.descriptionType;

    const costData = {
      description: finalDescription,
      quantity: formValue.quantity,
      unit_price: formValue.unit_price,
      ticket_id: this.ticketId
    };

    try {
      const { error } = await supabase.from('maintenance_costs').insert([costData]);
      if (error) throw error;
      this.costItemForm.reset({ 
        quantity: 1, 
        unit_price: 0, 
        descriptionType: 'الزياره',
        description: ''
      });
      await this.fetchCostItems();
    } catch (err: any) {
      alert(`حدث خطأ أثناء إضافة بند التكلفة: ${err.message}`);
    } finally {
      this.isAddingCost.set(false);
    }
  }

  async deleteCostItem(costId: string) {
    if (!confirm('هل أنت متأكد من رغبتك في حذف هذا البند؟')) return;
    try {
      const { error } = await supabase.from('maintenance_costs').delete().eq('id', costId);
      if (error) throw error;
      await this.fetchCostItems();
    } catch (err: any) {
      alert(`حدث خطأ أثناء حذف بند التكلفة: ${err.message}`);
    }
  }
}