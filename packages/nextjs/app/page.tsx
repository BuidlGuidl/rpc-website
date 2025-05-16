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
        <section className="bg-[#df57c4] p-6 lg:p-10 w-full lg:w-[45vw] border-x-[1px] border-y-[1px] border-black lg:border-none overflow-auto">
          <div className="flex flex-col">
            <p className="mt-0">Run an Ethereum node with a single command:</p>
            <p className="mt-0">Mac/linux</p>
            <div className="bg-black p-2 lg:p-4 text-white text-sm overflow-auto">
              <p className="m-2">/bin/bash -c &quot;$(curl -fsSL https://bgclient.io)&quot;</p>
            </div>
            <p> or run the client from the repo:</p>
            <div className="bg-black p-2 lg:p-4 text-white text-sm overflow-auto">
              <p className="m-2 whitespace-nowrap">git clone https://github.com/BuidlGuidl/buidlguidl-client.git</p>
              <p className="m-2">cd buidlguidl-client</p>
              <p className="m-2">yarn install</p>
              <p className="m-2">node index.js</p>
            </div>
          </div>
        </section>

        {/* Second row for mobile - flex row to make sections share the row */}
        <div className="flex flex-row flex-1">
          {/* Screenshot section */}
          <section className="bg-[#DDDDDD] w-7/12 lg:flex-1 p-6 flex justify-center border-x-[1px] border-b-[1px] border-black lg:border-b-0">
            <Image
              src="/screenshot-3.png"
              alt="screenshot"
              className="object-contain cursor-pointer"
              width={972}
              height={875}
            />
          </section>

          {/* Satellite section */}
          <section className="bg-[#87A0F9] p-6 w-5/12 lg:flex-1 flex justify-center border-r-[1px] border-b-[1px] border-black lg:border-r-0 lg:border-l-0 lg:border-b-0">
            <Image src="/satellite-10fps.gif" alt="satellite" className="object-contain" width={436} height={535} />
          </section>
        </div>
      </div>
    </div>
  );
};

export default Home;
