import r2wc from "@r2wc/react-to-web-component";
import BEC from './components/BEC';
import './index.css';
import { reportWebVitals } from './reportWebVitals';

const becWidget = r2wc(BEC, { props: { width : 'string', height : 'string', walletAddress : 'string', imgUrl : 'string', externalLink : 'string' } });

customElements.define("banner-exchange-code", becWidget);

// const root = ReactDOM.createRoot(
//   document.getElementById('root') as HTMLElement,
// );
// root.render(
//   <React.StrictMode>
//     <App />
//   </React.StrictMode>,
// );

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
