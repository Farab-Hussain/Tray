import { BadgeInfo, Bell, LogOut, MessageCircle, User, Star, Briefcase, CreditCard, Calendar, Clock, Wallet } from "lucide-react-native";

export const ConsultantProfileListData = [
    {
        id: 1,
        icon: MessageCircle,
        text: "Messages",
        route: "ConsultantMessages",
    },
    {
        id: 2,
        icon: User,
        text: "My Clients",
        route: "MyClients",
    },
    {
        id: 3,
        icon: Star,
        text: "My Reviews",
        route: "MyReviews",
    },
    {
        id: 4,
        icon: Briefcase,
        text: "My Services",
        route: "ConsultantServices",
    },
    {
        id: 5,
        icon: Calendar,
        text: "Availability",
        route: "ConsultantAvailability",
    },
    {
        id: 6,
        icon: CreditCard,
        text: "Earnings",
        route: "Earnings",
    },
    {
        id: 10,
        icon: Wallet,
        text: "Payment Setup",
        route: "StripePaymentSetup",
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
