import React, {
  createContext,
  useState,
  ReactNode,
  useContext,
  useMemo,
} from 'react';

// Define the ConsoleContextProps
interface ConsoleContextProps {
  output: React.JSX.Element[];
  setOutput: React.Dispatch<React.SetStateAction<React.JSX.Element[]>>;
  pKey: number;
  setPKey: React.Dispatch<React.SetStateAction<number>>;
  labUrl: string;
  setLabUrl: React.Dispatch<React.SetStateAction<string>>;
}

const ConsoleContext = createContext<ConsoleContextProps | undefined>(
  undefined,
);

// Custom hook to use the ConsoleContext
export const useConsole = () => {
  const context = useContext(ConsoleContext);
  if (!context) {
    throw new Error('useConsole must be used within a ConsoleProvider');
  }
  return context;
};

// ConsoleProvider component
export function ConsoleProvider({ children }: { children: ReactNode }) {
  // State for the output
  const [output, setOutput] = useState<React.JSX.Element[]>([]);
  // State for the pKey
  const [pKey, setPKey] = useState(0);
  // State for the Jupyter lab url
  const [labUrl, setLabUrl] = useState('');
  // Memoize the value to avoid unnecessary re-renders
  const value = useMemo(
    () => ({
      output,
      setOutput,
      pKey,
      setPKey,
      labUrl,
      setLabUrl,
    }),
    [output, setOutput, pKey, setPKey, labUrl, setLabUrl],
  );
  return (
    <ConsoleContext.Provider value={value}>{children}</ConsoleContext.Provider>
  );
}

// Navigation context
// Define the NavigationContextProps
interface NavigationContextProps {
  navState: string;
  setNavState: React.Dispatch<React.SetStateAction<string>>;
}

const NavigationContext = createContext<NavigationContextProps | undefined>(
  undefined,
);

// Custom hook to use the NavigationContext
export const useAppNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useConsole must be used within a NavigationProvider');
  }
  return context;
};

// NavigationProvider component
export function NavigationProvider({ children }: { children: ReactNode }) {
  const [navState, setNavState] = useState('config');
  // Memoize the value to avoid unnecessary re-renders
  const value = useMemo(
    () => ({
      navState,
      setNavState,
    }),
    [navState, setNavState],
  );
  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
}
export default { ConsoleProvider, NavigationProvider };
