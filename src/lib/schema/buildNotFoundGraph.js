import { getSiteOrigin, SITE_NAME } from './constants.js';
import { coreOrganization, coreWebSite, webPageEntity, wrapGraph } from './builders.js';

export function buildNotFoundGraph() {
  const origin = getSiteOrigin();
  const orgId = `${origin}/#organization`;

  return wrapGraph([
    coreOrganization(origin),
    coreWebSite(origin, orgId),
    webPageEntity({
      origin,
      path: '/404',
      name: `Page not found | ${SITE_NAME}`,
      description: 'The requested page could not be found.',
      pageId: `${origin}/#not-found`,
    }),
  ]);
}
