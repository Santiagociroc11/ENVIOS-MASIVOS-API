import axios from 'axios';
import { Template, ConfiguredTemplate, User } from '../types';

const API_BASE_URL = '/api';

export const fetchDatabases = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/databases`);
    return response.data;
  } catch (error) {
    console.error('Error fetching databases:', error);
    return [];
  }
};

export const fetchTemplates = async (): Promise<Template[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/templates`);
    return response.data;
  } catch (error) {
    console.error('Error fetching templates:', error);
    return [];
  }
};

export const fetchConfiguredTemplates = async (): Promise<ConfiguredTemplate[]> => {
  try {
    console.log('🔗 Fetching configured templates from:', `${API_BASE_URL}/configured-templates/active`);
    const response = await axios.get(`${API_BASE_URL}/configured-templates/active`);
    console.log('📋 Configured templates response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching configured templates:', error);
    return [];
  }
};
export const fetchFilteredUsers = async (databases?: string[], page: number = 1, limit: number = 50, loadAll: boolean = false): Promise<{ users: User[]; database: string; collection: string; count: number; pagination?: any }> => {
  try {
    const params = new URLSearchParams();
    if (databases && databases.length > 0) {
      params.append('databases', databases.join(','));
    }
    
    if (loadAll) {
      params.append('loadAll', 'true');
    } else {
      params.append('page', page.toString());
      params.append('limit', limit.toString());
    }
    
    const url = `${API_BASE_URL}/users/pending?${params.toString()}`;
    console.log(`🔗 Fetching ${loadAll ? 'ALL' : limit} users from:`, url);
    
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching users:', error);
    return { users: [], database: '', collection: '', count: 0, pagination: null };
  }
};

export const fetchEstados = async (databases?: string[]): Promise<string[]> => {
  try {
    const params = new URLSearchParams();
    if (databases && databases.length > 0) {
      params.append('databases', databases.join(','));
    }
    
    const url = `${API_BASE_URL}/users/estados?${params.toString()}`;
    console.log('🔗 Fetching estados from:', url);
    
    const response = await axios.get(url);
    return response.data.estados || [];
  } catch (error) {
    console.error('Error fetching estados:', error);
    return [];
  }
};

export const fetchMedios = async (databases?: string[]): Promise<string[]> => {
  try {
    const params = new URLSearchParams();
    if (databases && databases.length > 0) {
      params.append('databases', databases.join(','));
    }
    
    const url = `${API_BASE_URL}/users/medios?${params.toString()}`;
    console.log('🔗 Fetching medios from:', url);
    
    const response = await axios.get(url);
    return response.data.medios || [];
  } catch (error) {
    console.error('Error fetching medios:', error);
    return [];
  }
};

export const sendTestTemplateMessage = async (phoneNumber: string, templateName: string): Promise<{ success: boolean; error?: string; messageId?: string; diagnostics?: any; whatsappResponse?: any }> => {
  try {
    console.log('🧪 === FRONTEND: ENVIANDO MENSAJE DE PRUEBA ===');
    console.log('📱 Número:', phoneNumber);
    console.log('📋 Plantilla:', templateName);
    console.log('🌐 URL del API:', `${API_BASE_URL}/messages/send-test`);
    
    const requestBody = {
      phoneNumber,
      templateName
    };
    
    console.log('📦 Request Body que se enviará:');
    console.log(JSON.stringify(requestBody, null, 2));
    console.log('=====================================');
    
    const response = await axios.post(`${API_BASE_URL}/messages/send-test`, {
      phoneNumber,
      templateName
    });
    
    console.log('✅ === FRONTEND: RESPUESTA RECIBIDA (PRUEBA) ===');
    console.log('📊 Status:', response.status);
    console.log('📦 Response Data:');
    console.log(JSON.stringify(response.data, null, 2));
    console.log('=====================================');
    
    return { 
      success: response.data.success,
      messageId: response.data.messageId,
      diagnostics: response.data.diagnostics,
      whatsappResponse: response.data.whatsappResponse
    };
  } catch (error: any) {
    console.error('Error sending test template message:', error);
    
    console.log('❌ === FRONTEND: ERROR DETALLADO (PRUEBA) ===');
    console.log('🚨 Error completo:', error);
    console.log('📊 Response Status:', error.response?.status);
    console.log('📦 Response Data:');
    console.log(JSON.stringify(error.response?.data, null, 2));
    console.log('🔗 Request URL:', error.config?.url);
    console.log('📤 Request Data:', error.config?.data);
    console.log('==================================');
    
    // Extract detailed error message from server response
    let errorMessage = 'Error desconocido';
    
    if (error.response?.data?.error) {
      errorMessage = error.response.data.error;
    } else if (error.response?.data?.details) {
      errorMessage = error.response.data.details;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    console.log('📱 Error detallado:', errorMessage);
    return { success: false, error: errorMessage };
  }
};

export const sendTemplateMessage = async (phoneNumber: string, templateName: string, databases?: string[]): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('🚀 === FRONTEND: ENVIANDO MENSAJE ===');
    console.log('📱 Número:', phoneNumber);
    console.log('📋 Plantilla:', templateName);
    console.log('🗄️ Bases de Datos:', databases);
    console.log('🌐 URL del API:', `${API_BASE_URL}/messages/send`);
    
    const requestBody = {
      phoneNumber,
      templateName,
      databases
    };
    
    console.log('📦 Request Body que se enviará:');
    console.log(JSON.stringify(requestBody, null, 2));
    console.log('=====================================');
    
    const response = await axios.post(`${API_BASE_URL}/messages/send`, {
      phoneNumber,
      templateName,
      databases
    });
    
    console.log('✅ === FRONTEND: RESPUESTA RECIBIDA ===');
    console.log('📊 Status:', response.status);
    console.log('📦 Response Data:');
    console.log(JSON.stringify(response.data, null, 2));
    console.log('=====================================');
    
    return { success: response.data.success };
  } catch (error: any) {
    console.error('Error sending template message:', error);
    
    console.log('❌ === FRONTEND: ERROR DETALLADO ===');
    console.log('🚨 Error completo:', error);
    console.log('📊 Response Status:', error.response?.status);
    console.log('📦 Response Data:');
    console.log(JSON.stringify(error.response?.data, null, 2));
    console.log('🔗 Request URL:', error.config?.url);
    console.log('📤 Request Data:', error.config?.data);
    console.log('==================================');
    
    // Extract detailed error message from server response
    let errorMessage = 'Error desconocido';
    
    if (error.response?.data?.error) {
      errorMessage = error.response.data.error;
    } else if (error.response?.data?.details) {
      errorMessage = error.response.data.details;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    console.log('📱 Error detallado:', errorMessage);
    return { success: false, error: errorMessage };
  }
};

