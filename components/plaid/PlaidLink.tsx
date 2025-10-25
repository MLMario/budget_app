'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import { Button } from '../ui/Button';

interface PlaidLinkProps {
  userId: string;
  onSuccess: (publicToken: string, metadata: any) => void;
  onExit?: (error: any, metadata: any) => void;
}

export default function PlaidLink({ userId, onSuccess, onExit }: PlaidLinkProps) {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch link token from API
  useEffect(() => {
    async function fetchLinkToken() {
      try {
        const response = await fetch('/api/plaid/create-link-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        });

        const data = await response.json();

        if (data.link_token) {
          setLinkToken(data.link_token);
        } else {
          setError('Failed to create link token');
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchLinkToken();
  }, [userId]);

  const config = {
    token: linkToken,
    onSuccess,
    onExit: onExit || (() => {}),
  };

  const { open, ready } = usePlaidLink(config);

  const handleClick = useCallback(() => {
    if (ready) {
      open();
    }
  }, [ready, open]);

  if (isLoading) {
    return <Button disabled>Loading...</Button>;
  }

  if (error) {
    return (
      <div className="text-red-600 text-sm">
        {error}
      </div>
    );
  }

  return (
    <Button
      onClick={handleClick}
      disabled={!ready}
      variant="primary"
    >
      Connect Bank
    </Button>
  );
}
