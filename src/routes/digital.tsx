import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";
import { formatINR } from "@/lib/format";

export const Route = createFileRoute("/digital")({
  head: () => ({
    meta: [
      { title: "Digital Products — GullyGadget" },
      { name: "description", content: "Shop digital products" },
      { property: "og:title", content: "Digital Products — GullyGadget" },
      { property: "og:description", content: "Digital products for work, study, and business" },
    ],
  }),
  component: DigitalPage,
});

function DigitalPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [digitalProducts, setDigitalProducts] = useState<any[]>([]);

  useEffect(() => {
    fetchDigitalProducts();
  }, []);

  const fetchDigitalProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("product_type", "digital")
        .eq("is_active", true);

      if (error) throw error;
      setDigitalProducts(data ?? []);
    } catch (e) {
      console.error("Failed to fetch digital products:", e);
      setDigitalProducts([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <h1 className="text-3xl font-bold tracking-tight">Digital Products</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Templates, productivity systems, spreadsheets, and other useful digital products
      </p>

      <div className="mt-6">
        <input
          placeholder="Search digital products..."
          onInput={setQuery}
        />
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading ? (
          <div className="animate-pulse space-y-8">
            <div className="h-64 rounded-3xl bg-secondary" />
            <div className="h-8 bg-secondary rounded w-3/4" />
          </div>
        ) : digitalProducts.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-xl font-medium">No digital products found</h3>
            <p className="text-muted-foreground">Check back soon for new digital products.</p>
          </div>
        ) : digitalProducts.map((product) => (
          <div
            key={product.id}
            className="rounded-3xl bg-white p-6 hover:bg-secondary/5 transition-colors"
          >
            <h3 className="text-lg font-medium">{product.name}</h3>
            <p className="text-sm text-muted-foreground">{product.short_description || ""}</p>
            <div className="mt-4">
              <span className="text-lg font-medium">{formatINR(product.price)}</span>
              {product.mrp && product.mrp > product.price && (
                <span className="text-sm text-muted-foreground line-through me-2">
                  {formatINR(product.mrp)}
                </span>
              )}
              {product.discount_percentage && (
                <span className="text-sm text-success">{product.discount_percentage}% OFF</span>
              )}
            </div>
            <Button className="w-full mt-4">View Product</Button>
          </div>
        ))}
      </div>
    </div>
  );
}