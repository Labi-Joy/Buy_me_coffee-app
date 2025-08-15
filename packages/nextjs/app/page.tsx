"use client";

import { useState } from "react";
import { useContract, useReadContract, useConnect, useDisconnect } from "@starknet-react/core";
import { useDeployedContractInfo, useTransactor } from "~~/hooks/scaffold-stark";
import { useAccount } from "~~/hooks/useAccount";
import { byteArray } from "starknet";

const Home = () => {
  const [message, setMessage] = useState("");
  const [amount, setAmount] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Wallet connection hooks
  const { address, isConnected, status } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  // Get deployed contract info
  const { data: deployedContractData } = useDeployedContractInfo("Coffee");
  
  // Setup contract instance
  const { contract: coffeeContract } = useContract({
    abi: deployedContractData?.abi,
    address: deployedContractData?.address,
  });

  // Read contract data
  const { data: totalCoffees } = useReadContract({
    abi: deployedContractData?.abi,
    address: deployedContractData?.address,
    functionName: "get_total_coffees",
    args: [],
    enabled: !!deployedContractData,
  });

  const { data: coffeePrice } = useReadContract({
    abi: deployedContractData?.abi,
    address: deployedContractData?.address,
    functionName: "get_coffee_price",
    args: [],
    enabled: !!deployedContractData,
  });

  const { data: creator } = useReadContract({
    abi: deployedContractData?.abi,
    address: deployedContractData?.address,
    functionName: "get_creator",
    args: [],
    enabled: !!deployedContractData,
  });

  // Write transaction handler
  const { writeTransaction } = useTransactor();

  const handleBuyCoffee = async () => {
    if (!isConnected) {
      alert("Please connect your wallet first!");
      return;
    }

    if (!message.trim()) {
      alert("Please add a message!");
      return;
    }

    if (!coffeeContract) {
      alert("Contract not loaded. Please try again.");
      return;
    }

    setIsLoading(true);
    try {
      // Convert message string to felt252
      const messageAsFelt = byteArray.byteArrayFromString(message);
      
      await writeTransaction(coffeeContract.populate("buy_coffee", [messageAsFelt]));
      setMessage("");
      alert("Coffee purchased! ☕ Thank you for your support!");
    } catch (error) {
      console.error("Error buying coffee:", error);
      alert("Error buying coffee. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Custom Connect Button Component with Modal
  const ConnectButton = () => {
    if (isConnected && address) {
      return (
        <div className="flex items-center space-x-3 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          <div>
            <div className="text-sm text-slate-700 font-medium">Connected</div>
            <div className="font-mono text-xs text-slate-500">
              {address.slice(0, 6)}...{address.slice(-4)}
            </div>
          </div>
          <button
            onClick={() => disconnect()}
            className="ml-2 px-3 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors font-medium"
          >
            Disconnect
          </button>
        </div>
      );
    }

    return (
      <>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold transition-all transform hover:scale-105 shadow-sm"
        >
          Connect Wallet
        </button>

        {/* Wallet Connect Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            />
            
            {/* Modal */}
            <div className="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4 border border-slate-200">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-slate-900">Connect Wallet</h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Description */}
              <p className="text-slate-600 mb-6">
                Choose a wallet to connect and start supporting with coffee ☕
              </p>

              {/* Wallet Options */}
              <div className="space-y-3">
                {connectors.map((connector) => (
                  <button
                    key={connector.id}
                    onClick={() => {
                      connect({ connector });
                      setIsModalOpen(false);
                    }}
                    disabled={status === "connecting"}
                    className="w-full flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:border-slate-300 hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-slate-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a2 2 0 11-4 0 2 2 0 014 0zm8-2a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="font-medium text-slate-900">
                        {status === "connecting" ? "Connecting..." : connector.name}
                      </span>
                    </div>
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))}
              </div>

              {/* Footer */}
              <div className="mt-6 text-center">
                <p className="text-xs text-slate-500">
                  By connecting, you agree to our terms of service
                </p>
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      {/* Header */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-3">
            <div className="text-4xl">☕</div>
            <h1 className="text-3xl font-bold text-amber-900">Buy Me a Coffee</h1>
          </div>
          <ConnectButton />
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Hero Section */}
          <div className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-5xl font-bold text-amber-900 leading-tight">
                Fuel My{" "}
                <span className="text-orange-600 relative">
                  Creativity
                  <div className="absolute -bottom-2 left-0 w-full h-3 bg-yellow-300 opacity-30 rounded"></div>
                </span>
              </h2>
              <p className="text-xl text-amber-700 leading-relaxed">
                Support my work by buying me a virtual coffee! Every cup helps me stay energized 
                and motivated to create amazing projects. ☕✨
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-amber-200 shadow-lg">
                <div className="text-3xl mb-2">☕</div>
                <div className="text-2xl font-bold text-amber-900">
                  {totalCoffees?.toString() || "0"}
                </div>
                <div className="text-sm text-amber-600">Coffees Bought</div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-amber-200 shadow-lg">
                <div className="text-3xl mb-2">💝</div>
                <div className="text-2xl font-bold text-amber-900">
                  {coffeePrice ? (Number(coffeePrice) / 1e15).toFixed(3) : "0.001"}
                </div>
                <div className="text-sm text-amber-600">ETH per Coffee</div>
              </div>
            </div>

            {/* Creator Info */}
            {creator && (
              <div className="bg-gradient-to-r from-amber-100 to-orange-100 p-4 rounded-xl border border-amber-300">
                <div className="text-sm text-amber-700 mb-1">Supporting</div>
                <div className="font-mono text-sm text-amber-900 break-all">
                  {creator.toString()}
                </div>
              </div>
            )}
          </div>

          {/* Right Side - Buy Coffee Form */}
          <div className="bg-white/90 backdrop-blur-sm p-8 rounded-3xl shadow-2xl border border-amber-200">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4 animate-bounce">☕</div>
              <h3 className="text-2xl font-bold text-amber-900">Buy Me a Coffee</h3>
              <p className="text-amber-600 mt-2">Show your support with a virtual coffee!</p>
            </div>

            {/* Coffee Amount Selector */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-amber-800 mb-3">
                Number of Coffees
              </label>
              <div className="flex space-x-2">
                {[1, 3, 5].map((num) => (
                  <button
                    key={num}
                    onClick={() => setAmount(num)}
                    className={`flex-1 p-3 rounded-xl border-2 transition-all ${
                      amount === num
                        ? "border-amber-500 bg-amber-100 text-amber-900"
                        : "border-amber-200 hover:border-amber-300 text-amber-700"
                    }`}
                  >
                    <div className="text-2xl">☕</div>
                    <div className="text-sm font-semibold">x{num}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Message Input */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-amber-800 mb-3">
                Leave a Message ✨
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Say something nice! 😊"
                className="w-full p-4 border-2 border-amber-200 rounded-xl focus:border-amber-500 focus:outline-none resize-none h-24 text-amber-900 placeholder-amber-400"
                maxLength={100}
              />
              <div className="text-right text-xs text-amber-500 mt-1">
                {message.length}/100
              </div>
            </div>

            {/* Buy Button */}
            <button
              onClick={handleBuyCoffee}
              disabled={isLoading || !message.trim() || !isConnected}
              className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all transform ${
                isLoading || !message.trim() || !isConnected
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
              }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  <span>Brewing Coffee...</span>
                </div>
              ) : !isConnected ? (
                "🔗 Connect Wallet to Buy Coffee"
              ) : (
                `☕ Buy ${amount} Coffee${amount > 1 ? "s" : ""} (${(Number(coffeePrice || 1000000000000000) * amount / 1e15).toFixed(3)} ETH)`
              )}
            </button>

            {/* Fun animations */}
            <div className="text-center mt-6 space-y-2">
              <div className="text-2xl animate-pulse">🤎</div>
              <p className="text-sm text-amber-600 italic">
                "Good ideas start with great coffee!"
              </p>
            </div>
          </div>
        </div>

        {/* Recent Supporters Section */}
        <div className="mt-16 bg-white/80 backdrop-blur-sm p-8 rounded-3xl border border-amber-200 shadow-lg">
          <h3 className="text-2xl font-bold text-amber-900 mb-6 text-center">
            ☕ Coffee Wall of Fame ☕
          </h3>
          <div className="text-center text-amber-600">
            <div className="text-4xl mb-4">🏆</div>
            <p className="text-lg">
              {totalCoffees?.toString() || "0"} amazing supporters have bought coffee so far!
            </p>
            <p className="text-sm mt-2 opacity-75">
              Your message will appear here after buying a coffee ✨
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-amber-900 to-orange-900 text-white py-12 mt-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center space-y-6">
            <div className="flex items-center space-x-3 text-lg">
              <span className="text-amber-200">Created with passion by</span>
              <span className="font-bold text-white">Labi Dev</span>
              <span className="text-red-400 text-lg animate-pulse">❤️</span>
            </div>
            
            <div className="w-16 h-px bg-amber-700"></div>
            
            <div className="text-center space-y-2">
              <p className="text-amber-200 text-sm">
                Powered by <span className="text-amber-100 font-medium">Starknet</span> • 
                Built with <span className="text-amber-100 font-medium">Scaffold-Stark</span>
              </p>
              <p className="text-amber-300 text-xs">
                Secure, decentralized coffee support on the blockchain
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;