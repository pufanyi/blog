export function tableRenderer({ header, rows }) {
  const headerRow = header.map(cell => `<th${cell.align ? ` align="${cell.align}"` : ''}>${cell.text}</th>`).join('');
  const bodyRows = rows.map(row =>
    `<tr>${row.map(cell => `<td${cell.align ? ` align="${cell.align}"` : ''}>${cell.text}</td>`).join('')}</tr>`
  ).join('\n');
  return `<div class="table-wrapper"><table><thead><tr>${headerRow}</tr></thead><tbody>${bodyRows}</tbody></table></div>`;
}
