import { StyleSheet, Dimensions } from "react-native";
import { COLORS } from "../core/colors";

const { width: screenWidth } = Dimensions.get('window');

export const cartCardStyles = StyleSheet.create({
    cartCard: {
        width: '100%',
        minHeight: 130,
        backgroundColor: COLORS.white,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        // Shadow for iOS
        shadowColor: COLORS.blackTransparent,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        // Shadow for Android
        elevation: 3,
    },
    Card: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 12,
    },
    Info: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'center',
        flex: 1,
        marginLeft: 12,
        paddingVertical: 4,
    },
    Image: {
        width: 80,
        height: 80,
        borderRadius: 10,
        resizeMode: 'cover',
        backgroundColor: COLORS.lightGray,
    },
    consultantName: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.black,
        marginBottom: 4,
        width: '100%',
    },
    serviceName: {
        fontSize: 14,
        fontWeight: '400',
        color: COLORS.blackTransparent,
        marginBottom: 6,
        width: '100%',
    },
    price: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.blackTransparent,
    },
    button: {
        borderWidth: 0.5,
        borderColor: COLORS.blackTransparent,
        borderRadius: 2,
        width: screenWidth * 0.07,
        height: screenWidth * 0.07,
        minWidth: 28,
        minHeight: 28,
        maxWidth: 35,
        maxHeight: 35,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.white,
    },
    buttonText: {
        fontSize: screenWidth * 0.04,
        fontWeight: '600',
        color: COLORS.black,
        textAlign: 'center',
    },
    deleteButton: {
        padding: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8,
    },
})