
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
import { createUserWithEmailAndPassword } from 'firebase/auth';
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
    console.log("--- [UserRegistration] START ---");
    
    if (!auth || !firestore) {
      console.error("[UserRegistration] Auth or Firestore not initialized", { auth: !!auth, firestore: !!firestore });
      toast({
        variant: "destructive",
        title: "システムエラー",
        description: "Firebaseの初期化が完了していません。ページをリロードしてください。"
      });
      return;
    }

    if (!email || !password) {
      console.warn("[UserRegistration] Missing email or password");
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
        description: "パスワードは6文字以上である必要があります。"
      });
      return;
    }

    setIsRegistering(true);
    console.log("[UserRegistration] Opening confirm dialog...");

    try {
      const confirmResult = window.confirm(
        "新規ユーザーを登録すると、現在の管理者セッションが終了し、作成したユーザーで自動的にログインされます。よろしいですか？\n\n(本来はサーバーサイドで行うべき処理ですが、プロトタイプ版ではこの挙動となります)"
      );
      
      if (!confirmResult) {
        console.log("[UserRegistration] Canceled by user");
        setIsRegistering(false);
        return;
      }

      console.log("[UserRegistration] Creating Auth account for:", email);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;
      console.log("[UserRegistration] Auth account created! UID:", newUser.uid);

      console.log("[UserRegistration] Saving user profile to Firestore...");
      await setDoc(doc(firestore, 'users', newUser.uid), {
        id: newUser.uid,
        email: newUser.email,
        createdAt: Date.now()
      });
      console.log("[UserRegistration] Firestore profile saved.");

      toast({
        title: "ユーザー登録完了",
        description: `${email} を登録し、ログインしました。`
      });
      
      setEmail('');
      setPassword('');
      onOpenChange(false);
    } catch (error: any) {
      console.error("[UserRegistration] FAILED:", error);
      let message = "登録中にエラーが発生しました。";
      if (error.code === 'auth/email-already-in-use') {
        message = "このメールアドレスは既に登録されています。";
      } else if (error.code === 'auth/invalid-email') {
        message = "無効なメールアドレス形式です。";
      } else if (error.code === 'auth/weak-password') {
        message = "パスワードが弱すぎます。";
      }
      
      toast({
        variant: "destructive",
        title: "登録失敗",
        description: error.message || message
      });
    } finally {
      setIsRegistering(false);
      console.log("--- [UserRegistration] END ---");
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (!firestore) return;
    
    if (!window.confirm(`${userEmail} を削除しますか？\n(認証アカウントの削除は別途コンソールから行う必要があります)`)) {
      return;
    }

    console.log("[UserDeletion] Deleting Firestore doc for:", userId);
    const docRef = doc(firestore, 'users', userId);
    deleteDoc(docRef).catch(e => {
      console.error("[UserDeletion] Permission Error:", e);
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
                {isRegistering ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    登録中...
                  </>
                ) : "ユーザーを登録"}
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
