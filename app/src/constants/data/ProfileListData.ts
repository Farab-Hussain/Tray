import { BadgeInfo, Bell, LogOut, MessageCircle, User, Star } from "lucide-react-native";

export const ProfileListData = [
    {
        id: 1,
        icon: MessageCircle,
        text: "Messages",
        route: "Messages",
    },
    {
        id: 2,
        icon: User,
        text: "My Consultants",
        route: "BookedConsultants",
    },
    {
        id: 3,
        icon: Star,
        text: "My Reviews",
        route: "MyReviews",
    },
    {
        id: 4,
        icon: Bell,
        text: "Notifications",
        route: "Notifications",
    },
    {
        id: 5,
        icon: BadgeInfo,
        text: "Help & Support",
        route: "Help",
    },
    {
        id: 6,
        icon: LogOut,
        text: "Logout",
        route: "Logout",
    },
];