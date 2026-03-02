
"use client";

import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, deleteDoc, setDoc } from 'firebase/firestore';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { firebaseConfig } from '@/firebase/config';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserPlus, Trash2, Mail, Lock, ShieldCheck, RefreshCw } from 'lucide-react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useLinks } from '@/context/LinkContext';

interface UserManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const UserManagementDialog: React.FC<UserManagementDialogProps> = ({ open, onOpenChange }) => {
  const { recalculateAllCounts } = useLinks();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [grantAdmin, setGrantAdmin] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [showConfirmAlert, setShowConfirmAlert] = useState(false);
  const firestore = useFirestore();
  const { toast } = useToast();

  const usersRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'users');
  }, [firestore]);

  const adminsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'admins');
  }, [firestore]);

  const { data: users, isLoading: isUsersLoading } = useCollection<any>(usersRef);
  const { data: admins, isLoading: isAdminsLoading } = useCollection<any>(adminsRef);

  const initiateRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        variant: "destructive",
        title: "入力エラー",
        description: "メールアドレスとパスワードを入力してください。"
      });
      return;
    }
    if (password.length < 6) {
      toast({
        variant: "destructive",
        title: "入力エラー",
        description: "パスワードは6文字以上で入力してください。"
      });
      return;
    }
    setShowConfirmAlert(true);
  };

  const handleRegisterUser = async () => {
    setShowConfirmAlert(false);
    if (!firestore) return;

    setIsRegistering(true);
    let secondaryApp;

    try {
      const secondaryAppName = `SecondaryApp-${Date.now()}`;
      secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
      const secondaryAuth = getAuth(secondaryApp);

      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
      const newUser = userCredential.user;

      await signOut(secondaryAuth);
      await deleteApp(secondaryApp);
      secondaryApp = null;

      const userDocRef = doc(firestore, 'users', newUser.uid);
      await setDoc(userDocRef, {
        id: newUser.uid,
        email: newUser.email,
        createdAt: Date.now()
      });

      if (grantAdmin) {
        await setDoc(doc(firestore, 'admins', newUser.uid), {
          id: newUser.uid,
          email: newUser.email
        });
      }

      toast({ title: "ユーザー登録完了", description: `${email} を登録しました。` });
      setEmail(''); setPassword(''); setGrantAdmin(false);
    } catch (error: any) {
      if (secondaryApp) await deleteApp(secondaryApp);
      toast({ variant: "destructive", title: "登録失敗", description: error.message });
    } finally {
      setIsRegistering(false);
    }
  };

  const handleRecalculate = async () => {
    setIsRecalculating(true);
    try {
      await recalculateAllCounts();
      toast({ title: "同期完了", description: "学習中・受講済みの人数を正しく更新しました。" });
    } catch (error) {
      toast({ variant: "destructive", title: "エラー", description: "再集計に失敗しました。" });
    } finally {
      setIsRecalculating(false);
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (!firestore || !window.confirm(`${userEmail} を削除しますか？`)) return;
    try {
      await deleteDoc(doc(firestore, 'users', userId));
      await deleteDoc(doc(firestore, 'admins', userId));
      toast({ title: "削除完了", description: "ユーザー情報を削除しました。" });
    } catch (e: any) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: `users/${userId}`, operation: 'delete' }));
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl rounded-4xl p-8 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <UserPlus className="w-6 h-6 text-emerald-600" />
              ユーザー・システム管理
            </DialogTitle>
            <DialogDescription>
              新規ユーザーの登録とデータのメンテナンスを行います。
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-6">
              <h3 className="text-sm font-black text-emerald-900 uppercase tracking-widest border-b pb-2">新規登録</h3>
              <form onSubmit={initiateRegister} className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="new-email">メールアドレス</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
                    <Input id="new-email" type="email" placeholder="user@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-11 rounded-2xl h-11 border-emerald-100" disabled={isRegistering} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">初期パスワード</Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
                    <Input id="new-password" type="password" placeholder="6文字以上" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-11 rounded-2xl h-11 border-emerald-100" disabled={isRegistering} required />
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                  <Checkbox id="grant-admin" checked={grantAdmin} onCheckedChange={(c) => setGrantAdmin(c as boolean)} className="w-5 h-5 rounded-md border-emerald-300 data-[state=checked]:bg-emerald-600" />
                  <div className="grid gap-1.5 leading-none">
                    <Label htmlFor="grant-admin" className="text-sm font-bold text-emerald-900 cursor-pointer flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      管理者権限を付与する
                    </Label>
                  </div>
                </div>
                <Button type="submit" className="w-full rounded-2xl bg-emerald-600 hover:bg-emerald-700 font-bold h-12 shadow-lg shadow-emerald-200" disabled={isRegistering}>
                  {isRegistering ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "ユーザーを登録する"}
                </Button>
              </form>

              <div className="pt-6 border-t border-dashed border-emerald-200">
                <h3 className="text-sm font-black text-emerald-900 uppercase tracking-widest pb-2">メンテナンス</h3>
                <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 space-y-3">
                  <p className="text-[10px] text-amber-800 font-bold leading-relaxed">
                    既存データの「学習中」「受講済み」の人数が正しく表示されない場合は、以下のボタンで統計情報を再集計してください。
                  </p>
                  <Button 
                    onClick={handleRecalculate} 
                    disabled={isRecalculating}
                    variant="outline" 
                    className="w-full rounded-xl bg-white border-amber-200 text-amber-800 hover:bg-amber-100 font-bold text-xs h-10"
                  >
                    {isRecalculating ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="mr-2 h-3.5 w-3.5" />}
                    統計情報を同期する
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-sm font-black text-emerald-900 uppercase tracking-widest border-b pb-2 flex items-center justify-between">
                登録済みユーザー
                <Badge variant="outline" className="text-[10px] border-emerald-200">{users?.length || 0} 名</Badge>
              </h3>
              <ScrollArea className="h-[450px] pr-4">
                <div className="space-y-2 pt-2">
                  {isUsersLoading ? (
                    <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 text-emerald-600 animate-spin" /></div>
                  ) : users?.map((u: any) => (
                    <div key={u.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-emerald-50 shadow-sm">
                      <div className="flex flex-col min-w-0 mr-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-emerald-900 truncate">{u.email}</span>
                          {admins?.some(a => a.id === u.id) && <Badge className="bg-emerald-600 text-[8px] h-4 px-1.5 rounded-sm">Admin</Badge>}
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(u.id, u.email)} className="h-8 w-8 text-rose-400 hover:text-rose-600"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>

          <DialogFooter className="pt-6 border-t border-emerald-100">
            <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-2xl font-bold">閉じる</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showConfirmAlert} onOpenChange={setShowConfirmAlert}>
        <AlertDialogContent className="rounded-4xl border-2 border-emerald-100 p-8">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-bold">ユーザーを登録しますか？</AlertDialogTitle>
            <AlertDialogDescription className="text-base text-emerald-800 font-medium">「{email}」を新規登録します。</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8">
            <AlertDialogCancel className="rounded-2xl h-12 px-8 font-bold border-2 border-emerald-200">キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={handleRegisterUser} className="rounded-2xl bg-emerald-600 hover:bg-emerald-700 font-bold h-12 px-8">登録する</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
