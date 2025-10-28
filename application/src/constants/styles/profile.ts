import { StyleSheet } from "react-native";
import { COLORS } from "../core/colors";

export const Profile = StyleSheet.create({
    container: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 50,
    },
    name: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.black,
        paddingVertical: 10,
    },
    email: {
        fontSize: 16,
        color: COLORS.blackTransparent,
    },
    button: {
        backgroundColor: COLORS.green,
        padding: 10,
        borderRadius: 5,
    },
    buttonText: {
        color: COLORS.white,
        fontWeight: 'bold',
    },
    list: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 5,
        width: '100%',
        // marginTop: 10,
        // backgroundColor: COLORS.yellow,
    },
    listContainer: {
        width: '100%',
        // marginTop: 10,
        gap: 10,
    },
    listText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.black,
    },
    listIcon: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        width: '80%',
        gap: 20,
        
    },
    listIconText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.black,
    },
    listIconCircle: {
        backgroundColor: '#60C16947', 
        borderRadius: 25,
        padding: 10,
        // justifyContent: "center",
        // alignItems: "center",
    },
    statusBadge: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginTop: 8,
        marginBottom: 16,
    },
    statusText: {
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
    }
})