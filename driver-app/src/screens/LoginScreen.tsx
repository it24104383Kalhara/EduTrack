import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'Login'>;
};

export default function LoginScreen({ navigation }: Props) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = () => {
        if (!username || !password) {
            setError('Please enter both username and password.');
            return;
        }
        setLoading(true);
        setError('');

        // Mock Login - replace with actual backend verification later
        setTimeout(() => {
            setLoading(false);
            if (username === 'suresh_p' || username.startsWith('driver_')) {
                // Successful login mock
                navigation.replace('Dashboard', { driverName: 'Suresh Perera', busPlate: 'WP-AB-1234' });
            } else {
                setError('Invalid credentials for driver app. Use the username set in the Admin Portal.');
            }
        }, 1000);
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#faf8ff', '#f0e9ff', '#e8f5fe']}
                style={StyleSheet.absoluteFillObject}
            />

            {/* Decorative Blob */}
            <View style={styles.blob1} />
            <View style={styles.blob2} />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.content}
            >
                <View style={styles.logoContainer}>
                    <LinearGradient
                        colors={['#633194', '#9b59b6']}
                        style={styles.logoBadge}
                    >
                        <Text style={styles.logoText}>ET</Text>
                    </LinearGradient>
                    <Text style={styles.title}>EduTrack</Text>
                    <Text style={styles.subtitle}>Driver Portal</Text>
                </View>

                <View style={styles.card}>
                    {error ? <Text style={styles.errorText}>{error}</Text> : null}

                    <Text style={styles.label}>Username</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. driver_suresh"
                        placeholderTextColor="#9ca3af"
                        value={username}
                        onChangeText={setUsername}
                        autoCapitalize="none"
                    />

                    <Text style={styles.label}>Password</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="••••••••"
                        placeholderTextColor="#9ca3af"
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                    />

                    <TouchableOpacity
                        style={styles.loginButton}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        <LinearGradient
                            colors={['#633194', '#9b59b6']}
                            style={styles.buttonGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={styles.buttonText}>Log In</Text>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    blob1: { position: 'absolute', top: -100, left: -50, width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(195,155,211,0.2)', blurRadius: 40 },
    blob2: { position: 'absolute', bottom: -50, right: -50, width: 250, height: 250, borderRadius: 125, backgroundColor: 'rgba(147,197,253,0.2)' },
    content: { flex: 1, justifyContent: 'center', padding: 24, zIndex: 10 },
    logoContainer: { alignItems: 'center', marginBottom: 40 },
    logoBadge: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', shadowColor: '#633194', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 10 },
    logoText: { color: 'white', fontSize: 24, fontWeight: '800' },
    title: { fontSize: 32, fontWeight: '800', color: '#111827', marginTop: 16 },
    subtitle: { fontSize: 16, color: '#6b7280', marginTop: 4 },
    card: { backgroundColor: 'white', borderRadius: 24, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.05, shadowRadius: 20, elevation: 5 },
    label: { fontSize: 13, fontWeight: '600', color: '#4b5563', marginBottom: 8, marginLeft: 4 },
    input: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 16, padding: 16, fontSize: 15, color: '#1f2937', marginBottom: 20 },
    loginButton: { height: 56, borderRadius: 16, overflow: 'hidden', marginTop: 8 },
    buttonGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    buttonText: { color: 'white', fontSize: 16, fontWeight: '700' },
    errorText: { color: '#ef4444', fontSize: 14, marginBottom: 16, textAlign: 'center' }
});
