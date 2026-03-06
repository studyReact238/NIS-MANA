
"use client";

import React, { useState, useEffect, useRef } from 'react';
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
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAuth, useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { updatePassword } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Lock, User, Camera, Save, Check, Trash2, X } from 'lucide-react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

interface ProfileSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ProfileSettingsDialog: React.FC<ProfileSettingsDialogProps> = ({ open, onOpenChange }) => {
  const { user } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);

  const { data: userData } = useDoc<any>(userDocRef);

  useEffect(() => {
    if (userData && open) {
      setLastName(userData.lastName || '');
      setFirstName(userData.firstName || '');
      setPhotoURL(userData.photoURL || '');
    }
  }, [userData, open]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 500 * 1024) {
      toast({ 
        variant: "destructive", 
        title: "画像サイズエラー", 
        description: "画像サイズは500KB以下にしてください。" 
      });
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast({ variant: "destructive", title: "エラー", description: "画像ファイルを選択してください。" });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setPhotoURL(base64);
      toast({ title: "画像を読み込みました", description: "「保存」ボタンを押すと反映されます。" });
    };
    reader.readAsDataURL(file);
    // 同じファイルを再度選択できるようにリセット
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemovePhoto = () => {
    setPhotoURL('');
    toast({ title: "画像を解除しました", description: "「保存」ボタンを押すと反映されます。" });
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !user?.uid) return;

    setIsSavingProfile(true);
    const userRef = doc(firestore, 'users', user.uid);
    const updateData = {
      lastName,
      firstName,
      photoURL: photoURL || ''
    };

    updateDoc(userRef, updateData)
      .then(() => {
        toast({ title: "プロフィール更新", description: "情報を保存しました。" });
        setIsSavingProfile(false);
      })
      .catch(async (error) => {
        setIsSavingProfile(false);
        const permissionError = new FirestorePermissionError({
          path: userRef.path,
          operation: 'update',
          requestResourceData: updateData,
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth?.currentUser) return;

    if (newPassword !== confirmPassword) {
      toast({ variant: "destructive", title: "入力エラー", description: "パスワードが一致しません。" });
      return;
    }

    if (newPassword.length < 6) {
      toast({ variant: "destructive", title: "入力エラー", description: "パスワードは6文字以上で入力してください。" });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      await updatePassword(auth.currentUser, newPassword);
      toast({ title: "パスワード更新", description: "正常に変更されました。" });
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      let message = "パスワードの変更に失敗しました。";
      if (error.code === 'auth/requires-recent-login') {
        message = "セキュリティ保護のため、一度ログアウトしてから再ログインして試してください。";
      }
      toast({ variant: "destructive", title: "エラー", description: message });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const displayName = `${lastName} ${firstName}`.trim() || user?.email?.split('@')[0] || 'User';
  const initials = displayName.substring(0, 1).toUpperCase();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-4xl p-8 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="mb-6">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <User className="w-6 h-6 text-emerald-600" />
            プロフィール設定
          </DialogTitle>
          <DialogDescription>
            あなたの表示名やアイコン、パスワードを設定します。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-8">
          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div className="flex flex-col items-center gap-4">
              <div className="relative group">
                <Avatar className="w-24 h-24 border-4 border-emerald-100 shadow-lg">
                  <AvatarImage src={photoURL || undefined} className="object-cover" />
                  <AvatarFallback className="bg-emerald-100 text-emerald-700 text-3xl font-black">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 bg-white/20 rounded-full hover:bg-white/40 transition-colors"
                    title="画像を変更"
                  >
                    <Camera className="w-6 h-6 text-white" />
                  </button>
                  {photoURL && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="p-2 bg-rose-500/80 rounded-full hover:bg-rose-600 transition-colors"
                      title="画像を削除"
                    >
                      <Trash2 className="w-6 h-6 text-white" />
                    </button>
                  )}
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoUpload}
                  accept="image/*"
                  className="hidden"
                />
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">
                画像をタップして変更または削除<br />（500KB以下の正方形を推奨）
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lastName">姓</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="rounded-xl h-11 border-emerald-100"
                  placeholder="山田"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="firstName">名</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="rounded-xl h-11 border-emerald-100"
                  placeholder="太郎"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSavingProfile}
              className="w-full rounded-xl h-12 bg-emerald-600 hover:bg-emerald-700 font-bold shadow-md shadow-emerald-200"
            >
              {isSavingProfile ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              プロフィールを保存
            </Button>
          </form>

          <div className="h-px bg-slate-100" />

          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Lock className="w-3.5 h-3.5" /> パスワード変更
            </h4>
            <div className="space-y-2">
              <Label htmlFor="new-password">新しいパスワード</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="rounded-xl h-11 border-emerald-100"
                placeholder="6文字以上"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">確認用パスワード</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="rounded-xl h-11 border-emerald-100"
                placeholder="もう一度入力"
              />
            </div>
            <Button
              type="submit"
              disabled={isUpdatingPassword}
              variant="outline"
              className="w-full rounded-xl h-11 border-2 border-emerald-100 text-emerald-700 font-bold hover:bg-emerald-50"
            >
              {isUpdatingPassword ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
              パスワードを更新
            </Button>
          </form>
        </div>

        <DialogFooter className="mt-8 pt-4 border-t border-slate-50">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl font-bold h-10 px-6">
            閉じる
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
