import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image as RNImage,
  Pressable as RNPressable,
  ScrollView as RNScrollView,
  StyleSheet,
  Switch as RNSwitch,
  Text as RNText,
  TextInput as RNTextInput,
  View as RNView,
  type DimensionValue,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { AvatarStack } from '../avatarstack/avatarstack';
import { QrCode } from '../qrcode/qrcode';
import { SegmentProgress } from '../segmentprogress/segmentprogress';
import type {
  ServerDrivenComponent,
  ServerDrivenComponentProps,
} from './serverdrivenview.props';

const INK = '#111827';
const MUTED = '#6B7280';
const LINE = '#E5E7EB';

const ALIGN: Record<string, ViewStyle['alignItems']> = {
  start: 'flex-start',
  end: 'flex-end',
  center: 'center',
  stretch: 'stretch',
  baseline: 'baseline',
};

const JUSTIFY: Record<string, ViewStyle['justifyContent']> = {
  start: 'flex-start',
  end: 'flex-end',
  center: 'center',
  between: 'space-between',
  around: 'space-around',
  evenly: 'space-evenly',
};

function num(value: unknown): number | undefined {
  if (value == null || value === '') return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

/** A width/height: a number of pixels, or a percentage string like `'50%'`. */
function dimension(value: unknown): DimensionValue | undefined {
  if (typeof value === 'string' && value.trim().endsWith('%')) return value.trim() as DimensionValue;
  return num(value);
}

function str(value: unknown): string {
  return value == null ? '' : String(value);
}

/**
 * Layout shorthands every container accepts, so a spec rarely needs a raw
 * `style`: `gap`, `padding`, `align`, `justify`, `wrap`, `flex`,
 * `background`, `radius`, `width`, `height`.
 */
function boxStyle(props: Record<string, any>): ViewStyle {
  const style: ViewStyle = {};
  const gap = num(props.gap);
  if (gap != null) style.gap = gap;
  const padding = num(props.padding);
  if (padding != null) style.padding = padding;
  if (props.align != null) style.alignItems = ALIGN[props.align] ?? props.align;
  if (props.justify != null) style.justifyContent = JUSTIFY[props.justify] ?? props.justify;
  if (props.wrap === true) style.flexWrap = 'wrap';
  const flex = num(props.flex);
  if (flex != null) style.flex = flex;
  if (props.background != null) style.backgroundColor = str(props.background);
  const radius = num(props.radius);
  if (radius != null) style.borderRadius = radius;
  const width = dimension(props.width);
  if (width != null) style.width = width;
  const height = dimension(props.height);
  if (height != null) style.height = height;
  return style;
}

/** Wraps `content` in a Pressable when the element declares a press or long-press action. */
function pressable(
  { emit, handles }: ServerDrivenComponentProps,
  style: (ViewStyle | undefined)[],
  content: React.ReactNode,
  label?: string
) {
  if (!handles('press') && !handles('longPress')) return <RNView style={style}>{content}</RNView>;
  return (
    <RNPressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => emit('press')}
      onLongPress={handles('longPress') ? () => emit('longPress') : undefined}
      style={({ pressed }) => [...style, pressed && styles.pressed]}
    >
      {content}
    </RNPressable>
  );
}

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

const View: ServerDrivenComponent = ({ props, children }) => (
  <RNView style={[boxStyle(props), props.style]}>{children}</RNView>
);

const Column: ServerDrivenComponent = ({ props, children }) => (
  <RNView style={[{ gap: 8 }, boxStyle(props), props.style]}>{children}</RNView>
);

const Row: ServerDrivenComponent = ({ props, children }) => (
  <RNView style={[styles.row, boxStyle(props), props.style]}>{children}</RNView>
);

const ScrollView: ServerDrivenComponent = ({ props, children }) => (
  <RNScrollView
    horizontal={props.horizontal === true}
    showsHorizontalScrollIndicator={false}
    style={props.style}
    contentContainerStyle={boxStyle(props)}
  >
    {children}
  </RNScrollView>
);

