import React, { useState, useEffect } from 'react';
import { mockProducts, mockUsers, mockRepairRecords } from './data/mockData';
import { calculateProductPrice, formatCurrency } from './utils/pricing';
import { generateWhatsAppLink } from './utils/whatsapp';
import { User, Product } from './types';

const App: React.FC = () => {
  const [exchangeRate, setExchangeRate] = useState<number>(34.20);
  const [selectedUser, setSelectedUser] = useState<User>(mockUsers[0]); // Default to Admin

  // Simulation Logic Wrapper
  const getPriceSimulation = (product: Product) => {
    const calculation = calculateProductPrice(product, selectedUser, exchangeRate);
    return calculation;
  };

  return (
    <div className="min-h-screen bg-slate-100 p-8 font-mono text-sm">
      <header className="mb-8 border-b border-slate-300 pb-4">
        <h1 className="text-3xl font-bold text-slate-800">NotebookPro <span className="text-blue-600">Backend Logic Sim</span></h1>
        <p className="text-slate-600 mt-2">System Architect View: Pricing Engine & Data Structures</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 1. Global Settings (Environment Simulation) */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold mb-4 text-indigo-700 border-b pb-2">1. Environment & Context</h2>
          
          <div className="mb-4">
            <label className="block text-slate-500 mb-1">Live USD/TL Rate</label>
            <input 
              type="number" 
              value={exchangeRate}
              onChange={(e) => setExchangeRate(Number(e.target.value))}
              className="w-full p-2 border rounded bg-slate-50"
              step="0.1"
            />
          </div>

          <div className="mb-4">
            <label className="block text-slate-500 mb-1">Simulate User Role</label>
            <select 
              className="w-full p-2 border rounded bg-slate-50"
              onChange={(e) => {
                const user = mockUsers.find(u => u.id === e.target.value);
                if (user) setSelectedUser(user);
              }}
              value={selectedUser.id}
            >
              {mockUsers.map(user => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.role} - {user.is_approved ? 'Approved' : 'Pending'})
                </option>
              ))}
            </select>
            <div className="mt-2 text-xs text-slate-400 bg-slate-800 p-2 rounded">
              <p>ID: {selectedUser.id}</p>
              <p>Role: {selectedUser.role}</p>
              <p>Approved: {selectedUser.is_approved.toString()}</p>
            </div>
          </div>
        </div>

        {/* 2. Pricing Engine Output */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 lg:col-span-2">
          <h2 className="text-lg font-bold mb-4 text-green-700 border-b pb-2">2. Pricing Engine Output (Psychological Pricing)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-slate-500 border-b">
                  <th className="p-2">Product Name</th>
                  <th className="p-2">Compatibility</th>
                  <th className="p-2">Base (USD)</th>
                  <th className="p-2">Raw (TL+VAT)</th>
                  <th className="p-2 bg-yellow-50 font-bold text-black">Final Label Price</th>
                  <th className="p-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {mockProducts.map(product => {
                  const pricing = getPriceSimulation(product);
                  return (
                    <tr key={product.id} className="border-b last:border-0 hover:bg-slate-50">
                      <td className="p-2 font-semibold">{product.name}</td>
                      <td className="p-2 text-xs text-slate-500 max-w-[150px] truncate" title={product.compatible_models.join(', ')}>
                        {product.compatible_models.length} models
                      </td>
                      <td className="p-2 text-slate-600">${product.price_usd}</td>
                      <td className="p-2 text-slate-400 line-through decoration-red-500">
                        {formatCurrency(pricing.rawTotalTL)}
                      </td>
                      <td className="p-2 bg-yellow-50 font-bold text-green-700 text-lg">
                        {formatCurrency(pricing.finalPriceTL)}
                      </td>
                      <td className="p-2">
                        <a 
                          href={generateWhatsAppLink('905551234567', `Hello, I am interested in ${product.name} (Code: ${product.id}). Price: ${pricing.finalPriceTL} TL`)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
                        >
                          WhatsApp
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-4 p-3 bg-blue-50 border-l-4 border-blue-500 text-xs text-blue-800">
            <strong>Algorithm Note:</strong> 
            {selectedUser.role === 'dealer' && selectedUser.is_approved 
              ? " Dealer Discount Applied (Before VAT/Conversion)" 
              : " Standard Customer Pricing"} 
            <br />
            Formula: [ (USD_Price - Discount) * Rate * 1.20 (VAT) ] → Rounded Up to nearest 10 → Subtract 0.10
          </div>
        </div>

        {/* 3. Data Structures (ReadOnly) */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 lg:col-span-3">
          <h2 className="text-lg font-bold mb-4 text-purple-700 border-b pb-2">3. Data Structures & Repair Records</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-bold text-slate-600 mb-2">Mock Repair Database</h3>
              <div className="bg-slate-900 text-slate-300 p-4 rounded text-xs h-48 overflow-y-auto font-mono">
                <pre>{JSON.stringify(mockRepairRecords, null, 2)}</pre>
              </div>
            </div>
            <div>
              <h3 className="font-bold text-slate-600 mb-2">Raw Product Data (Cross-Compatibility)</h3>
              <div className="bg-slate-900 text-slate-300 p-4 rounded text-xs h-48 overflow-y-auto font-mono">
                <pre>{JSON.stringify(mockProducts.map(p => ({ id: p.id, compat: p.compatible_models })), null, 2)}</pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;