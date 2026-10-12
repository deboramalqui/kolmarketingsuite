import {createRoot} from 'react-dom/client';
import { ConfirmProvider } from './components/ConfirmDialog';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(<ConfirmProvider><App /></ConfirmProvider>);
