import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const searchCustomers = async (query: string) => {
  const response = await api.get('/customers', { params: { q: query } });
  return response.data;
};

export const getCustomer360 = async (customerId: string) => {
  const response = await api.get(`/customer/${customerId}`);
  return response.data;
};

export const getCustomerAlerts = async (customerId: string) => {
  const response = await api.get(`/customer/${customerId}/alerts`);
  return response.data;
};

export const getCustomerRecommendations = async (customerId: string) => {
  const response = await api.get(`/customer/${customerId}/recommendations`);
  return response.data;
};

export const getCustomerTimeline = async (customerId: string) => {
  const response = await api.get(`/customer/${customerId}/timeline`);
  return response.data;
};

export const getCustomerOpportunities = async (customerId: string) => {
  const response = await api.get(`/customer/${customerId}/opportunities`);
  return response.data;
};

export const getCustomerTickets = async (customerId: string) => {
  const response = await api.get(`/customer/${customerId}/tickets`);
  return response.data;
};

export const getCustomerInvoices = async (customerId: string) => {
  const response = await api.get(`/customer/${customerId}/invoices`);
  return response.data;
};

export const executeAction = async (actionId: string) => {
  const response = await api.post(`/actions/${actionId}/execute`);
  return response.data;
};

export const getDashboardSummary = async () => {
  const response = await api.get('/dashboard/summary');
  return response.data;
};

export const getSegmentRecommendations = async (filterType: 'health' | 'region', filterValue: string) => {
  const response = await api.get('/segment/recommendations', {
    params: { type: filterType, value: filterValue }
  });
  return response.data;
};

export const queryChatbot = async (query: string, history: any[]) => {
  const response = await api.post('/chatbot/query', { query, history });
  return response.data;
};

export const getAllCustomers = async () => {
  const response = await api.get('/customers');
  return response.data;
};
