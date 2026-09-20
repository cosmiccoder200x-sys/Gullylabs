-- =========================================================
-- FEATURE ENHANCEMENTS: Phone Auth, Videos, Returns, Chat, Notifications
-- =========================================================

-- 1. PHONE AUTH: Add phone_verified and phone_otp fields to profiles
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS phone_otp_attempts INT NOT NULL DEFAULT 0;
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS otp_expires_at TIMESTAMPTZ;

-- 2. PRODUCT VIDEOS: Add videos JSON column to products table
ALTER TABLE public.products
    ADD COLUMN IF NOT EXISTS videos_json JSONB DEFAULT '[]'::jsonb;

-- 3. PRODUCT IMAGES: Add video_url to product_images for per-image videos
ALTER TABLE public.product_images
    ADD COLUMN IF NOT EXISTS video_url TEXT;

-- 4. RETURN REQUESTS: New table for return/refund workflow
CREATE TABLE IF NOT EXISTS public.return_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    order_item_id UUID REFERENCES public.order_items(id) ON DELETE CASCADE,
    return_type TEXT NOT NULL DEFAULT 'return', -- 'return' | 'refund' | 'exchange'
    reason TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending' -- 'pending' | 'approved' | 'rejected' | 'processed'
    ,
    approved_by UUID REFERENCES public.profiles(id),
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,
    tracking_number TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.return_requests
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_return_requests_user ON public.return_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_return_requests_order ON public.return_requests(order_id);
CREATE INDEX IF NOT EXISTS idx_return_requests_status ON public.return_requests(status);

-- 5. ORDER NOTIFICATIONS: Enhanced notification system
ALTER TABLE public.order_notifications
    ADD COLUMN IF NOT EXISTS channel TEXT DEFAULT 'email',
    ADD COLUMN IF NOT EXISTS notification_type TEXT DEFAULT 'status_update',
    ADD COLUMN IF NOT EXISTS title TEXT,
    ADD COLUMN IF NOT EXISTS body TEXT;

-- 6. CHAT MESSAGES: New table for customer support chat
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    sender_type TEXT NOT NULL DEFAULT 'customer', -- 'customer' | 'agent'
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_order ON public.chat_messages(order_id);
CREATE INDEX IF NOT EXISTS idx_chat_user ON public.chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_created ON public.chat_messages(created_at DESC);

-- 7. DELIVERY NOTIFICATIONS: New table for push/email notifications
CREATE TABLE IF NOT EXISTS public.delivery_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- 'shipped' | 'out_for_delivery' | 'delivered' | 'failed'
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    channel TEXT NOT NULL DEFAULT 'push', -- 'push' | 'email' | 'sms'
    sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    read_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_delivery_notif_order ON public.delivery_notifications(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_notif_user ON public.delivery_notifications(user_id);

-- 8. REFUND TRANSACTIONS: Track refund status
CREATE TABLE IF NOT EXISTS public.refund_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    return_request_id UUID REFERENCES public.return_requests(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',
    method TEXT NOT NULL, -- 'original' | 'wallet' | 'bank_transfer'
    status TEXT NOT NULL DEFAULT 'pending' -- 'pending' | 'processing' | 'completed' | 'failed'
    ,
    reference_number TEXT,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_refund_order ON public.refund_transactions(order_id);

-- 9. WISHLIST: Add variant_id support and timestamps
CREATE INDEX IF NOT EXISTS idx_wishlist_user_product ON public.wishlist_items(user_id, product_id);

-- 10. ENABLE REALTIME PUBLICATIONS
ALTER PUBLICATION supabase_realtime ADD TABLE public.return_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_notifications;

-- 11. FUNCTION: Update updated_at for return_requests
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER return_requests_updated BEFORE UPDATE ON public.return_requests
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 12. RLS POLICIES FOR NEW TABLES
ALTER TABLE public.return_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refund_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own return requests" ON public.return_requests
    FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can insert own return requests" ON public.return_requests
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can read own chat messages" ON public.chat_messages
    FOR SELECT USING (auth.uid()::text = user_id::text OR order_id IN (SELECT id FROM public.orders WHERE user_id = auth.uid()::text));
CREATE POLICY "Users can insert own chat messages" ON public.chat_messages
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can read own delivery notifications" ON public.delivery_notifications
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can read own refund transactions" ON public.refund_transactions
    FOR SELECT USING (auth.uid()::text = user_id::text);

-- Admin policies (assumes admin role check)
CREATE POLICY "Admins can manage return requests" ON public.return_requests
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid()::text AND role = 'admin')
    );
CREATE POLICY "Admins can manage chat messages" ON public.chat_messages
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid()::text AND role = 'admin')
    );
CREATE POLICY "Admins can view delivery notifications" ON public.delivery_notifications
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid()::text AND role = 'admin')
    );
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS product_type text CHECK (product_type IN ('physical', 'digital')) DEFAULT 'physical';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS digital_metadata jsonb DEFAULT '{}'::jsonb;

CREATE POLICY "Admins can manage refund transactions" ON public.refund_transactions
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid()::text AND role = 'admin')
    );


-- 10. REFERRALS: Add referral_code to profiles and create referrals table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES public.profiles(id);
CREATE TABLE IF NOT EXISTS public.referrals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    referred_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    reward_claimed BOOLEAN DEFAULT FALSE,
    UNIQUE(referrer_id, referred_user_id)
);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON public.referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON public.referrals(referred_user_id);
CREATE POLICY "Users can view own referrals" ON public.referrals
    FOR SELECT USING (auth.uid()::text IN (referrer_id, referred_user_id));
CREATE POLICY "Users can insert own referrals" ON public.referrals
    FOR INSERT WITH CHECK (auth.uid()::text = referrer_id);
CREATE POLICY "Admins can manage all referrals" ON public.referrals
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid()::text AND role = 'admin')
    );