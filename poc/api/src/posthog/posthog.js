const { PostHog } = require('posthog-node');

const posthogClient = new PostHog(
  'phc_IUHpcAFiCLEWS1ccbpZuGbiTUaKOonvcXyI0VwfrIlk',
  { host: 'https://eu.i.posthog.com' }
);

module.exports = { posthogClient }; 