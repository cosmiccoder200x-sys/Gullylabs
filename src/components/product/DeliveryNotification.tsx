import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-store";
import { useQuery } from "@tanstack/react-query";
import { Package, Truck, CheckCircle, XCircle, Bell } from "lucide-react";
import { formatINR } from "@/lib/format";

export function DeliveryNotification() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unread, setUnread] = useState(0);

  const { data: recentOrders } = useQuery({
    queryKey: ["delivery-notifications"],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("delivery_notifications")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(10);
      return data ?? [];
    },
  });

  useEffect(() => {
    if (recentOrders) {
      setNotifications(recentOrders);
      setUnread(recentOrders.filter((n: any) => !n.read_at).length);
    }
  }, [recentOrders]);

  const markAsRead = async (id: string) => {
    await supabase
      .from("delivery_notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)));
    setUnread((prev) => Math.max(0, prev - 1));
  };

  const getIcon = (eventType: string) => {
    switch (eventType) {
      case "shipped": return <Truck className="size-5 text-blue-500" />;
      case "out_for_delivery": return <Package className="size-5 text-amber-500" />;
      case "delivered": return <CheckCircle className="size-5 text-green-500" />;
      case "failed": return <XCircle className="size-5 text-destructive" />;
      default: return <Bell className="size-5 text-muted-foreground" />;
    }
  };

  if (!user || notifications.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <button
        onClick={() => setNotifications((prev) => prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() })))}
        className="relative rounded-full bg-brand text-brand-foreground p-4 shadow-lg hover:bg-accent-cyan transition-colors"
        aria-label="Notifications"
      >
        <Bell className="size-6" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 grid size-6 place-items-center rounded-full bg-destructive text-xs font-bold text-white">
            {unread}
          </span>
        )}
      </button>
      <div className="absolute bottom-14 right-0 w-80 rounded-2xl bg-white shadow-xl ring-1 ring-border p-4 space-y-2 max-h-96 overflow-y-auto">
        <h3 className="font-display text-sm font-bold uppercase tracking-widest">
          Notifications
        </h3>
        {notifications.map((n: any) => (
          <div
            key={n.id}
            className={`rounded-xl p-3 ${!n.read_at ? "bg-brand-soft/30" : "bg-muted/20"}`}
          >
            <div className="flex items-start gap-3">
              {getIcon(n.event_type)}
              <div className="flex-1">
                <p className="text-sm font-medium">{n.title}</p>
                <p className="text-xs text-muted-foreground">{n.message}</p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {new Date(n.created_at).toLocaleString()}
                </p>
              </div>
              {!n.read_at && (
                <button
                  onClick={() => markAsRead(n.id)}
                  className="text-[10px] text-brand hover:underline shrink-0"
                >
                  Mark read
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
