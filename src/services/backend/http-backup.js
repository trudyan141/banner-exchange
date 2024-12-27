// utils/http.js
import axios from 'axios';
import { BACKEND_API_URL } from '../../constants/backend';
const BASE_URL = BACKEND_API_URL;

const http = axios.create({
  baseURL: BASE_URL,
  timeout: 7200000, // 2 hours
});

// Function to get auth object from  in localStorage
const getAuth = () => {
  const sdkDmtp = JSON.parse(localStorage.getItem('banner_exchange'));
  return sdkDmtp ? sdkDmtp.auth : null;
};

// Request interceptor to add access token to headers
http.interceptors.request.use(
  (config) => {
    const auth = getAuth();
    if (auth?.access_token) {
      config.headers.Authorization = `Bearer ${auth.access_token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token expiration and refresh
http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const auth = getAuth();

    if (error.response && error.response.status === 401 && auth?.refresh_token) {
      try {
         console.error('Token refresh failed:', error);
        localStorage.removeItem('');
        window.location.href = '/'; // 
        // const { data } = await axios.post(`${BASE_URL}/auth/refresh-token`, {
        //   refresh_token: auth.refresh_token,
        // });

        // const newAuth = {
        //   access_token: data.access_token,
        //   refresh_token: data.refresh_token,
        // };

        // // Update  object in localStorage
        // const sdkDmtp = JSON.parse(localStorage.getItem('')) || {};
        // sdkDmtp.auth = newAuth;
        // localStorage.setItem('', JSON.stringify(sdkDmtp));

        // originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
        // return http(originalRequest);
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        localStorage.removeItem('');
        window.location.href = '/'; // 
      }
    }

    return Promise.reject(error);
  }
);

export default http;