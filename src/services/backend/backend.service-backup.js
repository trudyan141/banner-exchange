import { BACKEND_API_URL } from '../../constants/backend';
import http from './http';
const URL = BACKEND_API_URL
const URLs = {
  getInventories: (wa) => `${URL}/banners/inventories?wa=${wa}`,
  getAds: `${URL}/banners/ads`,
};
const getAds = async (inventory_id, telegramUserId) => {
  try {
    let params = { inventory_id }
    if (telegramUserId) {
      params = { ...params, tui: telegramUserId }
    }
    let result = await http.get(URLs.getAds,{ params: params });
    return result?.data;
  }catch(error){
    console.log(error,'error=>getAds');
    throw error
  }
};


const getInventories = async (walletAddress) => {
  try{
    let result = await http.get(URLs.getInventories(walletAddress));
    return result?.data;
  }catch(error){
    console.log(error,'error=>getInventories');
    throw error
  }
};
const service = { getAds, getInventories };
export default service;
