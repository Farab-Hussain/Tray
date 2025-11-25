import { BadgeInfo, Bell, LogOut, MessageCircle, FileText, Plus, UserCircle2, LayoutDashboard } from "lucide-react-native";

export const ConsultantProfileListData = [
    {
        id: 0.5,
        icon: UserCircle2,
        text: "Profile",
        route: "ConsultantProfile",
    },
    {
        id: 0.6,
        icon: LayoutDashboard,
        text: "Dashboard",
        route: "ConsultantDashboard",
    },
    {
        id: 1,
        icon: MessageCircle,
        text: "Messages",
        route: "ConsultantMessages",
    },
    {
        id: 10.5,
        icon: FileText,
        text: "My Jobs",
        route: "MyJobs",
    },
    {
        id: 10.6,
        icon: Plus,
        text: "Post a Job",
        route: "PostJob",
    },
    {
        id: 7,
        icon: Bell,
        text: "Notifications",
        route: "ConsultantNotifications",
    },
    {
        id: 8,
        icon: BadgeInfo,
        text: "Help & Support",
        route: "Help",
    },
    {
        id: 9,
        icon: LogOut,
        text: "Logout",
        route: "Logout",
    },
];
