import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Transfer from './pages/Transfer';
import CreateAccount from './pages/CreateAccount';
import Register from './pages/Register'; 
import Settings from './pages/Settings'; 
import UpdateAccount from './pages/UpdateAccount';
import { LoadingProvider } from './context/LoadingContext'; 

function App() {
  return (
    <BrowserRouter>
      <LoadingProvider>
      
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/create-account" element={<CreateAccount />} />
          <Route path="/transfer" element={<Transfer />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/update-account" element={<UpdateAccount />} />
        </Routes>

      </LoadingProvider>
    </BrowserRouter>
  );
}

export default App;