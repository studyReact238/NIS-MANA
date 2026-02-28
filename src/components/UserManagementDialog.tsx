
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
import { Loader2, UserPlus, Trash2, Mail, Lock, ShieldCheck } from 'lucide-react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

interface UserManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const UserManagementDialog: React.FC<UserManagementDialogProps> = ({ open, onOpenChange }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [grantAdmin, setGrantAdmin] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
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
    console.log("--- [UserRegistration] EXECUTE START ---");
    setShowConfirmAlert(false);
    
    if (!firestore) {
      toast({
        variant: "destructive",
        title: "システムエラー",
        description: "Firestoreが初期化されていません。"
      });
      return;
    }

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

      // 1. プロフィール作成
      const userDocRef = doc(firestore, 'users', newUser.uid);
      const userData = {
        id: newUser.uid,
        email: newUser.email,
        createdAt: Date.now()
      };
      await setDoc(userDocRef, userData);

      // 2. 管理者権限の付与 (必要な場合)
      if (grantAdmin) {
        const adminDocRef = doc(firestore, 'admins', newUser.uid);
        await setDoc(adminDocRef, {
          id: newUser.uid,
          email: newUser.email
        });
      }

      toast({
        title: "ユーザー登録完了",
        description: `${email} を登録しました。${grantAdmin ? '（管理者権限付与済み）' : ''}`
      });
      
      setEmail('');
      setPassword('');
      setGrantAdmin(false);
    } catch (error: any) {
      console.error("[UserRegistration] ERROR:", error);
      if (secondaryApp) await deleteApp(secondaryApp);
      
      let message = "登録中にエラーが発生しました。";
      if (error.code === 'auth/email-already-in-use') message = "このメールアドレスは既に登録されています。";
      else if (error.code === 'auth/invalid-email') message = "メールアドレスの形式が正しくありません。";
      else if (error.code === 'auth/weak-password') message = "パスワードが短すぎます。";
      
      toast({
        variant: "destructive",
        title: "登録失敗",
        description: message
      });
    } finally {
      setIsRegistering(false);
      console.log("--- [UserRegistration] EXECUTE END ---");
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (!firestore) return;
    
    const confirmResult = window.confirm(`${userEmail} を削除しますか？`);
    if (!confirmResult) return;

    // ユーザーと管理者の両方のドキュメントを削除
    const userDocRef = doc(firestore, 'users', userId);
    const adminDocRef = doc(firestore, 'admins', userId);

    try {
      await deleteDoc(userDocRef);
      // 管理者でない場合はエラーが出る可能性があるが、存在しないドキュメントの削除は基本成功する
      await deleteDoc(adminDocRef);
      
      toast({ title: "削除完了", description: "ユーザー情報を削除しました。" });
    } catch (e: any) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: userDocRef.path,
        operation: 'delete'
      }));
    }
  };

  const isUserAdmin = (uid: string) => {
    return admins?.some(a => a.id === uid);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl rounded-4xl p-8 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <UserPlus className="w-6 h-6 text-emerald-600" />
              ユーザー管理
            </DialogTitle>
            <DialogDescription>
              新規ユーザーの登録と管理を行います。
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
                    <Input
                      id="new-email"
                      type="email"
                      placeholder="user@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-11 rounded-2xl h-11 border-emerald-100"
                      disabled={isRegistering}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">初期パスワード</Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
                    <Input
                      id="new-password"
                      type="password"
                      placeholder="6文字以上"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-11 rounded-2xl h-11 border-emerald-100"
                      disabled={isRegistering}
                      required
                    />
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                  <Checkbox 
                    id="grant-admin" 
                    checked={grantAdmin} 
                    onCheckedChange={(checked) => setGrantAdmin(checked as boolean)}
                    className="w-5 h-5 rounded-md border-emerald-300 data-[state=checked]:bg-emerald-600"
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label htmlFor="grant-admin" className="text-sm font-bold text-emerald-900 cursor-pointer flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      管理者権限を付与する
                    </Label>
                    <p className="text-[10px] text-emerald-600 font-medium">
                      リンクの登録・編集、ユーザー管理が可能になります。
                    </p>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full rounded-2xl bg-emerald-600 hover:bg-emerald-700 font-bold h-12 shadow-lg shadow-emerald-200 mt-2"
                  disabled={isRegistering}
                >
                  {isRegistering ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      登録中...
                    </>
                  ) : "ユーザーを登録する"}
                </Button>
              </form>
            </div>

            <div className="space-y-6">
              <h3 className="text-sm font-black text-emerald-900 uppercase tracking-widest border-b pb-2 flex items-center justify-between">
                登録済みユーザー
                <Badge variant="outline" className="text-[10px] border-emerald-200">
                  {users?.length || 0} 名
                </Badge>
              </h3>
              <ScrollArea className="h-[350px] pr-4">
                <div className="space-y-2 pt-2">
                  {isUsersLoading || isAdminsLoading ? (
                    <div className="flex justify-center py-10">
                      <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
                    </div>
                  ) : users && users.length > 0 ? (
                    users.map((u: any) => (
                      <div key={u.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-emerald-50 shadow-sm group hover:border-emerald-200 transition-colors">
                        <div className="flex flex-col min-w-0 mr-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-emerald-900 truncate">{u.email}</span>
                            {isUserAdmin(u.id) && (
                              <Badge className="bg-emerald-600 hover:bg-emerald-600 text-[8px] h-4 px-1.5 rounded-sm font-black uppercase tracking-tighter">
                                Admin
                              </Badge>
                            )}
                          </div>
                          <span className="text-[9px] text-slate-400 truncate">UID: {u.id}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteUser(u.id, u.email)}
                          className="h-8 w-8 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10 text-slate-400 text-xs italic">
                      ユーザーがいません
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>

          <DialogFooter className="pt-6 border-t border-emerald-100">
            <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-2xl font-bold">
              閉じる
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showConfirmAlert} onOpenChange={setShowConfirmAlert}>
        <AlertDialogContent className="rounded-4xl border-2 border-emerald-100 p-8">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-bold text-emerald-950">ユーザーを登録しますか？</AlertDialogTitle>
            <AlertDialogDescription className="text-base text-emerald-800 font-medium">
              「{email}」を新規ユーザーとして登録します。<br/>
              {grantAdmin && <span className="text-rose-600 font-bold">※管理者権限が付与されます。</span>}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8">
            <AlertDialogCancel className="rounded-2xl h-12 px-8 font-bold border-2 border-emerald-200">キャンセル</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleRegisterUser}
              className="rounded-2xl bg-emerald-600 hover:bg-emerald-700 font-bold h-12 px-8 shadow-lg shadow-emerald-200"
            >
              登録する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
