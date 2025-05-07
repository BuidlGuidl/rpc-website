"use client";

import { useState } from "react";
import Image from "next/image";
import { NextPage } from "next";
import bgrpcLogo from "~~/public/bgrpc.png";

const Home: NextPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="container mx-auto">
      {/* Header with fixed logo */}
      <header className="container mx-auto pb-24 md:pb-32 lg:pb-36 border-l border-r border-black">
        <div className="fixed container z-10 mix-blend-difference p-6 lg:p-8">
          <Image className="w-40 md:w-auto invert" src={bgrpcLogo} alt="logo" width={260} height={78} />
        </div>
      </header>

      {/* First row */}
      <div className="flex flex-col lg:flex-row lg:border-x-[1px] lg:border-y-[1px] border-black">
        {/* Satellite section - now on the left */}
        <section className="bg-[#20F658] p-6 w-full flex justify-center border-x-[1px] border-y-[1px] border-black lg:border-none lg:w-[55vw]">
          <Image src="/satellite-10fps.gif" alt="satellite" className="object-contain" width={436} height={535} />
        </section>

        {/* Instructions section - now on the right */}
        <section className="bg-[#20F658] p-6 lg:p-10 w-full lg:w-[45vw] border-x-[1px] border-y-[1px] border-black lg:border-none overflow-auto flex items-center justify-center">
          <div className="flex flex-col">
            <div className="mb-6 flex justify-center">
              <Image src="crosses-1.svg" alt="crosses" className="w-[200px] lg:w-[400px]" width={306} height={50} />
            </div>
            <p className="mt-0">Power your decentralized apps with:</p>
            <div className="bg-black p-2 lg:p-4 text-white text-sm overflow-auto">
              <p className="m-2">https://mainnet.rpc.buidlguidl.com</p>
            </div>
            <div className="mt-6 flex justify-center">
              <Image src="crosses-2.svg" alt="crosses" className="w-[200px] lg:w-[400px]" width={306} height={50} />
            </div>
          </div>
        </section>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-85 z-50 flex items-center justify-center p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div className="relative max-w-[90vw] max-h-[90vh]">
            <Image
              src="/screenshot-3-modal.png"
              alt="screenshot"
              className="object-contain"
              width={2030}
              height={1327}
              onClick={e => e.stopPropagation()}
            />
            <button
              className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full w-8 h-8 flex items-center justify-center"
              onClick={() => setIsModalOpen(false)}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
