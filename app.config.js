module.exports = ({ config }) => {
  const mapsKey = process.env.MYQUICKGAS_ANDROID_MAPS_API_KEY?.trim();
  return {
    ...config,
    plugins: [
      ...(config.plugins ?? []),
      ...(mapsKey ? [['react-native-maps', { androidGoogleMapsApiKey: mapsKey }]] : []),
    ],
    extra: { ...config.extra, riderAndroidMapConfigured: Boolean(mapsKey) },
  };
};
