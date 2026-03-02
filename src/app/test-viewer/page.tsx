
"use client";

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useDoc, useMemoFirebase, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Loader2, ArrowLeft, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

function TestViewerContent() {
  const searchParams = useSearchParams();
  const linkId = searchParams.get('id');
  const firestore = useFirestore();
  
  const docRef = useMemoFirebase(() => {
    if (!firestore || !linkId) return null;
    return doc(firestore, 'learningLinks', linkId);
  }, [firestore, linkId]);

  const { data, isLoading } = useDoc(docRef);

  if (!linkId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-900 mb-2">リンクIDが見つかりません</h2>
        <Link href="/">
          <Button variant="outline" className="rounded-full">ホームに戻る</Button>
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <p className="text-slate-500 font-bold">テストを読み込み中...</p>
      </div>
    );
  }

  if (!data || !data.testHtml) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-900 mb-2">確認テストが見つかりません</h2>
        <p className="text-slate-500 mb-6">この教材にはHTML形式のテストが設定されていない可能性があります。</p>
        <Link href="/">
          <Button variant="outline" className="rounded-full">ホームに戻る</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col overflow-hidden">
      <header className="bg-white border-b border-blue-100 p-4 flex items-center justify-between sticky top-0 z-10 h-16 shrink-0">
        <div className="flex items-center gap-4 max-w-full overflow-hidden">
          <Link href="/">
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-blue-50 text-blue-600">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex flex-col min-w-0">
            <h1 className="font-bold text-slate-900 truncate text-sm sm:text-base">{data.title}</h1>
            <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest">Confirmation Test Viewer</p>
          </div>
        </div>
      </header>
      <main className="flex-1 w-full bg-white relative">
        <iframe 
          srcDoc={data.testHtml} 
          className="w-full h-full border-none absolute inset-0"
          title="Confirmation Test"
          sandbox="allow-scripts allow-forms allow-same-origin"
        />
      </main>
    </div>
  );
}

export default function TestViewerPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    }>
      <TestViewerContent />
    </Suspense>
  );
}
