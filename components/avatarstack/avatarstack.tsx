import React, { useMemo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { AvatarMember, AvatarStackProps } from './avatarstack.props';
import { rowField, rowKey, toRows } from '../utils/dataset';

export type {
  AvatarStackProps,
  AvatarMember,
  AvatarSelectEvent,
  AvatarStatus,
} from './avatarstack.props';

const STATUS_COLORS: Record<string, string> = {
  online: '#1DB954',
  away: '#F2994A',
  offline: '#9CA3AF',
};

/** Overlapping avatar row with presence dots and a `+N` overflow bubble.
 *  Plain views and negative margins only — no drawing library, so it runs anywhere. */
const AvatarStackComponent = ({
  dataset,
  maxVisible = 4,
  avatarSize = 44,
  overlap = 14,
  borderColor = '#FFFFFF',
  nameField = 'name',
  imageField = 'imageUrl',
  statusField = 'status',
  showStatus = true,
  onMemberSelect,
  style,
}: AvatarStackProps) => {
  const rows = useMemo(() => toRows(dataset) as AvatarMember[], [dataset]);

  const visible = useMemo(
    () => rows.slice(0, Math.max(1, maxVisible)),
    [rows, maxVisible]
  );
  const overflow = rows.length - visible.length;

  const dotSize = Math.max(8, Math.round(avatarSize * 0.28));
  const circle = {
    width: avatarSize,
    height: avatarSize,
    borderRadius: avatarSize / 2,
  };

  return (
    <View style={[styles.root, style]}>
      {visible.map((row, index) => {
        const imageUrl = rowField(row, imageField, 'imageUrl', 'image', 'avatar');
        const name = rowField(row, nameField, 'name', 'title');
        const status = String(rowField(row, statusField, 'status') ?? 'offline');
        const initial = String(name ?? '?').trim().charAt(0).toUpperCase() || '?';

        return (
          <Pressable
            key={rowKey(row, index)}
            accessibilityRole="button"
            accessibilityLabel={name != null ? String(name) : `Member ${index + 1}`}
            onPress={() => onMemberSelect?.({ member: row, index })}
            style={[
              circle,
              styles.avatar,
              { marginLeft: index === 0 ? 0 : -overlap, borderColor, zIndex: index },
            ]}
          >
            {imageUrl != null && imageUrl !== '' ? (
              <Image source={{ uri: String(imageUrl) }} style={circle} resizeMode="cover" />
            ) : (
              <View style={[circle, styles.initialsHolder]}>
                <Text style={[styles.initials, { fontSize: Math.round(avatarSize * 0.34) }]}>
                  {initial}
                </Text>
              </View>
            )}

            {showStatus && (
              <View
                style={[
                  styles.dot,
                  {
                    width: dotSize,
                    height: dotSize,
                    borderRadius: dotSize / 2,
                    borderColor,
                    backgroundColor: STATUS_COLORS[status] ?? STATUS_COLORS.offline,
                  },
                ]}
              />
            )}
          </Pressable>
        );
      })}

      {overflow > 0 && (
        <View
          style={[
            circle,
            styles.avatar,
            styles.overflow,
            { marginLeft: -overlap, borderColor, zIndex: visible.length },
          ]}
        >
          <Text style={[styles.overflowText, { fontSize: Math.round(avatarSize * 0.3) }]}>
            {`+${overflow}`}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flexDirection: 'row', alignItems: 'center' },
  avatar: { borderWidth: 2, overflow: 'visible', backgroundColor: '#E5E7EB' },
  initialsHolder: { alignItems: 'center', justifyContent: 'center' },
  initials: { fontWeight: '600', color: '#374151' },
  dot: { position: 'absolute', right: -1, bottom: -1, borderWidth: 2 },
  overflow: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#374151' },
  overflowText: { color: '#FFFFFF', fontWeight: '700' },
});

export const AvatarStack = Object.assign(AvatarStackComponent, {
  displayName: 'AvatarStack',
});
