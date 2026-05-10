import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../config/api';
import { getToken } from '../services/authService';

interface LogItem {
  id: number;
  action: string;
  reason: string | null;
  moderator: string;
  resource: number | null;
  comment: number | null;
  targetUser: string | null;
  createdAt: string;
}

export function SuperAdminScreen() {
  const [tab, setTab] = useState<'create' | 'logs'>('create');
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);

  // Create account form
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('ROLE_MODERATOR');
  const [creating, setCreating] = useState(false);

  const loadLogs = async () => {
    const token = await getToken();
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/super-admin/logs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setLogs(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (tab === 'logs') {
      setLoading(true);
      loadLogs();
    }
  }, [tab]);

  const handleCreateAccount = async () => {
    if (!email || !name || !surname || !password) {
      Alert.alert('Erreur', 'Tous les champs sont obligatoires');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    const token = await getToken();
    if (!token) return;

    setCreating(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/super-admin/create-account`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, name, surname, password, role }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Succès', `Compte créé: ${data.user?.email}`);
        setEmail('');
        setName('');
        setSurname('');
        setPassword('');
      } else {
        Alert.alert('Erreur', data.error || 'Création échouée');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Erreur réseau');
    } finally {
      setCreating(false);
    }
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      approve_resource: '✅ Ressource approuvée',
      refuse_resource: '❌ Ressource refusée',
      approve_comment: '✅ Commentaire approuvé',
      refuse_comment: '❌ Commentaire refusé',
      suspend_user: '⛔ Utilisateur suspendu',
      delete_content: '🗑️ Contenu supprimé',
    };
    return labels[action] || action;
  };

  const renderLog = ({ item }: { item: LogItem }) => (
    <View style={styles.logCard}>
      <View style={styles.logHeader}>
        <Text style={styles.logAction}>{getActionLabel(item.action)}</Text>
        <Text style={styles.logDate}>{item.createdAt}</Text>
      </View>
      <Text style={styles.logModerator}>par {item.moderator}</Text>
      {item.reason && <Text style={styles.logReason}>Raison: {item.reason}</Text>}
      {item.resource && <Text style={styles.logRef}>Ressource #{item.resource}</Text>}
      {item.comment && <Text style={styles.logRef}>Commentaire #{item.comment}</Text>}
      {item.targetUser && <Text style={styles.logRef}>Utilisateur: {item.targetUser}</Text>}
    </View>
  );

  const renderCreateForm = () => (
    <ScrollView contentContainerStyle={styles.formContent}>
      <Text style={styles.formTitle}>Créer un compte administrateur</Text>

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="email@exemple.fr"
        placeholderTextColor="#64748b"
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <Text style={styles.label}>Prénom</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Prénom"
        placeholderTextColor="#64748b"
      />

      <Text style={styles.label}>Nom</Text>
      <TextInput
        style={styles.input}
        value={surname}
        onChangeText={setSurname}
        placeholder="Nom"
        placeholderTextColor="#64748b"
      />

      <Text style={styles.label}>Mot de passe</Text>
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        placeholder="Min. 8 caractères"
        placeholderTextColor="#64748b"
        secureTextEntry
      />

      <Text style={styles.label}>Rôle</Text>
      <View style={styles.roleRow}>
        <TouchableOpacity
          style={[styles.roleOption, role === 'ROLE_MODERATOR' && styles.roleOptionActive]}
          onPress={() => setRole('ROLE_MODERATOR')}
        >
          <Text style={[styles.roleOptionText, role === 'ROLE_MODERATOR' && styles.roleOptionTextActive]}>
            Modérateur
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.roleOption, role === 'ROLE_ADMIN' && styles.roleOptionActive]}
          onPress={() => setRole('ROLE_ADMIN')}
        >
          <Text style={[styles.roleOptionText, role === 'ROLE_ADMIN' && styles.roleOptionTextActive]}>
            Admin
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.roleOption, role === 'ROLE_SUPER_ADMIN' && styles.roleOptionActive]}
          onPress={() => setRole('ROLE_SUPER_ADMIN')}
        >
          <Text style={[styles.roleOptionText, role === 'ROLE_SUPER_ADMIN' && styles.roleOptionTextActive]}>
            Super Admin
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.createBtn, creating && { opacity: 0.6 }]}
        onPress={handleCreateAccount}
        disabled={creating}
      >
        <Ionicons name="person-add" size={20} color="#ffffff" />
        <Text style={styles.createBtnText}>
          {creating ? 'Création...' : 'Créer le compte'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, tab === 'create' && styles.tabActive]}
          onPress={() => setTab('create')}
        >
          <Text style={[styles.tabText, tab === 'create' && styles.tabTextActive]}>
            Créer compte
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'logs' && styles.tabActive]}
          onPress={() => setTab('logs')}
        >
          <Text style={[styles.tabText, tab === 'logs' && styles.tabTextActive]}>
            Logs ({logs.length})
          </Text>
        </TouchableOpacity>
      </View>

      {tab === 'create' ? (
        renderCreateForm()
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderLog}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); loadLogs(); }}
              tintColor="#60a5fa"
            />
          }
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="document-text-outline" size={48} color="#475569" />
                <Text style={styles.emptyText}>Aucun log de modération</Text>
              </View>
            ) : null
          }
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
  formContent: { padding: 20, paddingBottom: 40 },
  formTitle: { color: '#f1f5f9', fontSize: 18, fontWeight: '700', marginBottom: 20 },
  label: { color: '#e2e8f0', fontSize: 13, fontWeight: '600', marginBottom: 6, marginTop: 14 },
  input: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    padding: 14,
    color: '#f1f5f9',
    fontSize: 16,
  },
  roleRow: { flexDirection: 'row', marginTop: 4 },
  roleOption: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  roleOptionActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  roleOptionText: { color: '#94a3b8', fontSize: 12, fontWeight: '600' },
  roleOptionTextActive: { color: '#ffffff' },
  createBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  createBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '600', marginLeft: 8 },
  logCard: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  logHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  logAction: { color: '#f1f5f9', fontSize: 14, fontWeight: '600' },
  logDate: { color: '#475569', fontSize: 11 },
  logModerator: { color: '#94a3b8', fontSize: 12 },
  logReason: { color: '#f59e0b', fontSize: 12, marginTop: 4 },
  logRef: { color: '#64748b', fontSize: 11, marginTop: 2 },
  emptyContainer: { alignItems: 'center', paddingTop: 60 },
  emptyText: { color: '#94a3b8', fontSize: 16, marginTop: 12 },
});
