import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import MapView, { Marker } from 'react-native-maps';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { FIREBASE_READY, db } from '../firebaseConfig';
import { ref, set, push, serverTimestamp } from 'firebase/database';

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

const LOCATION_TASK_NAME = 'BACKGROUND_LOCATION_TASK';

let currentBusPlate = '';
let currentDriverName = '';

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
    if (error) {
        console.error('Task Manager Error:', error);
        return;
    }
    if (data && currentBusPlate && FIREBASE_READY) {
        const { locations } = data as { locations: Location.LocationObject[] };
        const loc = locations[0];
        if (loc) {
            set(ref(db, `tracking/${currentBusPlate}`), {
                vehicle_id: currentBusPlate,
                busPlate: currentBusPlate,
                driverName: currentDriverName,
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude,
                speed: loc.coords.speed ? Math.round(loc.coords.speed * 3.6) : 0,
                timestamp: Date.now()
            });
        }
    }
});

// Mock Route Stops
const ROUTE_STOPS = [
    { id: 1, name: 'School', done: true },
    { id: 2, name: 'Stop A', done: true },
    { id: 3, name: 'Stop B', done: false },
    { id: 4, name: 'Stop C', done: false },
    { id: 5, name: 'Stop D', done: false },
    { id: 6, name: 'Stop E', done: false },
    { id: 7, name: 'Terminal', done: false },
];

