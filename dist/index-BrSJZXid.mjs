import './index.css';const reportWebVitals = (onPerfEntry) => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('./web-vitals-ChKu2BZI.mjs').then(({ onCLS, onFID, onFCP, onLCP, onTTFB }) => {
      onCLS(onPerfEntry);
      onFID(onPerfEntry);
      onFCP(onPerfEntry);
      onLCP(onPerfEntry);
      onTTFB(onPerfEntry);
    });
  }
};

/**
 * Convert array of 16 byte values to UUID string format of the form:
 * XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
 */
var byteToHex = [];
for (var i = 0; i < 256; ++i) {
  byteToHex.push((i + 0x100).toString(16).slice(1));
}
function unsafeStringify(arr, offset = 0) {
  // Note: Be careful editing this code!  It's been tuned for performance
  // and works in ways you may not expect. See https://github.com/uuidjs/uuid/pull/434
  //
  // Note to future-self: No, you can't remove the `toLowerCase()` call.
  // REF: https://github.com/uuidjs/uuid/pull/677#issuecomment-1757351351
  return (byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + '-' + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + '-' + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + '-' + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + '-' + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]]).toLowerCase();
}

// Unique ID creation requires a high quality random # generator. In the browser we therefore
// require the crypto API and do not support built-in fallback to lower quality random number
// generators (like Math.random()).

var getRandomValues;
var rnds8 = new Uint8Array(16);
function rng() {
  // lazy load so that environments that need to polyfill have a chance to do so
  if (!getRandomValues) {
    // getRandomValues needs to be invoked in a context where "this" is a Crypto implementation.
    getRandomValues = typeof crypto !== 'undefined' && crypto.getRandomValues && crypto.getRandomValues.bind(crypto);
    if (!getRandomValues) {
      throw new Error('crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported');
    }
  }
  return getRandomValues(rnds8);
}

var randomUUID = typeof crypto !== 'undefined' && crypto.randomUUID && crypto.randomUUID.bind(crypto);
const native = {
  randomUUID
};

function v4(options, buf, offset) {
  if (native.randomUUID && !buf && !options) {
    return native.randomUUID();
  }
  options = options || {};
  var rnds = options.random || (options.rng || rng)();

  // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`
  rnds[6] = rnds[6] & 0x0f | 0x40;
  rnds[8] = rnds[8] & 0x3f | 0x80;

  // Copy bytes to buffer, if provided
  if (buf) {
    offset = offset || 0;
    for (var i = 0; i < 16; ++i) {
      buf[offset + i] = rnds[i];
    }
    return buf;
  }
  return unsafeStringify(rnds);
}

var define_process_env_default = { VITE_APP_NODE_ENV: "development", VITE_APP_BACKEND_API_URL: "https://click-dev.apps-network.net" };
const BACKEND_API_URL = define_process_env_default.VITE_APP_BACKEND_API_URL ;
console.log("🚀 ~ BACKEND_API_URL:", BACKEND_API_URL);

// utils/http.js
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

const URL$1 = BACKEND_API_URL;
const URLs = {
  getInventories: (wa) => `${URL$1}/banners/inventories?wa=${wa}`,
  getAds: `${URL$1}/banners/ads`,
  callImpress: `${URL$1}/banners/impress`,
  confirmConversion: `${URL$1}/banners/events`,
  checkUserConversion: `${URL$1}/banners/events`,
};
const getAds = async (inventory_id, telegramUserId) => {
  try {
    let params = { inventory_id};
    if (telegramUserId) {
      params = { ...params, tui: telegramUserId};
    }
    let result = await http(URLs.getAds, { params: params, method: 'GET' });
    return result;
  }catch(error){
    console.log(error,'error=>getAds');
    throw error
  }
};


const getInventories = async (walletAddress) => {
  try{
    let result = await http(URLs.getInventories(walletAddress),  {  method: 'GET' });
    return result;
  }catch(error){
    console.log(error,'error=>getInventories');
    throw error
  }
};
const callImpress = async (params) => {
  try{
    let result = await http(URLs.callImpress,  {  params: params, method: 'GET' });
    return result;
  }catch(error){
    console.log(error,'error=>callImpress');
    throw error
  }
};

const confirmConversion = async (params) => {
  try{
    let result = await http(URLs.confirmConversion,  { method: 'POST', body: params });
    return result;
  }catch(error){
    console.log(error,'error=>confirmConversion');  
    throw error
  }
};
const checkUserConversion = async (params) => {
  try{
    let result = await http(URLs.checkUserConversion, {params: params, method: 'GET' });
    return result;
  }catch(error){
    console.log(error,'error=>checkUserConversion');
    throw error
  }
};
const service = { getAds, getInventories, callImpress,confirmConversion, checkUserConversion };

