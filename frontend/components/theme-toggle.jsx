"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import useThemeStore from "@/store/use-theme-store";

export default function ThemeToggle() {
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);

  return (
    <Button
      variant="ghost"
      size="icon-xs"
      onClick={toggleTheme}
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className="h-7 w-7 rounded-sm text-muted-foreground hover:text-foreground"
    >
      {theme === "dark" ? (
        <Sun className="size-3.5" />
      ) : (
        <Moon className="size-3.5" />
      )}
    </Button>
  );
}
