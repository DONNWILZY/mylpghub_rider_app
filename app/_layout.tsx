import { Root } from '../src/account';

export default function Layout() {
  return <Root apiUrl={process.env.EXPO_PUBLIC_API_URL} />;
}
