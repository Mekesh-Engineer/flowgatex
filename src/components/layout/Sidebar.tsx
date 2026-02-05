import { Link, useLocation } from 'react-router-dom';
import { Box, Typography, IconButton, Tooltip } from '@mui/material';
import {
  LayoutDashboard,
  Calendar,
  Ticket,
  Users,
  BarChart3,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Cpu,
  TrendingUp,
  Server,
} from 'lucide-react';
import { useSidebarStore } from '@/store/zustand/stores';
import { useAppSelector } from '@/store/redux/hooks';
import { NAV_ITEMS, UserRole } from '@/lib/constants';

interface NavItem {
  label: string;
  path: string;
  icon: string;
}

const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard,
  Calendar,
  Ticket,
  Users,
  BarChart3,
  Settings,
  HelpCircle,
  Cpu,
  TrendingUp,
  Server,
};

function Sidebar() {
  const location = useLocation();
  const { isCollapsed, toggleCollapsed } = useSidebarStore();
  const { user } = useAppSelector((state) => state.auth);

  const getNavItems = (): NavItem[] => {
    switch (user?.role) {
      case UserRole.ADMIN:
        return NAV_ITEMS.admin;
      case UserRole.ORGANIZER:
        return NAV_ITEMS.organizer;
      default:
        return NAV_ITEMS.user;
    }
  };

  const navItems = getNavItems();

  return (
    <Box
      sx={{
        width: isCollapsed ? 80 : 280,
        minWidth: isCollapsed ? 80 : 280,
        height: '100vh',
        position: 'sticky',
        top: 0,
        backgroundColor: 'background.default',
        borderRight: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.3s ease',
        overflow: 'hidden',
      }}
    >
      {/* Logo */}
      <Box
        sx={{
          p: 3,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            background: 'linear-gradient(135deg, #22d3ee 0%, #6366f1 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#0a0a0f' }}>
            FX
          </Typography>
        </Box>
        {!isCollapsed && (
          <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
            FlowGateX
          </Typography>
        )}
      </Box>

      {/* Navigation */}
      <Box sx={{ flex: 1, py: 2, px: 2, overflowY: 'auto' }}>
        {navItems.map((item) => {
          const Icon = iconMap[item.icon] || LayoutDashboard;
          const isActive = location.pathname === item.path;

          return (
            <Tooltip key={item.path} title={isCollapsed ? item.label : ''} placement="right">
              <Box
                component={Link}
                to={item.path}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  px: 2,
                  py: 1.5,
                  mb: 0.5,
                  borderRadius: 2,
                  textDecoration: 'none',
                  color: isActive ? 'primary.main' : 'text.secondary',
                  backgroundColor: isActive ? 'rgba(34, 211, 238, 0.1)' : 'transparent',
                  borderLeft: isActive ? '3px solid' : '3px solid transparent',
                  borderColor: isActive ? 'primary.main' : 'transparent',
                  transition: 'all 0.2s',
                  '&:hover': {
                    backgroundColor: isActive ? 'rgba(34, 211, 238, 0.1)' : 'background.paper',
                    color: isActive ? 'primary.main' : 'text.primary',
                  },
                }}
              >
                <Icon size={20} />
                {!isCollapsed && (
                  <Typography variant="body2" sx={{ fontWeight: isActive ? 500 : 400 }}>
                    {item.label}
                  </Typography>
                )}
              </Box>
            </Tooltip>
          );
        })}
      </Box>

      {/* Footer */}
      <Box
        sx={{
          p: 2,
          borderTop: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'space-between',
        }}
      >
        {!isCollapsed && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LogOut size={18} className="text-dark-500" />
            <Typography variant="body2" color="text.secondary">
              Logout
            </Typography>
          </Box>
        )}
        <IconButton
          onClick={toggleCollapsed}
          size="small"
          sx={{ color: 'text.secondary' }}
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </IconButton>
      </Box>
    </Box>
  );
}

export default Sidebar;
