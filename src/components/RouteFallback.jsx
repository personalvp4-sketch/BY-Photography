export default function RouteFallback() {
  return (
    <div className="route-fallback" role="status" aria-live="polite" aria-label="Loading page">
      <span className="route-fallback__spinner" aria-hidden />
    </div>
  );
}
