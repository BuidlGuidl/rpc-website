"use client";

import { useEffect, useState } from "react";
import { PieChart } from "@mui/x-charts/PieChart";

interface RpcStats {
  nodesOnline: number;
  executionClients: Record<string, number>;
  consensusClients: Record<string, number>;
}

const RpcStatsCharts = () => {
  const [stats, setStats] = useState<RpcStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("https://pool.mainnet.rpc.buidlguidl.com:48547/rpcsitestats");
        if (!response.ok) {
          throw new Error("Failed to fetch RPC stats");
        }
        const data = await response.json();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    // Refresh data every 30 seconds
    const interval = setInterval(fetchStats, 30000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center space-y-4 p-4">
        <div className="text-sm font-medium">Loading RPC stats...</div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex flex-col items-center space-y-4 p-4">
        <div className="text-sm text-red-600">Error loading RPC stats: {error}</div>
      </div>
    );
  }

  // Don't render anything if no nodes are online
  if (stats.nodesOnline === 0) {
    return null;
  }

  // Prepare data for execution clients pie chart
  const executionData = Object.entries(stats.executionClients).map(([client, count], index) => ({
    id: index,
    value: count,
    label: client.charAt(0).toUpperCase() + client.slice(1),
  }));

  // Prepare data for consensus clients pie chart
  const consensusData = Object.entries(stats.consensusClients).map(([client, count], index) => ({
    id: index,
    value: count,
    label: client.charAt(0).toUpperCase() + client.slice(1),
  }));

  return (
    <div className="flex flex-col space-y-6 p-4">
      <div className="text-center">
        <div className="text-sm font-medium mb-2">Nodes Online: {stats.nodesOnline}</div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 justify-center items-center">
        {/* Execution Clients Chart */}
        <div className="flex flex-col items-center">
          <h3 className="text-sm font-medium mb-2">Execution Clients</h3>
          <PieChart
            series={[
              {
                data: executionData,
              },
            ]}
            width={200}
            height={150}
          />
        </div>

        {/* Consensus Clients Chart */}
        <div className="flex flex-col items-center">
          <h3 className="text-sm font-medium mb-2">Consensus Clients</h3>
          <PieChart
            series={[
              {
                data: consensusData,
              },
            ]}
            width={200}
            height={150}
          />
        </div>
      </div>
    </div>
  );
};

export default RpcStatsCharts;
