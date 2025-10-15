import * as React from "react";

import { NavLink, useLocation } from 'react-router-dom';
import { TeamSwitcher } from './team-switcher';
import { useAuthStore } from '../stores/auth.store';
import {
  Sidebar as SidebarPrimitive,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupContent,
  SidebarFooter,
  SidebarGroupLabel,
} from './ui/sidebar';
import { Avatar, AvatarFallback } from './ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  RiDashboardLine,
  RiBox3Line,
  RiMapPinLine,
  RiTeamLine,
  RiSettings3Line,
  RiLogoutBoxLine,
  RiMoreLine,
} from '@remixicon/react';

export function AppSidebar({ ...props }: React.ComponentProps<typeof SidebarPrimitive>) {
  const { user, logout } = useAuthStore();
  const location = useLocation();

  const data = {
    teams: [
      {
        name: 'ZoneFlow',
        logo: 'https://raw.githubusercontent.com/origin-space/origin-images/refs/heads/main/exp1/logo-01_kp2j8x.png',
      },
      {
        name: 'Acme Corp.',
        logo: 'https://raw.githubusercontent.com/origin-space/origin-images/refs/heads/main/exp1/logo-01_kp2j8x.png',
      },
      {
        name: 'Evil Corp.',
        logo: 'https://raw.githubusercontent.com/origin-space/origin-images/refs/heads/main/exp1/logo-01_kp2j8x.png',
      },
    ],
    navMain: [
      {
        name: 'Sections',
        href: '#',
        items: [
          { name: 'Dashboard', href: '/dashboard', icon: RiDashboardLine },
          { name: 'Orders', href: '/orders', icon: RiBox3Line },
          { name: 'Geofences', href: '/geofences', icon: RiMapPinLine },
          ...(user?.role !== 'driver'
            ? [{ name: 'Drivers', href: '/drivers', icon: RiTeamLine }]
            : [])
        ],
      },
      {
        name: 'Other',
        href: '#',
        items: [
          { name: 'Settings', href: '/settings', icon: RiSettings3Line },
        ],
      },
    ],
  };

  // Generate user initials from name
  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Format role for display
  const formatRole = (role: string) => {
    return role.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <SidebarPrimitive {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
        <hr className="border-t border-border mx-2 -mt-px" />
      </SidebarHeader>

      <SidebarContent>
        {/* We create a SidebarGroup for each parent. */}
        {data.navMain.map((item) => (
          <SidebarGroup key={item.name}>
            <SidebarGroupLabel className="uppercase text-muted-foreground/60">
              {item.name}
            </SidebarGroupLabel>
            <SidebarGroupContent className="px-2">
              <SidebarMenu>
                {item.items.map((item) => (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton
                      asChild
                      className="group/menu-button font-medium gap-3 h-9 rounded-md bg-gradient-to-r hover:bg-transparent hover:from-sidebar-accent hover:to-sidebar-accent/40 data-[active=true]:from-primary/20 data-[active=true]:to-primary/5 [&>svg]:size-auto"
                      isActive={location.pathname === item.href}
                      tooltip={item.name}
                    >
                      <NavLink to={item.href}>
                        {item.icon && (
                          <item.icon
                            className="text-muted-foreground/60 group-data-[active=true]/menu-button:text-primary h-[22px] w-[22px]"
                            aria-hidden="true"
                          />
                        )}
                        <span>{item.name}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <hr className="border-t border-border mx-2 -mt-px" />
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary-100 text-primary-700 text-sm font-medium">
                    {getUserInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{user.name}</span>
                  <span className="truncate text-xs text-sidebar-foreground/70">
                    {formatRole(user.role)}
                  </span>
                </div>
                <RiMoreLine className="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
              side="bottom"
              align="end"
              sideOffset={4}
            >
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary-100 text-primary-700 text-sm font-medium">
                      {getUserInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{user.name}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {user.email}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-red-600 focus:text-red-600"
              >
                <RiLogoutBoxLine className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </SidebarFooter>
    </SidebarPrimitive>
  );
};
