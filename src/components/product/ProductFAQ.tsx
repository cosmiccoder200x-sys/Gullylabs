import { useState, useMemo } from "react";
import { siteConfig } from "@/lib/site";
import { faqItems } from "@/lib/faq";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function ProductFAQ({ productName }: { productName: string }) {
  const [q, setQ] = useState("");
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return faqItems.filter((f) => {
      if (!term) return true;
      return f.q.toLowerCase().includes(term) || f.a.toLowerCase().includes(term);
    });
  }, [q]);

  return (
    <div className="mt-16">
      <h2 className="mb-6 font-display text-3xl uppercase">FAQ for {productName}</h2>
      <div className="mb-4">
        <Input
          placeholder="Search FAQ about this product…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-sm"
          aria-label="Search product FAQ"
        />
      </div>
      <div className="space-y-3">
        {filtered.map((f, i) => (
          <details
            key={f.q + i}
            className="group rounded-2xl bg-white p-4 ring-1 ring-border open:ring-brand/20"
            open={openIdx === i}
            onToggle={() => setOpenIdx(openIdx === i ? null : i)}
          >
            <summary className="cursor-pointer font-medium list-none flex items-center justify-between gap-4">
              <span>{f.q}</span>
              <ChevronDown className="size-4 transition-transform group-open:rotate-180 shrink-0" />
            </summary>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{f.a}</p>
          </details>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            No FAQ found.{" "}
            <Link to="/faq" className="text-brand hover:underline">
              Browse all FAQs
            </Link>{" "}
            or{" "}
            <Link to="/contact" className="text-brand hover:underline">
              contact us
            </Link>
            .
          </p>
        )}
      </div>
    </div>
  );
}
