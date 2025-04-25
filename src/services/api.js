// client/src/services/api.js
import axios from 'axios';


// const BASE_URL = 'http://localhost:5000/api';
const BASE_URL = 'https://scheduleserver-42qj.onrender.com/api/'; // Serverin IP ünvanı ilə dəyişdirin


// Axios instance yaradaq
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// İstifadəçi ilə bağlı API sorğuları
export const userService = {
  registerUser: async (userData) => {
    try {
      const response = await api.post('/users', userData);
      return response.data;
    } catch (error) {
      console.error('Error registering user:', error);
      throw error;
    }
  },
  
  updateDeviceToken: async (email, deviceToken) => {
    try {
      const response = await api.put('/users/device-token', { email, deviceToken });
      return response.data;
    } catch (error) {
      console.error('Error updating device token:', error);
      throw error;
    }
  }
};

// Dərs cədvəli ilə bağlı API sorğuları
export const scheduleService = {
  getCurrentDaySchedule: async () => {
    try {
      const response = await api.get('/schedules/current');
      return response.data;
    } catch (error) {
      console.error('Error fetching current day schedule:', error);
      throw error;
    }
  },
  
  getScheduleByDayAndWeekType: async (weekType, day) => {
    try {
      const response = await api.get(`/schedules/${weekType}/${day}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching schedule by day and week type:', error);
      throw error;
    }
  },
  
  getAllSchedules: async () => {
    try {
      const response = await api.get('/schedules');
      return response.data;
    } catch (error) {
      console.error('Error fetching all schedules:', error);
      throw error;
    }
  }
};

export default api;