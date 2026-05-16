export type BrandingSettings = {
  appDisplayName: string
  signalFooter: string
  logoUrl: string
  brandColor: string
}

export type ThemeSettings = {
  mode: 'dark' | 'light'
  accentColor: 'gold' | 'green' | 'blue'
}

export type LocalSettings = {
  branding: BrandingSettings
  theme: ThemeSettings
}
