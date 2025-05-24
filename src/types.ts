// Types for the application

export interface Template {
  id: string;
  name: string;
  category: string;
  language: string;
  status: string;
  components: Array<{
    type: string;
    text?: string;
    parameters?: Array<{
      type: string;
    }>;
  }>;
}

export interface User {
  _id: string;
  whatsapp: string;
  estado: string;
  ingreso: number;
  source_url: string;
  source_id: string;
  image_url: string;
  ctwa_clid: string;
  medio?: string;
  medio_at?: number;
  enviado?: boolean;
  nombre?: string;
}

export interface SendMessageRequest {
  phoneNumber: string;
  templateName: string;
  templateLanguage: string;
}

export interface SendMessageResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}