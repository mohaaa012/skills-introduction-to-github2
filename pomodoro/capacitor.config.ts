import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.mohaaa012.hearth',
  appName: 'Hearth',
  webDir: 'dist',
  // Clay cream behind the WebView, so there is never a white flash
  backgroundColor: '#F7F4EF',
  plugins: {
    SystemBars: {
      // Dark status-bar icons on the light clay background
      style: 'LIGHT',
    },
  },
}

export default config
