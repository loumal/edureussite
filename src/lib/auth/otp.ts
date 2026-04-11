import crypto from "crypto";
import { prisma } from "@/lib/prisma/client";

const OTP_TTL_MS = 15 * 60 * 1000; // 15 minutes

export function generateOtp(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

function hashOtp(otp: string): string {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

export async function createOtp(email: string): Promise<string> {
  const otp = generateOtp();
  const expires = new Date(Date.now() + OTP_TTL_MS);

  // Supprimer les anciens OTPs pour cet email
  await prisma.verificationToken.deleteMany({ where: { identifier: email } });

  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token: hashOtp(otp),
      expires,
    },
  });

  return otp;
}

export async function verifyOtp(email: string, otp: string): Promise<boolean> {
  const hashed = hashOtp(otp);

  const token = await prisma.verificationToken.findFirst({
    where: {
      identifier: email,
      token: hashed,
      expires: { gt: new Date() },
    },
  });

  if (!token) return false;

  await prisma.verificationToken.deleteMany({ where: { identifier: email } });

  return true;
}
