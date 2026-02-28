
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
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, deleteDoc, setDoc } from 'firebase/firestore';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { firebaseConfig } from '@/firebase/config';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserPlus, Trash2, Mail, Lock } from 'lucide-react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

interface UserManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const UserManagementDialog: React.FC<UserManagementDialogProps> = ({ open, onOpenChange }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [showConfirmAlert, setShowConfirmAlert] = useState(false);
  const firestore = useFirestore();
  const { toast } = useToast();

  const usersRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'users');
  }, [firestore]);

  const { data: users, isLoading } = useCollection<any>(usersRef);

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
      // 管理者のセッションを維持するため、一時的なFirebaseアプリを作成してユーザー登録を行う
      const secondaryAppName = `SecondaryApp-${Date.now()}`;
      secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
      const secondaryAuth = getAuth(secondaryApp);

      console.log("[UserRegistration] Creating user with secondary auth...");
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
      const newUser = userCredential.user;
      console.log("[UserRegistration] Auth success! UID:", newUser.uid);

      // 作成したユーザーをすぐにログアウトさせ、一時的なアプリを削除する
      await signOut(secondaryAuth);
      await deleteApp(secondaryApp);
      secondaryApp = null;

      console.log("[UserRegistration] Creating Firestore document via main firestore...");
      const userDocRef = doc(firestore, 'users', newUser.uid);
      const userData = {
        id: newUser.uid,
        email: newUser.email,
        createdAt: Date.now()
      };
      
      await setDoc(userDocRef, userData);
      console.log("[UserRegistration] Firestore success!");

      toast({
        title: "ユーザー登録完了",
        description: `${email} を登録しました。`
      });
      
      setEmail('');
      setPassword('');
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

    const docRef = doc(firestore, 'users', userId);
    deleteDoc(docRef)
      .then(() => {
        toast({ title: "削除完了", description: "ユーザー情報を削除しました。" });
      })
      .catch(e => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: docRef.path,
          operation: 'delete'
        }));
      });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl rounded-4xl p-8 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <UserPlus className="w-6 h-6 text-emerald-600" />
              ユーザー管理
            </DialogTitle>
            <DialogDescription>
              新規ユーザーの登録と管理を行います。
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
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
                <Button 
                  type="submit" 
                  className="w-full rounded-2xl bg-emerald-600 hover:bg-emerald-700 font-bold h-11 shadow-md"
                  disabled={isRegistering}
                >
                  {isRegistering ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      登録中...
                    </>
                  ) : "ユーザーを登録"}
                </Button>
              </form>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-black text-emerald-900 uppercase tracking-widest border-b pb-2">
                登録済みユーザー ({users?.length || 0})
              </h3>
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-2 pt-2">
                  {isLoading ? (
                    <div className="flex justify-center py-10">
                      <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
                    </div>
                  ) : users && users.length > 0 ? (
                    users.map((u: any) => (
                      <div key={u.id} className="flex items-center justify-between p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 group">
                        <div className="flex flex-col min-w-0 mr-2">
                          <span className="text-xs font-bold text-emerald-900 truncate">{u.email}</span>
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
        <AlertDialogContent className="rounded-4xl border-2 border-emerald-100">
          <AlertDialogHeader>
            <AlertDialogTitle>ユーザーを登録しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              新規ユーザーを登録します。よろしいですか？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-2xl font-bold">キャンセル</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleRegisterUser}
              className="rounded-2xl bg-emerald-600 hover:bg-emerald-700 font-bold"
            >
              登録する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
