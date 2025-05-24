import axios from 'axios';
import { Template, User } from '../types';

const API_BASE_URL = '/api';

export const fetchTemplates = async (): Promise<Template[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/templates`);
    return response.data;
  } catch (error) {
    console.error('Error fetching templates:', error);
    return [];
  }
};

export const fetchFilteredUsers = async (): Promise<User[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/users/pending`);
    return response.data;
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
};

export const sendTemplateMessage = async (phoneNumber: string, templateName: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/messages/send`, {
      phoneNumber,
      templateName
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

export const markMessageSent = async (phoneNumber: string): Promise<boolean> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/users/mark-sent`, {
      phoneNumber
    });
    return response.data.success;
  } catch (error) {
    console.error('Error marking message as sent:', error);
    return false;
  }
};