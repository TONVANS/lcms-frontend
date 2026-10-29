import { gcService } from '@/features/gc';
import { legalCasesService, legalDocumentsService } from '@/features/legal';
import { ppaService } from '@/features/ppa';
import type { User } from '@/types/domain';
import {
  buildGcCard,
  buildLegalCard,
  buildPpaCard,
  buildUpcoming,
  selectHomeSources,
} from '../lib/build-home-view';
import type { HomeData } from '../types';

const SKIPPED = Promise.resolve(null);
const ok = <T>(r: PromiseSettledResult<T | null>): T | null =>
  r.status === 'fulfilled' ? r.value : null;

export const homeService = {
  /** Loads every dashboard the user may read in parallel; one failure never blocks the rest. */
  async load(user: User): Promise<HomeData> {
    const src = selectHomeSources(user);
    const [gcDash, gcList, ppa, docs, cases] = await Promise.allSettled([
      src.gc ? gcService.dashboard() : SKIPPED,
      src.gc ? gcService.list({ status: 'EXPIRING_SOON', page: 1, pageSize: 10 }) : SKIPPED,
      src.ppa ? ppaService.dashboard() : SKIPPED,
      src.legalDocs ? legalDocumentsService.dashboard() : SKIPPED,
      src.legalCases ? legalCasesService.dashboard() : SKIPPED,
    ]);

    const modules: HomeData['modules'] = {};
    if (src.ppa) {
      const d = ok(ppa);
      modules.ppa = d ? { ok: true, card: buildPpaCard(d) } : { ok: false };
    }
    if (src.gc) {
      const d = ok(gcDash);
      modules.gc = d ? { ok: true, card: buildGcCard(d) } : { ok: false };
    }
    if (src.legalDocs || src.legalCases) {
      const d = ok(docs);
      const c = ok(cases);
      modules.legal =
        d || c
          ? { ok: true, card: buildLegalCard({ docs: d ?? undefined, cases: c ?? undefined }) }
          : { ok: false };
    }

    const list = ok(gcList);
    const ppaDash = ok(ppa);
    const upcoming = buildUpcoming(list?.items ?? [], ppaDash?.expiringSoon ?? []);
    const upcomingFailed = (src.gc && !list) || (src.ppa && !ppaDash);
    return { modules, upcoming, upcomingFailed };
  },
};
