"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { type ThemeProviderProps } from "next-themes/dist/types"
import { useTheme as useNextTheme } from "next-themes"


export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}

export const useTheme = () => {
    const { theme, setTheme, ...rest } = useNextTheme();
    const isDark = theme?.startsWith('dark') || theme === 'midnight' || theme === 'forest';

    return {
        theme,
        setTheme,
        isDark,
        ...rest,
    };
};
