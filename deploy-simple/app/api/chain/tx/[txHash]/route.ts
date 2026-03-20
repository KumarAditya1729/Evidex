import { NextRequest, NextResponse } from "next/server";
import { createBlockchainServiceFromEnv } from "@evidex/blockchain";
import { parseChain } from "@evidex/api/chains";
import { serializeForJson } from "@/lib/serializers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { txHash: string } }
) {
  try {
    const chain = parseChain(request.nextUrl.searchParams.get("chain") ?? undefined);
    const txHash = String(params.txHash ?? "").trim();
    if (!txHash) {
      return NextResponse.json({ error: "txHash is required." }, { status: 400 });
    }

    const blockchainService = await createBlockchainServiceFromEnv();
    const details = await blockchainService.getTransactionDetails(chain, txHash);

    if (!details) {
      return NextResponse.json({ error: "Transaction not found." }, { status: 404 });
    }

    return NextResponse.json(
      serializeForJson({
        chain,
        details
      })
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch transaction details." },
      { status: 500 }
    );
  }
}
