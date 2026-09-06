"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackStoreEvent } from "@/lib/analytics";

export function PageTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (/\/(admin|account|auth)(\/|$)/.test(pathname)) return;
    trackStoreEvent("page_view");
    if (/\/(en|ar)\/products\//.test(pathname)) {
      const productId =
        document.querySelector<HTMLElement>("[data-product-id]")?.dataset
          .productId;
      if (productId) trackStoreEvent("product_view", { productId });
    }
  }, [pathname]);

  return null;
}
