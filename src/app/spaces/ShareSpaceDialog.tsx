
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
import { Copy, Check, Share2, Link2Off } from 'lucide-react';

interface ShareSpaceDialogProps {
  space: Space;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onShareSpace: (spaceId: string) => string | null;
  onUnshareSpace: (spaceId: string) => void;
}

export function ShareSpaceDialog({ space, isOpen, onOpenChange, onShareSpace, onUnshareSpace }: ShareSpaceDialogProps) {
  const { toast } = useToast();
  const [shareUrl, setShareUrl] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (space.shareId && typeof window !== 'undefined') {
      setShareUrl(`${window.location.origin}/share/${space.shareId}`);
    } else {
      setShareUrl('');
    }
    setIsCopied(false);
  }, [space, isOpen]);

  const handleShare = () => {
    const newShareId = onShareSpace(space.id);
    if (newShareId) {
      setShareUrl(`${window.location.origin}/share/${newShareId}`);
      toast({ title: "Sharing Enabled", description: "A public link for this space has been created." });
    } else {
      toast({ title: "Error", description: "Could not create a share link.", variant: "destructive" });
    }
  };
  
  const handleUnshare = () => {
    onUnshareSpace(space.id);
    setShareUrl('');
    toast({ title: "Sharing Disabled", description: "The public link for this space has been revoked." });
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
              <Button variant="destructive" className="w-full" onClick={handleUnshare}>
                <Link2Off className="h-4 w-4 mr-2" />
                Disable Share Link
              </Button>
            </div>
          ) : (
            <Button className="w-full" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />
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
