"use client";

import Image from "next/image";
import { NextPage } from "next";

const Home: NextPage = () => {
  return (
    <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-10">
      {/* Header with fixed logo */}
      <header className="container mx-auto md:pb-24 lg:pb-28 border-l border-r border-black md:mt-0">
        <div className="fixed container mt-4 xs:mt-0 md:mt-0 z-10 md:p-6 lg:p-8">
          <Image className="w-40" src="rpc-logo.svg" alt="logo" width={260} height={78} />
        </div>
      </header>

      {/* First row */}
      <div className="flex flex-col lg:flex-row lg:border-x-[1px] mt-20 md:mt-0 lg:border-y-[1px] border-black">
        {/* Introduction section */}
        <section className="bg-[#DDDDDD] p-6 lg:p-10 w-full lg:w-[60vw] border-x-[1px] border-y-[1px] border-black lg:border-none">
          <div className="flex flex-col">
            <p className="mt-0">A distributed EthereumRPC operated by a network of BuidlGuidl clients.</p>

            <div className="bg-black p-2 lg:p-4 text-white text-sm">
              <p className="m-2">https://mainnet.rpc.buidlguidl.com</p>
            </div>
          </div>
        </section>

        {/* Second row for mobile - flex row to make sections share the row */}
        <div className="flex flex-col flex-1">
          {/* Satellite section */}
          <section className="bg-[#20F658] p-6 flex justify-center items-center border-r-[1px] border-l-[1px] border-b-[1px] border-black lg:border-r-0 flex-1">
            <Image
              src="/satellite-10fps.gif"
              alt="satellite"
              className="object-contain max-h-full"
              width={436}
              height={535}
            />
          </section>

          {/* Button section */}
          <section className="bg-[#DDDDDD] flex justify-center border-x-[1px] border-b-[1px] border-black lg:border-b-0 lg:border-r-0">
            <button
              onClick={() => window.open("https://client.buidlguidl.com", "_blank", "noopener,noreferrer")}
              className="bg-white h-16 w-full flex items-center justify-center hover:bg-[#FF66F9] transition-colors"
            >
              <p>Visit Client site</p>
            </button>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Home;
