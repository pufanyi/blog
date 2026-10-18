# Version Control: lecture-note outline

Status: replanned and structurally applied on 2026-10-18. The article now opens
with the Git data model, places staging in operations and compression in storage,
and uses the nine-section outline below. Advanced operations and other unfinished
sections are explicitly marked as pending. Existing experiments and four figures
are retained; further expansion still follows this plan.

Article: `content/posts/cs/notes/version-control-design/index.mdx`.

## Audience and form

One long article for readers who routinely use Git but have not studied its
design. Introduce jj's concepts and essential operations explicitly. Assume no
prior knowledge of other systems. Use direct, descriptive headings and explain
concepts in dependency order. Do not open with a story, a familiar command
sequence, or a series of questions about why version control matters.

Use definitions, relationships, concrete state diagrams, and small verified
experiments. Commands observe or manipulate an already explained model. Keep
mechanisms and tradeoffs in prose; this outline is not the final prose format.
Do not force one example through all subjects: a tiny directory is sufficient
for objects, independent edits for merges, and controlled datasets for scale.

The requested coverage remains code history, many small files, very large files,
client/server responsibilities, and multiple agents. Alternative systems belong
beside their design choices, not in an upgrade ranking from Git to jj.

## Planned article structure

| Section | Contents and boundaries | Figures and experiments |
| --- | --- | --- |
| 1. Git 的数据模型 | File contents and directory entries; blob and tree; a root tree as a snapshot; commit metadata and parents; sequential, branching, and merging history; immutable objects and content addressing; mutable branch references and HEAD. Explain the complete logical model before physical compression. | Directory-to-object mapping; a commit DAG with explicit parent arrows; reference pointers. Use `cat-file`, `ls-tree`, and `show` after the model is established. |
| 2. Git 的操作与状态变化 | Working directory, index, and committed state; add and commit; diff endpoints; branch and switch; three-way merge; rebase and amend; restore, reset, revert, and reflog recovery. Distinguish object creation, reference movement, and file changes. Explain semantic incompatibility separately from textual conflicts. | Before/after state diagrams using the same commit names; common ancestor and two edits; staging a finished change while leaving an experiment uncommitted. |
| 3. 仓库同步与协作 | Local and remote object stores and references; clone, fetch, push and remote-tracking references; Git hosting, PRs, permissions and checks. Explain the client/server split for these operations. Compare Fossil's integrated collaboration and migration/backup boundaries here. | Two repositories before/after synchronization; distinguish object transfer from reference updates and review decisions. |
| 4. 其他版本模型 | SVN global revisions, working copies, mixed revisions and directory-based branches; Perforce depot/workspace mappings, changelists, shelving and file locks; Mercurial changesets, manifests and file history; Darcs and Pijul patch dependencies, composition and conflict representation. Treat each system's actual semantics separately. | A small version represented in each model; independent and dependent patches in different orders; file locking versus cross-file consistency. |
| 5. 工作区与历史整理 | jj working-copy commits, change IDs, commit IDs, bookmarks, conflicts and operation log; Mercurial evolution and Sapling stacks/recovery; GitButler parallel work and Graphite stacked PRs. Separate version identity, task identity, review dependencies and tool metadata. | A short jj session with explicit before/after states; editing an earlier change and updating descendants; undoing an operation. Cover Git compatibility and exit/migration boundaries. |
| 6. 文件存储与规模 | Git object reuse, loose objects, packfiles and delta; many-small-file costs such as traversal, stat, indexing, request count and materialization; shallow/partial clones, sparse checkout and their different limits; large-file pointers, external storage, whole-file and chunk deduplication; code/data version consistency and retention. | Shared-object graph; conceptual delta reconstruction; same total bytes with different file counts; one large file with insertion/local edits/re-encoding; code/data recovery experiments. |
| 7. 客户端与服务端架构 | Placement of storage, queries, diff/merge, validation and workspace materialization. Study publicly documented Piper/CitC, Mononoke/EdenFS and Scion architectures. Compare caches, on-demand access, permissions, availability and operational costs. | Trace checkout, history lookup and submission across client, cache and authoritative storage. Distinguish public architecture evidence from installable product capabilities. |
| 8. 多 Agent 协作 | Task base version, workspace provisioning, execution and delivery; shared directories, worktrees and isolated runtimes; shared dependencies/caches/processes; result integration and validation against an exact combined version; concurrent main updates; retries, duplicate delivery, interruption and cleanup. | Two isolated tasks and an integration point; individually passing changes whose combination fails; task lifecycle and ownership of persistent state. |
| 9. 设计对照与适用场景 | Compare mechanisms, constraints and costs across ordinary code repositories, data-heavy projects and agent workloads. Summarize conclusions actually established by earlier sections. | A compact comparison table; no new mechanism or universal winner introduced here. |

Section 6 must explicitly cover Git LFS, git-annex, DVC, Xet, Oxen and lakeFS.
Compare pointers, content identity, data placement, chunking, dataset versions,
retention and recovery as applicable; verify each tool's actual behavior before
writing. Discuss Mercurial revlog storage here after introducing its logical
model in section 4. Preserve the distinction between version records and backups.

## Migration of current material

| Current material | Planned treatment |
| --- | --- |
| 从一次熟悉的修改开始 | Remove the narrative opening during the rewrite. Begin with a short statement of the data model's scope. |
| 一次提交究竟记录了什么 | Split into model (1), staging/operations (2), and storage (6). Retain verified object IDs and the reproducible experiment. Remove repeated motivation and conversational transitions. |
| SnapshotObjectsFigure | Retain for model/object sharing after introducing its nodes. Add a simpler directory mapping and history graph before this combined view if needed. |
| ReadVersionFigure | Place beside read-only object inspection in section 1. |
| StagingSelectionFigure | Place in section 2 after introducing index and working-directory state. |
| DeltaStorageFigure | Move to section 6; preserve its explicit distinction between conceptual reconstruction and actual pack encoding. |
| 版本控制有哪些不同的设计方向 | Replace the early tool catalogue with the final design comparison. The coverage inventory remains in this plan. |
| Existing SVN, Perforce, patch, workflow, file, server and agent outlines | Reorganize into sections 3–8 using the table above; preserve all requested systems and technical boundaries. |
| References | Preserve existing sources; add verified sources at the mechanism they support. Keep optional course links separate from explanatory prose. |

## Writing and validation order

1. Rewrite sections 1–2 together so model, history and operations have a consistent
   set of examples. Establish the conceptual diagrams before command output.
2. Explain synchronization, then compare alternative models and workflows.
3. Develop file scale and physical storage before server architecture and agents.
4. Finish with the comparison table and consolidate references.

Use the 2026 [Missing Semester version-control lecture](https://missing.csail.mit.edu/2026/version-control/)
as an organization reference already read during this conversation, alongside
official documentation for factual claims. Do not copy its prose or reproduce
its pedagogical simplifications as format guarantees. Record software versions
for new experiments and evidence dates for internal architectures.

Existing experiment output and prior tests validate the earlier draft only.
Each rewritten section requires content generation and appropriate checks;
changed diagrams require served-page review at narrow/desktop widths and in both
themes. Keep authored sources, exported Markdown and accessible figure text
consistent.
