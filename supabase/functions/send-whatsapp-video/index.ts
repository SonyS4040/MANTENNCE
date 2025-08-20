import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

// Headers for CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Main function
serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get secrets from environment variables
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioWhatsAppNumber = Deno.env.get('TWILIO_WHATSAPP_NUMBER');

    if (!twilioAccountSid || !twilioAuthToken || !twilioWhatsAppNumber) {
      throw new Error('Twilio credentials are not set in Supabase secrets.');
    }

    // Get ticketId and videoType from the request body
    const { ticketId, videoType } = await req.json();
    if (!ticketId || !videoType) {
      throw new Error('ticketId and videoType are required.');
    }

    // Create a Supabase client with the service role key to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch ticket details
    const { data: ticket, error: ticketError } = await supabaseAdmin
      .from('tickets')
      .select('ticket_ref, customer_name, customer_phone, before_repair_video_url, repair_video_url')
      .eq('id', ticketId)
      .single();

    if (ticketError) throw ticketError;
    if (!ticket) throw new Error('Ticket not found.');

    const videoUrl = videoType === 'before' ? ticket.before_repair_video_url : ticket.repair_video_url;
    if (!videoUrl) {
      throw new Error(`Video URL for type '${videoType}' not found.`);
    }

    // Format customer phone number for WhatsApp
    // This is a simple example; you might need a more robust library for phone number formatting
    const customerWhatsAppNumber = `whatsapp:${ticket.customer_phone.startsWith('+') ? ticket.customer_phone : `+2${ticket.customer_phone}`}`;

    // Construct the message
    const messageBody = `مرحباً ${ticket.customer_name}،\n\nهذا هو فيديو ${videoType === 'before' ? 'قبل الإصلاح' : 'بعد الإصلاح'} بخصوص طلب الصيانة رقم ${ticket.ticket_ref}.`;

    // Prepare the request to Twilio
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
    const twilioPayload = new URLSearchParams({
      To: customerWhatsAppNumber,
      From: twilioWhatsAppNumber,
      Body: messageBody,
      MediaUrl: videoUrl,
    });

    // Send the request to Twilio
    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${twilioAccountSid}:${twilioAuthToken}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: twilioPayload,
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.message || 'Failed to send message via Twilio.');
    }

    return new Response(JSON.stringify({ success: true, messageSid: responseData.sid }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});