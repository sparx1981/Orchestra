import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  // Shown in the fallback message, e.g. "Product tab" — lets one component serve every
  // lazy-loaded surface instead of writing near-identical copy at each call site.
  label: string;
}

interface State {
  failed: boolean;
}

/**
 * React.lazy's dynamic import() rejects — not just throws — on two realistic failure modes
 * that a per-component try/catch can't reach: a network blip mid-fetch, and a stale chunk
 * reference after a new deploy (the hashed filename this browser has cached in its own
 * bundle no longer exists on the server). Without an error boundary somewhere above every
 * Suspense boundary, either one white-screens the whole app rather than just the tab that
 * failed to load — there was no boundary anywhere in this app before this component.
 * "Reload" is the correct recovery for both cases: it re-fetches index.html and the current
 * chunk manifest, rather than retrying the same now-stale import() reference in place.
 */
export class LazyLoadErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 py-24 text-center px-6">
          <AlertTriangle className="w-8 h-8 text-amber-500 stroke-[1.5]" />
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Couldn't load the {this.props.label}. This usually means the app was updated since this tab was opened.
          </p>
          <Button size="sm" variant="outline" className="gap-2" onClick={() => window.location.reload()}>
            <RefreshCw className="w-3.5 h-3.5" />
            Reload
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
