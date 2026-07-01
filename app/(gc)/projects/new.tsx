import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, AppBar, Breadcrumb } from '@/components/shell';
import { Btn, Card, Field, Hint, SectionHeader } from '@/components/ui';
import { createProject } from '@/lib/projects';
import { palette } from '@/theme';

export default function NewProject() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [startDate, setStartDate] = useState('');
  const [duration, setDuration] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!name.trim()) {
      Alert.alert('Project name required', 'Enter a name for the project.');
      return;
    }
    setSaving(true);
    try {
      await createProject({ name, address, city, state, startDate: startDate || undefined });
      router.replace('/(gc)/projects');
    } catch (e) {
      Alert.alert('Could not create project', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen portal="gc" scroll={false}>
      <Breadcrumb items={[{ label: 'Projects', onPress: () => router.back() }, { label: 'New Project' }]} />
      <AppBar title="New Project" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={{ flex: 1 }}>
          <Hint>
            <Text style={{ fontWeight: '600', color: palette.tx2 }}>Set up the basics. </Text>
            You can invite your team and subs once the project is created — from the Team tab inside the project.
          </Hint>

          <SectionHeader title="Project Details" />
          <Card>
            <Field label="Project Name" placeholder="e.g. Riverside Office Complex" value={name} onChangeText={setName} />
            <Field label="Address" placeholder="Street address" value={address} onChangeText={setAddress} />
            <View style={styles.row}>
              <Field label="City" placeholder="Phoenix" value={city} onChangeText={setCity} containerStyle={{ flex: 1 }} />
              <Field label="State" placeholder="AZ" value={state} onChangeText={setState} containerStyle={{ flex: 1 }} />
            </View>
          </Card>

          <SectionHeader title="Schedule" />
          <Card>
            <View style={styles.row}>
              <Field label="Start Date" placeholder="2026-06-30" value={startDate} onChangeText={setStartDate} containerStyle={{ flex: 1 }} />
              <Field label="Est. Duration (days)" placeholder="120" keyboardType="number-pad" value={duration} onChangeText={setDuration} containerStyle={{ flex: 1 }} />
            </View>
          </Card>

          <SectionHeader title="Owner Contact (optional)" />
          <Card>
            <Field label="Owner / Company Name" placeholder="Henderson Properties" value={ownerName} onChangeText={setOwnerName} />
            <Field label="Owner Email" placeholder="contact@owner.com" autoCapitalize="none" keyboardType="email-address" value={ownerEmail} onChangeText={setOwnerEmail} />
            <Text style={styles.note}>A magic link invite can be sent later from the Team tab.</Text>
          </Card>

          <View style={styles.actions}>
            <Btn label="Cancel" variant="secondary" onPress={() => router.back()} style={{ paddingHorizontal: 14 }} />
            <Btn label={saving ? 'Creating…' : 'Create Project'} loading={saving} onPress={submit} style={{ flex: 1 }} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
  note: { fontSize: 10.5, color: palette.tx3, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 8, padding: 14, paddingTop: 8 },
});
