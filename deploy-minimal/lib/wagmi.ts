import { createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { sepolia, polygonAmoy } from "wagmi/chains";

export const wagmiConfig = createConfig({
  chains: [sepolia, polygonAmoy],
  connectors: [injected()],
  transports: {
    [sepolia.id]: http(process.env.NEXT_PUBLIC_ETHEREUM_RPC_URL),
    [polygonAmoy.id]: http(process.env.NEXT_PUBLIC_POLYGON_RPC_URL)
  },
  ssr: true
});
