"use client";

import Image from "next/image";
import Link from "next/link";

/**
 * Site header
 */
export const Header = () => {
  return (
    <header className="container mx-auto pt-10 md:pt-0 border-l border-r border-black md:mt-0">
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
        </div>
      </div>
    </header>
  );
};
