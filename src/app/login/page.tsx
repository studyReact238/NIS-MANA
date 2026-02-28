"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser } from '@/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, Lock, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({ title: "ログイン成功", description: "おかえりなさい！" });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "ログイン失敗",
        description: "メールアドレスまたはパスワードが正しくありません。"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      toast({ title: "アカウント作成成功", description: "にすまなへようこそ！" });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "アカウント作成失敗",
        description: error.message || "エラーが発生しました。"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isUserLoading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-emerald-50/50 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex w-16 h-16 bg-emerald-600 rounded-3xl items-center justify-center text-white font-black text-3xl shadow-xl transform rotate-3">
            に
          </div>
          <h1 className="text-4xl font-black text-emerald-950 tracking-tight">にすまな</h1>
          <p className="text-emerald-700 font-bold">あなたの学びを、もっとスマートに。</p>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-12 bg-emerald-100/50 rounded-2xl p-1 gap-1 border border-emerald-200 mb-6">
            <TabsTrigger value="login" className="rounded-xl font-bold data-[state=active]:bg-white data-[state=active]:text-emerald-800">ログイン</TabsTrigger>
            <TabsTrigger value="register" className="rounded-xl font-bold data-[state=active]:bg-white data-[state=active]:text-emerald-800">新規登録</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <Card className="rounded-4xl border-2 border-emerald-100 shadow-2xl shadow-emerald-900/10">
              <form onSubmit={handleSignIn}>
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-emerald-950">おかえりなさい</CardTitle>
                  <CardDescription>登録済みのメールアドレスでログインしてください。</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">メールアドレス</Label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-11 rounded-2xl h-12 border-emerald-100 focus:border-emerald-500"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">パスワード</Label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-11 rounded-2xl h-12 border-emerald-100 focus:border-emerald-500"
                        required
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    type="submit"
                    className="w-full h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-lg font-bold shadow-lg shadow-emerald-200"
                    disabled={isLoading}
                  >
                    {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <ArrowRight className="mr-2 h-5 w-5" />}
                    ログイン
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>

          <TabsContent value="register">
            <Card className="rounded-4xl border-2 border-emerald-100 shadow-2xl shadow-emerald-900/10">
              <form onSubmit={handleSignUp}>
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-emerald-950">アカウント作成</CardTitle>
                  <CardDescription>にすまなを始めるための情報を入力してください。</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reg-email">メールアドレス</Label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
                      <Input
                        id="reg-email"
                        type="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-11 rounded-2xl h-12 border-emerald-100 focus:border-emerald-500"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-password">パスワード</Label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
                      <Input
                        id="reg-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-11 rounded-2xl h-12 border-emerald-100 focus:border-emerald-500"
                        required
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    type="submit"
                    className="w-full h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-lg font-bold shadow-lg shadow-emerald-200"
                    disabled={isLoading}
                  >
                    {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <ArrowRight className="mr-2 h-5 w-5" />}
                    新規登録
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
        </Tabs>

        <p className="text-center text-xs text-emerald-600/60 font-medium">
          &copy; 2024 にすまな - All rights reserved.
        </p>
      </div>
    </div>
  );
}
