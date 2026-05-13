import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { PaymentMethod, CryptoCurrency } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerEmail, customerName, tierId, paymentMethod, cryptoCurrency } =
      body;

    // Validate required fields
    if (!customerEmail || !customerName || !tierId || !paymentMethod) {
      return NextResponse.json(
        { error: "Missing required fields: customerEmail, customerName, tierId, paymentMethod" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    // Validate payment method
    const validMethods: PaymentMethod[] = ["stripe", "multisafepay", "crypto"];
    if (!validMethods.includes(paymentMethod)) {
      return NextResponse.json(
        { error: "Invalid payment method. Must be: stripe, multisafepay, or crypto" },
        { status: 400 }
      );
    }

    // Validate crypto currency if crypto payment
    if (paymentMethod === "crypto") {
      const validCoins: CryptoCurrency[] = ["btc", "usdt", "usdc", "eth"];
      if (!cryptoCurrency || !validCoins.includes(cryptoCurrency)) {
        return NextResponse.json(
          { error: "Crypto payment requires a valid cryptoCurrency: btc, usdt, usdc, or eth" },
          { status: 400 }
        );
      }
    }

    // Look up the pricing tier
    const tier = await prisma.pricingTier.findUnique({
      where: { id: Number(tierId) },
    });

    if (!tier || !tier.active) {
      return NextResponse.json(
        { error: "Pricing tier not found or inactive" },
        { status: 404 }
      );
    }

    // Create the order
    const order = await prisma.order.create({
      data: {
        customerEmail: customerEmail.trim(),
        customerName: customerName.trim(),
        tierName: tier.name,
        tierPrice: tier.price,
        paymentMethod: paymentMethod as PaymentMethod,
        paymentStatus: "pending",
        cryptoCurrency:
          paymentMethod === "crypto"
            ? (cryptoCurrency as CryptoCurrency)
            : null,
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
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
