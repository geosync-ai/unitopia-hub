
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Palette } from 'lucide-react';
import { toast } from 'sonner';

// Default themes that can be customized
const defaultThemes = {
  light: {
    primary: '#83002A',
    secondary: '#5C001E',
    accent: '#ff6b6b',
    background: '#f8f9fa',
    text: '#212529',
  },
  dark: {
    primary: '#83002A',
    secondary: '#5C001E',
    accent: '#ff6b6b',
    background: '#1e1e1e',
    text: '#f8f9fa',
  }
};

const ThemeCustomization = () => {
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>('light');
  const [themeColors, setThemeColors] = useState(defaultThemes);
  
  const applyThemeChanges = () => {
    // In a real implementation, this would update CSS variables or a theme context
    toast.success('Theme updated successfully');
    
    // Here you would update your theme context or CSS variables
    document.documentElement.setAttribute('data-theme', currentTheme);
    
    // This is just a placeholder for demonstration
    const root = document.documentElement;
    const theme = themeColors[currentTheme];
    
    root.style.setProperty('--primary', theme.primary);
    root.style.setProperty('--secondary', theme.secondary);
    root.style.setProperty('--accent', theme.accent);
    root.style.setProperty('--background', theme.background);
    root.style.setProperty('--foreground', theme.text);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette size={20} />
          <span>Theme Customization</span>
        </CardTitle>
        <CardDescription>
          Customize the appearance of the application
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">Theme Mode</h3>
                <div className="flex items-center space-x-4">
                  <Button 
                    variant={currentTheme === 'light' ? 'default' : 'outline'} 
                    onClick={() => setCurrentTheme('light')}
                    className="w-32"
                  >
                    Light
                  </Button>
                  <Button 
                    variant={currentTheme === 'dark' ? 'default' : 'outline'} 
                    onClick={() => setCurrentTheme('dark')}
                    className="w-32"
                  >
                    Dark
                  </Button>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Primary Color</h3>
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center gap-3">
                    <input 
                      type="color" 
                      value={themeColors[currentTheme].primary}
                      onChange={(e) => setThemeColors({
                        ...themeColors,
                        [currentTheme]: {
                          ...themeColors[currentTheme],
                          primary: e.target.value
                        }
                      })}
                      className="w-10 h-10 rounded overflow-hidden"
                    />
                    <Input 
                      value={themeColors[currentTheme].primary} 
                      onChange={(e) => setThemeColors({
                        ...themeColors,
                        [currentTheme]: {
                          ...themeColors[currentTheme],
                          primary: e.target.value
                        }
                      })}
                      className="w-32"
                    />
                    <span className="text-sm text-gray-500 dark:text-gray-400">Used for main actions and highlighting</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Secondary Color</h3>
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center gap-3">
                    <input 
                      type="color" 
                      value={themeColors[currentTheme].secondary}
                      onChange={(e) => setThemeColors({
                        ...themeColors,
                        [currentTheme]: {
                          ...themeColors[currentTheme],
                          secondary: e.target.value
                        }
                      })}
                      className="w-10 h-10 rounded overflow-hidden"
                    />
                    <Input 
                      value={themeColors[currentTheme].secondary} 
                      onChange={(e) => setThemeColors({
                        ...themeColors,
                        [currentTheme]: {
                          ...themeColors[currentTheme],
                          secondary: e.target.value
                        }
                      })}
                      className="w-32"
                    />
                    <span className="text-sm text-gray-500 dark:text-gray-400">Used for secondary elements</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Accent Color</h3>
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center gap-3">
                    <input 
                      type="color" 
                      value={themeColors[currentTheme].accent}
                      onChange={(e) => setThemeColors({
                        ...themeColors,
                        [currentTheme]: {
                          ...themeColors[currentTheme],
                          accent: e.target.value
                        }
                      })}
                      className="w-10 h-10 rounded overflow-hidden"
                    />
                    <Input 
                      value={themeColors[currentTheme].accent} 
                      onChange={(e) => setThemeColors({
                        ...themeColors,
                        [currentTheme]: {
                          ...themeColors[currentTheme],
                          accent: e.target.value
                        }
                      })}
                      className="w-32"
                    />
                    <span className="text-sm text-gray-500 dark:text-gray-400">Used for accenting UI elements</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">Background Color</h3>
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center gap-3">
                    <input 
                      type="color" 
                      value={themeColors[currentTheme].background}
                      onChange={(e) => setThemeColors({
                        ...themeColors,
                        [currentTheme]: {
                          ...themeColors[currentTheme],
                          background: e.target.value
                        }
                      })}
                      className="w-10 h-10 rounded overflow-hidden"
                    />
                    <Input 
                      value={themeColors[currentTheme].background} 
                      onChange={(e) => setThemeColors({
                        ...themeColors,
                        [currentTheme]: {
                          ...themeColors[currentTheme],
                          background: e.target.value
                        }
                      })}
                      className="w-32"
                    />
                    <span className="text-sm text-gray-500 dark:text-gray-400">Main background</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Text Color</h3>
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center gap-3">
                    <input 
                      type="color" 
                      value={themeColors[currentTheme].text}
                      onChange={(e) => setThemeColors({
                        ...themeColors,
                        [currentTheme]: {
                          ...themeColors[currentTheme],
                          text: e.target.value
                        }
                      })}
                      className="w-10 h-10 rounded overflow-hidden"
                    />
                    <Input 
                      value={themeColors[currentTheme].text} 
                      onChange={(e) => setThemeColors({
                        ...themeColors,
                        [currentTheme]: {
                          ...themeColors[currentTheme],
                          text: e.target.value
                        }
                      })}
                      className="w-32"
                    />
                    <span className="text-sm text-gray-500 dark:text-gray-400">Main text color</span>
                  </div>
                </div>
              </div>
              
              <div className="p-4 border rounded-md mt-6">
                <h3 className="text-lg font-medium mb-4">Theme Preview</h3>
                <div 
                  className="p-4 rounded-lg mb-4" 
                  style={{ 
                    backgroundColor: themeColors[currentTheme].background,
                    color: themeColors[currentTheme].text
                  }}
                >
                  <h4 className="font-medium mb-2" style={{ color: themeColors[currentTheme].text }}>Preview Content</h4>
                  <p className="text-sm mb-4" style={{ color: themeColors[currentTheme].text }}>This is how your content will look.</p>
                  <div className="flex space-x-2">
                    <button 
                      className="px-3 py-1 rounded text-white"
                      style={{ backgroundColor: themeColors[currentTheme].primary }}
                    >
                      Primary Button
                    </button>
                    <button 
                      className="px-3 py-1 rounded text-white"
                      style={{ backgroundColor: themeColors[currentTheme].secondary }}
                    >
                      Secondary
                    </button>
                    <button 
                      className="px-3 py-1 rounded text-white"
                      style={{ backgroundColor: themeColors[currentTheme].accent }}
                    >
                      Accent
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              variant="outline"
              onClick={() => setThemeColors(defaultThemes)}
            >
              Reset to Default
            </Button>
            <Button onClick={applyThemeChanges}>
              Apply Theme
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ThemeCustomization;
