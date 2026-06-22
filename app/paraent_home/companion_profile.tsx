import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import BackButton from '../../components/BackButton';
import { Colors } from '../../constants/Colors';
import { Fonts } from '../../constants/Fonts';

const parsePermissions = (value?: string) => (
    value ? value.split(',').map((item) => item.trim()).filter(Boolean) : []
);

export default function CompanionProfile() {
    const params = useLocalSearchParams<{
        name?: string;
        relation?: string;
        phone?: string;
        status?: string;
        permissions?: string;
    }>();

    const name = params.name || '동행인';
    const relation = params.relation || '동행인';
    const phone = params.phone || '010-1234-5678';
    const status = params.status || '아이 정보를 함께 확인할 수 있어요.';
    const permissions = parsePermissions(params.permissions);

    return (
        <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.inner}
            showsVerticalScrollIndicator={false}
        >
            <View style={styles.logoArea}>
                <View style={styles.logoRow}>
                    <BackButton />
                    <Text style={styles.logoTitle}>월동</Text>
                    <Image
                        source={require('../../assets/images/canola_flower_small.png')}
                        style={styles.logoFlower}
                        resizeMode="contain"
                    />
                </View>
            </View>

            <View style={styles.headerArea}>
                <Text style={styles.title}>동행인 프로필</Text>
                <Text style={styles.description}>부모님이 정리한 동행인 정보예요.</Text>
            </View>

            <View style={styles.profileCard}>
                <View style={styles.avatarCircle}>
                    <Image
                        source={require('../../assets/images/icon_companion.png')}
                        style={styles.avatarImage}
                        resizeMode="contain"
                    />
                </View>

                <Text style={styles.name}>{name}</Text>
                <Text style={styles.relationBadge}>{relation}</Text>

                <View style={styles.infoBox}>
                    <View style={styles.infoRow}>
                        <Ionicons name="call-outline" size={17} color={Colors.textShadow} />
                        <Text style={styles.infoText}>{phone}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Ionicons name="checkmark-circle" size={17} color={Colors.highlight1} />
                        <Text style={styles.infoText}>{status}</Text>
                    </View>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>허용된 권한</Text>
                <View style={styles.permissionCard}>
                    {permissions.length > 0 ? (
                        permissions.map((permission) => (
                            <View key={permission} style={styles.permissionRow}>
                                <Ionicons name="checkmark" size={18} color={Colors.highlight1} />
                                <Text style={styles.permissionText}>{permission}</Text>
                            </View>
                        ))
                    ) : (
                        <Text style={styles.emptyText}>아직 설정된 권한이 없어요.</Text>
                    )}
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    scrollView: {
        flex: 1,
        backgroundColor: Colors.pageBg,
    },

    inner: {
        flexGrow: 1,
        width: '100%',
        paddingTop: 10,
        paddingHorizontal: 32,
        paddingBottom: 54,
    },

    logoArea: {
        alignItems: 'flex-start',
        marginBottom: 28,
        marginLeft: -20,
    },

    logoRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    logoTitle: {
        fontFamily: Fonts.title,
        fontSize: 32,
        color: Colors.text,
    },

    logoFlower: {
        width: 24,
        height: 24,
        marginLeft: -4,
        marginTop: -20,
        transform: [{ rotate: '-18deg' }],
    },

    headerArea: {
        marginBottom: 24,
    },

    title: {
        fontFamily: Fonts.bodyBold,
        fontSize: 24,
        fontWeight: '900',
        color: Colors.text,
        marginBottom: 8,
    },

    description: {
        fontFamily: Fonts.body,
        fontSize: 15,
        lineHeight: 22,
        color: Colors.textShadow,
    },

    profileCard: {
        width: '100%',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E8DDC8',
        backgroundColor: '#F7F4E8',
        alignItems: 'center',
        paddingHorizontal: 22,
        paddingVertical: 30,
        marginBottom: 28,
    },

    avatarCircle: {
        width: 86,
        height: 86,
        borderRadius: 43,
        backgroundColor: '#FFF8DF',
        borderWidth: 1,
        borderColor: Colors.highlight1,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14,
    },

    avatarImage: {
        width: 58,
        height: 58,
    },

    name: {
        fontFamily: Fonts.bodyBold,
        fontSize: 22,
        fontWeight: '900',
        color: Colors.text,
        marginBottom: 8,
    },

    relationBadge: {
        borderRadius: 14,
        backgroundColor: Colors.highlight1,
        paddingHorizontal: 12,
        paddingVertical: 5,
        fontFamily: Fonts.bodyBold,
        fontSize: 13,
        fontWeight: '900',
        color: Colors.text,
        overflow: 'hidden',
        marginBottom: 20,
    },

    infoBox: {
        width: '100%',
        borderRadius: 14,
        backgroundColor: Colors.pageBg,
        padding: 14,
        gap: 10,
    },

    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    infoText: {
        flex: 1,
        marginLeft: 8,
        fontFamily: Fonts.body,
        fontSize: 14,
        lineHeight: 21,
        color: Colors.text,
    },

    section: {
        width: '100%',
    },

    sectionTitle: {
        fontFamily: Fonts.bodyBold,
        fontSize: 17,
        fontWeight: '900',
        color: Colors.text,
        marginBottom: 12,
    },

    permissionCard: {
        width: '100%',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E8DDC8',
        backgroundColor: '#F7F4E8',
        padding: 14,
        gap: 10,
    },

    permissionRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    permissionText: {
        flex: 1,
        marginLeft: 8,
        fontFamily: Fonts.bodyBold,
        fontSize: 15,
        fontWeight: '900',
        color: Colors.text,
    },

    emptyText: {
        fontFamily: Fonts.body,
        fontSize: 14,
        color: Colors.textShadow,
    },
});
