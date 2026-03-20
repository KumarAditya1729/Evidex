import { NextResponse } from "next/server";
import { Role, listExplorerEvidence } from "@evidex/database";
import { createBlockchainServiceFromEnv } from "@evidex/blockchain";
import { parseChain } from "@evidex/api/chains";
import { serializeForJson } from "@/lib/serializers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const roleParam = url.searchParams.get("role");
    const limitParam = Number(url.searchParams.get("limit") ?? 200);
    const includeChain = url.searchParams.get("includeChain") === "true";
    const format = url.searchParams.get("format");

    const role =
      roleParam === Role.ADMIN ? Role.ADMIN : roleParam === Role.USER ? Role.USER : undefined;

    const evidence = await listExplorerEvidence({
      limit: Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 500) : 200,
      role
    });

    if (format === "csv") {
      const csv = toCsv(evidence);
      return new Response(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="evidex-explorer-${role ?? "ALL"}.csv"`
        }
      });
    }

    let enriched = evidence;
    if (includeChain && evidence.length) {
      const chain = parseChain(url.searchParams.get("chain") ?? undefined);
      const blockchainService = await createBlockchainServiceFromEnv();
      enriched = await Promise.all(
        evidence.map(async (item) => ({
          ...item,
          chainProof: await blockchainService.getTransactionDetails(chain, item.chainTxHash)
        }))
      );
    }

    return NextResponse.json(
      serializeForJson({
        evidence: enriched,
        filters: {
          role: role ?? "ALL",
          includeChain
        }
      })
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Explorer query failed." },
      { status: 500 }
    );
  }
}

function toCsv(
  evidence: Array<{
    id: string;
    originalFilename: string;
    sha256Hash: string;
    chain: string;
    chainTxHash: string;
    createdAt: Date;
    user: { role: string; name: string | null; walletAddress: string };
    anchors: Array<{ explorerUrl: string | null }>;
  }>
): string {
  const rows = [
    [
      "evidenceId",
      "generatedByRole",
      "generatedByName",
      "generatedByWallet",
      "filename",
      "hash",
      "chain",
      "txHash",
      "explorerUrl",
      "createdAtIso"
    ]
  ];

  for (const item of evidence) {
    rows.push([
      item.id,
      item.user.role,
      item.user.name ?? "",
      item.user.walletAddress,
      item.originalFilename,
      item.sha256Hash,
      item.chain,
      item.chainTxHash,
      item.anchors[0]?.explorerUrl ?? "",
      item.createdAt.toISOString()
    ]);
  }

  return rows.map((row) => row.map(escapeCsv).join(",")).join("\n");
}

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes("\"") || value.includes("\n")) {
    return `"${value.replaceAll("\"", "\"\"")}"`;
  }

  return value;
}
