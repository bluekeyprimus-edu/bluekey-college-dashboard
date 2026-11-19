self.__MIDDLEWARE_MATCHERS = [
  {
    "regexp": "^(?:\\/(_next\\/data\\/[^/]{1,}))?(?:\\/((?!_next\\/static|_next\\/image|favicon-32\\.png|icon-192\\.png|icon-512\\.png|logo\\.png|apple-touch-icon\\.png|manifest\\.json|sw\\.js|api\\/cron\\/).*))(\\.json|\\.rsc|\\.segments\\/.+\\.segment\\.rsc)?[\\/#\\?]?$",
    "originalSource": "/((?!_next/static|_next/image|favicon-32\\.png|icon-192\\.png|icon-512\\.png|logo\\.png|apple-touch-icon\\.png|manifest\\.json|sw\\.js|api/cron/).*)"
  }
];self.__MIDDLEWARE_MATCHERS_CB && self.__MIDDLEWARE_MATCHERS_CB()