import { StyleSheet } from "react-native";
import { COLORS } from "../core/colors";

export const message = StyleSheet.create({
    container: {
        width: '100%',
        height: '100%',
        backgroundColor: COLORS.white,
    },
    listContainer: {
        width: '100%',
        height: 102,
    },
    listHeader: {
        width: '100%',
        shadowColor: COLORS.black,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
    },
    heading : {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.black,
        paddingVertical: 5,
    },
    avatar: {
        width: 55,
        height: 55,
        borderRadius: 27.5, // Half of width/height for perfect circle
    },
    avatarContainer: {
        position: 'relative',
    },
    onlineIndicator: {
        position: 'absolute',
        top: 2,
        right: 2,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: COLORS.green,
        borderWidth: 2,
        borderColor: COLORS.white,
    },
    horizontalScrollContent: {
        paddingHorizontal: 20,
        alignItems: 'flex-start',
    },
    userItem: {
        marginRight: 15,
        alignItems: 'center',
    },
    messageContainer: {
        width: '100%',
        height: 80,
        borderRadius: 10,
        padding: 5,
        backgroundColor: '#C8EBCB47',

    },
    messageHeader: {
        width: '100%',
        height: 70,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    messageAvatar: {
        width: 55,
        height: 55,
        borderRadius: 27.5, // Half of width/height for perfect circle
    },
    messageNameContainer: {
        width: '250%',
        height: '100%',
        marginLeft: 10,
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'center',
        gap: 5,
    },
    messageName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.black,
    },
    messageTimeContainer: {
        width: '100%',
        height: '100%',
        flexDirection: 'column',
        alignItems: 'flex-end',
        justifyContent: 'center',
        marginLeft: 15,
        gap: 5,
    },
    messageTime: {
        fontSize: 12,
        color: COLORS.blackTransparent,
        fontWeight: 'bold',
        textAlign: 'right',
    },
    badgeContainer: {
        minWidth: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: COLORS.green,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 6,
    },
    badgeText: {
        color: COLORS.white,
        fontWeight: 'bold',
        fontSize: 11,
    },
        messageContent: {
        fontSize: 12,
        color: COLORS.blackTransparent,
    },
    messagesListContainer: {
        width: '100%',
        gap: 10,
    },
})  