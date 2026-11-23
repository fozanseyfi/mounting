'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoginKitPage } from '@/components/auth/login-kit';
import { LOGIN_PLATFORM } from '@/lib/login-platform';
import { readProfile, writeProfile } from '@/lib/local-profile';
import { login } from '@/lib/session';

/*
 * Giriş sayfası. Görünüm bütün platformlarda ortak (components/auth/login-kit.tsx);
 * bu platforma özgü tanıtım ve ekranlar lib/login-platform.tsx'te.
 * Supabase girişi gelene kadar şifresiz yerel profil ile oturum açılır.
 */
export default function LoginPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<{ fullName: string; email: string } | null>(null);

  useEffect(() => {
    const p = readProfile();
    setProfile({ fullName: p.fullName, email: p.email });
  }, []);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const fullName = String(fd.get('fullName') ?? '').trim();
    if (!fullName) return;
    writeProfile({ fullName, email: String(fd.get('email') ?? '').trim() });
    login();
    router.replace('/');
  }

  return (
    <LoginKitPage
      // Profil tarayıcıdan okununca alanlar dolu gelsin diye yeniden kurulur
      key={profile ? 'loaded' : 'empty'}
      platform={LOGIN_PLATFORM}
      form={{
        mode: 'profile',
        onSubmit,
        defaultName: profile?.fullName,
        defaultEmail: profile?.email,
        note: 'Şifreli giriş, platformun kendi veritabanı bağlandığında açılacak.',
      }}
    />
  );
}
