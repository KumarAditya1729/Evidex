import { NextRequest, NextResponse } from "next/server";
import { chainConfigurationService } from "@evidex/blockchain";
import { getSessionFromRequest } from "@/lib/session";
import { serializeForJson } from "@/lib/serializers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/analytics/chains - Get all chain configurations
export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const chainStats = chainConfigurationService.getChainStats();
    const allChains = chainConfigurationService.getAllChains();
    const activeChains = chainConfigurationService.getActiveChains();
    const mainnetChains = chainConfigurationService.getMainnetChains();
    const testnetChains = chainConfigurationService.getTestnetChains();
    
    const evmChains = chainConfigurationService.getChainsByType('evm');
    const utxoChains = chainConfigurationService.getChainsByType('utxo');
    const substrateChains = chainConfigurationService.getChainsByType('substrate');

    const response = {
      stats: chainStats,
      allChains,
      activeChains,
      mainnetChains,
      testnetChains,
      evmChains,
      utxoChains,
      substrateChains,
      configurations: Object.fromEntries(
        allChains.map(chain => [
          chain,
          chainConfigurationService.getChainConfig(chain)
        ])
      )
    };

    return NextResponse.json(serializeForJson(response as unknown as Record<string, unknown>));
  } catch (error) {
    console.error("Error fetching chain configurations:", error);
    return NextResponse.json(
      { error: "Failed to fetch chain configurations" },
      { status: 500 }
    );
  }
}

// POST /api/analytics/chains - Update chain configuration
export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { chain, action, config } = body;

    if (!chain || !action) {
      return NextResponse.json(
        { error: "Chain and action are required" },
        { status: 400 }
      );
    }

    switch (action) {
      case 'activate':
        chainConfigurationService.activateChain(chain);
        break;
      case 'deactivate':
        chainConfigurationService.deactivateChain(chain);
        break;
      case 'update':
        if (!config) {
          return NextResponse.json(
            { error: "Config is required for update action" },
            { status: 400 }
          );
        }
        chainConfigurationService.updateChainConfig(chain, config);
        break;
      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating chain configuration:", error);
    return NextResponse.json(
      { error: "Failed to update chain configuration" },
      { status: 500 }
    );
  }
}
