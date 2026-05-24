import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Resource, getResources, getCategories, Category, getMediaUrl } from '../services/resourceService';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../navigation/RootNavigator';

type HomeNav = NativeStackNavigationProp<RootStackParamList>;

export function HomeScreen() {
  const navigation = useNavigation<HomeNav>();
  const { isAuthenticated } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>(undefined);
  const [sort, setSort] = useState<'newest' | 'views'>('newest');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [res, cats] = await Promise.all([
        getResources({ search, category: selectedCategory, sort }),
        getCategories(),
      ]);
      setResources(Array.isArray(res) ? res : []);
      setCategories(Array.isArray(cats) ? cats : []);
    } catch (err: any) {
      console.error('Error loading resources:', err);
      setError(err.message || 'Erreur de connexion au serveur');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, selectedCategory, sort]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Debug: show API URL on screen
  const debugUrl = `${require('../config/api').API_BASE_URL}/api/public/resources`;

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const categoryFilterData = useMemo(() => {
    const allOption = { id: 0, name: 'Toutes' };
    const cats = Array.isArray(categories) ? categories : [];
    return [allOption, ...cats];
  }, [categories]);

  const renderResource = ({ item }: { item: Resource }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('ResourceDetail', { id: item.id })}
      activeOpacity={0.7}
    >
      {item.type === 'photo' && (
        <Image
          source={{ uri: getMediaUrl(item.content, 'photo') }}
          style={styles.cardImage}
          resizeMode="cover"
        />
      )}
      {item.type === 'video' && (
        <View style={styles.videoPlaceholder}>
          <Ionicons name="play-circle" size={40} color="#60a5fa" />
          <Text style={styles.videoLabel}>Vidéo</Text>
        </View>
      )}
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.description || 'Sans titre'}
        </Text>
        <View style={styles.cardMeta}>
          <Text style={styles.cardCategory}>{item.category}</Text>
          <View style={styles.cardStats}>
            <Ionicons name="eye-outline" size={14} color="#94a3b8" />
            <Text style={styles.statText}>{item.views}</Text>
            <Ionicons name="heart-outline" size={14} color="#94a3b8" style={{ marginLeft: 8 }} />
            <Text style={styles.statText}>{item.favori}</Text>
          </View>
        </View>
        <Text style={styles.cardAuthor}>par {item.author}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderCategoryItem = ({ item }: { item: { id: number; name: string } }) => {
    const isActive = item.id === 0 ? selectedCategory === undefined : selectedCategory === item.id;
    return (
      <TouchableOpacity
        style={[styles.categoryChip, isActive && styles.categoryChipActive]}
        onPress={() => setSelectedCategory(item.id === 0 ? undefined : item.id)}
      >
        <Text style={[styles.categoryChipText, isActive && styles.categoryChipTextActive]}>
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search bar */}
      <View style={styles.searchContainer} accessibilityRole="search">
        <Ionicons name="search" size={20} color="#64748b" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Rechercher..."
          placeholderTextColor="#64748b"
          returnKeyType="search"
          onSubmitEditing={loadData}
          accessibilityLabel="Rechercher des ressources"
        />
      </View>

      {/* Category filter */}
      <FlatList
        horizontal
        data={categoryFilterData}
        keyExtractor={(item) => String(item.id)}
        showsHorizontalScrollIndicator={false}
        style={styles.categoryList}
        renderItem={renderCategoryItem}
      />

      {/* Sort toggle */}
      <View style={styles.sortRow}>
        <TouchableOpacity
          style={[styles.sortButton, sort === 'newest' && styles.sortButtonActive]}
          onPress={() => setSort('newest')}
        >
          <Text style={[styles.sortText, sort === 'newest' && styles.sortTextActive]}>
            Récentes
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sortButton, sort === 'views' && styles.sortButtonActive]}
          onPress={() => setSort('views')}
        >
          <Text style={[styles.sortText, sort === 'views' && styles.sortTextActive]}>
            Populaires
          </Text>
        </TouchableOpacity>

        {isAuthenticated && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('CreateResource')}
          >
            <Ionicons name="add" size={24} color="#ffffff" />
          </TouchableOpacity>
        )}
      </View>

      {/* Resource list */}
      <FlatList
        data={resources}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderResource}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#60a5fa" />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={48} color="#475569" />
              <Text style={styles.emptyText}>
                {error ? error : 'Aucune ressource trouvée'}
              </Text>
              <Text style={{ color: '#64748b', fontSize: 11, marginTop: 8 }}>
                API: {debugUrl}
              </Text>
              {error && (
                <TouchableOpacity style={styles.retryButton} onPress={loadData}>
                  <Text style={styles.retryText}>Réessayer</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 10,
    margin: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#f1f5f9',
    fontSize: 16,
    paddingVertical: 12,
  },
  categoryList: {
    paddingHorizontal: 16,
    maxHeight: 44,
    marginBottom: 8,
  },
  categoryChip: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  categoryChipActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  categoryChipText: {
    color: '#94a3b8',
    fontSize: 13,
  },
  categoryChipTextActive: {
    color: '#ffffff',
  },
  sortRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 8,
    alignItems: 'center',
  },
  sortButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 8,
  },
  sortButtonActive: {
    backgroundColor: '#334155',
  },
  sortText: {
    color: '#64748b',
    fontSize: 13,
  },
  sortTextActive: {
    color: '#f1f5f9',
  },
  addButton: {
    marginLeft: 'auto',
    backgroundColor: '#2563eb',
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardImage: {
    width: '100%',
    height: 180,
  },
  videoPlaceholder: {
    width: '100%',
    height: 120,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoLabel: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 4,
  },
  cardContent: {
    padding: 14,
  },
  cardTitle: {
    color: '#f1f5f9',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  cardMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardCategory: {
    color: '#60a5fa',
    fontSize: 12,
    backgroundColor: '#1e3a5f',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  cardStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    color: '#94a3b8',
    fontSize: 12,
    marginLeft: 3,
  },
  cardAuthor: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    color: '#475569',
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  retryButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 16,
  },
  retryText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});
