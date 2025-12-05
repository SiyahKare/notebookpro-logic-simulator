import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { settingsAPI } from '../services/api';

interface CurrencyContextType {
  exchangeRate: number;
  shippingCost: number;
  minFreeShipping: number;
  vatRate: number;
  isLoading: boolean;
  setExchangeRate: (rate: number) => Promise<void>;
  refreshSettings: () => Promise<void>;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Default değerler
  const [exchangeRate, setExchangeRateState] = useState<number>(35.00);
  const [shippingCost, setShippingCost] = useState<number>(50);
  const [minFreeShipping, setMinFreeShipping] = useState<number>(500);
  const [vatRate, setVatRate] = useState<number>(0.20);
  const [isLoading, setIsLoading] = useState(true);

  // Ayarları yükle
  const refreshSettings = useCallback(async () => {
    setIsLoading(true);
    
    try {
      const response = await settingsAPI.getAll();
      
      if (response.success && response.data?.settings) {
        const settings = response.data.settings;
        
        // Settings'den değerleri çıkar
        settings.forEach((setting: { key: string; value: string }) => {
          switch (setting.key) {
            case 'exchange_rate_usd':
              setExchangeRateState(parseFloat(setting.value));
              break;
            case 'shipping_cost':
              setShippingCost(parseFloat(setting.value));
              break;
            case 'min_free_shipping':
              setMinFreeShipping(parseFloat(setting.value));
              break;
            case 'vat_rate':
              setVatRate(parseFloat(setting.value));
              break;
          }
        });
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
      // Default değerleri kullan
    } finally {
      setIsLoading(false);
    }
  }, []);

  // İlk yüklemede ayarları çek
  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  // Exchange rate güncelleme
  const setExchangeRate = async (rate: number) => {
    try {
      await settingsAPI.update('exchange_rate_usd', rate.toString(), 'number');
      setExchangeRateState(rate);
    } catch (err) {
      console.error('Failed to update exchange rate:', err);
      // Yine de local olarak güncelle
      setExchangeRateState(rate);
    }
  };

  return (
    <CurrencyContext.Provider value={{ 
      exchangeRate, 
      shippingCost,
      minFreeShipping,
      vatRate,
      isLoading,
      setExchangeRate,
      refreshSettings,
    }}>
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
