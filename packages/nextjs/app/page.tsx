"use client";

// import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { doc, getDoc } from "firebase/firestore";
import { NextPage } from "next";
import { db } from "~~/services/firebase";

const Home: NextPage = () => {
  // const router = useRouter();
  const [totalRequests, setTotalRequests] = useState(0);
  const firebaseCollection = process.env.NEXT_PUBLIC_FIREBASE_COLLECTION;

  useEffect(() => {
    const fetchTotalRequests = async () => {
      if (!firebaseCollection) {
        console.error("Firebase collection name is not defined");
        return;
      }
      try {
        const userRequestCountRef = doc(db, firebaseCollection, "userRequestCount");
        const userRequestCountSnap = await getDoc(userRequestCountRef);
        if (userRequestCountSnap.exists()) {
          const userData = userRequestCountSnap.data();
          const total = Object.values(userData).reduce((sum: number, user: any) => sum + (user.totalRequests || 0), 0);
          setTotalRequests(total);
        }
      } catch (e) {
        console.error("Error fetching total requests:", e);
      }
    };

    fetchTotalRequests();
  }, [firebaseCollection]);

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
            <p className="mt-0">A distributed Mainnet Ethereum RPC operated by a network of BuidlGuidl Clients.</p>

            <div className="bg-black p-2 lg:p-4 text-white text-sm">
              <p className="m-2">https://mainnet.rpc.buidlguidl.com</p>
            </div>
          </div>
        </section>

        {/* Second row for mobile - flex row to make sections share the row */}
        <div className="flex flex-col flex-1">
          {/* Satellite section */}
          <section className="bg-[#20F658] p-6 flex justify-center items-center border-r-[1px] border-l-[1px] border-b-[1px] border-black lg:border-r-0 flex-1 min-w-[372px]">
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

      {/* Second row */}
      <div className="flex flex-col lg:flex-row lg:border-x-[1px] mt-20 md:mt-0 lg:border-y-[1px] border-black">
        {/* Second row for mobile - flex row to make sections share the row */}
        <div className="flex flex-col flex-1">
          {/* Satellite section */}
          <section className="bg-[#20F658] p-6 flex justify-center items-center border-r-[1px] border-l-[1px] border-b-[1px] border-black lg:border-r-0 flex-1">
            <div className="flex flex-col items-center min-w-[300px]">
              <span className="font-bold">Total Requests Funded</span>
              <span className="font-bold text-2xl mt-2">{totalRequests.toLocaleString()}</span>
            </div>
          </section>

          {/* Button section */}
          <section className="bg-[#DDDDDD] flex justify-center border-x-[1px] border-b-[1px] border-black lg:border-b-0 lg:border-r-0">
            <button
              onClick={() => (window.location.href = "/fund")}
              className="bg-white h-16 w-full flex items-center justify-center hover:bg-[#FF66F9] transition-colors"
            >
              <p>Donate USDC for Requests</p>
            </button>
          </section>
        </div>

        {/* Introduction section */}
        <section className="bg-[#DDDDDD] p-6 lg:p-10 w-full lg:w-[60vw] border-x-[1px] border-y-[1px] border-black lg:border-none">
          <div className="flex flex-col">
            <p className="mt-0">
              Feeling generous? Donate USDC to fund BuidlGuidl RPC requests. 1 USDC will pay for 1 million requests.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;
