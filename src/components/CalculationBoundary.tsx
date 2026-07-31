import { Component, type ErrorInfo, type ReactNode } from "react";
import MoonCalculationFallback from "@/components/MoonCalculationFallback";

interface Props {
  children: ReactNode;
  /** Label shown in the fallback, e.g. "Today's Moon is unavailable". */
  title?: string;
  /** Extra context for the console log. */
  scope?: string;
}

interface State {
  hasError: boolean;
}

/**
 * Catches render-time failures inside a moon-results section so a bad
 * calculation degrades to an informative message instead of blanking the page.
 */
class CalculationBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[CalculationBoundary${this.props.scope ? `:${this.props.scope}` : ""}]`, error, info.componentStack);
  }

  private reset = () => this.setState({ hasError: false });

  render() {
    if (this.state.hasError) {
      return <MoonCalculationFallback title={this.props.title} onRetry={this.reset} />;
    }
    return this.props.children;
  }
}

export default CalculationBoundary;
