import React, { useState, useEffect, useRef } from 'react';
import { useRepair } from '../context/RepairContext';
import { useOrder } from '../context/OrderContext';
import { useProducts } from '../context/ProductContext';
import { useTheme } from '../context/ThemeContext';
import { generateWhatsAppLink } from '../utils/whatsapp';
import { formatCurrency } from '../utils/pricing';
import { Link } from 'react-router-dom';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  type?: 'text' | 'link' | 'product' | 'wizard' | 'quickActions';
  data?: any;
}

interface WizardStep {
  question: string;
  options: { label: string; value: string; nextStep?: string | null; result?: string }[];
}

const AIAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'wizard' | 'recommend'>('chat');
  const { repairRecords } = useRepair();
  const { orders } = useOrder();
  const { products } = useProducts();
  const { actualTheme } = useTheme();
  
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: 1, 
      text: "Merhaba! 👋 Ben NotebookPro Asistan. Size nasıl yardımcı olabilirim?", 
      sender: 'bot',
      type: 'text'
    },
    {
      id: 2,
      text: '',
      sender: 'bot',
      type: 'quickActions',
      data: [
        { label: '📦 Sipariş Sorgula', action: 'ORDER_QUERY' },
        { label: '🔧 Servis Takibi', action: 'REPAIR_QUERY' },
        { label: '🔍 Parça Bul', action: 'FIND_PART' },
        { label: '❓ SSS', action: 'FAQ' }
      ]
    }
  ]);

  // Arıza Teşhis Wizard
  const [wizardStep, setWizardStep] = useState<string | null>(null);
  const [wizardHistory, setWizardHistory] = useState<string[]>([]);

  const wizardSteps: Record<string, WizardStep> = {
    start: {
      question: '🔧 Hangi arıza türü için yardım istiyorsunuz?',
      options: [
        { label: '💻 Ekran Sorunu', value: 'screen', nextStep: 'screen_type' },
        { label: '🔋 Batarya/Şarj Sorunu', value: 'battery', nextStep: 'battery_type' },
        { label: '⌨️ Klavye Sorunu', value: 'keyboard', nextStep: 'keyboard_type' },
        { label: '💾 Performans/Depolama', value: 'storage', nextStep: 'storage_type' },
        { label: '🌡️ Isınma Sorunu', value: 'heating', nextStep: null, result: 'heating_result' }
      ]
    },
    screen_type: {
      question: 'Ekranınızda ne tür bir sorun var?',
      options: [
        { label: 'Ekran tamamen siyah', value: 'black', nextStep: null, result: 'screen_black' },
        { label: 'Çizgiler/Piksel hataları', value: 'lines', nextStep: null, result: 'screen_lines' },
        { label: 'Ekran kırık/çatlak', value: 'cracked', nextStep: null, result: 'screen_cracked' },
        { label: 'Titreme/Yanıp sönme', value: 'flicker', nextStep: null, result: 'screen_flicker' }
      ]
    },
    battery_type: {
      question: 'Batarya/şarj sorununuz nedir?',
      options: [
        { label: 'Şarj olmuyor', value: 'no_charge', nextStep: null, result: 'battery_no_charge' },
        { label: 'Çabuk bitiyor', value: 'drain', nextStep: null, result: 'battery_drain' },
        { label: 'Şişmiş batarya', value: 'swollen', nextStep: null, result: 'battery_swollen' },
        { label: 'Adaptör ısınıyor', value: 'hot', nextStep: null, result: 'battery_adapter' }
      ]
    },
    keyboard_type: {
      question: 'Klavye sorununuz nedir?',
      options: [
        { label: 'Bazı tuşlar çalışmıyor', value: 'some_keys', nextStep: null, result: 'keyboard_some' },
        { label: 'Tüm klavye çalışmıyor', value: 'all_keys', nextStep: null, result: 'keyboard_all' },
        { label: 'Sıvı döküldü', value: 'liquid', nextStep: null, result: 'keyboard_liquid' },
        { label: 'Aydınlatma çalışmıyor', value: 'backlight', nextStep: null, result: 'keyboard_backlight' }
      ]
    },
    storage_type: {
      question: 'Ne tür bir performans sorunu yaşıyorsunuz?',
      options: [
        { label: 'Bilgisayar çok yavaş', value: 'slow', nextStep: null, result: 'storage_slow' },
        { label: 'Depolama alanı yetersiz', value: 'full', nextStep: null, result: 'storage_full' },
        { label: 'Sistem açılmıyor', value: 'boot', nextStep: null, result: 'storage_boot' },
        { label: 'Mavi ekran hatası', value: 'bsod', nextStep: null, result: 'storage_bsod' }
      ]
    }
  };

  const wizardResults: Record<string, { title: string; description: string; products: string[]; action: string }> = {
    screen_black: {
      title: '⚫ Siyah Ekran Teşhisi',
      description: 'Ekran kablosu gevşemiş veya LCD panel arızalı olabilir. Önce harici monitör ile test edin.',
      products: ['SCR-156-SLIM-30', 'SCR-140-FHD-40'],
      action: 'Servis kaydı oluşturmanızı öneriyoruz.'
    },
    screen_lines: {
      title: '📺 Ekran Çizgileri Teşhisi',
      description: 'LCD panel hasarlı. Yeni ekran değişimi gerekli.',
      products: ['SCR-156-SLIM-30', 'SCR-140-FHD-40', 'SCR-173-FHD-30'],
      action: 'Uyumlu ekran satın alabilirsiniz.'
    },
    screen_cracked: {
      title: '💔 Kırık Ekran Teşhisi',
      description: 'Fiziksel hasar. Ekran değişimi şart.',
      products: ['SCR-156-SLIM-30', 'SCR-140-FHD-40'],
      action: 'Acil ekran değişimi gerekli.'
    },
    screen_flicker: {
      title: '⚡ Titreyen Ekran Teşhisi',
      description: 'Ekran kablosu veya GPU sorunu olabilir. Önce sürücüleri güncelleyin.',
      products: ['SCR-156-SLIM-30'],
      action: 'Sorun devam ederse servis öneriyoruz.'
    },
    battery_no_charge: {
      title: '🔌 Şarj Olmama Teşhisi',
      description: 'Şarj soketi, adaptör veya batarya arızası olabilir.',
      products: ['BAT-DELL-60W', 'BAT-HP-CI03XL', 'BAT-LENOVO-T480'],
      action: 'Batarya değişimi deneyin.'
    },
    battery_drain: {
      title: '🔋 Hızlı Biten Batarya',
      description: 'Batarya ömrünü tamamlamış. Yeni batarya gerekli.',
      products: ['BAT-DELL-60W', 'BAT-HP-CI03XL', 'BAT-LENOVO-T480'],
      action: 'Yeni batarya öneriyoruz.'
    },
    battery_swollen: {
      title: '⚠️ ŞİŞMİŞ BATARYA - ACİL!',
      description: 'TEHLİKE! Cihazı hemen kapatın, bataryayı çıkarın. Şişmiş batarya patlayabilir!',
      products: ['BAT-DELL-60W', 'BAT-HP-CI03XL'],
      action: 'ACİL batarya değişimi!'
    },
    battery_adapter: {
      title: '🔥 Adaptör Isınması',
      description: 'Orijinal olmayan adaptör kullanıyor olabilirsiniz. Voltaj kontrolü yapın.',
      products: [],
      action: 'Orijinal adaptör kullanın.'
    },
    keyboard_some: {
      title: '⌨️ Kısmi Klavye Arızası',
      description: 'Klavye kablo bağlantısı gevşemiş veya kısmi hasar olabilir.',
      products: ['KB-HP-15-TR', 'KB-DELL-5590-TR', 'KB-LENOVO-T480-TR'],
      action: 'Klavye değişimi öneriyoruz.'
    },
    keyboard_all: {
      title: '⌨️ Tam Klavye Arızası',
      description: 'Klavye kablosu kopmuş veya anakart bağlantısı hasarlı.',
      products: ['KB-HP-15-TR', 'KB-DELL-5590-TR', 'KB-LENOVO-T480-TR'],
      action: 'Klavye değişimi gerekli.'
    },
    keyboard_liquid: {
      title: '💧 Sıvı Hasarı - ACİL!',
      description: 'Hemen cihazı kapatın, ters çevirin. 48 saat kurumasını bekleyin.',
      products: ['KB-HP-15-TR', 'KB-DELL-5590-TR'],
      action: 'Profesyonel temizlik öneriyoruz.'
    },
    keyboard_backlight: {
      title: '💡 Klavye Aydınlatma',
      description: 'Backlight kablosu veya LED strip arızası.',
      products: ['KB-HP-15-TR', 'KB-LENOVO-T480-TR'],
      action: 'Aydınlatmalı klavye ile değiştirin.'
    },
    storage_slow: {
      title: '🐌 Yavaş Performans',
      description: 'HDD kullanıyorsanız SSD geçişi %300+ hız artışı sağlar!',
      products: ['SSD-NVME-512', 'SSD-NVME-256', 'SSD-NVME-1TB'],
      action: 'SSD yükseltmesi öneriyoruz.'
    },
    storage_full: {
      title: '💾 Yetersiz Depolama',
      description: 'Daha yüksek kapasiteli SSD ile yükseltin.',
      products: ['SSD-NVME-512', 'SSD-NVME-1TB'],
      action: 'Kapasite artışı yapın.'
    },
    storage_boot: {
      title: '🚫 Açılmayan Sistem',
      description: 'SSD/HDD arızası veya işletim sistemi bozulmuş olabilir.',
      products: ['SSD-NVME-512', 'SSD-NVME-256'],
      action: 'Depolama ünitesi değişimi gerekebilir.'
    },
    storage_bsod: {
      title: '🔵 Mavi Ekran Hatası',
      description: 'RAM veya depolama arızası. Test gerekli.',
      products: ['RAM-DDR4-8GB', 'RAM-DDR4-16GB', 'SSD-NVME-512'],
      action: 'RAM ve SSD test edilmeli.'
    },
    heating_result: {
      title: '🌡️ Aşırı Isınma Teşhisi',
      description: 'Termal macun kurumuş veya fan arızası. Temizlik ve termal macun yenilemesi gerekli.',
      products: [],
      action: 'Termal bakım servisi öneriyoruz.'
    }
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'ORDER_QUERY':
        addBotMessage('📦 Sipariş sorgulamak için sipariş numaranızı (ORD-...) yazın veya sipariş e-postanızı belirtin.');
        break;
      case 'REPAIR_QUERY':
        addBotMessage('🔧 Servis takibi için servis kodunuzu (NB-2024-...) yazın.');
        break;
      case 'FIND_PART':
        addBotMessage('🔍 Hangi parçayı arıyorsunuz? Örn: "Dell batarya", "HP ekran", "8GB RAM"');
        break;
      case 'FAQ':
        addBotMessage('❓ Sık Sorulan Sorular:\n\n1️⃣ Kargo ne zaman gelir?\n→ Siparişler 1-3 iş gününde teslim edilir.\n\n2️⃣ Garanti süresi ne kadar?\n→ Tüm ürünlerimiz 1 yıl garantilidir.\n\n3️⃣ İade yapabilir miyim?\n→ 14 gün içinde iade yapabilirsiniz.');
        break;
    }
  };

  const addBotMessage = (text: string, type: Message['type'] = 'text', data?: any) => {
    setMessages(prev => [...prev, {
      id: Date.now(),
      text,
      sender: 'bot',
      type,
      data
    }]);
  };

  const handleWizardOption = (option: { label: string; value: string; nextStep?: string | null; result?: string }) => {
    // Add user selection as message
    setMessages(prev => [...prev, {
      id: Date.now(),
      text: option.label,
      sender: 'user',
      type: 'text'
    }]);

    setWizardHistory(prev => [...prev, wizardStep!]);

    if (option.result) {
      // Show result
      const result = wizardResults[option.result];
      const matchedProducts = products.filter(p => result.products.includes(p.sku));
      
      setTimeout(() => {
        addBotMessage(`${result.title}\n\n${result.description}\n\n💡 Öneri: ${result.action}`, 'text');
        
        if (matchedProducts.length > 0) {
          setTimeout(() => {
            addBotMessage('🛒 Önerilen Ürünler:', 'product', matchedProducts.slice(0, 3));
          }, 500);
        }
        
        setWizardStep(null);
        setActiveTab('chat');
      }, 500);
    } else if (option.nextStep) {
      setWizardStep(option.nextStep);
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;

    const userMsg: Message = { id: Date.now(), text: input, sender: 'user', type: 'text' };
    setMessages(prev => [...prev, userMsg]);
    const userInput = input.toLowerCase();
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      // Regex Patterns
      const repairPattern = /(NB-\d{4}-[A-Z0-9]+)/i;
      const orderPattern = /(ORD-\d+-\d+)/i;
      
      const repairMatch = input.match(repairPattern);
      const orderMatch = input.match(orderPattern);

      if (repairMatch) {
        const code = repairMatch[0].toUpperCase();
        const record = repairRecords.find(r => r.tracking_code === code);
        
        if (record) {
          addBotMessage(`🔧 Servis Kaydı Bulundu:\n\n📱 Cihaz: ${record.device_brand} ${record.device_model}\n📊 Durum: ${record.status.replace('_', ' ').toUpperCase()}\n🔍 Arıza: ${record.issue_description}`);
        } else {
          addBotMessage(`❌ ${code} kodlu servis kaydı bulunamadı. Kodu kontrol edin.`);
        }
      } else if (orderMatch) {
        const orderId = orderMatch[0];
        const order = orders.find(o => o.id === orderId);

        if (order) {
          addBotMessage(`📦 Sipariş Bulundu:\n\n👤 ${order.customerName}\n💰 ${formatCurrency(order.totalAmount)}\n📊 Durum: ${order.status}`);
        } else {
          addBotMessage(`❌ ${orderId} numaralı sipariş bulunamadı.`);
        }
      } else if (userInput.includes('ekran') || userInput.includes('lcd') || userInput.includes('display')) {
        const screenProducts = products.filter(p => p.category === 'SCREEN').slice(0, 3);
        addBotMessage('📺 Ekran ürünleri:', 'product', screenProducts);
      } else if (userInput.includes('batarya') || userInput.includes('pil') || userInput.includes('şarj')) {
        const batteryProducts = products.filter(p => p.category === 'BATTERY').slice(0, 3);
        addBotMessage('🔋 Batarya ürünleri:', 'product', batteryProducts);
      } else if (userInput.includes('klavye') || userInput.includes('keyboard')) {
        const kbProducts = products.filter(p => p.category === 'KEYBOARD').slice(0, 3);
        addBotMessage('⌨️ Klavye ürünleri:', 'product', kbProducts);
      } else if (userInput.includes('ram') || userInput.includes('bellek')) {
        const ramProducts = products.filter(p => p.category === 'RAM').slice(0, 3);
        addBotMessage('💾 RAM ürünleri:', 'product', ramProducts);
      } else if (userInput.includes('ssd') || userInput.includes('disk') || userInput.includes('depolama')) {
        const ssdProducts = products.filter(p => p.category === 'STORAGE').slice(0, 3);
        addBotMessage('💿 SSD ürünleri:', 'product', ssdProducts);
      } else if (userInput.includes('arıza') || userInput.includes('sorun') || userInput.includes('bozuk')) {
        addBotMessage('🔧 Arıza teşhis sihirbazını başlatmak ister misiniz?', 'wizard');
      } else {
        const waLink = generateWhatsAppLink('905551234567', `Merhaba, şu konuda destek istiyorum: ${input}`);
        addBotMessage("Bu konuda yardımcı olamadım. Sizi müşteri temsilcimize yönlendireyim.", 'text');
        setTimeout(() => {
          addBotMessage('WhatsApp Destek Hattı', 'link', waLink);
        }, 500);
      }
      
      setIsTyping(false);
    }, 1000);
  };

  const startWizard = () => {
    setWizardStep('start');
    setWizardHistory([]);
    setActiveTab('wizard');
    addBotMessage('🔧 Arıza Teşhis Sihirbazı başlatıldı. Sorulara göre size en uygun çözümü önereceğim.');
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {isOpen && (
        <div className={`absolute bottom-16 right-0 w-80 sm:w-96 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300 flex flex-col max-h-[550px] ${
          actualTheme === 'dark' ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'
        }`}>
          
          {/* Header */}
          <div className="bg-gradient-to-r from-red-600 to-red-700 p-4 flex justify-between items-center flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white text-sm font-bold backdrop-blur">
                  🤖
                </div>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-red-600 rounded-full animate-pulse"></div>
              </div>
              <div>
                <div className="text-white font-bold">NotebookPro AI</div>
                <div className="text-xs text-red-200">Online • Yanıt &lt;1dk</div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white transition p-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          {/* Tab Bar */}
          <div className={`flex border-b ${actualTheme === 'dark' ? 'border-slate-700 bg-slate-800' : 'border-slate-100 bg-slate-50'}`}>
            {[
              { key: 'chat', label: '💬 Sohbet' },
              { key: 'wizard', label: '🔧 Teşhis' },
              { key: 'recommend', label: '✨ Öneri' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key as any);
                  if (tab.key === 'wizard' && !wizardStep) startWizard();
                }}
                className={`flex-1 py-2 text-xs font-medium transition ${
                  activeTab === tab.key
                    ? 'text-red-600 border-b-2 border-red-600'
                    : actualTheme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Messages Area */}
          <div className={`flex-grow p-4 overflow-y-auto h-72 scroll-smooth ${actualTheme === 'dark' ? 'bg-slate-900' : 'bg-slate-50'}`}>
            {/* Wizard Mode */}
            {activeTab === 'wizard' && wizardStep && (
              <div className="space-y-3">
                <div className={`p-4 rounded-xl ${actualTheme === 'dark' ? 'bg-slate-800' : 'bg-white'} shadow-sm`}>
                  <p className={`font-medium mb-3 ${actualTheme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    {wizardSteps[wizardStep].question}
                  </p>
                  <div className="space-y-2">
                    {wizardSteps[wizardStep].options.map((opt, i) => (
                      <button
                        key={i}
                        onClick={() => handleWizardOption(opt)}
                        className={`w-full text-left px-4 py-3 rounded-xl text-sm transition ${
                          actualTheme === 'dark' 
                            ? 'bg-slate-700 hover:bg-slate-600 text-white' 
                            : 'bg-slate-100 hover:bg-red-50 hover:text-red-600'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                {wizardHistory.length > 0 && (
                  <button
                    onClick={() => {
                      setWizardStep(wizardHistory[wizardHistory.length - 1]);
                      setWizardHistory(prev => prev.slice(0, -1));
                    }}
                    className="text-xs text-slate-500 hover:text-red-600"
                  >
                    ← Geri Dön
                  </button>
                )}
              </div>
            )}

            {/* Chat Messages */}
            {(activeTab === 'chat' || activeTab === 'recommend' || !wizardStep) && messages.map((msg) => (
              <div key={msg.id} className={`mb-3 flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.type === 'quickActions' && msg.data ? (
                  <div className="grid grid-cols-2 gap-2 w-full">
                    {msg.data.map((action: any, i: number) => (
                      <button
                        key={i}
                        onClick={() => handleQuickAction(action.action)}
                        className={`px-3 py-2 rounded-xl text-xs font-medium transition ${
                          actualTheme === 'dark' 
                            ? 'bg-slate-700 hover:bg-slate-600 text-white' 
                            : 'bg-white hover:bg-red-50 hover:text-red-600 border border-slate-200'
                        }`}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                ) : msg.type === 'product' && msg.data ? (
                  <div className="w-full space-y-2">
                    <p className={`text-xs font-medium ${actualTheme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                      {msg.text}
                    </p>
                    {msg.data.map((product: any) => (
                      <Link
                        key={product.id}
                        to={`/product/${product.id}`}
                        onClick={() => setIsOpen(false)}
                        className={`block p-3 rounded-xl transition ${
                          actualTheme === 'dark' ? 'bg-slate-800 hover:bg-slate-700' : 'bg-white hover:bg-slate-50 border border-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <img src={product.image_url} alt={product.name} className="w-12 h-12 rounded-lg object-cover" />
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-medium truncate ${actualTheme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                              {product.name}
                            </p>
                            <p className="text-xs text-red-600 font-bold">{formatCurrency(product.price_usd * 35)}</p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : msg.type === 'link' && msg.data ? (
                  <a 
                    href={msg.data} 
                    target="_blank" 
                    rel="noreferrer"
                    className="bg-green-500 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-green-600 transition flex items-center gap-2 shadow-lg shadow-green-200"
                  >
                    <span>💬</span>
                    {msg.text}
                  </a>
                ) : msg.type === 'wizard' ? (
                  <div className={`p-3 rounded-xl ${actualTheme === 'dark' ? 'bg-slate-800' : 'bg-white border border-slate-200'}`}>
                    <p className={`text-xs mb-2 ${actualTheme === 'dark' ? 'text-white' : 'text-slate-700'}`}>{msg.text}</p>
                    <button
                      onClick={startWizard}
                      className="w-full px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition"
                    >
                      🔧 Teşhis Sihirbazını Başlat
                    </button>
                  </div>
                ) : msg.text ? (
                  <div className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap shadow-sm ${
                    msg.sender === 'user' 
                      ? 'bg-red-600 text-white rounded-tr-none' 
                      : actualTheme === 'dark'
                        ? 'bg-slate-800 text-slate-200 rounded-tl-none'
                        : 'bg-white text-slate-700 border border-slate-200 rounded-tl-none'
                  }`}>
                    {msg.text}
                  </div>
                ) : null}
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start mb-3">
                <div className={`p-3 rounded-2xl rounded-tl-none flex gap-1.5 items-center ${
                  actualTheme === 'dark' ? 'bg-slate-700' : 'bg-slate-200'
                }`}>
                  <div className={`w-2 h-2 rounded-full animate-bounce ${actualTheme === 'dark' ? 'bg-slate-400' : 'bg-slate-500'}`} style={{ animationDelay: '0ms' }}></div>
                  <div className={`w-2 h-2 rounded-full animate-bounce ${actualTheme === 'dark' ? 'bg-slate-400' : 'bg-slate-500'}`} style={{ animationDelay: '150ms' }}></div>
                  <div className={`w-2 h-2 rounded-full animate-bounce ${actualTheme === 'dark' ? 'bg-slate-400' : 'bg-slate-500'}`} style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className={`p-3 border-t flex gap-2 ${
            actualTheme === 'dark' ? 'border-slate-700 bg-slate-800' : 'border-slate-100 bg-white'
          }`}>
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Mesajınızı yazın..." 
              className={`flex-grow text-xs p-3 rounded-xl outline-none transition ${
                actualTheme === 'dark' 
                  ? 'bg-slate-700 text-white placeholder-slate-400 focus:ring-2 ring-red-500/30' 
                  : 'bg-slate-100 focus:ring-2 ring-red-500/20'
              }`}
            />
            <button 
              type="submit"
              disabled={!input.trim() || isTyping}
              className="bg-red-600 text-white p-3 rounded-xl hover:bg-red-700 disabled:opacity-50 transition"
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
        className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center text-white transition-all transform duration-300 hover:scale-110 active:scale-95 ${
          isOpen ? 'bg-slate-800 rotate-180' : 'bg-gradient-to-br from-red-500 to-red-700 shadow-red-500/40'
        }`}
      >
        {isOpen ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <span className="text-2xl">🤖</span>
        )}
      </button>
      
      {!isOpen && (
        <div className={`absolute bottom-16 right-0 px-4 py-2 rounded-xl shadow-lg text-xs font-bold whitespace-nowrap animate-in slide-in-from-right-4 fade-in duration-500 ${
          actualTheme === 'dark' ? 'bg-slate-800 text-white border border-slate-700' : 'bg-white text-slate-700 border border-red-100'
        }`}>
          Siparişini sor? 👇
          <div className={`absolute bottom-[-6px] right-6 w-3 h-3 transform rotate-45 ${
            actualTheme === 'dark' ? 'bg-slate-800 border-b border-r border-slate-700' : 'bg-white border-b border-r border-red-100'
          }`}></div>
        </div>
      )}
    </div>
  );
};

export default AIAssistant;
