'use client';

interface Transaction {
  id: string;
  date: string;
  merchant_name: string;
  amount: number;
  category: string;
  tag_non_negotiable: boolean;
  tag_ignored: boolean;
}

interface TransactionListProps {
  transactions: Transaction[];
}

export default function TransactionList({ transactions }: TransactionListProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No transactions yet</p>
        <p className="text-sm mt-2">Connect your bank to automatically import transactions</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {transactions.map((transaction) => (
        <div
          key={transaction.id}
          data-testid="transaction-card"
          className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <p className="font-medium text-gray-900">
                  {transaction.merchant_name}
                </p>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {transaction.category}
                </span>
                {transaction.tag_non_negotiable && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    Non-negotiable
                  </span>
                )}
                {transaction.tag_ignored && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    Ignored
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {formatDate(transaction.date)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold text-gray-900">
                {formatCurrency(transaction.amount)}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
