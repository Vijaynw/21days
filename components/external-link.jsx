/**
 * External Link Component (JavaScript)
 */

import { Link } from 'expo-router';
import { openBrowserAsync, WebBrowserPresentationStyle } from 'expo-web-browser';

export function ExternalLink(props) {
  const href = props.href;
  const rest = Object.assign({}, props);
  delete rest.href;

  return (
    <Link
      target="_blank"
      {...rest}
      href={href}
      onPress={async function(event) {
        if (process.env.EXPO_OS !== 'web') {
          event.preventDefault();
          await openBrowserAsync(href, {
            presentationStyle: WebBrowserPresentationStyle.AUTOMATIC,
          });
        }
      }}
    />
  );
}
