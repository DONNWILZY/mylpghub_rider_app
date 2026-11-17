import type { ReactNode, Ref } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, TextInput, View, type TextInputInstance, type TextInputProps } from 'react-native';
import { colors, s } from '../../theme/tokens';
import type { AppIcon } from '../ActionIcon';

export function Field({ label, hideLabel = false, icon, inputRef, accessory, ...props }: TextInputProps & {
  label: string; hideLabel?: boolean; icon?: AppIcon; inputRef?: Ref<TextInputInstance>; accessory?: ReactNode;
}) {
  return <View style={s.stack}>
    {!hideLabel && <Text style={s.label}>{label}</Text>}
    <View style={fieldStyle.control}>
      {icon && <Ionicons name={icon} size={19} color={colors.green} />}
      <TextInput ref={inputRef} accessibilityLabel={label} placeholderTextColor="#607367"
        {...props} style={fieldStyle.input} />
      {accessory}
    </View>
  </View>;
}

const fieldStyle = StyleSheet.create({
  control: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 13, minHeight: 51,
    borderRadius: 12, backgroundColor: colors.white, borderColor: '#CBDDD0', borderWidth: 1 },
  input: { flex: 1, minHeight: 49, minWidth: 0, paddingVertical: 8, color: colors.ink, fontSize: 16 },
});
