import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { EmptyState } from "@/components/common/EmptyState";
import { Package, RefreshCw, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/returns-request")({
  head: () => ({
    meta: [{ title: "Request Return | GullyGadget", name: "robots", content: "noindex" }],
  }),
  component: ReturnsRequest,
});

export function ReturnsRequest() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [orderId, setOrderId] = useState("");
  const [returnType, setReturnType] = useState("return");
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);

  const { data: orders } = useQuery({
    queryKey: ["return-orders", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select("id, order_number, status, total, payment_method")
        .eq("user_id", user!.id)
        .in("status", ["delivered", "shipped"])
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const submitReturn = useMutation({
    mutationFn: async () => {
      if (!reason.trim()) throw new Error("Please select a reason");
      const { error } = await supabase.from("return_requests").insert({
        user_id: user!.id,
        order_id: orderId,
        return_type: returnType,
        reason,
        description: description || null,
        status: "pending",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Return request submitted! We'll review it shortly.");
      qc.invalidateQueries({ queryKey: ["return-orders"] });
      setOrderId("");
      setReason("");
      setDescription("");
      setReturnType("return");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="font-display text-4xl uppercase mb-2">Request Return / Refund</h1>
      <p className="mb-8 text-muted-foreground">
        Fill in the details below to request a return, refund, or exchange.
      </p>

      <div className="space-y-6 rounded-3xl bg-white p-6 ring-1 ring-border">
        <div>
          <Label>Select Order</Label>
          <Select value={orderId} onValueChange={setOrderId}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Choose an order…" />
            </SelectTrigger>
            <SelectContent>
              {(orders ?? []).map((o) => (
                <SelectItem key={o.id} value={o.id}>
                  {o.order_number ?? o.id.slice(0, 8)} — {formatINR(Number(o.total))} ({o.status})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Return Type</Label>
          <Select value={returnType} onValueChange={(v) => setReturnType(v)}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="return">Return (get money back)</SelectItem>
              <SelectItem value="refund">Refund to original payment</SelectItem>
              <SelectItem value="exchange">Exchange for different variant</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Reason *</Label>
          <Select value={reason} onValueChange={setReason}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select a reason…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="defective">Product is defective</SelectItem>
              <SelectItem value="wrong_item">Received wrong item</SelectItem>
              <SelectItem value="not_as_described">Not as described</SelectItem>
              <SelectItem value="damaged">Item arrived damaged</SelectItem>
              <SelectItem value="changed_mind">Changed my mind</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Additional Details (optional)</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Describe the issue in more detail…"
            className="mt-1"
          />
        </div>

        <Button
          onClick={() => submitReturn.mutate()}
          disabled={busy || !orderId || !reason}
          className="w-full rounded-full bg-brand font-bold uppercase tracking-tighter hover:bg-accent-cyan"
        >
          {busy ? "Submitting…" : "Submit Request"}
        </Button>
      </div>

      <div className="mt-8">
        <h2 className="font-display text-xl uppercase mb-4">Your Return History</h2>
        <ReturnHistory />
      </div>
    </div>
  );
}

function ReturnHistory() {
  const { user } = useAuth();
  const { data: returns } = useQuery({
    queryKey: ["user-returns"],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("return_requests")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  if (!returns || returns.length === 0) {
    return (
      <EmptyState
        icon={<Package className="size-8" />}
        title="No return requests yet"
        description="You haven't requested any returns yet."
      />
    );
  }

  return (
    <div className="space-y-3">
      {returns.map((r: any) => (
        <div key={r.id} className="rounded-2xl bg-white p-4 ring-1 ring-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{r.return_type.toUpperCase()}</p>
              <p className="text-sm text-muted-foreground">{r.reason}</p>
              <p className="text-xs text-muted-foreground">
                Order: {r.order_id.slice(0, 8)} · {new Date(r.created_at).toLocaleDateString()}
              </p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${
              r.status === "approved" ? "bg-success/10 text-success" :
              r.status === "rejected" ? "bg-destructive/10 text-destructive" :
              "bg-amber-100 text-amber-700"
            }`}>
              {r.status}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
