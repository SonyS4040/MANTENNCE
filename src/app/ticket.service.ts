import { Injectable } from '@angular/core';
import { supabase } from '../integrations/supabase/client';

@Injectable({
  providedIn: 'root'
})
export class TicketService {

  constructor() { }

  async createTicket(ticketData: any) {
    const { data, error } = await supabase
      .from('tickets')
      .insert([ticketData])
      .select();

    if (error) {
      console.error('Error creating ticket:', error);
      throw error;
    }

    return data;
  }
}