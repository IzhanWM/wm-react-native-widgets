import React, { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import QRCodeSvg from 'react-native-qrcode-svg';
import type { QrCodeProps } from './qrcode.props';

export type { QrCodeProps, QrCodeErrorEvent, QrErrorCorrection } from './qrcode.props';

/**
 * QR symbol rendered as vectors through `react-native-svg`, so it stays crisp at
 * any size and runs unchanged on iOS, Android and web.
 */
const QrCodeComponent = ({
  value = 'https://www.wavemaker.com',
  size = 160,
  color = '#000000',
  backgroundColor = '#FFFFFF',
  logoUrl,
  logoSize = 40,
  errorCorrection = 'M',
  onError,
  style,
}: QrCodeProps) => {
  // The encoder throws on an empty string, so fall back to a single space.
  const encoded = String(value ?? '').length > 0 ? String(value) : ' ';

  const handleError = useCallback(
    (error: unknown) => {
      onError?.({ error, value: encoded });
    },
    [onError, encoded]
  );

  return (
    <View style={[styles.root, style]}>
      <QRCodeSvg
        value={encoded}
        size={size}
        color={color}
        backgroundColor={backgroundColor}
        ecl={errorCorrection}
        logo={logoUrl != null && logoUrl !== '' ? { uri: logoUrl } : undefined}
        logoSize={logoSize}
        logoBackgroundColor={backgroundColor}
        onError={handleError}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { alignItems: 'center', justifyContent: 'center' },
});

export const QrCode = Object.assign(QrCodeComponent, {
  displayName: 'QrCode',
});