const Pressable: ServerDrivenComponent = (componentProps) =>
  pressable(
    componentProps,
    [boxStyle(componentProps.props), componentProps.props.style],
    componentProps.children,
    componentProps.props.label
  );

const Card: ServerDrivenComponent = (componentProps) => {
  const { props, children } = componentProps;
  const content = (
    <>
      {props.title != null && <RNText style={styles.cardTitle}>{str(props.title)}</RNText>}
      {props.subtitle != null && <RNText style={styles.cardSubtitle}>{str(props.subtitle)}</RNText>}
      {children}
    </>
  );
  return pressable(componentProps, [styles.card, boxStyle(props), props.style], content, props.title);
};

const Spacer: ServerDrivenComponent = ({ props }) => {
  const size = num(props.size);
  return <RNView style={size != null ? { width: size, height: size } : { flex: num(props.flex) ?? 1 }} />;
};

const Divider: ServerDrivenComponent = ({ props }) => (
  <RNView
    style={[
      styles.divider,
      { backgroundColor: str(props.color) || LINE, marginVertical: num(props.spacing) ?? 4 },
      props.style,
    ]}
  />
);

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------

const TEXT_VARIANTS: Record<string, TextStyle> = {
  heading: { fontSize: 24, fontWeight: '700', color: INK },
  title: { fontSize: 18, fontWeight: '600', color: INK },
  subtitle: { fontSize: 15, fontWeight: '500', color: '#4B5563' },
  body: { fontSize: 15, color: INK },
  caption: { fontSize: 12, color: MUTED },
  label: { fontSize: 13, fontWeight: '600', color: '#374151' },
};

function textStyle(props: Record<string, any>, base: TextStyle): TextStyle {
  const style: TextStyle = { ...base };
  if (props.color != null) style.color = str(props.color);
  const size = num(props.size);
  if (size != null) style.fontSize = size;
  if (props.weight != null) style.fontWeight = str(props.weight) as TextStyle['fontWeight'];
  if (props.bold === true) style.fontWeight = '700';
  if (props.italic === true) style.fontStyle = 'italic';
  if (props.align != null) style.textAlign = str(props.align) as TextStyle['textAlign'];
  return style;
}

const Text: ServerDrivenComponent = ({ props, children }) => (
  <RNText
    numberOfLines={num(props.numberOfLines)}
    style={[textStyle(props, TEXT_VARIANTS[props.variant] ?? TEXT_VARIANTS.body), props.style]}
  >
    {props.text != null ? str(props.text) : children}
  </RNText>
);

const HEADING_SIZES = [28, 22, 18];

const Heading: ServerDrivenComponent = ({ props, children }) => {
  const level = Math.min(Math.max(Math.round(num(props.level) ?? 1), 1), 3);
  return (
    <RNText
      accessibilityRole="header"
      style={[
        textStyle(props, { fontSize: HEADING_SIZES[level - 1], fontWeight: '700', color: INK }),
        props.style,
      ]}
    >
      {props.text != null ? str(props.text) : children}
    </RNText>
  );
};

const Image: ServerDrivenComponent = ({ props }) => {
  const uri = str(props.src ?? props.uri ?? props.url);
  if (uri === '') return null;
  const aspectRatio = num(props.aspectRatio);
  const height = dimension(props.height) ?? (aspectRatio == null ? 160 : undefined);
  return (
    <RNImage
      source={{ uri }}
      accessibilityLabel={props.alt != null ? str(props.alt) : undefined}
      resizeMode={props.resizeMode ?? 'cover'}
      style={[
        { width: dimension(props.width) ?? '100%', height, aspectRatio, borderRadius: num(props.radius) ?? 0 },
        props.style,
      ]}
    />
  );
};

const Badge: ServerDrivenComponent = ({ props, theme }) => (
  <RNView style={[styles.badge, { backgroundColor: str(props.color) || theme.accentColor }, props.style]}>
    <RNText style={[styles.badgeText, { color: str(props.textColor) || '#FFFFFF' }]}>{str(props.text)}</RNText>
  </RNView>
);

