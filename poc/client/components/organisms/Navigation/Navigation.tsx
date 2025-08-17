import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Plus, Bell, Settings, User, LogOut, Menu, X } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../lib/hooks';
import { logoutAndClearState } from '../../../lib/actions';
import { selectIsAuthenticated } from '../../../lib/selectors';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '../../ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../ui/dropdown-menu';

export function Navigation() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isDashboard = location.pathname === '/dashboard' || location.pathname === '/dashboard/internal';

  const handleNavigation = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    dispatch(logoutAndClearState());
    navigate('/');
  };

  // Mobile menu animation variants
  const menuVariants = {
    closed: {
      opacity: 0,
      height: 0,
      transition: {
        duration: 0.2,
        ease: [0.4, 0.0, 1, 1],
        when: "afterChildren"
      }
    },
    open: {
      opacity: 1,
      height: "auto",
      transition: {
        duration: 0.3,
        ease: [0.0, 0.0, 0.2, 1],
        staggerChildren: 0.05,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    closed: { opacity: 0, x: -20 },
    open: { 
      opacity: 1, 
      x: 0,
      transition: {
        duration: 0.2,
        ease: [0.0, 0.0, 0.2, 1]
      }
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full backdrop-blur border-b bg-white/95 border-gray-200" aria-label="Main navigation">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 sm:h-16 items-center justify-between">
          {/* Logo and Navigation Links */}
          <div className="flex items-center space-x-6 sm:space-x-8">
            <motion.button
              onClick={() => handleNavigation('/')}
              className="flex items-center space-x-2 hover:opacity-80 transition-opacity min-h-[44px]"
              aria-label="Rails homepage"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <motion.div 
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: '#030213' }}
                whileHover={{ 
                  rotate: 5,
                  scale: 1.1,
                  transition: { type: "spring", stiffness: 300, damping: 15 }
                }}
              >
                <span className="font-bold text-sm sm:text-base" style={{ color: '#ffffff' }}>R</span>
              </motion.div>
              <span className="font-semibold text-base sm:text-lg">Rails</span>
            </motion.button>
            
            {!isDashboard ? (
              // Marketing site navigation
              <div className="hidden md:flex items-center space-x-4 lg:space-x-6">
                {[
                  { key: '/', label: 'Home', path: '/' },
                  { key: '/products', label: 'Products', path: '/products' },
                  { key: 'apis', label: 'APIs', href: '#apis' },
                  { key: 'docs', label: 'Documentation', href: '#docs' },
                  { key: 'pricing', label: 'Pricing', href: '#pricing' },
                  { key: '/dashboard', label: 'Dashboard', path: '/dashboard' }
                ].map((item) => (
                  <motion.button
                    key={item.key}
                    onClick={item.path ? () => handleNavigation(item.path) : undefined}
                    className="min-h-[44px] px-2 transition-colors text-sm lg:text-base relative"
                    style={{
                      color: location.pathname === item.key ? '#030213' : '#717182'
                    }}
                    whileHover={{ 
                      scale: 1.02,
                      transition: { type: "spring", stiffness: 400, damping: 10 }
                    }}
                    whileTap={{ 
                      scale: 0.98,
                      transition: { duration: 0.1 }
                    }}
                  >
                    {item.label}
                    {location.pathname === item.key && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute bottom-0 left-0 right-0 h-0.5"
                        style={{ backgroundColor: '#030213' }}
                        initial={false}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}
                  </motion.button>
                ))}
              </div>
            ) : (
              // Dashboard navigation
              <div className="hidden md:flex items-center space-x-4 lg:space-x-6">
                {[
                  { key: 'overview', label: 'Overview', active: true },
                  { key: 'settlements', label: 'Settlements' },
                  { key: 'banks', label: 'Banks' },
                  { key: 'reserves', label: 'Reserves' },
                  { key: 'analytics', label: 'Analytics' }
                ].map((item) => (
                  <motion.button
                    key={item.key}
                    className={`min-h-[44px] px-2 transition-colors text-sm lg:text-base relative ${
                      item.active ? 'text-foreground' : 'text-muted-foreground hover:text-primary'
                    }`}
                    whileHover={{ 
                      scale: 1.02,
                      transition: { type: "spring", stiffness: 400, damping: 10 }
                    }}
                    whileTap={{ 
                      scale: 0.98,
                      transition: { duration: 0.1 }
                    }}
                  >
                    {item.label}
                    {item.active && (
                      <motion.div
                        layoutId="activeDashboardTab"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                        initial={false}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}
                  </motion.button>
                ))}
              </div>
            )}
          </div>

          {/* Right side actions */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {!isDashboard ? (
              // Marketing site actions
              <div className="hidden sm:flex items-center space-x-2 sm:space-x-3">
                <Button 
                  variant="ghost" 
                  className="min-h-[44px] px-3 sm:px-4 text-sm sm:text-base text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  motionPreset="subtle"
                  onClick={() => handleNavigation('/login')}
                >
                  Bank Login
                </Button>
                <Button 
                  className="min-h-[44px] px-3 sm:px-4 text-sm sm:text-base bg-brand-950 text-white hover:bg-brand-900"
                  motionPreset="default"
                  onClick={() => handleNavigation('/register')}
                >
                  Get Started
                </Button>
              </div>
            ) : (
              // Dashboard actions
              <>
                {/* Search Field */}
                <motion.div 
                  className="relative hidden lg:block"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
                  <Input
                    type="search"
                    placeholder="Search transactions..."
                    className="pl-10 w-48 xl:w-64 min-h-[44px] bg-white border border-gray-200"
                  />
                </motion.div>

                {/* New Settlement Button */}
                <Button 
                  className="hidden sm:flex items-center space-x-2 min-h-[44px] px-4 text-sm"
                  motionPreset="default"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden lg:inline">New Settlement</span>
                  <span className="lg:hidden">New</span>
                </Button>

                {/* Mobile New Settlement Button */}
                <Button 
                  size="icon" 
                  className="sm:hidden min-h-[44px] min-w-[44px]"
                  aria-label="New settlement"
                  motionPreset="default"
                >
                  <Plus className="w-4 h-4" />
                </Button>

                {/* Notifications */}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="min-h-[44px] min-w-[44px] relative bg-white hover:bg-gray-50 border border-gray-200"
                  aria-label="Notifications"
                  motionPreset="subtle"
                >
                  <Bell className="w-4 h-4" />
                  <motion.span
                    className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </Button>

                {/* Avatar Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-8 w-8 sm:h-9 sm:w-9 rounded-full min-h-[44px] min-w-[44px] flex items-center justify-center bg-white hover:bg-gray-50 border border-gray-200"
                      aria-label="User menu"
                      motionPreset="subtle"
                    >
                      <Avatar className="h-7 w-7 sm:h-8 sm:w-8">
                        <AvatarImage src="https://github.com/shadcn.png" alt="User avatar" />
                        <AvatarFallback>SA</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">Sarah Admin</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          sarah@rails.co.za
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="min-h-[44px] flex items-center cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="min-h-[44px] flex items-center cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="min-h-[44px] flex items-center cursor-pointer" onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden min-h-[44px] min-w-[44px]"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
              motionPreset="subtle"
            >
              <AnimatePresence mode="wait">
                {mobileMenuOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <X className="w-4 h-4" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Menu className="w-4 h-4" />
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial="closed"
              animate="open"
              exit="closed"
              variants={menuVariants}
              className="md:hidden border-t border-border overflow-hidden"
            >
              <div className="py-4 space-y-1">
                {!isDashboard ? (
                  <motion.div className="flex flex-col space-y-2" variants={itemVariants}>
                    {[
                      { key: '/', label: 'Home', path: '/' },
                      { key: '/products', label: 'Products', path: '/products' },
                      { key: 'apis', label: 'APIs' },
                      { key: 'docs', label: 'Documentation' },
                      { key: 'pricing', label: 'Pricing' },
                      { key: '/dashboard', label: 'Dashboard', path: '/dashboard' }
                    ].map((item) => (
                      <motion.button
                        key={item.key}
                        onClick={item.path ? () => handleNavigation(item.path) : undefined}
                        variants={itemVariants}
                        className={`text-left min-h-[44px] px-4 flex items-center transition-colors text-base ${
                          location.pathname === item.key 
                            ? 'text-gray-900 bg-gray-100' 
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                        whileHover={{ x: 5 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {item.label}
                      </motion.button>
                    ))}
                    
                    <motion.div variants={itemVariants} className="pt-4 border-t border-gray-200 space-y-2">
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start min-h-[44px] text-base text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                        motionPreset="subtle"
                        onClick={() => handleNavigation('/login')}
                      >
                        Bank Login
                      </Button>
                      <Button 
                        className="w-full justify-start min-h-[44px] text-base bg-brand-950 text-white hover:bg-brand-900"
                        motionPreset="default"
                        onClick={() => handleNavigation('/register')}
                      >
                        Get Started
                      </Button>
                    </motion.div>
                  </motion.div>
                ) : (
                  <motion.div className="flex flex-col space-y-2" variants={itemVariants}>
                    {[
                      { key: 'overview', label: 'Overview', active: true },
                      { key: 'settlements', label: 'Settlements' },
                      { key: 'banks', label: 'Banks' },
                      { key: 'reserves', label: 'Reserves' },
                      { key: 'analytics', label: 'Analytics' }
                    ].map((item) => (
                      <motion.button
                        key={item.key}
                        variants={itemVariants}
                        className={`text-left min-h-[44px] px-4 flex items-center transition-colors text-base ${
                          item.active 
                            ? 'text-foreground bg-muted/50' 
                            : 'text-muted-foreground hover:text-primary hover:bg-muted/30'
                        }`}
                        whileHover={{ x: 5 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {item.label}
                      </motion.button>
                    ))}
                    
                    {/* Mobile search */}
                    <motion.div variants={itemVariants} className="px-4 pt-4 border-t border-border">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
                        <Input
                          type="search"
                          placeholder="Search transactions..."
                          className="pl-10 w-full min-h-[44px] bg-white border border-gray-200"
                        />
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}