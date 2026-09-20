import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-store";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { formatINR } from "@/lib/format";
import { OrderTimeline } from "@/components/orders/OrderTimeline";
import { Package, Truck, CheckCircle, XCircle } from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/my-returns")({
  head: () => ({
    meta: [{ title: "My Returns | GullyGadget", name: "robots", content: "noindex" }],
  }),
  component: MyReturns,
});

function MyReturns() {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: returns } = useQuery({
    queryKey: ["my-returns"],
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

  const filtered = statusFilter === "all" ? returns : returns?.filter((r: any) => r.status === statusFilter);

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("return_requests").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => toast.success("Status updated"),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="font-display text-4xl uppercase mb-8">My Returns</h1>

      <div className="flex flex-wrap gap-2 mb-6">
        {["all", "pending", "approved", "rejected", "processed"].map((s) => (
          <Button key={s} size="sm" variant={statusFilter === s ? "default" : "outline"} onClick={() => setStatusFilter(s)} className="rounded-full capitalize">
            {s}
          </Button>
        ))}
      </div>

      {(!filtered || filtered.length === 0) && (
        <div className="rounded-3xl bg-white p-8 text-center ring-1 ring-border">
          <Package className="mx-auto size-10 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">No return requests found.</p>
        </div>
      )}

      <div className="space-y-4">
        {(filtered ?? []).map((r: any) => (
          <div key={r.id} className="rounded-3xl bg-white p-6 ring-1 ring-border">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div>
                <p className="font-mono text-sm">Return #{r.id.slice(0, 8)}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(r.created_at).toLocaleDateString()} · {r.return_type.toUpperCase()}
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
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs uppercase text-muted-foreground">Reason</p>
                <p className="font-medium capitalize">{r.reason.replace(/_/g, " ")}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-muted-foreground">Order ID</p>
                <p className="font-mono text-xs">{r.order_id.slice(0, 8)}</p>
              </div>
            </div>
            {r.rejection_reason && (
              <div className="mt-3 rounded-xl bg-destructive/5 p-3 text-sm text-destructive">
                Rejection reason: {r.rejection_reason}
              </div>
            )}
            <div className="mt-4 flex gap-2">
              {r.status === "pending" && (
                <>
                  <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ id: r.id, status: "approved" })}>
                    <CheckCircle className="mr-1 size-3" /> Approve
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => updateStatus.mutate({ id: r.id, status: "rejected" })}>
                    <XCircle className="mr-1 size-3" /> Reject
                  </Button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MyReturns;
