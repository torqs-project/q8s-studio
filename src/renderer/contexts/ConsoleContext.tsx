// src/contexts/ConsoleContext.tsx

import React, {
  createContext,
  useState,
  ReactNode,
  useContext,
  useMemo,
} from 'react';

interface ConsoleContextProps {
  output: React.JSX.Element[];
  setOutput: React.Dispatch<React.SetStateAction<React.JSX.Element[]>>;
  pKey: number;
  setPKey: React.Dispatch<React.SetStateAction<number>>;
}

const ConsoleContext = createContext<ConsoleContextProps | undefined>(
  undefined,
);

export const useConsole = () => {
  const context = useContext(ConsoleContext);
  if (!context) {
    throw new Error('useConsole must be used within a ConsoleProvider');
  }
  return context;
};

export function ConsoleProvider({ children }: { children: ReactNode }) {
  const [output, setOutput] = useState<React.JSX.Element[]>([]);
  const [pKey, setPKey] = useState(0);
  const value = useMemo(
    () => ({ output, setOutput, pKey, setPKey }),
    [output, setOutput, pKey, setPKey],
  );

  return (
    <ConsoleContext.Provider value={value}>{children}</ConsoleContext.Provider>
  );
}

export default ConsoleProvider;
