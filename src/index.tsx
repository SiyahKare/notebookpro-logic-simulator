import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { CurrencyProvider } from './context/CurrencyContext';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { RepairProvider } from './context/RepairContext';
import { ProductProvider } from './context/ProductContext';
import { OrderProvider } from './context/OrderContext';
import { NotificationProvider } from './context/NotificationContext';
import { ThemeProvider } from './context/ThemeContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <CurrencyProvider>
          <AuthProvider>
            <NotificationProvider>
              <ProductProvider>
                <RepairProvider>
                  <CartProvider>
                    <OrderProvider>
                      <App />
                    </OrderProvider>
                  </CartProvider>
                </RepairProvider>
              </ProductProvider>
            </NotificationProvider>
          </AuthProvider>
        </CurrencyProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);