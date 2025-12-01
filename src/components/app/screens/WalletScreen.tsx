// src/components/app/screens/WalletScreen.tsx
import { useState, useEffect } from 'react';
import { Wallet, TrendingUp, TrendingDown, Calendar, Clock } from 'lucide-react';
import { apiClient } from '@/services/apiClient'; // Assuming you create this service

interface Transaction {
  id: string;
  reference: string;
  amount: {
    formatted: string;
    currency: string;
    amount: number;
  };
  status: {
    label: string;
    value: string;
  };
  entry_type: {
    label: string; // e.g., "Credit", "Debit"
    value: string; // e.g., "credit", "debit"
  };
  narration: string;
  created_at: string; // ISO date string
  // Add other fields as needed from the API response
}

export default function WalletScreen({ onBack }: { onBack: () => void }) {
  const [balance, setBalance] = useState({ formatted: '₦0.00', currency: 'NGN', amount: 0 });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWalletData = async () => {
      try {
        setLoading(true);
        setError(null);
        // NEW: Call the wallet details API using apiClient
        // Example: GET /wallets (to get balance)
        const balanceResponse = await apiClient.get('/wallets'); // Use correct endpoint from Postman doc
        // Example: GET /wallets/history (to get history)
        const historyResponse = await apiClient.get('/wallets/history'); // Use correct endpoint from Postman doc

        console.log("Wallet Balance Response:", balanceResponse); // Debug log
        console.log("Wallet History Response:", historyResponse); // Debug log

        if (balanceResponse.status === 200 && balanceResponse.data && balanceResponse.data.data) {
          setBalance(balanceResponse.data.data.balance); // Adjust based on actual API response structure for balance
        } else {
          setError('Failed to load wallet balance.');
        }

        if (historyResponse.status === 200 && historyResponse.data && Array.isArray(historyResponse.data.data)) {
          setTransactions(historyResponse.data.data);
        } else {
          setError('Failed to load transaction history.');
        }
      } catch (err) {
        console.error("Wallet Data Fetch Error:", err);
        let errorMessage = 'An unexpected error occurred.';
        if (err instanceof Error) {
          errorMessage = err.message;
        }
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchWalletData();
  }, []); // Fetch on mount


  if (loading) {
    return (
      <div className="h-screen bg-achrams-bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-achrams-primary-solid border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-achrams-text-secondary">Loading wallet...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen bg-achrams-bg-primary flex flex-col items-center justify-center p-6">
        <p className="text-red-500 text-center mb-6">{error}</p>
        <button
          onClick={() => window.location.reload()} // Simple retry for now
          className="bg-achrams-gradient-primary text-achrams-text-light py-3 px-6 rounded-xl font-semibold"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen bg-achrams-bg-primary flex flex-col">
      {/* Header */}
      <div className="bg-achrams-primary-solid text-achrams-text-light px-6 py-4 flex items-center">
        <button onClick={onBack} className="mr-4">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold">My Wallet</h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Balance Card */}
        <div className="bg-gradient-to-r from-achrams-primary-solid to-achrams-secondary-solid text-achrams-text-light p-6 m-6 rounded-2xl shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-80">Available Balance</p>
              <p className="text-3xl font-bold">{balance.formatted}</p>
            </div>
            <Wallet className="w-12 h-12 opacity-80" />
          </div>
        </div>

        {/* Transactions List */}
        <div className="mx-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 text-achrams-text-primary">Transaction History</h2>
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-achrams-text-secondary">No transactions found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((tx) => (
                <div key={tx.id} className="bg-achrams-bg-secondary rounded-xl p-4 border border-achrams-border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      tx.entry_type.value === 'credit' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                    }`}>
                      {tx.entry_type.value === 'credit' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-achrams-text-primary truncate">{tx.narration || tx.reference}</p>
                      <div className="flex items-center gap-2 text-xs text-achrams-text-tertiary">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(tx.created_at).toLocaleDateString()}</span>
                        <Clock className="w-3 h-3" />
                        <span>{new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${
                      tx.entry_type.value === 'credit' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {tx.entry_type.value === 'credit' ? '+' : '-'}{tx.amount.formatted}
                    </p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      tx.status.value === 'successful' ? 'bg-green-100 text-green-800' :
                      tx.status.value === 'failed' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {tx.status.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}