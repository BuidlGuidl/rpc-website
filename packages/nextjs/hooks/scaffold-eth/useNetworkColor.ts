import { useSelectedNetwork } from "~~/hooks/scaffold-eth";
import { AllowedChainIds, ChainWithAttributes } from "~~/utils/scaffold-eth";

export const DEFAULT_NETWORK_COLOR = "#666666";

export function getNetworkColor(network: ChainWithAttributes) {
  const colorConfig = network.color ?? DEFAULT_NETWORK_COLOR;
  return Array.isArray(colorConfig) ? colorConfig[0] : colorConfig;
}

/**
 * Gets the color of the target network
 */
export const useNetworkColor = (chainId?: AllowedChainIds) => {
  const chain = useSelectedNetwork(chainId);
  return getNetworkColor(chain);
};
