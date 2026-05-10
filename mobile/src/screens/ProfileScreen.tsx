import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../navigation/RootNavigator';

type ProfileNav = NativeStackNavigationProp<RootStackParamList>;

export function ProfileScreen() {
  const navigation = useNavigation<ProfileNav>();
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Voulez-vous vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Déconnexion',
        style: 'destructive',
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <View style={styles.notLoggedIn}>
          <Ionicons name="person-circle-outline" size={80} color="#475569" />
          <Text style={styles.notLoggedInTitle}>Non connecté</Text>
          <Text style={styles.notLoggedInText}>
            Connectez-vous pour accéder à votre profil et vos ressources
          </Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => navigation.navigate('Auth')}
          >
            <Text style={styles.loginButtonText}>Se connecter</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* User info */}
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.name?.[0]?.toUpperCase()}{user?.surname?.[0]?.toUpperCase()}
          </Text>
        </View>
        <Text style={styles.userName}>
          {user?.nickname || `${user?.name} ${user?.surname}`}
        </Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
        {user?.city && <Text style={styles.userCity}>{user.city}</Text>}
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>
            {user?.roles.includes('ROLE_SUPER_ADMIN')
              ? 'Super Admin'
              : user?.roles.includes('ROLE_ADMIN')
              ? 'Administrateur'
              : user?.roles.includes('ROLE_MODERATOR')
              ? 'Modérateur'
              : 'Citoyen'}
          </Text>
        </View>
      </View>

      {/* Stats */}
      {(user?.pendingResources ?? 0) > 0 || (user?.pendingComments ?? 0) > 0 ? (
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Notifications</Text>
          {(user?.pendingComments ?? 0) > 0 && (
            <View style={styles.statRow}>
              <Ionicons name="chatbubble-outline" size={18} color="#f59e0b" />
              <Text style={styles.statLabel}>
                {user?.pendingComments} commentaire(s) en attente sur vos ressources
              </Text>
            </View>
          )}
          {(user?.pendingResources ?? 0) > 0 && (
            <View style={styles.statRow}>
              <Ionicons name="document-outline" size={18} color="#f59e0b" />
              <Text style={styles.statLabel}>
                {user?.pendingResources} ressource(s) à modérer
              </Text>
            </View>
          )}
        </View>
      ) : null}

      {/* Info card */}
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Inscrit le</Text>
          <Text style={styles.infoValue}>{user?.registeredAt?.split(' ')[0]}</Text>
        </View>
        {user?.birthdate && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Date de naissance</Text>
            <Text style={styles.infoValue}>{user.birthdate}</Text>
          </View>
        )}
      </View>

      {/* Actions */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#ef4444" />
        <Text style={styles.logoutText}>Se déconnecter</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  notLoggedIn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  notLoggedInTitle: {
    color: '#f1f5f9',
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
  },
  notLoggedInText: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  loginButton: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '700',
  },
  userName: {
    color: '#f1f5f9',
    fontSize: 22,
    fontWeight: '700',
  },
  userEmail: {
    color: '#94a3b8',
    fontSize: 14,
    marginTop: 4,
  },
  userCity: {
    color: '#64748b',
    fontSize: 13,
    marginTop: 2,
  },
  roleBadge: {
    backgroundColor: '#1e3a5f',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginTop: 8,
  },
  roleText: {
    color: '#60a5fa',
    fontSize: 12,
    fontWeight: '600',
  },
  statsCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  statsTitle: {
    color: '#f1f5f9',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statLabel: {
    color: '#e2e8f0',
    fontSize: 13,
    marginLeft: 10,
  },
  infoCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  infoLabel: {
    color: '#94a3b8',
    fontSize: 14,
  },
  infoValue: {
    color: '#f1f5f9',
    fontSize: 14,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#7f1d1d',
  },
  logoutText: {
    color: '#ef4444',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
});
