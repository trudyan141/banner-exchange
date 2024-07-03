
import { useCallback, useEffect, useState } from 'react';
import styles from './BEC.module.scss';
function BEC({ }: any) {
  /***
   * Emit event
   */
  const emitEvent = () => {
    const message = 'event from banner';
    const event = new CustomEvent('becEvent', { detail: message });
    document.dispatchEvent(event);
  }
  /***
   * STATES
   */
  const [walletAddress, setWalletAddress] = useState<any>(null);
  const [banners, setBanners] = useState<any>([]);

  /***
   * FUNCTIONS
   */
  const getCurrentScript = () => {
  const scriptElements: any = document.getElementsByTagName('script');
  for (let script of scriptElements) {
    if (script.src.includes('bec.js')) {
      return script;
    }
  }
  return null;
};
  const getWalletAddressSrc = useCallback(() => {
    const currentScript = getCurrentScript();
    const scriptUrl = currentScript.src;
    if (scriptUrl) {
      const url = new URL(scriptUrl);
      const params = new URLSearchParams(url.search);
      const walletAddressSrc = params.get('walletAddress');
      console.log("🚀 ~ getWalletAddressSrc ~ walletAddressSrc:", walletAddressSrc)
      setWalletAddress(walletAddressSrc);
    }
  }, [])
  const initBanners = useCallback(() => {
    try {
      // TODO call API here
      let rs = [];
      for (let index = 0; index < 10; index++) {
        const element = {
          imgUrl: 'https://i.ibb.co/5WbrnBC/te-320x50.png',
          bannerLink: 'https://sdk-web-app-dev.dmtp.tech/',
        }
        rs.push(element);
      }
      setBanners(rs);
    } catch (error) {
      console.log('error', error);
    }
  },[])
  const initOptions = useCallback(() => {
    getWalletAddressSrc();
    initBanners();
  },[getWalletAddressSrc, initBanners])
  /**
   * USE EFFECTS
   */
  useEffect(() => {
    initOptions();
  }, [initOptions]);
  return (
    <div className={styles.becComponent}>
      {/* <button onClick={emitEvent}> Emit event  </button> */}
      {banners.map((banner: any, index: any) => {
        const { imgUrl, bannerLink } = banner;
        return (
          <div className="banner-exchange-code"> 
            <div className="banner-image">  
              <a href={bannerLink} target="_blank">  
                <img src={imgUrl} alt="banner" />
              </a>
            </div>
          </div>
        );
      })}
      
    </div>
  );
}

export default BEC;
