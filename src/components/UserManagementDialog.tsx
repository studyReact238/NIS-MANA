
"use client";

import React, { useState, useEffect } from 'react';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc, deleteDoc, setDoc, updateDoc } from 'firebase/firestore';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { firebaseConfig } from '@/firebase/config';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2,
  UserPlus,
  Trash2,
  Mail,
  Lock,
  ShieldCheck,
  RefreshCw,
  Eye,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ExternalLink,
  Clock,
  User as UserIcon,
  Save,
  HelpCircle
} from 'lucide-react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useLinks } from '@/context/LinkContext';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

interface UserManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const UserManagementDialog: React.FC<UserManagementDialogProps> = ({ open, onOpenChange }) => {
  const { recalculateAllCounts, links } = useLinks();
  const { user } = useUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [grantAdmin, setGrantAdmin] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [showConfirmAlert, setShowConfirmAlert] = useState(false);

  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [userToDelete, setUserToDelete] = useState<{ id: string, email: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [editLastName, setEditLastName] = useState('');
  const [editFirstName, setEditFirstName] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

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

  useEffect(() => {
    if (selectedUser) {
      setEditLastName(selectedUser.lastName || '');
      setEditFirstName(selectedUser.firstName || '');
    }
  }, [selectedUser]);

  const sortedUsers = React.useMemo(() => {
    if (!users) return [];
    return [...users].sort((a, b) => {
      const timeA = a.lastLoginAt || 0;
      const timeB = b.lastLoginAt || 0;
      return timeB - timeA;
    });
  }, [users]);

  const userProgressRef = useMemoFirebase(() => {
    if (!firestore || !selectedUser) return null;
    return collection(firestore, 'users', selectedUser.id, 'progress');
  }, [firestore, selectedUser?.id]);

  const { data: selectedUserProgress, isLoading: isProgressLoading } = useCollection<any>(userProgressRef);

  const userLearningLinks = React.useMemo(() => {
    if (!selectedUserProgress || !links) return [];
    return selectedUserProgress
      .filter(p => p.status === 'learning')
      .map(p => {
        const link = links.find(l => l.id === p.id);
        return { id: p.id, title: link?.title || '不明なリンク', url: link?.url };
      });
  }, [selectedUserProgress, links]);

  const userCompletedLinks = React.useMemo(() => {
    if (!selectedUserProgress || !links) return [];
    return selectedUserProgress
      .filter(p => p.status === 'completed')
      .map(p => {
        const link = links.find(l => l.id === p.id);
        return { id: p.id, title: link?.title || '不明なリンク', url: link?.url };
      });
  }, [selectedUserProgress, links]);

  const initiateRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ variant: "destructive", title: "入力エラー", description: "メールアドレスとパスワードを入力してください。" });
      return;
    }
    if (password.length < 6) {
      toast({ variant: "destructive", title: "入力エラー", description: "パスワードは6文字以上で入力してください。" });
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
        lastName: lastName,
        firstName: firstName,
        createdAt: Date.now(),
        lastLoginAt: null
      });

      if (grantAdmin) {
        await setDoc(doc(firestore, 'admins', newUser.uid), {
          id: newUser.uid,
          email: newUser.email
        });
      }

      toast({ title: "ユーザー登録完了", description: `${email} を登録しました。` });
      setEmail(''); setPassword(''); setLastName(''); setFirstName(''); setGrantAdmin(false);
    } catch (error: any) {
      if (secondaryApp) await deleteApp(secondaryApp);
      toast({ variant: "destructive", title: "登録失敗", description: error.message });
    } finally {
      setIsRegistering(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!firestore || !selectedUser) return;
    setIsSavingProfile(true);
    try {
      const userDocRef = doc(firestore, 'users', selectedUser.id);
      await updateDoc(userDocRef, { lastName: editLastName, firstName: editFirstName });
      toast({ title: "更新完了", description: "プロフィール情報を更新しました。" });
      setSelectedUser((prev: any) => ({ ...prev, lastName: editLastName, firstName: editFirstName }));
    } catch (e: any) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: `users/${selectedUser.id}`,
        operation: 'update',
        requestResourceData: { lastName: editLastName, firstName: editFirstName }
      }));
    } finally {
      setIsSavingProfile(false);
    }
  };

  const toggleAdminStatus = async (userToUpdate: { id: string, email: string }, isCurrentlyAdmin: boolean) => {
    if (!firestore || !user) return;
    if (user.uid === userToUpdate.id) {
      toast({ variant: "destructive", title: "操作不可", description: "自分自身の管理者権限は変更できません。" });
      return;
    }
    try {
      if (isCurrentlyAdmin) {
        await deleteDoc(doc(firestore, 'admins', userToUpdate.id));
        toast({ title: "権限解除", description: `${userToUpdate.email} の管理者権限を解除しました。` });
      } else {
        await setDoc(doc(firestore, 'admins', userToUpdate.id), { id: userToUpdate.id, email: userToUpdate.email });
        toast({ title: "権限付与", description: `${userToUpdate.email} に管理者権限を付与しました。` });
      }
    } catch (e: any) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: `admins/${userToUpdate.id}`,
        operation: isCurrentlyAdmin ? 'delete' : 'create'
      }));
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

  const confirmDeleteUser = async () => {
    if (!firestore || !userToDelete) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(firestore, 'users', userToDelete.id));
      await deleteDoc(doc(firestore, 'admins', userToDelete.id));
      toast({ title: "削除完了", description: `${userToDelete.email} のデータを削除しました。` });
      if (selectedUser?.id === userToDelete.id) setSelectedUser(null);
      setUserToDelete(null);
    } catch (e: any) {
      console.error("Delete error: ", e);
      toast({ variant: "destructive", title: "エラー", description: "ユーザーの削除に失敗しました。" });
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: `users/${userToDelete.id}`, operation: 'delete' }));
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDisplayName = (u: any) => {
    if (u.lastName || u.firstName) {
      return `${u.lastName || ''} ${u.firstName || ''}`.trim();
    }
    return u.email?.split('@')[0] || 'ユーザー';
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(val) => { if (!val && (userToDelete || showConfirmAlert)) return; onOpenChange(val); if (!val) { setSelectedUser(null); setUserToDelete(null); } }}>
        <DialogContent
          className="max-w-4xl rounded-4xl p-8 max-h-[90vh] overflow-hidden flex flex-col"
          onInteractOutside={(e) => {
            if (userToDelete || showConfirmAlert) e.preventDefault();
          }}
        >
          <DialogHeader className="mb-6 shrink-0">
            <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-emerald-950">
              <ShieldCheck className="w-6 h-6 text-emerald-600" />
              ユーザー・システム管理
            </DialogTitle>
            <DialogDescription>
              新規ユーザーの登録、学習進捗の確認、データのメンテナンスを行います。
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 flex-1 overflow-hidden">
            <div className="md:col-span-4 space-y-6 overflow-y-auto pr-2">
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-emerald-100 pb-2">
                  <h3 className="text-xs font-black text-emerald-800 uppercase tracking-widest">新規ユーザー登録</h3>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button type="button" className="inline-flex items-center justify-center p-1 focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded-full">
                        <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="max-w-xs text-xs">
                      <p>新しいメンバーをシステムに登録します。登録後、初期パスワードでログイン可能です。</p>
                    </PopoverContent>
                  </Popover>
                </div>
                <form onSubmit={initiateRegister} className="space-y-4 pt-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="lastName" className="text-[10px] font-bold text-slate-500">姓</Label>
                      <Input id="lastName" placeholder="山田" value={lastName} onChange={(e) => setLastName(e.target.value)} className="rounded-xl h-9 border-emerald-100 text-xs" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="firstName" className="text-[10px] font-bold text-slate-500">名</Label>
                      <Input id="firstName" placeholder="太郎" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="rounded-xl h-9 border-emerald-100 text-xs" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-email" className="text-xs font-bold text-slate-600">メールアドレス</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-emerald-400" />
                      <Input id="new-email" type="email" placeholder="user@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9 rounded-xl h-10 border-emerald-100 text-xs" disabled={isRegistering} required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password" className="text-xs font-bold text-slate-600">初期パスワード</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-emerald-400" />
                      <Input id="new-password" type="password" placeholder="6文字以上" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-9 rounded-xl h-10 border-emerald-100 text-xs" disabled={isRegistering} required />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                    <Checkbox id="grant-admin" checked={grantAdmin} onCheckedChange={(c) => setGrantAdmin(c as boolean)} className="w-4 h-4 rounded-md border-emerald-300 data-[state=checked]:bg-emerald-600" />
                    <Label htmlFor="grant-admin" className="text-[11px] font-bold text-emerald-900 cursor-pointer">
                      管理者権限を付与する
                    </Label>
                  </div>
                  <Button type="submit" className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 font-bold h-10 text-xs shadow-md shadow-emerald-200" disabled={isRegistering}>
                    {isRegistering ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <UserPlus className="mr-2 h-3.5 w-3.5" />}
                    登録する
                  </Button>
                </form>
              </div>

              <div className="pt-6 border-t border-dashed border-emerald-100">
                <div className="flex items-center gap-2 pb-2">
                  <h3 className="text-xs font-black text-emerald-800 uppercase tracking-widest">システム・メンテナンス</h3>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button type="button" className="inline-flex items-center justify-center p-1 focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded-full">
                        <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="max-w-xs text-xs">
                      <p>学習中や完了人数の表示が実データと乖離した場合、全データを再スキャンして修正します。</p>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100 space-y-3">
                  <p className="text-[10px] text-amber-800 font-bold leading-relaxed">
                    学習状況のカウントが不正確な場合は、統計情報を再集計してください。
                  </p>
                  <Button
                    onClick={handleRecalculate}
                    disabled={isRecalculating}
                    variant="outline"
                    className="w-full rounded-xl bg-white border-amber-200 text-amber-800 hover:bg-amber-100 font-bold text-xs h-10"
                  >
                    {isRecalculating ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="mr-2 h-3.5 w-3.5" />}
                    統計情報を同期
                  </Button>
                </div>
              </div>
            </div>

            <div className="md:col-span-8 flex flex-col overflow-hidden bg-slate-50/50 rounded-3xl border border-emerald-50">
              {!selectedUser ? (
                <div className="flex flex-col h-full overflow-hidden">
                  <div className="p-4 border-b border-emerald-100 bg-white/80 flex items-center justify-between shrink-0">
                    <h3 className="text-sm font-black text-emerald-900 uppercase tracking-widest flex items-center gap-2">
                      登録済みユーザー
                      <Badge variant="outline" className="text-[10px] font-bold border-emerald-200 bg-emerald-50 text-emerald-700">{users?.length || 0}</Badge>
                    </h3>
                  </div>
                  <ScrollArea className="flex-1">
                    <div className="p-4 space-y-2">
                      {isUsersLoading ? (
                        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 text-emerald-600 animate-spin" /></div>
                      ) : sortedUsers?.map((u: any) => {
                        const isAdminUser = admins?.some(a => a.id === u.id) || false;
                        return (
                          <div key={u.id} className="group flex items-center justify-between p-3 bg-white rounded-2xl border border-emerald-100 hover:border-emerald-300 hover:shadow-md transition-all">
                            <div className="flex flex-col min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-emerald-950 truncate">{formatDisplayName(u)}</span>
                                {isAdminUser && <Badge className="bg-emerald-600 text-[8px] h-4 px-1.5 rounded-sm">Admin</Badge>}
                              </div>
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                                <div className="flex items-center gap-1.5">
                                  <Mail className="w-3 h-3 text-slate-300" />
                                  <span className="text-[10px] text-slate-400 font-medium truncate max-w-[120px]">{u.email}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <Clock className="w-3 h-3 text-slate-300" />
                                  <span className="text-[10px] text-slate-400 font-medium">
                                    {u.lastLoginAt ? format(u.lastLoginAt, 'MM/dd HH:mm', { locale: ja }) : '未ログイン'}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => toggleAdminStatus(u, isAdminUser)}
                                className={cn(
                                  "h-8 w-8 rounded-lg transition-all",
                                  isAdminUser ? "text-emerald-600 bg-emerald-50 hover:bg-emerald-100" : "text-slate-300 hover:text-emerald-600 hover:bg-emerald-50"
                                )}
                                title={isAdminUser ? "管理者権限を解除" : "管理者権限を付与"}
                              >
                                <ShieldCheck className={cn("w-3.5 h-3.5", isAdminUser && "fill-current")} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedUser(u)}
                                className="h-8 px-3 rounded-lg text-emerald-600 hover:bg-emerald-50 font-bold text-[10px]"
                              >
                                <Eye className="w-3.5 h-3.5 mr-1.5" /> 詳細
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setUserToDelete(u)}
                                className="h-8 w-8 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </div>
              ) : (
                <div className="flex flex-col h-full overflow-hidden">
                  <div className="p-4 border-b border-emerald-100 bg-white/80 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                      <Button variant="ghost" size="icon" onClick={() => setSelectedUser(null)} className="h-8 w-8 rounded-full hover:bg-emerald-100">
                        <ArrowLeft className="w-4 h-4 text-emerald-700" />
                      </Button>
                      <div className="min-w-0">
                        <h3 className="text-sm font-body font-bold text-emerald-900 truncate">{formatDisplayName(selectedUser)}</h3>
                        <p className="text-[10px] text-slate-400 font-bold">{selectedUser.email}</p>
                      </div>
                    </div>
                    {admins?.some(a => a.id === selectedUser.id) && <Badge className="bg-emerald-600 text-[9px] font-bold">管理者</Badge>}
                  </div>

                  <ScrollArea className="flex-1">
                    <div className="p-5 space-y-8">
                      <div className="space-y-4">
                        <h4 className="text-[11px] font-black text-emerald-800 uppercase tracking-widest flex items-center gap-2">
                          <UserIcon className="w-3.5 h-3.5" /> プロフィール編集
                        </h4>
                        <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <Label className="text-[10px] font-bold text-slate-500">姓</Label>
                              <Input value={editLastName} onChange={(e) => setEditLastName(e.target.value)} className="rounded-xl h-10 border-emerald-50 text-xs" placeholder="未登録" />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-[10px] font-bold text-slate-500">名</Label>
                              <Input value={editFirstName} onChange={(e) => setEditFirstName(e.target.value)} className="rounded-xl h-10 border-emerald-50 text-xs" placeholder="未登録" />
                            </div>
                          </div>
                          <Button onClick={handleUpdateProfile} disabled={isSavingProfile} className="w-full rounded-xl bg-emerald-600 h-10 font-bold text-xs">
                            {isSavingProfile ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : <Save className="w-3.5 h-3.5 mr-2" />}
                            氏名を更新する
                          </Button>
                        </div>
                      </div>

                      <Separator className="bg-emerald-100/50" />

                      {isProgressLoading ? (
                        <div className="flex flex-col items-center justify-center py-10 gap-3">
                          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                        </div>
                      ) : (
                        <div className="space-y-6">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="text-[11px] font-black text-blue-800 uppercase tracking-widest flex items-center gap-2">
                                <BookOpen className="w-3.5 h-3.5" /> 学習中のリンク
                              </h4>
                              <Badge variant="outline" className="text-[10px] border-blue-100 bg-blue-50 text-blue-700">{userLearningLinks.length}</Badge>
                            </div>
                            <div className="grid grid-cols-1 gap-2">
                              {userLearningLinks.length > 0 ? userLearningLinks.map(link => (
                                <div key={link.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-blue-100 shadow-sm">
                                  <span className="text-xs font-bold text-slate-800 truncate pr-4">{link.title}</span>
                                  {link.url && (
                                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700 p-1">
                                      <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                  )}
                                </div>
                              )) : (
                                <div className="p-8 text-center bg-white/40 rounded-xl border border-dashed border-slate-200">
                                  <p className="text-[10px] text-slate-400 font-bold italic">学習中のリンクはありません</p>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="text-[11px] font-black text-emerald-800 uppercase tracking-widest flex items-center gap-2">
                                <CheckCircle2 className="w-3.5 h-3.5" /> 受講済みのリンク
                              </h4>
                              <Badge variant="outline" className="text-[10px] border-emerald-100 bg-emerald-50 text-emerald-700">{userCompletedLinks.length}</Badge>
                            </div>
                            <div className="grid grid-cols-1 gap-2">
                              {userCompletedLinks.length > 0 ? userCompletedLinks.map(link => (
                                <div key={link.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-emerald-100 shadow-sm">
                                  <span className="text-xs font-bold text-slate-800 truncate pr-4">{link.title}</span>
                                  {link.url && (
                                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-emerald-500 hover:text-emerald-700 p-1">
                                      <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                  )}
                                </div>
                              )) : (
                                <div className="p-8 text-center bg-white/40 rounded-xl border border-dashed border-slate-200">
                                  <p className="text-[10px] text-slate-400 font-bold italic">受講済みのリンクはありません</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="pt-6 border-t border-emerald-100 shrink-0">
            <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl font-bold h-10 px-6">閉じる</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showConfirmAlert} onOpenChange={setShowConfirmAlert}>
        <AlertDialogContent className="rounded-4xl border-2 border-emerald-100 p-8">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-bold text-emerald-950">ユーザーを登録しますか？</AlertDialogTitle>
            <AlertDialogDescription className="text-base text-emerald-800 font-medium">「{email}」を新規登録します。</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8">
            <AlertDialogCancel className="rounded-2xl h-12 px-8 font-bold border-2 border-emerald-200">キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={handleRegisterUser} className="rounded-2xl bg-emerald-600 hover:bg-emerald-700 font-bold h-12 px-8">登録する</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!userToDelete} onOpenChange={(val) => { if (isDeleting) return; if (!val) setUserToDelete(null); }}>
        <AlertDialogContent className="rounded-4xl border-2 border-emerald-100 p-8">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-bold text-emerald-950">ユーザーを削除しますか？</AlertDialogTitle>
            <AlertDialogDescription className="text-base text-emerald-800 font-medium">
              「{userToDelete?.email}」のプロファイルと学習記録を削除します。この操作は取り消せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8">
            <AlertDialogCancel className="rounded-2xl h-12 px-8 font-bold border-2 border-emerald-200">キャンセル</AlertDialogCancel>
            <Button
              onClick={confirmDeleteUser}
              disabled={isDeleting}
              className="rounded-2xl bg-rose-600 hover:bg-rose-700 font-bold h-12 px-8 text-white shadow-lg shadow-rose-200"
            >
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              削除する
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
