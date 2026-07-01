import { createElement } from 'react';
import { Platform } from 'react-native';

export function WebAutofillTrap() {
  if (Platform.OS !== 'web') return null;

  const hidden = {
    position: 'absolute' as const,
    opacity: 0,
    height: 0,
    width: 0,
    pointerEvents: 'none' as const,
    left: -9999,
  };

  return createElement(
    'div',
    { style: { position: 'relative', height: 0, overflow: 'hidden', width: 0 }, 'aria-hidden': true },
    createElement('input', { type: 'text', tabIndex: -1, autoComplete: 'username', style: hidden }),
    createElement('input', { type: 'password', tabIndex: -1, autoComplete: 'current-password', style: hidden }),
  );
}
