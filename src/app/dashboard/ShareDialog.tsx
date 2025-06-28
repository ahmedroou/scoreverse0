
"use client";

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Copy, Check, Share2, Loader2, Zap } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';
import { useAppContext } from '@/context/AppContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

interface ShareDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShareDialog({ isOpen, onOpenChange }: ShareDialogProps) {
  const { getLiveShareUrl } = useAppContext();
  const { toast } = useToast();
  const { t } = useLanguage();

  const [liveUrl, setLiveUrl] = useState('');
  const [isLiveLoading, setIsLiveLoading] = useState(false);
  const [copiedLink, setCopiedLink] = useState<'live' | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setLiveUrl('');
      setCopiedLink(null);
    }
  }, [isOpen]);

  const handleCopyToClipboard = (url: string) => {
    if (!url) return;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink('live');
      toast({ title: t('spaces.shareDialog.toasts.copied'), description: t('spaces.shareDialog.toasts.copySuccess') });
      setTimeout(() => setCopiedLink(null), 2500);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
      toast({ title: t('common.error'), description: t('spaces.shareDialog.toasts.copyError'), variant: "destructive" });
    });
  };

  const handleGetLiveLink = async () => {
    setIsLiveLoading(true);
    try {
      const url = await getLiveShareUrl();
      if (url) {
        setLiveUrl(url);
      } else {
        toast({ title: t('common.error'), description: t('spaces.shareDialog.toasts.error'), variant: "destructive" });
      }
    } finally {
      setIsLiveLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-primary text-2xl flex items-center gap-2"><Share2 /> {t('dashboard.shareTitle')}</DialogTitle>
          <DialogDescription>
            {t('dashboard.shareDescription')}
          </DialogDescription>
        </DialogHeader>
        <div className="px-6 pb-6">
            <Card className="flex flex-col">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Zap className="text-green-500" /> {t('share.liveLinkTitle')}</CardTitle>
                    <CardDescription>{t('share.liveLinkDescription')}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow flex flex-col justify-center">
                    {liveUrl ? (
                         <div className="space-y-2">
                            <Label htmlFor="live-link">{t('share.yourLiveLink')}</Label>
                            <div className="flex items-center space-x-2">
                            <Input id="live-link" value={liveUrl} readOnly />
                            <Button type="button" size="icon" variant="outline" onClick={() => handleCopyToClipboard(liveUrl)}>
                                {copiedLink === 'live' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                            </Button>
                            </div>
                        </div>
                    ) : (
                        <Button onClick={handleGetLiveLink} disabled={isLiveLoading} className="w-full">
                            {isLiveLoading ? <Loader2 className="animate-spin" /> : t('share.getLiveLink')}
                        </Button>
                    )}
                </CardContent>
            </Card>
        </div>
        <DialogFooter className="p-6 bg-muted/50 mt-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('common.close')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
