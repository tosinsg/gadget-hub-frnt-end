/**
 * A live-connection indicator.
 *
 * Worth showing honestly rather than hiding: if the stream is unavailable the user should
 * know the screen may be a few seconds behind, instead of assuming the numbers are exact.
 */
const LiveBadge = ({ status, lastEventAt }) => {
  const config = {
    live: { dot: "bg-[#3DDC97]", text: "text-[#7FE0AE]", label: "Live" },
    connecting: { dot: "bg-[#F5B14C] animate-pulse", text: "text-[#F5B14C]", label: "Connecting…" },
    polling: { dot: "bg-[#F5B14C]", text: "text-[#F5B14C]", label: "Refreshing periodically" },
    offline: { dot: "bg-[#F07178]", text: "text-[#E0918A]", label: "Offline" },
  }[status] || { dot: "bg-[#4A5455]", text: "text-[#8B9494]", label: "Unknown" };

  return (
    <span className="inline-flex items-center gap-2 text-xs" title={
      status === "live"
        ? "Updates are pushed from the server as they happen."
        : "The live stream isn't available, so this screen refreshes on a timer instead."
    }>
      <span className={`w-2 h-2 rounded-full ${config.dot}`} aria-hidden="true" />
      <span className={config.text}>{config.label}</span>
      {lastEventAt && status === "live" && (
        <span className="text-[#4A5455]">
          · updated {lastEventAt.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </span>
      )}
    </span>
  );
};

export default LiveBadge;
