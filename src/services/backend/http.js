// utils/http.js
import { BACKEND_API_URL } from '../../constants/backend';
const BASE_URL = BACKEND_API_URL;
// Function to get auth object from localStorage
const getAuth = () => {
  const sdkDmtp = JSON.parse(localStorage.getItem('banner_exchange'));
  return sdkDmtp ? sdkDmtp.auth : null;
};
// Function to build query string from params object, handling arrays
const buildQueryString = (params) => {
  if (!params || typeof params !== 'object') return '';
  return Object.keys(params)
    .map(key => {
      const value = params[key];
      if (Array.isArray(value)) {
        // Join array values as comma-separated string
        return value.map(val => `${encodeURIComponent(key)}=${encodeURIComponent(val)}`).join('&');
      }
      return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
    })
    .join('&');
};
// Function to handle HTTP requests
const http = async (url, options = {}) => {
  const auth = getAuth();

  // Build query string if params are provided
  const queryString = options.params ? `?${buildQueryString(options.params)}` : '';

  // Set default headers
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add Authorization header if access token is available
  if (auth?.access_token) {
    headers.Authorization = `Bearer ${auth.access_token}`;
  }
  // Set up request options
  const requestOptions = {
    method: options.method || 'GET',
    headers: headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
    
  };

  try {
    const response = await fetch(`${url}${queryString}`, requestOptions);
    // const rs = await ((await fetch('https://click-dev.dmtp.tech/banners/inventories?wa=0:9167743a092d10c1f68622af5b4613505afdedeb3988324a1d2014c192ef593a', {
    //   method: 'GET',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Accept': 'application/json',
    //   },
    // })).json())
    if (!response.ok) {
      if (response.status === 401 && auth?.refresh_token) {
        // Handle token refresh
        try {
          console.error('Token refresh failed:', response);
          localStorage.removeItem('banner_exchange');
          window.location.href = '/'; // Redirect to login or another appropriate page

          // Uncomment the following lines if you handle token refresh
          // const refreshResponse = await fetch(`${BASE_URL}/auth/refresh-token`, {
          //   method: 'POST',
          //   headers: {
          //     'Content-Type': 'application/json',
          //   },
          //   body: JSON.stringify({ refresh_token: auth.refresh_token }),
          // });

          // if (refreshResponse.ok) {
          //   const data = await refreshResponse.json();
          //   const newAuth = {
          //     access_token: data.access_token,
          //     refresh_token: data.refresh_token,
          //   };

          //   // Update auth object in localStorage
          //   const sdkDmtp = JSON.parse(localStorage.getItem('banner_exchange')) || {};
          //   sdkDmtp.auth = newAuth;
          //   localStorage.setItem('banner_exchange', JSON.stringify(sdkDmtp));

          //   // Retry original request with new token
          //   return http(url, { ...options, headers: { ...headers, Authorization: `Bearer ${data.access_token}` } });
          // }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          localStorage.removeItem('banner_exchange');
          window.location.href = '/'; // Redirect to login or another appropriate page
        }
      }
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
   // Check Content-Type header
    const contentType = response.headers.get('Content-Type');

    // Determine how to parse the response based on Content-Type
    let result;
    if (contentType && contentType.includes('application/json')) {
      result = await response.json(); // Parse JSON if Content-Type is application/json
    } else {
      result = await response.text(); // Parse as text for other Content-Types
    }

    return result;
  } catch (error) {
    console.error('HTTP request failed:', error);
    throw error;
  }
  
};

export default http;