const ListItem: ServerDrivenComponent = (componentProps) => {
  const { props } = componentProps;
  const imageUrl = str(props.imageUrl ?? props.image);
  const content = (
    <>
      {imageUrl !== '' && <RNImage source={{ uri: imageUrl }} style={styles.listImage} />}
      <RNView style={styles.listBody}>
        <RNText style={styles.listTitle} numberOfLines={1}>
          {str(props.title)}
        </RNText>
        {props.subtitle != null && (
          <RNText style={styles.listSubtitle} numberOfLines={2}>
            {str(props.subtitle)}
          </RNText>
        )}
      </RNView>
      {props.trailing != null && <RNText style={styles.listTrailing}>{str(props.trailing)}</RNText>}
      {props.chevron === true && <RNText style={styles.chevron}>›</RNText>}
    </>
  );
  return pressable(componentProps, [styles.listItem, props.style], content, str(props.title));
};

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

/**
 * A value an input owns: the bound state when the prop uses `$bindState`,
 * else a local copy seeded from the prop, so an unbound input still types.
 */
function useInputValue<T>(
  { props, bindings, emit }: ServerDrivenComponentProps,
  prop: string,
  fallback: T
): [T, (next: T) => void] {
  const bind = bindings[prop];
  const [local, setLocal] = useState<T>((props[prop] as T) ?? fallback);
  const value = bind != null ? ((props[prop] as T) ?? fallback) : local;
  const set = (next: T) => {
    if (bind != null) bind(next);
    else setLocal(next);
    emit('change', next);
  };
  return [value, set];
}

const BUTTON_VARIANTS = ['primary', 'secondary', 'outline', 'ghost', 'danger'];

const Button: ServerDrivenComponent = ({ props, emit, theme }) => {
  const variant = BUTTON_VARIANTS.includes(props.variant) ? props.variant : 'primary';
  const color = variant === 'danger' ? '#DC2626' : str(props.color) || theme.accentColor;
  const filled = variant === 'primary' || variant === 'danger';
  const disabled = props.disabled === true || props.loading === true;
  const ink = filled ? '#FFFFFF' : variant === 'secondary' ? INK : color;
  return (
    <RNPressable
      accessibilityRole="button"
      accessibilityLabel={str(props.label)}
      aria-disabled={disabled}
      aria-busy={props.loading === true}
      disabled={disabled}
      onPress={() => emit('press')}
      style={({ pressed }) => [
        styles.button,
        filled && { backgroundColor: color },
        variant === 'secondary' && { backgroundColor: LINE },
        variant === 'outline' && { borderWidth: 1, borderColor: color },
        props.fullWidth === true && { alignSelf: 'stretch' },
        (pressed || disabled) && styles.pressed,
        props.style,
      ]}
    >
      {props.loading === true ? (
        <ActivityIndicator size="small" color={ink} />
      ) : (
        <RNText style={[styles.buttonText, { color: ink }]}>{str(props.label)}</RNText>
      )}
    </RNPressable>
  );
};

const TextInput: ServerDrivenComponent = (componentProps) => {
  const { props, emit } = componentProps;
  const [value, setValue] = useInputValue<string>(componentProps, 'value', '');
  return (
    <RNView style={[styles.field, props.style]}>
      {props.label != null && <RNText style={TEXT_VARIANTS.label}>{str(props.label)}</RNText>}
      <RNTextInput
        value={str(value)}
        onChangeText={setValue}
        onSubmitEditing={() => emit('submit', str(value))}
        onFocus={() => emit('focus')}
        onBlur={() => emit('blur')}
        placeholder={props.placeholder != null ? str(props.placeholder) : undefined}
        placeholderTextColor="#9CA3AF"
        secureTextEntry={props.secure === true}
        keyboardType={props.keyboardType}
        autoCapitalize={props.autoCapitalize}
        multiline={props.multiline === true}
        editable={props.disabled !== true}
        maxLength={num(props.maxLength)}
        accessibilityLabel={props.label != null ? str(props.label) : str(props.placeholder)}
        style={[styles.input, props.multiline === true && styles.inputMultiline]}
      />
    </RNView>
  );
};

