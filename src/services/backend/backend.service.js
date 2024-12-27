import { BACKEND_API_URL } from '../../constants/backend';
import http from './http';
const URL = BACKEND_API_URL
const URLs = {
  getInventories: (wa) => `${URL}/banners/inventories?wa=${wa}`,
  getAds: `${URL}/banners/ads`,
  callImpress: `${URL}/banners/impress`,
  confirmConversion: `${URL}/banners/events`,
  checkUserConversion: `${URL}/banners/events`,
};
const getAds = async (inventory_id, telegramUserId) => {
  try {
    let params = { inventory_id};
    if (telegramUserId) {
      params = { ...params, tui: telegramUserId}
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
}
const service = { getAds, getInventories, callImpress,confirmConversion, checkUserConversion };
export default service;
