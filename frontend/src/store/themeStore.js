import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useThemeStore = create(
  persist(
    (set, get) => ({
      isDarkMode: false,
      
      toggleTheme: () => {
        const newMode = !get().isDarkMode;
        set({ isDarkMode: newMode });
        
        // Update document class for theme
        if (newMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      },
      
      initializeTheme: () => {
        const isDark = get().isDarkMode;
        if (isDark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    }),
    {
      name: "theme-storage",
    }
  )
);