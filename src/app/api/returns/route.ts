import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  renderReturnSubmitted,
  sendEmail,
  sendStaffEmail,
} from "@/features/notifications/email";

const itemSchema = z.object({
  orderItemId: z.coerce.number().int().positive(),
  quantity: z.coerce.number().int().min(1).max(10),
  requestedColour: z.string().trim().max(80).optional(),
  requestedSize: z.string().trim().max(40).optional(),
  conditionNote: z.string().trim().max(500).optional(),
});
const requestSchema = z.object({
  orderId: z.string().uuid(),
  requestType: z.enum(["return", "exchange"]),
  reasonCode: z.enum([
    "size",
    "colour",
    "damaged",
    "incorrect",
    "quality",
    "changed_mind",
    "other",
  ]),
  customerNote: z.string().trim().max(1000).optional(),
  locale: z.enum(["en", "ar"]),
  items: z.array(itemSchema).min(1).max(20),
});

function responseMessage(locale: "en" | "ar", en: string, ar: string) {
  return locale === "ar" ? ar : en;
}

export async function POST(request: Request) {
  const form = await request.formData();
  let rawItems: unknown;
  try {
    rawItems = JSON.parse(String(form.get("items") ?? "[]"));
  } catch {
    rawItems = [];
  }
  const parsed = requestSchema.safeParse({
    orderId: form.get("orderId"),
    requestType: form.get("requestType"),
    reasonCode: form.get("reasonCode"),
    customerNote: form.get("customerNote"),
    locale: form.get("locale"),
    items: rawItems,
  });
  if (!parsed.success)
    return NextResponse.json(
      { message: "Review the return details and select at least one item." },
      { status: 400 },
    );

  const { orderId, requestType, reasonCode, customerNote, locale, items } =
    parsed.data;
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId)
    return NextResponse.json(
      {
        message: responseMessage(
          locale,
          "Sign in before requesting a return.",
          "سجل الدخول أولاً لطلب الاسترجاع.",
        ),
      },
      { status: 401 },
    );

  const { data: order } = await supabase
    .from("orders")
    .select(
      "id, order_number, customer_name, email, status, delivered_at, order_items(id, quantity)",
    )
    .eq("id", orderId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!order || order.status !== "delivered" || !order.delivered_at) {
    return NextResponse.json(
      {
        message: responseMessage(
          locale,
          "Only delivered orders can be returned.",
          "يمكن إرجاع الطلبات التي تم تسليمها فقط.",
        ),
      },
      { status: 400 },
    );
  }
  const deadline =
    new Date(order.delivered_at).getTime() + 14 * 24 * 60 * 60 * 1000;
  if (Date.now() > deadline)
    return NextResponse.json(
      {
        message: responseMessage(
          locale,
          "The 14-day return window has ended.",
          "انتهت مهلة الاسترجاع البالغة ١٤ يوماً.",
        ),
      },
      { status: 400 },
    );
  const purchased = new Map(
    order.order_items.map((item) => [item.id, item.quantity]),
  );
  if (
    items.some(
      (item) =>
        !purchased.has(item.orderItemId) ||
        item.quantity > (purchased.get(item.orderItemId) ?? 0),
    )
  ) {
    return NextResponse.json(
      {
        message: responseMessage(
          locale,
          "A selected quantity exceeds the original order.",
          "كمية محددة تتجاوز الكمية الأصلية في الطلب.",
        ),
      },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("return_requests")
    .select("return_number")
    .eq("order_id", orderId)
    .maybeSingle();
  if (existing)
    return NextResponse.json(
      {
        message: responseMessage(
          locale,
          `A return request already exists: ${existing.return_number}`,
          `يوجد طلب استرجاع بالفعل: ${existing.return_number}`,
        ),
      },
      { status: 409 },
    );

  const returnId = crypto.randomUUID();
  const returnNumber = `SVR-${new Date().getFullYear()}-${returnId.slice(0, 8).toUpperCase()}`;
  const evidencePaths: string[] = [];
  for (const file of form.getAll("evidence")) {
    if (!(file instanceof File) || file.size === 0) continue;
    const extensions = new Map([
      ["image/jpeg", "jpg"],
      ["image/png", "png"],
      ["image/webp", "webp"],
    ]);
    const extension = extensions.get(file.type);
    if (
      !extension ||
      file.size > 5 * 1024 * 1024 ||
      evidencePaths.length >= 3
    ) {
      return NextResponse.json(
        {
          message: responseMessage(
            locale,
            "Upload up to 3 JPG, PNG, or WebP images, 5 MB each.",
            "ارفع حتى ٣ صور JPG أو PNG أو WebP، بحد أقصى ٥ ميجابايت للصورة.",
          ),
        },
        { status: 400 },
      );
    }
    const path = `${userId}/${returnId}/${crypto.randomUUID()}.${extension}`;
    const { error } = await admin.storage
      .from("return-evidence")
      .upload(path, file, { contentType: file.type });
    if (error) {
      if (evidencePaths.length)
        await admin.storage.from("return-evidence").remove(evidencePaths);
      return NextResponse.json(
        {
          message: responseMessage(
            locale,
            "Evidence images could not be uploaded.",
            "تعذر رفع صور الإثبات.",
          ),
        },
        { status: 500 },
      );
    }
    evidencePaths.push(path);
  }

  const { error: requestError } = await admin.from("return_requests").insert({
    id: returnId,
    return_number: returnNumber,
    order_id: orderId,
    user_id: userId,
    request_type: requestType,
    reason_code: reasonCode,
    customer_note: customerNote || null,
    evidence_paths: evidencePaths,
  });
  if (requestError) {
    if (evidencePaths.length)
      await admin.storage.from("return-evidence").remove(evidencePaths);
    console.error("[returns] Request insert failed", requestError);
    return NextResponse.json(
      {
        message: responseMessage(
          locale,
          "Your return could not be submitted. Please try again.",
          "تعذر إرسال طلبك. حاول مرة أخرى.",
        ),
      },
      { status: 500 },
    );
  }
  const { error: itemsError } = await admin.from("return_request_items").insert(
    items.map((item) => ({
      return_request_id: returnId,
      order_item_id: item.orderItemId,
      quantity: item.quantity,
      requested_colour: item.requestedColour || null,
      requested_size: item.requestedSize || null,
      condition_note: item.conditionNote || null,
    })),
  );
  if (itemsError) {
    await admin.from("return_requests").delete().eq("id", returnId);
    if (evidencePaths.length)
      await admin.storage.from("return-evidence").remove(evidencePaths);
    return NextResponse.json(
      {
        message: responseMessage(
          locale,
          "Your return items could not be saved.",
          "تعذر حفظ منتجات الاسترجاع.",
        ),
      },
      { status: 500 },
    );
  }
  await admin
    .from("return_status_history")
    .insert({
      return_request_id: returnId,
      status: "requested",
      note: "Customer submitted request",
    });
  if (order.email) {
    await Promise.allSettled([
      sendEmail(
        renderReturnSubmitted({
          email: order.email,
          customerName: order.customer_name,
          orderNumber: order.order_number,
          returnNumber,
          requestType,
          locale,
        }),
      ),
      sendStaffEmail(
        `[Scrub Vibe] New ${requestType} request ${returnNumber}`,
        `<p><strong>${returnNumber}</strong> was submitted for order ${order.order_number} by ${order.customer_name}.</p>`,
      ),
    ]);
  }
  return NextResponse.json({
    returnNumber,
    message: responseMessage(
      locale,
      `Request ${returnNumber} was submitted.`,
      `تم إرسال الطلب ${returnNumber}.`,
    ),
  });
}
