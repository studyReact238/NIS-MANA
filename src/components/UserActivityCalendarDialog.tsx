
"use client";

import React, { useState, useMemo } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription
} from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { 
  CheckCircle2, 
  ThumbsUp, 
  Plus, 
  BookOpen, 
  LogIn, 
  Zap, 
  Clock,
  Calendar as CalendarIcon
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { format, isValid, startOfDay } from 'date-fns';
import { ja } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface UserActivityCalendarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const UserActivityCalendarDialog: React.FC<UserActivityCalendarDialogProps> = ({ open, onOpenChange }) => {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const userActivitiesQuery = useMemoFirebase(() => {
    // 完全に認証が確立され、UIDが取得できるまで待機
    if (!firestore || isUserLoading || !user?.uid || !open) return null;
    return query(
      collection(firestore, 'activities'),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc')
    );
  }, [firestore, user?.uid, isUserLoading, open]);

  const { data: userActivities, isLoading } = useCollection<any>(userActivitiesQuery);

  const activitiesByDate = useMemo(() => {
    if (!userActivities) return new Map<string, any[]>();
    const map = new Map<string, any[]>();
    userActivities.forEach(activity => {
      if (!activity.timestamp) return;
      const date = new Date(activity.timestamp);
      if (!isValid(date)) return;
      
      const dateKey = format(date, 'yyyy-MM-dd');
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)?.push(activity);
    });
    return map;
  }, [userActivities]);

  // 活動があった日のDateオブジェクト配列（modifiers用）
  const activityDates = useMemo(() => {
    return Array.from(activitiesByDate.keys()).map(dateStr => {
      const [year, month, day] = dateStr.split('-').map(Number);
      return new Date(year, month - 1, day);
    });
  }, [activitiesByDate]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'completion': return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'learning_started': return <BookOpen className="w-4 h-4 text-blue-600" />;
      case 'link_added': return <Plus className="w-4 h-4 text-blue-600" />;
      case 'login': return <LogIn className="w-4 h-4 text-indigo-600" />;
      case 'upvote': return <ThumbsUp className="w-4 h-4 text-rose-600" />;
      default: return <Zap className="w-4 h-4 text-slate-600" />;
    }
  };

  const getActivityLabel = (type: string) => {
    switch (type) {
      case 'completion': return '受講完了';
      case 'learning_started': return '学習開始';
      case 'link_added': return 'リンク作成';
      case 'login': return 'ログイン';
      case 'upvote': return '高評価';
      default: return 'アクティビティ';
    }
  };

  const selectedDateActivities = useMemo(() => {
    if (!selectedDate || !isValid(selectedDate)) return [];
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    return activitiesByDate.get(dateKey) || [];
  }, [selectedDate, activitiesByDate]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl rounded-4xl p-8 max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="mb-6 shrink-0">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-emerald-950">
            <CalendarIcon className="w-6 h-6 text-emerald-600" />
            アクティビティカレンダー
          </DialogTitle>
          <DialogDescription>
            あなた自身の学習や活動の履歴を振り返ることができます。
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 flex-1 overflow-hidden">
          <div className="md:col-span-5 flex flex-col items-center gap-4 bg-emerald-50/30 p-4 rounded-3xl border border-emerald-100">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              locale={ja}
              className="rounded-2xl border bg-white shadow-sm p-3"
              modifiers={{
                hasActivity: activityDates
              }}
              modifiersClassNames={{
                hasActivity: "relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:rounded-full after:bg-emerald-500 aria-selected:after:bg-white"
              }}
            />
          </div>

          <div className="md:col-span-7 flex flex-col bg-slate-50/50 rounded-3xl border border-emerald-50 overflow-hidden">
            <div className="p-4 border-b border-emerald-100 bg-white/80 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-emerald-950">
                    {selectedDate && isValid(selectedDate) ? format(selectedDate, 'yyyy年MM月dd日', { locale: ja }) : '日付を選択してください'}
                  </h3>
                </div>
              </div>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-black">
                {selectedDateActivities.length} 件の活動
              </Badge>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-6">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <LogIn className="w-8 h-8 text-emerald-200 animate-pulse" />
                    <p className="text-xs text-slate-400 font-bold">データを読み込み中...</p>
                  </div>
                ) : selectedDateActivities.length > 0 ? (
                  <div className="space-y-4">
                    {selectedDateActivities.map((activity, idx) => (
                      <div key={activity.id || idx} className="flex items-start gap-4 p-4 bg-white rounded-2xl border border-emerald-100 shadow-sm transition-all hover:border-emerald-300">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700">
                              {getActivityLabel(activity.type)}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400">
                              {format(activity.timestamp, 'HH:mm')}
                            </span>
                          </div>
                          <p className="text-sm font-bold text-slate-800 leading-tight">
                            {activity.linkTitle ? (
                              <>
                                <span className="text-emerald-700">「{activity.linkTitle}」</span>
                                {activity.type === 'completion' ? ' を受講完了しました' :
                                 activity.type === 'learning_started' ? ' の学習を開始しました' :
                                 activity.type === 'link_added' ? ' を作成しました' :
                                 activity.type === 'upvote' ? ' に高評価を付けました' : ' に動きがありました'}
                              </>
                            ) : (
                              activity.type === 'login' ? 'システムにログインしました' : 'アクティビティがありました'
                            )}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center border border-slate-100">
                      <Zap className="w-8 h-8 text-slate-100" />
                    </div>
                    <p className="text-sm text-slate-400 font-bold italic">この日の活動記録はありません</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-emerald-100 flex justify-end shrink-0">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl font-bold h-10 px-8">
            閉じる
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
