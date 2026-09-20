import { useState, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function ProductImageGallery({
  images,
  videos,
  productName,
}: {
  images: Array<{ url: string; alt?: string }>;
  videos?: Array<{ url: string; title?: string }>;
  productName: string;
}) {
  const [active, setActive] = useState(0);
  const [activeTab, setActiveTab] = useState<"images" | "videos">("images");

  const allMedia = activeTab === "videos" ? (videos ?? []) : images;

  const renderMedia = useCallback(
    (item: { url: string; alt?: string; title?: string }, index: number) => {
      if (activeTab === "videos") {
        return (
          <video
            key={index}
            src={item.url}
            controls
            className="aspect-square w-full rounded-3xl object-contain bg-black"
            preload="metadata"
          />
        );
      }
      return (
        <img
          key={index}
          src={item.url}
          alt={item.alt ?? productName}
          className="h-full w-full object-contain"
          loading="eager"
        />
      );
    },
    [activeTab, productName]
  );

  const renderThumbnail = useCallback(
    (item: { url: string; alt?: string; title?: string }, index: number) => {
      if (activeTab === "videos") {
        return (
          <button
            key={index}
            onClick={() => setActive(index)}
            role="tab"
            aria-selected={index === active}
            className={`shrink-0 rounded-xl bg-background p-1 ring-1 ring-border transition-colors ${
              index === active ? "ring-brand" : "hover:ring-brand/50"
            }`}
          >
            <div className="relative h-16 w-16">
              <img
                src={item.url}
                alt={item.alt ?? `Video ${index + 1}`}
                className="h-full w-full rounded-lg object-cover"
              />
              <div className="absolute inset-0 grid place-items-center rounded-lg bg-black/40">
                <div className="size-8 rounded-full bg-white/90 flex items-center justify-center">
                  <svg className="size-4 fill-black ml-0.5" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            </div>
          </button>
        );
      }
      return (
        <button
          key={index}
          onClick={() => setActive(index)}
          role="tab"
          aria-selected={index === active}
          className={`shrink-0 rounded-xl bg-background p-1 ring-1 ring-border transition-colors ${
            index === active ? "ring-brand" : "hover:ring-brand/50"
          }`}
        >
          <img
            src={item.url}
            alt={item.alt ?? `${productName} - image ${index + 1}`}
            className="h-16 w-16 rounded-lg object-contain"
            loading="lazy"
          />
        </button>
      );
    },
    [activeTab, active, productName]
  );

  if (!allMedia || allMedia.length === 0) {
    return <div className="aspect-square rounded-3xl bg-secondary shimmer" />;
  }

  return (
    <div className="space-y-3">
      <div className="relative aspect-square overflow-hidden rounded-3xl">
        {renderMedia(allMedia[active], active)}
        {allMedia.length > 1 && (
          <>
            <button
              onClick={() => setActive((prev) => (prev > 0 ? prev - 1 : allMedia.length - 1))}
              className="absolute left-3 top-1/2 -translate-y-1/2 grid size-8 place-items-center rounded-full bg-background/80 shadow-sm backdrop-blur-sm hover:bg-background"
              aria-label="Previous media"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              onClick={() =>
                setActive((prev) => (prev < allMedia.length - 1 ? prev + 1 : 0))
              }
              className="absolute right-3 top-1/2 -translate-y-1/2 grid size-8 place-items-center rounded-full bg-background/80 shadow-sm backdrop-blur-sm hover:bg-background"
              aria-label="Next media"
            >
              <ChevronRight className="size-4" />
            </button>
          </>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            setActiveTab("images");
            setActive(0);
          }}
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            activeTab === "images" ? "bg-brand text-brand-foreground" : "bg-secondary"
          }`}
        >
          Images ({images.length})
        </button>
        {videos && videos.length > 0 && (
          <button
            onClick={() => {
              setActiveTab("videos");
              setActive(0);
            }}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              activeTab === "videos" ? "bg-brand text-brand-foreground" : "bg-secondary"
            }`}
          >
            Videos ({videos.length})
          </button>
        )}
      </div>
      {allMedia.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Product media">
          {allMedia.map((img, i) => renderThumbnail(img, i))}
        </div>
      )}
    </div>
  );
}
