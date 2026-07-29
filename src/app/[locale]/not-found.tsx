// NOT a generateStaticParams page — next-intl handles not-found differently
// The locale layout's hasLocale check routes to this when locale is invalid

import { NotFound } from '@/components/pages/NotFound';

export default async function Page() {
  return <NotFound />;
}