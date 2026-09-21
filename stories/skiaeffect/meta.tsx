import type { Meta } from '@storybook/react';
import { SkiaEffect } from '@components/skiaeffect/skiaeffect';
import { widgetDecorator } from '../widget-decorator';
import { skiaEffectArgTypes } from './skiaeffect.args';

export default {
  title: 'UI Widgets/Skia Effect/Appearance',
  component: SkiaEffect,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    ...skiaEffectArgTypes,
  },
  decorators: [widgetDecorator()],
} satisfies Meta<typeof SkiaEffect>;
