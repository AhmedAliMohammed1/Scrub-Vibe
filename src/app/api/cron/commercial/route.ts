import { NextResponse } from "next/server";
import { processCommercialAutomation } from "@/features/commercial/automation";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const result = await processCommercialAutomation();
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...result,
    });
  } catch (error) {
    console.error("[cron/commercial] Failed", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "internal_error",
      },
      { status: 500 },
    );
  }
}
