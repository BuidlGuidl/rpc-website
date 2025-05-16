"use client";

import Image from "next/image";
import { NextPage } from "next";

const Home: NextPage = () => {
  return (
    <div className="container mx-auto">
      {/* Header with fixed logo */}
      <header className="container mx-auto pb-24 md:pb-32 lg:pb-36 border-l border-r border-black">
        <div className="fixed container z-10 p-6 lg:p-8">
          <Image className="w-40" src="rpc-logo.svg" alt="logo" width={260} height={78} />
        </div>
      </header>

      {/* First row */}
      <div className="flex flex-col lg:flex-row lg:border-x-[1px] lg:border-y-[1px] border-black">
        {/* Introduction section */}
        <section className="bg-[#DDDDDD] p-6 lg:p-10 w-full lg:w-[60vw] border-x-[1px] border-y-[1px] border-black lg:border-none overflow-auto">
          <div className="flex flex-col">
            <p className="mt-0">
              A one line command to deploy and monitor an Ethereum Node, funded and maintained by BuidlGuidl members.
            </p>
            <p className="mt-0">Power your decentralized apps with:</p>
            <div className="bg-black p-2 lg:p-4 text-white text-sm overflow-auto">
              <p className="m-2">https://mainnet.rpc.buidlguidl.com</p>
            </div>
            <p> Powered by worldwide BG Clients.</p>
          </div>
        </section>

        {/* Second row for mobile - flex row to make sections share the row */}
        <div className="flex flex-col flex-1">
          {/* Satellite section */}
          <section className="bg-[#20F658] p-6 flex justify-center border-r-[1px] border-l-[1px] border-b-[1px] border-black lg:border-r-0">
            <Image src="/satellite-10fps.gif" alt="satellite" className="object-contain" width={436} height={535} />
          </section>

          {/* Button section */}
          <section className="bg-[#DDDDDD] flex justify-center border-x-[1px] border-b-[1px] border-black lg:border-b-0 lg:border-r-0">
            <button className="bg-white border h-16 w-full flex items-center justify-center hover:bg-gray-100 transition-colors">
              <p>Visit Client site</p>
            </button>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Home;
