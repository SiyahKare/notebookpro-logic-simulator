import React, { createContext, useState, useContext, ReactNode } from 'react';

interface CurrencyContextType {
  exchangeRate: number;
  setExchangeRate: (rate: number) => void;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Kural 1: Varsayılan Kur 35.00 TL
  const [exchangeRate, setExchangeRate] = useState<number>(35.00);

  return (
    <CurrencyContext.Provider value={{ exchangeRate, setExchangeRate }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};