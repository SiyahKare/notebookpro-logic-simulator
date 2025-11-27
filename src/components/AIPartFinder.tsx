
import React, { useState, useEffect } from 'react';
import { Product } from '../types';

interface AIPartFinderProps {
  onSearch: (query: string) => void;
  products: Product[];
}

const AIPartFinder: React.FC<AIPartFinderProps> = ({ onSearch, products }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    onSearch(query);
    
    if (query.length > 1) {
      // Smart Suggestion Logic
      const distinctModels = Array.from(new Set(
        products.flatMap(p => p.compatible_models)
      )) as string[];
      
      const matches = distinctModels
        .filter(m => m.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 3);
        
      setSuggestions(matches);
    } else {
      setSuggestions([]);
    }
  }, [query, products, onSearch]);

  return (
    <div className="w-full max-w-2xl relative group z-30">
      <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-orange-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
      <div className="relative bg-white rounded-xl shadow-xl flex items-center p-2 border border-slate-100">
        
        {/* AI Icon */}
        <div className="flex-shrink-0 w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center text-red-600 mr-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
        </div>

        <input
          autoFocus
          type="text"
          className="flex-grow bg-transparent outline-none text-slate-700 placeholder-slate-400 font-medium"
          placeholder="Yapay Zeka ile ara: 'Asus X550 batarya'..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        {query && (
          <button onClick={() => setQuery('')} className="p-2 text-slate-300 hover:text-red-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>

      {/* Smart Suggestions Dropdown */}
      {suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-slate-100 p-2 animate-in fade-in slide-in-from-top-2">
          <div className="text-[10px] uppercase tracking-wider text-slate-400 px-2 py-1 font-semibold">Uyumlu Modeller</div>
          {suggestions.map((s, i) => (
            <div 
              key={i} 
              className="px-2 py-2 hover:bg-red-50 rounded-lg cursor-pointer text-sm text-slate-600 flex items-center"
              onClick={() => setQuery(s)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-2 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
              </svg>
              {s}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AIPartFinder;
