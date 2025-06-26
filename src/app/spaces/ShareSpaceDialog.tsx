
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
import type { Space } from '@/types';
import { Copy, Check, Share2, Loader2 } from 'lucide-react';

interface ShareSpaceDialogProps {
  space: Space;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onShareSpace: (spaceId: string) => string | null;
}

export function ShareSpaceDialog({ space, isOpen, onOpenChange, onShareSpace }: ShareSpaceDialogProps) {
  const { toast } = useToast();
  const [shareUrl, setShareUrl] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Reset state when dialog opens or space changes
    setShareUrl('');
    setIsCopied(false);
    setIsLoading(false);
  }, [isOpen, space]);

  const handleShare = () => {
    setIsLoading(true);
    // Use a timeout to allow the loading state to render before the potentially blocking share operation
    setTimeout(() => {
        const newShareUrl = onShareSpace(space.id);
        if (newShareUrl) {
            setShareUrl(newShareUrl);
            toast({ title: "Sharing Link Ready", description: "Your public link for this space has been created." });
        } else {
            toast({ title: "Error", description: "Could not create a share link.", variant: "destructive" });
        }
        setIsLoading(false);
    }, 50);
  };

  const handleCopyToClipboard = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setIsCopied(true);
      toast({ title: "Copied!", description: "Share link copied to clipboard." });
      setTimeout(() => setIsCopied(false), 2000);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
      toast({ title: "Error", description: "Failed to copy link.", variant: "destructive" });
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card">
        <DialogHeader>
          <DialogTitle className="text-primary flex items-center gap-2"><Share2 /> Share Space: {space.name}</DialogTitle>
          <DialogDescription>
            {shareUrl
              ? 'Anyone with this link can view the leaderboards for this space. No one can make changes.'
              : 'Create a public, read-only link to share this space\'s leaderboards.'}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {shareUrl ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="share-link">Public Share Link</Label>
                <div className="flex items-center space-x-2">
                  <Input id="share-link" value={shareUrl} readOnly />
                  <Button type="button" size="icon" onClick={handleCopyToClipboard}>
                    {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <Button className="w-full" onClick={handleShare} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Share2 className="h-4 w-4 mr-2" />}
              Generate Share Link
            </Button>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
