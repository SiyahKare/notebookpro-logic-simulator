import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import SEO from '../components/SEO';
import { FadeIn } from '../components/AnimatedComponents';
import { useToast } from '../components/Toast';

const Contact: React.FC = () => {
  const { actualTheme } = useTheme();
  const { showToast } = useToast();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    showToast('Mesajınız başarıyla gönderildi! En kısa sürede size dönüş yapacağız.', 'success');
    setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    setIsSubmitting(false);
  };

  const contactInfo = [
    {
      icon: '📍',
      title: 'Adres',
      content: 'Perpa Ticaret Merkezi, A Blok Kat: 11 No: 1234',
      subContent: 'Şişli, İstanbul 34384',
      link: 'https://maps.google.com',
      linkText: 'Haritada Göster'
    },
    {
      icon: '📞',
      title: 'Telefon',
      content: '+90 212 123 45 67',
      subContent: 'Hafta içi 09:00 - 18:00',
      link: 'tel:+902121234567',
      linkText: 'Hemen Ara'
    },
    {
      icon: '📧',
      title: 'E-posta',
      content: 'info@notebookpro.com.tr',
      subContent: 'Destek için 7/24 yazabilirsiniz',
      link: 'mailto:info@notebookpro.com.tr',
      linkText: 'E-posta Gönder'
    },
    {
      icon: '💬',
      title: 'WhatsApp',
      content: '+90 532 123 45 67',
      subContent: 'Hızlı yanıt için',
      link: 'https://wa.me/905321234567',
      linkText: 'WhatsApp\'tan Yaz'
    }
  ];

  const faqItems = [
    {
      question: 'Siparişim ne zaman kargoya verilir?',
      answer: 'Siparişleriniz ödeme onayından sonra aynı gün veya en geç 1 iş günü içinde kargoya verilmektedir.'
    },
    {
      question: 'Bayi olarak nasıl kayıt olabilirim?',
      answer: 'Bayi başvurusu için kayıt formunu doldurabilir veya bizimle iletişime geçebilirsiniz. Vergi levhanız ve ticaret sicil belgeniz gereklidir.'
    },
    {
      question: 'Ürün iade koşulları nelerdir?',
      answer: '14 gün içinde, kullanılmamış ve orijinal ambalajında olan ürünleri iade edebilirsiniz. Arızalı ürünlerde garanti kapsamında değişim yapılır.'
    },
    {
      question: 'Teknik servis hizmeti veriyor musunuz?',
      answer: 'Evet, notebook tamir ve bakım hizmeti sunuyoruz. Anakart tamiri, BGA reballing, ekran değişimi gibi tüm işlemleri yapıyoruz.'
    }
  ];

  return (
    <>
      <SEO title="İletişim" description="NotebookPro ile iletişime geçin. Sorularınız için bize ulaşın." />
      
      <div className={`min-h-screen py-8 ${actualTheme === 'dark' ? 'bg-slate-900' : 'bg-slate-50'}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <FadeIn>
            <div className="text-center mb-12">
              <h1 className={`text-3xl md:text-4xl font-bold mb-4 ${actualTheme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                📬 İletişime Geçin
              </h1>
              <p className={`text-lg max-w-2xl mx-auto ${actualTheme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                Sorularınız, önerileriniz veya iş birliği talepleriniz için bize ulaşın.
                En kısa sürede size dönüş yapacağız.
              </p>
            </div>
          </FadeIn>

          <div className="grid lg:grid-cols-3 gap-8">
            
            {/* Contact Form */}
            <FadeIn delay={100} className="lg:col-span-2">
              <div className={`rounded-2xl p-6 md:p-8 ${actualTheme === 'dark' ? 'bg-slate-800' : 'bg-white'} shadow-sm`}>
                <h2 className={`text-xl font-bold mb-6 ${actualTheme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  Mesaj Gönderin
                </h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${actualTheme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                        Ad Soyad *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        className={`w-full px-4 py-3 rounded-xl border transition ${
                          actualTheme === 'dark' 
                            ? 'bg-slate-700 border-slate-600 text-white focus:border-red-500' 
                            : 'bg-white border-slate-200 focus:border-red-500'
                        } focus:ring-2 focus:ring-red-500/20 outline-none`}
                        placeholder="Adınız ve soyadınız"
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${actualTheme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                        E-posta *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        className={`w-full px-4 py-3 rounded-xl border transition ${
                          actualTheme === 'dark' 
                            ? 'bg-slate-700 border-slate-600 text-white focus:border-red-500' 
                            : 'bg-white border-slate-200 focus:border-red-500'
                        } focus:ring-2 focus:ring-red-500/20 outline-none`}
                        placeholder="ornek@email.com"
                      />
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${actualTheme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                        Telefon
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        className={`w-full px-4 py-3 rounded-xl border transition ${
                          actualTheme === 'dark' 
                            ? 'bg-slate-700 border-slate-600 text-white focus:border-red-500' 
                            : 'bg-white border-slate-200 focus:border-red-500'
                        } focus:ring-2 focus:ring-red-500/20 outline-none`}
                        placeholder="05XX XXX XX XX"
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${actualTheme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                        Konu *
                      </label>
                      <select
                        required
                        value={formData.subject}
                        onChange={e => setFormData({ ...formData, subject: e.target.value })}
                        className={`w-full px-4 py-3 rounded-xl border transition ${
                          actualTheme === 'dark' 
                            ? 'bg-slate-700 border-slate-600 text-white focus:border-red-500' 
                            : 'bg-white border-slate-200 focus:border-red-500'
                        } focus:ring-2 focus:ring-red-500/20 outline-none`}
                      >
                        <option value="">Konu seçin</option>
                        <option value="satis">Satış & Fiyat Bilgisi</option>
                        <option value="teknik">Teknik Destek</option>
                        <option value="servis">Servis Talebi</option>
                        <option value="bayilik">Bayilik Başvurusu</option>
                        <option value="iade">İade & Değişim</option>
                        <option value="oneri">Öneri & Şikayet</option>
                        <option value="diger">Diğer</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${actualTheme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                      Mesajınız *
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={formData.message}
                      onChange={e => setFormData({ ...formData, message: e.target.value })}
                      className={`w-full px-4 py-3 rounded-xl border transition resize-none ${
                        actualTheme === 'dark' 
                          ? 'bg-slate-700 border-slate-600 text-white focus:border-red-500' 
                          : 'bg-white border-slate-200 focus:border-red-500'
                      } focus:ring-2 focus:ring-red-500/20 outline-none`}
                      placeholder="Mesajınızı buraya yazın..."
                    />
                  </div>
                  
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 bg-red-600 text-white rounded-xl font-bold text-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Gönderiliyor...
                      </>
                    ) : (
                      <>
                        📤 Mesaj Gönder
                      </>
                    )}
                  </button>
                </form>
              </div>
            </FadeIn>

            {/* Contact Info */}
            <FadeIn delay={200}>
              <div className="space-y-4">
                {contactInfo.map((info, index) => (
                  <div 
                    key={index}
                    className={`p-4 rounded-xl ${actualTheme === 'dark' ? 'bg-slate-800' : 'bg-white'} shadow-sm`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="text-2xl">{info.icon}</div>
                      <div className="flex-1">
                        <h3 className={`font-semibold ${actualTheme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                          {info.title}
                        </h3>
                        <p className={`${actualTheme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                          {info.content}
                        </p>
                        <p className={`text-sm ${actualTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                          {info.subContent}
                        </p>
                        <a 
                          href={info.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block mt-2 text-sm font-medium text-red-600 hover:text-red-700"
                        >
                          {info.linkText} →
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Map Placeholder */}
                <div className={`rounded-xl overflow-hidden h-48 ${actualTheme === 'dark' ? 'bg-slate-800' : 'bg-white'} shadow-sm`}>
                  <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-4xl mb-2">🗺️</div>
                      <p className={`text-sm ${actualTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                        Harita görünümü
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>

          {/* FAQ Section */}
          <FadeIn delay={300}>
            <div className="mt-12">
              <h2 className={`text-2xl font-bold mb-6 text-center ${actualTheme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                ❓ Sıkça Sorulan Sorular
              </h2>
              
              <div className="grid md:grid-cols-2 gap-4">
                {faqItems.map((faq, index) => (
                  <div 
                    key={index}
                    className={`p-5 rounded-xl ${actualTheme === 'dark' ? 'bg-slate-800' : 'bg-white'} shadow-sm`}
                  >
                    <h3 className={`font-semibold mb-2 ${actualTheme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                      {faq.question}
                    </h3>
                    <p className={`text-sm ${actualTheme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                      {faq.answer}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </>
  );
};

export default Contact;

