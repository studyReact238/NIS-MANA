
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLinks } from '@/context/LinkContext';
import { LearningLink, LinkColor } from '@/types/link';
import { LINK_COLORS, LINK_ICONS } from '@/lib/constants';
import { X, Tag as TagIcon, Plus, ClipboardCheck, Upload, FileCode, Info, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface LinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editLink: LearningLink | null;
}

export const LinkDialog: React.FC<LinkDialogProps> = ({ open, onOpenChange, editLink }) => {
  const { addLink, updateLink, allTags } = useLinks();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    testUrl: '',
    testHtml: '',
    description: '',
    tags: [] as string[],
    color: 'emerald' as LinkColor,
    icon: 'book',
  });
  
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (open) {
      if (editLink) {
        setFormData({
          title: editLink.title,
          url: editLink.url,
          testUrl: editLink.testUrl || '',
          testHtml: editLink.testHtml || '',
          description: editLink.description || '',
          tags: editLink.tags,
          color: editLink.color,
          icon: editLink.icon,
        });
      } else {
        setFormData({
          title: '',
          url: '',
          testUrl: '',
          testHtml: '',
          description: '',
          tags: [],
          color: 'emerald',
          icon: 'book',
        });
      }
    }
  }, [editLink, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.url) return;

    if (editLink) {
      updateLink(editLink.id, { ...formData });
    } else {
      addLink({ ...formData });
    }
    onOpenChange(false);
  };

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !formData.tags.includes(trimmed)) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, trimmed] }));
    }
    setTagInput('');
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tagToRemove) }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'text/html' && !file.name.endsWith('.html')) {
      toast({
        variant: "destructive",
        title: "エラー",
        description: "HTMLファイルを選択してください。"
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setFormData(prev => ({ 
        ...prev, 
        testHtml: content,
        testUrl: '' // HTMLアップロード時はURLをクリア
      }));
      toast({
        title: "アップロード完了",
        description: "HTMLファイルを読み込みました。"
      });
    };
    reader.readAsText(file);
  };

  const suggestedTags = allTags.filter(t => !formData.tags.includes(t));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-4xl p-8">
        <DialogHeader className="mb-6">
          <DialogTitle className="text-3xl font-bold">
            {editLink ? 'リンク情報を編集' : '新しい教材を追加'}
          </DialogTitle>
          <DialogDescription>
            学習リソースのタイトル、URL、タグなどを入力して共有しましょう。
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2 col-span-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="title" className="text-base font-semibold">タイトル</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <button type="button" className="inline-flex items-center justify-center p-1 focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded-full">
                      <HelpCircle className="w-4 h-4 text-slate-400" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="max-w-xs text-xs">
                    <p>一覧画面で表示される教材の名前です。一目で内容がわかるようにしましょう。</p>
                  </PopoverContent>
                </Popover>
              </div>
              <Input 
                id="title" 
                value={formData.title} 
                onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="例: Next.jsの基礎を学ぶ" 
                className="rounded-2xl py-6 border-emerald-100 focus:border-emerald-500"
                required
              />
            </div>
            
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <div className="flex items-center gap-2">
                <Label htmlFor="url" className="text-base font-semibold">学習サイト URL</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <button type="button" className="inline-flex items-center justify-center p-1 focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded-full">
                      <HelpCircle className="w-4 h-4 text-slate-400" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="max-w-xs text-xs">
                    <p>教材のメインページとなるWebサイトのURLを入力してください。</p>
                  </PopoverContent>
                </Popover>
              </div>
              <Input 
                id="url" 
                value={formData.url} 
                onChange={e => setFormData(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://example.com" 
                className="rounded-2xl py-6 border-emerald-100 focus:border-emerald-500"
                required
              />
            </div>

            <div className="space-y-2 col-span-2 sm:col-span-1">
              <div className="flex items-center gap-2">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <ClipboardCheck className="w-4 h-4 text-blue-600" />
                  確認テスト
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <button type="button" className="inline-flex items-center justify-center p-1 focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded-full">
                      <HelpCircle className="w-4 h-4 text-slate-400" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="max-w-xs text-xs">
                    <p>外部ツール（Googleフォーム等）のURL、または自作のHTMLファイルを指定できます。</p>
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <Input 
                    id="testUrl" 
                    value={formData.testUrl} 
                    onChange={e => setFormData(prev => ({ ...prev, testUrl: e.target.value, testHtml: '' }))}
                    placeholder="URLまたはHTMLを選択" 
                    disabled={!!formData.testHtml}
                    className="rounded-2xl h-12 border-blue-100 focus:border-blue-500 flex-1"
                  />
                  <div className="relative">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept=".html"
                      className="hidden"
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => fileInputRef.current?.click()}
                      className={cn(
                        "rounded-2xl h-12 px-4 border-2 transition-all",
                        formData.testHtml 
                          ? "bg-blue-600 border-blue-700 text-white" 
                          : "border-blue-100 text-blue-600 hover:bg-blue-50"
                      )}
                    >
                      {formData.testHtml ? <FileCode className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                
                {formData.testHtml && (
                  <div className="flex items-center justify-between px-3 py-2 bg-blue-50 rounded-xl border border-blue-100">
                    <span className="text-[10px] font-bold text-blue-700">HTMLファイルを読み込み済み</span>
                    <button 
                      type="button" 
                      onClick={() => setFormData(prev => ({ ...prev, testHtml: '' }))}
                      className="text-blue-400 hover:text-rose-500"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3 col-span-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="description" className="text-base font-semibold">説明・メモ</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <button type="button" className="inline-flex items-center justify-center p-1 focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded-full">
                      <HelpCircle className="w-4 h-4 text-slate-400" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="max-w-xs text-xs">
                    <p>教材の要約や、学習時の注意点などを自由に記載してください。</p>
                  </PopoverContent>
                </Popover>
              </div>
              <Textarea 
                id="description" 
                value={formData.description} 
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="内容の要約や、学習時のアドバイスを入力..." 
                className="rounded-2xl min-h-[120px] resize-none border-emerald-100 focus:border-emerald-500"
              />
            </div>

            <div className="space-y-4 col-span-2">
              <div className="flex items-center gap-2">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <TagIcon className="w-4 h-4 text-emerald-600" />
                  タグの設定
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <button type="button" className="inline-flex items-center justify-center p-1 focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded-full">
                      <HelpCircle className="w-4 h-4 text-slate-400" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="max-w-xs text-xs">
                    <p>関連するキーワード（Next.js, UI/UX など）を入力して、後で探しやすくしましょう。</p>
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="flex flex-wrap gap-2 min-h-[40px] p-4 bg-emerald-50/30 rounded-2xl border border-emerald-100/50">
                {formData.tags.map(tag => (
                  <Badge key={tag} className="rounded-full px-3 py-1 flex items-center gap-1 bg-white border-2 border-emerald-100 shadow-sm text-emerald-900 hover:bg-white">
                    #{tag}
                    <button type="button" onClick={() => removeTag(tag)} className="ml-1 text-emerald-400 hover:text-rose-500 transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
                {formData.tags.length === 0 && <span className="text-xs text-slate-400 font-bold italic">タグを追加してください</span>}
              </div>

              <div className="flex gap-2">
                <Input 
                  value={tagInput} 
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag(tagInput))}
                  placeholder="タグを入力して追加..." 
                  className="rounded-2xl border-emerald-100 focus:border-emerald-500"
                />
                <Button type="button" onClick={() => addTag(tagInput)} className="rounded-2xl bg-emerald-600 hover:bg-emerald-700 px-6 font-bold shadow-md">
                  追加
                </Button>
              </div>
            </div>

            <div className="space-y-4 col-span-2">
              <div className="flex items-center gap-2">
                <Label className="text-base font-semibold">デザインの設定</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <button type="button" className="inline-flex items-center justify-center p-1 focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded-full">
                      <HelpCircle className="w-4 h-4 text-slate-400" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="max-w-xs text-xs">
                    <p>一覧画面でのカードの色とアイコンをカスタマイズできます。</p>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-6 bg-emerald-50/20 rounded-4xl border border-emerald-100">
                <div className="space-y-3">
                  <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block">テーマカラー</span>
                  <div className="flex gap-3">
                    {LINK_COLORS.map(c => (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, color: c.name }))}
                        className={cn(
                          "w-8 h-8 rounded-full border-4 transition-all",
                          c.class,
                          formData.color === c.name ? "border-white scale-110 ring-4 ring-emerald-200 shadow-lg" : "border-transparent opacity-60 hover:opacity-100"
                        )}
                        aria-label={`${c.name}色を選択`}
                      />
                    ))}
                  </div>
                </div>

                <div className="hidden sm:block h-10 w-px bg-emerald-100 mx-2" />

                <div className="space-y-3">
                  <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block">アイコンの種類</span>
                  <div className="flex flex-wrap gap-2">
                    {LINK_ICONS.map(i => {
                      const IconComp = i.icon;
                      return (
                        <button
                          key={i.name}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, icon: i.name }))}
                          className={cn(
                            "p-2.5 rounded-xl transition-all border-2",
                            formData.icon === i.name 
                              ? "bg-emerald-600 text-white border-emerald-700 scale-110 shadow-lg" 
                              : "bg-white border-emerald-100 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200"
                          )}
                          aria-label={`${i.name}アイコンを選択`}
                        >
                          <IconComp className="w-5 h-5" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-6 sm:justify-between items-center border-t border-emerald-100">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="rounded-2xl font-bold h-12 px-6">
              キャンセル
            </Button>
            <Button type="submit" className="rounded-2xl px-12 h-14 text-lg font-black shadow-xl shadow-emerald-200 bg-emerald-600 hover:bg-emerald-700">
              {editLink ? '変更を保存する' : 'リンクを保存する'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
