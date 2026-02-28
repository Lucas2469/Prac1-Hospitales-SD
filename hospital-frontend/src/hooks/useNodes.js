import { useApp } from '../context/AppContext.tsx';

export const useNodes = () => {
  const { nodes } = useApp();
  return nodes;
};
