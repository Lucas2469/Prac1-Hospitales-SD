import { useApp } from '../context/AppContext.tsx';

export const useNotifications = () => {
  const { notifications, addNotification, deleteNotification } = useApp();
  return { notifications, addNotification, deleteNotification };
};
