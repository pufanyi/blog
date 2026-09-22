# Media compression course integration — 2026-09-22

## Scope

Expanded `content/posts/ml/notes/media-compression/index.mdx` from an overview
into a tutorial that explains the compression material formerly mentioned in
its closing reading list. Existing headings and seven build-time figures remain;
new worked examples use static prose, tables, equations, and disclosures.
One existing figure caption now uses component-compatible TeX delimiters;
its dollar delimiters previously appeared as literal text in browser screenshots.
No new client code, image assets, dependencies, or application contracts were added.

The checkout was clean at baseline `9b66368`. Content, editorial, development,
and bibliography guidance were reviewed. Their authoring and validation
contracts remain unchanged, so no public handbook changes were needed.

## Sources and coverage

The official [EE398A course page](https://web.stanford.edu/class/ee398a/)
identifies Winter 2011–2012. The official handouts directory still publishes
that edition. Searches found newer general Stanford compression introductions,
but no newer public edition of these focused EE398A lectures. The article
identifies the edition actually read, rather than assigning a current date.

All fourteen relevant lecture PDFs in the official
[handouts collection](https://web.stanford.edu/class/ee398a/handouts.htm) were
consulted, with diagrams/tables rendered for visual inspection where necessary:

| Lecture | Pages used most directly | Article integration |
| --- | --- | --- |
| Entropy and Lossless Coding | 7–13, 18–29 | Prefix/Huffman coding, coding overhead, Rice integer example |
| Exploiting Statistical Dependence | 9–17, 19–24 | Conditional entropy, Markov example, cross entropy, run lengths |
| Arithmetic Coding | 2–13 | Interval refinement and finite-precision implementation |
| Rate-Distortion Theory | 3–12 | Operational rate tradeoff, Gaussian bound and reverse water-filling |
| Quantization | 1–4, 9, 14–16, 21–30 | Quantizer error, Lloyd–Max, entropy constraints, VQ |
| Predictive Coding | 16–19 | Closed-loop residual error cancellation |
| Transform Coding | 4–20 | Energy/error conservation, covariance, KLT, DCT normalization |
| JPEG Standard | 2–13 | DC difference, exact AC RUN/SIZE/value-bit worked example |
| Subband and Wavelet Coding | 2–18, 24–36 | Two-level Haar, reconstruction, integer lifting, zerotrees |
| JPEG-2000 | 1–11 | Reversible/irreversible paths, bitplanes, coding passes, truncation |
| Interframe Coding | 4–8, 12–21 | Change prediction, motion and hybrid coding |
| Motion Estimation | 4–8, 14–28 | SAD search, early termination, fractional-pel interpolation |
| Motion-Compensated Coding | 4–7, 11–24 | Displacement error, reference filtering, multiple hypotheses |
| 3D Video Coding | 7–11, 16–29 | Disparity/depth derivation and synthesized-view distortion |

MIT's current catalog and 2026 schedule establish newer HST.723 offerings,
but the publicly available specialized audio-coding material found is the
Spring 2005 OCW edition. The actual 40-slide
[perceptual encoding lab deck](https://ocw.mit.edu/courses/hst-723j-neural-coding-and-perception-of-sound-spring-2005/resources/fmntlprcptlaudio/)
credits **Craig Lewiston**, dated February 25, 2005, with instructor Bertrand
Delgutte; the bibliography corrects the old generic authorship and title.
Slides 14, 16–28, and 33–38 support the noise/masking/allocation discussion.
Oxenham's separate *Frequency Selectivity and Masking* lecture, especially
slides 4–6, 10, and 15–16, supplies the critical-band experiment.
Figures removed for copyright in the original deck were not reconstructed.

Xiph sources read include *Digital Show & Tell* and its transcript, the 2010
CELT demonstration, and the 2018 AV1 CfL and CDEF demonstrations. Supplemental
primary sources include the Opus RFC, Aalto's MDCT/windowing chapters, the Speex
CELP manual, and original EBCOT, EZW, CfL, and CDEF papers. Course PDFs and
individual source pages are cited beside the relevant material. AV2's official
page was checked: v1.0.0 is dated May 28, 2026.

Examples are independently constructed teaching calculations, not empirical
codec benchmarks or copied lecture figures. They include Huffman code lengths,
arithmetic intervals, a persistent binary Markov source, two-sample covariance,
quantization and bit allocation, JPEG categories, Haar/lifting, masking budgets,
energy/shape coding, packet overhead, motion search counts, and partition costs.

## Corrections and consistency

- Complete Fourier coefficients retain temporal information; the issue is
  localization, quantization spread, and real-time delay.
- Intra pictures and random-access refresh boundaries are distinguished;
  B pictures are not restricted to literal past/future references.
- DCT scale factors and DC normalization are explicit.
- Gaussian/high-rate assumptions are stated; decorrelation is not generally
  independence, and theoretical rates are not single-symbol fixed code lengths.
- Losses consistently use `D + lambda R`; the alternative paper convention
  is explained rather than silently reversing the multiplier's meaning.
- Subband downsampling with complementary branches is distinguished from
  discarding chroma detail. JPEG2000 code-blocks differ from pixel-domain DCT blocks.
- Side information remains part of the rate in every modality and the hyperprior.

## Validation

Validation used Node 24.18.1 and pnpm 12.3.4 in the initially clean checkout.
Research agents wrote only separate ignored drafts; lifecycle commands ran
sequentially in the primary checkout.

- `pnpm format:bib` completed; only this article's bibliography changed.
- `pnpm check` passed after the final caption formatting change.
- `pnpm test --watch=false` passed: 89 content tests and 200 application tests.
- `pnpm build` passed, prerendering 167 routes and preparing deployment output.
- Independent calculations checked the original Huffman, arithmetic interval,
  Markov, Gaussian allocation, motion search/partition, masking, and packet
  overhead examples. Image and audio examples received separate agent review.
- Generated Markdown retains the added sections, disclosures, formulas,
  numerical examples, figure explanations, and bibliography.
- The served production route `/blog/ml/notes/media-compression` was checked in
  Chromium 151.0.7922.34 and WebKit 26.5, at 1280 and 390 CSS pixels, in light
  and dark themes. All disclosures were opened and section headings traversed.
  Each browser/width combination contained 383 rendered math containers,
  53 bibliography entries, seven figures, and eleven disclosures, with no
  MathJax error nodes, undefined TeX, raw dollar-delimited caption formulas,
  missing local citation targets, empty SVG titles, page exceptions, or
  document-level horizontal overflow. Representative screenshots were inspected.
- Ordinary reading loaded no browser MathJax engine or math worker; formulas
  remained build-rendered. Navigation/font readiness and heading traversal
  were timed separately in the local smoke script. These host-specific values
  are retained in the JSON evidence, not treated as a performance benchmark or
  a test of browser-engine startup on raw-TeX Angular views.

The first visual pass revealed the old caption delimiter issue; after fixing
it, all required checks, tests, build, and browser checks were rerun. The host
used its existing temporary browser libraries/CJK font configuration and
matching Ubuntu 22.04 WebKit override; no host workaround was committed.
This was a focused production-page check, not a run of the entire E2E suite.

Temporary downloads, drafts, calculations, logs, and browser captures are under
ignored `tmp/media-compression/`. Nothing was pushed or deployed.
