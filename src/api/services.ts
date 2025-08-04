import axios from 'axios';
import { Template, User } from '../types';

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

export const sendTemplateMessage = async (phoneNumber: string, templateName: string, databases?: string[]): Promise<{ success: boolean; error?: string }> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/messages/send`, {
      phoneNumber,
      templateName,
      databases
    });
    return { success: response.data.success };
  } catch (error: any) {
    console.error('Error sending template message:', error);
    
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

export const markMessageSent = async (phoneNumber: string, databases?: string[]): Promise<boolean> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/users/mark-sent`, {
      phoneNumber,
      databases
    });
    return response.data.success;
  } catch (error) {
    console.error('Error marking message as sent:', error);
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
    const response = await axios.post(`${API_BASE_URL}/campaigns`, {
      name,
      templateName,
      templateLanguage,
      databases
    });
    return response.data;
  } catch (error) {
    console.error('Error creating campaign:', error);
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