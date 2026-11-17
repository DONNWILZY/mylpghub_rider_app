import { Text, View } from 'react-native';
import { s } from '../../theme/tokens';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

export function Notice({ title, message, retry }: { title: string; message: string; retry?: () => void }) {
  return <Card>
    <Text accessibilityRole="header" style={s.subtitle}>{title}</Text>
    <Text style={s.body}>{message}</Text>
    {retry && <View style={s.row}><Button quiet title="Try again" onPress={retry} /></View>}
  </Card>;
}
