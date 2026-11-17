import { useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from './ui/Button';
import { Field } from './ui/Field';
import { colors, s } from '../theme/tokens';

export function OptionPicker<T extends { name: string }>({
  label, placeholder, options, selected, onChange, searchable = true, clearable = true, disabled = false,
}: {
  label: string; placeholder: string; options: readonly T[]; selected?: T | null; onChange: (option: T | null) => void;
  searchable?: boolean; clearable?: boolean; disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const shown = options.filter(option => option.name.toLowerCase().includes(query.trim().toLowerCase()));

  function choose(value: T | null) {
    setOpen(false);
    setQuery('');
    onChange(value);
  }

  return <View style={s.stack}>
    <Text style={s.label}>{label}</Text>
    <Pressable accessibilityRole="button" accessibilityLabel={label + ': ' + (selected?.name ?? placeholder)}
      accessibilityState={{ expanded: open, disabled }} disabled={disabled} onPress={() => setOpen(true)}
      style={[styles.control, disabled && styles.disabled]}>
      <Text style={[s.body, s.grow]}>{selected?.name ?? placeholder}</Text>
      <Ionicons name="chevron-down" size={17} color={colors.green} />
    </Pressable>
    <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.sheet}>
          <View style={s.between}>
            <Text accessibilityRole="header" style={s.title}>{label}</Text>
            <Button title="Close" quiet onPress={() => setOpen(false)} />
          </View>
          {searchable && <Field label={'Search ' + label.toLowerCase()} value={query}
            onChangeText={setQuery} icon="search-outline" />}
          <FlatList
            data={shown}
            keyboardShouldPersistTaps="handled"
            keyExtractor={(option, index) => option.name + ':' + index}
            ListHeaderComponent={clearable && selected ? <PickerOption title={placeholder} onPress={() => choose(null)} /> : undefined}
            ListEmptyComponent={<Text style={s.body}>No matches.</Text>}
            renderItem={({ item }) => <PickerOption title={item.name} onPress={() => choose(item)} />} />
        </View>
      </SafeAreaView>
    </Modal>
  </View>;
}

function PickerOption({ title, onPress }: { title: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={styles.option}>
    <Text style={s.label}>{title}</Text>
  </Pressable>;
}

const styles = StyleSheet.create({
  control: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, minHeight: 49, borderRadius: 12,
    backgroundColor: colors.white, borderColor: '#CBDDD0', borderWidth: 1 },
  disabled: { opacity: 0.5 },
  safe: { flex: 1, backgroundColor: colors.white },
  sheet: { width: '100%', maxWidth: 540, alignSelf: 'center', padding: 18, gap: 14, flex: 1 },
  option: { minHeight: 49, justifyContent: 'center', paddingHorizontal: 8, borderBottomWidth: 1, borderColor: colors.line },
});
