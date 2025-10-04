import { Home, Users, BookOpen, Calendar, FileText } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { Link, useLocation } from "wouter";
import logoImage from "@assets/6267064765221899735-removebg-preview_1759543320279.png";

const menuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
  },
  {
    title: "Data Halaqah",
    url: "/data-halaqah",
    icon: Users,
  },
  {
    title: "Perkembangan",
    url: "/perkembangan",
    icon: BookOpen,
  },
  {
    title: "Kalender & Tugas",
    url: "/kalender",
    icon: Calendar,
  },
  {
    title: "Laporan",
    url: "/laporan",
    icon: FileText,
  },
];

export function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b">
        <div className="flex flex-col items-center gap-3">
          <div className="w-20 h-20 rounded-full bg-white p-2 flex items-center justify-center">
            <img 
              src={logoImage} 
              alt="Lajnah Al-Qur'an Logo" 
              className="w-full h-full object-contain"
              data-testid="img-logo"
            />
          </div>
          <h2 className="text-lg font-bold text-center" data-testid="text-brand-name">
            Lajnah Al-Qur'an
          </h2>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url} data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
                    <Link href={item.url}>
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
