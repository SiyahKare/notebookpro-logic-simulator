import nodemailer, { Transporter } from 'nodemailer';
import { env } from '../config/env.js';

// ===================
// E-POSTA SERVİSİ
// ===================

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface OrderEmailData {
  orderNumber: string;
  customerName: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  shipping: number;
  total: number;
  address?: string;
}

interface RepairEmailData {
  trackingCode: string;
  customerName: string;
  deviceInfo: string;
  status: string;
  statusMessage: string;
  estimatedDate?: string;
}

interface ShippingEmailData {
  orderNumber: string;
  customerName: string;
  trackingNumber: string;
  carrier: string;
  trackingUrl?: string;
}

class EmailService {
  private transporter: Transporter | null = null;
  private isConfigured: boolean = false;
  private initPromise: Promise<void> | null = null;

  constructor() {
    this.initPromise = this.initialize();
  }

  private async initialize(): Promise<void> {
    // SMTP yapılandırması
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (smtpHost && smtpUser && smtpPass) {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });
      this.isConfigured = true;
      console.log('📧 Email service initialized with SMTP');
    } else if (env.isDev) {
      // Development için Ethereal test hesabı
      await this.createTestAccount();
    } else {
      console.warn('⚠️ Email service not configured - SMTP credentials missing');
    }
  }

  private async createTestAccount(): Promise<void> {
    try {
      const testAccount = await nodemailer.createTestAccount();
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      this.isConfigured = true;
      console.log('📧 Email service initialized with Ethereal test account');
      console.log(`   Test inbox: https://ethereal.email/login`);
      console.log(`   User: ${testAccount.user}`);
    } catch (error) {
      console.error('Failed to create test email account:', error);
    }
  }
  
  // Wait for initialization before sending
  private async ensureInitialized(): Promise<void> {
    if (this.initPromise) {
      await this.initPromise;
    }
  }

  // ===================
  // GENEL E-POSTA GÖNDERME
  // ===================
  async sendEmail(options: EmailOptions): Promise<boolean> {
    // Wait for initialization
    await this.ensureInitialized();
    
    if (!this.transporter || !this.isConfigured) {
      console.warn('Email not sent - service not configured');
      return false;
    }

    try {
      const info = await this.transporter.sendMail({
        from: `"NotebookPro" <${process.env.SMTP_FROM || 'noreply@notebookpro.com'}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || this.stripHtml(options.html),
      });

      console.log(`📧 Email sent: ${info.messageId}`);
      
      // Ethereal için preview URL'i göster
      if (env.isDev) {
        console.log(`   Preview: ${nodemailer.getTestMessageUrl(info)}`);
      }

      return true;
    } catch (error) {
      console.error('Email send failed:', error);
      return false;
    }
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }

  // ===================
  // SİPARİŞ E-POSTALARI
  // ===================
  async sendOrderConfirmation(email: string, data: OrderEmailData): Promise<boolean> {
    const itemsHtml = data.items.map(item => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">${item.name}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">${item.price.toFixed(2)} ₺</td>
      </tr>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
          .header h1 { margin: 0; font-size: 24px; }
          .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; }
          .order-number { background: #fef2f2; border: 2px dashed #dc2626; padding: 15px; text-align: center; margin: 20px 0; border-radius: 8px; }
          .order-number span { font-size: 24px; font-weight: bold; color: #dc2626; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th { background: #f9fafb; padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb; }
          .total-row { font-weight: bold; font-size: 18px; }
          .footer { background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 12px 12px; color: #6b7280; font-size: 14px; }
          .btn { display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Siparişiniz Alındı!</h1>
          </div>
          <div class="content">
            <p>Merhaba <strong>${data.customerName}</strong>,</p>
            <p>Siparişiniz başarıyla alındı. Siparişinizi hazırlamaya başladık!</p>
            
            <div class="order-number">
              <p style="margin: 0; color: #666;">Sipariş Numaranız</p>
              <span>${data.orderNumber}</span>
            </div>

            <h3>📦 Sipariş Detayları</h3>
            <table>
              <thead>
                <tr>
                  <th>Ürün</th>
                  <th style="text-align: center;">Adet</th>
                  <th style="text-align: right;">Tutar</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="2" style="padding: 12px; text-align: right;">Ara Toplam:</td>
                  <td style="padding: 12px; text-align: right;">${data.subtotal.toFixed(2)} ₺</td>
                </tr>
                <tr>
                  <td colspan="2" style="padding: 12px; text-align: right;">Kargo:</td>
                  <td style="padding: 12px; text-align: right;">${data.shipping > 0 ? data.shipping.toFixed(2) + ' ₺' : 'Ücretsiz'}</td>
                </tr>
                <tr class="total-row">
                  <td colspan="2" style="padding: 12px; text-align: right; border-top: 2px solid #dc2626;">Toplam:</td>
                  <td style="padding: 12px; text-align: right; border-top: 2px solid #dc2626; color: #dc2626;">${data.total.toFixed(2)} ₺</td>
                </tr>
              </tfoot>
            </table>

            ${data.address ? `
            <h3>📍 Teslimat Adresi</h3>
            <p style="background: #f9fafb; padding: 15px; border-radius: 8px;">${data.address}</p>
            ` : ''}

            <a href="https://notebookpro.siyahkare.com/orders" class="btn">Siparişimi Takip Et</a>
          </div>
          <div class="footer">
            <p>NotebookPro - Notebook Yedek Parça & Teknik Servis</p>
            <p>Bu e-posta ${email} adresine gönderilmiştir.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: `✅ Siparişiniz Alındı - ${data.orderNumber}`,
      html,
    });
  }

  // ===================
  // KARGO E-POSTASI
  // ===================
  async sendShippingNotification(email: string, data: ShippingEmailData): Promise<boolean> {
    const trackingUrl = data.trackingUrl || this.getCarrierTrackingUrl(data.carrier, data.trackingNumber);

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
          .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; }
          .tracking-box { background: #ecfdf5; border: 2px solid #059669; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
          .tracking-number { font-size: 28px; font-weight: bold; color: #059669; letter-spacing: 2px; }
          .footer { background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 12px 12px; color: #6b7280; font-size: 14px; }
          .btn { display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 20px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
          .info-item { background: #f9fafb; padding: 15px; border-radius: 8px; }
          .info-label { color: #6b7280; font-size: 12px; text-transform: uppercase; }
          .info-value { font-weight: bold; margin-top: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚚 Siparişiniz Yola Çıktı!</h1>
          </div>
          <div class="content">
            <p>Merhaba <strong>${data.customerName}</strong>,</p>
            <p><strong>${data.orderNumber}</strong> numaralı siparişiniz kargoya verildi!</p>
            
            <div class="tracking-box">
              <p style="margin: 0 0 10px 0; color: #047857;">Kargo Takip Numaranız</p>
              <div class="tracking-number">${data.trackingNumber}</div>
              <p style="margin: 10px 0 0 0; color: #6b7280;">${data.carrier}</p>
            </div>

            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Kargo Firması</div>
                <div class="info-value">${data.carrier}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Tahmini Teslimat</div>
                <div class="info-value">1-3 İş Günü</div>
              </div>
            </div>

            <a href="${trackingUrl}" class="btn" target="_blank">📍 Kargom Nerede?</a>
          </div>
          <div class="footer">
            <p>NotebookPro - Notebook Yedek Parça & Teknik Servis</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: `🚚 Siparişiniz Kargoya Verildi - ${data.orderNumber}`,
      html,
    });
  }

  private getCarrierTrackingUrl(carrier: string, trackingNumber: string): string {
    const carriers: Record<string, string> = {
      'Yurtiçi Kargo': `https://www.yurticikargo.com/tr/online-servisler/gonderi-sorgula?code=${trackingNumber}`,
      'Aras Kargo': `https://www.araskargo.com.tr/trs_gonderi_takip.aspx?kession=${trackingNumber}`,
      'MNG Kargo': `https://www.mngkargo.com.tr/gonderi-takip/${trackingNumber}`,
      'PTT Kargo': `https://gonderitakip.ptt.gov.tr/Track/Verify?q=${trackingNumber}`,
      'Sürat Kargo': `https://www.suratkargo.com.tr/gonderi-takip?barcode=${trackingNumber}`,
    };
    return carriers[carrier] || `https://www.google.com/search?q=${carrier}+${trackingNumber}+takip`;
  }

  // ===================
  // SERVİS DURUM E-POSTASI
  // ===================
  async sendRepairStatusUpdate(email: string, data: RepairEmailData): Promise<boolean> {
    const statusColors: Record<string, string> = {
      'RECEIVED': '#6b7280',
      'DIAGNOSING': '#f59e0b',
      'WAITING_PARTS': '#8b5cf6',
      'REPAIRING': '#3b82f6',
      'TESTING': '#06b6d4',
      'COMPLETED': '#10b981',
      'DELIVERED': '#059669',
      'CANCELLED': '#ef4444',
    };

    const statusColor = statusColors[data.status] || '#6b7280';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, ${statusColor} 0%, ${statusColor}dd 100%); color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
          .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; }
          .status-badge { display: inline-block; background: ${statusColor}; color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold; }
          .tracking-code { background: #f3f4f6; padding: 15px; text-align: center; margin: 20px 0; border-radius: 8px; font-family: monospace; font-size: 20px; letter-spacing: 2px; }
          .footer { background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 12px 12px; color: #6b7280; font-size: 14px; }
          .btn { display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 20px; }
          .device-info { background: #f9fafb; padding: 15px; border-radius: 8px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔧 Servis Durumu Güncellendi</h1>
          </div>
          <div class="content">
            <p>Merhaba <strong>${data.customerName}</strong>,</p>
            <p>Servis kaydınızın durumu güncellendi:</p>
            
            <div style="text-align: center; margin: 25px 0;">
              <span class="status-badge">${data.statusMessage}</span>
            </div>

            <div class="tracking-code">
              ${data.trackingCode}
            </div>

            <div class="device-info">
              <strong>Cihaz:</strong> ${data.deviceInfo}
            </div>

            ${data.estimatedDate ? `
            <p><strong>📅 Tahmini Teslim:</strong> ${data.estimatedDate}</p>
            ` : ''}

            <a href="https://notebookpro.siyahkare.com/service" class="btn">Detaylı Takip</a>
          </div>
          <div class="footer">
            <p>NotebookPro Teknik Servis</p>
            <p>Sorularınız için: 0850 XXX XX XX</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: `🔧 Servis Durumu: ${data.statusMessage} - ${data.trackingCode}`,
      html,
    });
  }

  // ===================
  // HOŞ GELDİN E-POSTASI
  // ===================
  async sendWelcomeEmail(email: string, name: string): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0; }
          .header h1 { margin: 0; font-size: 28px; }
          .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; }
          .features { display: grid; gap: 15px; margin: 20px 0; }
          .feature { display: flex; align-items: center; gap: 15px; padding: 15px; background: #fef2f2; border-radius: 8px; }
          .feature-icon { font-size: 24px; }
          .footer { background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 12px 12px; color: #6b7280; font-size: 14px; }
          .btn { display: inline-block; background: #dc2626; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; margin-top: 20px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 NotebookPro'ya Hoş Geldiniz!</h1>
          </div>
          <div class="content">
            <p>Merhaba <strong>${name}</strong>,</p>
            <p>NotebookPro ailesine katıldığınız için teşekkür ederiz! Notebook yedek parça ve teknik servis ihtiyaçlarınız için doğru adrestesiniz.</p>
            
            <div class="features">
              <div class="feature">
                <span class="feature-icon">🖥️</span>
                <div>
                  <strong>Geniş Ürün Yelpazesi</strong>
                  <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">Ekran, klavye, batarya, SSD ve daha fazlası</p>
                </div>
              </div>
              <div class="feature">
                <span class="feature-icon">🔧</span>
                <div>
                  <strong>Profesyonel Teknik Servis</strong>
                  <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">Uzman ekip ile hızlı ve güvenilir onarım</p>
                </div>
              </div>
              <div class="feature">
                <span class="feature-icon">🚚</span>
                <div>
                  <strong>Hızlı Kargo</strong>
                  <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">Aynı gün kargo, 500₺ üzeri ücretsiz</p>
                </div>
              </div>
              <div class="feature">
                <span class="feature-icon">💰</span>
                <div>
                  <strong>En İyi Fiyatlar</strong>
                  <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">Rekabetçi fiyatlar ve bayi indirimleri</p>
                </div>
              </div>
            </div>

            <div style="text-align: center;">
              <a href="https://notebookpro.siyahkare.com/products" class="btn">Alışverişe Başla →</a>
            </div>

            <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px;">
              <strong>İlk siparişinize özel:</strong> HOSGELDIN10 kupon kodu ile %10 indirim kazanın!
            </p>
          </div>
          <div class="footer">
            <p>NotebookPro - Notebook Yedek Parça & Teknik Servis</p>
            <p>www.notebookpro.siyahkare.com</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: `🎉 NotebookPro'ya Hoş Geldiniz, ${name}!`,
      html,
    });
  }

  // ===================
  // ŞİFRE SIFIRLAMA E-POSTASI
  // ===================
  async sendPasswordReset(email: string, name: string, resetToken: string): Promise<boolean> {
    const resetUrl = `https://notebookpro.siyahkare.com/reset-password?token=${resetToken}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
          .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; }
          .footer { background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 12px 12px; color: #6b7280; font-size: 14px; }
          .btn { display: inline-block; background: #f59e0b; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; }
          .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 8px; margin-top: 20px; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Şifre Sıfırlama</h1>
          </div>
          <div class="content">
            <p>Merhaba <strong>${name}</strong>,</p>
            <p>Hesabınız için şifre sıfırlama talebinde bulunuldu. Şifrenizi sıfırlamak için aşağıdaki butona tıklayın:</p>
            
            <div style="text-align: center;">
              <a href="${resetUrl}" class="btn">Şifremi Sıfırla</a>
            </div>

            <div class="warning">
              <strong>⚠️ Önemli:</strong> Bu link 1 saat geçerlidir. Eğer şifre sıfırlama talebinde bulunmadıysanız, bu e-postayı görmezden gelebilirsiniz.
            </div>
          </div>
          <div class="footer">
            <p>NotebookPro Güvenlik Ekibi</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: `🔐 Şifre Sıfırlama - NotebookPro`,
      html,
    });
  }
}

// Singleton instance
export const emailService = new EmailService();
export default emailService;

