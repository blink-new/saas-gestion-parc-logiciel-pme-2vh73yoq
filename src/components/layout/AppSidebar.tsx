import { 
  LayoutDashboard, 
  Package, 
  MessageSquare, 
  BarChart3, 
  Settings, 
  Bell,
  LogOut,
  User as UserIcon
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '../ui/sidebar'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { blink } from '../../blink/client'
import { User } from '../../types'

type Page = 'dashboard' | 'catalog' | 'requests' | 'analytics' | 'settings'

interface AppSidebarProps {
  user: User
  currentPage: Page
  onPageChange: (page: Page) => void
}

const menuItems = [
  {
    id: 'dashboard' as const,
    title: 'Tableau de bord',
    icon: LayoutDashboard,
  },
  {
    id: 'catalog' as const,
    title: 'Catalogue logiciels',
    icon: Package,
  },
  {
    id: 'requests' as const,
    title: 'Demandes',
    icon: MessageSquare,
    badge: 3, // TODO: Dynamic count
  },
  {
    id: 'analytics' as const,
    title: 'Analytics',
    icon: BarChart3,
  },
  {
    id: 'settings' as const,
    title: 'Paramètres',
    icon: Settings,
  },
]

export function AppSidebar({ user, currentPage, onPageChange }: AppSidebarProps) {
  const handleLogout = () => {
    blink.auth.logout()
  }

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-4 py-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Package className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-semibold text-sidebar-foreground">LogicielHub</h1>
            <p className="text-xs text-sidebar-foreground/60">Gestion de parc</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => onPageChange(item.id)}
                    isActive={currentPage === item.id}
                    className="w-full justify-start"
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.title}</span>
                    {item.badge && (
                      <Badge variant="secondary" className="ml-auto">
                        {item.badge}
                      </Badge>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <div className="p-4 space-y-2">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-sidebar-accent rounded-full flex items-center justify-center">
              <UserIcon className="w-4 h-4 text-sidebar-accent-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {user.displayName}
              </p>
              <p className="text-xs text-sidebar-foreground/60 truncate">
                {user.email}
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 justify-start text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <Bell className="w-4 h-4 mr-2" />
              Notifications
            </Button>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Déconnexion
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}