import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { PaymentMethod, CryptoCurrency } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerEmail, customerName, tierId, paymentMethod, cryptoCurrency, selectedOptions } = body;

    if (!customerEmail || !customerName || !tierId || !paymentMethod) {
      return NextResponse.json(
        { error: "Missing required fields: customerEmail, customerName, tierId, paymentMethod" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    const validMethods: PaymentMethod[] = ["stripe", "multisafepay", "crypto"];
    if (!validMethods.includes(paymentMethod)) {
      return NextResponse.json({ error: "Invalid payment method" }, { status: 400 });
    }

    if (paymentMethod === "crypto") {
      const validCoins: CryptoCurrency[] = ["btc", "usdt", "usdc", "eth"];
      if (!cryptoCurrency || !validCoins.includes(cryptoCurrency)) {
        return NextResponse.json({ error: "Crypto payment requires a valid cryptoCurrency" }, { status: 400 });
      }
    }

    const tier = await prisma.pricingTier.findUnique({
      where: { id: Number(tierId) },
    });

    if (!tier || !tier.active) {
      return NextResponse.json({ error: "Pricing tier not found or inactive" }, { status: 404 });
    }

    const order = await prisma.order.create({
      data: {
        customerEmail: customerEmail.trim(),
        customerName: customerName.trim(),
        tierName: tier.name,
        tierPrice: tier.price,
        paymentMethod: paymentMethod as PaymentMethod,
        paymentStatus: "pending",
        cryptoCurrency: paymentMethod === "crypto" ? (cryptoCurrency as CryptoCurrency) : null,
        selectedOptions: selectedOptions || undefined,
      },
    });

    return NextResponse.json(
      {
        id: order.id,
        status: order.paymentStatus,
        tierName: order.tierName,
        tierPrice: Number(order.tierPrice),
        paymentMethod: order.paymentMethod,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Order creation error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
