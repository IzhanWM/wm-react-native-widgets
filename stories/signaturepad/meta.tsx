import type { Meta, Decorator } from '@storybook/react';
import React from 'react';
import { View } from 'react-native';
import { SignaturePad } from '@components/signaturepad/signaturepad';
import { widgetDecorator } from '../widget-decorator';
import { signaturePadArgTypes } from './signaturepad.args';

/** The pad fills its parent, so stories need a bounded drawing box. */
const boxDecorator: Decorator = (Story) => (
  <View
    style={{
      width: 420,
      maxWidth: '100%',
      height: 220,
      borderWidth: 1,
      borderColor: '#E5E7EB',
      borderRadius: 8,
      overflow: 'hidden',
    }}
  >
    <Story />
  </View>
);

export default {
  title: 'UI Widgets/Signature Pad/Appearance',
  component: SignaturePad,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    ...signaturePadArgTypes,
  },
  decorators: [boxDecorator, widgetDecorator()],
} satisfies Meta<typeof SignaturePad>;
