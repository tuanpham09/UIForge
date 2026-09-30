import type { UICommand, UIDocument } from "@uiforge/ui-schema";
import { applyCommand } from "@uiforge/ui-schema";

export class CommandHistory {
  private readonly past: UIDocument[] = [];
  private readonly future: UIDocument[] = [];

  constructor(private current: UIDocument) {}

  get document(): UIDocument { return this.current; }

  apply(command: UICommand): UIDocument {
    this.past.push(this.current);
    this.current = applyCommand(this.current, command);
    this.future.length = 0;
    return this.current;
  }

  undo(): UIDocument {
    const previous = this.past.pop();
    if (!previous) return this.current;
    this.future.push(this.current);
    this.current = previous;
    return this.current;
  }

  redo(): UIDocument {
    const next = this.future.pop();
    if (!next) return this.current;
    this.past.push(this.current);
    this.current = next;
    return this.current;
  }

  canUndo(): boolean { return this.past.length > 0; }
  canRedo(): boolean { return this.future.length > 0; }
}
