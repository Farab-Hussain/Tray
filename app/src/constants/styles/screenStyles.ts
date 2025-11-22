import { StyleSheet } from 'react-native';
import { COLORS } from '../core/colors';

export const screenStyles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: COLORS.white,
        display: 'flex',
        justifyContent: 'center',
    },
    heading: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.black,
        paddingVertical: 15,
    },
    section: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
    },
    link: {
        color: COLORS.red,
        textDecorationLine: 'underline',
        textTransform: 'capitalize',
        fontWeight: '600',
    },

    safeArea: {
        flex: 1,
        backgroundColor: COLORS.green,
    },
    safeAreaWhite: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    consultantList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        width: '100%',
    },
    consultantCardWrapper: {
        width: '48%',   
        marginBottom: 20,
        alignItems: 'stretch',
    },

    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
    },

    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.black,
    },

    scrollViewContainer: {
        flex: 1,
        backgroundColor: COLORS.white,
        paddingHorizontal: 20,
    },

    scrollViewContainerWhite: {
        flex: 1,
        backgroundColor: COLORS.white,
        paddingHorizontal: 20,
    },

    scrollViewContent: {
        paddingTop: 20,
        paddingBottom: 10,
    },

    spacer: {
        width: 24,

    },

    // Loading and empty states
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
        backgroundColor: COLORS.white,
    },

    loadingText: {
        textAlign: 'center',
        padding: 20,
        color: COLORS.gray,
        fontSize: 14,
        marginTop: 10,
    },

    emptyStateText: {
        textAlign: 'center',
        padding: 20,
        color: COLORS.lightGray,
        fontSize: 14,
    },

    // Center aligned text styles
    centerAlignedContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.white,
    },

    helpText: {
        color: COLORS.gray,
        textAlign: 'center',
        marginTop: 20,
    },

    centerAlignedText: {
        textAlign: 'center',
        backgroundColor: COLORS.white,
    },
});