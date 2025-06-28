
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
import { Copy, Check, Share2, Loader2 } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';
import { useAppContext } from '@/context/AppContext';

interface ShareDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShareDialog({ isOpen, onOpenChange }: ShareDialogProps) {
  const { getOrCreateShareLink } = useAppContext();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [shareUrl, setShareUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setShareUrl('');
      setIsCopied(false);

      getOrCreateShareLink()
        .then(shareId => {
          if (shareId) {
            const url = `${window.location.origin}/share/${shareId}`;
            setShareUrl(url);
          } else {
            toast({ title: t('common.error'), description: t('spaces.shareDialog.toasts.error'), variant: "destructive" });
          }
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isOpen, getOrCreateShareLink, toast, t]);

  const handleCopyToClipboard = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setIsCopied(true);
      toast({ title: t('spaces.shareDialog.toasts.copied'), description: t('spaces.shareDialog.toasts.copySuccess') });
      setTimeout(() => setIsCopied(false), 2000);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
      toast({ title: t('common.error'), description: t('spaces.shareDialog.toasts.copyError'), variant: "destructive" });
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card">
        <DialogHeader>
          <DialogTitle className="text-primary flex items-center gap-2"><Share2 /> {t('dashboard.shareTitle')}</DialogTitle>
          <DialogDescription>
            {t('dashboard.shareDescription')}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-20">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : shareUrl ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="share-link">{t('spaces.shareDialog.publicLink')}</Label>
                <div className="flex items-center space-x-2">
                  <Input id="share-link" value={shareUrl} readOnly />
                  <Button type="button" size="icon" onClick={handleCopyToClipboard}>
                    {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
             <p className="text-destructive text-center">{t('spaces.shareDialog.toasts.error')}</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('common.close')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
