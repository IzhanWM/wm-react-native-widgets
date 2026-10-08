import { ServerDrivenView } from '@components/serverdrivenview/serverdrivenview';
import type { ServerDrivenActionEvent, ServerDrivenComponent } from '@components/serverdrivenview';
import type { StoryObj } from '@storybook/react';
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import meta from '../meta';
import { Readout } from '../readout';
import { STORAGE_SEGMENTS, TEAM_MEMBERS } from '../../sample-data';
import { GALLERY_SPEC, NESTED_SPEC, TEAL_THEME, WIDGETS_SPEC } from '../serverdrivenview.specs';

/** The component catalog a spec can draw from, and how to extend it. */
export default { ...meta, title: 'UI Widgets/Server Driven View/Catalog' };
type Story = StoryObj<typeof meta>;

/** One of every built-in layout, content, input and feedback component. */
export const Gallery: Story = {
  args: { spec: GALLERY_SPEC },
};

/** One style-spec JSON re-themes every component: colors, radii, type, part styles. */
export const Themed: Story = {
  args: { spec: GALLERY_SPEC, theme: TEAL_THEME },
  parameters: { source: '<ServerDrivenView spec={spec} theme={Variables.appTheme.dataSet} />' },
};

/** `themeMode` picks a mode; the built-in `dark` mode works with no theme at all. */
export const DarkMode: Story = {
  args: { spec: GALLERY_SPEC, themeMode: 'dark', style: { padding: 16, borderRadius: 12 } },
  parameters: { source: '<ServerDrivenView spec={spec} themeMode="dark" />' },
};

/** The nested tree form: children are elements, and bare strings render as Text. */
export const NestedFormat: Story = {
  args: { spec: NESTED_SPEC },
};

/** AvatarStack, SegmentProgress and QrCode from this library, fed from bound data. */
export const LibraryWidgets: Story = {
  render: (args) => {
    const [event, setEvent] = useState<ServerDrivenActionEvent>();
    return (
      <View>
        <ServerDrivenView {...args} onAction={setEvent} />
        <Readout label="onAction" value={event && { action: event.action, params: event.params }} />
      </View>
    );
  },
  args: {
    spec: WIDGETS_SPEC,
    data: { team: TEAM_MEMBERS, storage: STORAGE_SEGMENTS, shareUrl: 'https://www.wavemaker.com' },
  },
  parameters: { note: 'Tap an avatar: { "$event": "member.name" } reads the widget payload.' },
};

/** A host component added through `components`; specs can then use its type name. */
const Rating: ServerDrivenComponent = ({ props, bindings, emit, theme }) => {
  const value = Number(props.value) || 0;
  return (
    <View style={{ flexDirection: 'row', gap: 4 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Pressable
          key={star}
          accessibilityRole="button"
          accessibilityLabel={`${star} stars`}
          onPress={() => {
            bindings.value?.(star);
            emit('change', star);
          }}
        >
          <Text style={{ fontSize: 28, color: star <= value ? theme.colors.primary : theme.colors.outline }}>★</Text>
        </Pressable>
      ))}
    </View>
  );
};

export const CustomComponent: Story = {
  args: {
    components: { Rating },
    spec: {
      state: { rating: 3 },
      root: {
        type: 'Card',
        props: { title: 'Rate your order' },
        children: [
          { type: 'Rating', props: { value: { $bindState: '/rating' } } },
          { type: 'Text', props: { variant: 'caption', text: { $template: 'You picked ${/rating} of 5' } } },
        ],
      },
    },
  },
  parameters: { source: '<ServerDrivenView spec={spec} components={{ Rating }} />' },
};

/** A type outside the catalog never renders; in development it shows a marker. */
export const UnknownType: Story = {
  args: {
    spec: {
      root: {
        type: 'Column',
        children: [
          { type: 'Text', props: { text: 'Known types render.' } },
          { type: 'WebView', key: 'embed', props: { uri: 'https://example.com' } },
        ],
      },
    },
  },
  parameters: { note: 'The spec asks for a WebView, which is not in the catalog.' },
};
