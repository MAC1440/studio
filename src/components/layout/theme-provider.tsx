
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
    const root = document.documentElement;
    root.classList.remove('theme-midnight', 'theme-forest');

    if (newTheme === 'midnight') {
      root.classList.add('dark', 'theme-midnight');
      setNextTheme('midnight');
    } else if (newTheme === 'forest') {
      root.classList.add('dark', 'theme-forest');
      setNextTheme('forest');
    } else {
      if (newTheme === 'dark') {
          root.classList.add('dark');
      }
      setNextTheme(newTheme);
    }
  };

  React.useEffect(() => {
    const root = document.documentElement;
    const currentTheme = localStorage.getItem('theme'); // next-themes uses localStorage
    if (currentTheme === 'midnight') {
      root.classList.add('dark', 'theme-midnight');
    } else if (currentTheme === 'forest') {
      root.classList.add('dark', 'theme-forest');
    } else if (currentTheme === 'dark') {
      root.classList.add('dark');
    }
  }, []);

  return {
    theme,
    setTheme,
    isDark,
    ...rest,
  };
};
