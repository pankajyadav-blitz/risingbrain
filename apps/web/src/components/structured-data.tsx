/**
 * Renders a JSON-LD <script> for Google's structured-data (rich results,
 * sitelinks, knowledge panel). Server component — never ships JS to the client.
 *
 * `<` is escaped to `<` so a `</script>` sequence in any interpolated value
 * (e.g. a user-authored interview title) can't break out of the script tag.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
