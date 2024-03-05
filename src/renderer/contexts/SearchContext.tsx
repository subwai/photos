import { type Dispatch, type ReactNode, type SetStateAction, createContext, useContext, useState } from 'react';

const SearchContext = createContext<[string, Dispatch<SetStateAction<string>>] | null>(null);

export function SearchContextProvider({ children }: { children: ReactNode }) {
  const state = useState('');

  return <SearchContext.Provider value={state}>{children}</SearchContext.Provider>;
}

export function useSearch(): [string, Dispatch<SetStateAction<string>>] {
  const state = useContext(SearchContext);
  if (!state) {
    throw new Error('Must be within Search context');
  }

  return state;
}
