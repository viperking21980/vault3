import { Toaster } from 'react-hot-toast';
import { useWallet } from './hooks/useWallet';
import Landing from './components/Landing';
import Dashboard from './components/Dashboard';

function App() {
  const { address, isConnecting, connect, disconnect } = useWallet();

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#18181b',
            color: '#fff',
            borderRadius: '12px',
            padding: '12px 16px',
            fontSize: '14px',
            fontWeight: 500,
          },
          success: {
            iconTheme: {
              primary: '#22c55e',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      {address ? (
        <Dashboard address={address} onDisconnect={disconnect} />
      ) : (
        <Landing onConnect={connect} isConnecting={isConnecting} />
      )}
    </>
  );
}

export default App;
