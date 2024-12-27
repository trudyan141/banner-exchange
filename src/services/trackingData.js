import { v4 as uuidv4 } from 'uuid';
import backendService from './backend/backend.service';
const _encodeURL = (url) => {
  return encodeURIComponent(url);
}
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
    sessionId = uuidv4();
    
    // Store it in sessionStorage
    sessionStorage.setItem('dmtp_session_id', sessionId);
  }
  return sessionId;
}
const _generateImpressionId =  () => {
  try { 
    let uuid = uuidv4();
     sessionStorage.setItem('dmtp_impression_id', uuid);
    return uuid;
  }catch (error) {
    console.log("🚀 ~ callImpressionApi ~ error:", error)
  }
}
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
 }
 const _getSdkAppUrl = () => {
  const currentScript = getCurrentScript();
  const scriptUrl = currentScript?.src;
  if (scriptUrl) {
    const url = new URL(scriptUrl);
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
}
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
      }
      const rs = await backendService.callImpress(params);
      
    } catch (error) {
      console.log("🚀 ~ callImpressApi ~ error:", error)
      throw error;
      
    } 
  }
const onTracking = async () => {
  try {
    const session_id = _initSessionStorage();
    console.log("🚀 ~ onTracking ~ session_id:", session_id)
    const impression_id = _generateImpressionId();
    const telegram_user_id = await _getTelegramUserId();
    const wallet_address = _getWalletAddressSrc();
    const sdkAppUrl = _getSdkAppUrl(); // add to sessionStorage 

    const rs = await _callImpressApi(wallet_address, telegram_user_id, impression_id, session_id);
    return rs;
  }catch (error) {
    console.log("🚀 ~ trackingData ~ error:", error)
    return null;
  }
}
const trackingData = {
  onTracking
}
export default trackingData