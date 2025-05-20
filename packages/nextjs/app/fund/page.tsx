"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { NextPage } from "next";
import { formatUnits } from "viem";
import { useAccount } from "wagmi";
import { useDeployedContractInfo, useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { db } from "~~/services/firebase";

const Fund: NextPage = () => {
  const { address } = useAccount();
  const [selectedUrls, setSelectedUrls] = useState<string[]>([]);
  const [availableUrls, setAvailableUrls] = useState<string[]>([]);

  const { data: rpcFunderContractData } = useDeployedContractInfo("RpcFunder");
  const { writeContractAsync: writeUsdcAsync } = useScaffoldWriteContract("USDC");

  // Reduce polling frequency for contract reads
  const { data: yourTokenSymbol } = useScaffoldReadContract({
    contractName: "USDC",
    functionName: "symbol",
    watch: false, // Disable automatic polling
  });

  const { data: yourUsdcBalance } = useScaffoldReadContract({
    contractName: "USDC",
    functionName: "balanceOf",
    args: [address],
    watch: false, // Disable automatic polling
  });

  // const { data: bankAddress } = useScaffoldReadContract({
  //   contractName: "RpcFunder",
  //   functionName: "bankAddress",
  //   watch: false, // Disable automatic polling
  // });

  const { data: allowance } = useScaffoldReadContract({
    contractName: "USDC",
    functionName: "allowance",
    args: [address, rpcFunderContractData?.address],
  });

  // Load user's selected options from Firebase
  useEffect(() => {
    const loadUserData = async () => {
      if (!address || typeof window === "undefined") return;

      try {
        const docRef = doc(db, "users", "userAthorizedUrls");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          console.log("Loaded user data:", data);
          // Get the URLs for the current address from the map
          setSelectedUrls(data[address]?.selectedUrls || []);
        } else {
          console.log("No user data found");
          setSelectedUrls([]);
        }
      } catch (e) {
        console.error("Error loading user data:", e);
        if (e instanceof Error) {
          console.error("Error name:", e.name);
          console.error("Error message:", e.message);
        }
      }
    };

    loadUserData();
  }, [address]);

  // Load available URLs from Firebase
  useEffect(() => {
    const loadAvailableUrls = async () => {
      try {
        const docRef = doc(db, "urlList", "urlList");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setAvailableUrls(data.urls || []);
        } else {
          console.log("No URL list found");
          setAvailableUrls([]);
        }
      } catch (e) {
        console.error("Error loading URL list:", e);
        if (e instanceof Error) {
          console.error("Error name:", e.name);
          console.error("Error message:", e.message);
        }
      }
    };

    loadAvailableUrls();
  }, []);

  const handleCheckboxChange = (testName: string) => {
    setSelectedUrls(prev => (prev.includes(testName) ? prev.filter(test => test !== testName) : [...prev, testName]));
  };

  const handleSubmit = async () => {
    if (!address || typeof window === "undefined") {
      console.log("Submit prevented: No address or not in browser environment");
      return;
    }

    try {
      console.log("Attempting to write to Firestore with data:", {
        address,
        selectedUrls,
      });

      const docRef = doc(db, "users", "userAthorizedUrls");
      const docSnap = await getDoc(docRef);

      // Get existing data or initialize empty object
      const existingData = docSnap.exists() ? docSnap.data() : {};

      // Update the document with the new data for this address
      await setDoc(
        docRef,
        {
          ...existingData,
          [address]: {
            selectedUrls: selectedUrls,
            timestamp: new Date().toISOString(),
          },
        },
        { merge: true },
      );
      console.log("Document updated for address: ", address);
    } catch (e) {
      console.error("Error adding document: ", e);
      if (e instanceof Error) {
        console.error("Error name:", e.name);
        console.error("Error message:", e.message);
        console.error("Error stack:", e.stack);
      }
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-10">
      {/* Header with fixed logo */}
      <header className="container mx-auto md:pb-24 lg:pb-28 border-l border-r border-black md:mt-0">
        <div className="fixed container mt-4 xs:mt-0 md:mt-0 z-10 md:p-6 lg:p-8">
          <Image className="w-40" src="rpc-logo.svg" alt="logo" width={260} height={78} />
        </div>
      </header>
      <div className="flex items-center flex-col flex-grow pt-10">
        {/* <div className="flex flex-col items-center bg-base-100 shadow-lg shadow-secondary border-8 border-secondary rounded-xl p-6 mt-24 w-full max-w-lg">
          <div>
            Bank Address:{""}
            {bankAddress}
          </div>
        </div> */}
        <div className="flex flex-col items-center bg-base-100 shadow-lg shadow-secondary border-8 border-secondary rounded-xl p-6 mt-24 w-full max-w-lg">
          <div>
            Your USDC Balance:{""}
            {Number(formatUnits(yourUsdcBalance ?? 0n, 6)).toFixed(6)}
            <span className="font-bold ml-1">{yourTokenSymbol}</span>
          </div>
        </div>
        <div className="flex flex-col items-center bg-base-100 shadow-lg shadow-secondary border-8 border-secondary rounded-xl p-6 mt-24 w-full max-w-lg">
          <div className="text-xl">
            Your USDC Allowance Remaining:{" "}
            <div className="inline-flex items-center justify-center">
              {parseFloat(formatUnits(allowance ?? 0n, 6)).toFixed(6)}
              <span className="font-bold ml-1">{yourTokenSymbol}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center bg-base-100 shadow-lg shadow-secondary border-8 border-secondary rounded-xl p-6 mt-24 w-full max-w-lg">
          <div className="w-full">
            <div className="space-y-4">
              {availableUrls.map(url => (
                <div key={url} className="flex items-center">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-primary"
                    checked={selectedUrls.includes(url)}
                    onChange={() => handleCheckboxChange(url)}
                  />
                  <span className="ml-2">{url}</span>
                </div>
              ))}
            </div>
            <button className="btn btn-primary w-full mt-6" onClick={handleSubmit}>
              Submit
            </button>
            <div className="flex gap-4">
              <button
                className={`btn`}
                onClick={async () => {
                  try {
                    await writeUsdcAsync({
                      functionName: "approve",
                      args: [rpcFunderContractData?.address, 1000000n],
                    });
                  } catch (err) {
                    console.error("Error calling approve function:", err);
                  }
                }}
              >
                Approve 1 USDC
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Fund;
