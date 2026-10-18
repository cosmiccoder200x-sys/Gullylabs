import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { formatINR } from "@/lib/format";
import { ArrowLeft, Send, CheckCircle, XCircle } from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/returns")({
  head: () => ({
    meta: [{ title: "Return & Refund | Gullylabs", name: "robots", content: "noindex" }],
  }),
  component: ReturnsPage,
});

function ReturnsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-4">
        <Link to="/" className="text-sm text-brand hover:underline flex items-center gap-1">
          <ArrowLeft className="size-4" /> Back to store
        </Link>
      </div>
      <h1 className="font-display text-4xl uppercase">Return & Refund Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Clear, non-misleading policy. Update with your legal counsel for the final wording.
      </p>
      <div className="mt-8 space-y-6 leading-relaxed">
        <h2 className="font-display text-xl uppercase">Eligibility</h2>
        <p className="text-muted-foreground">
          Returns are accepted within 7 days of delivery for unused products in original packaging.
          Hygiene or personalized items may be non-returnable where applicable.
        </p>
        <h2 className="font-display text-xl uppercase">Process</h2>
        <ol className="list-decimal pl-5 space-y-1 text-muted-foreground">
          <li>
            <Link to={"/returns-request" as any} className="text-brand hover:underline">
              Submit a return request
            </Link>{" "}
            with your order number and reason.
          </li>
          <li>We review eligibility and provide instructions within 24 hours.</li>
          <li>Ship or arrange pickup as instructed; keep tracking.</li>
          <li>After inspection, refund is processed to the original payment method.</li>
        </ol>
        <h2 className="font-display text-xl uppercase">Refunds</h2>
        <p className="text-muted-foreground">
          For online payments, approved refunds go to the original payment method after inspection.
          COD orders have no online refund; remedy is replacement or policy-specific credit.
          Timelines depend on provider but are communicated at approval.
        </p>
        <h2 className="font-display text-xl uppercase">Damaged or Wrong Item</h2>
        <p className="text-muted-foreground">
          Contact us within 48 hours of delivery with photos and order details for priority
          handling. Use the contact form or email {import.meta.env.VITE_SUPPORT_EMAIL || "support@gullylabs.com"}.
        </p>
        <div className="rounded-2xl bg-card p-4 ring-1 ring-border">
          <p className="text-sm font-medium">Need help?</p>
          <Link to={"/returns-request" as any} className="text-sm text-brand hover:underline">
            Request a Return →
          </Link>
          <span className="mx-2 text-muted-foreground">·</span>
          <Link to="/contact" className="text-sm text-brand hover:underline">
            Contact us →
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ReturnsPage;
