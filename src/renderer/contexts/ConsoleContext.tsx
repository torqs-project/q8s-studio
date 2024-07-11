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
}
// Define the ConsoleContextProps
interface NavigationStateContextProps {
  navState: string;
  setNavState: React.Dispatch<React.SetStateAction<string>>;
}

const ConsoleContext = createContext<ConsoleContextProps | undefined>(
  undefined,
);
const NavigationStateContext = createContext<
  NavigationStateContextProps | undefined
>(undefined);

// Custom hook to use the ConsoleContext
export const useConsole = () => {
  const context = useContext(ConsoleContext);
  if (!context) {
    throw new Error('useConsole must be used within a ConsoleProvider');
  }
  return context;
};
// Custom hook to use the ConsoleContext
export const useNavigationState = () => {
  const context = useContext(NavigationStateContext);
  if (!context) {
    throw new Error(
      'useNavigationState must be used within a NavigationStateProvider',
    );
  }
  return context;
};

// ConsoleProvider component
export function ConsoleProvider({ children }: { children: ReactNode }) {
  // State for the output
  const [output, setOutput] = useState<React.JSX.Element[]>([]);
  // State for the pKey
  const [pKey, setPKey] = useState(0);
  // Memoize the value to avoid unnecessary re-renders
  const value = useMemo(
    () => ({ output, setOutput, pKey, setPKey }),
    [output, setOutput, pKey, setPKey],
  );
  return (
    <ConsoleContext.Provider value={value}>{children}</ConsoleContext.Provider>
  );
}
// NavigationStateProvider component
export function NavigationStateProvider({ children }: { children: ReactNode }) {
  const [navState, setNavState] = useState('home');
  // Memoize the value to avoid unnecessary re-renders
  const value = useMemo(
    () => ({ navState, setNavState }),
    [navState, setNavState],
  );
  return (
    <NavigationStateContext.Provider value={value}>
      {children}
    </NavigationStateContext.Provider>
  );
}
export default { ConsoleProvider, NavigationStateProvider };
