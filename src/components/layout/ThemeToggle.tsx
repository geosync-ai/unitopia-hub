
import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={toggleTheme}
      className="rounded-full bg-transparent hover:bg-white/10 relative overflow-hidden transition-all duration-300 icon-hover-effect"
      aria-label="Toggle theme"
    >
      <div className="absolute inset-0 opacity-0 bg-gradient-to-br from-intranet-primary/20 to-intranet-secondary/20 hover:opacity-100 transition-opacity duration-300 rounded-full" />
      {theme === 'dark' ? (
        <Sun className="h-5 w-5 animate-fade-in" />
      ) : (
        <Moon className="h-5 w-5 animate-fade-in" />
      )}
    </Button>
  );
};

export default ThemeToggle;