const _encodeURL = (url) => {
  return encodeURIComponent(url);
};
const getCurrentScript = () => {
  const scriptElements = document.getElementsByTagName('script');
  for (let script of scriptElements) {
    if (script.src.includes('bec.js')) {
      return script;
    }
  }
  return null;
};
const _initSessionStorage = () => {
  // Check if a session ID already exists
  let sessionId = sessionStorage.getItem('dmtp_session_id');

  if (!sessionId) {
    // Generate a new session ID using uuid
    sessionId = v4();
    
    // Store it in sessionStorage
    sessionStorage.setItem('dmtp_session_id', sessionId);
  }
  return sessionId;
};
const _generateImpressionId =  () => {
  try { 
    let uuid = v4();
     sessionStorage.setItem('dmtp_impression_id', uuid);
    return uuid;
  }catch (error) {
    console.log("🚀 ~ callImpressionApi ~ error:", error);
  }
};
const _getTelegramUserId = () => {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = "https://telegram.org/js/telegram-web-app.js";
    script.async = true;

    // Handle script loading success
    script.onload = () => {
      const telegram = window.Telegram;
      if (telegram && telegram.WebApp) {
        telegram.WebApp.ready();
        const userId = telegram.WebApp?.initDataUnsafe?.user?.id || '';
        sessionStorage.setItem('dmtp_telegram_user_id', userId);
        resolve(userId || ''); // Resolve with the user ID
      } else {
        console.error('Telegram Web App SDK is not available');
        resolve(''); // Resolve with an empty string if not available
        sessionStorage.setItem('dmtp_telegram_user_id', '');
      }
    };

    // Handle script loading error
    script.onerror = () => {
      console.error('Failed to load the Telegram Web App SDK');
      resolve(''); // Resolve with an empty string on error
      sessionStorage.setItem('dmtp_telegram_user_id', '');
    };

    document?.body?.appendChild(script);
  });
};
 const _getWalletAddressSrc = () => {
    const currentScript = getCurrentScript();
    const scriptUrl = currentScript?.src;
    let urlEncode;
   if (scriptUrl) {
     const url = new URL(scriptUrl);
     const params = new URLSearchParams(url.search);
     const walletAddressSrc = params.get('walletAddress');
     urlEncode = _encodeURL(walletAddressSrc);
     sessionStorage.setItem('dmtp_wallet_address', urlEncode);
     return urlEncode;
   } else { 
    sessionStorage.setItem('dmtp_wallet_address', '');
    return '';
   }
 };
 const _getSdkAppUrl = () => {
  const currentScript = getCurrentScript();
  const scriptUrl = currentScript?.src;
  if (scriptUrl) {
    new URL(scriptUrl);
    let sdkAppUrl = 'https://sdk-web-app.dmtp.tech';
    // Check script source and return appropriate URL
    // if (url.origin.includes('tma-demo.dmtp.tech')) {
    //   sdkAppUrl = 'https://sdk-web-app-dev.dmtp.tech/';
    // } else if (url.origin.includes('bec.dmtp.tech')) {
    //   sdkAppUrl = 'https://sdk-web-app.dmtp.tech/';
    // }else{
    //   sdkAppUrl = 'https://sdk-web-app.dmtp.tech/';
    // }
    
    sessionStorage.setItem('dmtp_sdk_app_url', sdkAppUrl);
  } else { 
    sessionStorage.setItem('dmtp_sdk_app_url', '');
    return '';
  }
};
 const _callImpressApi = async (wallet_address, telegram_user_id, impression_id, session_id) => {
    try {
      
      const lang = navigator.language || (navigator.languages && navigator.languages[0]);
      let params = {
        id: impression_id,
        wa: wallet_address,
        lang: lang,
        utm_source: '',
        utm_medium: '',
        utm_campaign: '',
        session_id: session_id || '',
        tui:telegram_user_id || ''
      };
      const rs = await service.callImpress(params);
      
    } catch (error) {
      console.log("🚀 ~ callImpressApi ~ error:", error);
      throw error;
      
    } 
  };
const onTracking = async () => {
  try {
    const session_id = _initSessionStorage();
    console.log("🚀 ~ onTracking ~ session_id:", session_id);
    const impression_id = _generateImpressionId();
    const telegram_user_id = await _getTelegramUserId();
    const wallet_address = _getWalletAddressSrc();
    const sdkAppUrl = _getSdkAppUrl(); // add to sessionStorage 

    const rs = await _callImpressApi(wallet_address, telegram_user_id, impression_id, session_id);
    return rs;
  }catch (error) {
    console.log("🚀 ~ trackingData ~ error:", error);
    return null;
  }
};
const trackingData = {
  onTracking
};

const onLoadForBEC = async () => {
  try {
    console.log("🚀 ~ onLoad ~ onLoad:", onLoadForBEC);
    const rs = await trackingData.onTracking();
    const BEC = await import('./BEC-aQZema7t.mjs');
    const becInstance = new BEC.default();
    console.log("🚀 ~ onLoad ~ becInstance:", becInstance);
    if (typeof window !== 'undefined') {
      window.TE = becInstance;
      console.log("🚀 ~ onLoad ~ window.TE:", window.TE);
    }
  }
  catch (error) {
    console.log("🚀 ~ Onload ~ error:", error);
  }
};

// Auto-execute when script loads
if (typeof window !== 'undefined') {
  // Use requestAnimationFrame to ensure DOM is ready
  requestAnimationFrame(() => {
    onLoadForBEC();
  });
}



// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

export { BACKEND_API_URL as B, service as s };
