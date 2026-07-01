import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';


const globalWebCss = `
  input.fl-input,
  textarea.fl-input {
    outline: none !important;
    outline-width: 0 !important;
    box-shadow: none !important;
    border: none !important;
    font-family: 'DM Sans', system-ui, -apple-system, sans-serif;
  }
  input.fl-input:focus,
  input.fl-input:focus-visible,
  textarea.fl-input:focus,
  textarea.fl-input:focus-visible {
    outline: none !important;
    outline-width: 0 !important;
    box-shadow: none !important;
    border: none !important;
  }
  input.fl-input:-webkit-autofill,
  input.fl-input:-webkit-autofill:hover,
  input.fl-input:-webkit-autofill:focus,
  input.fl-input:-webkit-autofill:active,
  textarea.fl-input:-webkit-autofill,
  textarea.fl-input:-webkit-autofill:hover,
  textarea.fl-input:-webkit-autofill:focus,
  textarea.fl-input:-webkit-autofill:active {
    -webkit-box-shadow: 0 0 0 1000px #1A1D22 inset !important;
    box-shadow: 0 0 0 1000px #1A1D22 inset !important;
    -webkit-text-fill-color: #F0F2F5 !important;
    caret-color: #F0F2F5;
    transition: background-color 99999s ease-out 0s;
  }
`;

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: globalWebCss }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
