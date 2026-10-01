import { ServerDrivenView } from '@components/serverdrivenview/serverdrivenview';
import type { ServerDrivenActionEvent, ServerDrivenSpec } from '@components/serverdrivenview';
import type { StoryObj } from '@storybook/react';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import meta from '../meta';
import { Readout } from '../readout';
import { STORE_SECTIONS } from '../store.specs';

/** End-to-end scenarios the widget is built for. */
export default { ...meta, title: 'UI Widgets/Server Driven View/Use Cases' };
type Story = StoryObj<typeof meta>;

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', gap: 6, marginBottom: 6 },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 6, alignItems: 'center', backgroundColor: '#E5E7EB' },
  tabActive: { backgroundColor: '#1F2937' },
  tabText: { fontSize: 12, fontWeight: '600', color: '#1F2937' },
  tabTextActive: { color: '#FFFFFF' },
  hint: { fontSize: 11, color: 'rgba(0,0,0,0.5)', marginBottom: 14 },
  loading: { height: 240, alignItems: 'center', justifyContent: 'center' },
});

/** Stands in for the two service variables: the section's screen, and its aisle data. */
function useSectionScreen(sectionId: string) {
  const [screen, setScreen] = useState<{ spec: ServerDrivenSpec; data: unknown } | null>(null);
  useEffect(() => {
    setScreen(null);
    const timer = setTimeout(() => setScreen(STORE_SECTIONS[sectionId]), 500);
    return () => clearTimeout(timer);
  }, [sectionId]);
  return screen;
}

/**
 * A department store's associate app. The associate's section — Grocery,
 * Electronics or Apparel — decides which screen the backend serves: an expiry
 * sweep, a demo-unit and price-tag check, or a size-run check. One build of
 * the app; each section's workflow changes on the server.
 *
 * Every screen reports work through a custom action (`submitSweep`,
 * `reportIssue`, `requestReplenishment`), which the page turns into a
 * service-variable call.
 */
export const DepartmentStore: Story = {
  render: () => {
    const [sectionId, setSectionId] = useState('grocery');
    const [event, setEvent] = useState<ServerDrivenActionEvent>();
    const screen = useSectionScreen(sectionId);
    return (
      <View>
        <View style={styles.tabs}>
          {Object.entries(STORE_SECTIONS).map(([id, section]) => {
            const active = id === sectionId;
            return (
              <Pressable
                key={id}
                accessibilityRole="tab"
                aria-selected={active}
                onPress={() => {
                  setSectionId(id);
                  setEvent(undefined);
                }}
                style={[styles.tab, active && styles.tabActive]}
              >
                <Text style={[styles.tabText, active && styles.tabTextActive]}>{section.label}</Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={styles.hint}>{"In the app this is the signed-in associate's section, not a tab."}</Text>
        {screen == null ? (
          <View style={styles.loading}>
            <ActivityIndicator />
          </View>
        ) : (
          <ServerDrivenView spec={screen.spec} data={screen.data} onAction={setEvent} />
        )}
        <Readout
          label="onAction → service variable"
          value={event && { action: event.action, params: event.params }}
        />
      </View>
    );
  },
  parameters: {
    source: [
      '<ServerDrivenView',
      '  spec={Variables.sectionScreen.dataSet}   // GET /sections/{section}/screen',
      '  data={Variables.sectionData.dataSet}      // GET /sections/{section}/aisle',
      '  onAction={(event) => {',
      '    // Allow-list: a served spec can only reach the variables named here.',
      "    const variable = { submitSweep: 'postSweep', reportIssue: 'postIssue', requestReplenishment: 'postReplenishment' }[event.action];",
      '    if (variable) Page.Variables[variable].invoke({ inputFields: event.params });',
      '  }}',
      '/>',
    ].join('\n'),
  },
};
