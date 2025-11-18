import { BadgeInfo, Bell, LogOut, MessageCircle, User, Star, ShoppingCart, Lock, UserCircle, Briefcase, FileText, ClipboardList } from "lucide-react-native";

export const ProfileListData = [
    {
        id: 1,
        icon: MessageCircle,
        text: "Messages",
        route: "Messages",
        requiresUnreadCheck: true,
    },
    {
        id: 2,
        icon: User,
        text: "My Consultants",
        route: "BookedConsultants",
    },
    {
        id: 3,
        icon: ShoppingCart,
        text: "My Cart",
        route: "Cart",
    },
    {
        id: 4,
        icon: Star,
        text: "My Reviews",
        route: "MyReviews",
    },
    {
        id: 4.5,
        icon: Briefcase,
        text: "Browse Jobs",
        route: "JobList",
    },
    {
        id: 4.6,
        icon: ClipboardList,
        text: "My Applications",
        route: "MyApplications",
    },
    {
        id: 4.7,
        icon: FileText,
        text: "My Resume",
        route: "Resume",
    },
    {
        id: 5,
        icon: Bell,
        text: "Notifications",
        route: "Notifications",
        requiresUnreadCheck: true,
    },
    {
        id: 6,
        icon: BadgeInfo,
        text: "Help & Support",
        route: "Help",
    },
    {
        id: 7,
        icon: Lock,
        text: "Change Password",
        route: "ChangePassword",
    },
    {
        id: 8,
        icon: UserCircle,
        text: "Change Username",
        route: "ChangeUsername",
    },
    {
        id: 9,
        icon: LogOut,
        text: "Logout",
        route: "Logout",
    },
];