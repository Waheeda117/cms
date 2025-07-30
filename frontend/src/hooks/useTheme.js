import { useThemeStore } from '../store/themeStore';
import { getTheme } from '../config/theme';

export const useTheme = () => {
  const { isDarkMode, toggleTheme } = useThemeStore();
  const theme = getTheme(isDarkMode);
  
  return {
    isDarkMode,
    toggleTheme,
    theme
  };
};