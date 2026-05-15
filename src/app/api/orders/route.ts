import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendOrderPlacedEmail, sendAccountCreatedEmail } from "@/lib/cmsEmail";
import { PaymentMethod, CryptoCurrency } from "@prisma/client";
import crypto from "crypto";
import bcrypt from "bcryptjs";

const ORDER_ID_CHARS = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

function generateOrderId(): string {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yy = String(now.getFullYear()).slice(-2);
  let random = "";
  for (let i = 0; i < 5; i++) {
    random += ORDER_ID_CHARS[Math.floor(Math.random() * ORDER_ID_CHARS.length)];
  }
  return `${random}-${mm}${yy}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerEmail, customerName, tierId, paymentMethod, cryptoCurrency, selectedOptions, optionPrices, oneTimeFlags } = body;

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

    // Generate a unique orderId, retrying on the rare collision
    let orderId: string;
    let attempts = 0;
    do {
      orderId = generateOrderId();
      const exists = await prisma.order.findUnique({ where: { orderId } });
      if (!exists) break;
      attempts++;
    } while (attempts < 10);

    let recurringAdd = 0;
    let oneTimeAdd = 0;
    if (optionPrices && typeof optionPrices === "object") {
      for (const [key, val] of Object.entries(optionPrices)) {
        const amount = Number(val) || 0;
        if (oneTimeFlags?.[key]) {
          oneTimeAdd += amount;
        } else {
          recurringAdd += amount;
        }
      }
    }
    const basePrice = Number(tier.price);
    const totalPrice = basePrice + recurringAdd + oneTimeAdd;

    const order = await prisma.order.create({
      data: {
        orderId,
        customerEmail: customerEmail.trim(),
        customerName: customerName.trim(),
        tierName: tier.name,
        tierPrice: tier.price,
        optionsPrice: recurringAdd,
        oneTimeFees: oneTimeAdd,
        totalPrice,
        paymentMethod: paymentMethod as PaymentMethod,
        paymentStatus: "pending",
        cryptoCurrency: paymentMethod === "crypto" ? (cryptoCurrency as CryptoCurrency) : null,
        selectedOptions: selectedOptions || undefined,
      },
    });

    // Send order placed email
    try {
      await sendOrderPlacedEmail({
        email: customerEmail.trim(),
        name: customerName.trim(),
        orderId,
        tierName: tier.name,
        totalPrice,
        paymentMethod,
      });
      console.log(`Order placed email sent to ${customerEmail}`);
    } catch (emailErr) {
      console.error("Failed to send order placed email:", emailErr);
    }

    // Auto-create customer account if not exists
    try {
      const existingCustomer = await prisma.customer.findUnique({
        where: { email: customerEmail.trim() },
      });
      if (!existingCustomer) {
        const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        const rawPassword = Array.from(crypto.randomBytes(10), (b) => chars[b % chars.length]).join("");
        const passwordHash = await bcrypt.hash(rawPassword, 10);
        await prisma.customer.create({
          data: {
            email: customerEmail.trim(),
            name: customerName.trim(),
            passwordHash,
          },
        });
        // Send account credentials email
        try {
          await sendAccountCreatedEmail({
            email: customerEmail.trim(),
            name: customerName.trim(),
            password: rawPassword,
          });
          console.log(`Account created email sent to ${customerEmail}`);
        } catch (emailErr) {
          console.error("Failed to send account created email:", emailErr);
        }
      }
    } catch (custErr) {
      console.error("Customer auto-creation error (non-fatal):", custErr);
    }

    return NextResponse.json(
      {
        id: order.id,
        orderId: order.orderId,
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
