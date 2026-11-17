import Ionicons from '@expo/vector-icons/Ionicons';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, s } from '../../theme/tokens';

export function TermsConsent({ accepted, onChange, disabled, onLinkError }: {
  accepted: boolean; onChange: () => void; disabled: boolean; onLinkError: () => void;
}) {
  function open(path: string) {
    void Linking.openURL('https://mylpg.site' + path).catch(onLinkError);
  }

  return <View style={styles.wrapper}>
    <Pressable accessibilityRole="checkbox" accessibilityLabel="Agree to the Terms and Privacy Policy"
      accessibilityState={{ checked: accepted, disabled }} disabled={disabled} onPress={onChange} style={styles.option}>
      <View style={[styles.checkbox, accepted && styles.checked]}>
        {accepted && <Ionicons name="checkmark" size={16} color={colors.white} />}
      </View>
      <Text style={[s.label, s.grow]}>I agree to the Terms and Privacy Policy</Text>
    </Pressable>
    <View style={styles.links}>
      <Text accessibilityRole="link" style={styles.link} onPress={() => open('/terms')}>Terms and Conditions</Text>
      <Text accessibilityRole="link" style={styles.link} onPress={() => open('/privacy')}>Privacy Policy</Text>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  wrapper: { gap: 3 },
  option: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 9 },
  checkbox: { width: 22, height: 22, borderWidth: 1, borderColor: '#9EBBA7', borderRadius: 5, alignItems: 'center', justifyContent: 'center' },
  checked: { backgroundColor: colors.green, borderColor: colors.green },
  links: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginLeft: 31 },
  link: { color: colors.green, textDecorationLine: 'underline', fontWeight: '700', fontSize: 13, paddingVertical: 6 },
});
