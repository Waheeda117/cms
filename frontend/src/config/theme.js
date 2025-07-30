export const themes = {
  dark: {
    // Backgrounds
    primary: 'from-gray-900 via-gray-900 to-emerald-900',
    card: 'bg-gray-900',
    cardOpacity: 'bg-gray-800 bg-opacity-50',
    cardSecondary: 'bg-gray-800 bg-opacity-50',
    input: 'bg-gray-800 bg-opacity-50',
    
    // Borders
    border: 'border-gray-800',
    borderSecondary: 'border-gray-700',
    
    // Text
    textPrimary: 'text-white',
    textSecondary: 'text-gray-300',
    textMuted: 'text-gray-400',
    
    // Gradients
    gradient: 'from-gray-400 to-emerald-600',
    buttonGradient: 'from-gray-500 to-emerald-600',
    buttonGradientHover: 'hover:from-gray-600 hover:to-emerald-700',
    
    // Focus states
    focus: 'focus:border-emerald-500 focus:ring-emerald-500',
  },
  
  light: {
    // Backgrounds
    primary: 'from-slate-50 via-slate-100 to-emerald-200',
    card: 'bg-white',
    cardOpacity: 'bg-white bg-opacity-90',
    cardSecondary: 'bg-slate-50 bg-opacity-90',
    input: 'bg-white bg-opacity-90',
    
    // Borders
    border: 'border-slate-200',
    borderSecondary: 'border-slate-300',
    
    // Text
    textPrimary: 'text-slate-900',
    textSecondary: 'text-slate-700',
    textMuted: 'text-slate-500',
    
    // Gradients
    gradient: 'from-slate-600 to-emerald-600',
    buttonGradient: 'from-slate-500 to-emerald-600',
    buttonGradientHover: 'hover:from-slate-600 hover:to-emerald-700',
    
    // Focus states
    focus: 'focus:border-emerald-500 focus:ring-emerald-500',
  }
};

export const getTheme = (isDark) => isDark ? themes.dark : themes.light;