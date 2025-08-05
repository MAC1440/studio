"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { type ThemeProviderProps } from "next-themes/dist/types"
import { useTheme as useNextTheme } from "next-themes"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}

export const useTheme = () => {
  const { theme, setTheme: setNextTheme, ...rest } = useNextTheme()

  const isDark = theme?.includes('dark') || theme === 'midnight' || theme === 'forest';

  const setTheme = (newTheme: string) => {
    if (newTheme === 'midnight') {
      // For custom dark themes, we apply both 'dark' and the specific theme class
      document.documentElement.classList.add('dark', 'theme-midnight');
      document.documentElement.classList.remove('theme-forest');
      setNextTheme('midnight');
    } else if (newTheme === 'forest') {
      document.documentElement.classList.add('dark', 'theme-forest');
      document.documentElement.classList.remove('theme-midnight');
      setNextTheme('forest');
    } else {
      // For standard themes, remove custom dark theme classes
      document.documentElement.classList.remove('theme-midnight', 'theme-forest');
      if (newTheme === 'dark') {
          document.documentElement.classList.add('dark');
      }
      setNextTheme(newTheme);
    }
  };

  React.useEffect(() => {
    // This effect ensures the correct classes are present on initial load
    const currentTheme = localStorage.getItem('theme'); // next-themes uses localStorage
    if (currentTheme === 'midnight') {
      document.documentElement.classList.add('dark', 'theme-midnight');
    } else if (currentTheme === 'forest') {
      document.documentElement.classList.add('dark', 'theme-forest');
    }
  }, []);

  return {
    theme,
    setTheme,
    isDark,
    ...rest,
  };
};
