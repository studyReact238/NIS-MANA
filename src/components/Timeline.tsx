
"use client";

import React from 'react';
import { useLinks } from '@/context/LinkContext';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { CheckCircle2, Zap, Clock } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export const Timeline: React.FC = () => {
  const { activities } = useLinks();

  return (
    <div className="mt-16 bg-white rounded-[2.5rem] shadow-xl shadow-emerald-900/5 border border-emerald-100 overflow-hidden">
      <div className="p-8 border-b border-emerald-50 bg-emerald-50/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-emerald-900">受講タイムライン</h2>
            <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider">Recent Learning Activity</p>
          </div>
        </div>
      </div>

      <ScrollArea className="h-[400px]">
        <div className="p-8">
          {activities.length > 0 ? (
            <div className="space-y-8 relative before:absolute before:inset-y-0 before:left-5 before:w-1 before:bg-emerald-50 before:rounded-full">
              {activities.map((activity, index) => (
                <div key={activity.id} className="relative flex items-start gap-6 group">
                  <div className={cn(
                    "relative z-10 w-11 h-11 rounded-2xl flex items-center justify-center border-2 shadow-sm transition-all group-hover:scale-110",
                    "bg-white border-emerald-200 text-emerald-600"
                  )}>
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  
                  <div className="flex-1 pt-1">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
                      <span className="text-sm font-bold text-emerald-900 truncate max-w-[200px]">
                        {activity.userEmail}
                      </span>
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                        <Clock className="w-3 h-3" />
                        {format(activity.timestamp, 'MM/dd HH:mm', { locale: ja })}
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      「<span className="font-bold text-emerald-700">{activity.linkTitle}</span>」の受講を完了しました！
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
