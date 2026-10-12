// Maps each protected route prefix to the navigation menu URL that grants access to it.
// A user may open a route only if the required menu item is present in the menu the
// backend returned for them (the menu is already filtered by the user's roles).
// Routes not listed here (e.g. /dashboard) are open to every signed-in user.
const ROUTE_ACCESS = [
    { prefix: '/my-approvals', menuUrl: '/my-approvals' },
    { prefix: '/administration/users', menuUrl: '/administration/users' },
    { prefix: '/administration/createuser', menuUrl: '/administration/users' },
    { prefix: '/administration/edituser', menuUrl: '/administration/users' },
    { prefix: '/administration/roles', menuUrl: '/administration/roles' },
    { prefix: '/administration/createrole', menuUrl: '/administration/roles' },
    { prefix: '/administration/groups', menuUrl: '/administration/groups' },
    { prefix: '/administration/creategroup', menuUrl: '/administration/groups' },
    { prefix: '/administration/editgroup', menuUrl: '/administration/groups' },
    { prefix: '/cmdb/ciclasses', menuUrl: '/cmdb/ciclasses' },
    { prefix: '/cmdb/cirelationships', menuUrl: '/cmdb/cirelationships' },
    { prefix: '/cmdb/cidata', menuUrl: '/cmdb/cidata' },
    { prefix: '/service-catalog', menuUrl: '/service-catalog' },
    { prefix: '/incidents', menuUrl: '/incidents' },
    { prefix: '/requests', menuUrl: '/requests' },
]

function matchesPrefix(pathname, prefix) {
    return pathname === prefix || pathname.startsWith(`${prefix}/`)
}

function collectMenuUrls(items, urls = new Set()) {
    items.forEach((item) => {
        if (item.menuUrl) {
            urls.add(item.menuUrl)
        }
        if (Array.isArray(item.children)) {
            collectMenuUrls(item.children, urls)
        }
    })
    return urls
}

export function isRouteAuthorized(pathname, navItems) {
    const rule = ROUTE_ACCESS.find((entry) => matchesPrefix(pathname, entry.prefix))

    if (!rule) {
        return true
    }

    return collectMenuUrls(navItems).has(rule.menuUrl)
}
