/**
 * Server component for rendering JSON-LD structured data.
 * Content is always generated from our own controlled schema functions,
 * never from user input. JSON.stringify handles escaping automatically.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // Safe: data is from controlled schema functions, not user input.
      // JSON.stringify provides proper escaping for script tag context.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
