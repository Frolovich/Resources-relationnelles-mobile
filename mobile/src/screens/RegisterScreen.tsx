import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Switch,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { register } from '../services/authService';
import { RecaptchaModal } from '../components/RecaptchaModal';

export function RegisterScreen() {
  const navigation = useNavigation();
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    surname: '',
    nickname: '',
    birthdate: '',
    city: '',
    termsAccepted: false,
    privacyPolicyAccepted: false,
  });
  const [loading, setLoading] = useState(false);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const updateField = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleRegister = async () => {
    if (!form.email || !form.password || !form.name || !form.surname || !form.birthdate) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (form.password !== form.confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }

    if (form.password.length < 8) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    if (!form.termsAccepted || !form.privacyPolicyAccepted) {
      Alert.alert('Erreur', 'Vous devez accepter les conditions d\'utilisation et la politique de confidentialité');
      return;
    }

    if (!captchaToken) {
      setShowCaptcha(true);
      return;
    }

    setLoading(true);
    try {
      await register({
        email: form.email.trim(),
        password: form.password,
        name: form.name.trim(),
        surname: form.surname.trim(),
        birthdate: form.birthdate.trim(),
        nickname: form.nickname.trim() || undefined,
        city: form.city.trim() || undefined,
        termsAccepted: form.termsAccepted,
        privacyPolicyAccepted: form.privacyPolicyAccepted,
      });
      Alert.alert('Succès', 'Compte créé avec succès ! Vous pouvez maintenant vous connecter.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCaptchaToken = (token: string) => {
    setCaptchaToken(token);
    setShowCaptcha(false);
    // Auto-submit after captcha
    setTimeout(() => handleRegister(), 300);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>Informations personnelles</Text>

        <TextInput
          style={styles.input}
          value={form.name}
          onChangeText={(v) => updateField('name', v)}
          placeholder="Prénom *"
          placeholderTextColor="#64748b"
        />

        <TextInput
          style={styles.input}
          value={form.surname}
          onChangeText={(v) => updateField('surname', v)}
          placeholder="Nom *"
          placeholderTextColor="#64748b"
        />

        <TextInput
          style={styles.input}
          value={form.nickname}
          onChangeText={(v) => updateField('nickname', v)}
          placeholder="Pseudo (optionnel)"
          placeholderTextColor="#64748b"
        />

        <TextInput
          style={styles.input}
          value={form.birthdate}
          onChangeText={(v) => updateField('birthdate', v)}
          placeholder="Date de naissance (AAAA-MM-JJ) *"
          placeholderTextColor="#64748b"
        />

        <TextInput
          style={styles.input}
          value={form.city}
          onChangeText={(v) => updateField('city', v)}
          placeholder="Ville (optionnel)"
          placeholderTextColor="#64748b"
        />

        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Identifiants</Text>

        <TextInput
          style={styles.input}
          value={form.email}
          onChangeText={(v) => updateField('email', v)}
          placeholder="Email *"
          placeholderTextColor="#64748b"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          value={form.password}
          onChangeText={(v) => updateField('password', v)}
          placeholder="Mot de passe (min. 8 caractères) *"
          placeholderTextColor="#64748b"
          secureTextEntry
        />

        <TextInput
          style={styles.input}
          value={form.confirmPassword}
          onChangeText={(v) => updateField('confirmPassword', v)}
          placeholder="Confirmer le mot de passe *"
          placeholderTextColor="#64748b"
          secureTextEntry
        />

        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Consentements</Text>

        <View style={styles.switchRow}>
          <Switch
            value={form.termsAccepted}
            onValueChange={(v) => updateField('termsAccepted', v)}
            trackColor={{ false: '#334155', true: '#2563eb' }}
            thumbColor={form.termsAccepted ? '#60a5fa' : '#64748b'}
          />
          <Text style={styles.switchLabel}>J'accepte les conditions d'utilisation *</Text>
        </View>

        <View style={styles.switchRow}>
          <Switch
            value={form.privacyPolicyAccepted}
            onValueChange={(v) => updateField('privacyPolicyAccepted', v)}
            trackColor={{ false: '#334155', true: '#2563eb' }}
            thumbColor={form.privacyPolicyAccepted ? '#60a5fa' : '#64748b'}
          />
          <Text style={styles.switchLabel}>J'accepte la politique de confidentialité *</Text>
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Inscription...' : "S'inscrire"}
          </Text>
        </TouchableOpacity>

        {captchaToken && (
          <View style={styles.captchaSuccess}>
            <Text style={styles.captchaSuccessText}>✓ Vérification anti-robot réussie</Text>
          </View>
        )}
      </ScrollView>

      <RecaptchaModal
        visible={showCaptcha}
        onToken={handleCaptchaToken}
        onClose={() => setShowCaptcha(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 48,
  },
  sectionTitle: {
    color: '#60a5fa',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    padding: 14,
    color: '#f1f5f9',
    fontSize: 16,
    marginBottom: 12,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  switchLabel: {
    color: '#e2e8f0',
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
  },
  button: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  captchaSuccess: {
    marginTop: 12,
    alignItems: 'center',
  },
  captchaSuccessText: {
    color: '#34d399',
    fontSize: 13,
  },
});
