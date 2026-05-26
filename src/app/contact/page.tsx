'use client';

import { useState, useEffect } from 'react';
import {
  Mail,
  Phone,
  MessageSquare,
  Send,
  Sparkles,
  Globe,
  ShieldCheck,
  Info,
  Bug,
  Lightbulb,
  HelpCircle,
  ArrowUpRight,
  Sun,
  Scale,
  ShieldAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Field } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import { readProfile, type LocalProfile } from '@/lib/local-profile';
import { sendContactMessage } from './actions';

function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.063 2.063 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

const DEV = {
  name: 'Ozan Seyfi',
  title: 'Elektrik Mühendisi · Kontrolmatik',
  email: 'ozan.seyfi@kontrolmatik.com',
  phone: '',
  linkedin: 'https://www.linkedin.com/',
  website: '',
};

type Topic = 'feedback' | 'bug' | 'feature' | 'question';

const TOPICS: { key: Topic; label: string; icon: React.ComponentType<{ className?: string }>; tone: keyof typeof TOPIC_TONES }[] = [
  { key: 'feedback', label: 'Genel Geri Bildirim', icon: MessageSquare, tone: 'blue' },
  { key: 'bug', label: 'Hata Bildirimi', icon: Bug, tone: 'rose' },
  { key: 'feature', label: 'Özellik Önerisi', icon: Lightbulb, tone: 'amber' },
  { key: 'question', label: 'Soru / Yardım', icon: HelpCircle, tone: 'violet' },
];

const TOPIC_TONES = {
  blue: 'border-blue/40 bg-blue/10 text-blue',
  rose: 'border-red/40 bg-red/10 text-red',
  amber: 'border-yellow/40 bg-yellow/10 text-yellow',
  violet: 'border-purple/40 bg-purple/10 text-purple',
} as const;

