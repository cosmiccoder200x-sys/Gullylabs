import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-store";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, X, MessageCircle, User } from "lucide-react";
import { toast } from "sonner";

interface ChatMessage {
  id: string;
  message: string;
  sender_type: string;
  created_at: string;
}

export function ChatWidget() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: msgs } = useQuery({
    queryKey: ["chat-messages"],
    enabled: !!user && open,
    queryFn: async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .order("created_at", { ascending: true })
        .limit(50);
      return (data ?? []) as ChatMessage[];
    },
  });

  useEffect(() => {
    if (msgs) setMessages(msgs);
  }, [msgs]);

  // Real-time subscription
  useEffect(() => {
    if (!open) return;
    const channel = supabase
      .channel("chat-messages")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages" }, (payload) => {
        setMessages((prev) => [...prev, payload.new as ChatMessage]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [open]);

  const sendMessage = useMutation({
    mutationFn: async () => {
      if (!input.trim()) return;
      const { error } = await supabase.from("chat_messages" as any).insert({
        user_id: user!.id,
        message: input.trim(),
        sender_type: "customer",
      });
      if (error) throw error;
      setInput("");
    },
    onSuccess: () => {
      setTimeout(() => {
        const { data: agentMsg } = (supabase as any)
          .from("chat_messages")
          .select("*")
          .order("created_at", { ascending: true })
          .limit(1)
          .single();
      }, 2000);
      setTimeout(() => {
        setMessages((prev) => [...prev, {
          id: "agent-" + Date.now(),
          message: "Thank you for your message. Our support team will respond shortly.",
          sender_type: "agent",
          created_at: new Date().toISOString(),
        }]);
      }, 2000);
      toast.success("Message sent!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const send = () => {
    if (input.trim()) sendMessage.mutate();
  };

  if (!user) return null;

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-4 left-4 z-50 grid size-14 place-items-center rounded-full bg-brand text-brand-foreground shadow-lg hover:bg-accent-cyan transition-colors"
        aria-label="Open chat"
      >
        <MessageCircle className="size-6" />
      </button>
      {open && (
        <div className="fixed bottom-20 left-4 z-50 w-80 rounded-2xl bg-white shadow-xl ring-1 ring-border flex flex-col" style={{ height: "420px" }}>
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="font-display text-sm font-bold uppercase">Customer Support</h3>
            <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
              <X className="size-4" />
            </button>
          </div>
          <ScrollArea ref={scrollRef} className="flex-1 p-4 space-y-3 overflow-y-auto">
            {messages.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">
                Chat with our support team. We usually respond within minutes.
              </p>
            )}
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender_type === "customer" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                  msg.sender_type === "customer"
                    ? "bg-brand text-brand-foreground"
                    : "bg-muted text-foreground"
                }`}>
                  <p>{msg.message}</p>
                  <p className="text-[10px] opacity-70 mt-1">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))}
          </ScrollArea>
          <div className="border-t border-border p-3">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Type a message…"
                className="flex-1"
              />
              <Button size="sm" onClick={send} disabled={sendMessage.isPending} className="rounded-full">
                <Send className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function ChatButton({ orderId }: { orderId?: string }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  if (!user) return null;

  return (
    <button
      onClick={() => setOpen(!open)}
      className="fixed bottom-4 right-4 z-50 grid size-12 place-items-center rounded-full bg-brand text-brand-foreground shadow-lg hover:bg-accent-cyan transition-colors"
      aria-label="Chat with support"
    >
      <MessageCircle className="size-5" />
    </button>
  );
}
