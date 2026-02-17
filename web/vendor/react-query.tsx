'use client';

import { createContext, useContext, useState } from 'react';

type MutationOptions<TData, TVariables> = {
  mutationFn: (variables: TVariables) => Promise<TData>;
  onSuccess?: (data: TData) => void;
};

export class QueryClient {}

const QueryContext = createContext<QueryClient | null>(null);

export function QueryClientProvider({ client, children }: { client: QueryClient; children: React.ReactNode }) {
  return <QueryContext.Provider value={client}>{children}</QueryContext.Provider>;
}

export function useMutation<TData, TVariables>(options: MutationOptions<TData, TVariables>) {
  const _client = useContext(QueryContext);
  const [data, setData] = useState<TData | undefined>();
  const [isPending, setIsPending] = useState(false);

  const mutateAsync = async (variables: TVariables) => {
    setIsPending(true);
    try {
      const result = await options.mutationFn(variables);
      setData(result);
      options.onSuccess?.(result);
      return result;
    } finally {
      setIsPending(false);
    }
  };

  return {
    data,
    isPending,
    mutate: (variables: TVariables) => {
      void mutateAsync(variables);
    },
    mutateAsync
  };
}
