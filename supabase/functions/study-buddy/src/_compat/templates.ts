/**
 * Widget HTML templates for Deno Edge Functions.
 * Replaces Skybridge's Handlebars-based template system with simple string interpolation.
 */

export function renderWidgetHtml(serverUrl: string, widgetName: string): string {
  return `<div id="root"></div>
<script type="module">
  import('${serverUrl}/widgets/${widgetName}.js');
</script>
<link rel="stylesheet" crossorigin href="${serverUrl}/widgets/style.css" />`;
}
