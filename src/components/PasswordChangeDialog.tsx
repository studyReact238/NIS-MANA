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
import { useAuth } from '@/firebase';
import { updatePassword } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Lock, ShieldCheck } from 'lucide-react';

interface PasswordChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PasswordChangeDialog: React.FC<PasswordChangeDialogProps> = ({ open, onOpenChange }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const auth = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "入力エラー",
        description: "パスワードが一致しません。"
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        variant: "destructive",
        title: "入力エラー",
        description: "パスワードは6文字以上で入力してください。"
      });
      return;
    }

    setIsLoading(true);
    try {
      if (auth?.currentUser) {
        await updatePassword(auth.currentUser, newPassword);
        toast({
          title: "パスワード変更完了",
          description: "パスワードを更新しました。"
        });
        setNewPassword('');
        setConfirmPassword('');
        onOpenChange(false);
      } else {
        throw new Error("ユーザーが認証されていません。");
      }
    } catch (error: any) {
      console.error(error);
      let message = "パスワードの更新に失敗しました。";
      if (error.code === 'auth/requires-recent-login') {
        message = "セキュリティ保護のため、再ログインしてからもう一度お試しください。";
      }
      toast({
        variant: "destructive",
        title: "エラー",
        description: message
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-4xl p-8">
        <DialogHeader className="mb-6">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-600" />
            パスワード変更
          </DialogTitle>
          <DialogDescription>
            新しいパスワードを入力してください。
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">新しいパスワード</Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="6文字以上"
                  className="pl-11 rounded-2xl h-12 border-emerald-100 focus:border-emerald-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">パスワード（確認）</Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="もう一度入力"
                  className="pl-11 rounded-2xl h-12 border-emerald-100 focus:border-emerald-500"
                  required
                />
              </div>
            </div>
          </div>

          <DialogFooter className="pt-4 flex gap-3 sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="rounded-2xl"
              disabled={isLoading}
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              className="rounded-2xl px-8 h-12 font-bold shadow-lg bg-emerald-600 hover:bg-emerald-700"
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "更新する"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