export default function ContactPage() {
  const { toast } = useToast();
  const [profile, setProfile] = useState<LocalProfile | null>(null);

  const [topic, setTopic] = useState<Topic>('feedback');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const p = readProfile();
    setProfile(p);
    setSenderName(p.fullName);
    setSenderEmail(p.email);
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || message.trim().length < 10) {
      toast('Konu ve en az 10 karakterlik mesaj gerekli.', 'error');
      return;
    }
    if (!senderName.trim() || !senderEmail.trim()) {
      toast('Ad ve e-postanızı girin.', 'error');
      return;
    }
    setSending(true);
    try {
      const topicLabel = TOPICS.find((t) => t.key === topic)?.label ?? 'Geri Bildirim';
      await sendContactMessage({
        topic: topicLabel,
        subject: subject.trim(),
        message: message.trim(),
        senderName: senderName.trim(),
        senderEmail: senderEmail.trim(),
      });
      toast(`Mesajınız ${DEV.email} adresine iletildi.`, 'success');
      setSubject('');
      setMessage('');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Gönderim hatası', 'error');
    } finally {
      setSending(false);
    }
  }

  function mailto() {
    const topicLabel = TOPICS.find((t) => t.key === topic)?.label ?? '';
    const body = `Konu: ${subject}\n\n${message}`;
    window.location.href = `mailto:${DEV.email}?subject=${encodeURIComponent(
      `[${topicLabel}] ${subject || 'Geri Bildirim'}`
    )}&body=${encodeURIComponent(body)}`;
  }

  return (
    <main className="flex-1 p-6">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* HERO */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-bg2 via-white to-brand/5 p-8 md:p-12">
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-brand/8 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 left-1/3 w-72 h-72 rounded-full bg-blue/6 blur-3xl pointer-events-none" />

          <div className="relative max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-[11px] font-bold text-brand uppercase tracking-wider">
              <MessageSquare className="w-3 h-3" />
              İletişim
            </div>
            <h1 className="font-display text-3xl md:text-[36px] font-extrabold tracking-tight text-text leading-[1.1]">
              Sizden gelen her geri bildirim<br className="hidden md:block" />
              <span className="text-brand">platformu daha iyi yapar.</span>
            </h1>
            <p className="mt-3 text-[15px] md:text-base text-text2 leading-relaxed max-w-2xl">
              Hata bildirimi, özellik önerisi veya genel sorularınız için aşağıdaki formdan veya
              doğrudan iletişim kanallarından bana ulaşabilirsiniz.
            </p>
          </div>
        </div>

        {/* DEV CARD + FORM */}
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Geliştirici kartı */}
          <div className="overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-soft lg:col-span-5">
            <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-7 text-white">
              <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-brand/15 blur-2xl pointer-events-none" />
              <div className="relative">
                <div className="bg-brand/20 ring-brand/30 flex w-12 h-12 items-center justify-center rounded-xl ring-1 backdrop-blur">
                  <Sparkles className="text-white w-5 h-5" />
                </div>
                <div className="mt-5 text-[10px] font-bold tracking-[0.18em] text-brand-300 uppercase">
                  Geliştirici
                </div>
                <h2 className="mt-1.5 text-2xl font-bold tracking-tight">{DEV.name}</h2>
                <div className="text-sm text-slate-300 mt-0.5">{DEV.title}</div>
                <p className="mt-4 text-[12.5px] leading-relaxed text-slate-300/95 max-w-md">
                  Solar GES projelerinde aktif çalışan bir mühendis olarak konstrüksiyon hesabı,
                  tonaj ve maliyet süreçlerinde yaşadığım operasyonel ihtiyaçlardan doğan bu
                  platformu sektör paydaşlarının kullanımına sunuyorum.
                </p>
              </div>
            </div>

            <div className="p-4 space-y-1">
              <ContactRow href={`mailto:${DEV.email}`} icon={Mail} label="E-posta" value={DEV.email} />
              {DEV.phone && <ContactRow href={`tel:${DEV.phone.replace(/\s/g, '')}`} icon={Phone} label="Telefon" value={DEV.phone} />}
              <ContactRow href={DEV.linkedin} external icon={LinkedinIcon} label="LinkedIn" value="linkedin.com" />
            </div>
          </div>

          {/* Mesaj formu */}
          <div className="rounded-2xl bg-white border border-slate-200 shadow-soft lg:col-span-7">
            <div className="p-6 md:p-8">
              <div className="mb-6 pb-4 border-b border-slate-200">
                <div className="inline-flex items-center gap-1.5 mb-2 text-[10px] font-bold uppercase tracking-wider text-brand">
                  <Send className="w-3 h-3" />
                  Mesaj Formu
                </div>
                <h3 className="font-display text-xl font-extrabold tracking-tight text-text">Mesajınızı Bırakın</h3>
                <p className="text-sm text-text2 mt-1.5 max-w-xl">
                  Aşağıdaki formu doldurun. Yanıtınız doğrudan e-postanıza döner.
                </p>
              </div>

              <form onSubmit={submit} className="space-y-6">
                {/* Konu tipi */}
                <div>
                  <Label className="!mb-2 text-[11px] font-bold uppercase tracking-wider text-text3">Konu Türü</Label>
                  <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                    {TOPICS.map((t) => {
                      const Icon = t.icon;
                      const active = topic === t.key;
                      return (
                        <button
                          key={t.key}
                          type="button"
                          onClick={() => setTopic(t.key)}
                          className={cn(
                            'flex flex-col items-center gap-1.5 rounded-lg border-2 px-2 py-3 text-xs font-semibold transition-all',
                            active
                              ? TOPIC_TONES[t.tone]
                              : 'border-slate-200 bg-white text-text3 hover:bg-bg2 hover:text-text2'
                          )}
                        >
                          <Icon className="w-4 h-4" />
                          <span className="text-center leading-tight">{t.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Gönderen bilgileri */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Adınız Soyadınız">
                    <Input value={senderName} onChange={(e) => setSenderName(e.target.value)} placeholder="Adınız" required />
                  </Field>
                  <Field label="E-posta">
                    <Input
                      type="email"
                      value={senderEmail}
                      onChange={(e) => setSenderEmail(e.target.value)}
                      placeholder="ornek@firma.com"
                      required
                    />
                  </Field>
                </div>

                {/* Konu */}
                <div>
                  <Label htmlFor="subject" className="!mb-1.5 text-[11px] font-bold uppercase tracking-wider text-text3">
                    Konu
                  </Label>
                  <Input
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Kısa bir özet — örn. PDF çıktısında font sorunu"
                    required
                  />
                </div>

                {/* Mesaj */}
                <div>
                  <Label htmlFor="message" className="!mb-1.5 text-[11px] font-bold uppercase tracking-wider text-text3">
                    Mesaj
                  </Label>
                  <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Detaylı açıklama: hangi sayfada, hangi adımda yaşandı, ne bekleniyordu, ne oldu?"
                    rows={7}
                    required
                    minLength={10}
                  />
                  <div className="flex justify-between text-[11px] text-text3 mt-1">
                    <span>En az 10 karakter</span>
                    <span className={cn(message.length >= 10 && 'text-brand font-semibold')}>
                      {message.length} karakter
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-4">
                  <Button type="button" variant="outline" onClick={mailto} disabled={sending}>
                    <Mail className="w-4 h-4" />
                    E-posta ile Gönder
                  </Button>
                  <Button type="submit" disabled={sending}>
                    <Send className="w-4 h-4" />
                    {sending ? 'Gönderiliyor…' : 'Gönder'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* INFO KARTLARI */}
        <div className="grid gap-4 md:grid-cols-2">
          <InfoCard icon={ShieldCheck} tone="green" eyebrow="Veri Gizliliği" title="Verileriniz size aittir">
            Tüm proje, masa tipi, parça ve maliyet bilgileri kendi cihazınızdaki SQLite veritabanında
            izole tutulur. Geliştirici dahil <strong>hiçbir üçüncü taraf</strong> proje verilerinizi göremez.
          </InfoCard>

          <InfoCard icon={Info} tone="yellow" eyebrow="Sorumluluk Reddi" title="Yardımcı araç">
            Platform; tonaj hesabı, BOM listesi ve ön maliyet hesabında yol gösterici bir yardımcıdır.
            Üretilen PDF/Excel çıktıları
            <strong> resmi belge / hak ediş / hukuki delil yerine geçmez</strong>; nihai kararlar
            kullanıcı sorumluluğundadır.
          </InfoCard>
        </div>

        <DisclaimerSection />
      </div>
    </main>
  );
}

const INFO_TONES = {
  green: { border: 'border-green/30 bg-green/5', iconBg: 'bg-green text-white', text: 'text-green' },
  blue: { border: 'border-blue/30 bg-blue/5', iconBg: 'bg-blue text-white', text: 'text-blue' },
  yellow: { border: 'border-yellow/30 bg-yellow/5', iconBg: 'bg-yellow text-white', text: 'text-yellow' },
} as const;

function InfoCard({
  icon: Icon,
  tone,
  eyebrow,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  tone: keyof typeof INFO_TONES;
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  const t = INFO_TONES[tone];
  return (
    <div className={cn('rounded-2xl border bg-white p-5 shadow-soft', t.border)}>
      <div className="flex items-start gap-3">
        <div className={cn('flex w-10 h-10 shrink-0 items-center justify-center rounded-lg shadow-sm', t.iconBg)}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <div className={cn('text-[10px] font-bold tracking-wider uppercase', t.text)}>{eyebrow}</div>
          <h4 className="mt-0.5 text-sm font-bold text-text">{title}</h4>
          <p className="mt-2 text-xs leading-relaxed text-text2">{children}</p>
        </div>
      </div>
    </div>
  );
}

function ContactRow({
  href,
  external,
  icon: Icon,
  label,
  value,
}: {
  href: string;
  external?: boolean;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      className="flex items-center gap-3 rounded-lg border border-transparent px-3 py-2 transition-colors hover:border-slate-200 hover:bg-bg2"
    >
      <div className="bg-bg2 flex w-9 h-9 shrink-0 items-center justify-center rounded-lg text-text2">
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-text3 text-[10px] font-bold tracking-wider uppercase">{label}</div>
        <div className="text-text truncate text-sm font-semibold">{value}</div>
      </div>
    </a>
  );
}

const DISCLAIMER_SECTIONS = [
  {
    n: '1',
    title: 'Kullanım Amacı',
    body: (
      <>
        Solar BOM; solar GES projelerinde çelik konstrüksiyon tonaj ve ön maliyet hesabını
        kolaylaştırmak için geliştirilmiş bir <strong className="text-text">iç araç</strong>tır.
        Hesaplanan değerler yönlendirici göstergelerdir; nihai üretim ve satınalma kararları için
        ek doğrulama gerektirir.
      </>
    ),
  },
  {
    n: '2',
    title: 'Veri Sorumluluğu',
    body: (
      <>
        Sisteme girilen tüm bilgilerin doğruluğundan kullanıcı sorumludur. Eksik veya yanlış girilen
        veriler üzerinden yapılan hesaplamaların sonuçlarından doğacak{' '}
        <strong className="text-text">hiçbir maddi, manevi veya hukuki zarardan</strong>{' '}
        sorumlu tutulamaz.
      </>
    ),
  },
  {
    n: '3',
    title: 'Hukuki Bağlayıcılık',
    body: (
      <>
        Bu platformdan alınan PDF/Excel çıktıları, BOM listeleri, maliyet hesapları{' '}
        <strong className="text-text">hukuki delil veya resmi belge niteliği taşımaz.</strong> Teklif,
        sözleşme, hak ediş gibi resmi süreçlerde imzalı orijinal belgeler esas alınır.
      </>
    ),
  },
  {
    n: '4',
    title: 'Yedekleme & Kayıp',
    body: (
      <>
        Verilerin yedeklenmesinden kullanıcı sorumludur. Uygulama; donanım arızası, tarayıcı verisi
        silinmesi, beklenmedik hatalar veya 3. parti servis kesintileri sebebiyle oluşabilecek veri
        kaybından <strong className="text-text">sorumlu tutulamaz</strong>. SQLite dosyasını (
        <code className="font-mono text-xs">prisma/dev.db</code>) düzenli aralıklarla yedeklemeniz önerilir.
      </>
    ),
  },
] as const;

function DisclaimerSection() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-soft">
      <div className="bg-gradient-to-r from-yellow/15 via-yellow/8 to-white border-b border-yellow/30 px-6 py-5 flex items-start gap-4">
        <span className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-yellow text-white shadow-sm shrink-0">
          <Scale className="w-5 h-5" />
        </span>
        <div className="min-w-0">
          <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[1.4px] text-yellow">
            <ShieldAlert className="w-3 h-3" />
            Yasal Bildirim
          </div>
          <h3 className="font-display text-xl font-extrabold tracking-tight text-text mt-1 leading-tight">
            Sorumluluk Reddi
          </h3>
          <p className="text-[13px] text-text2 mt-1 leading-relaxed max-w-3xl">
            Bu uygulama bir tonaj/BOM hesaplama yardımcısıdır. Sözleşme, hukuki süreçler ve resmi
            raporlama için tek başına bağlayıcı kabul edilemez. Platformu kullanmaya devam ederek
            aşağıdaki şartları kabul etmiş sayılırsınız.
          </p>
        </div>
      </div>

      <div className="px-6 py-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
        {DISCLAIMER_SECTIONS.map((s) => (
          <div key={s.n} className="flex gap-3">
            <div className="shrink-0">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-yellow/15 text-yellow text-[11px] font-mono font-bold tabular-nums">
                {s.n}
              </span>
            </div>
            <div className="min-w-0">
              <h4 className="text-[13px] font-bold text-text tracking-tight">{s.title}</h4>
              <p className="text-[12.5px] text-text2 leading-relaxed mt-1">{s.body}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="px-6 py-3 border-t border-slate-200 bg-bg2/40 text-[10px] text-text3 font-mono flex justify-between">
        <span>Son güncelleme: 2026-05-25</span>
        <span>solar-bom-platformu</span>
      </div>
    </section>
  );
}
