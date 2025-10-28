import { StyleSheet } from 'react-native';
import { COLORS } from './colors';
export const globalStyles = StyleSheet.create({
    splash: {
        flex: 1,
        backgroundColor: COLORS.black,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
    },
    logo: {
        width: 250,
        height: 200,
    },
    ButtonContainer: {
        position: 'absolute',
        bottom: 0,
        width: '100%',
        left: 0,
        backgroundColor: COLORS.white, // If you want to use COLORS.yellow, change here
        borderRadius: 30,
        alignItems: 'center',
        paddingVertical: 30,
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
        paddingHorizontal: 20,
    },
    heading: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.black,
        marginBottom: 30,
        textAlign: 'center',
    },
    yellowButton: {
        backgroundColor: COLORS.yellow,
        borderRadius: 25,
        width: '100%',
        paddingVertical: 16,
        marginBottom: 16,
        alignItems: 'center',
    },
    blackButton: {
        backgroundColor: COLORS.black,
        borderRadius: 25,
        width: '100%',
        paddingVertical: 16,
        marginBottom: 16,
        alignItems: 'center',
    },
    buttonTextBlack: {
        color: COLORS.black,
        fontWeight: 'bold',
        fontSize: 16,
        letterSpacing: 1,
    },
    buttonTextWhite: {
        color: COLORS.white,
        fontWeight: 'bold',
        fontSize: 16,
        letterSpacing: 1,
    },
});
