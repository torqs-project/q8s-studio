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
  const [output, setOutput] = useState<React.JSX.Element[]>([
    <div key={1029481902841234} className="test">
      <p>Command output:</p>{' '}
      <button
        className="clearBtn"
        type="button"
        onClick={() => {
          setOutput([output[0]]);
        }}
      >
        Clear output
      </button>
    </div>,
  ]);
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
export default { ConsoleProvider };
