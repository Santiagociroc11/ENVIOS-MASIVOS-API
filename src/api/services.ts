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

export const fetchFilteredUsers = async (databases?: string[], page: number = 1, limit: number = 50): Promise<{ users: User[]; database: string; collection: string; count: number; pagination?: any }> => {
  try {
    let params = new URLSearchParams();
    if (databases && databases.length > 0) {
      params.append('databases', databases.join(','));
    }
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    
    const response = await axios.get(`${API_BASE_URL}/users/pending${params}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching users:', error);
    return { users: [], database: '', collection: '', count: 0, pagination: null };
  }
};

export const fetchEstados = async (databases?: string[]): Promise<string[]> => {
  try {
    const params = databases && databases.length > 0 ? `?databases=${databases.join(',')}` : '';
    const response = await axios.get(`${API_BASE_URL}/users/estados${params}`);
    return response.data.estados || [];
  } catch (error) {
    console.error('Error fetching estados:', error);
    return [];
  }
};

export const fetchMedios = async (databases?: string[]): Promise<string[]> => {
  try {
    const params = databases && databases.length > 0 ? `?databases=${databases.join(',')}` : '';
    const response = await axios.get(`${API_BASE_URL}/users/medios${params}`);
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