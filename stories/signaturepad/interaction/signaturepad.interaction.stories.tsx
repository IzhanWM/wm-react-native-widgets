import { SignaturePad } from '@components/signaturepad/signaturepad';
import type {
  SignatureEndEvent,
  SignaturePadHandle,
} from '@components/signaturepad';
import type { StoryObj } from '@storybook/react';
import React, { useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import meta from '../meta';
import { widgetDecorator } from '../../widget-decorator';

// This story lays out its own pad box, so the meta's fixed-height box decorator
// is replaced rather than nested — it would clip the buttons below the pad.
export default {
  ...meta,
  title: 'UI Widgets/Signature Pad/Interaction',
  decorators: [widgetDecorator()],
};
type Story = StoryObj<typeof meta>;

const styles = StyleSheet.create({
  pad: {
    width: 420,
    maxWidth: '100%',
    height: 200,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    overflow: 'hidden',
  },
  row: { flexDirection: 'row', gap: 8, marginTop: 12 },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
    backgroundColor: '#2563EB',
  },
  buttonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  readout: {
    marginTop: 12,
    padding: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(37,99,235,0.08)',
  },
  readoutText: { fontSize: 12, color: '#1E3A8A' },
  preview: {
    marginTop: 12,
    width: 200,
    height: 100,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 6,
  },
});

/**
 * The imperative handle — `clear`, `readSignature` and `isEmpty` — is identical
 * on native and web, and the captured PNG is previewed back below the pad.
 */
export const HandleAndExport: Story = {
  render: () => {
    const padRef = useRef<SignaturePadHandle>(null);
    const [event, setEvent] = useState<SignatureEndEvent | null>(null);

    return (
      <View>
        <View style={styles.pad}>
          <SignaturePad ref={padRef} onSignatureEnd={setEvent} onClear={() => setEvent(null)} />
        </View>

        <View style={styles.row}>
          <Pressable style={styles.button} onPress={() => padRef.current?.clear()}>
            <Text style={styles.buttonText}>Clear</Text>
          </Pressable>
          <Pressable style={styles.button} onPress={() => padRef.current?.readSignature()}>
            <Text style={styles.buttonText}>Read</Text>
          </Pressable>
        </View>

        <View style={styles.readout}>
          <Text style={styles.readoutText}>
            {event == null
              ? 'Draw a stroke; the PNG appears below.'
              : `${event.strokeCount} stroke(s) · ${event.signature.length} chars of base64`}
          </Text>
        </View>

        {event != null && event.signature !== '' && (
          <Image source={{ uri: event.signature }} style={styles.preview} resizeMode="contain" />
        )}
      </View>
    );
  },
  parameters: {
    layout: 'centered',
    note: 'The preview below is the exported PNG rendered back — proof the web fallback honours the same contract as the device canvas.',
  },
};
