import './index.css';
import { reportWebVitals } from './reportWebVitals';
import trackingData from './services/trackingData';

const onLoadForBEC = async () => {
  try {
    console.log("🚀 ~ onLoad ~ onLoad:", onLoadForBEC)
    const rs = await trackingData.onTracking();
    const BEC = await import('./BEC.js');
    const becInstance = new BEC.default();
    console.log("🚀 ~ onLoad ~ becInstance:", becInstance)
    if (typeof window !== 'undefined') {
      window.TE = becInstance;
      console.log("🚀 ~ onLoad ~ window.TE:", window.TE)
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
