"use client";

import Image from "next/image";
import { hardhat } from "viem/chains";
import { FaucetButton, RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";

/**
 * Site header
 */
export const Header = () => {
  const { targetNetwork } = useTargetNetwork();
  const isLocalNetwork = targetNetwork.id === hardhat.id;

  return (
    <header className="container mx-auto pt-10 md:pt-0 border-l border-r border-b border-black md:mt-0">
      <div className="w-full mt-0 z-10 p-6 flex items-center min-h-[120px]">
        <div className="container mx-auto flex items-center justify-between">
          <Image className="w-40 inline-block" src="rpc-logo.svg" alt="logo" width={260} height={78} />
          {/* Wallet connect button and faucet button */}
          <div className="flex items-center gap-2">
            <RainbowKitCustomConnectButton />
            {isLocalNetwork && <FaucetButton />}
          </div>
        </div>
      </div>
    </header>
  );
};
