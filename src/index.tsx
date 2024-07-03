//import r2wc from "@r2wc/react-to-web-component";
import React from 'react';
import ReactDOM from 'react-dom/client';
import BEC from './components/BEC';
import './index.css';
import { reportWebVitals } from './reportWebVitals';
const renderBanner = () => {
  const bannerEle = document.getElementById('exchangeBanner');
  console.log("🚀 ~ document:", document)
  console.log("🚀 ~ bannerEle:", bannerEle)

  if (bannerEle) {
    const root = ReactDOM.createRoot(
      bannerEle as HTMLElement,
    );
    root.render(
      <React.StrictMode>
        <BEC />
      </React.StrictMode>,
    );
  }
}


document.addEventListener('DOMContentLoaded', renderBanner);
// NOT USE THIS
// create web component
//const becWidget = r2wc(BEC, { props: { width : 'string', height : 'string', walletAddress : 'string', imgUrl : 'string', externalLink : 'string' } });
//customElements.define("banner-exchange-code", becWidget);


// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
