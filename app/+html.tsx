import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <ScrollViewStyleReset />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              @keyframes fieldlogAutofill {
                from, to {
                  color: #F0F2F5;
                  background: #1A1D22;
                }
              }

              input.fieldlog-input,
              textarea.fieldlog-input {
                color-scheme: dark;
              }

              input.fieldlog-input:-webkit-autofill,
              input.fieldlog-input:-webkit-autofill:hover,
              input.fieldlog-input:-webkit-autofill:focus,
              input.fieldlog-input:-webkit-autofill:active,
              textarea.fieldlog-input:-webkit-autofill,
              textarea.fieldlog-input:-webkit-autofill:hover,
              textarea.fieldlog-input:-webkit-autofill:focus,
              textarea.fieldlog-input:-webkit-autofill:active {
                -webkit-box-shadow: 0 0 0 1000px #1A1D22 inset !important;
                box-shadow: 0 0 0 1000px #1A1D22 inset !important;
                -webkit-text-fill-color: #F0F2F5 !important;
                caret-color: #F0F2F5 !important;
                border: 1px solid #2563EB !important;
                animation-name: fieldlogAutofill;
                animation-fill-mode: both;
                transition: background-color 99999s ease-in-out 0s;
              }

              input:focus,
              textarea:focus {
                outline: none;
              }
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
