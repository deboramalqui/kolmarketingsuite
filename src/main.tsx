import {createRoot} from 'react-dom/client';
import { ConfirmProvider } from './components/ConfirmDialog';
import { AuthProvider } from './lib/auth';
import { LoginScreen } from './components/LoginScreen';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(<ConfirmProvider>
    <AuthProvider>
      {(auth) =>
        auth.loading ? (
          <div className="min-h-screen bg-[#161418] text-[#C9C3BE] flex items-center justify-center text-[16px]">Cargando…</div>
        ) : auth.error ? (
          <LoginScreen error={`No se pudo comprobar tu acceso: ${auth.error}.`} />
        ) : auth.authEnabled && !auth.user ? (
          <LoginScreen />
        ) : (
          <App />
        )
      }
    </AuthProvider>
  </ConfirmProvider>);
