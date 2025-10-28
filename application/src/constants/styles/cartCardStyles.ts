import { StyleSheet, Dimensions } from "react-native";
import { COLORS } from "../core/colors";

const { width: screenWidth } = Dimensions.get('window');

export const cartCardStyles = StyleSheet.create({
    cartCard: {
        width: '100%',
        minHeight: 120, // Increased height
        backgroundColor: COLORS.white,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
        paddingHorizontal: screenWidth * 0.04,
        paddingVertical: screenWidth * 0.03,
        // Shadow for iOS
        shadowColor: COLORS.blackTransparent,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        // Shadow for Android
        elevation: 4,
    },
    Card: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: screenWidth * 0.02, // Reduced margin
    },
    Info: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        flex: 0.6, // Reduced from 1 to 0.6
        marginLeft: screenWidth * 0.02, // Reduced margin
        paddingVertical: 5,
    },
    Image: {
        width: screenWidth * 0.18, // Slightly smaller
        height: screenWidth * 0.18,
        maxWidth: 70,
        maxHeight: 70,
        minWidth: 60,
        minHeight: 60,
        borderRadius: 8,
        resizeMode: 'cover',
    },
    title: {
        fontSize: screenWidth * 0.04,
        fontWeight: 'bold',
        color: COLORS.black,
        paddingVertical: 2,
        maxWidth: screenWidth * 0.3, // Further reduced from 0.4
    },
    desc: {
        fontSize: screenWidth * 0.032,
        fontWeight: 'normal',
        color: COLORS.blackTransparent,
        paddingVertical: 2,
        maxWidth: screenWidth * 0.3, // Further reduced from 0.4
        lineHeight: screenWidth * 0.04,
    },
    price: {
        fontSize: screenWidth * 0.032,
        fontWeight: 'normal',
        color: COLORS.blackTransparent,
        paddingVertical: 2,
    },
    buttonContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: screenWidth * 0.015, // Reduced gap
        minWidth: screenWidth * 0.3, // Increased minimum width
        paddingLeft: screenWidth * 0.02,
    },
    button: {
        borderWidth: 0.5,
        borderColor: COLORS.blackTransparent,
        borderRadius: 2,
        width: screenWidth * 0.07, // Slightly larger
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
        padding: 5,
        alignItems: 'center',
        justifyContent: 'center',
    },
})