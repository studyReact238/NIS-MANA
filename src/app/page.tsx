
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { LinkProvider } from '@/context/LinkContext';
import { Dashboard } from '@/components/Dashboard';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // クライアントサイドでのマウントを確認
  useEffect(() => {
    setMounted(true);
  }, []);

  // 認証状態に基づいたリダイレクト処理
  useEffect(() => {
    if (mounted && !isUserLoading && !user) {
      router.replace('/login');
    }
  }, [user, isUserLoading, router, mounted]);

  // マウント前、または認証情報の読み込み中はローダーを表示
  if (!mounted || isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
          <p className="text-emerald-800 font-bold animate-pulse">読み込み中...</p>
        </div>
      </div>
    );
  }

  // ユーザーがいない場合はリダイレクト中なので何も表示しない（またはローダーを継続）
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
      </div>
    );
  }

  return (
    <LinkProvider>
      <main className="min-h-screen">
        <Dashboard />
      </main>
    </LinkProvider>
  );
}
