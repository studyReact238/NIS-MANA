
"use client";

import React from 'react';
import { useLinks } from '@/context/LinkContext';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { CheckCircle2, Zap, Clock, Plus, Edit3, BookOpen, ShieldCheck, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

const TimelineItem = ({ activity, adminDocs }: { activity: any, adminDocs: any[] | null }) => {
  const firestore = useFirestore();
  
  // 最新のユーザー情報をデータベースから取得
  const userId = activity.userId;
  const userRef = useMemoFirebase(() => {
    if (!firestore || !userId) return null;
    return doc(firestore, 'users', userId);
  }, [firestore, userId]);
  
  const { data: userData, isLoading: isUserLoading } = useDoc<any>(userRef);

  // 管理者判定：コンテキストの管理者リスト、またはログの情報を参照
  const isUserAdmin = adminDocs?.some(a => a.id === userId) || !!activity.isAdmin;

  const getDisplayName = () => {
    if (isUserLoading) return '読み込み中...';
    
    // 姓名が登録されている場合はそれを優先
    if (userData?.lastName || userData?.firstName) {
      return `${userData.lastName || ''} ${userData.firstName || ''}`.trim() + 'さん';
    }

    // 次にメールアドレス（最新）
    if (userData?.email) {
      return `${userData.email.split('@')[0]}さん`;
    }

    // ログに残っている当時のメールアドレス
    if (activity.userEmail && activity.userEmail !== '' && activity.userEmail !== '不明なユーザー') {
      return `${activity.userEmail.split('@')[0]}さん`;
    }
    
    return '匿名ユーザーさん';
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'completion': return <CheckCircle2 className="w-5 h-5" />;
      case 'learning_started': return <BookOpen className="w-5 h-5" />;
      case 'link_added': return <Plus className="w-5 h-5" />;
      case 'link_updated': return <Edit3 className="w-5 h-5" />;
      default: return <BookOpen className="w-5 h-5" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'completion': return 'bg-emerald-50 border-emerald-200 text-emerald-600';
      case 'learning_started': return 'bg-blue-50 border-blue-200 text-blue-600';
      case 'link_added': return 'bg-blue-50 border-blue-200 text-blue-600';
      case 'link_updated': return 'bg-amber-50 border-amber-200 text-amber-600';
      default: return 'bg-slate-50 border-slate-200 text-slate-600';
    }
  };

  if (isUserLoading) {
    return (
      <div className="relative flex items-start gap-6 group py-2">
        <div className="w-11 h-11 rounded-2xl bg-slate-100 animate-pulse border-2 border-slate-50 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-32 bg-slate-100 animate-pulse rounded" />
          <div className="h-3 w-48 bg-slate-50 animate-pulse rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex items-start gap-6 group">
      <div className={cn(
        "relative z-10 w-11 h-11 rounded-2xl flex items-center justify-center border-2 shadow-sm transition-all group-hover:scale-110 shrink-0",
        getActivityColor(activity.type)
      )}>
        {getActivityIcon(activity.type)}
      </div>
      
      <div className="flex-1 pt-1 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-2">
             <span className={cn(
               "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-white border",
               activity.type === 'completion' ? 'text-emerald-600 border-emerald-100' :
               activity.type === 'learning_started' ? 'text-blue-600 border-blue-100' :
               activity.type === 'link_added' ? 'text-blue-600 border-blue-100' :
               'text-amber-600 border-amber-100'
             )}>
               {activity.type === 'completion' ? '受講完了' : 
                activity.type === 'learning_started' ? '学習開始' :
                activity.type === 'link_added' ? '新着追加' : '情報更新'}
             </span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
            <Clock className="w-3 h-3" />
            {activity.timestamp ? format(activity.timestamp, 'MM/dd HH:mm', { locale: ja }) : '---'}
          </div>
        </div>
        <div className="text-sm text-slate-600 leading-relaxed flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
          <span className={cn(
            "font-bold inline-flex items-center gap-1.5",
            activity.type === 'completion' ? "text-emerald-900" :
            activity.type === 'learning_started' ? "text-blue-900" :
            activity.type === 'link_added' ? "text-blue-900" : "text-amber-900"
          )}>
            {getDisplayName()}
            {isUserAdmin && (
              <ShieldCheck className="w-4 h-4 text-emerald-600 fill-emerald-600/10 shrink-0" title="管理者" />
            )}
          </span>
          <span>が</span>
          {activity.type === 'completion' ? (
            <>
              <span className="font-bold text-emerald-700">「{activity.linkTitle}」</span>
              <span>の受講を完了しました！</span>
            </>
          ) : activity.type === 'learning_started' ? (
            <>
              <span className="font-bold text-blue-700">「{activity.linkTitle}」</span>
              <span>の学習を開始しました！</span>
            </>
          ) : activity.type === 'link_added' ? (
            <>
              <span>新しいリンク</span>
              <span className="font-bold text-blue-700">「{activity.linkTitle}」</span>
              <span>を追加しました。</span>
            </>
          ) : (
            <>
              <span className="font-bold text-amber-700">「{activity.linkTitle}」</span>
              <span>の情報を更新しました。</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export const Timeline: React.FC = () => {
  const { activities, timelineLimit, setTimelineLimit, adminDocs } = useLinks();

  const limitOptions = [
    { label: '10件', value: 10 },
    { label: '50件', value: 50 },
    { label: 'すべて', value: 0 },
  ];

  return (
    <div className="bg-white rounded-[2.5rem] shadow-xl shadow-emerald-900/5 border border-emerald-100 overflow-hidden">
      <div className="p-6 sm:p-8 border-b border-emerald-50 bg-emerald-50/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-emerald-900">活動タイムライン</h2>
            <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider">Recent Learning Activity</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-white/50 p-1 rounded-xl border border-emerald-100">
          <span className="text-[10px] font-black text-emerald-700 px-2 uppercase tracking-tighter">表示件数:</span>
          {limitOptions.map((opt) => (
            <Button
              key={opt.label}
              variant={timelineLimit === opt.value ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setTimelineLimit(opt.value)}
              className={cn(
                "h-7 text-[10px] font-bold rounded-lg px-3 transition-all",
                timelineLimit === opt.value 
                  ? "bg-emerald-600 text-white shadow-sm" 
                  : "text-emerald-700 hover:bg-emerald-100"
              )}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>

      <ScrollArea className="h-[600px]">
        <div className="p-8">
          {activities.length > 0 ? (
            <div className="space-y-8 relative before:absolute before:inset-y-0 before:left-5 before:w-1 before:bg-emerald-50 before:rounded-full">
              {activities.map((activity) => (
                <TimelineItem 
                  key={activity.id} 
                  activity={activity} 
                  adminDocs={adminDocs}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100">
                <Clock className="w-8 h-8 text-slate-200" />
              </div>
              <p className="text-sm text-slate-400 font-bold italic">まだ活動記録はありません</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