export const markMessageSent = async (phoneNumber: string, databases?: string[], templateName?: string): Promise<boolean> => {
  try {
    console.log('🎯 === MARCANDO COMO ENVIADO (NUEVA ESTRATEGIA BD4) ===');
    console.log('📱 Número:', phoneNumber);
    console.log('📋 Plantilla:', templateName);
    console.log('🗄️ Bases de Datos (ignoradas):', databases);
    console.log('🎯 Estrategia: Centralizar en BD4');
    console.log('===============================================');
    
    const response = await axios.post(`${API_BASE_URL}/users/mark-sent`, {
      phoneNumber,
      databases,      // Se envía pero se ignora en el backend
      templateName    // ⭐ NUEVO: Nombre de la plantilla enviada
    });
    
    console.log('✅ Respuesta BD4:', response.data);
    return response.data.success;
  } catch (error) {
    console.error('❌ Error marking message as sent:', error);
    return false;
  }
};

// Campaign API functions
export const fetchCampaigns = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/campaigns`);
    return response.data;
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return [];
  }
};

export const fetchCampaignDetails = async (campaignId: string) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/campaigns/${campaignId}/details`);
    return response.data;
  } catch (error) {
    console.error('Error fetching campaign details:', error);
    return null;
  }
};

export const createCampaign = async (name: string, templateName: string, templateLanguage: string, databases: string[]) => {
  try {
    console.log('🎯 === FRONTEND: CREANDO CAMPAÑA ===');
    console.log('📋 Campaign name:', name);
    console.log('📋 Template name:', templateName);
    console.log('🌍 Template language:', templateLanguage);
    console.log('🗄️ Databases:', databases);
    console.log('🌐 API URL:', `${API_BASE_URL}/campaigns`);
    
    const requestData = {
      name,
      templateName,
      templateLanguage,
      databases
    };
    console.log('📦 Request data:', JSON.stringify(requestData, null, 2));
    
    const response = await axios.post(`${API_BASE_URL}/campaigns`, requestData);
    
    console.log('✅ Campaign created successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ === ERROR CREATING CAMPAIGN ===');
    console.error('📄 Error details:', error);
    
    if (error.response) {
      console.error('📊 Response status:', error.response.status);
      console.error('📦 Response data:', error.response.data);
      console.error('📋 Response headers:', error.response.headers);
    } else if (error.request) {
      console.error('📡 Request made but no response:', error.request);
    } else {
      console.error('📄 Error message:', error.message);
    }
    
    return null;
  }
};

export const addUserToCampaign = async (campaignId: string, whatsapp: string, database: string, status: string, messageId?: string, error?: string) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/campaigns/${campaignId}/add-user`, {
      whatsapp,
      database,
      status,
      messageId,
      error
    });
    return response.data.success;
  } catch (error) {
    console.error('Error adding user to campaign:', error);
    return false;
  }
};

export const completeCampaign = async (campaignId: string) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/campaigns/${campaignId}/complete`);
    return response.data.success;
  } catch (error) {
    console.error('Error completing campaign:', error);
    return false;
  }
};