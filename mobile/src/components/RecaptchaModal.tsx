import React, { useState, useMemo } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';

interface Props {
  visible: boolean;
  onToken: (token: string) => void;
  onClose: () => void;
}

function generateChallenge() {
  const a = Math.floor(Math.random() * 10) + 1;
  const b = Math.floor(Math.random() * 10) + 1;
  return { question: `${a} + ${b} = ?`, answer: String(a + b) };
}

export function RecaptchaModal({ visible, onToken, onClose }: Props) {
  const challenge = useMemo(() => generateChallenge(), [visible]);
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);

  const handleVerify = () => {
    if (input.trim() === challenge.answer) {
      setInput('');
      setError(false);
      // Generate a pseudo-token (backend skips validation in dev)
      onToken(`mobile-captcha-${Date.now()}`);
    } else {
      setError(true);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Vérification anti-robot</Text>
          <Text style={styles.subtitle}>Résolvez ce calcul pour continuer</Text>

          <View style={styles.challengeBox}>
            <Text style={styles.challengeText}>{challenge.question}</Text>
          </View>

          <TextInput
            style={[styles.input, error && styles.inputError]}
            value={input}
            onChangeText={(v) => { setInput(v); setError(false); }}
            placeholder="Votre réponse"
            placeholderTextColor="#64748b"
            keyboardType="number-pad"
            autoFocus
          />

          {error && <Text style={styles.errorText}>Réponse incorrecte, réessayez</Text>}

          <View style={styles.buttons}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.verifyBtn} onPress={handleVerify}>
              <Text style={styles.verifyText}>Vérifier</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 24,
  },
  container: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  title: {
    color: '#f1f5f9',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 13,
    marginBottom: 20,
  },
  challengeBox: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 40,
    marginBottom: 16,
  },
  challengeText: {
    color: '#60a5fa',
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    padding: 14,
    color: '#f1f5f9',
    fontSize: 18,
    textAlign: 'center',
    width: '100%',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 13,
    marginTop: 8,
  },
  buttons: {
    flexDirection: 'row',
    marginTop: 20,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    padding: 14,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#334155',
    marginRight: 8,
  },
  cancelText: {
    color: '#94a3b8',
    fontSize: 15,
    fontWeight: '600',
  },
  verifyBtn: {
    flex: 1,
    padding: 14,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#2563eb',
    marginLeft: 8,
  },
  verifyText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
});
