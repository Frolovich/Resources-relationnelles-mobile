import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../config/api';
import { getToken } from '../services/authService';

interface UserItem {
  id: string;
  email: string;
  name: string;
  surname: string;
  roles: string[];
  status: boolean;
  registeredAt: string;
}

interface Stats {
  totalUsers: number;
  totalResources: number;
  totalViews: number;
  totalFavorites: number;
}

export function AdminScreen() {
  const [tab, setTab] = useState<'stats' | 'users'>('stats');
  const [users, setUsers] = useState<UserItem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    const token = await getToken();
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const [statsRes, usersRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/admin/stats`, { headers }),
        fetch(`${API_BASE_URL}/api/admin/users`, { headers }),
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleUserStatus = async (userId: string) => {
    const token = await getToken();
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/toggle-status`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const result = await response.json();
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, status: result.status } : u))
        );
      }
    } catch (error) {
      Alert.alert('Erreur', 'Action échouée');
    }
  };

  const changeRole = async (userId: string, role: string) => {
    const token = await getToken();
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role }),
      });

      if (response.ok) {
        const result = await response.json();
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, roles: result.roles } : u))
        );
        Alert.alert('Succès', 'Rôle mis à jour');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Action échouée');
    }
  };

  const showRoleOptions = (user: UserItem) => {
    Alert.alert('Changer le rôle', `Utilisateur: ${user.email}`, [
      { text: 'Citoyen', onPress: () => changeRole(user.id, 'ROLE_USER') },
      { text: 'Modérateur', onPress: () => changeRole(user.id, 'ROLE_MODERATOR') },
      { text: 'Admin', onPress: () => changeRole(user.id, 'ROLE_ADMIN') },
      { text: 'Annuler', style: 'cancel' },
    ]);
  };

  const getRoleName = (roles: string[]) => {
    if (roles.includes('ROLE_SUPER_ADMIN')) return 'Super Admin';
    if (roles.includes('ROLE_ADMIN')) return 'Admin';
    if (roles.includes('ROLE_MODERATOR')) return 'Modérateur';
    return 'Citoyen';
  };

  const renderUser = ({ item }: { item: UserItem }) => (
    <View style={styles.userCard}>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name} {item.surname}</Text>
        <Text style={styles.userEmail}>{item.email}</Text>
        <View style={styles.userMeta}>
          <View style={[styles.badge, item.status ? styles.badgeActive : styles.badgeInactive]}>
            <Text style={styles.badgeText}>{item.status ? 'Actif' : 'Suspendu'}</Text>
          </View>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{getRoleName(item.roles)}</Text>
          </View>
        </View>
      </View>
      <View style={styles.userActions}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => toggleUserStatus(item.id)}
        >
          <Ionicons
            name={item.status ? 'pause-circle' : 'play-circle'}
            size={24}
            color={item.status ? '#f59e0b' : '#34d399'}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => showRoleOptions(item)}
        >
          <Ionicons name="shield-outline" size={22} color="#60a5fa" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStats = () => (
    <View style={styles.statsGrid}>
      <View style={styles.statCard}>
        <Ionicons name="people" size={28} color="#60a5fa" />
        <Text style={styles.statNumber}>{stats?.totalUsers ?? 0}</Text>
        <Text style={styles.statLabel}>Utilisateurs</Text>
      </View>
      <View style={styles.statCard}>
        <Ionicons name="document-text" size={28} color="#34d399" />
        <Text style={styles.statNumber}>{stats?.totalResources ?? 0}</Text>
        <Text style={styles.statLabel}>Ressources</Text>
      </View>
      <View style={styles.statCard}>
        <Ionicons name="eye" size={28} color="#f59e0b" />
        <Text style={styles.statNumber}>{stats?.totalViews ?? 0}</Text>
        <Text style={styles.statLabel}>Vues totales</Text>
      </View>
      <View style={styles.statCard}>
        <Ionicons name="heart" size={28} color="#ef4444" />
        <Text style={styles.statNumber}>{stats?.totalFavorites ?? 0}</Text>
        <Text style={styles.statLabel}>Favoris</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, tab === 'stats' && styles.tabActive]}
          onPress={() => setTab('stats')}
        >
          <Text style={[styles.tabText, tab === 'stats' && styles.tabTextActive]}>Statistiques</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'users' && styles.tabActive]}
          onPress={() => setTab('users')}
        >
          <Text style={[styles.tabText, tab === 'users' && styles.tabTextActive]}>
            Utilisateurs ({users.length})
          </Text>
        </TouchableOpacity>
      </View>

      {tab === 'stats' ? (
        <FlatList
          data={[]}
          renderItem={() => null}
          ListHeaderComponent={renderStats}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor="#60a5fa" />}
        />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          renderItem={renderUser}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor="#60a5fa" />}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  tabRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#334155' },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#60a5fa' },
  tabText: { color: '#64748b', fontSize: 14, fontWeight: '500' },
  tabTextActive: { color: '#60a5fa' },
  listContent: { padding: 16 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 16, justifyContent: 'space-between' },
  statCard: {
    width: '48%',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  statNumber: { color: '#f1f5f9', fontSize: 28, fontWeight: '700', marginTop: 8 },
  statLabel: { color: '#94a3b8', fontSize: 12, marginTop: 4 },
  userCard: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  userInfo: { flex: 1 },
  userName: { color: '#f1f5f9', fontSize: 15, fontWeight: '600' },
  userEmail: { color: '#94a3b8', fontSize: 12, marginTop: 2 },
  userMeta: { flexDirection: 'row', marginTop: 6 },
  badge: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, marginRight: 6 },
  badgeActive: { backgroundColor: '#166534' },
  badgeInactive: { backgroundColor: '#991b1b' },
  badgeText: { color: '#ffffff', fontSize: 10, fontWeight: '600' },
  roleBadge: { backgroundColor: '#1e3a5f', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  roleText: { color: '#60a5fa', fontSize: 10, fontWeight: '600' },
  userActions: { flexDirection: 'row' },
  iconBtn: { padding: 8 },
});
