import { NextResponse } from "next/server";
import { processAbandonedCarts } from "@/features/cart-recovery/engine";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  try {
    const summary = await processAbandonedCarts();
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...summary,
    });
  } catch (error) {
    console.error("[api/cron/abandoned-cart] Execution failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "internal_error",
      },
      { status: 500 },
    );
  }
}
