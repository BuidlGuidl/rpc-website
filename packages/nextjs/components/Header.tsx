"use client";

import Image from "next/image";
import Link from "next/link";
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
      <div className="w-full mt-0 z-10 p-6 flex items-center">
        <div className="container mx-auto flex items-center">
          <Link href="/" className="w-120 inline-block">
            <Image className="w-40" src="rpc-logo.svg" alt="logo" width={260} height={78} />
          </Link>
          <div className="flex-1 flex items-center justify-center">
            <div className="flex items-center gap-6">
              <Link href="/" className="hover:text-gray-200">
                Home
              </Link>
              <Link href="/fund" className="hover:text-gray-200">
                Fund
              </Link>
            </div>
          </div>
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
