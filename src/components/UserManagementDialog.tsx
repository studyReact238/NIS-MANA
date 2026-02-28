
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useFirestore, useCollection, useMemoFirebase, useAuth } from '@/firebase';
import { collection, doc, deleteDoc, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserPlus, Trash2, Mail, Lock, User } from 'lucide-react';
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
  const firestore = useFirestore();
  const auth = useAuth();
  const { toast } = useToast();

  const usersRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'users');
  }, [firestore]);

  const { data: users, isLoading } = useCollection<any>(usersRef);

  const handleRegisterUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !firestore) return;

    setIsRegistering(true);
    try {
      // 現在の管理者の情報を一時保存
      const currentAdminEmail = auth.currentUser?.email;
      // 注意: Client SDKで他人のアカウントを作成すると、そのユーザーとしてログインされてしまうため
      // ここではプロトタイプとして作成後に管理者のパスワード再入力を求めるか、
      // 実際にはサーバーサイドで行うべき処理であることを考慮したUIにします。
      // 今回は「登録」ボタン押下時にFirestoreにドキュメントを作成し、
      // Authアカウントの作成は本来サーバーサイドで行うべきものとしてFirestoreベースで進めますが、
      // 要件を満たすためAuth作成を試みます（セッションが切れる警告を出す）。
      
      const confirmResult = window.confirm(
        "新規ユーザーを登録すると、セキュリティ上の制約により現在の管理者セッションが終了し、作成したユーザーでログインされます。よろしいですか？\n\n(本来はサーバーサイドで実行される処理です)"
      );
      
      if (!confirmResult) {
        setIsRegistering(false);
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;

      await setDoc(doc(firestore, 'users', newUser.uid), {
        id: newUser.uid,
        email: newUser.email,
        createdAt: Date.now()
      });

      toast({
        title: "ユーザー登録完了",
        description: `${email} を登録しました。新しいセッションでログインされました。`
      });
      
      setEmail('');
      setPassword('');
      onOpenChange(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "登録失敗",
        description: error.message || "エラーが発生しました。"
      });
    } finally {
      setIsRegistering(false);
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (!firestore) return;
    
    if (!window.confirm(`${userEmail} を削除しますか？\n(認証アカウントの削除は別途コンソールから行う必要があります)`)) {
      return;
    }

    const docRef = doc(firestore, 'users', userId);
    deleteDoc(docRef).catch(e => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: docRef.path,
        operation: 'delete'
      }));
    });

    toast({
      title: "削除完了",
      description: "Firestore上のユーザー情報を削除しました。"
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-4xl p-8 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="mb-6">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <UserPlus className="w-6 h-6 text-emerald-600" />
            ユーザー管理
          </DialogTitle>
          <DialogDescription>
            新規ユーザーの登録と、既存ユーザーの削除が行えます。
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* 登録フォーム */}
          <div className="space-y-4">
            <h3 className="text-sm font-black text-emerald-900 uppercase tracking-widest border-b pb-2">新規登録</h3>
            <form onSubmit={handleRegisterUser} className="space-y-4 pt-2">
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
                    required
                  />
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full rounded-2xl bg-emerald-600 hover:bg-emerald-700 font-bold h-11 shadow-md"
                disabled={isRegistering}
              >
                {isRegistering ? <Loader2 className="w-5 h-5 animate-spin" /> : "ユーザーを登録"}
              </Button>
            </form>
          </div>

          {/* ユーザー一覧 */}
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
  );
};
