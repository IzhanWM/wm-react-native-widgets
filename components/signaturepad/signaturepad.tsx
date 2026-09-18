import React, { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import SignatureScreen, { SignatureViewRef } from 'react-native-signature-canvas';
import type { SignaturePadHandle, SignaturePadProps } from './signaturepad.props';

export type {
  SignaturePadProps,
  SignaturePadHandle,
  SignatureEndEvent,
} from './signaturepad.props';

/**
 * Native signature surface (iOS and Android).
 *
 * `react-native-signature-canvas` draws into a WebView, which has no
 * `react-native-web` equivalent — so `signaturepad.web.tsx` ships a separate
 * implementation. Both honour the same props, events and `ref` handle; the web
 * one also returns a base64 PNG, so callers never branch on platform.
 */
const SignaturePadComponent = forwardRef<SignaturePadHandle, SignaturePadProps>(
  (
    {
      penColor = '#1D1B20',
      backgroundColor = '#FFFFFF',
      minWidth = 2,
      maxWidth = 4,
      onSignatureEnd,
      onClear,
      style,
    },
    ref
  ) => {
    const sigRef = useRef<SignatureViewRef>(null);
    const strokeCountRef = useRef(0);

    useImperativeHandle(
      ref,
      () => ({
        clear: () => {
          sigRef.current?.clearSignature();
          strokeCountRef.current = 0;
          onClear?.();
        },
        readSignature: () => {
          sigRef.current?.readSignature();
        },
        isEmpty: () => strokeCountRef.current === 0,
      }),
      [onClear]
    );

    // `onOK` only fires in response to a read, so ask for one as each stroke
    // ends. That makes `onSignatureEnd` fire on finger-up, as documented.
    const handleStrokeEnd = useCallback(() => {
      strokeCountRef.current += 1;
      sigRef.current?.readSignature();
    }, []);

    const handleSignature = useCallback(
      (signature: string) => {
        onSignatureEnd?.({ signature, strokeCount: strokeCountRef.current });
      },
      [onSignatureEnd]
    );

    const handleClear = useCallback(() => {
      strokeCountRef.current = 0;
      onClear?.();
    }, [onClear]);

    // The library's built-in footer duplicates controls the host page owns.
    const webStyle = `
      .m-signaturepad--footer { display: none; margin: 0; }
      .m-signaturepad--body { border: none; }
      .m-signaturepad { box-shadow: none; border: none; }
      body, html { background-color: ${backgroundColor}; }
    `;

    return (
      <View style={[styles.root, { backgroundColor }, style]}>
        <SignatureScreen
          ref={sigRef}
          onOK={handleSignature}
          onEnd={handleStrokeEnd}
          onClear={handleClear}
          onEmpty={() => {}}
          penColor={penColor}
          backgroundColor={backgroundColor}
          minWidth={minWidth}
          maxWidth={maxWidth}
          webStyle={webStyle}
          autoClear={false}
          imageType="image/png"
        />
      </View>
    );
  }
);

SignaturePadComponent.displayName = 'SignaturePad';

const styles = StyleSheet.create({
  root: { flex: 1 },
});

export const SignaturePad = SignaturePadComponent;
