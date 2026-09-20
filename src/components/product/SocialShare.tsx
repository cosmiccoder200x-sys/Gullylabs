import { Share2, Copy, Twitter, Facebook, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import { siteConfig } from "@/lib/site";

interface SocialShareProps {
  productName: string;
  productSlug: string;
}

export function SocialShare({ productName, productSlug }: SocialShareProps) {
  const [showShare, setShowShare] = useState(false);
  const url = `${siteConfig.url}/products/${productSlug}`;

  const copyLink = () => {
    navigator.clipboard.writeText(url).then(() => {
      toast.success("Link copied!");
    });
  };

  const twitterUrl = `https://twitter.com/intent/tweet?text=Check out ${encodeURIComponent(productName)}!&url=${encodeURIComponent(url)}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(productName)}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(productName + " - " + url)}`;

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowShare(!showShare)}
        className="rounded-full"
      >
        <Share2 className="mr-2 size-4" /> Share
      </Button>
      {showShare && (
        <div className="absolute right-0 top-full mt-2 flex gap-2 rounded-2xl bg-white p-3 ring-1 ring-border shadow-lg z-50 animate-in fade-in slide-in-from-top-2">
          <a
            href={twitterUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="grid size-9 place-items-center rounded-full bg-blue-500 text-white hover:bg-blue-600"
            aria-label="Share on Twitter"
          >
            <Twitter className="size-4" />
          </a>
          <a
            href={facebookUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="grid size-9 place-items-center rounded-full bg-blue-700 text-white hover:bg-blue-800"
            aria-label="Share on Facebook"
          >
            <Facebook className="size-4" />
          </a>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="grid size-9 place-items-center rounded-full bg-green-500 text-white hover:bg-green-600"
            aria-label="Share on WhatsApp"
          >
            <MessageCircle className="size-4" />
          </a>
          <button
            onClick={copyLink}
            className="grid size-9 place-items-center rounded-full bg-muted text-muted-foreground hover:bg-secondary"
            aria-label="Copy link"
          >
            <Copy className="size-4" />
          </button>
        </div>
      )}
    </div>
  );
}
