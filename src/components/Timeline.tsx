
"use client";

import React from 'react';
import { useLinks } from '@/context/LinkContext';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { CheckCircle2, Zap, Clock, Plus, Edit3, BookOpen, ShieldCheck } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const Timeline: React.FC = () => {
  const { activities, timelineLimit, setTimelineLimit } = useLinks();

  const formatDisplayName = (email?: string) => {
    if (!email) return '不明さん';
    return `${email.split('@')[0]}さん`;
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

  const getActivityText = (activity: any) => {
    const userName = formatDisplayName(activity.userEmail || activity.adminEmail);
    const adminBadge = activity.isAdmin ? <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 inline ml-1 align-middle" /> : null;
    
    switch (activity.type) {
      case 'completion':
        return (
          <>
            <span className="font-bold text-emerald-900">{userName}</span>
            {adminBadge} が
            「<span className="font-bold text-emerald-700">{activity.linkTitle}</span>」の受講を完了しました！
          </>
        );
      case 'learning_started':
        return (
          <>
            <span className="font-bold text-blue-900">{userName}</span>
            {adminBadge} が
            「<span className="font-bold text-blue-700">{activity.linkTitle}</span>」の学習を開始しました！
          </>
        );
      case 'link_added':
        return (
          <>
            <span className="font-bold text-blue-900">{userName}</span>
            {adminBadge} が
            新しいリンク「<span className="font-bold text-blue-700">{activity.linkTitle}</span>」を追加しました。
          </>
        );
      case 'link_updated':
        return (
          <>
            <span className="font-bold text-amber-900">{userName}</span>
            {adminBadge} が
            「<span className="font-bold text-amber-700">{activity.linkTitle}</span>」の情報を更新しました。
          </>
        );
      default:
        return activity.linkTitle;
    }
  };

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
                <div key={activity.id} className="relative flex items-start gap-6 group">
                  <div className={cn(
                    "relative z-10 w-11 h-11 rounded-2xl flex items-center justify-center border-2 shadow-sm transition-all group-hover:scale-110",
                    getActivityColor(activity.type)
                  )}>
                    {getActivityIcon(activity.type)}
                  </div>
                  
                  <div className="flex-1 pt-1">
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
                        {format(activity.timestamp, 'MM/dd HH:mm', { locale: ja })}
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {getActivityText(activity)}
                    </p>
                  </div>
                </div>
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
