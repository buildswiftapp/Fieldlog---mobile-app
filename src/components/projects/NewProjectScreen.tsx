import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Field } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { createProject } from '@/lib/projects';
import { palette, roleThemes } from '@/theme';

export function NewProjectScreen() {
  const { organization } = useAuth();
  const router = useRouter();
  const theme = roleThemes.gc;
  const accent = organization?.brand_color ?? theme.accent;

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit() {
    if (!name.trim()) {
      setError('Enter a project name.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await createProject({ name, address, city, state });
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create the project.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.intro}>
            <Text style={styles.title}>New Project</Text>
            <Text style={styles.subtitle}>Add a job site. You can assign subcontractors next.</Text>
          </View>

          <Field label="Project name" placeholder="Mesa Retail Center" value={name} onChangeText={setName} />
          <Field label="Address" placeholder="1200 W Main St" value={address} onChangeText={setAddress} />
          <View style={styles.cityRow}>
            <View style={{ flex: 2 }}>
              <Field label="City" placeholder="Phoenix" value={city} onChangeText={setCity} />
            </View>
            <View style={{ flex: 1 }}>
              <Field label="State" placeholder="AZ" value={state} onChangeText={setState} autoCapitalize="characters" />
            </View>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button
            label={loading ? 'Creating…' : 'Create Project'}
            onPress={onSubmit}
            loading={loading}
            accent={accent}
            onAccent={theme.onAccent}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  scroll: { padding: 18, paddingTop: 10 },
  intro: { marginBottom: 14 },
  title: { fontSize: 19, fontWeight: '700', color: palette.tx },
  subtitle: { fontSize: 12.5, color: palette.tx2, marginTop: 4, lineHeight: 18 },
  cityRow: { flexDirection: 'row', gap: 10 },
  error: { color: palette.red, fontSize: 12.5, marginBottom: 12 },
});
