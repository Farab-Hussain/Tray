import { BadgeInfo, Bell, LogOut, Briefcase, UserCog } from "lucide-react-native";

export const RecruiterProfileListData = [
    {
        id: 0.5,
        icon: UserCog,
        text: "Profile",
        route: "RecruiterProfile",
    },
    {
        id: 1,
        icon: Briefcase,
        text: "Jobs",
        route: "RecruiterJobs",
    },
    {
        id: 2,
        icon: Bell,
        text: "Notifications",
        route: "Notifications",
    },
    {
        id: 3,
        icon: BadgeInfo,
        text: "Help & Support",
        route: "Help",
    },
    {
        id: 4,
        icon: LogOut,
        text: "Logout",
        route: "Logout",
    },
];

