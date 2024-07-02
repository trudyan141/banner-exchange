
import { useEffect, useState } from 'react';
import styles from './BEC.module.scss';
function BEC({ width, height, walletAddress, imgUrl, externalLink }: any) {
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
  const [bannerLink, setBannerLink] = useState('');
  /***
   * FUNCTIONS
   */
  const initBannerLink = () => {
    const rs = `${externalLink}?walletAddress=${walletAddress}`;
    setBannerLink(rs);
  }
  useEffect(() => {
    initBannerLink();
  }, []);
  return (
    <div className={styles.becComponent}>
      {/* <button onClick={emitEvent}> Emit event  </button> */}
      <div className="banner-exchange-code" style={{ width: width + 'px', height: height + 'px'}}> 
        <a href={bannerLink} target="_blank">  
          <div className="banner-image">  
              <img src={imgUrl} alt="banner" />
          </div>
        </a>
      </div>
    </div>
  );
}

export default BEC;
