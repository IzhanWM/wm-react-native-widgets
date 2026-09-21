import { AvatarStack } from '@components/avatarstack/avatarstack';
import type { AvatarSelectEvent } from '@components/avatarstack';
import type { StoryObj } from '@storybook/react';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import meta from '../meta';
import { TEAM_MEMBERS } from '../../sample-data';

export default { ...meta, title: 'UI Widgets/Avatar Stack/Interaction' };
type Story = StoryObj<typeof meta>;

const styles = StyleSheet.create({
  readout: {
    marginTop: 16,
    padding: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(37,99,235,0.08)',
  },
  readoutText: { fontSize: 13, color: '#1E3A8A' },
});

/** Tapping an avatar emits the bound row and its position. */
export const OnMemberSelect: Story = {
  render: (args) => {
    const [selected, setSelected] = useState<AvatarSelectEvent | null>(null);
    return (
      <View>
        <AvatarStack
          {...args}
          onMemberSelect={(event) => setSelected(event)}
        />
        <View style={styles.readout}>
          <Text style={styles.readoutText}>
            {selected == null
              ? 'Tap an avatar.'
              : `Selected ${String(selected.member.name)} at index ${selected.index}.`}
          </Text>
        </View>
      </View>
    );
  },
  args: {
    dataset: TEAM_MEMBERS,
  },
  parameters: {
    note: 'The overflow bubble is deliberately not tappable — it represents no single row.',
  },
};