const Switch: ServerDrivenComponent = (componentProps) => {
  const { props, theme } = componentProps;
  const [value, setValue] = useInputValue<boolean>(componentProps, 'value', false);
  return (
    <RNView style={[styles.row, styles.toggleRow, props.style]}>
      {props.label != null && <RNText style={[TEXT_VARIANTS.body, styles.grow]}>{str(props.label)}</RNText>}
      <RNSwitch
        value={value === true}
        onValueChange={setValue}
        disabled={props.disabled === true}
        trackColor={{ true: theme.accentColor, false: '#D1D5DB' }}
        thumbColor="#FFFFFF"
        accessibilityLabel={props.label != null ? str(props.label) : undefined}
      />
    </RNView>
  );
};

const Checkbox: ServerDrivenComponent = (componentProps) => {
  const { props, theme } = componentProps;
  const [checked, setChecked] = useInputValue<boolean>(componentProps, 'checked', false);
  const on = checked === true;
  return (
    <RNPressable
      accessibilityRole="checkbox"
      aria-checked={on}
      aria-disabled={props.disabled === true}
      accessibilityLabel={props.label != null ? str(props.label) : undefined}
      disabled={props.disabled === true}
      onPress={() => setChecked(!on)}
      style={[styles.row, styles.toggleRow, props.style]}
    >
      <RNView
        style={[styles.checkbox, { borderColor: on ? theme.accentColor : '#9CA3AF' }, on && { backgroundColor: theme.accentColor }]}
      >
        {on && <RNText style={styles.checkmark}>✓</RNText>}
      </RNView>
      {props.label != null && (
        <RNText style={[TEXT_VARIANTS.body, styles.grow, props.strikeWhenChecked === true && on && styles.struck]}>
          {str(props.label)}
        </RNText>
      )}
    </RNPressable>
  );
};

/** A +/− counter clamped to `min`..`max` — shelf counts, restock quantities. */
const Stepper: ServerDrivenComponent = (componentProps) => {
  const { props, theme } = componentProps;
  const [raw, setValue] = useInputValue<number>(componentProps, 'value', 0);
  const min = num(props.min) ?? 0;
  const max = num(props.max) ?? Number.POSITIVE_INFINITY;
  const step = num(props.step) ?? 1;
  const value = num(raw) ?? min;
  const disabled = props.disabled === true;
  const label = props.label != null ? str(props.label) : 'Quantity';
  const nudge = (delta: number) => setValue(Math.min(Math.max(value + delta, min), max));
  const control = (symbol: string, delta: number, name: string) => {
    const off = disabled || (delta < 0 ? value <= min : value >= max);
    return (
      <RNPressable
        accessibilityRole="button"
        accessibilityLabel={`${name} ${label}`}
        aria-disabled={off}
        disabled={off}
        onPress={() => nudge(delta)}
        style={({ pressed }) => [styles.stepperButton, { borderColor: theme.accentColor }, (pressed || off) && styles.pressed]}
      >
        <RNText style={[styles.stepperSymbol, { color: theme.accentColor }]}>{symbol}</RNText>
      </RNPressable>
    );
  };
  return (
    <RNView style={[styles.row, props.style]}>
      {props.label != null && <RNText style={[TEXT_VARIANTS.body, styles.grow]}>{label}</RNText>}
      {control('−', -step, 'Decrease')}
      <RNText style={styles.stepperValue} accessibilityLabel={`${label}: ${value}`}>
        {String(value)}
      </RNText>
      {control('+', step, 'Increase')}
    </RNView>
  );
};

// ---------------------------------------------------------------------------
// Feedback
// ---------------------------------------------------------------------------

