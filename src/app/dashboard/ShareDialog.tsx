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
import { Copy, Check, Share2, Loader2, Link2, Zap } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';
import { useAppContext } from '@/context/AppContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Alert, AlertTitle } from '@/components/ui/alert';

interface ShareDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShareDialog({ isOpen, onOpenChange }: ShareDialogProps) {
  const { getLiveShareUrl, createSnapshotUrl } = useAppContext();
  const { toast } = useToast();
  const { t } = useLanguage();

  const [liveUrl, setLiveUrl] = useState('');
  const [snapshotUrl, setSnapshotUrl] = useState('');
  const [isLiveLoading, setIsLiveLoading] = useState(false);
  const [isSnapshotLoading, setIsSnapshotLoading] = useState(false);
  const [copiedLink, setCopiedLink] = useState<'live' | 'snapshot' | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setLiveUrl('');
      setSnapshotUrl('');
      setCopiedLink(null);
    }
  }, [isOpen]);

  const handleCopyToClipboard = (url: string, type: 'live' | 'snapshot') => {
    if (!url) return;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(type);
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
  
  const handleCreateSnapshot = async () => {
    setIsSnapshotLoading(true);
    try {
      const url = await createSnapshotUrl();
      if (url) {
        setSnapshotUrl(url);
      } else {
        toast({ title: t('common.error'), description: t('spaces.shareDialog.toasts.error'), variant: "destructive" });
      }
    } finally {
      setIsSnapshotLoading(false);
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-card p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-primary text-2xl flex items-center gap-2"><Share2 /> {t('dashboard.shareTitle')}</DialogTitle>
          <DialogDescription>
            {t('dashboard.shareDescription')}
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-6 max-h-[70vh] overflow-y-auto">
            {/* Live Share Card */}
            <Card className="flex flex-col">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Zap className="text-green-500" /> Live Share</CardTitle>
                    <CardDescription>A permanent link that always shows your latest data. Updates automatically.</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow flex flex-col justify-center">
                    {liveUrl ? (
                         <div className="space-y-2">
                            <Label htmlFor="live-link">Your Live Link</Label>
                            <div className="flex items-center space-x-2">
                            <Input id="live-link" value={liveUrl} readOnly />
                            <Button type="button" size="icon" variant="outline" onClick={() => handleCopyToClipboard(liveUrl, 'live')}>
                                {copiedLink === 'live' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                            </Button>
                            </div>
                        </div>
                    ) : (
                        <Button onClick={handleGetLiveLink} disabled={isLiveLoading} className="w-full">
                            {isLiveLoading ? <Loader2 className="animate-spin" /> : 'Get Live Link'}
                        </Button>
                    )}
                </CardContent>
            </Card>

            {/* Snapshot Share Card */}
            <Card className="flex flex-col">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Link2 className="text-blue-500"/> Point-in-Time Snapshot</CardTitle>
                    <CardDescription>A one-time link of the current stats. This link will not update.</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow flex flex-col justify-center">
                    {snapshotUrl ? (
                        <div className="space-y-2">
                           <Label htmlFor="snapshot-link">Your Snapshot Link</Label>
                           <div className="flex items-center space-x-2">
                           <Input id="snapshot-link" value={snapshotUrl} readOnly />
                           <Button type="button" size="icon" variant="outline" onClick={() => handleCopyToClipboard(snapshotUrl, 'snapshot')}>
                               {copiedLink === 'snapshot' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                           </Button>
                           </div>
                       </div>
                    ): (
                        <Button onClick={handleCreateSnapshot} disabled={isSnapshotLoading} className="w-full">
                            {isSnapshotLoading ? <Loader2 className="animate-spin" /> : 'Create Snapshot Link'}
                        </Button>
                    )}
                </CardContent>
                 {snapshotUrl && (
                     <CardFooter>
                        <Alert variant="default" className="text-xs p-2 border-blue-500/30 bg-blue-500/10 text-blue-800 dark:text-blue-300">
                           <AlertTitle className="flex items-center gap-1"><Link2 className="h-3 w-3" /> New snapshot created!</AlertTitle>
                        </Alert>
                     </CardFooter>
                 )}
            </Card>
        </div>
        <DialogFooter className="p-6 bg-muted/50 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('common.close')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
