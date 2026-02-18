import { Component, inject, computed } from '@angular/core';
import { LanguageService } from '../../../../services/language.service';

const LOCALE_MAP = { en: 'en-US', zh: 'zh-CN', ja: 'ja-JP' } as const;
const PREFIX = { en: 'Last updated: ', zh: '最后更新于：', ja: '最終更新：' } as const;
const BUILD_INFO = {
  en: 'Built with Angular · Source Code:',
  zh: '使用 Angular 构建 · 源代码：',
  ja: 'Angular で構築 · ソースコード：',
} as const;
const SOURCE_REPO = 'https://github.com/pufanyi/personal-page';

@Component({
  selector: 'app-cv-footer',
  templateUrl: './cv-footer.html',
})
export class CvFooterComponent {
  private readonly lang = inject(LanguageService).current;
  readonly sourceRepo = SOURCE_REPO;

  readonly lastUpdated = computed(() => {
    const l = this.lang();
    const date = new Date().toLocaleDateString(LOCALE_MAP[l], { month: 'long', year: 'numeric' });
    return PREFIX[l] + date;
  });

  readonly buildInfo = computed(() => BUILD_INFO[this.lang()]);
}