const Spinner: ServerDrivenComponent = ({ props, theme }) => (
  <ActivityIndicator size={props.size === 'large' ? 'large' : 'small'} color={str(props.color) || theme.accentColor} />
);

const ProgressBar: ServerDrivenComponent = ({ props, theme }) => {
  const max = num(props.max) ?? 1;
  const fraction = Math.min(Math.max((num(props.value) ?? 0) / (max > 0 ? max : 1), 0), 1);
  const height = num(props.height) ?? 8;
  return (
    <RNView
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(fraction * 100) }}
      style={[{ height, borderRadius: height / 2, backgroundColor: str(props.trackColor) || LINE }, styles.track, props.style]}
    >
      <RNView style={{ width: `${fraction * 100}%`, height, backgroundColor: str(props.color) || theme.accentColor }} />
    </RNView>
  );
};

// ---------------------------------------------------------------------------
// Library widgets — the ones with no optional peer and no gesture root.
// ---------------------------------------------------------------------------

const QrCodeEntry: ServerDrivenComponent = ({ props, emit }) => (
  <QrCode {...props} onError={(event) => emit('error', event)} />
);

const AvatarStackEntry: ServerDrivenComponent = ({ props, emit }) => (
  <AvatarStack {...props} onMemberSelect={(event) => emit('select', event)} />
);

const SegmentProgressEntry: ServerDrivenComponent = ({ props, emit }) => (
  <SegmentProgress {...props} onSegmentSelect={(event) => emit('select', event)} />
);

/**
 * The built-in catalog. A spec can only render these types plus whatever the
 * host adds through the `components` prop.
 */
export const SERVER_DRIVEN_COMPONENTS: Record<string, ServerDrivenComponent> = {
  View,
  Row,
  Column,
  ScrollView,
  Pressable,
  Card,
  Spacer,
  Divider,
  Text,
  Heading,
  Image,
  Badge,
  ListItem,
  Button,
  TextInput,
  Switch,
  Checkbox,
  Stepper,
  Spinner,
  ProgressBar,
  QrCode: QrCodeEntry,
  AvatarStack: AvatarStackEntry,
  SegmentProgress: SegmentProgressEntry,
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  grow: { flex: 1 },
  pressed: { opacity: 0.6 },
  card: {
    padding: 16,
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: LINE,
    backgroundColor: '#FFFFFF',
  },
  cardTitle: { fontSize: 17, fontWeight: '600', color: INK },
  cardSubtitle: { fontSize: 13, color: MUTED, marginTop: -4 },
  divider: { height: StyleSheet.hairlineWidth, alignSelf: 'stretch' },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  listItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  listImage: { width: 40, height: 40, borderRadius: 20, backgroundColor: LINE },
  listBody: { flex: 1, gap: 2 },
  listTitle: { fontSize: 15, fontWeight: '500', color: INK },
  listSubtitle: { fontSize: 13, color: MUTED },
  listTrailing: { fontSize: 14, fontWeight: '600', color: INK },
  chevron: { fontSize: 22, color: '#9CA3AF', marginLeft: -4 },
  button: {
    minHeight: 44,
    paddingHorizontal: 18,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  buttonText: { fontSize: 15, fontWeight: '600' },
  field: { gap: 6 },
  input: {
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    fontSize: 15,
    color: INK,
    backgroundColor: '#FFFFFF',
  },
  inputMultiline: { minHeight: 88, textAlignVertical: 'top' },
  toggleRow: { minHeight: 36 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperSymbol: { fontSize: 18, fontWeight: '600', lineHeight: 20 },
  stepperValue: { minWidth: 32, textAlign: 'center', fontSize: 16, fontWeight: '600', color: INK },
  checkmark: { color: '#FFFFFF', fontSize: 14, fontWeight: '700', lineHeight: 16 },
  struck: { textDecorationLine: 'line-through', color: MUTED },
  track: { overflow: 'hidden', alignSelf: 'stretch' },
});
