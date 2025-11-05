import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Profile } from "../../constants/styles/profile";
import { ChevronRight } from "lucide-react-native";
import { COLORS } from "../../constants/core/colors";

type ProfileListProps = {
    icon: React.ReactElement<{ color?: string; size?: number }>;
    text: string;
    onPress: () => void;
}

const ProfileList = ({ icon, text, onPress }: ProfileListProps) => {
    return (
        <TouchableOpacity style={Profile.list} onPress={onPress}>
            <View style={Profile.listIcon}>
                <View style={Profile.listIconCircle}>
                    {React.cloneElement(icon, { color: COLORS.green })}
                </View>
                <Text style={Profile.listText}>{text}</Text>
            </View>
            <ChevronRight size={24} color={COLORS.blackTransparent} />
        </TouchableOpacity>
    )
}

export default ProfileList;