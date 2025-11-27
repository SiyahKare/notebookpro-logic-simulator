
import React, { useState, useEffect, useRef } from 'react';
import { useRepair } from '../context/RepairContext';
import { useOrder } from '../context/OrderContext';
import { generateWhatsAppLink } from '../utils/whatsapp';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  isLink?: boolean;
}

const AIAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { repairRecords } = useRepair();
  const { orders } = useOrder();
  
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: 1, 
      text: "Merhaba! 👋 Ben NotebookPro Asistan. 'NB-2023-...' formatında servis kodu veya 'ORD-...' formatında sipariş numarası yazarsanız durumunu sorgulayabilirim.", 
      sender: 'bot' 
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;

    // 1. Add User Message
    const userMsg: Message = { id: Date.now(), text: input, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    const userInput = input;
    setInput('');
    setIsTyping(true);

    // 2. Simulate Processing Delay
    setTimeout(() => {
      let botResponse: Message = { id: Date.now() + 1, text: '', sender: 'bot' };
      
      // --- LOGIC ENGINE ---
      
      // Regex Patterns
      const repairPattern = /(NB-\d{4}-[A-Z0-9]+)/i;
      const orderPattern = /(ORD-\d+-\d+)/i;
      
      const repairMatch = userInput.match(repairPattern);
      const orderMatch = userInput.match(orderPattern);

      if (repairMatch) {
        // Search in Repair Context
        const code = repairMatch[0].toUpperCase();
        const record = repairRecords.find(r => r.tracking_code === code);
        
        if (record) {
          botResponse.text = `🔧 Servis Kaydı Bulundu:\nCihaz: ${record.device_brand} ${record.device_model}\nDurum: ${record.status.toUpperCase().replace('_', ' ')}\nArıza: ${record.issue_description}`;
        } else {
          botResponse.text = `❌ ${code} kodlu bir servis kaydı sistemde bulunamadı. Lütfen kodu kontrol ediniz.`;
        }

      } else if (orderMatch) {
        // Search in Order Context
        const orderId = orderMatch[0];
        const order = orders.find(o => o.id === orderId);

        if (order) {
          botResponse.text = `📦 Sipariş Bulundu:\nMüşteri: ${order.customerName}\nTutar: ${order.totalAmount.toFixed(2)} TL\nDurum: ${order.status}`;
        } else {
          botResponse.text = `❌ ${orderId} numaralı sipariş bulunamadı.`;
        }

      } else {
        // Fallback to Human Agent
        const waLink = generateWhatsAppLink('905551234567', `Merhaba, şu konuda destek istiyorum: ${userInput}`);
        botResponse.text = "Bu konuda tam bilgiye ulaşamadım. Sizi uzman müşteri temsilcimize aktarıyorum...";
        
        // Add Link Button Logic via a second message or handling text
        setMessages(prev => [...prev, botResponse]);
        
        setTimeout(() => {
            setMessages(prev => [...prev, { 
                id: Date.now() + 2, 
                text: "WhatsApp Destek Hattına Git", 
                sender: 'bot',
                isLink: true 
            }]);
            setIsTyping(false);
        }, 500);
        return;
      }

      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);

    }, 1200);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Chat Window */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300 flex flex-col max-h-[500px]">
          
          {/* Header */}
          <div className="bg-slate-900 p-4 flex justify-between items-center flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white text-xs font-bold">AI</div>
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-slate-900 rounded-full animate-pulse"></div>
              </div>
              <div>
                 <div className="text-white font-bold text-sm">NotebookPro Asistan</div>
                 <div className="text-[10px] text-slate-400">Çevrimiçi | Yanıt süresi: &lt;1dk</div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-grow bg-slate-50 p-4 overflow-y-auto h-80 scroll-smooth">
            {messages.map((msg) => (
              <div key={msg.id} className={`mb-3 flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                 {msg.isLink ? (
                     <a 
                        href={generateWhatsAppLink('905551234567')} 
                        target="_blank" 
                        rel="noreferrer"
                        className="bg-green-500 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-green-600 transition flex items-center gap-2 shadow-lg shadow-green-200"
                     >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                        {msg.text}
                     </a>
                 ) : (
                     <div className={`max-w-[80%] p-3 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap shadow-sm ${
                        msg.sender === 'user' 
                          ? 'bg-red-600 text-white rounded-tr-none' 
                          : 'bg-white text-slate-700 border border-slate-200 rounded-tl-none'
                     }`}>
                        {msg.text}
                     </div>
                 )}
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start mb-3">
                 <div className="bg-slate-200 p-3 rounded-2xl rounded-tl-none flex gap-1 items-center h-8 w-14 justify-center">
                    <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce delay-75"></div>
                    <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce delay-150"></div>
                 </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSend} className="p-3 border-t border-slate-100 bg-white flex gap-2">
            <input 
               type="text" 
               value={input}
               onChange={(e) => setInput(e.target.value)}
               placeholder="Mesajınızı yazın..." 
               className="flex-grow text-xs bg-slate-100 p-3 rounded-xl outline-none focus:ring-2 ring-red-500/20 border border-transparent focus:border-red-200 transition"
            />
            <button 
               type="submit"
               disabled={!input.trim() || isTyping}
               className="bg-slate-900 text-white p-3 rounded-xl hover:bg-red-600 disabled:opacity-50 disabled:hover:bg-slate-900 transition"
            >
               <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
               </svg>
            </button>
          </form>
        </div>
      )}

      {/* Floating Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center text-white transition-all transform duration-300 hover:scale-105 active:scale-95 z-50 ${
          isOpen ? 'bg-slate-800 rotate-90' : 'bg-red-600 shadow-red-600/40 animate-bounce-slow'
        }`}
      >
        {isOpen ? (
           <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
           </svg>
        ) : (
           <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
           </svg>
        )}
      </button>
      
      {!isOpen && (
         <div className="absolute bottom-16 right-0 bg-white px-4 py-2 rounded-xl shadow-lg border border-red-100 text-xs font-bold text-slate-700 whitespace-nowrap animate-in slide-in-from-right-4 fade-in duration-500 delay-1000">
            Siparişini sor? 👇
            <div className="absolute bottom-[-6px] right-6 w-3 h-3 bg-white border-b border-r border-red-100 transform rotate-45"></div>
         </div>
      )}
    </div>
  );
};

export default AIAssistant;
