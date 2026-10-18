const versions = [
  { title: '上一次提交', opening: '原来的开头', changed: false },
  { title: '这一次提交', opening: '开头补上解释', changed: true },
] as const;

function ArticleVersionsFigure() {
  return (
    <figure className="vcs-figure">
      <div className="vcs-versions">
        {versions.map(({ title, opening, changed }, index) => (
          <svg
            key={title}
            viewBox="0 0 300 250"
            width="300"
            height="250"
            role="img"
            aria-labelledby={`vcs-version-${index}-title vcs-version-${index}-desc`}
          >
            <title id={`vcs-version-${index}-title`}>{`${title}中的 article.md`}</title>
            <desc id={`vcs-version-${index}-desc`}>
              {`${opening}，后面的正文没有修改。可以分别查看两次提交中的完整文章。`}
            </desc>
            <text x="150" y="28" textAnchor="middle" className="vcs-heading">
              {title}
            </text>
            <rect x="25" y="44" width="250" height="190" rx="8" className="vcs-page" />
            <text x="45" y="72" className="vcs-filename">
              article.md
            </text>
            <rect
              x="40"
              y="88"
              width="220"
              height="46"
              rx="4"
              className={changed ? 'vcs-opening vcs-changed' : 'vcs-opening'}
            />
            <text x="150" y="117" textAnchor="middle">
              {opening}
            </text>
            <path d="M45 158H255M45 178H255M45 198H205" className="vcs-lines" />
          </svg>
        ))}
      </div>
      <figcaption>
        改动集中在开头，但两次提交都能让我们查看当时的整篇文章。图中展示的是可恢复的内容，并不表示磁盘上存了两份完整副本。
      </figcaption>
    </figure>
  );
}

export const POST_COMPONENTS = { ArticleVersionsFigure };