export default function DashboardScreen({ route, navigation }: Props) {
    const { driverName, busPlate } = route.params;

    const [isTracking, setIsTracking] = useState(false);
    const [currentSpeed, setCurrentSpeed] = useState(0);
    const [locationObj, setLocationObj] = useState<Location.LocationObject | null>(null);
    const [emergency, setEmergency] = useState(false);

    // Default region roughly Colombo, will snap to driver once they start tracking
    const [mapRegion, setMapRegion] = useState({
        latitude: 6.9271,
        longitude: 79.8612,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
    });

    const [watcherInstance, setWatcherInstance] = useState<Location.LocationSubscription | null>(null);

    useEffect(() => {
        return () => {
            if (watcherInstance) watcherInstance.remove();
            Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME).catch(() => { });
        };
    }, [watcherInstance]);

    const toggleTracking = async () => {
        const newValue = !isTracking;
        if (newValue) {
            const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
            if (fgStatus !== 'granted') {
                Alert.alert('Permission Denied', 'Foreground location permission is required.');
                return;
            }
            const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();

            setIsTracking(true);

            const watcher = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.High,
                    timeInterval: 5000,
                    distanceInterval: 10,
                },
                (loc) => {
                    setLocationObj(loc);
                    setCurrentSpeed(loc.coords.speed ? Math.round(loc.coords.speed * 3.6) : 0);
                    setMapRegion(prev => ({ ...prev, latitude: loc.coords.latitude, longitude: loc.coords.longitude }));

                    if (FIREBASE_READY) {
                        currentBusPlate = busPlate;
                        currentDriverName = driverName;
                        set(ref(db, `tracking/${busPlate}`), {
                            vehicle_id: busPlate,
                            busNumber: "BUS-X",
                            busPlate: busPlate,
                            driverName: driverName,
                            latitude: loc.coords.latitude,
                            longitude: loc.coords.longitude,
                            speed: loc.coords.speed ? Math.round(loc.coords.speed * 3.6) : 0,
                            timestamp: Date.now()
                        });
                    }
                }
            );
            setWatcherInstance(watcher);

            if (FIREBASE_READY) {
                // Log Start Trip
                push(ref(db, 'events'), {
                    type: 'trip_started',
                    busNumber: "BUS-X",
                    busPlate,
                    driverName,
                    message: `${driverName} started the trip.`,
                    timestamp: Date.now()
                }).catch(() => { });
            }

            if (bgStatus === 'granted') {
                await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
                    accuracy: Location.Accuracy.Balanced,
                    timeInterval: 10000,
                    showsBackgroundLocationIndicator: true,
                    foregroundService: {
                        notificationTitle: "EduTrack Trip Active",
                        notificationBody: "Monitoring your bus route."
                    }
                });
            }
        } else {
            setIsTracking(false);
            setCurrentSpeed(0);
            if (watcherInstance) {
                watcherInstance.remove();
                setWatcherInstance(null);
            }
            Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME).catch(() => { });
            // Clear Firebase speed & Log End Trip
            if (FIREBASE_READY) {
                set(ref(db, `tracking/${busPlate}/speed`), 0).catch(() => { });
                currentBusPlate = '';
                push(ref(db, 'events'), {
                    type: 'trip_ended',
                    busNumber: "BUS-X",
                    busPlate,
                    driverName,
                    message: `${driverName} ended the trip.`,
                    timestamp: Date.now()
                }).catch(() => { });
            }
        }
    };

    const triggerSOS = () => {
        setEmergency(true);
        if (FIREBASE_READY) {
            push(ref(db, 'events'), {
                type: 'sos',
                busNumber: "BUS-X",
                busPlate,
                driverName,
                message: `🚨 EMERGENCY: ${driverName} (${busPlate}) has triggered an SOS alert!`,
                timestamp: Date.now()
            }).catch(() => { });
        }
        Alert.alert("SOS Triggered", "Emergency alert dispatched to Admin Dashboard.", [
            { text: "Dismiss", onPress: () => setEmergency(false) }
        ]);
    };

    const triggerDelay = () => {
        if (FIREBASE_READY) {
            push(ref(db, 'events'), {
                type: 'delay_reported',
                busNumber: "BUS-X",
                busPlate,
                driverName,
                message: "The driver says the bus will be delayed.",
                timestamp: Date.now()
            }).catch(() => { });
        }
        Alert.alert("Delay Logged", "Admin has been notified of a route delay.");
    };

    const handleMessage = () => {
        if (FIREBASE_READY) {
            push(ref(db, 'events'), {
                type: 'message_sent',
                busNumber: "BUS-X",
                busPlate,
                driverName,
                message: "Hello from Driver App!",
                timestamp: Date.now()
            }).catch(() => { });
        }
        Alert.alert("Message Sent", "Message has been sent to the web dashboard.");
    };

    return (
        <View style={styles.container}>
            {/* MAP BACKGROUND */}
            <MapView
                style={StyleSheet.absoluteFillObject}
                region={mapRegion}
                showsUserLocation={true}
                showsMyLocationButton={false}
            >
                {locationObj && (
                    <Marker
                        coordinate={{ latitude: locationObj.coords.latitude, longitude: locationObj.coords.longitude }}
                        title="My Bus"
                        description={busPlate}
                    />
                )}
            </MapView>

            {/* TOP FLOATING CONTROLS */}
            <View style={styles.topControls}>
                <TouchableOpacity style={styles.iconButton} onPress={() => Alert.alert('Menu', 'Opened side menu')}>
                    <View style={styles.hamburgerLine} />
                    <View style={styles.hamburgerLine} />
                    <View style={styles.hamburgerLine} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.sosCircle, emergency ? styles.sosActive : null]}
                    onPress={triggerSOS}
                >
                    <LinearGradient colors={['#dc2626', '#991b1b']} style={styles.sosGradient}>
                        <Text style={styles.sosText}>SOS</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            {/* START / END FLOATING CHIP */}
            <View style={styles.floatingHeader}>
                <TouchableOpacity
                    style={[styles.toggleBtn, isTracking ? styles.toggleActive : null]}
                    onPress={toggleTracking}
                >
                    <Text style={[styles.toggleText, isTracking && { color: 'white' }]}>
                        {isTracking ? 'End Trip' : 'Start Trip'}
                    </Text>
                </TouchableOpacity>
                {isTracking && (
                    <View style={styles.speedBadge}>
                        <Text style={styles.speedText}>{currentSpeed} km/h</Text>
                    </View>
                )}
            </View>

            {/* BOTTOM FLOATING CONTROLS */}
            <View style={styles.bottomControls}>

                {/* Delay Button */}
                <View style={styles.delayWrapper}>
                    <TouchableOpacity style={styles.delayCircle} onPress={triggerDelay}>
                        <Text style={styles.delayText}>Delay</Text>
                    </TouchableOpacity>
                </View>

                {/* Route Progress Bar */}
                <View style={styles.progressCard}>
                    <Text style={styles.progressTitle}>Current Route Stops</Text>
                    <View style={styles.progressBarWrapper}>
                        {/* Line behind dots */}
                        <View style={styles.progressLine} />
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingHorizontal: 10 }}>
                            {ROUTE_STOPS.map((stop) => (
                                <View key={stop.id} style={styles.stopNode}>
                                    <View style={[styles.stopDot, stop.done ? styles.stopDotDone : null]} />
                                    <Text style={styles.stopText} numberOfLines={1}>{stop.name}</Text>
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                </View>

                {/* Bottom Nav Simulation */}
                <View style={styles.bottomNav}>
                    <TouchableOpacity style={styles.navChip}><Text style={styles.navText}>Home</Text></TouchableOpacity>
                    <TouchableOpacity style={styles.navChip}><Text style={styles.navText}>Route</Text></TouchableOpacity>
                    <TouchableOpacity style={styles.navChip} onPress={handleMessage}><Text style={styles.navText}>Messages</Text></TouchableOpacity>
                    <TouchableOpacity style={styles.navChip}><Text style={styles.navText}>Profile</Text></TouchableOpacity>
                </View>

            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f3f4f6' }, // Replaced yellow tint

    topControls: {
        position: 'absolute',
        top: 50,
        left: 20,
        right: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        zIndex: 10,
    },

    iconButton: {
        width: 44,
        height: 44,
        backgroundColor: 'white',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
    },
    hamburgerLine: {
        width: 20,
        height: 2,
        backgroundColor: '#1f2937',
        marginVertical: 2,
        borderRadius: 2,
    },

    sosCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        shadowColor: '#dc2626',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 8,
        overflow: 'hidden',
    },
    sosGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sosText: {
        color: 'white',
        fontWeight: '900',
        fontSize: 16,
    },
    sosActive: {
        transform: [{ scale: 0.95 }],
        opacity: 0.9,
    },

    floatingHeader: {
        position: 'absolute',
        top: 110,
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        zIndex: 10,
    },
    toggleBtn: {
        backgroundColor: 'white',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
    },
    toggleActive: {
        backgroundColor: '#10b981', // green for active trip
    },
    toggleText: {
        fontWeight: '800',
        fontSize: 16,
        color: '#1f2937',
    },
    speedBadge: {
        backgroundColor: '#1f2937',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
    },
    speedText: {
        color: 'white',
        fontWeight: 'bold',
    },

    bottomControls: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingBottom: 30,
        paddingHorizontal: 20,
    },

    delayWrapper: {
        alignItems: 'flex-end',
        marginBottom: 20,
    },
    delayCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#f59e0b',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    delayText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#1f2937',
    },

    progressCard: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
        marginBottom: 20,
    },
    progressTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#6b7280',
        marginBottom: 16,
    },
    progressBarWrapper: {
        position: 'relative',
        height: 40,
    },
    progressLine: {
        position: 'absolute',
        top: 10,
        left: 20,
        right: 20,
        height: 2,
        backgroundColor: '#e5e7eb',
        zIndex: -1,
    },
    stopNode: {
        alignItems: 'center',
        width: 55,
    },
    stopDot: {
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: '#e5e7eb',
        borderWidth: 3,
        borderColor: 'white',
        marginBottom: 6,
    },
    stopDotDone: {
        backgroundColor: '#633194',
    },
    stopText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#1f2937',
        textAlign: 'center',
    },

    bottomNav: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    navChip: {
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 20,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    navText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#4b5563',
    }
});
