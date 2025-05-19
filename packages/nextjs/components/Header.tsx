"use client";

import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";

/**
 * Site header
 */
export const Header = () => {
  return (
    <header className="container mx-auto pb-24  border-l border-r border-black">
      <div className="fixed container z-10 p-6 lg:p-8 flex justify-end">
        <div className="mt-2">
          <RainbowKitCustomConnectButton />
        </div>
      </div>
    </header>
  );
};
