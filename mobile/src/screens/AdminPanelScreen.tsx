import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { ModerationScreen } from './ModerationScreen';
import { AdminScreen } from './AdminScreen';
import { SuperAdminScreen } from './SuperAdminScreen';

type PanelTab = 'moderation' | 'admin' | 'superadmin';

export function AdminPanelScreen() {
  const { user } = useAuth();
  const roles = user?.roles || [];
  const isAdmin = roles.some((r: string) => ['ROLE_ADMIN', 'ROLE_SUPER_ADMIN'].includes(r));
  const isSuperAdmin = roles.includes('ROLE_SUPER_ADMIN');

  const [activeTab, setActiveTab] = useState<PanelTab>('moderation');

  const tabs: { key: PanelTab; label: string; icon: any; visible: boolean }[] = [
    { key: 'moderation', label: 'Modération', icon: 'shield-checkmark-outline', visible: true },
    { key: 'admin', label: 'Admin', icon: 'stats-chart-outline', visible: isAdmin },
    { key: 'superadmin', label: 'Super Admin', icon: 'key-outline', visible: isSuperAdmin },
  ];

  const visibleTabs = tabs.filter((t) => t.visible);

  return (
    <View style={styles.container}>
      {/* Top tab bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar}>
        {visibleTabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Ionicons
              name={tab.icon}
              size={18}
              color={activeTab === tab.key ? '#60a5fa' : '#64748b'}
            />
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Content */}
      <View style={styles.content}>
        {activeTab === 'moderation' && <ModerationScreen />}
        {activeTab === 'admin' && <AdminScreen />}
        {activeTab === 'superadmin' && <SuperAdminScreen />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  tabBar: {
    flexGrow: 0,
    backgroundColor: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 2,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#60a5fa',
  },
  tabText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 6,
  },
  tabTextActive: {
    color: '#60a5fa',
  },
  content: {
    flex: 1,
  },
});
