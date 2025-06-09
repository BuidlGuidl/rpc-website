"use client";

// import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { doc, getDoc } from "firebase/firestore";
import { NextPage } from "next";
import { Header } from "~~/components/Header";
import { db } from "~~/services/firebase";

const Home: NextPage = () => {
  // const router = useRouter();
  const [totalRequestsFunded, setTotalRequestsFunded] = useState(0);
  const firebaseCollection = process.env.NEXT_PUBLIC_FIREBASE_COLLECTION;

  useEffect(() => {
    const fetchTotalRequests = async () => {
      if (!firebaseCollection) {
        console.error("Firebase collection name is not defined");
        return;
      }
      try {
        const docRef = doc(db, firebaseCollection, "userRequestCount");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const userData = docSnap.data();
          const total = Object.values(userData).reduce((sum: number, user: any) => sum + (user.requestsFunded || 0), 0);
          setTotalRequestsFunded(total);
        }
      } catch (error) {
        console.error("Error fetching total requests:", error);
      }
    };

    fetchTotalRequests();
  }, [firebaseCollection]);

  return (
    <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-10">
      <Header />

      {/* First row */}
      <div className="flex flex-col lg:flex-row lg:border-x-[1px] mt-0 lg:border-y-[1px] border-black">
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
          <section className="bg-[#20F658] p-6 flex justify-center items-center border-r-[1px] border-l-[1px] border-b-[1px] border-black lg:border-r-0 flex-1 lg:min-w-[436px]">
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
      <div className="flex flex-col lg:flex-row lg:border-x-[1px] lg:border-b-[1px] mt-0 border-black">
        {/* Second row for mobile - flex row to make sections share the row */}
        <div className="flex flex-col flex-1">
          {/* Satellite section */}
          <section className="bg-[#20F658] p-6 flex justify-center items-center border-l-[1px] lg:border-l-[0px] border-r-[1px] lg:border-r-[1px] border-b-[1px] border-black flex-1">
            <div className="flex flex-col items-center min-w-[300px]">
              <span className="font-bold">Total Requests Funded</span>
              <span className="font-bold text-2xl mt-2">{totalRequestsFunded.toLocaleString()}</span>
            </div>
          </section>

          {/* Button section */}
          <section className="bg-[#DDDDDD] flex justify-center border-x-[1px] border-b-[0px] lg:border-l-[0px] border-black lg:border-b-0">
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
              Feeling generous? Donate USDC to fund BuidlGuidl RPC requests. 1 USDC will pay for 200,000 requests.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;
